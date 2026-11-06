(function(){
  let installPrompt=null;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;document.dispatchEvent(new CustomEvent('jufantics:pwa-ready'))});
  window.addEventListener('appinstalled',()=>{installPrompt=null;document.dispatchEvent(new CustomEvent('jufantics:pwa-installed'))});
  async function install(){
    if(standalone()){alert('JUFANTICS ya está instalado en este dispositivo.');return}
    if(!installPrompt){alert('En Android abre el menú del navegador y elige “Instalar aplicación” o “Agregar a pantalla principal”.');return}
    await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;
  }
  window.JufanticsPWA={install,isInstalled:standalone};
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    navigator.serviceWorker.addEventListener('controllerchange',()=>document.dispatchEvent(new CustomEvent('jufantics:pwa-updated')));
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(registration=>registration.update()).catch(()=>{}));
  }
})();
