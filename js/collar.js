/* =====================================================
   INTERACCIÓN: El collar de 570 sortijas
   Página 5 — Canvas con anillos tocables
   Al tocar cada anillo gira y brilla, y se suma al contador
   ===================================================== */
(function () {
  'use strict';

  const TOTAL = 570;

  /* ── Esperar a que la página 5 esté activa ── */
  document.addEventListener('pagina-cambio', e => {
    if (e.detail.pagina + 1 === 5) setTimeout(iniciar, 120);
    else detener();
  });

  let raf      = null;
  let anillos  = [];
  let recogidos = 0;
  let ac       = null;   /* AudioContext para el tintín */

  function detener() {
    cancelAnimationFrame(raf);
    raf = null;
  }

  function iniciar() {
    const cv    = document.getElementById('canvas-collar');
    const numEl = document.getElementById('collar-num');
    const hint  = document.getElementById('collar-hint');
    if (!cv) return;
    detener();

    /* Tamaño del canvas según el contenedor */
    const wrapper = cv.closest('.collar-wrapper');
    const W = wrapper ? wrapper.offsetWidth : 340;
    const H = Math.min(W * 0.72, 260);
    cv.width  = W;
    cv.height = H;

    const ctx = cv.getContext('2d');
    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

    /* ── Generar anillos en arco semicircular ── */
    if (anillos.length === 0 || anillos[0].w !== W) {
      anillos = [];
      recogidos = 0;
      if (numEl) numEl.textContent = '0';

      const FILAS   = 5;
      const POR_FILA= [14, 16, 18, 16, 14];  /* total = 78 visibles */
      const R_ANILLO= Math.max(Math.min(W / 22, 16), 8);
      const centroX = W / 2;
      const centroY = H + R_ANILLO * 1.5;

      POR_FILA.forEach((n, fila) => {
        const radio = H * 0.55 + fila * (R_ANILLO * 2.6);
        for (let i = 0; i < n; i++) {
          const angulo = -Math.PI + (Math.PI / (n + 1)) * (i + 1);
          anillos.push({
            x:        centroX + Math.cos(angulo) * radio,
            y:        centroY + Math.sin(angulo) * radio,
            r:        R_ANILLO,
            angulo:   0,           /* rotación actual */
            w:        W,
            recogido: false,
            brillo:   0,           /* 0→1→0 al recoger */
            escala:   1,
            color:    colorAleatorio(),
          });
        }
      });
    }

    function colorAleatorio() {
      const paleta = [
        ['#c8a84b','#f0d078','#8b6914'],  /* dorado */
        ['#b87333','#e8a06a','#7a4a1e'],  /* cobre  */
        ['#a8a9ad','#d8d9dd','#707070'],  /* plata  */
        ['#c5a028','#f8d84c','#906c10'],  /* oro viejo */
      ];
      return paleta[Math.floor(Math.random() * paleta.length)];
    }

    /* ── Sonido tintín al recoger ── */
    function tintín() {
      try {
        if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
        if (ac.state === 'suspended') ac.resume();
        const o  = ac.createOscillator();
        const g  = ac.createGain();
        const t  = ac.currentTime;
        /* Frecuencia aleatoria en escala pentatónica */
        const freqs = [523, 659, 784, 880, 1047];
        o.frequency.setValueAtTime(freqs[Math.floor(Math.random() * freqs.length)], t);
        o.type = 'sine';
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.10, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        o.connect(g); g.connect(ac.destination);
        o.start(t); o.stop(t + 0.6);
      } catch (_) {}
    }

    /* ── Hit-test: ¿tocó un anillo? ── */
    function getAnilloEn(px, py) {
      const rect = cv.getBoundingClientRect();
      const x    = px - rect.left;
      const y    = py - rect.top;
      /* Buscar el más cercano primero */
      let mejor = null, minD = Infinity;
      anillos.forEach(a => {
        if (a.recogido) return;
        const d = Math.hypot(a.x - x, a.y - y);
        if (d < a.r * 1.8 && d < minD) { minD = d; mejor = a; }
      });
      return mejor;
    }

    function recoger(a) {
      if (a.recogido) return;
      a.recogido = true;
      a.brillo   = 1;
      recogidos++;
      if (numEl) {
        numEl.textContent = recogidos;
        numEl.classList.remove('nuevo');
        void numEl.offsetWidth;
        numEl.classList.add('nuevo');
      }
      if (hint && recogidos === 1) hint.style.opacity = '0';
      tintín();

      /* Animar: giro + reducir a cero */
      let giro = 0;
      function animRecoger() {
        giro      += 0.18;
        a.angulo   = giro;
        a.escala   = Math.max(0, 1 - giro / (Math.PI * 2));
        a.brillo   = Math.max(0, a.brillo - 0.04);
        if (a.escala > 0) requestAnimationFrame(animRecoger);
      }
      animRecoger();
    }

    /* ── Eventos ── */
    cv.addEventListener('click', e => {
      const a = getAnilloEn(e.clientX, e.clientY);
      if (a) recoger(a);
    });
    cv.addEventListener('touchstart', e => {
      e.preventDefault();
      Array.from(e.touches).forEach(t => {
        const a = getAnilloEn(t.clientX, t.clientY);
        if (a) recoger(a);
      });
    }, { passive: false });

    /* Hover: cursor pointer sobre anillos */
    cv.style.cursor = 'default';
    cv.addEventListener('mousemove', e => {
      cv.style.cursor = getAnilloEn(e.clientX, e.clientY) ? 'pointer' : 'default';
    });

    /* ── Loop de dibujo ── */
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const dark = isDark();

      anillos.forEach(a => {
        if (a.escala <= 0) return;

        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angulo);
        ctx.scale(a.escala, a.escala);

        const [c1, c2, c3] = a.color;

        /* Sombra suave */
        ctx.shadowColor   = dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)';
        ctx.shadowBlur    = 5;
        ctx.shadowOffsetY = 2;

        /* Anillo: aro con gradiente */
        const grad = ctx.createLinearGradient(-a.r, -a.r, a.r, a.r);
        grad.addColorStop(0,    c3);
        grad.addColorStop(0.35, c2);
        grad.addColorStop(0.65, c1);
        grad.addColorStop(1,    c3);

        ctx.beginPath();
        ctx.arc(0, 0, a.r, 0, Math.PI * 2);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = a.r * 0.42;
        ctx.stroke();

        /* Sello central (punto grabado) */
        ctx.shadowBlur = 0;
        ctx.fillStyle  = c3;
        ctx.beginPath();
        ctx.arc(0, 0, a.r * 0.22, 0, Math.PI * 2);
        ctx.fill();

        /* Destello al recoger */
        if (a.brillo > 0) {
          ctx.globalAlpha = a.brillo * 0.75;
          const g2 = ctx.createRadialGradient(0, -a.r * 0.4, 0, 0, 0, a.r * 1.6);
          g2.addColorStop(0,   'rgba(255,240,160,1)');
          g2.addColorStop(0.4, 'rgba(255,210,80,0.5)');
          g2.addColorStop(1,   'rgba(255,180,40,0)');
          ctx.fillStyle = g2;
          ctx.beginPath();
          ctx.arc(0, 0, a.r * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      /* Texto del centro si todos recogidos */
      if (recogidos >= anillos.length) {
        ctx.save();
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.font         = `italic ${Math.floor(W * 0.038)}px 'Playfair Display', serif`;
        ctx.fillStyle    = dark ? 'rgba(200,180,130,0.9)' : 'rgba(100,70,10,0.85)';
        ctx.fillText('✦  El collar está completo  ✦', W / 2, H / 2);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    }
    draw();
  }

})();
