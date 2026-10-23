(function(){
  const ageLabels={
    '3-5':'3–5 años',
    '6-8':'6–8 años',
    '9-12':'9–12 años',
    '13-16':'13–16 años'
  };
  let currentAge=localStorage.getItem('jufantics-age')||'6-8';

  function setAge(age){
    currentAge=age;
    localStorage.setItem('jufantics-age',age);
    document.querySelectorAll('[data-v2-age]').forEach(btn=>btn.classList.toggle('active',btn.dataset.v2Age===age));
    document.querySelectorAll('[data-age-label]').forEach(node=>node.textContent=ageLabels[age]);
    const frame=document.getElementById('experienceFrame');
    if(frame) frame.src='experiencias.html?edad='+encodeURIComponent(age)+'&cuento=cerditos';
  }

  function ageBar(){
    return `<div class="v2-agebar" aria-label="Elegir etapa lectora">
      ${Object.keys(ageLabels).map(age=>`<button type="button" data-v2-age="${age}" class="${currentAge===age?'active':''}">${ageLabels[age]}</button>`).join('')}
    </div>`;
  }

  function renderHome(){
    const home=document.getElementById('inicio');
    if(!home)return;
    home.innerHTML=`
      <section class="v2-hero" aria-labelledby="v2-title">
        <div class="v2-hero-copy">
          <div class="eyebrow">JUFANTICS · Mundo de Cuentos</div>
          <h1 id="v2-title">Cada historia abre un mundo.</h1>
          <p class="lead">Lee, escucha, imagina y crea en una biblioteca viva. Jufántico acompaña con suavidad, sin interrumpir la magia del cuento.</p>
          <div class="actions">
            <button class="btn gold" onclick="go('lector')">Comenzar cuento gratuito</button>
            <button class="btn light" onclick="go('biblioteca')">Explorar biblioteca</button>
          </div>
          <p class="fine">Versión privada de diseño. Sin cuentas, cobros ni publicación comercial.</p>
        </div>
        <div class="v2-hero-visual">
          <div class="v2-whisper">Hola, soy Jufántico. ¿Elegimos una aventura?</div>
          <img src="jufantico_canon.png" alt="Jufántico, acompañante lector oficial de JUFANTICS">
        </div>
      </section>
      <div class="v2-quick" aria-label="Accesos principales">
        <button onclick="go('biblioteca')"><span>📚</span><b>Cuentos</b><small>Historias originales y autorizadas</small></button>
        <button onclick="go('lector')"><span>🎧</span><b>Leer y escuchar</b><small>Narración y palabras iluminadas</small></button>
        <button onclick="go('experiencias')"><span>🧩</span><b>Jugar y crear</b><small>Actividades según cada edad</small></button>
        <button onclick="go('familia')"><span>💜</span><b>Para familias</b><small>Acompañamiento breve y respetuoso</small></button>
      </div>
      <section class="section">
        <div class="v2-heading"><div><div class="eyebrow">Una experiencia que crece contigo</div><h2>Elige cómo quieres entrar.</h2></div>${ageBar()}</div>
        <div class="v2-route">
          <article style="--route:#e8f3fb"><div class="icon">📖</div><h3>Leer a tu ritmo</h3><p>Texto claro, navegación táctil y una historia siempre en el centro.</p><button class="btn light" onclick="go('lector')">Abrir lector</button></article>
          <article style="--route:#f5e7fb"><div class="icon">🎯</div><h3>Descubrir jugando</h3><p>Para <b data-age-label>${ageLabels[currentAge]}</b>, las propuestas cambian sin bloquear el cuento.</p><button class="btn light" onclick="go('experiencias')">Ver experiencias</button></article>
          <article style="--route:#fff0ce"><div class="icon">🎨</div><h3>Crear algo propio</h3><p>Dibuja, escribe y conserva únicamente tus propias creaciones.</p><button class="btn light" onclick="go('aventura')">Crear</button></article>
          <article style="--route:#e8f6ea"><div class="icon">🌎</div><h3>Explorar historias</h3><p>Busca por edad, género y procedencia en una biblioteca editorial cuidada.</p><button class="btn light" onclick="go('biblioteca')">Explorar</button></article>
        </div>
      </section>`;
  }

  function renderLibrary(){
    const library=document.getElementById('biblioteca');
    if(!library)return;
    library.innerHTML=`
      <div class="v2-heading">
        <div><div class="eyebrow">Biblioteca JUFANTICS</div><h2>Historias para elegir, no para imponer.</h2><p class="lead">Organizadas por etapa, género y forma de vivir la lectura.</p></div>
        ${ageBar()}
      </div>
      <div class="searchrow" role="search">
        <input id="v2LibrarySearch" type="search" placeholder="Busca por título, tema o género" aria-label="Buscar en la biblioteca">
        <select id="v2Genre" aria-label="Filtrar por género"><option value="">Todos los géneros</option><option>Aventura</option><option>Fantasía</option><option>Amistad</option><option>Naturaleza</option><option>Familiar</option><option>Emocional</option><option>Deporte</option><option>Humor</option><option>Misterio</option></select>
      </div>
      <section class="v2-library">
        <article class="v2-book featured" data-v2-book="cuento aventura amistad">
          <div class="v2-cover" style="background-image:url('lector/escena1_3d_v34.jpg')"><span class="v2-label">Cuento piloto gratuito</span></div>
          <div class="v2-book-body"><span class="v2-status">Disponible en la prueba</span><h3>Los tres cerditos</h3><p>Doce escenas, lectura con voz y palabras iluminadas en las dos primeras. Al terminar, elige actividades según tu etapa.</p><div class="actions"><button class="btn" onclick="go('lector')">Leer ahora</button><button class="btn alt" onclick="go('experiencias')">Actividades</button></div></div>
        </article>
        <article class="v2-book" data-v2-book="lecturas peru latinoamerica internacional">
          <div class="v2-cover" style="background-image:url('lecturas_portada.png')"><span class="v2-label">Selección editorial</span></div>
          <div class="v2-book-body"><span class="v2-status catalogue">60 fichas investigadas</span><h3>Lecturas para crecer</h3><p>Una selección para descubrir autores y temas. Las fichas no significan que el libro completo esté licenciado.</p><div class="actions"><button class="btn alt" onclick="go('lecturas')">Ver catálogo</button></div></div>
        </article>
        <article class="v2-book" data-v2-book="originales fantasia aventura naturaleza">
          <div class="v2-cover" style="background-image:url('jufantico.jpg')"><span class="v2-label">Biblioteca propia</span></div>
          <div class="v2-book-body"><span class="v2-status">13 cuentos integrados</span><h3>Historias JUFANTICS</h3><p>Las obras propias disponibles se muestran a continuación con lector visual, narración cuando existe texto preparado y actividades por edad.</p></div>
        </article>
      </section>
      <div class="v2-shelf-note">
        <h3>La biblioteca privada se está ordenando con criterio editorial</h3>
        <p>Se revisaron 11 167 archivos locales. En el catálogo de 60, siete coincidencias son probables y cincuenta y tres no se localizaron con suficiente certeza. Ningún archivo de terceros se publicará hasta confirmar sus derechos.</p>
        <div class="v2-audit"><span>7 coincidencias probables</span><span>53 no localizadas</span><span>0 habilitadas sin derechos</span></div>
      </div>`;

    const search=document.getElementById('v2LibrarySearch');
    const genre=document.getElementById('v2Genre');
    const filter=()=>{
      const query=(search.value+' '+genre.value).toLowerCase().trim();
      document.querySelectorAll('[data-v2-book]').forEach(card=>{
        card.hidden=!!query&&!((card.dataset.v2Book+' '+card.textContent).toLowerCase().includes(query));
      });
    };
    search.addEventListener('input',filter);genre.addEventListener('change',filter);
  }

  window.openOwnedStory=slug=>{location.href='lector-cuento.html?cuento='+encodeURIComponent(slug)};
  window.openOwnedActivities=(slug,age)=>{location.href='experiencias.html?cuento='+encodeURIComponent(slug)+'&edad='+encodeURIComponent(age)};

  async function loadOwnedStories(){
    const shelf=document.querySelector('.v2-library');
    if(!shelf||shelf.querySelector('[data-owned-story]'))return;
    try{
      const stories=await fetch('cuentos-propios.json').then(response=>response.json());
      stories.forEach(story=>{
        const article=document.createElement('article');
        article.className='v2-book owned-story';
        article.dataset.ownedStory=story.slug;
        article.dataset.v2Book=`original ${story.title} ${story.subtitle} ${story.genre} ${story.age}`.toLowerCase();
        article.innerHTML=`<div class="v2-cover" style="background-image:url('assets/cuentos/${story.slug}/portada.jpg'),url('assets/cuentos/${story.slug}/pagina-1.jpg')"><span class="v2-label">${story.genre} · ${story.age} años</span></div><div class="v2-book-body"><span class="v2-status">Cuento propio JUFANTICS</span><h3>${story.title}</h3><p>${story.subtitle}. ${story.pages} páginas ilustradas.</p><div class="actions"><button class="btn" onclick="openOwnedStory('${story.slug}')">Leer</button><button class="btn alt" onclick="openOwnedActivities('${story.slug}','${story.age}')">Actividades</button></div></div>`;
        shelf.appendChild(article);
      });
    }catch(error){console.warn('No se pudo cargar la biblioteca de cuentos propios.',error)}
  }

  function addExperiences(){
    const main=document.querySelector('main.container');
    if(!main||document.getElementById('experiencias'))return;
    const section=document.createElement('section');
    section.id='experiencias';section.className='page';
    section.innerHTML=`<div class="v2-heading"><div><div class="eyebrow">Después de leer</div><h2>La historia continúa contigo.</h2><p class="lead">Elige una propuesta. Ninguna es obligatoria y no hay puntajes ni rachas.</p></div>${ageBar()}</div><iframe id="experienceFrame" class="v2-activity-frame" title="Experiencias interactivas JUFANTICS" src="experiencias.html?edad=${encodeURIComponent(currentAge)}&cuento=cerditos"></iframe>`;
    const footer=main.querySelector('.footer');
    if(footer)main.insertBefore(section,footer);else main.appendChild(section);
  }

  async function decorateEditorialCatalogue(){
    try{
      const response=await fetch('catalogo_60_auditoria.json');
      const audit=await response.json();
      const byTitle=new Map(audit.map(item=>[item.titulo,item]));
      const decorate=()=>{
        document.querySelectorAll('#books .book').forEach(card=>{
          if(card.querySelector('.audit-chip'))return;
          const title=card.querySelector('h3')?.textContent?.trim();
          const item=byTitle.get(title);if(!item)return;
          const chip=document.createElement('span');chip.className='audit-chip';
          if(item.estado_archivo==='coincidencia_probable'){chip.classList.add('found');chip.textContent='Archivo localizado · derechos pendientes'}
          else if(item.estado_archivo==='revisar_manualmente'){chip.classList.add('review');chip.textContent='Coincidencia por revisar'}
          else chip.textContent='Solo ficha editorial';
          card.appendChild(chip);
        });
      };
      const original=window.renderBooks;
      if(typeof original==='function')window.renderBooks=function(){original();decorate()};
      decorate();
    }catch(error){console.warn('No se pudo cargar el estado editorial privado.',error)}
  }

  function addNav(){
    const nav=document.querySelector('.nav');
    if(!nav||nav.querySelector('[data-page="experiencias"]'))return;
    const button=document.createElement('button');
    button.dataset.page='experiencias';button.textContent='Actividades';button.onclick=()=>go('experiencias');
    const family=nav.querySelector('[data-page="familia"]');nav.insertBefore(button,family||null);
  }

  document.addEventListener('DOMContentLoaded',()=>{
    renderHome();renderLibrary();loadOwnedStories();addExperiences();addNav();
    const footer=document.querySelector('.footer');if(footer)footer.textContent='JUFANTICS · Biblioteca privada V3 · Sin publicación ni cobros';
    decorateEditorialCatalogue();
    document.addEventListener('click',event=>{
      const button=event.target.closest('[data-v2-age]');
      if(button)setAge(button.dataset.v2Age);
    });
    setAge(currentAge);
  });
})();
