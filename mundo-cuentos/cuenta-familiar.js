(function(){
  const KEY='jufantics_family_test_v1';
  const PROFILE_KEY='jufantics_active_profile_v1';
  const TEST_CODE='JUFANTICS-PRUEBA-100';
  const PUBLIC_EMAIL='jufantics@gmail.com';
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const uniqueAliases=items=>Array.from(new Set(items.map(item=>typeof item==='string'?item.trim():String(item?.alias||'').trim()).filter(Boolean)));
  function normalize(raw){
    if(!raw)return null;
    const aliases=uniqueAliases([...(raw.readers||[]),raw.reader]).slice(0,raw.profileLimit||2);
    const plan=raw.plan?.startsWith('monthly')?'monthly-test':'annual-family-test';
    const profileLimit=plan==='monthly-test'?1:2;
    return {...raw,plan,profileLimit,readers:aliases.slice(0,profileLimit),reader:aliases[0]||'',status:raw.status||'active-test'};
  }
  const get=()=>{try{return normalize(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{return null}};
  const save=account=>localStorage.setItem(KEY,JSON.stringify(normalize(account)));
  const active=()=>{try{return JSON.parse(sessionStorage.getItem(PROFILE_KEY)||'null')||{type:'adult'}}catch{return {type:'adult'}}};
  const setActive=profile=>{sessionStorage.setItem(PROFILE_KEY,JSON.stringify(profile));notify()};
  const hasAccess=()=>get()?.status==='active-test';
  const isAdult=()=>active().type!=='minor';
  const canPersonalize=()=>hasAccess()&&isAdult();
  const notify=()=>document.dispatchEvent(new CustomEvent('jufantics:account-changed',{detail:{account:get(),profile:active()}}));
  const expiry=plan=>{const date=new Date();plan==='monthly-test'?date.setMonth(date.getMonth()+1):date.setFullYear(date.getFullYear()+1);return date.toLocaleDateString('es-PE',{day:'2-digit',month:'long',year:'numeric'})};
  async function hashPin(pin){
    if(!window.crypto?.subtle)return btoa(pin);
    const bytes=await window.crypto.subtle.digest('SHA-256',new TextEncoder().encode(`JUFANTICS:${pin}`));
    return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');
  }
  function remove(){localStorage.removeItem(KEY);sessionStorage.removeItem(PROFILE_KEY);render();notify()}
  function priceFor(plan){return plan==='monthly-test'?{label:'Mensual',regular:9.9,limit:1}:{label:'Anual familiar',regular:50,limit:2}}
  function form(){return `<div class="account-panel"><div class="eyebrow">Activación local para pruebas</div><h2>Crear la primera cuenta familiar</h2><p>El correo pertenece únicamente al adulto. Los menores entran con un <strong>alias</strong>: no necesitan correo, teléfono ni nombre completo.</p><form id="testAccountForm"><fieldset class="account-plan-choice"><legend>Elige el plan que deseas probar</legend><label><input type="radio" name="accountPlan" value="monthly-test"> <strong>Mensual</strong><span>1 adulto + 1 perfil menor · S/ 9.90</span></label><label><input type="radio" name="accountPlan" value="annual-family-test" checked> <strong>Anual familiar</strong><span>1 adulto + 2 perfiles menores · S/ 50.00</span></label></fieldset><div class="account-grid"><div class="fieldblock"><label for="accountAdult">Adulto responsable</label><input id="accountAdult" required autocomplete="name" placeholder="Ejemplo: Mamá Lisseth"></div><div class="fieldblock"><label for="accountEmail">Correo privado del adulto</label><input id="accountEmail" type="email" required autocomplete="email" placeholder="Solo se usa para el acceso adulto"></div><div class="fieldblock"><label for="accountReader">Alias del menor 1</label><input id="accountReader" required autocomplete="off" placeholder="Ejemplo: Facundo"></div><div class="fieldblock" id="reader2Field"><label for="accountReader2">Alias del menor 2 <span class="account-local">(opcional)</span></label><input id="accountReader2" autocomplete="off" placeholder="Sin correo ni datos personales"></div><div class="fieldblock"><label for="accountPin">PIN adulto de 4 dígitos</label><input id="accountPin" type="password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" required autocomplete="new-password" placeholder="••••"><small>Protege pagos, cuenta y personalización en este dispositivo.</small></div><div class="fieldblock"><label for="accountCode">Código de pruebas</label><input id="accountCode" class="account-code" required autocomplete="off" placeholder="JUFANTICS-PRUEBA-100"></div></div><div class="account-plan" id="accountPlanSummary"></div><label class="flex fine"><input id="accountConfirm" type="checkbox" required> Comprendo que esta es una simulación local, sin compra, renovación ni cargo.</label><div class="actions"><button class="btn gold" type="submit">Activar cuenta de prueba</button></div><p class="account-warning"><strong>Prueba local:</strong> esta cuenta vive solo en este navegador. La sincronización segura entre dispositivos se incorporará con el servicio de acceso definitivo.</p></form></div>`}
  function summary(plan){const info=priceFor(plan);return `<article><span>Plan seleccionado</span><strong>${info.label}</strong><small>Hasta ${info.limit} perfil${info.limit>1?'es':''} menor${info.limit>1?'es':''}</small></article><article><span>Descuento de pruebas</span><strong>100 %</strong><small>Descuento: −S/ ${info.regular.toFixed(2)}</small></article><article><span>Total a pagar</span><strong>S/ 0.00</strong><small>Sin tarjeta ni cargo</small></article>`}
  function profileCard(alias,index,current){return `<article class="account-profile ${current.type==='minor'&&current.index===index?'is-active':''}"><div class="account-avatar">${index?'✨':'📖'}</div><div><small>Perfil menor ${index+1}</small><h3>${esc(alias)}</h3><p>Alias familiar · sin correo</p><button class="btn alt account-use-profile" type="button" data-reader-index="${index}">Usar este perfil</button></div></article>`}
  function childDashboard(account){const current=active(),alias=account.readers?.[current.index]||'Explorador';return `<div class="account-panel child-profile-panel"><span class="account-status">✨ Perfil lector</span><h2>¡Hola, ${esc(alias)}!</h2><p>Jufántico te acompaña para leer, escuchar, jugar y crear.</p><div class="account-child-actions"><button class="btn" type="button" onclick="go('biblioteca')">📚 Ir a la biblioteca</button><button class="btn alt" type="button" onclick="go('aventura')">🎨 Crear una aventura</button><button class="btn gold" type="button" id="useAdultProfile">👨‍👩‍👧 Volver a la zona adulta</button></div><p class="account-warning">La información familiar, los pagos y la personalización permanecen protegidos en la zona adulta.</p></div>`}
  function dashboard(account){
    if(!isAdult())return childDashboard(account);
    const info=priceFor(account.plan),current=active(),profiles=account.readers||[];
    const profileCards=profiles.map((alias,index)=>profileCard(alias,index,current)).join('');
    const openSlot=profiles.length<info.limit?`<article class="account-profile account-profile-empty"><div class="account-avatar">＋</div><div><small>Perfil menor ${profiles.length+1}</small><h3>Espacio familiar disponible</h3><p>Podrá añadirse al activar la cuenta sincronizada.</p></div></article>`:'';
    return `<div class="account-panel"><span class="account-status">✓ Cuenta activa</span><div class="account-dashboard-head"><div><h2>Hola, ${esc(account.adult)}</h2><p>${info.label}: 1 administradora y hasta ${info.limit} perfil${info.limit>1?'es':''} lector${info.limit>1?'es':''}.</p></div><span class="active-profile">Perfil actual: <strong>${current.type==='minor'?esc(profiles[current.index]||'Lector'):'Administradora'}</strong></span></div><div class="account-profiles"><article class="account-profile ${isAdult()?'is-active':''}"><div class="account-avatar">👨‍👩‍👧</div><div><small>Administración</small><h3>${esc(account.adult)}</h3><p>Cuenta, pagos y personalización</p><button class="btn alt" type="button" id="useAdultProfile">Entrar como administradora</button></div></article>${profileCards}${openSlot}</div><div class="account-plan"><article><span>Plan</span><strong>${info.label}</strong><small>Vigencia hasta ${esc(account.expires)}</small></article><article><span>Precio regular</span><strong>S/ ${info.regular.toFixed(2)}</strong><small>Descuento aplicado: 100 %</small></article><article><span>Total pagado</span><strong>S/ 0.00</strong><small>Sin cargo</small></article></div><p><strong>Correo de administración:</strong> ${esc(account.email)}</p><p><strong>Consultas públicas:</strong> <a href="mailto:${PUBLIC_EMAIL}">${PUBLIC_EMAIL}</a></p><p class="account-warning"><strong>Separación activa:</strong> los perfiles lectores pueden leer, escuchar, jugar y crear. Pagos, datos familiares y “Personaliza” quedan reservados a la administradora.</p><div class="actions"><button class="btn" type="button" onclick="go('biblioteca')">Ir a la biblioteca</button>${isAdult()?'<button class="btn gold" type="button" onclick="go(\'personalizar\')">Personalizar un libro</button>':''}<button class="btn alt" type="button" id="installJufantics">Instalar JUFANTICS</button><button class="btn alt" type="button" id="removeTestAccount">Cerrar sesión</button></div></div>`
  }
  async function chooseAdult(){
    const account=get();if(!account)return;
    if(isAdult()){setActive({type:'adult'});render();return}
    const pin=prompt('Escribe el PIN adulto para abrir pagos y personalización:');
    if(pin===null)return;
    if(!account.pinHash){if(!/^\d{4}$/.test(pin)){alert('Crea un PIN adulto de 4 dígitos.');return}account.pinHash=await hashPin(pin);save(account);setActive({type:'adult'});render();return}
    if(await hashPin(pin)===account.pinHash){setActive({type:'adult'});render()}else alert('El PIN adulto no coincide.');
  }
  function bindDashboard(account){
    const removeButton=document.getElementById('removeTestAccount');if(removeButton)removeButton.onclick=remove;
    const adultButton=document.getElementById('useAdultProfile');if(adultButton)adultButton.onclick=chooseAdult;
    document.querySelectorAll('.account-use-profile').forEach(button=>button.onclick=()=>{setActive({type:'minor',index:Number(button.dataset.readerIndex)});render()});
    const install=document.getElementById('installJufantics');if(install)install.onclick=()=>window.JufanticsPWA?.install?.();
  }
  function bindForm(){
    const planInputs=[...document.querySelectorAll('[name="accountPlan"]')],summaryBox=document.getElementById('accountPlanSummary'),reader2=document.getElementById('reader2Field');
    const refresh=()=>{const plan=planInputs.find(input=>input.checked)?.value||'annual-family-test';summaryBox.innerHTML=summary(plan);reader2.hidden=plan==='monthly-test'};
    planInputs.forEach(input=>input.onchange=refresh);refresh();
    document.getElementById('testAccountForm').onsubmit=async event=>{
      event.preventDefault();
      const code=document.getElementById('accountCode').value.trim().toUpperCase();if(code!==TEST_CODE){alert('El código de pruebas no es válido.');return}
      const plan=planInputs.find(input=>input.checked)?.value||'annual-family-test',info=priceFor(plan),reader1=document.getElementById('accountReader').value.trim(),reader2Value=document.getElementById('accountReader2').value.trim();
      const data={adult:document.getElementById('accountAdult').value.trim(),reader:reader1,readers:[reader1,reader2Value].filter(Boolean).slice(0,info.limit),profileLimit:info.limit,email:document.getElementById('accountEmail').value.trim().toLowerCase(),pinHash:await hashPin(document.getElementById('accountPin').value),plan,regular:info.regular,discount:info.regular,total:0,status:'active-test',method:'Descuento total de pruebas',created:new Date().toISOString(),expires:expiry(plan)};
      save(data);setActive({type:'adult'});render();notify();
    };
  }
  function updateNavigation(){
    const profile=active(),personalize=document.querySelector('.nav [data-page="personalizar"]');
    if(personalize){personalize.hidden=profile.type==='minor';personalize.setAttribute('aria-hidden',profile.type==='minor'?'true':'false')}
    const button=document.querySelector('.nav [data-page="cuenta"]');if(button)button.textContent=hasAccess()?`Mi cuenta · ${profile.type==='minor'?'Perfil':'Adulto'}`:'Mi cuenta';
  }
  function render(){
    const section=document.getElementById('cuenta');if(!section)return;const account=get();
    section.innerHTML=`<div class="family-account-page"><div class="account-hero"><div><div class="eyebrow">JUFANTICS · Cuenta familiar</div><h2>Un espacio para leer en familia.</h2><p>Una cuenta adulta administra los accesos; los menores disfrutan la lectura mediante alias.</p></div><img src="jufantico_canon.png" alt="Jufántico acompaña la cuenta familiar"></div>${account?dashboard(account):form()}</div>`;
    account?bindDashboard(account):bindForm();updateNavigation();
  }
  function mount(){
    const main=document.querySelector('main.container'),footer=main?.querySelector('.footer');if(!main)return;
    let section=document.getElementById('cuenta');if(!section){section=document.createElement('section');section.id='cuenta';section.className='page';main.insertBefore(section,footer||null)}
    const nav=document.querySelector('.nav');let button=nav?.querySelector('[data-page="cuenta"]');if(!button&&nav){button=document.createElement('button');button.dataset.page='cuenta';button.onclick=()=>go('cuenta');nav.appendChild(button)}
    render();document.addEventListener('jufantics:account-changed',updateNavigation);
  }
  window.JufanticsAccount={get,active,hasAccess,isAdult,canPersonalize,remove,open:()=>go('cuenta'),requestAdult:chooseAdult};
  document.addEventListener('DOMContentLoaded',mount);
})();
