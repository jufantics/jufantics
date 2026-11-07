(function(){
  let installPrompt=null,registrationRef=null,applyingUpdate=false;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  function connectionNotice(){
    let notice=document.getElementById('jufanticsConnectionNotice');
    if(navigator.onLine){notice?.remove();return}
    if(notice)return;
    notice=document.createElement('aside');notice.id='jufanticsConnectionNotice';notice.setAttribute('role','status');notice.textContent='Sin conexión. Puedes seguir usando lo que ya se guardó en este dispositivo.';
    Object.assign(notice.style,{position:'fixed',left:'12px',right:'12px',bottom:'12px',zIndex:'9999',padding:'12px 16px',borderRadius:'14px',background:'#302a60',color:'#fff',fontWeight:'700',textAlign:'center',boxShadow:'0 8px 28px #0004'});document.body.appendChild(notice);
  }
  function updateNotice(){
    if(document.getElementById('jufanticsUpdateNotice'))return;
    const notice=document.createElement('aside');notice.id='jufanticsUpdateNotice';notice.setAttribute('role','status');notice.innerHTML='<span>Hay una versión corregida de JUFANTICS.</span> <button type="button">Actualizar ahora</button>';
    Object.assign(notice.style,{position:'fixed',left:'12px',right:'12px',bottom:'12px',zIndex:'9998',padding:'12px 16px',borderRadius:'14px',background:'#fff7e7',color:'#302a60',fontWeight:'700',textAlign:'center',boxShadow:'0 8px 28px #0004'});notice.querySelector('button').onclick=()=>{applyingUpdate=true;registrationRef?.waiting?.postMessage('SKIP_WAITING')};document.body.appendChild(notice);
  }
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;document.dispatchEvent(new CustomEvent('jufantics:pwa-ready'))});
  window.addEventListener('appinstalled',()=>{installPrompt=null;document.dispatchEvent(new CustomEvent('jufantics:pwa-installed'))});
  async function install(){
    if(standalone()){alert('JUFANTICS ya está instalado en este dispositivo.');return}
    if(!installPrompt){alert('En Android abre el menú del navegador y elige “Instalar aplicación” o “Agregar a pantalla principal”.');return}
    await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;
  }
  window.JufanticsPWA={install,isInstalled:standalone};
  addEventListener('online',connectionNotice);addEventListener('offline',connectionNotice);addEventListener('DOMContentLoaded',connectionNotice);
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    navigator.serviceWorker.addEventListener('controllerchange',()=>{document.dispatchEvent(new CustomEvent('jufantics:pwa-updated'));if(applyingUpdate)location.reload()});
    const registerWorker=()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(registration=>{
      registrationRef=registration;if(registration.waiting)updateNotice();
      registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)updateNotice()})});
      return registration.update();
    }).catch(()=>{});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',registerWorker,{once:true});else registerWorker();
  }
})();
