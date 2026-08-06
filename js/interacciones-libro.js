/* =============================================
   LAS MIL Y UNA NOCHES — INTERACCIONES
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Referencias DOM ─────────────────────── */
  const portada      = document.getElementById('portada');
  const libro        = document.getElementById('libro');
  const btnEntrar    = document.getElementById('btn-entrar');
  const paginas      = Array.from(document.querySelectorAll('.pagina'));
  const btnPrev      = document.getElementById('btn-prev');
  const btnNext      = document.getElementById('btn-next');
  const progresoFill = document.getElementById('progreso-fill');
  const progresoTxt  = document.getElementById('progreso-txt');
  const progresoAnunc= document.getElementById('progreso-anuncio');
  const btnDark      = document.getElementById('btn-dark');
  const btnTxtMas    = document.getElementById('btn-txt-mas');
  const btnTxtMenos  = document.getElementById('btn-txt-menos');
  const btnPortada   = document.getElementById('btn-portada');
  const marcaPaginas = document.getElementById('marca-paginas');
  const bmBtn        = document.getElementById('bm-btn');
  const bmNum        = document.getElementById('bm-num');
  const progBarra    = document.querySelector('.progreso-barra[role="progressbar"]');

  const TOTAL = paginas.length;
  let paginaActual = 0;
  let animando     = false;

  const TAMANOS = ['texto-sm', 'texto-md', 'texto-lg', 'texto-xl'];
  let idxTamano = 1;

  const leidas = new Set(
    JSON.parse(localStorage.getItem('paginas-leidas') || '[]')
  );

  /* ── PORTADA: estrellas + polvo dorado ───── */
  const escena = document.querySelector('.portada-escena');
  if (escena) {
    /* 70 estrellas parpadeantes */
    for (let i = 0; i < 70; i++) {
      const s = document.createElement('div');
      s.className = 'estrella-particula';
      const size = (0.8 + Math.random() * 2.4).toFixed(1);
      s.style.cssText = [
        `left:${(Math.random() * 100).toFixed(1)}%`,
        `top:${(Math.random() * 90).toFixed(1)}%`,
        `--dur:${(1.8 + Math.random() * 4).toFixed(2)}s`,
        `--delay:${(Math.random() * 7).toFixed(2)}s`,
        `width:${size}px`,
        `height:${size}px`
      ].join(';');
      escena.appendChild(s);
    }

    /* 25 partículas de polvo dorado flotante */
    for (let i = 0; i < 25; i++) {
      const p = document.createElement('div');
      p.className = 'polvo-particula';
      const size = (1.5 + Math.random() * 3).toFixed(1);
      const dx   = ((Math.random() - 0.5) * 60).toFixed(0);
      const dy   = (-(20 + Math.random() * 60)).toFixed(0);
      p.style.cssText = [
        `left:${(Math.random() * 100).toFixed(1)}%`,
        `top:${(30 + Math.random() * 60).toFixed(1)}%`,
        `--dur:${(6 + Math.random() * 8).toFixed(2)}s`,
        `--delay:${(Math.random() * 5).toFixed(2)}s`,
        `--dx:${dx}px`,
        `--dy:${dy}px`,
        `width:${size}px`,
        `height:${size}px`
      ].join(';');
      escena.appendChild(p);
    }
  }

  /* Activar pulso en botón después de que todas las animaciones terminan */
  if (btnEntrar) {
    setTimeout(() => btnEntrar.classList.add('listo'), 2600);
  }

  /* ── BLOQUEAR / DESBLOQUEAR NAV ──────────── */
  function bloquearNav(estado) {
    animando = estado;
    [btnPrev, btnNext].forEach(b => {
      if (!b) return;
      if (estado) {
        b.classList.add('bloqueado');
        b.setAttribute('aria-disabled', 'true');
      } else {
        b.classList.remove('bloqueado');
        /* aria-disabled lo recalcula actualizarUI() inmediatamente después */
      }
    });
  }

  /* ── MARCAPÁGINAS ────────────────────────── */
  function actualizarMarcador() {
    if (!marcaPaginas || !bmNum || !bmBtn) return;
    const esLeida = leidas.has(paginaActual);
    bmNum.textContent = String(paginaActual + 1);
    if (esLeida) {
      marcaPaginas.classList.add('leida');
      bmBtn.textContent = '+';
      bmBtn.setAttribute('aria-label', 'Desmarcar página como leída');
      bmBtn.setAttribute('aria-pressed', 'true');
    } else {
      marcaPaginas.classList.remove('leida');
      bmBtn.textContent = '✓';
      bmBtn.setAttribute('aria-label', 'Marcar página como leída');
      bmBtn.setAttribute('aria-pressed', 'false');
    }
  }

  function mostrarMarcador() {
    if (!marcaPaginas) return;
    marcaPaginas.classList.add('visible');
    actualizarMarcador();
  }

  function ocultarMarcador() {
    if (!marcaPaginas) return;
    marcaPaginas.classList.remove('visible', 'leida');
  }

  if (bmBtn) {
    bmBtn.addEventListener('click', () => {
      if (leidas.has(paginaActual)) {
        leidas.delete(paginaActual);
      } else {
        leidas.add(paginaActual);
      }
      localStorage.setItem('paginas-leidas', JSON.stringify([...leidas]));
      actualizarMarcador();
    });
  }

  /* ── ANIMACIÓN PREMIUM TÍTULO PÁG. 1 ────── */
  function animarTituloPremium() {
    const pg1 = paginas[0];
    if (!pg1) return;
    const h2 = pg1.querySelector('h2');
    const h3 = pg1.querySelector('h3');
    if (!h2 || !h3) return;

    /* ── Si ya fue procesado, solo retriggerear la animación ── */
    if (h2.classList.contains('anim-titulo')) {
      /* Quitar y reponer la clase fuerza el reflow y reinicia el keyframe */
      h2.classList.remove('anim-titulo');
      h3.classList.remove('anim-subtitulo');
      void h2.offsetWidth; // reflow
      h2.classList.add('anim-titulo');
      h3.classList.add('anim-subtitulo');
      /* Reiniciar animación de cada letra */
      h2.querySelectorAll('.letra').forEach(span => {
        span.style.animation = 'none';
        void span.offsetWidth;
        span.style.animation = '';
      });
      return;
    }

    /* ── Primera vez: envolver cada carácter en <span> con --i ── */
    const textoOriginal = h2.innerText.replace(/\n/g, ' ');
    const tieneBr       = h2.innerHTML.includes('<br>');
    const partes        = tieneBr
      ? h2.innerHTML.split(/<br\s*\/?>/i)
      : [h2.innerHTML];

    let idx = 0;
    const partesAnimadas = partes.map(parte => {
      const chars = parte.replace(/&nbsp;/g, '\u00A0').split('');
      return chars.map(c => {
        if (c === ' ' || c === '\u00A0') {
          return `<span class="letra-espacio">\u00A0</span>`;
        }
        const esc = c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c;
        const span = `<span class="letra" style="--i:${idx}" aria-hidden="true">${esc}</span>`;
        idx++;
        return span;
      }).join('');
    });

    h2.innerHTML = partesAnimadas.join('<br>');
    h2.setAttribute('aria-label', textoOriginal);
    h2.style.setProperty('--total-letras', String(idx));
    h3.style.setProperty('--total-letras', String(idx));
    h2.classList.add('anim-titulo');
    h3.classList.add('anim-subtitulo');
  }

  /* ── ENTRAR AL LIBRO ─────────────────────── */
  function entrarAlLibro() {
    if (btnEntrar) btnEntrar.disabled = true;
    portada.classList.add('saliendo');
    setTimeout(() => {
      portada.classList.add('oculta');
      libro.classList.add('visible');
      mostrarPagina(0, null);
      mostrarMarcador();
      /* Pequeño delay para que la página sea visible antes de animar */
      setTimeout(animarTituloPremium, 60);
    }, 1000);
  }
  if (btnEntrar) btnEntrar.addEventListener('click', entrarAlLibro);

  /* ── VOLVER A PORTADA ────────────────────── */
  function volverPortada() {
    libro.classList.remove('visible');
    ocultarMarcador();
    portada.classList.remove('oculta', 'saliendo');
    portada.getBoundingClientRect(); // reflow

    paginas.forEach(p =>
      p.classList.remove('activa','sale-izq','sale-der','entra-der','entra-izq','animando')
    );
    paginaActual = 0;
    animando     = false;

    /* Reactivar botón de entrada */
    if (btnEntrar) {
      btnEntrar.disabled = false;
      btnEntrar.classList.add('listo');
    }
  }
  if (btnPortada) btnPortada.addEventListener('click', volverPortada);

  /* ── MOSTRAR PÁGINA ──────────────────────── */
  function mostrarPagina(idx, dir) {
    if (animando || idx < 0 || idx >= TOTAL) return;

    const anterior = paginas[paginaActual];
    const nueva    = paginas[idx];

    /* Primera carga — sin animación */
    if (dir === null) {
      paginas.forEach(p =>
        p.classList.remove('activa','sale-izq','sale-der','entra-der','entra-izq','animando')
      );
      paginaActual = idx;
      nueva.classList.add('activa');
      window.scrollTo({ top: 0 });
      actualizarUI();
      document.dispatchEvent(new CustomEvent('pagina-cambio', { detail: { pagina: idx } }));
      return;
    }

    bloquearNav(true);

    const clsSalida  = dir === 'sig' ? 'sale-izq' : 'sale-der';
    const clsEntrada = dir === 'sig' ? 'entra-der' : 'entra-izq';

    nueva.classList.add('activa', clsEntrada);
    nueva.getBoundingClientRect(); // reflow forzado

    requestAnimationFrame(() => {
      anterior.classList.add(clsSalida);
      nueva.classList.remove(clsEntrada);
      nueva.classList.add('animando');
      anterior.classList.add('animando');

      setTimeout(() => {
        anterior.classList.remove('activa', clsSalida, 'animando');
        nueva.classList.remove('animando');
        paginaActual = idx;
        window.scrollTo({ top: 0, behavior: 'instant' });
        actualizarUI();
        actualizarMarcador();
        bloquearNav(false);
        if (idx === 0) setTimeout(animarTituloPremium, 60);
        /* Disparar evento para los módulos de animación */
        document.dispatchEvent(new CustomEvent('pagina-cambio', { detail: { pagina: idx } }));
      }, 380);
    });
  }

  /* ── NAVEGACIÓN ──────────────────────────── */
  function sig() {
    if (!animando && paginaActual < TOTAL - 1)
      mostrarPagina(paginaActual + 1, 'sig');
  }
  function ant() {
    if (!animando && paginaActual > 0)
      mostrarPagina(paginaActual - 1, 'ant');
  }

  if (btnNext) btnNext.addEventListener('click', sig);
  if (btnPrev) btnPrev.addEventListener('click', ant);

  /* Teclado */
  document.addEventListener('keydown', e => {
    if (!libro.classList.contains('visible')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') sig();
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   || e.key === 'PageUp')   ant();
  });

  /* Swipe táctil */
  let tx = 0, ty = 0;
  document.addEventListener('touchstart', e => {
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!libro.classList.contains('visible')) return;
    const dx = tx - e.changedTouches[0].clientX;
    const dy = ty - e.changedTouches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 52)
      dx > 0 ? sig() : ant();
  }, { passive: true });

  /* ── ACTUALIZAR UI ───────────────────────── */
  function actualizarUI() {
    const pct = TOTAL <= 1
      ? 100
      : Math.round((paginaActual / (TOTAL - 1)) * 100);

    if (progresoFill) progresoFill.style.width = pct + '%';
    if (progBarra)    progBarra.setAttribute('aria-valuenow', String(pct));

    const txtVisible = `${paginaActual + 1} / ${TOTAL}`;
    const txtAnuncio = `Página ${paginaActual + 1} de ${TOTAL}`;
    if (progresoTxt)   progresoTxt.textContent  = txtVisible;
    if (progresoAnunc) progresoAnunc.textContent = txtAnuncio;

    /* disabled real (sin animación en curso) */
    if (btnPrev) {
      const esPrimera = paginaActual === 0;
      btnPrev.disabled = esPrimera;
      btnPrev.setAttribute('aria-disabled', String(esPrimera));
    }
    if (btnNext) {
      const esUltima = paginaActual === TOTAL - 1;
      btnNext.disabled = esUltima;
      btnNext.setAttribute('aria-disabled', String(esUltima));
    }
  }

  /* ── MODO OSCURO ─────────────────────────── */
  const temaInicial = localStorage.getItem('tema')
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  aplicarTema(temaInicial);

  function aplicarTema(t) {
    document.documentElement.setAttribute('data-theme', t);
    if (!btnDark) return;
    const isDark = t === 'dark';
    btnDark.setAttribute('aria-label',   isDark ? 'Activar modo claro'  : 'Activar modo oscuro');
    btnDark.setAttribute('aria-pressed', String(isDark));
    btnDark.innerHTML = isDark
      ? '<span aria-hidden="true">☀</span>'
      : '<span aria-hidden="true">☾</span>';
    localStorage.setItem('tema', t);
  }

  if (btnDark) {
    btnDark.addEventListener('click', () => {
      aplicarTema(
        document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
      );
    });
  }

  /* ── TAMAÑO DE TEXTO ─────────────────────── */
  const tamGuardado = localStorage.getItem('tamano');
  if (tamGuardado) {
    const i = TAMANOS.indexOf(tamGuardado);
    if (i !== -1) idxTamano = i;
  }
  aplicarTamano();

  function aplicarTamano() {
    TAMANOS.forEach(c => document.documentElement.classList.remove(c));
    document.documentElement.classList.add(TAMANOS[idxTamano]);
    localStorage.setItem('tamano', TAMANOS[idxTamano]);

    const labels = ['Texto pequeño', 'Texto mediano', 'Texto grande', 'Texto extra grande'];
    if (progresoAnunc) progresoAnunc.textContent = labels[idxTamano];

    if (btnTxtMenos) {
      const esMin = idxTamano === 0;
      btnTxtMenos.disabled = esMin;
      btnTxtMenos.setAttribute('aria-disabled', String(esMin));
    }
    if (btnTxtMas) {
      const esMax = idxTamano === TAMANOS.length - 1;
      btnTxtMas.disabled = esMax;
      btnTxtMas.setAttribute('aria-disabled', String(esMax));
    }
  }

  if (btnTxtMas) {
    btnTxtMas.addEventListener('click', () => {
      if (idxTamano < TAMANOS.length - 1) { idxTamano++; aplicarTamano(); }
    });
  }
  if (btnTxtMenos) {
    btnTxtMenos.addEventListener('click', () => {
      if (idxTamano > 0) { idxTamano--; aplicarTamano(); }
    });
  }

  /* ── MODAL DE NOTAS ─────────────────────── */
  const modalNota    = document.getElementById('modal-nota');
  const modalCuerpo  = document.getElementById('modal-nota-cuerpo');
  const modalTitulo  = document.getElementById('modal-nota-titulo');
  const modalCerrar  = document.getElementById('modal-cerrar');
  const modalBackdrop= document.getElementById('modal-backdrop');

  // Elemento que disparó el modal (para devolver foco al cerrar)
  let supOrigen = null;

  function abrirNota(idNota, boton) {
    const aside = document.getElementById(idNota);
    if (!aside || !modalNota || !modalCuerpo) return;

    // Extraer contenido de la nota
    const p = aside.querySelector('p');
    if (!p) return;

    // Extraer número de nota del id (n1 → "1")
    const num = idNota.replace('n', '');

    // Poblar modal
    modalCuerpo.innerHTML = '';
    const clone = p.cloneNode(true);
    modalCuerpo.appendChild(clone);
    if (modalTitulo) modalTitulo.textContent = `Nota ${num}`;

    // Guardar origen para devolver foco
    supOrigen = boton || null;

    // Mostrar modal
    modalNota.hidden = false;
    // requestAnimationFrame para que la transición CSS se dispare
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modalCerrar && modalCerrar.focus();
      });
    });

    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
  }

  function cerrarNota() {
    if (!modalNota) return;
    modalNota.hidden = true;
    document.body.style.overflow = '';
    // Devolver foco al superíndice que abrió el modal
    if (supOrigen) {
      supOrigen.focus();
      supOrigen = null;
    }
  }

  // Delegación de eventos: cualquier .sup dentro de #libro
  if (libro) {
    libro.addEventListener('click', e => {
      const btn = e.target.closest('.sup[data-nota]');
      if (!btn) return;
      abrirNota(btn.dataset.nota, btn);
    });
  }

  // Cerrar con botón ✕
  if (modalCerrar) modalCerrar.addEventListener('click', cerrarNota);

  // Cerrar con backdrop
  if (modalBackdrop) modalBackdrop.addEventListener('click', cerrarNota);

  // Cerrar con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalNota && !modalNota.hidden) {
      cerrarNota();
    }
  });

  // Trampa de foco dentro del modal (accesibilidad)
  if (modalNota) {
    modalNota.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(
        modalNota.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')
      ).filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ── INIT ────────────────────────────────── */
  paginas.forEach(p => p.classList.remove('activa'));
  if (marcaPaginas) marcaPaginas.classList.remove('visible');

});
