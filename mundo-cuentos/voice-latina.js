(function(){
  const preferredNames=[/dalia/i,/sabina/i,/paulina/i,/m[oó]nica/i,/luciana/i,/elvira/i,/sof[ií]a/i,/paloma/i,/laura/i,/natural/i,/latino/i];
  const preferredLangs=['es-419','es-MX','es-US','es-PE','es-CO','es-CL','es-AR','es-ES'];
  const list=()=>('speechSynthesis' in window?window.speechSynthesis.getVoices():[]);
  function score(voice){
    const lang=(voice.lang||'').replace('_','-');let value=0;
    const langIndex=preferredLangs.findIndex(item=>item.toLowerCase()===lang.toLowerCase());
    if(langIndex>=0)value+=100-langIndex*7;else if(/^es\b/i.test(lang))value+=30;
    const nameIndex=preferredNames.findIndex(pattern=>pattern.test(voice.name||''));
    if(nameIndex>=0)value+=80-nameIndex*4;
    if(/jorge|pablo|raul|raúl|male/i.test(voice.name||''))value-=20;
    if(voice.localService)value+=4;return value;
  }
  function choose(){return list().filter(v=>/^es\b/i.test(v.lang||'')).sort((a,b)=>score(b)-score(a))[0]||list()[0]||null}
  function ready(){if(list().length)return Promise.resolve();return new Promise(resolve=>{let done=false;const finish=()=>{if(!done){done=true;resolve()}};speechSynthesis.addEventListener?.('voiceschanged',finish,{once:true});setTimeout(finish,700)})}
  async function enqueue(utterance,options={}){
    if(!('speechSynthesis' in window))return false;await ready();const voice=choose();
    if(voice){utterance.voice=voice;utterance.lang=voice.lang||'es-419'}else utterance.lang='es-419';
    utterance.rate=options.rate??.86;utterance.pitch=options.pitch??1.03;utterance.volume=options.volume??1;
    speechSynthesis.speak(utterance);return true;
  }
  function speak(text,options={}){if(!text||!('speechSynthesis' in window))return null;if(options.cancel!==false)speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);enqueue(u,options);return u}
  window.JufanticsVoice={list,choose,ready,enqueue,speak};
})();
