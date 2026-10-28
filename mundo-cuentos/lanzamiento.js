(function(){
  const WHATSAPP='51992786715';
  const monthly='S/ 9.90 al mes';
  const annual='S/ 50 al año';

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const whatsapp=(message)=>`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  const hasFamilyAccess=()=>Boolean(window.JufanticsAccount?.hasAccess?.());
  const isFreeStory=slug=>document.querySelector(`[data-owned-story="${CSS.escape(slug)}"]`)?.dataset.free==='true';
  const storyUrl=slug=>slug==='rio-un-lugar-cerquita'?'rio-cuento.html':`lector-cuento.html?cuento=${encodeURIComponent(slug)}`;
  const activityUrl=(slug,age='6-8')=>`experiencias.html?cuento=${encodeURIComponent(slug)}&edad=${encodeURIComponent(age)}`;

  function cancelStrayVoice(){
    if('speechSynthesis' in window)window.speechSynthesis.cancel();
  }

  function silenceReader(){
    cancelStrayVoice();
    const frame=document.querySelector('#lector iframe.readerframe');
    if(!frame||frame.src==='about:blank')return;
    try{
      frame.contentWindow?.speechSynthesis?.cancel();
      frame.contentDocument?.querySelectorAll('audio').forEach(audio=>{audio.pause();audio.currentTime=0});
    }catch(_){/* Protección adicional para el lector integrado. */}
  }

  function welcomeVideo(){
    if(document.getElementById('jufanticoWelcome'))return;
    document.body.classList.add('welcome-open');
    document.body.insertAdjacentHTML('afterbegin',`<section id="jufanticoWelcome" class="welcome-video" role="dialog" aria-modal="true" aria-labelledby="welcomeVideoTitle"><div class="welcome-video-card"><button class="welcome-close" id="welcomeClose" type="button" aria-label="Cerrar bienvenida">×</button><div class="welcome-video-copy"><span>JUFANTICS · Mundo de Cuentos</span><h1 id="welcomeVideoTitle">Jufántico te da la bienvenida</h1><p>Primero nos saludamos. Después se abre la plataforma tal como la conoces.</p></div><div class="welcome-media"><img src="jufantico_canon.png" alt="Jufántico, compañero lector de JUFANTICS"><video id="jufanticoWelcomeVideo" muted playsinline preload="metadata" poster="jufantico_canon.png" aria-label="Video de bienvenida de Jufántico"><source src="assets/jufantico-bienvenida.mp4" type="video/mp4"></video></div><div class="welcome-video-actions"><button class="btn gold" id="welcomeListen" type="button">🔊 Escuchar bienvenida</button><button class="btn light" id="welcomeEnter" type="button">Entrar a Mundo de Cuentos →</button><a class="btn alt" href="cuenta.html">Mi cuenta</a></div><p class="welcome-video-note" id="welcomeVideoNote">El navegador necesita un toque para reproducir sonido. Si el video tarda, Jufántico permanece visible y puedes entrar normalmente.</p></div></section>`);
    const overlay=document.getElementById('jufanticoWelcome');
    const video=document.getElementById('jufanticoWelcomeVideo');
    const close=()=>{video.pause();overlay.classList.add('closing');setTimeout(()=>{overlay.remove();document.body.classList.remove('welcome-open')},260)};
    document.getElementById('welcomeClose').onclick=close;
    document.getElementById('welcomeListen').onclick=()=>{cancelStrayVoice();video.muted=false;video.currentTime=0;video.play().then(()=>{document.getElementById('welcomeListen').textContent='⏸ Reproduciendo saludo'}).catch(()=>{document.getElementById('welcomeVideoNote').textContent='Este teléfono no pudo reproducir el saludo. Puedes entrar a Mundo de Cuentos sin perder ninguna función.'})};
    document.getElementById('welcomeEnter').onclick=close;
    video.addEventListener('ended',close,{once:true});
    video.addEventListener('playing',()=>overlay.classList.add('video-ready'),{once:true});
    video.addEventListener('error',()=>{overlay.classList.add('video-unavailable');document.getElementById('welcomeVideoNote').textContent='El saludo en video no está disponible en este teléfono. Jufántico sí te acompaña y puedes entrar normalmente.'},{once:true});
    video.play().catch(()=>{/* La imagen de Jufántico queda visible hasta que la familia elija entrar. */});
  }

  cancelStrayVoice();

  window.requestPremium=function(title='la biblioteca JUFANTICS',plan=''){
    if(window.JufanticsAccount?.hasAccess?.()&&!window.JufanticsAccount?.isAdult?.()){
      alert('Las consultas de pago se realizan únicamente desde el perfil adulto.');
      window.JufanticsAccount.open();return;
    }
    const dialog=document.getElementById('launchAccess');
    const selected=plan?` Me interesa el plan ${plan}.`:'';
    document.getElementById('launchStory').textContent=title;
    document.getElementById('launchWhatsApp').href=whatsapp(`Hola JUFANTICS. Deseo información para acceder a ${title}.${selected}`);
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  };
  window.openOwnedStory=slug=>{
    if(hasFamilyAccess()||isFreeStory(slug)){location.href=storyUrl(slug);return}
    const card=document.querySelector(`[data-owned-story="${CSS.escape(slug)}"]`);
    requestPremium(card?.querySelector('h3')?.textContent||'este cuento');
  };
  window.openOwnedActivities=(slug,age)=>{
    if(hasFamilyAccess()||isFreeStory(slug)){location.href=activityUrl(slug,age||document.querySelector(`[data-owned-story="${CSS.escape(slug)}"]`)?.dataset.v2Age);return}
    const card=document.querySelector(`[data-owned-story="${CSS.escape(slug)}"]`);
    requestPremium(card?.querySelector('h3')?.textContent||'este cuento');
  };

  function accessDialog(){
    if(document.getElementById('launchAccess'))return;
    document.body.insertAdjacentHTML('beforeend',`<dialog id="launchAccess" class="launch-dialog" aria-labelledby="launchAccessTitle"><button class="launch-close" aria-label="Cerrar" onclick="this.closest('dialog').close()">×</button><div class="eyebrow">Zona adulta · Acceso acompañado</div><h2 id="launchAccessTitle">Biblioteca JUFANTICS</h2><p><strong id="launchStory">Este cuento</strong> forma parte del catálogo propio. Sus páginas no se publican como archivos descargables.</p><div class="launch-mini-plans"><span>${monthly} · 1 perfil menor</span><span>${annual} · hasta 2 perfiles menores</span></div><p class="fine">El pago y los datos de acceso se gestionan solo con el adulto. La web no realiza cargos automáticos.</p><div class="actions"><a id="launchWhatsApp" class="btn gold" target="_blank" rel="noopener">Coordinar por WhatsApp</a><a class="btn alt" href="mailto:jufantics@gmail.com">Escribir a JUFANTICS</a><button class="btn light" onclick="this.closest('dialog').close()">Seguir explorando</button></div></dialog>`);
  }

  function subscription(){
    const home=document.getElementById('inicio');
    const anchor=home?.querySelector('.v2-quick');
    if(!anchor||home.querySelector('.launch-offer'))return;
    anchor.insertAdjacentHTML('afterend',`<section class="launch-offer section" aria-labelledby="launchOfferTitle"><div><div class="eyebrow">Elige cómo empezar</div><h2 id="launchOfferTitle">Una historia gratuita. Una biblioteca para seguir creciendo.</h2><p>Conoce <strong>Los tres cerditos</strong> con lectura, voz y actividades. Si deseas continuar con los cuentos propios, coordinamos el acceso contigo.</p></div><div class="launch-plans"><article><span>Cuenta de lector</span><h3>Acceso gratuito</h3><strong>S/ 0.00</strong><p>Cuento inicial y actividades incluidas.</p><button class="btn light" onclick="go('lector')">Comenzar</button></article><article class="recommended"><span>Acceso flexible</span><h3>Mensual</h3><strong>S/ 9.90</strong><p>Cuenta administradora y un perfil lector durante el mes.</p><button class="btn" onclick="requestPremium('la biblioteca completa','mensual de S/ 9.90')">Solicitar acceso</button></article><article><span>Mejor valor familiar</span><h3>Anual</h3><strong>S/ 50.00</strong><p>Cuenta administradora y hasta dos perfiles lectores durante un año.</p><button class="btn gold" onclick="requestPremium('la biblioteca completa','anual de S/ 50')">Elegir anual</button></article></div><div class="actions"><button class="btn alt" type="button" onclick="JufanticsPWA.install()">📲 Instalar JUFANTICS</button></div><p class="fine">Lanzamiento con confirmación manual. No se activa ninguna renovación ni cargo desde esta página.</p></section>`);
  }

  function lockPremiumCards(){
    document.querySelectorAll('[data-owned-story]').forEach(card=>{
      const slug=card.dataset.ownedStory,free=card.dataset.free==='true',active=hasFamilyAccess();
      const status=card.querySelector('.v2-status');
      const actions=card.querySelector('.actions');
      if(free){if(status)status.textContent='Lectura gratuita';return}
      if(active){
        card.dataset.launchLocked='false';
        if(status)status.textContent='Cuenta familiar activa · Lectura habilitada';
        if(actions)actions.innerHTML=`<button class="btn" onclick="openOwnedStory('${esc(slug)}')">Leer</button><button class="btn alt" onclick="openOwnedActivities('${esc(slug)}','${esc(card.dataset.v2Age||'6-8')}')">Actividades</button>`;
      }else{
        card.dataset.launchLocked='true';
        if(status)status.textContent='Catálogo propio · Acceso protegido';
        if(actions)actions.innerHTML=`<button class="btn" onclick="requestPremium('${esc(card.querySelector('h3')?.textContent)}')">Ver opciones de acceso</button>`;
      }
    });
  }

  function publicLibrary(){
    lockPremiumCards();
    const shelf=document.querySelector('.v2-library');
    if(shelf&&!shelf.dataset.launchObserved){
      shelf.dataset.launchObserved='true';
      new MutationObserver(lockPremiumCards).observe(shelf,{childList:true,subtree:true});
    }
    const note=document.querySelector('.v2-shelf-note');
    if(note)note.innerHTML='<h3>Una biblioteca cuidada, no una carpeta de descargas</h3><p>Los cuentos propios se leen dentro de la experiencia JUFANTICS. El cuento piloto es gratuito; los demás se habilitan con acceso confirmado. Los libros de terceros solo aparecen como referencias editoriales mientras se verifican derechos.</p><div class="v2-audit"><span>1 experiencia gratuita</span><span>13 historias propias</span><span>0 libros de terceros publicados</span></div>';
    const intro=document.querySelector('#biblioteca .v4-policy');
    if(intro)intro.innerHTML='<strong>Lectura en pantalla.</strong> Los libros no incluyen descarga. Puedes conservar únicamente tus dibujos, textos, diplomas y creaciones propias.';
    const ownStories=document.querySelector('.v2-featured-book .v2-book-body p');
    if(ownStories)ownStories.textContent='Las historias propias forman parte del catálogo protegido. Puedes conocer sus portadas y solicitar acceso; sus páginas no se ofrecen como archivos descargables.';
    const comic=document.querySelector('#comics .v4-card');
    if(comic){
      const comicActions=comic.querySelector('.actions');
      if(comicActions)comicActions.innerHTML=hasFamilyAccess()?'<button class="btn" onclick="openOwnedStory(\'nico-comic\')">Leer</button><button class="btn alt" onclick="openOwnedActivities(\'nico-comic\',\'6-8\')">Actividades</button>':'<button class="btn" onclick="requestPremium(\'Nico · Cómic de fútbol\')">Ver opciones de acceso</button>';
    }
  }

  async function publicDomain(){
    if(document.getElementById('dominio-publico'))return;
    const main=document.querySelector('main.container');
    const family=document.getElementById('familia');
    const section=document.createElement('section');
    section.id='dominio-publico';section.className='page';
    section.innerHTML='<div class="eyebrow">Biblioteca clásica en preparación</div><h2>Historias que podemos volver a contar con una voz propia.</h2><p class="lead">Estas obras originales son candidatas de dominio público en Perú. Cada edición JUFANTICS tendrá texto adaptado, ilustraciones, narración, música y actividades propias.</p><div class="v4-policy"><strong>Importante:</strong> que la obra original sea de dominio público no autoriza copiar una traducción, portada, ilustración, audio o edición moderna. Cada archivo se revisa antes de publicarse.</div><div id="publicDomainGrid" class="public-domain-grid" aria-live="polite"></div>';
    main.insertBefore(section,family||main.querySelector('.footer'));
    const nav=document.querySelector('.nav');
    const button=document.createElement('button');button.dataset.page='dominio-publico';button.textContent='Clásicos';button.onclick=()=>go('dominio-publico');
    nav.insertBefore(button,nav.querySelector('[data-page="familia"]')||null);
    try{
      const items=await fetch('dominio-publico.json').then(response=>response.json());
      document.getElementById('publicDomainGrid').innerHTML=items.map(item=>`<article><span>${esc(item.origin)}</span><h3>${esc(item.title)}</h3><p>${esc(item.author)} · ${esc(item.life)}</p><small>${esc(item.route)}</small><b>Adaptación JUFANTICS en preparación</b></article>`).join('');
    }catch(error){document.getElementById('publicDomainGrid').textContent='El catálogo clásico no pudo cargarse.'}
  }

  function launchCopy(){
    document.title='JUFANTICS · Mundo de Cuentos';
    const privateNote=document.querySelector('#inicio .fine');
    if(privateNote)privateNote.textContent='Prueba gratuita disponible · Acceso premium coordinado de forma personal y sin cargos automáticos.';
    const readerNote=document.querySelector('#lector .fine');
    if(readerNote)readerNote.textContent='La narración utiliza la voz disponible en tu dispositivo. El cuento y sus actividades permanecen dentro de la plataforma.';
    const footer=document.querySelector('.footer');
    if(footer)footer.innerHTML='JUFANTICS — La imaginación cobra vida · Lectura protegida · <a href="mailto:jufantics@gmail.com">jufantics@gmail.com</a> · <a href="https://wa.me/51992786715" target="_blank" rel="noopener">WhatsApp</a>';
    const guide=document.querySelector('.nav [data-page="lecturas"]');
    if(guide)guide.textContent='Guía de 60';
  }

  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{
    cancelStrayVoice();welcomeVideo();accessDialog();subscription();publicLibrary();publicDomain();launchCopy();
    const frame=document.querySelector('#lector iframe.readerframe');
    frame?.addEventListener('load',silenceReader);
    const originalGo=window.go;
    window.go=function(name){if(name!=='lector')silenceReader();return originalGo(name)};
  },80));
  document.addEventListener('jufantics:account-changed',()=>{lockPremiumCards();publicLibrary()});
  window.addEventListener('pagehide',silenceReader);
})();
