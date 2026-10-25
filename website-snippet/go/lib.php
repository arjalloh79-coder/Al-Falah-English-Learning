<?php
declare(strict_types=1);
// Shared code for the QR scan counter (go/index.php counts, go/stats.php shows). No names, phone numbers or IP addresses are stored.

function go_cfg(): array {
    static $c = null;
    if ($c !== null) return $c;
    $f = __DIR__ . '/config.php';
    $u = is_file($f) ? (require $f) : [];
    return $c = (is_array($u) ? $u : []) + [
        'DEST' => 'https://english.al-falahmarketing.com/',   // where every code sends the visitor (you can change it any time)
        'BASE' => 'https://al-falahmarketing.com',            // your website address (used to build the QR links)
        'STATS_TOKEN' => '',                                   // secret word to open stats.php (empty = stats page switched off)
        'TIMEZONE' => 'Africa/Conakry',
        'DATA_DIR' => '',                                      // optional folder outside public_html
        'MAX_CODES' => 300,
    ];
}
date_default_timezone_set((string) go_cfg()['TIMEZONE']);

function go_db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = go_cfg();
    $dir = $c['DATA_DIR'] !== '' ? rtrim($c['DATA_DIR'], '/\\') : __DIR__ . '/data';
    if (!is_dir($dir)) @mkdir($dir, 0750, true);
    if ($c['DATA_DIR'] === '' && !is_file($dir . '/.htaccess')) @file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n");
    $nf = $dir . '/.dbname';
    $n = is_file($nf) ? trim((string) file_get_contents($nf)) : '';
    if (!preg_match('/^[a-f0-9]{16}$/', $n)) { $n = bin2hex(random_bytes(8)); @file_put_contents($nf, $n, LOCK_EX); }
    $sf = $dir . '/.salt';
    $salt = is_file($sf) ? trim((string) file_get_contents($sf)) : '';
    if (strlen($salt) < 32) { $salt = bin2hex(random_bytes(16)); @file_put_contents($sf, $salt, LOCK_EX); }
    $GLOBALS['go_salt'] = $salt;
    $pdo = new PDO('sqlite:' . $dir . '/go-' . $n . '.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    $pdo->exec('CREATE TABLE IF NOT EXISTS scans(code TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL, last INTEGER NOT NULL, PRIMARY KEY(code, day));
                CREATE TABLE IF NOT EXISTS seen(h TEXT PRIMARY KEY, ts INTEGER NOT NULL);
                CREATE TABLE IF NOT EXISTS fails(k TEXT PRIMARY KEY, n INTEGER NOT NULL, until INTEGER NOT NULL);');
    return $pdo;
}

function go_ip(): string {
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '';
    if ($ip === '' && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) $ip = trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

function go_code_ok(string $c): bool { return preg_match('/^[a-z0-9][a-z0-9-]{1,29}$/', $c) === 1; }

// Link previews, search robots and prefetchers must not count as scans.
function go_should_count(): bool {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') return false;
    $ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
    if ($ua === '' || preg_match('/bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|curl|wget|python|java\/|headless|lighthouse|monitor|uptime/i', $ua)) return false;
    $p = strtolower((string) ($_SERVER['HTTP_PURPOSE'] ?? '') . (string) ($_SERVER['HTTP_SEC_PURPOSE'] ?? '') . (string) ($_SERVER['HTTP_X_PURPOSE'] ?? ''));
    return strpos($p, 'prefetch') === false && strpos($p, 'preview') === false;
}

// Counts one scan. The same phone opening the same code again within 30 minutes (reload, back button) counts once.
function go_count(string $code): bool {
    $pdo = go_db();
    $now = time();
    $h = substr(hash('sha256', $GLOBALS['go_salt'] . '|' . go_ip() . '|' . ($_SERVER['HTTP_USER_AGENT'] ?? '') . '|' . $code), 0, 32);
    $pdo->prepare('DELETE FROM seen WHERE ts < ?')->execute([$now - 1800]);
    $q = $pdo->prepare('SELECT 1 FROM seen WHERE h = ?'); $q->execute([$h]);
    if ($q->fetchColumn()) return false;
    $known = $pdo->prepare('SELECT 1 FROM scans WHERE code = ? LIMIT 1'); $known->execute([$code]);
    if (!$known->fetchColumn() && (int) $pdo->query('SELECT COUNT(DISTINCT code) FROM scans')->fetchColumn() >= (int) go_cfg()['MAX_CODES']) return false;
    $pdo->prepare('INSERT INTO seen(h, ts) VALUES(?, ?)')->execute([$h, $now]);
    $pdo->prepare('INSERT INTO scans(code, day, n, last) VALUES(?, ?, 1, ?) ON CONFLICT(code, day) DO UPDATE SET n = n + 1, last = excluded.last')
        ->execute([$code, date('Y-m-d'), $now]);
    return true;
}
