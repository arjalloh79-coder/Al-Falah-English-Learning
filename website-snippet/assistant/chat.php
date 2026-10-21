<?php
declare(strict_types=1);

// Al-Falah website assistant: a small server-side proxy between the chat bubble and OpenAI.
// The OpenAI key lives only in config.php on the server. It is never sent to the browser.

require __DIR__ . '/lib.php';

const MAX_MESSAGES = 10;   // last N messages of the conversation are forwarded
const MAX_CHARS = 600;     // per message
const MAX_BODY = 16384;    // bytes

// ---- 1. Basic request checks -------------------------------------------------------------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    if (!in_array($origin, cfg()['ALLOWED_ORIGINS'], true)) out(403, ['error' => 'forbidden']);
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method !== 'POST') out(405, ['error' => 'method']);
if (cfg()['OPENAI_API_KEY'] === '') out(503, ['error' => 'not_configured']);

$raw = file_get_contents('php://input', false, null, 0, MAX_BODY + 1);
if ($raw === false || strlen($raw) > MAX_BODY) out(413, ['error' => 'too_large']);
$j = json_decode($raw, true);
if (!is_array($j) || !is_array($j['messages'] ?? null)) out(400, ['error' => 'bad_request']);

// ---- 2. Clean the conversation (only user/assistant roles; the visitor can never add "system") ----
$msgs = [];
foreach ($j['messages'] as $m) {
    if (!is_array($m)) continue;
    $role = $m['role'] ?? '';
    if ($role !== 'user' && $role !== 'assistant') continue;
    $text = is_string($m['content'] ?? null) ? preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $m['content']) : '';
    $text = trim(mb_substr((string) $text, 0, MAX_CHARS));
    if ($text === '') continue;
    $msgs[] = ['role' => $role, 'content' => $text];
}
$msgs = array_slice($msgs, -MAX_MESSAGES);
while ($msgs && $msgs[0]['role'] !== 'user') array_shift($msgs);
if (!$msgs || end($msgs)['role'] !== 'user') out(400, ['error' => 'bad_request']);

// ---- 3. Spending protection: per-visitor and global limits --------------------------------
try {
    $c = cfg();
    $r = check_limits(db(), 'w:', scramble(client_ip()), (int) $c['PER_IP_HOUR'], (int) $c['PER_IP_DAY'], (int) $c['GLOBAL_DAY']);
    if ($r === 'limited') out(429, ['error' => 'rate_limited']);
    if ($r === 'busy') out(503, ['error' => 'busy']);
} catch (Throwable $e) {
    error_log('assistant limiter: ' . $e->getMessage());
    out(503, ['error' => 'busy']);   // fail closed: no limiter, no spending
}

// ---- 4. Ask OpenAI ---------------------------------------------------------------------------
[$status, $reply] = openai_reply($msgs, 'web');
if ($reply === null) out($status === 429 ? 503 : 502, ['error' => 'upstream']);
out(200, ['reply' => $reply]);
