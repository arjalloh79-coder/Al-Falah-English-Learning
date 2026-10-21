<?php
declare(strict_types=1);

// Al-Falah WhatsApp assistant: the webhook for the WhatsApp Business Platform (Cloud API).
// Meta sends every customer message here; we answer with the same assistant as the website chat.
// Safe by design: Meta's signature is checked, the OpenAI key never leaves config.php, spending is capped,
// and a person is always one tap away (HUMAN_WHATSAPP).

require __DIR__ . '/lib.php';

const WA_MAX_BODY = 262144;       // bytes accepted from Meta
const WA_MAX_CHARS = 600;         // customer message length forwarded to the model
const WA_MEMORY_SECONDS = 86400;  // conversation memory: 24 hours (the WhatsApp service window)

// ---- language helpers ------------------------------------------------------------------------
function wa_lang(string $t): string {
    $en = (int) preg_match_all('/\b(the|you|your|what|how|hello|hi|hey|please|thanks|thank|price|prices|much|does|can|could|want|need|help|website|and|is|are|my|do)\b/i', $t);
    $fr = (int) preg_match_all('/\b(le|la|les|un|une|des|vous|votre|bonjour|salut|merci|prix|combien|je|veux|voudrais|besoin|aide|site|et|est|sont|mon|ma|pour|quel|quels|quelle|comment|svp)\b/i', $t)
        + (preg_match('/[àâçéèêëîïôùûœ]/iu', $t) ? 2 : 0);
    return $en > $fr ? 'en' : 'fr';
}

function wa_t(string $key, string $lang): string {
    $human = 'https://wa.me/' . cfg()['HUMAN_WHATSAPP'];
    $M = [
        'nontext' => ['fr' => '🙂 Je ne lis que les messages texte pour le moment. Pouvez-vous écrire votre question ?',
                      'en' => '🙂 I can only read text messages for now. Could you type your question?'],
        'human'   => ['fr' => "Bien sûr ! Écrivez directement à notre équipe ici : $human",
                      'en' => "Of course! Message our team directly here: $human"],
        'limit'   => ['fr' => "Vous avez envoyé beaucoup de messages. Réessayez plus tard, ou écrivez à notre équipe : $human",
                      'en' => "You've sent a lot of messages. Please try again later, or message our team: $human"],
        'error'   => ['fr' => "Désolé, je ne peux pas répondre pour le moment. Écrivez à notre équipe : $human",
                      'en' => "Sorry, I can't answer right now. Please message our team: $human"],
        'forgot'  => ['fr' => "C'est fait : votre conversation avec l'assistant a été effacée.",
                      'en' => 'Done: your conversation with the assistant has been deleted.'],
        'footer'  => ['fr' => "🤖 Assistant IA d'Al-Falah (il peut se tromper). Tapez HUMAIN pour parler à une personne, STOP pour effacer la conversation.",
                      'en' => "🤖 Al-Falah's AI assistant (it can make mistakes). Type HUMAN to talk to a person, STOP to delete the conversation."],
    ];
    return $M[$key][$lang];
}

// '' = normal question, 'stop' = delete my conversation, 'human' = I want a person.
function wa_command(string $text): string {
    $t = mb_strtolower(trim($text));
    $t = trim((string) preg_replace('/\s+/u', ' ', (string) preg_replace("/[^\\p{L}\\p{N}' ]+/u", ' ', $t)));
    if (in_array($t, ['stop', 'arret', 'arrêt', 'arreter', 'arrêter', 'supprimer', 'supprimer mes donnees', 'supprimer mes données', 'delete', 'delete my data', 'effacer'], true)) return 'stop';
    if (in_array($t, ['humain', 'human', 'une personne', 'person', 'agent'], true)) return 'human';
    foreach (['parler a quelqu', 'parler à quelqu', 'parler a une personne', 'parler à une personne', 'parler a un humain', 'parler à un humain',
              'parler a un conseiller', 'parler à un conseiller', 'un vrai humain', 'une vraie personne', 'real person', 'talk to a human', 'talk to a person',
              'talk to someone', 'speak to a human', 'speak to a person', 'speak to someone', 'human agent'] as $p) {
        if (str_contains($t, $p)) return 'human';
    }
    return '';
}

// The model sometimes answers in markdown; WhatsApp has its own light formatting.
function wa_format(string $s): string {
    $s = (string) preg_replace('/\*\*(.+?)\*\*/su', '*$1*', $s);
    $s = (string) preg_replace('/^\s{0,3}#{1,6}\s*/mu', '', $s);
    $s = (string) preg_replace('/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/u', '$1 $2', $s);
    return trim(mb_substr($s, 0, 1500));
}

// ---- WhatsApp Cloud API ----------------------------------------------------------------------
function wa_send(string $to, string $body): bool {
    $c = cfg();
    $url = rtrim($c['WA_API_URL'], '/') . '/' . $c['WA_GRAPH_VERSION'] . '/' . $c['WA_PHONE_NUMBER_ID'] . '/messages';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode(['messaging_product' => 'whatsapp', 'recipient_type' => 'individual', 'to' => $to, 'type' => 'text',
            'text' => ['preview_url' => false, 'body' => mb_substr($body, 0, 4000)]], JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $c['WA_ACCESS_TOKEN']],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 20,
    ]);
    curl_exec($ch);
    $st = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($st < 200 || $st >= 300) { error_log('whatsapp send: status ' . $st); return false; }   // never log the token or the text
    return true;
}

// ---- short conversation memory (24 h, newest turns only; STOP deletes it) --------------------------
function wa_history(PDO $pdo, string $u): array {
    $turns = (int) cfg()['MEMORY_TURNS'];
    if ($turns <= 0) return [];
    $q = $pdo->prepare('SELECT role, body FROM wa_msgs WHERE u = ? AND ts > ? ORDER BY ts DESC, rowid DESC LIMIT ' . ($turns * 2));
    $q->execute([$u, time() - WA_MEMORY_SECONDS]);
    return array_reverse($q->fetchAll(PDO::FETCH_ASSOC));
}
function wa_remember(PDO $pdo, string $u, string $user, string $assistant): void {
    $turns = (int) cfg()['MEMORY_TURNS'];
    if ($turns <= 0) return;
    $now = time();
    $ins = $pdo->prepare('INSERT INTO wa_msgs(u, ts, role, body) VALUES(?, ?, ?, ?)');
    $ins->execute([$u, $now, 'user', $user]);
    $ins->execute([$u, $now, 'assistant', $assistant]);
    $pdo->prepare('DELETE FROM wa_msgs WHERE ts < ?')->execute([$now - WA_MEMORY_SECONDS]);
    $pdo->prepare('DELETE FROM wa_msgs WHERE u = ? AND rowid NOT IN (SELECT rowid FROM wa_msgs WHERE u = ? ORDER BY ts DESC, rowid DESC LIMIT ' . ($turns * 2) . ')')->execute([$u, $u]);
}

// ---- one customer message ----------------------------------------------------------------------
function wa_handle(PDO $pdo, array $m): void {
    $c = cfg();
    $id = (string) ($m['id'] ?? '');
    $from = (string) preg_replace('/\D/', '', (string) ($m['from'] ?? ''));
    if ($id === '' || $from === '') return;

    $seen = $pdo->prepare('INSERT OR IGNORE INTO wa_seen(id, ts) VALUES(?, ?)');
    $seen->execute([$id, time()]);
    if ($seen->rowCount() === 0) return;                                  // Meta retried this one: already handled
    $pdo->prepare('DELETE FROM wa_seen WHERE ts < ?')->execute([time() - 2 * 86400]);

    $u = scramble('wa:' . $from);                                          // the number itself is never stored
    $isText = ($m['type'] ?? '') === 'text';
    $text = $isText ? trim(mb_substr((string) preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string) ($m['text']['body'] ?? '')), 0, WA_MAX_CHARS)) : '';
    $lang = $isText ? wa_lang($text) : 'fr';

    if ($isText) {
        $cmd = wa_command($text);
        if ($cmd === 'stop') {
            $pdo->prepare('DELETE FROM wa_msgs WHERE u = ?')->execute([$u]);
            wa_send($from, wa_t('forgot', $lang));
            return;
        }
        if ($cmd === 'human') { wa_send($from, wa_t('human', $lang)); return; }
        if ($text === '') return;
    }

    // Spending protection (per customer, and for the whole WhatsApp channel).
    $r = check_limits($pdo, 'wa:', $u, (int) $c['WA_PER_USER_HOUR'], (int) $c['WA_PER_USER_DAY'], (int) $c['WA_GLOBAL_DAY']);
    if ($r !== 'ok') {
        $notice = $pdo->prepare('SELECT COUNT(*) FROM hits WHERE ip = ? AND ts > ?');
        $notice->execute(['n:' . $u, time() - 600]);
        if ((int) $notice->fetchColumn() === 0) {                          // tell them once per 10 minutes, then stay quiet
            $pdo->prepare('INSERT INTO hits(ip, ts) VALUES(?, ?)')->execute(['n:' . $u, time()]);
            wa_send($from, wa_t('limit', $lang));
        }
        return;
    }

    if (!$isText) { wa_send($from, wa_t('nontext', 'fr') . "\n\n" . wa_t('nontext', 'en')); return; }

    $history = wa_history($pdo, $u);
    $first = !$history;
    $msgs = [];
    foreach ($history as $h) $msgs[] = ['role' => $h['role'], 'content' => $h['body']];
    while ($msgs && $msgs[0]['role'] !== 'user') array_shift($msgs);
    $msgs[] = ['role' => 'user', 'content' => $text];

    [, $reply] = openai_reply($msgs, 'whatsapp');
    if ($reply === null) { wa_send($from, wa_t('error', $lang)); return; }
    $reply = wa_format($reply);
    if (wa_send($from, $reply . ($first ? "\n\n" . wa_t('footer', $lang) : ''))) wa_remember($pdo, $u, $text, $reply);
}

// ---- entry point ---------------------------------------------------------------------------
$c = cfg();
$method = $_SERVER['REQUEST_METHOD'] ?? '';

if ($method === 'GET') {                                                    // Meta checks the address once when you connect it
    $token = (string) ($_GET['hub_verify_token'] ?? '');
    if (($_GET['hub_mode'] ?? '') === 'subscribe' && $c['WA_VERIFY_TOKEN'] !== '' && hash_equals($c['WA_VERIFY_TOKEN'], $token)) {
        header('Content-Type: text/plain; charset=utf-8');
        echo (string) ($_GET['hub_challenge'] ?? '');
        exit;
    }
    http_response_code(403);
    exit;
}
if ($method !== 'POST') { http_response_code(405); exit; }
if ($c['OPENAI_API_KEY'] === '' || $c['WA_APP_SECRET'] === '' || $c['WA_ACCESS_TOKEN'] === '' || $c['WA_PHONE_NUMBER_ID'] === '') { http_response_code(503); exit; }

$raw = file_get_contents('php://input', false, null, 0, WA_MAX_BODY + 1);
if ($raw === false || strlen($raw) > WA_MAX_BODY) { http_response_code(413); exit; }
$expected = 'sha256=' . hash_hmac('sha256', $raw, $c['WA_APP_SECRET']);
if (!hash_equals($expected, (string) ($_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? ''))) { http_response_code(403); exit; }   // not from Meta
$j = json_decode($raw, true);

// Answer Meta straight away (it retries slow replies), then do the work.
ignore_user_abort(true);
http_response_code(200);
header('Content-Type: text/plain; charset=utf-8');
header('Content-Length: 2');
header('Connection: close');
echo 'ok';
if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
elseif (function_exists('litespeed_finish_request')) litespeed_finish_request();
else { while (ob_get_level() > 0) @ob_end_flush(); flush(); }
set_time_limit(90);

if (!is_array($j) || ($j['object'] ?? '') !== 'whatsapp_business_account') exit;
try {
    $pdo = db();
    foreach (($j['entry'] ?? []) as $entry) {
        foreach (($entry['changes'] ?? []) as $change) {
            $v = $change['value'] ?? [];
            if (($v['metadata']['phone_number_id'] ?? '') !== $c['WA_PHONE_NUMBER_ID']) continue;   // another number: not ours
            foreach (($v['messages'] ?? []) as $m) {                                               // "statuses" (delivered/read) are ignored
                if (is_array($m)) wa_handle($pdo, $m);
            }
        }
    }
} catch (Throwable $e) {
    error_log('whatsapp: ' . $e->getMessage());
}
