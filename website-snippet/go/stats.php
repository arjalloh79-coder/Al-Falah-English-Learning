<?php
declare(strict_types=1);
// Private page: how many times each QR code was scanned, and a tool to make a new QR code for a new place.
require __DIR__ . '/lib.php';

header('Cache-Control: no-store, max-age=0');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');
$tok = (string) go_cfg()['STATS_TOKEN'];
$given = (string) ($_GET['t'] ?? '');
if ($tok === '' || strlen($tok) < 12) { http_response_code(404); echo 'Not found'; exit; }

$pdo = go_db();
$k = 'f:' . substr(hash('sha256', $GLOBALS['go_salt'] . go_ip()), 0, 16);
$f = $pdo->prepare('SELECT n, until FROM fails WHERE k = ?'); $f->execute([$k]); $fr = $f->fetch();
if ($fr && (int) $fr['until'] > time() && (int) $fr['n'] >= 8) { http_response_code(429); echo 'Too many attempts. Try again later.'; exit; }
if (!hash_equals($tok, $given)) {
    $pdo->prepare('INSERT INTO fails(k, n, until) VALUES(?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = CASE WHEN until < ? THEN 1 ELSE n + 1 END, until = ?')
        ->execute([$k, time() + 900, time(), time() + 900]);
    http_response_code(404); echo 'Not found'; exit;
}
$pdo->prepare('DELETE FROM fails WHERE k = ?')->execute([$k]);

$h = fn($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$today = date('Y-m-d'); $d7 = date('Y-m-d', strtotime('-6 days')); $d30 = date('Y-m-d', strtotime('-29 days'));
$rows = $pdo->query("SELECT code,
        SUM(n) total, SUM(CASE WHEN day = " . $pdo->quote($today) . " THEN n ELSE 0 END) t0,
        SUM(CASE WHEN day >= " . $pdo->quote($d7) . " THEN n ELSE 0 END) t7,
        SUM(CASE WHEN day >= " . $pdo->quote($d30) . " THEN n ELSE 0 END) t30, MAX(last) last
      FROM scans GROUP BY code ORDER BY total DESC, code")->fetchAll();

if (isset($_GET['csv'])) {
    header('Content-Type: text/csv; charset=utf-8'); header('Content-Disposition: attachment; filename="qr-scans-' . $today . '.csv"');
    $o = fopen('php://output', 'w'); fputcsv($o, ['code', 'today', 'last_7_days', 'last_30_days', 'total', 'last_scan']);
    foreach ($rows as $r) fputcsv($o, [$r['code'], $r['t0'], $r['t7'], $r['t30'], $r['total'], date('c', (int) $r['last'])]);
    exit;
}
$daily = $pdo->query("SELECT day, SUM(n) n FROM scans WHERE day >= " . $pdo->quote($d30) . " GROUP BY day ORDER BY day")->fetchAll(PDO::FETCH_KEY_PAIR);
$tot = ['t0' => 0, 't7' => 0, 't30' => 0, 'total' => 0];
foreach ($rows as $r) foreach ($tot as $kk => $_) $tot[$kk] += (int) $r[$kk];
$base = rtrim((string) go_cfg()['BASE'], '/');
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>QR scans · Al-Falah English</title>
<style>
:root{--bg:#0D1B2A;--card:#16293D;--line:#254260;--gold:#C9963A;--ivory:#F5EDD8;--mute:#b9ad90}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ivory);font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:900px;margin:0 auto;padding:24px 16px 60px}h1{font:700 26px Georgia,serif;color:var(--gold);margin:0 0 4px}h2{font-size:18px;margin:28px 0 10px;color:var(--gold)}
.mute{color:var(--mute);font-size:14px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}
.c{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}.c b{display:block;font-size:28px}.c span{color:var(--mute);font-size:13px}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
th,td{padding:10px 12px;text-align:right;border-bottom:1px solid var(--line)}th:first-child,td:first-child{text-align:left}th{font-size:12px;color:var(--mute);text-transform:uppercase;letter-spacing:.04em}
.bar{display:flex;align-items:flex-end;gap:3px;height:70px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px}.bar i{flex:1;background:var(--gold);border-radius:3px 3px 0 0;min-height:2px}
input,button,a.btn{font:inherit;border-radius:10px;border:1px solid var(--line);padding:10px 12px;background:var(--card);color:var(--ivory)}button,a.btn{background:var(--gold);color:#0D1B2A;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block}
.qr{margin-top:14px;display:flex;gap:16px;flex-wrap:wrap;align-items:center}.qr canvas{background:#fff;border-radius:12px;width:220px;height:220px}
code{background:#0b1522;padding:2px 6px;border-radius:6px;word-break:break-all}@media(max-width:600px){.cards{grid-template-columns:repeat(2,1fr)}th,td{padding:8px 6px;font-size:14px}}
</style></head><body><main>
<h1>QR scans</h1>
<p class="mute">How many times each QR code was opened. Times are Guinea time. The same phone opening the same code again within 30 minutes counts once, and link previews and robots are ignored.</p>
<div class="cards"><div class="c"><b><?= $tot['t0'] ?></b><span>today</span></div><div class="c"><b><?= $tot['t7'] ?></b><span>last 7 days</span></div><div class="c"><b><?= $tot['t30'] ?></b><span>last 30 days</span></div><div class="c"><b><?= $tot['total'] ?></b><span>all time</span></div></div>
<?php if ($daily): $mx = max($daily); ?><div class="bar" title="scans per day, last 30 days"><?php for ($i = 29; $i >= 0; $i--) { $d = date('Y-m-d', strtotime("-$i days")); $v = (int) ($daily[$d] ?? 0); echo '<i style="height:' . max(3, (int) round($v / $mx * 100)) . '%" title="' . $h($d) . ': ' . $v . '"></i>'; } ?></div><?php endif; ?>
<h2>By place</h2>
<?php if (!$rows): ?><p class="mute">No scans yet. Scan one of your codes with a phone to test it.</p><?php else: ?>
<table><tr><th>Place (code)</th><th>Today</th><th>7 days</th><th>30 days</th><th>Total</th><th>Last scan</th></tr>
<?php foreach ($rows as $r): ?><tr><td><b><?= $h($r['code']) ?></b></td><td><?= (int) $r['t0'] ?></td><td><?= (int) $r['t7'] ?></td><td><?= (int) $r['t30'] ?></td><td><?= (int) $r['total'] ?></td><td><?= $h(date('d M H:i', (int) $r['last'])) ?></td></tr><?php endforeach; ?>
</table><p><a class="btn" href="?t=<?= $h(rawurlencode($given)) ?>&csv=1">Download CSV</a></p><?php endif; ?>
<h2>Make a QR code for a new place</h2>
<p class="mute">Type a short name with letters, numbers and dashes (for example <code>ecole-kipe</code> or <code>marche-madina</code>). The code appears in the table above after its first scan.</p>
<form id="f" onsubmit="return mk()"><input id="code" placeholder="ecole-kipe" maxlength="30" autocomplete="off" required pattern="[a-z0-9][a-z0-9\-]{1,29}" style="min-width:240px"> <button>Make QR code</button></form>
<div class="qr" id="out" hidden><canvas id="cv" width="880" height="880"></canvas><div><p><b>Link inside the code:</b><br><code id="lnk"></code></p><a class="btn" id="dl" download="qr.png">Download PNG</a></div></div>
<script src="qrcode.min.js"></script>
<script>
var BASE = <?= json_encode($base) ?>;
function mk() {
  var c = document.getElementById('code').value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,29}$/.test(c)) { alert('Use 2 to 30 letters, numbers or dashes.'); return false; }
  var url = BASE + '/go/?c=' + c, q = qrcode(0, 'H'); q.addData(url); q.make();
  var n = q.getModuleCount(), m = 4, s = Math.floor(880 / (n + 2 * m)), W = (n + 2 * m) * s, cv = document.getElementById('cv'), x = cv.getContext('2d');
  cv.width = cv.height = W; x.fillStyle = '#fff'; x.fillRect(0, 0, W, W); x.fillStyle = '#0D1B2A';
  for (var r = 0; r < n; r++) for (var k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + m) * s, (r + m) * s, s, s);
  document.getElementById('lnk').textContent = url; var dl = document.getElementById('dl'); dl.href = cv.toDataURL('image/png'); dl.download = 'QR-' + c + '.png';
  document.getElementById('out').hidden = false; return false;
}
</script>
</main></body></html>
