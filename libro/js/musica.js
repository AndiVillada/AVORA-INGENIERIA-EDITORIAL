/* =====================================================
   MÚSICA AMBIENTAL — Piano solo minimalista
   Estilo: ambient · Erik Satie / Brian Eno
   Notas espaciadas · mucho silencio · reverb largo
   ===================================================== */
(function () {
  'use strict';

  const btnMusica = document.getElementById('btn-musica');
  const player    = document.getElementById('musica-player');
  const btnPlay   = document.getElementById('mp-play');
  const btnCerrar = document.getElementById('mp-cerrar');
  const volSlider = document.getElementById('mp-vol');
  const ondas     = document.querySelectorAll('.mp-ondas span');
  if (!btnMusica || !player) return;

  let AC = null, master = null, conv = null;
  let playing = false, timers = [], nodes = [];

  /* Escala La menor armónica — espaciada en 3 octavas */
  const A3 = 220;
  const ESC = [
    A3,           A3*9/8,   A3*6/5,
    A3*4/3,       A3*3/2,   A3*8/5,
    A3*243/128,   A3*2,     A3*9/4,
    A3*12/5,      A3*8/3,   A3*3
  ];

  function setup() {
    if (AC) return true;
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return false; }

    const vol = volSlider ? +volSlider.value / 100 : 0.5;
    master = AC.createGain();
    master.gain.setValueAtTime(vol * 0.80, AC.currentTime);
    master.connect(AC.destination);

    /* Reverb catedral largo */
    conv = AC.createConvolver();
    conv.buffer = makeIR(5.5, 3.2);
    const rvG = AC.createGain();
    rvG.gain.setValueAtTime(0.55, AC.currentTime);
    conv.connect(rvG); rvG.connect(master);
    nodes.push(rvG);
    return true;
  }

  function makeIR(dur, decay) {
    const sr = AC.sampleRate, len = Math.floor(sr * dur);
    const b  = AC.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++)
        d[i] = (Math.random()*2-1) * Math.pow(1-i/len, decay);
    }
    return b;
  }

  /* Nota de piano FM — timbre suave con cola larga */
  function nota(freq, t0, dur, vol) {
    t0 = Math.max(t0, AC.currentTime + 0.002);

    const mod  = AC.createOscillator();
    const modG = AC.createGain();
    mod.frequency.setValueAtTime(freq * 6.01, t0);
    modG.gain.setValueAtTime(0, t0);
    modG.gain.linearRampToValueAtTime(freq * 1.2, t0 + 0.01);
    modG.gain.exponentialRampToValueAtTime(freq * 0.04, t0 + dur * 0.25);
    modG.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    const car  = AC.createOscillator();
    const carG = AC.createGain();
    car.type   = 'sine';
    car.frequency.setValueAtTime(freq, t0);
    mod.connect(modG); modG.connect(car.frequency);

    carG.gain.setValueAtTime(0.0001, t0);
    carG.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    carG.gain.exponentialRampToValueAtTime(vol * 0.60, t0 + 0.15);
    carG.gain.exponentialRampToValueAtTime(vol * 0.18, t0 + dur * 0.5);
    carG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    /* 2ª voz micro-desintonizada — cuerda de piano */
    const car2  = AC.createOscillator();
    const car2G = AC.createGain();
    car2.type   = 'sine';
    car2.frequency.setValueAtTime(freq * 1.0007, t0);
    car2G.gain.setValueAtTime(0.0001, t0);
    car2G.gain.linearRampToValueAtTime(vol * 0.22, t0 + 0.02);
    car2G.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.7);

    car.connect(carG); car2.connect(car2G);

    const dryG = AC.createGain(); dryG.gain.setValueAtTime(0.28, t0);
    carG.connect(dryG); car2G.connect(dryG); dryG.connect(master);

    const wetG = AC.createGain(); wetG.gain.setValueAtTime(1, t0);
    carG.connect(wetG); car2G.connect(wetG); wetG.connect(conv);

    const stop = t0 + dur + 0.2;
    [mod, car, car2].forEach(o => { o.start(t0); o.stop(stop); });
    nodes.push(mod, modG, car, carG, car2, car2G, dryG, wetG);
  }

  /* Drone de tónica — casi inaudible, da profundidad */
  function drone() {
    const t = AC.currentTime;
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.type  = 'sine';
    o.frequency.setValueAtTime(A3 / 4, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.016, t + 4.0);
    o.connect(g);
    const rv = AC.createGain(); rv.gain.setValueAtTime(0.8, t);
    g.connect(rv); rv.connect(conv); g.connect(master);
    o.start(t);
    nodes.push(o, g, rv);
  }

  /* Compositor: frases tipo Gymnopédie — notas muy separadas */
  function frase() {
    if (!playing) return;
    const t0    = AC.currentTime + 0.1;
    const n     = 3 + Math.floor(Math.random() * 3);
    let   off   = 0;

    for (let i = 0; i < n; i++) {
      const espera = 2.8 + Math.random() * 3.8;   /* 2.8–6.6s entre notas */
      const freq   = ESC[Math.floor(Math.random() * ESC.length)];
      const dur    = 4.5 + Math.random() * 4.5;   /* nota muy larga */
      const vol    = 0.042 + Math.random() * 0.032;

      nota(freq, t0 + off, dur, vol);

      /* Nota de respuesta suave (3ª o 5ª) */
      if (Math.random() < 0.35) {
        const idx2 = (ESC.indexOf(freq) + (Math.random() < 0.5 ? 2 : 4)) % ESC.length;
        nota(ESC[idx2], t0 + off + 0.08, dur * 0.80, vol * 0.50);
      }
      off += espera;
    }

    /* Silencio largo entre frases */
    const pausa = off + 5 + Math.random() * 7;
    timers.push(setTimeout(frase, pausa * 1000));
  }

  function play() {
    if (!setup()) return;
    if (AC.state === 'suspended') AC.resume();
    playing = true;
    btnPlay.innerHTML = '⏸';
    btnPlay.setAttribute('aria-label', 'Pausar');
    activarOndas(true);

    const vol = volSlider ? +volSlider.value / 100 : 0.5;
    master.gain.setValueAtTime(0.0001, AC.currentTime);
    master.gain.exponentialRampToValueAtTime(vol * 0.80, AC.currentTime + 3.0);

    drone();
    timers.push(setTimeout(frase, 1800));
  }

  function pause() {
    playing = false;
    timers.forEach(clearTimeout); timers = [];
    if (master && AC) {
      master.gain.setValueAtTime(master.gain.value, AC.currentTime);
      master.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + 2.5);
      setTimeout(() => {
        nodes.forEach(n => { try { n.stop && n.stop(); } catch (_) {} });
        nodes = [];
        if (master && volSlider)
          master.gain.setValueAtTime(+volSlider.value/100*0.80, AC.currentTime);
      }, 2600);
    }
    btnPlay.innerHTML = '▶';
    btnPlay.setAttribute('aria-label', 'Reproducir');
    activarOndas(false);
  }

  function activarOndas(on) { ondas.forEach(s => s.classList.toggle('activa', on)); }

  if (volSlider) volSlider.addEventListener('input', () => {
    if (master && AC) master.gain.setValueAtTime(+volSlider.value/100*0.80, AC.currentTime);
  });

  btnMusica.addEventListener('click', () => {
    const open = !player.hidden;
    player.hidden = open;
    btnMusica.setAttribute('aria-pressed', String(!open));
    if (!open && !playing) play();
  });
  if (btnPlay)   btnPlay.addEventListener('click', () => playing ? pause() : play());
  if (btnCerrar) btnCerrar.addEventListener('click', () => {
    pause(); player.hidden = true;
    btnMusica.setAttribute('aria-pressed', 'false');
  });
})();
