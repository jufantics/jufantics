const CACHE='jufantics-pwa-20261028-2';
const SHELL=['./','./index.html','./cuenta.html','./offline.html','./manifest.webmanifest','./logo.jpg','./jufantico_canon.png','./visual-v2.css','./visual-v4.css','./lanzamiento.css','./cuenta-familiar.css','./visual-v2.js','./visual-v4.js','./voice-latina.js','./cuenta-familiar.js','./lanzamiento.js','./pwa-register.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(async()=>await caches.match(request)||await caches.match('./index.html')||await caches.match('./offline.html')));return;
  }
  if(['script','style','worker'].includes(request.destination)||url.pathname.endsWith('.webmanifest')){
    event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response}).catch(()=>caches.match(request)));return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response})));
});
