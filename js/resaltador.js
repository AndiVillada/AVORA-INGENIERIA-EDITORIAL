/* =====================================================
   SISTEMA DE RESALTADO — Las Mil y Una Noches
   · 5 colores de marcador + borrador
   · Funciona con selección de texto (mouse/teclado)
   · Funciona con toque y arrastre en móvil
   · Persiste en localStorage por página
   · Tooltip flotante al seleccionar texto
   · Borrar resaltado al hacer clic sobre él en modo borrador
   ===================================================== */
(function () {
  'use strict';

  /* ── Estado ──────────────────────────────── */
  let colorActivo  = null;   // 'amarillo'|'verde'|'rosa'|'celeste'|'naranja'|null
  let modoborrador = false;

  /* ── Datos de resaltados guardados ─────────
     Estructura: { 'p1-0': { color, xpath, startOffset, endOffset, texto }, ... }
     Clave: 'p{pagina}-{idx}'
  ─────────────────────────────────────────── */
  const STORE_KEY  = 'hl-datos-v2';
  let hlDatos      = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  let hlContador   = Object.keys(hlDatos).length;

  function guardar() {
    localStorage.setItem(STORE_KEY, JSON.stringify(hlDatos));
  }

  /* ── Referencias DOM ────────────────────── */
  const libro         = document.getElementById('libro');
  const wrapper       = document.getElementById('paginas-wrapper');
  const tooltip       = document.getElementById('resaltador-tooltip');
  const btnBorrador   = document.getElementById('btn-borrador');
  const paleta        = document.querySelectorAll('.resaltador-btn[data-color]');
  const rtBtns        = document.querySelectorAll('.rt-btn[data-color]');
  const rtBorrar      = document.getElementById('rt-borrar');

  if (!libro || !tooltip) return;

  /* ── Activar/desactivar color ────────────── */
  function activarColor(color) {
    colorActivo  = color;
    modoborrador = false;

    /* Actualizar aria-pressed en la paleta */
    paleta.forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.color === color ? 'true' : 'false');
    });
    if (btnBorrador) btnBorrador.setAttribute('aria-pressed', 'false');

    /* Clase en #libro para cambiar cursor */
    libro.classList.add('modo-resaltado');
    libro.classList.remove('modo-borrador');
  }

  function activarBorrador() {
    colorActivo  = null;
    modoborrador = true;
    paleta.forEach(b => b.setAttribute('aria-pressed', 'false'));
    if (btnBorrador) btnBorrador.setAttribute('aria-pressed', 'true');
    libro.classList.remove('modo-resaltado');
    libro.classList.add('modo-borrador');
  }

  function desactivarTodo() {
    colorActivo  = null;
    modoborrador = false;
    paleta.forEach(b => b.setAttribute('aria-pressed', 'false'));
    if (btnBorrador) btnBorrador.setAttribute('aria-pressed', 'false');
    libro.classList.remove('modo-resaltado', 'modo-borrador');
    ocultarTooltip();
  }

  /* Clic en botones de la barra */
  paleta.forEach(btn => {
    btn.addEventListener('click', () => {
      const c = btn.dataset.color;
      if (colorActivo === c) desactivarTodo();
      else activarColor(c);
    });
  });
  if (btnBorrador) {
    btnBorrador.addEventListener('click', () => {
      if (modoborrador) desactivarTodo();
      else activarBorrador();
    });
  }

  /* ── Tooltip flotante ────────────────────── */
  let tooltipTimeout = null;

  function mostrarTooltip(x, y) {
    clearTimeout(tooltipTimeout);
    tooltip.hidden = false;

    /* Posicionar encima de la selección */
    const tw = tooltip.offsetWidth  || 220;
    const th = tooltip.offsetHeight || 44;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let tx = Math.min(Math.max(x - tw / 2, 8), vw - tw - 8);
    let ty = y - th - 10;
    if (ty < 8) ty = y + 24; // si no cabe arriba, poner abajo

    tooltip.style.left = tx + 'px';
    tooltip.style.top  = ty + 'px';
  }

  function ocultarTooltip() {
    clearTimeout(tooltipTimeout);
    tooltip.hidden = true;
  }

  /* Clic en los botones del tooltip */
  rtBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      aplicarResaltado(btn.dataset.color);
      ocultarTooltip();
    });
  });
  if (rtBorrar) {
    rtBorrar.addEventListener('click', e => {
      e.stopPropagation();
      borrarSeleccion();
      ocultarTooltip();
    });
  }

  /* Cerrar tooltip al hacer clic fuera */
  document.addEventListener('mousedown', e => {
    if (!tooltip.contains(e.target)) ocultarTooltip();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { desactivarTodo(); ocultarTooltip(); }
  });

  /* ── Detectar selección de texto ────────── */
  function obtenerSeleccion() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    const texto = sel.toString().trim();
    if (!texto) return null;

    /* Verificar que la selección esté dentro de #paginas-wrapper */
    const container = range.commonAncestorContainer;
    if (!wrapper.contains(container)) return null;

    return { sel, range, texto };
  }

  document.addEventListener('mouseup', e => {
    if (tooltip.contains(e.target)) return;

    setTimeout(() => {
      const s = obtenerSeleccion();
      if (!s) { ocultarTooltip(); return; }

      /* Si hay color activo, aplicar directamente */
      if (colorActivo) {
        aplicarResaltado(colorActivo);
        window.getSelection().removeAllRanges();
        return;
      }

      /* Si no hay color activo, mostrar tooltip */
      const rect = s.range.getBoundingClientRect();
      mostrarTooltip(
        rect.left + rect.width / 2,
        rect.top  + window.scrollY
      );
    }, 10);
  });

  /* Touch: mostrar tooltip al levantar el dedo */
  document.addEventListener('touchend', e => {
    if (tooltip.contains(e.target)) return;
    setTimeout(() => {
      const s = obtenerSeleccion();
      if (!s) return;
      if (colorActivo) {
        aplicarResaltado(colorActivo);
        window.getSelection().removeAllRanges();
        return;
      }
      const rect = s.range.getBoundingClientRect();
      mostrarTooltip(
        rect.left + rect.width / 2,
        rect.top  + window.scrollY
      );
    }, 80);
  });

  /* ── Aplicar resaltado ───────────────────── */
  function aplicarResaltado(color) {
    const s = obtenerSeleccion();
    if (!s) return;

    const { sel, range, texto } = s;

    /* Obtener página activa */
    const paginaEl = wrapper.querySelector('.pagina.activa');
    const pagNum   = paginaEl ? paginaEl.dataset.pagina : '0';

    /* Crear el elemento <mark> */
    const mark = document.createElement('mark');
    mark.className  = 'hl nueva';
    mark.dataset.color  = color;
    mark.dataset.hlId   = `p${pagNum}-${++hlContador}`;
    mark.setAttribute('tabindex', '0');
    mark.setAttribute('role', 'mark');
    mark.setAttribute('aria-label', `Texto resaltado en ${color}: ${texto.substring(0,50)}`);

    try {
      range.surroundContents(mark);
    } catch {
      /* surroundContents falla si la selección cruza nodos —
         en ese caso extraer el contenido y envolver */
      const frag = range.extractContents();
      mark.appendChild(frag);
      range.insertNode(mark);
    }

    /* Quitar clase de animación después de que termine */
    mark.addEventListener('animationend', () => mark.classList.remove('nueva'), { once: true });

    /* Guardar en store */
    hlDatos[mark.dataset.hlId] = {
      color,
      pagina: pagNum,
      texto:  texto.substring(0, 200),
    };
    guardar();

    sel.removeAllRanges();

    /* Clic en mark activo: si hay modo borrador, borrar */
    mark.addEventListener('click', e => {
      if (modoborrador) {
        borrarMark(mark);
        e.stopPropagation();
      }
    });
    mark.addEventListener('keydown', e => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && modoborrador) {
        borrarMark(mark);
      }
    });
  }

  /* ── Borrar selección (si hay texto seleccionado sobre un mark) ── */
  function borrarSeleccion() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode;
    let mark = node.nodeType === 3 ? node.parentElement : node;
    mark = mark.closest('mark.hl');
    if (mark) borrarMark(mark);
    sel.removeAllRanges();
  }

  /* ── Borrar un <mark> específico ─────────── */
  function borrarMark(mark) {
    const id = mark.dataset.hlId;
    /* Reemplazar el mark por su contenido de texto */
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize(); // fusionar nodos de texto adyacentes

    /* Eliminar del store */
    if (id) {
      delete hlDatos[id];
      guardar();
    }
  }

  /* ── Restaurar resaltados al cambiar de página ──
     Los marks están en el DOM mientras la página existe,
     pero necesitamos reactivar los listeners de borrado
     en marks que se restauraron desde una carga anterior.
  ─────────────────────────────────────────────────── */
  function reactivarListeners() {
    document.querySelectorAll('mark.hl').forEach(mark => {
      if (mark.dataset.escuchando) return;
      mark.dataset.escuchando = '1';
      mark.addEventListener('click', e => {
        if (modoborrador) { borrarMark(mark); e.stopPropagation(); }
      });
      mark.addEventListener('keydown', e => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && modoborrador) borrarMark(mark);
      });
    });
  }

  document.addEventListener('pagina-cambio', reactivarListeners);
  reactivarListeners(); // al cargar

  /* ── Atajo de teclado: Escape desactiva el modo ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && (colorActivo || modoborrador)) desactivarTodo();
  });

})();
