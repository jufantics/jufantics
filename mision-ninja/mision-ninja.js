(function () {
  "use strict";

  const imageBase = "../assets/cuentos/aventura-ninja/palabras/";
  const words = [
    { key: "mapa", word: "MAPA", image: `${imageBase}mapa.jpg`, syllables: ["MA", "PA"] },
    { key: "dojo", word: "DOJO", image: `${imageBase}dojo.jpg`, syllables: ["DO", "JO"] },
    { key: "amigo", word: "AMIGO", image: `${imageBase}amigo.jpg`, syllables: ["A", "MI", "GO"] },
    { key: "cofre", word: "COFRE", image: `${imageBase}cofre.jpg`, syllables: ["CO", "FRE"] },
    { key: "magia", word: "MAGIA", image: `${imageBase}magia.jpg`, syllables: ["MA", "GI", "A"] },
    { key: "ninja", word: "NINJA", image: `${imageBase}ninja.jpg`, syllables: ["NIN", "JA"] },
    { key: "heroe", word: "HÉROE", image: `${imageBase}heroe.jpg`, syllables: ["HÉ", "RO", "E"] },
    { key: "bosque", word: "BOSQUE", image: `${imageBase}bosque.jpg`, syllables: ["BOS", "QUE"] },
    { key: "camino", word: "CAMINO", image: `${imageBase}camino.jpg`, syllables: ["CA", "MI", "NO"] },
    { key: "puerta", word: "PUERTA", image: `${imageBase}puerta.jpg`, syllables: ["PUER", "TA"] },
    { key: "espada", word: "ESPADA", image: `${imageBase}espada.jpg`, syllables: ["ES", "PA", "DA"] },
    { key: "sensei", word: "SENSEI", image: `${imageBase}sensei.jpg`, syllables: ["SEN", "SEI"] },
    { key: "mision", word: "MISIÓN", image: `${imageBase}mision.jpg`, syllables: ["MI", "SIÓN"] },
    { key: "tesoro", word: "TESORO", image: `${imageBase}tesoro.jpg`, syllables: ["TE", "SO", "RO"] },
    { key: "dragon", word: "DRAGÓN", image: `${imageBase}dragon.jpg`, syllables: ["DRA", "GÓN"] },
    { key: "castillo", word: "CASTILLO", image: `${imageBase}castillo.jpg`, syllables: ["CAS", "TI", "LLO"] },
    { key: "secreto", word: "SECRETO", image: `${imageBase}secreto.jpg`, syllables: ["SE", "CRE", "TO"] },
    { key: "montana", word: "MONTAÑA", image: `${imageBase}montana.jpg`, syllables: ["MON", "TA", "ÑA"] },
    { key: "lectura", word: "LECTURA", image: `${imageBase}lectura.jpg`, syllables: ["LEC", "TU", "RA"] },
    { key: "aventura", word: "AVENTURA", image: `${imageBase}aventura.jpg`, syllables: ["A", "VEN", "TU", "RA"] }
  ];

  const matchItems = [
    { key: "mapa", label: "Mapa", image: `${imageBase}mapa.jpg` },
    { key: "dragon", label: "Dragón", image: `${imageBase}dragon.jpg` },
    { key: "castillo", label: "Castillo", image: `${imageBase}castillo.jpg` },
    { key: "tesoro", label: "Tesoro", image: `${imageBase}tesoro.jpg` },
    { key: "ninja", label: "Ninja", image: `${imageBase}ninja.jpg` }
  ];

  const syllableMissions = [
    words.find((item) => item.key === "dragon"),
    words.find((item) => item.key === "castillo"),
    words.find((item) => item.key === "secreto"),
    words.find((item) => item.key === "tesoro"),
    words.find((item) => item.key === "aventura")
  ];

  const moves = [
    { image: `${imageBase}ninja.jpg`, word: "NIN–JA", action: "Da 2 saltos", note: "Uno por cada sílaba" },
    { image: `${imageBase}dragon.jpg`, word: "DRA–GÓN", action: "Haz 2 rugidos", note: "Uno por cada sílaba" },
    { image: `${imageBase}tesoro.jpg`, word: "TE–SO–RO", action: "Da 3 palmadas", note: "Una por cada sílaba" },
    { image: `${imageBase}aventura.jpg`, word: "A–VEN–TU–RA", action: "Da 4 pisadas suaves", note: "Una por cada sílaba" },
    { image: `${imageBase}magia.jpg`, word: "MA–GI–A", action: "Haz 3 movimientos mágicos", note: "Uno por cada sílaba" },
    { image: `${imageBase}castillo.jpg`, word: "CAS–TI–LLO", action: "Da 3 golpes suaves en la mesa", note: "Uno por cada sílaba" }
  ];

  const panels = Array.from(document.querySelectorAll(".mission-panel"));
  const tabs = Array.from(document.querySelectorAll(".mission-tab"));
  const explored = new Set();
  let rewardTimer;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const celebrationLayer = document.createElement("div");
  celebrationLayer.className = "celebration-layer";
  celebrationLayer.setAttribute("aria-hidden", "true");
  document.body.appendChild(celebrationLayer);

  function speakText(text, options = {}) {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "es-PE";
    speech.rate = options.rate || 0.86;
    speech.pitch = options.pitch || 1;
    window.speechSynthesis.speak(speech);
  }

  function playTone(kind) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const notes = kind === "success" ? [523.25, 659.25, 783.99] : [392, 349.23];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + index * 0.09 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.09 + 0.18);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + index * 0.09);
      oscillator.stop(context.currentTime + index * 0.09 + 0.2);
    });
    setTimeout(() => context.close(), 700);
  }

  function burstConfetti() {
    if (reducedMotion) return;
    celebrationLayer.replaceChildren();
    const colors = ["#e0b759", "#d85248", "#2d836f", "#6a59a8", "#f3d982", "#5aa8cf"];
    for (let index = 0; index < 42; index += 1) {
      const piece = document.createElement("i");
      piece.style.setProperty("--x", `${8 + Math.random() * 84}vw`);
      piece.style.setProperty("--delay", `${Math.random() * 0.22}s`);
      piece.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
      piece.style.setProperty("--spin", `${180 + Math.random() * 720}deg`);
      piece.style.background = colors[index % colors.length];
      celebrationLayer.appendChild(piece);
    }
    setTimeout(() => celebrationLayer.replaceChildren(), 1900);
  }

  function gentleRetry(message) {
    playTone("retry");
    speakText(message, { rate: 0.82, pitch: 1.04 });
  }

  function makeSpeakable(element, getText) {
    element.classList.add("speakable-word");
    element.tabIndex = 0;
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", `Escuchar ${element.textContent}`);
    const speak = () => speakText(getText(), { rate: 0.7 });
    element.addEventListener("click", speak);
    element.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      speak();
    });
  }

  function showReward(message, spokenMessage = message) {
    const reward = document.getElementById("reward");
    reward.querySelector("strong").textContent = message;
    reward.hidden = false;
    playTone("success");
    burstConfetti();
    speakText(spokenMessage, { rate: 0.9, pitch: 1.08 });
    clearTimeout(rewardTimer);
    rewardTimer = setTimeout(() => { reward.hidden = true; }, 2300);
  }

  function markExplored(panelId) {
    explored.add(panelId);
    tabs.forEach((tab) => tab.classList.toggle("is-explored", explored.has(tab.dataset.panel)));
    const marks = document.getElementById("exploredMarks");
    marks.innerHTML = "";
    explored.forEach((id) => {
      const dot = document.createElement("span");
      dot.className = "explored-dot";
      dot.title = tabs.find((tab) => tab.dataset.panel === id).textContent.trim();
      marks.appendChild(dot);
    });
  }

  function openPanel(panelId, focusPanel) {
    tabs.forEach((tab) => {
      const active = tab.dataset.panel === panelId;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      const active = panel.id === panelId;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    markExplored(panelId);
    if (panelId === "sounds") setTimeout(() => speakText(soundMissions[soundIndex].cue, { rate: 0.62 }), 120);
    if (focusPanel) document.getElementById(panelId).focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => openPanel(tab.dataset.panel, false));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      else next = (index - 1 + tabs.length) % tabs.length;
      openPanel(tabs[next].dataset.panel, false);
      tabs[next].focus();
    });
  });
  openPanel("bank", false);

  const jufanticoWelcome = document.getElementById("jufanticoWelcome");
  jufanticoWelcome.addEventListener("click", () => {
    speakText("¡Hola! Soy Jufántico, tu compañero de misión. Aquí puedes escuchar palabras, descubrir sus sonidos, moverte, crear y volver a intentar todas las veces que quieras. Elige el camino que más curiosidad te dé.", { rate: 0.88, pitch: 1.06 });
  });
  document.querySelectorAll("video").forEach((video) => {
    video.addEventListener("play", () => {
      window.speechSynthesis?.cancel();
      document.querySelectorAll("video").forEach((other) => {
        if (other !== video) other.pause();
      });
    });
  });

  document.querySelectorAll(".panel-copy").forEach((copy) => {
    const title = copy.querySelector("h3");
    const description = copy.querySelector("p:last-child");
    if (!title || !description) return;
    const listen = document.createElement("button");
    listen.type = "button";
    listen.className = "listen-button";
    listen.innerHTML = "<span aria-hidden=\"true\">🔊</span> Escuchar indicación";
    listen.addEventListener("click", () => speakText(`${title.textContent}. ${description.textContent}`, { rate: 0.83 }));
    copy.appendChild(listen);
  });

  const wordBank = document.getElementById("wordBank");
  const wordReveal = document.getElementById("wordReveal");
  words.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "word-button";
    button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
    button.innerHTML = `<img src="${item.image}" alt="" width="72" height="108"><span>${item.word}</span><small>🔊 Escuchar</small>`;
    button.addEventListener("click", () => {
      wordBank.querySelectorAll("button").forEach((other) => other.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      wordReveal.innerHTML = `<img class="word-image" src="${item.image}" alt="Imagen de ${item.word.toLocaleLowerCase("es")}" width="360" height="600"><p class="reveal-label">Palabra de poder</p><strong>${item.word}</strong><div class="syllable-preview">${item.syllables.map((part) => `<span>${part}</span>`).join("")}</div><p>${item.syllables.length} ${item.syllables.length === 1 ? "sílaba" : "sílabas"}</p>`;
      speakText(item.word, { rate: 0.68 });
    });
    wordBank.appendChild(button);
  });

  function plain(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleUpperCase("es").trim();
  }

  let caseIndex = 0;
  const caseWord = document.getElementById("caseWord");
  const caseChoices = document.getElementById("caseChoices");
  const caseMessage = document.getElementById("caseMessage");
  const nextCase = document.getElementById("nextCase");
  function renderCase() {
    const target = words[caseIndex];
    const alternatives = [target, words[(caseIndex + 5) % words.length], words[(caseIndex + 11) % words.length]]
      .sort((a, b) => a.word.localeCompare(b.word, "es"));
    caseWord.textContent = target.word;
    caseChoices.innerHTML = "";
    caseMessage.textContent = "Mayúscula y minúscula cuentan la misma palabra.";
    nextCase.hidden = true;
    alternatives.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-button word-lower";
      button.textContent = item.word.toLocaleLowerCase("es");
      button.addEventListener("click", () => {
        if (item.key === target.key) {
          caseChoices.querySelectorAll("button").forEach((choice) => { choice.disabled = true; });
          button.classList.add("is-right");
          caseMessage.textContent = "¡Encontraste las letras gemelas!";
          nextCase.hidden = false;
          showReward("¡Descubriste otra palabra!", `¡Sí! ${target.word.toLocaleLowerCase("es")} es la pareja correcta.`);
        } else {
          const message = `Casi, ninja. ${item.word.toLocaleLowerCase("es")} no es la pareja. Mira cada letra y prueba otra vez.`;
          caseMessage.textContent = message;
          gentleRetry(message);
        }
      });
      caseChoices.appendChild(button);
    });
  }
  nextCase.addEventListener("click", () => { caseIndex = (caseIndex + 1) % words.length; renderCase(); });
  renderCase();

  let vowelIndex = 0;
  const vowelIcon = document.getElementById("vowelIcon");
  const vowelPuzzle = document.getElementById("vowelPuzzle");
  const vowelAnswer = document.getElementById("vowelAnswer");
  const vowelMessage = document.getElementById("vowelMessage");
  function hideVowels(word) { return word.replace(/[AEIOUÁÉÍÓÚÜ]/g, "_"); }
  function renderVowel() {
    const item = words[vowelIndex];
    vowelIcon.innerHTML = `<img class="challenge-image" src="${item.image}" alt="Imagen de ${item.word.toLocaleLowerCase("es")}" width="180" height="280">`;
    vowelPuzzle.textContent = hideVowels(item.word);
    vowelAnswer.value = "";
    vowelMessage.textContent = "Puedes probar todas las veces que quieras.";
  }
  document.getElementById("checkVowel").addEventListener("click", () => {
    const item = words[vowelIndex];
    if (plain(vowelAnswer.value) === plain(item.word)) {
      vowelMessage.textContent = `¡${item.word}! Las vocales volvieron a su lugar.`;
      showReward("¡Abriste la cueva!", `¡Sí! La palabra es ${item.word.toLocaleLowerCase("es")}.`);
    } else {
      const message = `Casi, ninja. Escucha ${item.word.toLocaleLowerCase("es")} lentamente y prueba otra vez.`;
      vowelMessage.textContent = message;
      gentleRetry(message);
      vowelAnswer.focus();
    }
  });
  document.getElementById("nextVowel").addEventListener("click", () => { vowelIndex = (vowelIndex + 1) % words.length; renderVowel(); });
  vowelAnswer.addEventListener("keydown", (event) => { if (event.key === "Enter") document.getElementById("checkVowel").click(); });
  renderVowel();

  let matchIndex = 0;
  const matchWord = document.getElementById("matchWord");
  const matchGrid = document.getElementById("matchGrid");
  const matchMessage = document.getElementById("matchMessage");
  const nextMatch = document.getElementById("nextMatch");

  function renderMatch() {
    const target = matchItems[matchIndex];
    matchWord.textContent = target.label.toUpperCase();
    matchMessage.textContent = "Elige la escena que corresponde a la palabra.";
    nextMatch.hidden = true;
    matchGrid.innerHTML = "";
    matchItems.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "match-choice";
      button.dataset.key = item.key;
      button.setAttribute("aria-label", `Elegir imagen de ${item.label}`);
      button.innerHTML = `<span class="match-visual"><img src="${item.image}" alt="" width="2000" height="1563"></span><span>${item.label}</span>`;
      button.addEventListener("click", () => {
        if (item.key === target.key) {
          button.classList.add("is-right");
          matchGrid.querySelectorAll("button").forEach((choice) => { choice.disabled = true; });
          matchMessage.textContent = "¡Descubriste otra palabra!";
          nextMatch.hidden = false;
          showReward("¡Misión completada!", `¡Muy bien! Encontraste la imagen de ${target.label.toLocaleLowerCase("es")}.`);
        } else {
          const message = `Casi, ninja. Esa es la imagen de ${item.label.toLocaleLowerCase("es")}. Busca ${target.label.toLocaleLowerCase("es")}.`;
          matchMessage.textContent = message;
          gentleRetry(message);
        }
      });
      matchGrid.appendChild(button);
    });
  }
  nextMatch.addEventListener("click", () => {
    matchIndex = (matchIndex + 1) % matchItems.length;
    renderMatch();
  });
  renderMatch();

  let syllableIndex = 0;
  let built = [];
  const syllableIcon = document.getElementById("syllableIcon");
  const syllableName = document.getElementById("syllableName");
  const syllableBuild = document.getElementById("syllableBuild");
  const syllableOptions = document.getElementById("syllableOptions");
  const syllableMessage = document.getElementById("syllableMessage");

  function scrambledParts(parts) {
    if (parts.length < 2) return parts.slice();
    return parts.slice(1).concat(parts[0]);
  }

  function renderSyllable() {
    const item = syllableMissions[syllableIndex];
    built = [];
    syllableIcon.innerHTML = `<img class="syllable-image" src="${item.image}" alt="Imagen de ${item.word.toLocaleLowerCase("es")}" width="120" height="190">`;
    syllableName.textContent = item.word;
    syllableBuild.innerHTML = "";
    syllableOptions.innerHTML = "";
    syllableMessage.textContent = "Toca las sílabas en el orden correcto.";
    scrambledParts(item.syllables).forEach((part, partIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "syllable-piece";
      button.textContent = part;
      button.dataset.index = String(partIndex);
      button.addEventListener("click", () => {
        if (button.disabled) return;
        speakText(part, { rate: 0.7 });
        button.disabled = true;
        built.push({ part, button });
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "built-piece";
        tile.textContent = part;
        tile.setAttribute("aria-label", `Quitar ${part}`);
        tile.addEventListener("click", () => {
          const position = built.findIndex((entry) => entry.part === part && entry.button === button);
          if (position >= 0) built.splice(position, 1);
          button.disabled = false;
          tile.remove();
          syllableMessage.textContent = "Puedes volver a ordenar los bloques.";
        });
        syllableBuild.appendChild(tile);
        if (built.length === item.syllables.length) {
          const result = built.map((entry) => entry.part).join("|");
          if (result === item.syllables.join("|")) {
            syllableMessage.textContent = `¡${item.word}! Descubriste sus ${item.syllables.length} pasos de sonido.`;
            showReward("¡Nuevo poder ninja!", `¡Muy bien! Formaste ${item.word.toLocaleLowerCase("es")}.`);
          } else {
            const message = "Casi, ninja. Toca los bloques de arriba para quitarlos y prueba otra vez.";
            syllableMessage.textContent = message;
            gentleRetry(message);
          }
        }
      });
      syllableOptions.appendChild(button);
    });
  }
  document.getElementById("resetSyllable").addEventListener("click", renderSyllable);
  document.getElementById("changeSyllable").addEventListener("click", () => {
    syllableIndex = (syllableIndex + 1) % syllableMissions.length;
    renderSyllable();
  });
  renderSyllable();

  let moveIndex = 0;
  const moveIcon = document.getElementById("moveIcon");
  const moveWord = document.getElementById("moveWord");
  const moveAction = document.getElementById("moveAction");
  const moveNote = document.querySelector("#moveCard small");
  const moveMessage = document.getElementById("moveMessage");
  function renderMove() {
    const move = moves[moveIndex];
    moveIcon.innerHTML = `<img class="move-image" src="${move.image}" alt="" width="180" height="280">`;
    moveWord.textContent = move.word;
    moveAction.textContent = move.action;
    moveNote.textContent = move.note;
    moveMessage.textContent = "Respira, prepárate… y adelante.";
  }
  document.getElementById("didMove").addEventListener("click", () => {
    moveMessage.textContent = "¡Tu cuerpo también aprendió la palabra!";
    showReward("¡Misión completada!", "¡Misión completada! Tu cuerpo también aprendió la palabra.");
  });
  document.getElementById("nextMove").addEventListener("click", () => {
    moveIndex = (moveIndex + 1) % moves.length;
    renderMove();
  });
  renderMove();

  let lengthIndex = 0;
  const lengthWord = document.getElementById("lengthWord");
  const lengthMessage = document.getElementById("lengthMessage");
  const nextLength = document.getElementById("nextLength");
  function renderLength() {
    lengthWord.textContent = words[lengthIndex].word;
    lengthMessage.textContent = "Cuenta las letras con calma.";
    nextLength.hidden = true;
    document.querySelectorAll("[data-length]").forEach((button) => { button.disabled = false; button.classList.remove("is-right"); });
  }
  document.querySelectorAll("[data-length]").forEach((button) => {
    button.addEventListener("click", () => {
      const expected = plain(words[lengthIndex].word).length <= 5 ? "short" : "long";
      if (button.dataset.length === expected) {
        button.classList.add("is-right");
        document.querySelectorAll("[data-length]").forEach((choice) => { choice.disabled = true; });
        lengthMessage.textContent = `¡Descubriste que ${words[lengthIndex].word} tiene ${plain(words[lengthIndex].word).length} letras!`;
        nextLength.hidden = false;
        showReward("¡Duelo completado!", `¡Muy bien! ${words[lengthIndex].word.toLocaleLowerCase("es")} tiene ${plain(words[lengthIndex].word).length} letras.`);
      } else {
        const message = "Casi, ninja. Señala cada letra y vuelve a contar.";
        lengthMessage.textContent = message;
        gentleRetry(message);
      }
    });
  });
  nextLength.addEventListener("click", () => { lengthIndex = (lengthIndex + 1) % words.length; renderLength(); });
  renderLength();

  const phraseChips = document.getElementById("phraseChips");
  const ninjaPhrase = document.getElementById("ninjaPhrase");
  const phrasePreview = document.getElementById("phrasePreview");
  const creationPrintText = document.getElementById("creationPrintText");
  const phraseMessage = document.getElementById("phraseMessage");
  words.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "phrase-chip";
    button.textContent = item.word.toLocaleLowerCase("es");
    button.addEventListener("click", () => {
      speakText(item.word, { rate: 0.72 });
      const spacer = ninjaPhrase.value.trim() ? " " : "";
      ninjaPhrase.value = `${ninjaPhrase.value.trimEnd()}${spacer}${button.textContent}`;
      updatePhrase();
      ninjaPhrase.focus();
    });
    phraseChips.appendChild(button);
  });
  function updatePhrase() {
    const value = ninjaPhrase.value.trim();
    phrasePreview.textContent = value || "Tu aventura aparecerá aquí.";
    creationPrintText.textContent = value || "Tu aventura aparecerá aquí.";
  }
  ninjaPhrase.addEventListener("input", updatePhrase);
  document.getElementById("celebratePhrase").addEventListener("click", () => {
    if (!ninjaPhrase.value.trim()) {
      phraseMessage.textContent = "Elige una palabra o escribe una idea para comenzar.";
      ninjaPhrase.focus();
      return;
    }
    phraseMessage.textContent = "¡Tu frase abrió un nuevo camino en la aventura!";
    showReward("¡Misión completada!");
  });
  document.getElementById("clearPhrase").addEventListener("click", () => {
    ninjaPhrase.value = "";
    updatePhrase();
    phraseMessage.textContent = "Una página en blanco también puede ser el comienzo.";
    ninjaPhrase.focus();
  });

  const soundMissions = [
    { letter: "M", cue: "M. Escucha: mmm.", correct: "MAPA", choices: ["MAPA", "DOJO", "NINJA"] },
    { letter: "D", cue: "D. Escucha: ddd.", correct: "DRAGÓN", choices: ["TESORO", "DRAGÓN", "CASTILLO"] },
    { letter: "A", cue: "A.", correct: "AMIGO", choices: ["PUERTA", "AMIGO", "BOSQUE"] },
    { letter: "S", cue: "S. Escucha: sss.", correct: "SENSEI", choices: ["LECTURA", "MAGIA", "SENSEI"] },
    { letter: "L", cue: "L. Escucha: lll.", correct: "LECTURA", choices: ["LECTURA", "COFRE", "HÉROE"] }
  ];
  let soundIndex = 0;
  const soundLetter = document.getElementById("soundLetter");
  const soundChoices = document.getElementById("soundChoices");
  const soundMessage = document.getElementById("soundMessage");
  const nextSound = document.getElementById("nextSound");
  function renderSound() {
    const mission = soundMissions[soundIndex];
    soundLetter.textContent = mission.letter;
    soundLetter.setAttribute("aria-label", `Escuchar el sonido ${mission.letter}`);
    soundLetter.onclick = () => speakText(mission.cue, { rate: 0.62 });
    soundChoices.innerHTML = "";
    soundMessage.textContent = "Escucha el sonido dentro de ti y elige.";
    nextSound.hidden = true;
    mission.choices.forEach((word) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-button";
      const item = words.find((candidate) => candidate.word === word);
      button.innerHTML = item ? `<img src="${item.image}" alt="" width="58" height="88"><span>${word}</span><small>🔊</small>` : word;
      button.addEventListener("click", () => {
        if (word === mission.correct) {
          button.classList.add("is-right");
          soundChoices.querySelectorAll("button").forEach((choice) => { choice.disabled = true; });
          soundMessage.textContent = `¡${word} comienza con ${mission.letter}!`;
          nextSound.hidden = false;
          showReward("¡Sonido descubierto!", `¡Sí! ${word.toLocaleLowerCase("es")} comienza con ${mission.letter}.`);
        } else {
          const message = `${word.toLocaleLowerCase("es")}. Casi, ninja. Busca una palabra que empiece con ${mission.letter}.`;
          soundMessage.textContent = `Casi, ninja. Busca una palabra que empiece con ${mission.letter}.`;
          gentleRetry(message);
        }
      });
      soundChoices.appendChild(button);
    });
  }
  nextSound.addEventListener("click", () => { soundIndex = (soundIndex + 1) % soundMissions.length; renderSound(); speakText(soundMissions[soundIndex].cue, { rate: 0.62 }); });
  renderSound();

  makeSpeakable(caseWord, () => words[caseIndex].word);
  makeSpeakable(vowelPuzzle, () => words[vowelIndex].word);
  makeSpeakable(matchWord, () => matchItems[matchIndex].label);
  makeSpeakable(syllableName, () => syllableMissions[syllableIndex].word);
  makeSpeakable(moveWord, () => moves[moveIndex].word.replaceAll("–", ""));
  makeSpeakable(lengthWord, () => words[lengthIndex].word);

  const diplomaName = document.getElementById("diplomaName");
  const diplomaDisplay = document.getElementById("diplomaDisplay");
  diplomaName.addEventListener("input", () => {
    diplomaDisplay.textContent = diplomaName.value.trim() || "TU NOMBRE";
  });
  function printOnly(kind) {
    document.body.classList.remove("print-creation", "print-diploma");
    document.body.classList.add(`print-${kind}`);
    window.print();
  }
  window.addEventListener("afterprint", () => document.body.classList.remove("print-creation", "print-diploma"));
  document.getElementById("printCreation").addEventListener("click", () => {
    if (!ninjaPhrase.value.trim()) {
      phraseMessage.textContent = "Escribe primero tu aventura para poder imprimirla.";
      ninjaPhrase.focus();
      return;
    }
    printOnly("creation");
  });
  document.getElementById("printDiploma").addEventListener("click", () => printOnly("diploma"));

  const hashPanel = location.hash.replace("#", "");
  if (tabs.some((tab) => tab.dataset.panel === hashPanel)) openPanel(hashPanel, false);
})();
