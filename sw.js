// Code files: network first, saved copy when offline. Heavy assets are NOT cached here (APK has them / browser cache).
const C='rr-code-v1';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  if(/^\/(assets|assets_lite|sounds)\//.test(u.pathname))return;
  e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(C).then(x=>x.put(r,c))}return res}).catch(()=>caches.match(r,{ignoreSearch:true})));
});
