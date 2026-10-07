(function(){
'use strict';
const audio=document.getElementById('pageAudio'),status=document.getElementById('narrationStatus'),continuous=document.getElementById('audioContinue');
const assetOrigin='https://jufantics-revision-editorial.jufantics.chatgpt.site/';
let manifest={},version=0,current=null,started=false;
fetch(assetOrigin+'assets/narration/manifest.json').then(r=>{if(!r.ok)throw Error('manifest');return r.json();}).then(data=>{manifest=data;if(current)update(current.story,current.page,current.total);}).catch(()=>{status.textContent='No se pudo cargar la narración. Vuelve a abrir el libro.';});
function stop(){if(window.jufDeviceReading)window.jufDeviceReading.stop();version++;audio.pause();audio.removeAttribute('src');audio.load();audio.hidden=true;current=null;}
function update(story,page,total){stop();current={story,page,total};const entry=manifest[story]?.pages?.[String(page)];document.getElementById('audioContinueLabel').hidden=!entry;if(!entry){status.textContent='Cargando narración…';return;}
const token=version;audio.src=new URL(entry.src,assetOrigin).href;audio.hidden=false;status.textContent=entry.label||('Escuchar página '+page);if(window.jufDeviceReading)window.jufDeviceReading.hide();audio.onerror=()=>{if(token===version){audio.hidden=true;status.textContent='No se pudo cargar el audio. Vuelve a abrir la página.';}};if(continuous.checked&&started)audio.play().catch(()=>{if(token===version)status.textContent='Pulsa reproducir para escuchar y avanzar con la lectura.';});}
audio.addEventListener('play',()=>{started=true;});audio.addEventListener('ended',()=>{if(continuous.checked&&current&&current.page<current.total)document.getElementById('nxVNext').click();});
window.jufAudio={stop:stop,begin:function(){started=true;},close:function(){stop();started=false;},page:update,current:function(){return current;}};
window.addEventListener('pagehide',()=>{stop();started=false;});
})();
