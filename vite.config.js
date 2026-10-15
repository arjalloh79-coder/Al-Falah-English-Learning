import { defineConfig } from 'vite';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

// Emits dist/sw.js: precaches every built file → whole app works offline after the first visit.
function offlineSW() {
  let outDir;
  return {
    name: 'offline-sw',
    apply: 'build',
    configResolved(c) { outDir = join(c.root, c.build.outDir); },
    closeBundle() {
      const files = [];
      (function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push('./' + relative(outDir, p)); } })(outDir);
      const list = files.filter((f) => f !== './sw.js');
      const ver = createHash('sha1').update(list.join() + list.map((f) => statSync(join(outDir, f)).size).join()).digest('hex').slice(0, 8);
      writeFileSync(join(outDir, 'sw.js'), `const V='anglais-gn-${ver}';const FILES=${JSON.stringify(['./', ...list])};
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):Response.error())))});
`);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [offlineSW()],
  build: { target: 'es2019', cssMinify: true, assetsInlineLimit: 4096, chunkSizeWarningLimit: 100 },
});
