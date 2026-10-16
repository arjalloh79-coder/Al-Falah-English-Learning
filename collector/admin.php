<?php
// Al-Falah English app: usage dashboard (password protected).
define('AFEL', 1);
require __DIR__ . '/lib.php';

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_name('afel_admin');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Strict']);
session_start();
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");

$hashFile = data_dir() . '/admin.hash';
if (!is_file($hashFile)) { header('Content-Type: text/plain'); exit("Not set up yet. Open setup.php first.\n"); }
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
$csrf = $_SESSION['csrf'];
$self = basename(__FILE__);

// ---------- login / logout ----------
$loginErr = '';
if (isset($_GET['logout'])) { $_SESSION = []; session_destroy(); header('Location: ' . $self); exit; }
if (empty($_SESSION['in'])) {
    $key = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|afel');
    $pdo = db();
    $row = $pdo->query('SELECT fails, until FROM logins WHERE k = ' . $pdo->quote($key))->fetch();
    $locked = $row && (int) $row['until'] > time();
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
        if ($locked) $loginErr = 'Too many attempts. Try again in 10 minutes.';
        elseif (!hash_equals($csrf, (string) ($_POST['csrf'] ?? ''))) $loginErr = 'Session expired, reload the page.';
        elseif (password_verify((string) $_POST['password'], trim((string) file_get_contents($hashFile)))) {
            session_regenerate_id(true); $_SESSION['in'] = true; $_SESSION['csrf'] = bin2hex(random_bytes(16));
            $pdo->prepare('DELETE FROM logins WHERE k = ?')->execute([$key]);
            header('Location: ' . $self); exit;
        } else {
            $f = ((int) ($row['fails'] ?? 0)) + 1;
            $pdo->prepare('INSERT INTO logins(k,fails,until) VALUES(?,?,?) ON CONFLICT(k) DO UPDATE SET fails=excluded.fails, until=excluded.until')
                ->execute([$key, $f, $f >= 5 ? time() + 600 : 0]);
            sleep(1); $loginErr = 'Wrong password.';
        }
    }
    page_head('Login');
    echo '<main class="login"><h1>Al-Falah English · Dashboard</h1>' . ($loginErr ? '<p class="err">' . h($loginErr) . '</p>' : '')
       . '<form method="post"><input type="hidden" name="csrf" value="' . h($csrf) . '"><input type="password" name="password" placeholder="Password" autofocus required><button>Sign in</button></form></main>';
    exit;
}

// ---------- helpers ----------
$pdo = db();
$now = (int) (microtime(true) * 1000);
function q(string $sql, array $p = []): array { global $pdo; $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchAll(); }
function one(string $sql, array $p = []) { global $pdo; $s = $pdo->prepare($sql); $s->execute($p); $v = $s->fetchColumn(); return $v === false ? 0 : $v; }
function fdt(int $ms): string { return date('d M Y H:i', intdiv($ms, 1000)); }
function ago(int $ms): string { global $now; $d = intdiv($now - $ms, 1000); if ($d < 90) return 'just now'; if ($d < 5400) return intdiv($d, 60) . ' min ago'; if ($d < 129600) return intdiv($d, 3600) . ' h ago'; return intdiv($d, 86400) . ' d ago'; }
function pct($a, $b): string { return $b > 0 ? round(100 * $a / $b) . '%' : '–'; }
function short(string $uid): string { return strtoupper(substr($uid, 0, 6)); }
function who(array $u): string { return ($u['name'] ?? '') !== '' ? h($u['name']) . ' <small>#' . short($u['uid']) . '</small>' : '<span class="mute">Anonymous</span> <small>#' . short($u['uid']) . '</small>'; }
function describe(array $e): string {
    $d = json_decode((string) ($e['data'] ?? '{}'), true) ?: [];
    switch ($e['type']) {
        case 'app_open': return '📱 Opened the app' . (!empty($d['standalone']) ? ' (installed)' : '') . (isset($d['online']) && !$d['online'] ? ' · offline' : '');
        case 'installed': return '📲 Installed to home screen';
        case 'consent': return '🔒 Agreed to share usage';
        case 'name_set': return '✏️ Set a display name';
        case 'lesson_start': return '▶️ Started ' . h(lesson_name($e['ref']));
        case 'lesson_complete': return '🏆 Completed ' . h(lesson_name($e['ref'])) . ' · +' . (int) $e['val'] . ' XP · ' . (int) ($d['acc'] ?? 0) . '% accuracy · ' . (int) ($d['mis'] ?? 0) . ' mistakes · ' . round(((int) ($d['ms'] ?? 0)) / 60000, 1) . ' min';
        case 'lesson_quit': return '🚪 Left ' . h(lesson_name($e['ref'])) . ' (' . (int) ($d['done'] ?? 0) . '/' . (int) ($d['total'] ?? 0) . ' done)';
        case 'out_of_hearts': return '💔 Ran out of hearts in ' . h(lesson_name($e['ref']));
        case 'practice_start': return '🔁 Started a practice round';
        case 'answer':
            $t = (string) ($d['type'] ?? '');
            return ($e['ok'] ? '✅' : '❌') . ' ' . h($t) . ($e['ref'] ? ' · ' . h(word_name($e['ref'])) : '') . ($e['val'] ? ' · ' . round($e['val'] / 1000, 1) . 's' : '');
        case 'sponsor_impression': return '👁️ Saw sponsor <b>' . h($e['ref']) . '</b> (' . h($d['place'] ?? '') . ')';
        case 'sponsor_click': return '👆 Tapped sponsor <b>' . h($e['ref']) . '</b>';
    }
    return h($e['type']);
}
function page_head(string $title): void {
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' . h($title) . ' · Al-Falah English</title><style>
:root{--navy:#0D1B2A;--card:#16293D;--line:#254260;--gold:#C9963A;--gold2:#E8B455;--ivory:#F5EDD8;--mute:#9a8f78;--ok:#3DAA72;--bad:#e5707a}
*{box-sizing:border-box}body{margin:0;background:var(--navy);color:var(--ivory);font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
a{color:var(--gold2)}h1{font:700 24px Georgia,serif;margin:0}h2{font-size:18px;margin:26px 0 10px;color:var(--gold2)}small,.mute{color:var(--mute)}
.top{display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:12px 16px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--navy);z-index:5}
.top nav{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto}.top nav a{padding:6px 12px;border:1px solid var(--line);border-radius:8px;text-decoration:none;color:var(--ivory)}.top nav a.on{background:var(--gold);color:var(--navy);border-color:var(--gold);font-weight:700}
main{max-width:1000px;margin:0 auto;padding:16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}.card b{display:block;font-size:26px}.card span{color:var(--mute);font-size:13px}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:12px}table{border-collapse:collapse;width:100%;font-size:14px}th,td{padding:8px 10px;text-align:left;border-bottom:1px solid var(--line);white-space:nowrap}th{color:var(--gold2);background:var(--card);position:sticky;top:0}tr:last-child td{border-bottom:0}
.bars{display:flex;align-items:flex-end;gap:4px;height:90px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px}.bars i{flex:1;background:var(--gold);border-radius:3px 3px 0 0;min-height:2px;position:relative}.bars i:hover:after{content:attr(data-t);position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:#000;padding:2px 6px;border-radius:4px;font-size:12px;white-space:nowrap;font-style:normal}
.ses{background:var(--card);border:1px solid var(--line);border-radius:12px;margin:10px 0;overflow:hidden}.ses>div{padding:10px 14px;border-bottom:1px solid var(--line)}.ses>div:last-child{border-bottom:0}.ses .h{background:#1b324a;font-weight:700}.ev{display:flex;gap:10px}.ev time{color:var(--mute);min-width:48px;font-size:13px}
input,select,button{font:inherit;padding:9px 12px;border-radius:9px;border:1px solid var(--line);background:var(--card);color:var(--ivory)}button{background:var(--gold);color:var(--navy);border:0;font-weight:800;cursor:pointer}button.d{background:#8f2d33;color:#fff}
.login{max-width:360px;margin:12vh auto;padding:0 18px}.login input,.login button{width:100%;margin-top:10px}.err{color:var(--bad)}.pill{display:inline-block;padding:1px 8px;border-radius:99px;background:#1b324a;font-size:12px}.good{color:var(--ok)}.bad{color:var(--bad)}
</style></head><body>';
}
function page_top(string $active): void {
    global $self;
    $l = fn($v, $t) => '<a href="' . h($self) . '?v=' . $v . '" class="' . ($active === $v ? 'on' : '') . '">' . $t . '</a>';
    echo '<div class="top"><h1>Al-Falah English</h1><nav>' . $l('overview', 'Overview') . $l('users', 'Users') . $l('sponsors', 'Sponsors') . '<a href="' . h($self) . '?logout=1">Sign out</a></nav></div><main>';
}

$v = $_GET['v'] ?? 'overview';

// ---------- POST actions ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['do'] ?? '') === 'delete_user') {
    if (!hash_equals($csrf, (string) ($_POST['csrf'] ?? ''))) { http_response_code(400); exit('Bad token'); }
    $uid = (string) ($_POST['uid'] ?? '');
    $pdo->prepare('DELETE FROM events WHERE uid = ?')->execute([$uid]);
    $pdo->prepare('DELETE FROM users WHERE uid = ?')->execute([$uid]);
    header('Location: ' . $self . '?v=users'); exit;
}

// ---------- CSV export ----------
if ($v === 'csv') {
    $what = $_GET['what'] ?? 'users';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="afel-' . preg_replace('/[^a-z]/', '', $what) . '-' . date('Ymd') . '.csv"');
    $out = fopen('php://output', 'w'); fwrite($out, "\xEF\xBB\xBF");
    $safe = fn($x) => is_string($x) && preg_match('/^[=+\-@]/', $x) ? "'" . $x : $x;     // block spreadsheet formula injection
    if ($what === 'events') {
        $uid = (string) ($_GET['id'] ?? '');
        fputcsv($out, ['time', 'session', 'type', 'ref', 'ok', 'value', 'data']);
        foreach (q('SELECT * FROM events WHERE uid = ? ORDER BY ts', [$uid]) as $e) fputcsv($out, [date('c', intdiv($e['ts'], 1000)), $e['sid'], $e['type'], $safe($e['ref']), $e['ok'], $e['val'], $e['data']]);
    } else {
        fputcsv($out, ['id', 'name', 'language', 'first_seen', 'last_seen', 'lessons_completed', 'answers', 'correct', 'xp', 'days_active']);
        foreach (q("SELECT u.*, (SELECT COUNT(*) FROM events e WHERE e.uid=u.uid AND e.type='lesson_complete') les,
                    (SELECT COUNT(*) FROM events e WHERE e.uid=u.uid AND e.type='answer') ans,
                    (SELECT COALESCE(SUM(ok),0) FROM events e WHERE e.uid=u.uid AND e.type='answer') cor,
                    (SELECT COALESCE(SUM(val),0) FROM events e WHERE e.uid=u.uid AND e.type='lesson_complete') xp,
                    (SELECT COUNT(DISTINCT date(ts/1000,'unixepoch')) FROM events e WHERE e.uid=u.uid) days
                    FROM users u ORDER BY last_seen DESC") as $u)
            fputcsv($out, [short($u['uid']), $safe($u['name']), $u['lang'], date('c', intdiv($u['first_seen'], 1000)), date('c', intdiv($u['last_seen'], 1000)), $u['les'], $u['ans'], $u['cor'], $u['xp'], $u['days']]);
    }
    exit;
}

page_head(ucfirst($v));

// =====================================================  OVERVIEW
if ($v === 'overview') {
    page_top('overview');
    $total = (int) one('SELECT COUNT(*) FROM users');
    $a1 = (int) one('SELECT COUNT(*) FROM users WHERE last_seen > ?', [$now - 86400000]);
    $a7 = (int) one('SELECT COUNT(*) FROM users WHERE last_seen > ?', [$now - 7 * 86400000]);
    $n7 = (int) one('SELECT COUNT(*) FROM users WHERE first_seen > ?', [$now - 7 * 86400000]);
    $les = (int) one("SELECT COUNT(*) FROM events WHERE type='lesson_complete'");
    $ans = (int) one("SELECT COUNT(*) FROM events WHERE type='answer'");
    $cor = (int) one("SELECT COALESCE(SUM(ok),0) FROM events WHERE type='answer'");
    $ret = (int) one("SELECT COUNT(*) FROM (SELECT uid FROM events GROUP BY uid HAVING COUNT(DISTINCT date(ts/1000,'unixepoch'))>=2)");
    $pwa = (int) one("SELECT COUNT(*) FROM users WHERE dev LIKE '%\"pwa\":1%'");
    echo '<h2>Overview</h2><div class="grid">';
    foreach ([[$total, 'Users (consented)'], [$a1, 'Active last 24 h'], [$a7, 'Active last 7 days'], [$n7, 'New last 7 days'], [$les, 'Lessons completed'], [pct($cor, $ans), 'Answer accuracy'], [pct($ret, $total), 'Came back on another day'], [pct($pwa, $total), 'Installed on home screen']] as [$n, $l])
        echo '<div class="card"><b>' . h($n) . '</b><span>' . h($l) . '</span></div>';
    echo '</div>';

    echo '<h2>Active users per day (last 14 days, UTC)</h2><div class="bars">';
    $rows = []; foreach (q("SELECT date(ts/1000,'unixepoch') d, COUNT(DISTINCT uid) n FROM events WHERE ts > ? GROUP BY d", [$now - 14 * 86400000]) as $r) $rows[$r['d']] = (int) $r['n'];
    $max = max(1, ...array_values($rows ?: [1]));
    for ($i = 13; $i >= 0; $i--) { $d = gmdate('Y-m-d', time() - $i * 86400); $n = $rows[$d] ?? 0; echo '<i style="height:' . max(2, round(100 * $n / $max)) . '%" data-t="' . h($d . ': ' . $n) . '"></i>'; }
    echo '</div>';

    echo '<h2>Lesson funnel: where do learners drop off?</h2><div class="tw"><table><tr><th>Lesson</th><th>Started</th><th>Completed</th><th>Completion</th><th>Left early</th><th>Out of hearts</th></tr>';
    $f = q("SELECT ref, SUM(type='lesson_start') s, SUM(type='lesson_complete') c, SUM(type='lesson_quit') q, SUM(type='out_of_hearts') o FROM events WHERE type IN ('lesson_start','lesson_complete','lesson_quit','out_of_hearts') AND ref IS NOT NULL GROUP BY ref");
    $order = array_flip(array_keys(lessons()['lessons'])); usort($f, fn($a, $b) => ($order[$a['ref']] ?? 999) <=> ($order[$b['ref']] ?? 999));
    foreach ($f as $r) echo '<tr><td>' . h(lesson_name($r['ref'])) . '</td><td>' . (int) $r['s'] . '</td><td>' . (int) $r['c'] . '</td><td>' . pct($r['c'], $r['s']) . '</td><td>' . (int) $r['q'] . '</td><td>' . (int) $r['o'] . '</td></tr>';
    if (!$f) echo '<tr><td colspan="6" class="mute">No lesson activity yet.</td></tr>';
    echo '</table></div>';

    echo '<h2>Most-missed words (at least 3 answers)</h2><div class="tw"><table><tr><th>Word</th><th>Answers</th><th>Wrong</th><th>Error rate</th></tr>';
    foreach (q("SELECT ref, COUNT(*) n, SUM(1-ok) w FROM events WHERE type='answer' AND ref IS NOT NULL AND ok IS NOT NULL GROUP BY ref HAVING n>=3 ORDER BY (w*1.0/n) DESC, w DESC LIMIT 10") as $r)
        echo '<tr><td>' . h(word_name($r['ref'])) . '</td><td>' . (int) $r['n'] . '</td><td>' . (int) $r['w'] . '</td><td class="bad">' . pct($r['w'], $r['n']) . '</td></tr>';
    echo '</table></div>';

    echo '<h2>Languages chosen</h2><div class="tw"><table><tr><th>Language</th><th>Users</th></tr>';
    foreach (q("SELECT COALESCE(NULLIF(lang,''),'?') l, COUNT(*) n FROM users GROUP BY l ORDER BY n DESC") as $r) echo '<tr><td>' . h($r['l']) . '</td><td>' . (int) $r['n'] . '</td></tr>';
    echo '</table></div></main>';
    exit;
}

// =====================================================  USERS LIST
if ($v === 'users') {
    page_top('users');
    $qs = trim((string) ($_GET['q'] ?? '')); $page = max(0, (int) ($_GET['p'] ?? 0)); $per = 50;
    $like = '%' . str_replace(['%', '_'], ['\%', '\_'], $qs) . '%';
    $where = $qs !== '' ? "WHERE u.name LIKE :q ESCAPE '\\' OR u.uid LIKE :q ESCAPE '\\'" : '';
    $stmt = $pdo->prepare("SELECT u.*, (SELECT COUNT(*) FROM events e WHERE e.uid=u.uid AND e.type='lesson_complete') les,
        (SELECT COUNT(*) FROM events e WHERE e.uid=u.uid AND e.type='answer') ans,
        (SELECT COALESCE(SUM(ok),0) FROM events e WHERE e.uid=u.uid AND e.type='answer') cor,
        (SELECT COALESCE(SUM(val),0) FROM events e WHERE e.uid=u.uid AND e.type='lesson_complete') xp,
        (SELECT COUNT(DISTINCT date(ts/1000,'unixepoch')) FROM events e WHERE e.uid=u.uid) days
        FROM users u $where ORDER BY last_seen DESC LIMIT $per OFFSET " . ($page * $per));
    if ($qs !== '') $stmt->bindValue(':q', $like);
    $stmt->execute(); $us = $stmt->fetchAll();
    echo '<h2>Users</h2><form method="get" style="display:flex;gap:8px;margin-bottom:12px"><input type="hidden" name="v" value="users"><input name="q" value="' . h($qs) . '" placeholder="Search name or ID" style="flex:1"><button>Search</button> <a href="' . h($self) . '?v=csv&what=users" style="align-self:center">⬇ CSV</a></form>';
    echo '<div class="tw"><table><tr><th>User</th><th>Language</th><th>Last seen</th><th>First seen</th><th>Lessons</th><th>XP</th><th>Accuracy</th><th>Days active</th></tr>';
    foreach ($us as $u) echo '<tr><td><a href="' . h($self) . '?v=user&id=' . h($u['uid']) . '">' . who($u) . '</a></td><td>' . h($u['lang'] ?: '?') . '</td><td>' . h(ago((int) $u['last_seen'])) . '</td><td>' . h(fdt((int) $u['first_seen'])) . '</td><td>' . (int) $u['les'] . '</td><td>' . (int) $u['xp'] . '</td><td>' . pct($u['cor'], $u['ans']) . '</td><td>' . (int) $u['days'] . '</td></tr>';
    if (!$us) echo '<tr><td colspan="8" class="mute">No users yet.</td></tr>';
    echo '</table></div><p>';
    if ($page > 0) echo '<a href="' . h($self) . '?v=users&q=' . urlencode($qs) . '&p=' . ($page - 1) . '">← Newer</a> ';
    if (count($us) === $per) echo '<a href="' . h($self) . '?v=users&q=' . urlencode($qs) . '&p=' . ($page + 1) . '">Older →</a>';
    echo '</p></main>'; exit;
}

// =====================================================  ONE USER
if ($v === 'user') {
    page_top('users');
    $uid = (string) ($_GET['id'] ?? '');
    $u = q('SELECT * FROM users WHERE uid = ?', [$uid])[0] ?? null;
    if (!$u) { echo '<p>User not found.</p></main>'; exit; }
    $dev = json_decode((string) $u['dev'], true) ?: [];
    $les = (int) one("SELECT COUNT(*) FROM events WHERE uid=? AND type='lesson_complete'", [$uid]);
    $xp = (int) one("SELECT COALESCE(SUM(val),0) FROM events WHERE uid=? AND type='lesson_complete'", [$uid]);
    $ans = (int) one("SELECT COUNT(*) FROM events WHERE uid=? AND type='answer'", [$uid]);
    $cor = (int) one("SELECT COALESCE(SUM(ok),0) FROM events WHERE uid=? AND type='answer'", [$uid]);
    $days = (int) one("SELECT COUNT(DISTINCT date(ts/1000,'unixepoch')) FROM events WHERE uid=?", [$uid]);
    $sessions = (int) one('SELECT COUNT(DISTINCT sid) FROM events WHERE uid=?', [$uid]);
    echo '<h2>' . who($u) . '</h2><p class="mute">Language: ' . h($u['lang'] ?: '?') . ' · Screen: ' . h(($dev['w'] ?? '?') . '×' . ($dev['h'] ?? '?')) . ' · Phone language: ' . h($dev['lang'] ?? '?') . ' · ' . (!empty($dev['pwa']) ? 'Installed' : 'In browser') . ' · App v' . h($u['ver'] ?: '?') . '<br>First seen ' . h(fdt((int) $u['first_seen'])) . ' · Last seen ' . h(ago((int) $u['last_seen'])) . '</p>';
    echo '<div class="grid">';
    foreach ([[$les, 'Lessons completed'], [$xp, 'XP earned'], [pct($cor, $ans), 'Answer accuracy'], [$days, 'Days active'], [$sessions, 'Sessions']] as [$n, $l]) echo '<div class="card"><b>' . h($n) . '</b><span>' . h($l) . '</span></div>';
    echo '</div><p><a href="' . h($self) . '?v=csv&what=events&id=' . h($uid) . '">⬇ Download full history (CSV)</a></p>';

    echo '<h2>Progress by lesson</h2><div class="tw"><table><tr><th>Lesson</th><th>Started</th><th>Completed</th><th>Left early</th><th>Out of hearts</th></tr>';
    $order = array_flip(array_keys(lessons()['lessons']));
    $f = q("SELECT ref, SUM(type='lesson_start') s, SUM(type='lesson_complete') c, SUM(type='lesson_quit') q, SUM(type='out_of_hearts') o FROM events WHERE uid=? AND type IN ('lesson_start','lesson_complete','lesson_quit','out_of_hearts') AND ref IS NOT NULL GROUP BY ref", [$uid]);
    usort($f, fn($a, $b) => ($order[$a['ref']] ?? 999) <=> ($order[$b['ref']] ?? 999));
    foreach ($f as $r) echo '<tr><td>' . h(lesson_name($r['ref'])) . '</td><td>' . (int) $r['s'] . '</td><td>' . (int) $r['c'] . '</td><td>' . (int) $r['q'] . '</td><td>' . (int) $r['o'] . '</td></tr>';
    echo '</table></div>';

    echo '<h2>Words this learner struggles with</h2><div class="tw"><table><tr><th>Word</th><th>Answers</th><th>Wrong</th></tr>';
    foreach (q("SELECT ref, COUNT(*) n, SUM(1-ok) w FROM events WHERE uid=? AND type='answer' AND ref IS NOT NULL AND ok IS NOT NULL GROUP BY ref HAVING w>0 ORDER BY w DESC, n DESC LIMIT 8", [$uid]) as $r) echo '<tr><td>' . h(word_name($r['ref'])) . '</td><td>' . (int) $r['n'] . '</td><td class="bad">' . (int) $r['w'] . '</td></tr>';
    echo '</table></div>';

    echo '<h2>Activity timeline (newest session first)</h2>';
    $evs = q('SELECT * FROM events WHERE uid=? ORDER BY ts DESC, id DESC LIMIT 1500', [$uid]);
    $by = []; foreach ($evs as $e) $by[$e['sid'] ?: 'x'][] = $e;
    foreach ($by as $sid => $list) {
        $list = array_reverse($list); $t0 = (int) $list[0]['ts']; $t1 = (int) end($list)['ts'];
        echo '<div class="ses"><div class="h">' . h(fdt($t0)) . ' <small>· ' . max(1, round(($t1 - $t0) / 60000)) . ' min · ' . count($list) . ' events</small></div>';
        foreach ($list as $e) echo '<div class="ev"><time>' . h(date('H:i', intdiv((int) $e['ts'], 1000))) . '</time><span>' . describe($e) . '</span></div>';
        echo '</div>';
    }
    if (!$evs) echo '<p class="mute">No events.</p>';
    echo '<form method="post" style="margin:30px 0"><input type="hidden" name="do" value="delete_user"><input type="hidden" name="csrf" value="' . h($csrf) . '"><input type="hidden" name="uid" value="' . h($uid) . '"><label><input type="checkbox" required> I understand this permanently deletes all of this user\'s data</label><br><br><button class="d">Delete this user\'s data</button></form></main>';
    exit;
}

// =====================================================  SPONSORS
if ($v === 'sponsors') {
    page_top('sponsors');
    echo '<h2>Sponsor performance</h2><p class="mute">Impressions = sponsor card shown. Taps = learner pressed the sponsor button. Use this for your client reports.</p><div class="tw"><table><tr><th>Sponsor</th><th>Place</th><th>Impressions</th><th>Unique users</th><th>Taps</th><th>Tap rate</th></tr>';
    $rows = q("SELECT ref, CASE WHEN data LIKE '%\"place\":\"unit\"%' THEN 'unit' ELSE 'complete' END pl, SUM(type='sponsor_impression') i, COUNT(DISTINCT CASE WHEN type='sponsor_impression' THEN uid END) uu, SUM(type='sponsor_click') c FROM events WHERE type IN ('sponsor_impression','sponsor_click') GROUP BY ref, pl ORDER BY i DESC");
    foreach ($rows as $r) echo '<tr><td>' . h($r['ref'] === 'house' ? 'house ad (Become a sponsor)' : $r['ref']) . '</td><td>' . h($r['pl']) . '</td><td>' . (int) $r['i'] . '</td><td>' . (int) $r['uu'] . '</td><td>' . (int) $r['c'] . '</td><td>' . pct($r['c'], $r['i']) . '</td></tr>';
    if (!$rows) echo '<tr><td colspan="6" class="mute">No sponsor activity yet.</td></tr>';
    echo '</table></div></main>'; exit;
}
echo '<p>Unknown page.</p>';
