<?php
// ONE-TIME setup: creates the database and your dashboard password. Delete this file when done.
define('AFEL', 1);
require __DIR__ . '/lib.php';
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
$msg = ''; $done = false;
$hashFile = data_dir() . '/admin.hash';
$token = (string) cfg()['SETUP_TOKEN'];

if (is_file($hashFile)) { $msg = 'Already set up. Delete setup.php from the server.'; $done = true; }
elseif (strlen($token) < 12) { $msg = 'Open config.php and set SETUP_TOKEN to a long random string (12+ characters), then reload this page.'; $done = true; }
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pw = (string) ($_POST['password'] ?? '');
    if (!hash_equals($token, (string) ($_POST['token'] ?? ''))) $msg = 'Wrong setup token.';
    elseif (strlen($pw) < 10) $msg = 'Password must be at least 10 characters.';
    elseif ($pw !== (string) ($_POST['password2'] ?? '')) $msg = 'Passwords do not match.';
    else {
        db();
        if (@file_put_contents($hashFile, password_hash($pw, PASSWORD_DEFAULT), LOCK_EX) === false) $msg = 'Could not write to the data/ folder. Check folder permissions (755).';
        else { $msg = 'Done! Now DELETE setup.php from the server, then open admin.php.'; $done = true; }
    }
}
?><!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Setup</title>
<style>body{font:17px system-ui;background:#0D1B2A;color:#F5EDD8;max-width:460px;margin:40px auto;padding:0 18px}input,button{width:100%;padding:12px;margin:6px 0 14px;font-size:17px;border-radius:10px;border:1px solid #254260;background:#16293D;color:#F5EDD8}button{background:#C9963A;color:#0D1B2A;font-weight:800;border:0}.m{background:#16293D;border-left:4px solid #C9963A;padding:12px;border-radius:8px}</style>
<h1>Dashboard setup</h1>
<?php if ($msg): ?><p class="m"><?= h($msg) ?></p><?php endif; ?>
<?php if (!$done): ?>
<form method="post">
  <label>Setup token (from config.php)</label><input name="token" type="password" required autocomplete="off">
  <label>Choose your dashboard password (10+ characters)</label><input name="password" type="password" required minlength="10" autocomplete="new-password">
  <label>Repeat password</label><input name="password2" type="password" required minlength="10" autocomplete="new-password">
  <button>Create</button>
</form>
<?php endif; ?>
