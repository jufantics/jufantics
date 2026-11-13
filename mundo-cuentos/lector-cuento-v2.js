(async function(){
  const params=new URLSearchParams(location.search);
  const slug=params.get('cuento')||'aventura-ninja';
  const $=id=>document.getElementById(id);
  const catalogUrl=new URL('cuentos-propios.json?v=repair-20261111-2',location.href);
  const stories=await fetch(catalogUrl,{cache:'reload'}).then(response=>response.json());
  const story=stories.find(item=>item.slug===slug)||stories[0];
  await window.JufanticsAccess?.prepare?.(story);
  if(!window.JufanticsAccess?.requireStory(story))return;

  const totalPages=Number(story.pages)||1;
  const baseUrl=new URL(`${story.contentRoot||'assets/cuentos'}/${story.slug}/`,location.href);
  const synth=window.speechSynthesis;
  let page=Math.max(1,Math.min(Number(params.get('pagina'))||1,totalPages));
  let texts={};
  let readingToken=0;
  let paused=false;
  let imageCandidates=[];
  let imageAttempt=0;

  function pageUrl(number){return new URL(`pagina-${number}.jpg`,baseUrl).href}
  function pageUrls(number){
    const file=`${story.slug}/pagina-${number}.jpg`;
    return [...new Set([
      pageUrl(number),
      new URL(`assets/cuentos/${file}`,location.href).href,
      new URL(`../assets/cuentos/${file}`,location.href).href,
      new URL(`/assets/cuentos/${file}`,location.origin).href,
    ])];
  }
  function loadPageImage(number,refresh=false){
    const image=$('pageImage');
    imageCandidates=pageUrls(number);
    imageAttempt=0;
    const url=imageCandidates[0];
    image.src=refresh?`${url}${url.includes('?')?'&':'?'}retry=${Date.now()}`:url;
  }
  async function loadTexts(){
    const candidates=[new URL('lectura.json',baseUrl),new URL('assets/reading-samples.json',location.href),new URL('../assets/reading-samples.json',location.href)];
    for(const url of candidates){
      try{
        const response=await fetch(url);
        if(!response.ok)continue;
        const data=await response.json();
        texts=url.pathname.endsWith('reading-samples.json')?(data[story.slug]||{}):data;
        if(Object.keys(texts).length)return;
      }catch(error){console.warn('Texto de lectura no disponible',url.href,error)}
    }
  }
  function populateVoices(){
    const voices=(window.JufanticsVoice?.list?.()||[]).filter(voice=>/^es\b/i.test(voice.lang||''));
    const all=voices.length?voices:(window.JufanticsVoice?.list?.()||[]);
    const preferred=window.JufanticsVoice?.choose?.();
    $('voiceSelect').innerHTML='';
    all.forEach(voice=>{
      const option=document.createElement('option');
      option.value=`${voice.name}|${voice.lang}`;
      option.textContent=`${voice.name} · ${voice.lang}`;
      option.selected=voice===preferred;
      $('voiceSelect').appendChild(option);
    });
    if(!$('voiceSelect').options.length)$('voiceSelect').innerHTML='<option value="">Voz del dispositivo</option>';
  }
  function selectedVoice(){
    const value=$('voiceSelect').value;
    return (window.JufanticsVoice?.list?.()||[]).find(voice=>`${voice.name}|${voice.lang}`===value)||window.JufanticsVoice?.choose?.();
  }
  function chunks(text){
    const sentences=(text||'').replace(/\s*\n\s*/g,' ').match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g)||[];
    const result=[];
    sentences.forEach(sentence=>{
      const clean=sentence.trim();
      if(!clean)return;
      if(clean.length<=240){result.push(clean);return}
      let part='';
      clean.split(/\s+/).forEach(word=>{if((part+' '+word).trim().length>220){result.push(part);part=word}else part=(part+' '+word).trim()});
      if(part)result.push(part);
    });
    return result;
  }
  function stopReading(update=true){
    readingToken++;
    synth?.cancel();
    paused=false;
    $('pauseVoice').textContent='⏸ Pausar';
    if(update)$('readerStatus').textContent='Lectura detenida.';
  }
  function render(){
    const image=$('pageImage');
    $('imageError').classList.add('hidden');
    $('retryImage').classList.add('hidden');
    loadPageImage(page);
    image.alt=`${story.title}, página ${page}`;
    $('pageLabel').textContent=page===1?'Portada':`Página ${page}`;
    $('pageProgress').textContent=`${page} / ${totalPages}`;
    $('pageNumber').value=page;
    $('prevPage').disabled=page===1;
    $('nextPage').disabled=page===totalPages;
    $('progressBar').style.width=`${page/totalPages*100}%`;
    const text=texts[String(page)]||'';
    $('pageText').textContent=text||'Texto accesible pendiente para esta página.';
    $('listenPage').disabled=!text;
    $('readerStatus').textContent=text?'Lista para escuchar esta página.':'La imagen está disponible; esta página aún no tiene narración preparada.';
    history.replaceState(null,'',`?cuento=${encodeURIComponent(story.slug)}&pagina=${page}`);
    if(page<totalPages){const preload=new Image();preload.src=pageUrls(page+1)[0]}
  }
  function move(delta,scroll=true){
    stopReading(false);
    page=Math.max(1,Math.min(totalPages,page+delta));
    render();
    if(scroll)document.querySelector('.reader').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  function speakCurrent(){
    const text=texts[String(page)];
    if(!synth||!text)return;
    stopReading(false);
    const token=++readingToken;
    const parts=chunks(text);
    const voice=selectedVoice();
    let index=0;
    $('readerStatus').textContent=`Escuchando la página ${page}${voice?` con ${voice.name}`:''}.`;
    const next=()=>{
      if(token!==readingToken)return;
      if(index>=parts.length){
        if($('continuousReading').checked&&page<totalPages){page++;render();setTimeout(speakCurrent,220)}
        else $('readerStatus').textContent=`Lectura de la página ${page} terminada.`;
        return;
      }
      const utterance=new SpeechSynthesisUtterance(parts[index++]);
      if(voice){utterance.voice=voice;utterance.lang=voice.lang||'es-419'}else utterance.lang='es-419';
      utterance.rate=.84;utterance.pitch=1.02;utterance.onend=next;
      utterance.onerror=event=>{if(event.error!=='canceled')$('readerStatus').textContent='La voz se interrumpió. Puedes volver a escuchar la página.'};
      synth.speak(utterance);
    };
    next();
  }
  function pauseReading(){
    if(!synth||(!synth.speaking&&!synth.paused))return;
    if(paused){synth.resume();paused=false;$('pauseVoice').textContent='⏸ Pausar';$('readerStatus').textContent=`Continuando la página ${page}.`}
    else{synth.pause();paused=true;$('pauseVoice').textContent='▶ Continuar';$('readerStatus').textContent='Lectura en pausa.'}
  }

  $('storyTitle').textContent=story.title;
  $('readerTitle').textContent=story.title;
  $('storyGenre').textContent=`${story.genre} · ${story.age} años`;
  $('storySubtitle').textContent=story.subtitle||'Una historia JUFANTICS para leer, escuchar e imaginar.';
  document.title=`${story.title} · JUFANTICS`;
  $('pageNumber').max=totalPages;
  $('activityLink').href=`experiencias.html?edad=${encodeURIComponent(story.age)}&cuento=${encodeURIComponent(story.slug)}`;
  $('prevPage').onclick=()=>move(-1);
  $('nextPage').onclick=()=>move(1);
  $('pageNumber').onchange=()=>{stopReading(false);page=Math.max(1,Math.min(totalPages,Number($('pageNumber').value)||1));render()};
  $('listenPage').onclick=speakCurrent;
  $('pauseVoice').onclick=pauseReading;
  $('stopVoice').onclick=()=>stopReading(true);
  $('retryImage').onclick=()=>loadPageImage(page,true);
  $('pageImage').onload=()=>{$('imageError').classList.add('hidden');$('retryImage').classList.add('hidden')};
  $('pageImage').onerror=()=>{
    imageAttempt++;
    if(imageAttempt<imageCandidates.length){$('pageImage').src=imageCandidates[imageAttempt];return}
    $('imageError').classList.remove('hidden');$('retryImage').classList.remove('hidden');$('readerStatus').textContent='No se pudo cargar la imagen. Comprueba la conexión y pulsa “Reintentar imagen”.';
  };
  document.addEventListener('keydown',event=>{if(event.target.matches('input,select,button,summary'))return;if(event.key==='ArrowLeft')move(-1,false);if(event.key==='ArrowRight')move(1,false)});
  document.addEventListener('contextmenu',event=>{if(event.target.closest('#pageImage'))event.preventDefault()});
  document.addEventListener('dragstart',event=>{if(event.target.closest('#pageImage'))event.preventDefault()});
  addEventListener('beforeunload',()=>synth?.cancel());

  await loadTexts();
  await window.JufanticsVoice?.ready?.();
  populateVoices();
  synth?.addEventListener?.('voiceschanged',populateVoices);
  render();
})();
