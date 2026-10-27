(function(){
  const totalPages=65;
  const $=id=>document.getElementById(id);
  const synth=window.speechSynthesis;
  let page=Math.max(1,Math.min(Number(new URLSearchParams(location.search).get('pagina'))||1,totalPages));
  let texts={};
  let readingToken=0;
  let paused=false;

  function pagePath(number){return `assets/cuentos/rio-un-lugar-cerquita/pagina-${number}.jpg`}
  function updateHistory(){history.replaceState(null,'',`?pagina=${page}`)}
  function render(){
    const image=$('pageImage');
    image.src=pagePath(page);
    image.alt=`Río, un lugar cerquita, página ${page}`;
    $('pageLabel').textContent=page===1?'Portada':`Página ${page}`;
    $('pageProgress').textContent=`${page} / ${totalPages}`;
    $('pageNumber').value=page;
    $('prevPage').disabled=page===1;
    $('nextPage').disabled=page===totalPages;
    $('progressBar').style.width=`${page/totalPages*100}%`;
    $('pageText').textContent=texts[String(page)]||'Texto accesible pendiente.';
    $('readerStatus').textContent='Lista para escuchar esta página.';
    updateHistory();
    if(page<totalPages){const preload=new Image();preload.src=pagePath(page+1)}
  }
  function move(delta,scroll=true){
    stopReading(false);
    page=Math.max(1,Math.min(totalPages,page+delta));
    render();
    if(scroll)document.querySelector('.rio-reader').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  function chunks(text){
    const sentences=(text||'').replace(/\s*\n\s*/g,' ').match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g)||[];
    const result=[];
    sentences.forEach(sentence=>{
      const clean=sentence.trim();
      if(!clean)return;
      if(clean.length<=240){result.push(clean);return}
      const words=clean.split(/\s+/);let part='';
      words.forEach(word=>{if((part+' '+word).trim().length>220){result.push(part);part=word}else part=(part+' '+word).trim()});
      if(part)result.push(part);
    });
    return result;
  }
  function selectedVoice(){
    const name=$('voiceSelect').value;
    return JufanticsVoice.list().find(voice=>`${voice.name}|${voice.lang}`===name)||JufanticsVoice.choose();
  }
  function populateVoices(){
    const voices=JufanticsVoice.list().filter(voice=>/^es\b/i.test(voice.lang||''));
    const preferred=JufanticsVoice.choose();
    $('voiceSelect').innerHTML='';
    (voices.length?voices:JufanticsVoice.list()).forEach(voice=>{
      const option=document.createElement('option');
      option.value=`${voice.name}|${voice.lang}`;
      option.textContent=`${voice.name} · ${voice.lang}`;
      option.selected=voice===preferred;
      $('voiceSelect').appendChild(option);
    });
    if(!$('voiceSelect').options.length)$('voiceSelect').innerHTML='<option value="">Voz del dispositivo</option>';
  }
  function speakCurrent(){
    if(!synth){$('readerStatus').textContent='Este navegador no ofrece lectura en voz alta.';return}
    const text=texts[String(page)];
    if(!text){$('readerStatus').textContent='Esta página no tiene texto disponible para narrar.';return}
    stopReading(false);
    const token=++readingToken;
    const parts=chunks(text);
    const voice=selectedVoice();
    let index=0;
    paused=false;
    $('pauseVoice').textContent='⏸ Pausar';
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
      utterance.rate=.84;utterance.pitch=1.02;utterance.volume=1;
      utterance.onend=next;
      utterance.onerror=event=>{if(event.error!=='canceled')$('readerStatus').textContent='La voz se interrumpió. Puedes volver a presionar “Escuchar página”.'};
      synth.speak(utterance);
    };
    next();
  }
  function stopReading(update=true){readingToken++;synth?.cancel();paused=false;$('pauseVoice').textContent='⏸ Pausar';if(update)$('readerStatus').textContent='Lectura detenida.'}
  function pauseReading(){
    if(!synth||!synth.speaking&&!synth.paused)return;
    if(paused){synth.resume();paused=false;$('pauseVoice').textContent='⏸ Pausar';$('readerStatus').textContent=`Continuando la página ${page}.`}
    else{synth.pause();paused=true;$('pauseVoice').textContent='▶ Continuar';$('readerStatus').textContent='Lectura en pausa.'}
  }
  async function init(){
    try{texts=await fetch('assets/cuentos/rio-un-lugar-cerquita/lectura.json').then(response=>{if(!response.ok)throw new Error('No se pudo cargar el texto');return response.json()})}
    catch(error){console.error(error);$('readerStatus').textContent='La lectura visual está disponible; el texto de narración no pudo cargarse.'}
    await JufanticsVoice.ready();
    populateVoices();
    synth?.addEventListener?.('voiceschanged',populateVoices);
    render();
  }
  $('prevPage').onclick=()=>move(-1);
  $('nextPage').onclick=()=>move(1);
  $('pageNumber').onchange=()=>{stopReading(false);page=Math.max(1,Math.min(totalPages,Number($('pageNumber').value)||1));render()};
  $('listenPage').onclick=speakCurrent;
  $('pauseVoice').onclick=pauseReading;
  $('stopVoice').onclick=()=>stopReading(true);
  $('backToTop').onclick=()=>scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  document.addEventListener('keydown',event=>{if(event.target.matches('input,select,button,summary'))return;if(event.key==='ArrowLeft')move(-1,false);if(event.key==='ArrowRight')move(1,false)});
  document.addEventListener('contextmenu',event=>{if(event.target.closest('#pageImage'))event.preventDefault()});
  document.addEventListener('dragstart',event=>{if(event.target.closest('#pageImage'))event.preventDefault()});
  addEventListener('beforeunload',()=>synth?.cancel());
  init();
})();
