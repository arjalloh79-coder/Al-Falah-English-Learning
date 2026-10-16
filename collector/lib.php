<?php
declare(strict_types=1);
if (!defined('AFEL')) { http_response_code(403); exit; }

function cfg(): array {
    static $c = null;
    if ($c === null) {
        $f = __DIR__ . '/config.php';
        $c = is_file($f) ? (array) require $f : [];
        $c += ['ALLOWED_ORIGINS' => [], 'SETUP_TOKEN' => '', 'TIMEZONE' => 'Africa/Conakry', 'DATA_DIR' => ''];
    }
    return $c;
}
date_default_timezone_set((string) cfg()['TIMEZONE']);

// Where the database and password hash live. Best: a folder ABOVE public_html (set DATA_DIR in config.php).
function data_dir(): string { $d = (string) cfg()['DATA_DIR']; return $d !== '' ? rtrim($d, '/\\') : __DIR__ . '/data'; }
// Random, unguessable database file name (created once).
function db_file(): string {
    $dir = data_dir(); $nf = $dir . '/.dbname';
    if (!is_dir($dir)) { @mkdir($dir, 0750, true); }
    $n = is_file($nf) ? trim((string) file_get_contents($nf)) : '';
    if (!preg_match('/^[a-f0-9]{16}$/', $n)) { $n = bin2hex(random_bytes(8)); @file_put_contents($nf, $n, LOCK_EX); }
    return $dir . '/events-' . $n . '.sqlite';
}

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $dir = data_dir();
    if (!is_dir($dir)) { @mkdir($dir, 0750, true); }
    if (!is_file($dir . '/.htaccess')) { @file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n"); }
    $pdo = new PDO('sqlite:' . db_file());
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
    $pdo->exec('CREATE TABLE IF NOT EXISTS users(
        uid TEXT PRIMARY KEY, name TEXT, lang TEXT, dev TEXT, ver TEXT,
        first_seen INTEGER NOT NULL, last_seen INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS events(
        id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT NOT NULL, sid TEXT, eid TEXT NOT NULL,
        ts INTEGER NOT NULL, rts INTEGER NOT NULL, type TEXT NOT NULL,
        ref TEXT, ok INTEGER, val INTEGER, data TEXT,
        UNIQUE(uid, eid));
      CREATE INDEX IF NOT EXISTS ev_uid_ts ON events(uid, ts);
      CREATE INDEX IF NOT EXISTS ev_type ON events(type, ref);
      CREATE TABLE IF NOT EXISTS logins(k TEXT PRIMARY KEY, fails INTEGER, until INTEGER);');
    return $pdo;
}

function h($v): string { return htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

function lessons(): array { static $l = null; return $l ??= (require __DIR__ . '/lessons.php'); }
function lesson_name(?string $id): string {
    if ($id === null || $id === '') return '?';
    if ($id === 'practice') return 'Practice / Révision';
    return lessons()['lessons'][$id] ?? $id;
}
function word_name(?string $k): string { return $k === null ? '?' : (lessons()['words'][$k] ?? $k); }
