(async function(){
  const params=new URLSearchParams(location.search);
  const slug=params.get('cuento')||'aventura-ninja';
  const $stories=await fetch('cuentos-propios.json').then(r=>r.json());
  const story=$stories.find(item=>item.slug===slug)||$stories[0];
  const storySamples=await fetch(`assets/cuentos/${story.slug}/lectura.json`).then(r=>r.ok?r.json():{}).catch(()=>({}));
  const sharedSamples=await fetch('assets/reading-samples.json').then(r=>r.json()).catch(()=>({}));
  const samples=Object.keys(storySamples).length?storySamples:(sharedSamples[story.slug]||{});
  let page=Math.max(1,Math.min(Number(params.get('pagina'))||1,story.pages));
  const $=id=>document.getElementById(id);
  const image=$('pageImage');
  $('storyTitle').textContent=story.title;
  $('storyGenre').textContent=`${story.genre} · ${story.age} años`;
  document.title=`${story.title} · JUFANTICS`;
  $('pageNumber').max=story.pages;
  $('activityLink').href=`experiencias.html?edad=${encodeURIComponent(story.age)}&cuento=${encodeURIComponent(story.slug)}`;

  function imagePath(n){return `assets/cuentos/${story.slug}/pagina-${n}.jpg`}
  function render(){
    image.src=imagePath(page);
    document.documentElement.style.setProperty('--page-bg',`url('${imagePath(page)}')`);
    image.alt=`${story.title}, página ${page}`;
    $('pageLabel').textContent=`Página ${page}`;
    $('pageProgress').textContent=`${page} / ${story.pages}`;
    $('pageNumber').value=page;
    $('progressBar').style.width=`${page/story.pages*100}%`;
    $('prevPage').disabled=page===1;
    $('nextPage').disabled=page===story.pages;
    const hasText=Boolean(samples[String(page)]);
    $('listenPage').disabled=!hasText;
    $('listenPage').textContent=hasText?'🔊 Narración suave':'🔇 Audio pendiente';
    $('readerStatus').textContent=hasText?'Narración calmada y expresiva, preparada para acompañar la emoción de esta escena.':'Esta página no contiene narración.';
    history.replaceState(null,'',`?cuento=${encodeURIComponent(story.slug)}&pagina=${page}`);
  }
  function move(delta){page=Math.max(1,Math.min(story.pages,page+delta));speechSynthesis?.cancel();render()}
  $('prevPage').onclick=()=>move(-1);$('nextPage').onclick=()=>move(1);
  $('pageNumber').onchange=()=>{page=Math.max(1,Math.min(story.pages,Number($('pageNumber').value)||1));render()};
  $('listenPage').onclick=()=>{const text=samples[String(page)];if(!text||!('speechSynthesis'in window))return;const voice=JufanticsVoice?.choose?.();$('readerStatus').textContent=voice?`Escuchando con una voz suave: ${voice.name}.`:'Buscando una voz suave en español latino.';JufanticsVoice?.speak(text,{rate:.82,pitch:1.01})};
  $('stopVoice').onclick=()=>speechSynthesis?.cancel();
  document.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')move(-1);if(event.key==='ArrowRight')move(1)});
  image.onerror=()=>{$('readerStatus').textContent='La imagen de esta página está pendiente de revisión editorial.'};
  document.addEventListener('contextmenu',event=>{if(event.target.closest('#pageImage'))event.preventDefault()});
  document.addEventListener('dragstart',event=>{if(event.target.closest('#pageImage'))event.preventDefault()});
  render();
})();
