<?php
declare(strict_types=1);

// Al-Falah website assistant: the "leave my details" form in the chat bubble.
// A visitor leaves a name and a phone or email; it is emailed to you (LEAD_EMAIL) and kept in the small private database.

require __DIR__ . '/lib.php';

const MAX_BODY = 4096;

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
$c = cfg();
if ($c['LEAD_EMAIL'] === '' || !filter_var($c['LEAD_EMAIL'], FILTER_VALIDATE_EMAIL)) out(503, ['error' => 'not_configured']);

$raw = file_get_contents('php://input', false, null, 0, MAX_BODY + 1);
if ($raw === false || strlen($raw) > MAX_BODY) out(413, ['error' => 'too_large']);
$j = json_decode($raw, true);
if (!is_array($j)) out(400, ['error' => 'bad_request']);

$clean = static function ($v, int $max): string {
    $v = is_string($v) ? preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) : '';
    return trim(mb_substr((string) $v, 0, $max));
};
// A hidden field that people never see: a robot fills it in. Pretend success and do nothing.
if (($j['website'] ?? '') !== '') out(200, ['ok' => true]);
if (($j['consent'] ?? false) !== true) out(400, ['error' => 'consent']);

$name = preg_replace('/\s+/u', ' ', $clean($j['name'] ?? '', 80));
$contact = preg_replace('/\s+/u', ' ', $clean($j['contact'] ?? '', 120));
$note = $clean($j['note'] ?? '', 400);
$lang = ($j['lang'] ?? '') === 'en' ? 'en' : 'fr';
if (mb_strlen($name) < 2) out(400, ['error' => 'name']);
$isEmail = filter_var($contact, FILTER_VALIDATE_EMAIL) !== false;
$digits = preg_replace('/\D/', '', $contact);
$isPhone = !$isEmail && preg_match('/^[+\d][\d\s().\-]{5,}$/', $contact) && strlen($digits) >= 7 && strlen($digits) <= 15;
if (!$isEmail && !$isPhone) out(400, ['error' => 'contact']);

try {
    $r = check_limits(db(), 'l:', scramble(client_ip()), (int) $c['LEAD_PER_HOUR'], (int) $c['LEAD_PER_DAY'], (int) $c['LEAD_GLOBAL_DAY']);
    if ($r === 'limited') out(429, ['error' => 'rate_limited']);
    if ($r === 'busy') out(503, ['error' => 'busy']);
    db()->prepare('INSERT INTO leads(ts, name, contact, note, lang) VALUES(?,?,?,?,?)')->execute([time(), $name, $contact, $note, $lang]);
} catch (Throwable $e) {
    error_log('assistant lead db: ' . $e->getMessage());
    out(503, ['error' => 'busy']);
}

// Email it to you. Headers never contain visitor text (no header injection); the visitor's email is used as Reply-To only when valid.
$host = preg_replace('/^www\./', '', (string) parse_url($c['ALLOWED_ORIGINS'][0] ?? '', PHP_URL_HOST));
$from = $c['LEAD_FROM'] !== '' && filter_var($c['LEAD_FROM'], FILTER_VALIDATE_EMAIL) ? $c['LEAD_FROM'] : 'assistant@' . ($host ?: 'localhost');
$headers = ['From: Al-Falah site <' . $from . '>', 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8'];
if ($isEmail) $headers[] = 'Reply-To: ' . $contact;
$body = "New contact request from the website chat\n\n"
    . "Name: $name\nContact: $contact\nLanguage: " . strtoupper($lang) . "\n"
    . "Message: " . ($note !== '' ? $note : '(none)') . "\n\n"
    . "Sent: " . gmdate('Y-m-d H:i') . " UTC\n"
    . "Reply on WhatsApp or by email within a few hours. The visitor agreed to be contacted about their request.\n";
$subject = '=?UTF-8?B?' . base64_encode('New website lead: ' . $name) . '?=';
if (!@mail($c['LEAD_EMAIL'], $subject, $body, implode("\r\n", $headers))) error_log('assistant lead: mail() failed (lead is saved in the database)');
out(200, ['ok' => true]);
