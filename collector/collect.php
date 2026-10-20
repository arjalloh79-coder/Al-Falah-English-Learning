<?php
// Receives batches of usage events from the English app. Public endpoint: validate everything.
define('AFEL', 1);
require __DIR__ . '/lib.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = cfg()['ALLOWED_ORIGINS'];
if ($origin !== '' && (in_array('*', $allowed, true) || in_array($origin, $allowed, true))) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); exit; }
header('Content-Type: application/json');

function fail(int $code, string $msg): never { http_response_code($code); echo json_encode(['ok' => false, 'error' => $msg]); exit; }

$raw = file_get_contents('php://input', false, null, 0, 65537);
if ($raw === false || strlen($raw) > 65536) fail(413, 'too large');
$j = json_decode($raw, true);
if (!is_array($j)) fail(400, 'bad json');

$uid = (string) ($j['uid'] ?? '');
if (!preg_match('/^[A-Za-z0-9-]{8,64}$/', $uid)) fail(400, 'bad uid');
$pdo = db();

// "Delete my data" request from the app
if (!empty($j['forget'])) {
    $pdo->beginTransaction();
    $pdo->prepare('DELETE FROM events WHERE uid = ?')->execute([$uid]);
    $pdo->prepare('DELETE FROM users WHERE uid = ?')->execute([$uid]);
    $pdo->commit();
    echo json_encode(['ok' => true, 'forgotten' => true]); exit;
}

$events = $j['events'] ?? null;
if (!is_array($events) || count($events) === 0 || count($events) > 100) fail(400, 'bad events');

$TYPES = ['app_open', 'installed', 'consent', 'name_set', 'lesson_start', 'answer', 'lesson_complete', 'lesson_quit',
          'out_of_hearts', 'practice_start', 'sponsor_impression', 'sponsor_click'];
$now = (int) (microtime(true) * 1000);
$clean = fn($v, int $n) => is_string($v) ? mb_substr(preg_replace('/[\x00-\x1F\x7F]/u', '', $v), 0, $n) : null;

$pdo->beginTransaction();
try {
    // basic abuse guard: max 600 events per phone per hour
    $recent = (int) $pdo->query('SELECT COUNT(*) FROM events WHERE uid = ' . $pdo->quote($uid) . ' AND rts > ' . ($now - 3600000))->fetchColumn();
    if ($recent > 600) { $pdo->rollBack(); fail(429, 'slow down'); }

    $dev = is_array($j['dev'] ?? null) ? json_encode(array_intersect_key($j['dev'], array_flip(['w', 'h', 'lang', 'pwa']))) : null;
    $name = $clean($j['name'] ?? '', 40);
    // Learning-language chosen in the app (sent with every batch). Empty/invalid = leave what we already know.
    $lang = preg_match('/^[a-z]{2,3}$/', (string) ($j['ul'] ?? '')) ? $j['ul'] : null;
    $pdo->prepare('INSERT INTO users(uid,name,lang,dev,ver,first_seen,last_seen) VALUES(?,?,?,?,?,?,?)
                   ON CONFLICT(uid) DO UPDATE SET last_seen=excluded.last_seen, dev=COALESCE(excluded.dev,dev),
                   ver=COALESCE(excluded.ver,ver), lang=COALESCE(excluded.lang,lang), name=CASE WHEN excluded.name<>\'\' THEN excluded.name ELSE name END')
        ->execute([$uid, $name ?? '', $lang, $dev, $clean($j['v'] ?? '', 12), $now, $now]);

    $ins = $pdo->prepare('INSERT OR IGNORE INTO events(uid,sid,eid,ts,rts,type,ref,ok,val,data) VALUES(?,?,?,?,?,?,?,?,?,?)');
    $accepted = 0;
    foreach ($events as $e) {
        if (!is_array($e)) continue;
        $type = (string) ($e['y'] ?? '');
        if (!in_array($type, $TYPES, true)) continue;
        $eid = (string) ($e['i'] ?? '');
        if (!preg_match('/^[A-Za-z0-9-]{4,24}$/', $eid)) continue;
        $ts = (int) ($e['t'] ?? 0);
        if ($ts < $now - 14 * 86400000 || $ts > $now + 86400000) $ts = $now;   // clamp bad phone clocks
        $d = is_array($e['d'] ?? null) ? $e['d'] : [];
        $ref = $type === 'answer' ? ($d['k'] ?? null) : ($d['id'] ?? $d['s'] ?? $d['lang'] ?? null);
        $ref = $clean($ref, 40);
        $ok = isset($d['ok']) ? (int) (!!$d['ok']) : null;
        $val = isset($d['xp']) ? (int) $d['xp'] : (isset($d['ms']) ? (int) $d['ms'] : null);
        $keep = array_intersect_key($d, array_flip(['id', 'lesson', 'type', 'k', 'ok', 'ms', 'xp', 'acc', 'mis', 'done', 'total', 's', 'place', 'lang', 'standalone', 'online', 'w', 'consent', 'yes']));
        $json = json_encode($keep, JSON_UNESCAPED_UNICODE);
        if (strlen($json) > 600) $json = null;
        $ins->execute([$uid, $clean($j['sid'] ?? '', 16), $eid, $ts, $now, $type, $ref, $ok, $val, $json]);
        $accepted += $ins->rowCount();
        if ($type === 'app_open' && !empty($d['lang'])) {
            $pdo->prepare('UPDATE users SET lang = ? WHERE uid = ?')->execute([$clean($d['lang'], 8), $uid]);
        }
    }
    $pdo->commit();
    echo json_encode(['ok' => true, 'accepted' => $accepted]);
} catch (Throwable $ex) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('afel collect: ' . $ex->getMessage());
    fail(500, 'server error');
}
