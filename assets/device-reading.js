(function(){
'use strict';
const read=document.getElementById('deviceRead');
const stopButton=document.getElementById('deviceStop');
const select=document.getElementById('deviceVoice');
const voiceLabel=document.getElementById('deviceVoiceLabel');
const status=document.getElementById('narrationStatus');
const continuous=document.getElementById('audioContinue');
const continuousLabel=document.getElementById('audioContinueLabel');
const supported='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
let samples={},current=null,voices=[],utterance=null,generation=0,autoChain=false;

function stop(resetChain){
  generation++;
  if(supported)window.speechSynthesis.cancel();
  utterance=null;
  stopButton.hidden=true;
  stopButton.textContent='Pausar lectura';
  read.textContent='Escuchar página';
  if(resetChain)autoChain=false;
}

function listVoices(){
  if(!supported)return;
  const previous=select.value;
  voices=window.speechSynthesis.getVoices().filter(v=>/^es(?:-|_)/i.test(v.lang)||v.lang==='es');
  voices.sort((a,b)=>{
    const rank=v=>/^es[-_]PE/i.test(v.lang)?0:/^es[-_](MX|US|419)/i.test(v.lang)?1:2;
    return rank(a)-rank(b);
  });
  select.replaceChildren();
  voices.forEach(v=>{
    const option=document.createElement('option');
    option.value=v.voiceURI;
    option.textContent=v.name+' ('+v.lang+')';
    select.appendChild(option);
  });
  if(voices.some(v=>v.voiceURI===previous))select.value=previous;
  if(current)show(current.story,current.page,current.total);
}

function speakCurrent(){
  if(!current||!supported)return;
  const text=samples[current.story]?.[String(current.page)];
  if(!text)return;
  stop(false);
  const token=generation;
  utterance=new SpeechSynthesisUtterance(text);
  utterance.lang='es-PE';
  utterance.rate=.9;
  utterance.pitch=1;
  const chosen=voices.find(v=>v.voiceURI===select.value);
  if(chosen)utterance.voice=chosen;
  utterance.onend=()=>{
    if(token!==generation)return;
    stopButton.hidden=true;
    stopButton.textContent='Pausar lectura';
    read.textContent='Escuchar página';
    if(autoChain&&continuous.checked&&current&&current.page<current.total){
      document.getElementById('nxVNext').click();
    }else{
      autoChain=false;
    }
  };
  utterance.onerror=e=>{
    if(token===generation&&e.error!=='canceled'&&e.error!=='interrupted'){
      status.textContent='Esta voz no pudo reproducirse. Prueba otra voz del dispositivo.';
      stopButton.hidden=true;
      autoChain=false;
    }
  };
  window.speechSynthesis.speak(utterance);
  stopButton.hidden=false;
  read.textContent='Reiniciar lectura';
  status.textContent='Narración gratuita con la voz de tu dispositivo.';
}

function show(story,page,total){
  current={story,page,total};
  const text=samples[story]?.[String(page)];
  read.hidden=!supported||!text;
  voiceLabel.hidden=read.hidden||!voices.length;
  if(text&&supported){
    continuousLabel.hidden=false;
    status.textContent='Escuchar esta página con la voz de tu dispositivo.';
    if(autoChain&&continuous.checked)setTimeout(speakCurrent,180);
  }
}

read.addEventListener('click',()=>{
  if(!current||!supported)return;
  if(window.speechSynthesis.paused){
    window.speechSynthesis.resume();
    read.textContent='Reiniciar lectura';
    stopButton.hidden=false;
    stopButton.textContent='Pausar lectura';
    return;
  }
  autoChain=true;
  speakCurrent();
});

stopButton.addEventListener('click',()=>{
  if(!supported)return;
  if(window.speechSynthesis.paused){
    window.speechSynthesis.resume();
    stopButton.textContent='Pausar lectura';
    read.textContent='Reiniciar lectura';
  }else{
    window.speechSynthesis.pause();
    stopButton.textContent='Continuar lectura';
    read.textContent='Continuar lectura';
  }
});

select.addEventListener('change',()=>stop(false));
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop(true);});
window.addEventListener('pagehide',()=>stop(true));

window.jufDeviceReading={
  stop:()=>stop(false),
  close:()=>{stop(true);current=null;read.hidden=true;voiceLabel.hidden=true;},
  page:show,
  hide:()=>{stop(true);current=null;read.hidden=true;voiceLabel.hidden=true;}
};

if(supported){
  window.speechSynthesis.addEventListener('voiceschanged',listVoices);
  listVoices();
}

fetch('assets/reading-samples.json')
  .then(r=>{if(!r.ok)throw Error('samples');return r.json();})
  .then(data=>{
    samples=data;
    const state=window.jufAudio?.current();
    if(state)show(state.story,state.page,state.total);
  })
  .catch(()=>{});
})();
