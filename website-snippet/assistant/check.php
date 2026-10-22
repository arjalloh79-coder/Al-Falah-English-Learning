<?php
declare(strict_types=1);

// Diagnostic page: shows in plain words why the AI is not answering. Never prints your key.
// How to use: in config.php add  'CHECK_TOKEN' => 'any-secret-word',  then open
//   https://your-site/assistant/check.php?t=any-secret-word
// DELETE this file (or empty CHECK_TOKEN) when you are done.

require __DIR__ . '/lib.php';

header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
$c = cfg();
$tok = (string) ($c['CHECK_TOKEN'] ?? '');
if ($tok === '' || !hash_equals($tok, (string) ($_GET['t'] ?? ''))) { http_response_code(404); echo "Not found\n"; exit; }

$key = $c['OPENAI_API_KEY'];
echo "Provider : {$c['PROVIDER']}\nModel    : {$c['MODEL']}\nAddress  : {$c['API_URL']}\n";
echo 'Key      : ' . ($key === '' ? 'MISSING (AI_API_KEY is empty)' : 'present, ' . strlen($key) . ' characters, starts with "' . substr($key, 0, 4) . '"') . "\n";
if ($key !== '' && preg_match('/\s|[\'"]/', $key)) echo "WARNING  : the key contains a space or quote. Re-paste it with nothing around it.\n";
echo 'PHP curl : ' . (function_exists('curl_init') ? 'available' : 'NOT available (ask Hostinger to enable the curl extension)') . "\n";
echo 'Data dir : ' . (is_writable($c['DATA_DIR'] !== '' ? $c['DATA_DIR'] : __DIR__) ? 'writable' : 'NOT writable') . "\n\n";
if ($key === '' || !function_exists('curl_init')) exit;

$gptoss = strpos((string) $c['MODEL'], 'gpt-oss') !== false;
$payload = ['model' => $c['MODEL'], 'messages' => [['role' => 'user', 'content' => 'Say OK']],
            ($c['PROVIDER'] === 'openai' ? 'max_completion_tokens' : 'max_tokens') => $gptoss ? 300 : 5];
if ($gptoss) $payload['reasoning_effort'] = 'low';
$ch = curl_init($c['API_URL']);
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $key],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_TIMEOUT => 25]);
$res = curl_exec($ch); $st = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE); $err = curl_error($ch); curl_close($ch);

echo "Test call: HTTP $st" . ($err !== '' ? " (network error: $err)" : '') . "\n";
$body = is_string($res) ? str_replace($key, '[KEY]', $res) : '';
$j = json_decode($body, true);
$msg = $j['error']['message'] ?? (is_string($j['error'] ?? null) ? $j['error'] : '');
if ($msg !== '') echo "Provider says: " . mb_substr($msg, 0, 300) . "\n";
elseif ($st !== 200) echo 'Raw reply: ' . mb_substr(strip_tags($body), 0, 300) . "\n";
if ($st === 200) echo "Answer: " . ($j['choices'][0]['message']['content'] ?? '(empty)') . "\nRESULT: the AI works. If the chat still fails, tell me.\n";
else echo "\nWhat it means: 401 = wrong key; 403 = blocked by the provider's firewall; 400/404 = wrong model name; 429 = limit or no active account; 0 = your server cannot reach the provider.\n";
