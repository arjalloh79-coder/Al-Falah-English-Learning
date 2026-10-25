<?php
declare(strict_types=1);
// QR scan counter + redirect:  https://al-falahmarketing.com/go/?c=ecole-1  ->  counts one scan, then opens the English app.
require __DIR__ . '/lib.php';

$code = strtolower(trim((string) ($_GET['c'] ?? '')));
$dest = (string) go_cfg()['DEST'];
$valid = go_code_ok($code);
if ($valid && go_should_count()) {
    try { go_count($code); } catch (Throwable $e) { error_log('go count: ' . $e->getMessage()); }   // never block the visitor
}
$target = $dest . (strpos($dest, '?') === false ? '?' : '&') . 'src=' . ($valid ? $code : 'qr');
header('Cache-Control: no-store, max-age=0');
header('X-Robots-Tag: noindex, nofollow');
header('Location: ' . $target, true, 302);
echo '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Al-Falah English</title><a href="' . htmlspecialchars($target, ENT_QUOTES, 'UTF-8') . '">Al-Falah English</a>';
