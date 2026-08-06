/* =====================================================
   ANIMACIONES DE FONDO — Página completa
   Canvas fixed sobre body con mix-blend-mode
   El texto sigue siendo legible — las animaciones
   se FUSIONAN con él sin taparlo

   Pág 2 → Lluvia fina nocturna
   Pág 4 → Humo + fuego interactivo en blockquote
   Pág 5 → Arena dorada flotante
   Pág 7 → Luciérnagas pulsantes
   Pág 9 → Pétalos de pergamino cayendo
   ===================================================== */
(function () {
  'use strict';

  const PI2  = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const dark = () => document.documentElement.getAttribute('data-theme') === 'dark';

  /* Estado global — solo una animación activa a la vez */
  let rafActivo  = null;
  let cleanupFn  = null;
  let paginaActiva = -1;

  document.addEventListener('pagina-cambio', e => {
    const pg = e.detail.pagina + 1; // 1-based
    if (pg === paginaActiva) return;
    detenerTodo();
    paginaActiva = pg;
    setTimeout(() => {
      if      (pg === 2) iniciar(lluvia);
      else if (pg === 4) iniciar(humoYFuego);
      else if (pg === 5) iniciar(arena);
      else if (pg === 7) iniciar(luciernagas);
      else if (pg === 9) iniciar(pergamino);
    }, 120);
  });

  /* ── Canvas fixed compartido de fondo ── */
  function getCanvas(id) {
    let cv = document.getElementById(id);
    if (!cv) {
      cv = document.createElement('canvas');
      cv.id = id;
      Object.assign(cv.style, {
        position: 'fixed', inset: '0',
        width: '100vw', height: '100vh',
        pointerEvents: 'none',
        zIndex: '2',  /* encima del fondo, debajo del texto (z-index 5+) */
      });
      document.body.appendChild(cv);
    }
    cv.width  = window.innerWidth;
    cv.height = window.innerHeight;
    cv.style.display = 'block';
    return cv;
  }

  function iniciar(fn) {
    const cv = getCanvas('cv-pagina-fondo');
    const resultado = fn(cv);
    if (resultado) {
      rafActivo = resultado.raf;
      cleanupFn = resultado.cleanup;
    }
  }

  function detenerTodo() {
    if (rafActivo)  cancelAnimationFrame(rafActivo);
    if (cleanupFn)  cleanupFn();
    rafActivo = null; cleanupFn = null;
    /* Detener también el fuego interactivo si existe */
    if (fuegoRaf) { cancelAnimationFrame(fuegoRaf); fuegoRaf = null; }
    const cvF = document.getElementById('canvas-fuego');
    if (cvF) cvF.getContext('2d').clearRect(0, 0, cvF.width, cvF.height);
  }

  /* ════════════════════════════════════════════════
     PÁGINA 2 — LLUVIA FINA
     ════════════════════════════════════════════════ */
  function lluvia(cv) {
    const ctx  = cv.getContext('2d');
    cv.style.mixBlendMode = dark() ? 'screen' : 'multiply';
    cv.style.opacity      = dark() ? '0.30'   : '0.18';

    const pool = Array.from({length: 90}, gotas);

    function gotas() {
      return {
        x:   rand(-50, cv.width + 50),
        y:   rand(-cv.height * 0.3, cv.height),
        vx:  rand(0.5, 1.2),
        vy:  rand(8, 18),
        len: rand(10, 28),
        a:   rand(0.05, 0.16),
      };
    }

    let raf;
    function loop() {
      cv.style.mixBlendMode = dark() ? 'screen' : 'multiply';
      cv.style.opacity      = dark() ? '0.30'   : '0.18';
      ctx.clearRect(0, 0, cv.width, cv.height);
      const col = dark() ? 'rgba(160,190,230,1)' : 'rgba(40,60,100,1)';
      pool.forEach((g, i) => {
        g.x += g.vx; g.y += g.vy;
        ctx.save();
        ctx.globalAlpha = g.a;
        ctx.strokeStyle = col;
        ctx.lineWidth   = 0.75;
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(g.x - g.vx*(g.len/g.vy), g.y - g.len);
        ctx.stroke();
        ctx.restore();
        if (g.y > cv.height + 40) pool[i] = gotas();
      });
      if (Math.random() < 0.5 && pool.length < 130) pool.push(gotas());
      raf = requestAnimationFrame(loop);
    }
    loop();
    return { raf, cleanup: () => { ctx.clearRect(0,0,cv.width,cv.height); cv.style.display='none'; } };
  }

  /* ════════════════════════════════════════════════
     PÁGINA 4 — HUMO DE FONDO + FUEGO INTERACTIVO
     ════════════════════════════════════════════════ */
  let fuegoRaf = null;

  function humoYFuego(cv) {
    const ctx  = cv.getContext('2d');
    cv.style.mixBlendMode = dark() ? 'screen' : 'multiply';
    cv.style.opacity      = dark() ? '0.50'   : '0.38';

    const pool = Array.from({length: 18}, () => {
      const v = nuevaVolu();
      v.y    = rand(cv.height * 0.3, cv.height);
      v.fase = 'mid'; v.alfa = rand(0, v.alfaMax * 0.5);
      return v;
    });

    function nuevaVolu() {
      return {
        x: rand(cv.width*0.25, cv.width*0.75),
        y: cv.height + 20,
        vx: rand(-0.4, 0.4), vy: rand(-0.5, -1.1),
        r: rand(28, 75), crecer: rand(0.08, 0.18),
        alfa: 0, alfaMax: dark() ? rand(0.04,0.09) : rand(0.06,0.12),
        ang: rand(0, PI2), giro: rand(-0.007, 0.007), fase: 'in',
      };
    }

    let raf;
    function loop() {
      cv.style.mixBlendMode = dark() ? 'screen' : 'multiply';
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (Math.random() < 0.12) pool.push(nuevaVolu());

      pool.forEach((v, i) => {
        v.ang += v.giro; v.x += v.vx + Math.sin(v.ang)*0.3;
        v.y += v.vy; v.r += v.crecer;
        const pct = 1 - v.y / cv.height;
        if (v.fase==='in') { v.alfa += 0.0018; if (v.alfa>=v.alfaMax) v.fase='mid'; }
        else if (v.fase==='mid') { if (pct>0.65) v.fase='out'; }
        else v.alfa -= 0.0014;
        if (v.alfa<=0 && v.fase==='out') { pool[i]=nuevaVolu(); return; }
        if (v.alfa<=0) return;

        ctx.save(); ctx.globalAlpha = v.alfa;
        const g = ctx.createRadialGradient(v.x,v.y,0,v.x,v.y,v.r);
        if (dark()) {
          g.addColorStop(0,'rgba(180,165,140,1)'); g.addColorStop(0.5,'rgba(110,95,80,0.5)'); g.addColorStop(1,'rgba(60,50,40,0)');
        } else {
          g.addColorStop(0,'rgba(90,78,65,1)'); g.addColorStop(0.5,'rgba(65,55,45,0.45)'); g.addColorStop(1,'rgba(40,32,25,0)');
        }
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(v.x,v.y,v.r,0,PI2); ctx.fill(); ctx.restore();
      });
      raf = requestAnimationFrame(loop);
    }
    loop();

    /* Fuego interactivo en el blockquote */
    const cvF = document.getElementById('canvas-fuego');
    const wF  = cvF && cvF.closest('.fuego-wrapper');
    if (cvF && wF) iniciarFuego(cvF, wF);

    return {
      raf,
      cleanup: () => {
        ctx.clearRect(0,0,cv.width,cv.height); cv.style.display='none';
        if (fuegoRaf) { cancelAnimationFrame(fuegoRaf); fuegoRaf=null; }
        if (cvF) cvF.getContext('2d').clearRect(0,0,cvF.width,cvF.height);
      }
    };
  }

  function iniciarFuego(cv, wrapper) {
    if (fuegoRaf) cancelAnimationFrame(fuegoRaf);
    const ctx  = cv.getContext('2d');
    const pool = [];
    let cur = {x:-999, y:-999, on:false}, autoT=0, frame=0;

    function resize() { cv.width=wrapper.offsetWidth||300; cv.height=wrapper.offsetHeight||120; }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(wrapper);
    function rel(cx,cy){ const r=cv.getBoundingClientRect(); return{x:cx-r.left,y:cy-r.top}; }
    wrapper.addEventListener('mousemove', e=>{ cur={...rel(e.clientX,e.clientY),on:true}; wrapper.classList.add('activo'); });
    wrapper.addEventListener('mouseleave',()=>{ cur.on=false; wrapper.classList.remove('activo'); });
    wrapper.addEventListener('touchmove',e=>{e.preventDefault();cur={...rel(e.touches[0].clientX,e.touches[0].clientY),on:true};wrapper.classList.add('activo');},{passive:false});
    wrapper.addEventListener('touchend',()=>{cur.on=false;wrapper.classList.remove('activo');});

    function emit(x,y,n){
      for(let i=0;i<n;i++) pool.push({
        x:x+rand(-12,12),y,vx:rand(-1.5,1.5),vy:rand(-1.8,-5),
        r:rand(5,18),alfa:0,vida:0,vidaMax:rand(25,55),
        tipo:Math.random()<0.25?'chispa':'llama'
      });
    }

    function floop(){
      frame++;
      ctx.clearRect(0,0,cv.width,cv.height);
      ctx.globalCompositeOperation='screen';
      if(!cur.on){
        autoT+=0.038;
        const bx=cv.width*0.5+Math.sin(autoT*1.2)*cv.width*0.22;
        if(frame%2===0) emit(bx,cv.height-4,2);
        if(frame%5===0) emit(bx,cv.height-4,1);
      } else emit(cur.x,cur.y,6);

      for(let i=pool.length-1;i>=0;i--){
        const p=pool[i];
        p.vida++;p.x+=p.vx+Math.sin(p.vida*0.15)*0.4;p.y+=p.vy;p.vy*=0.975;p.vx*=0.98;
        if(p.tipo==='llama')p.r*=0.988;
        const pct=p.vida/p.vidaMax;
        p.alfa=pct<0.15?pct/0.15:1-(pct-0.15)/0.85;
        if(p.vida>=p.vidaMax){pool.splice(i,1);continue;}
        ctx.globalAlpha=Math.max(0,p.alfa*0.88);
        if(p.tipo==='chispa'){
          ctx.fillStyle=`hsl(${rand(38,58)},100%,82%)`;
          ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,PI2);ctx.fill();
        } else {
          const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
          g.addColorStop(0,'rgba(255,245,195,1)');g.addColorStop(0.3,'rgba(255,150,18,0.9)');
          g.addColorStop(0.7,'rgba(210,40,0,0.5)');g.addColorStop(1,'rgba(120,8,0,0)');
          ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,PI2);ctx.fill();
        }
      }
      ctx.globalCompositeOperation='source-over';
      if(pool.length>500) pool.splice(0,80);
      fuegoRaf=requestAnimationFrame(floop);
    }
    floop();
  }

  /* ════════════════════════════════════════════════
     PÁGINA 5 — ARENA DORADA
     ════════════════════════════════════════════════ */
  function arena(cv) {
    const ctx = cv.getContext('2d');
    const pool = Array.from({length:90}, grano);
    function grano() {
      return { x:rand(-20,cv.width), y:rand(0,cv.height), vx:rand(0.4,1.4),
               vy:rand(-0.15,0.15), r:rand(0.6,2.2), alfa:rand(0.2,0.7),
               t:rand(0,PI2), vt:rand(0.02,0.05) };
    }
    let raf;
    function loop() {
      cv.style.mixBlendMode = dark() ? 'screen'  : 'multiply';
      cv.style.opacity      = dark() ? '0.55'    : '0.28';
      ctx.clearRect(0,0,cv.width,cv.height);
      if(Math.random()<0.4 && pool.length<110){ const g=grano(); g.x=-10; pool.push(g); }
      pool.forEach((g,i)=>{
        g.t+=g.vt; g.x+=g.vx; g.y+=g.vy+Math.sin(g.t)*0.12;
        if(g.x>cv.width+10) pool[i]=grano();
        const a=g.alfa*(0.5+0.5*Math.sin(g.t));
        ctx.save(); ctx.globalAlpha=a;
        ctx.fillStyle=dark()?'rgba(220,185,80,1)':'rgba(140,100,20,1)';
        ctx.beginPath(); ctx.arc(g.x,g.y,g.r,0,PI2); ctx.fill(); ctx.restore();
      });
      raf=requestAnimationFrame(loop);
    }
    loop();
    return { raf, cleanup:()=>{ ctx.clearRect(0,0,cv.width,cv.height); cv.style.display='none'; } };
  }

  /* ════════════════════════════════════════════════
     PÁGINA 7 — LUCIÉRNAGAS
     ════════════════════════════════════════════════ */
  function luciernagas(cv) {
    const ctx = cv.getContext('2d');
    cv.style.mixBlendMode = 'screen';
    const pool = Array.from({length:30}, bicho);
    function bicho(){
      return { x:rand(0,cv.width), y:rand(cv.height*0.15,cv.height*0.92),
               vx:rand(-0.3,0.3), vy:rand(-0.2,0.2), r:rand(1.5,3.5),
               t:rand(0,PI2), vt:rand(0.012,0.03), pt:rand(0,PI2), pvt:rand(0.02,0.06),
               col: Math.random()<0.5
                 ? [rand(180,220),rand(220,255),rand(80,140)]
                 : [rand(200,240),rand(160,200),rand(50,100)] };
    }
    let raf;
    function loop(){
      cv.style.opacity = dark() ? '0.65' : '0.38';
      ctx.clearRect(0,0,cv.width,cv.height);
      pool.forEach(b=>{
        b.t+=b.vt; b.pt+=b.pvt;
        b.x+=b.vx+Math.sin(b.t*0.7)*0.35; b.y+=b.vy+Math.cos(b.t*0.5)*0.25;
        if(b.x<20||b.x>cv.width-20) b.vx*=-1;
        if(b.y<50||b.y>cv.height-50) b.vy*=-1;
        const br=0.4+0.6*Math.abs(Math.sin(b.pt));
        const [r,g,bl]=b.col;
        ctx.save(); ctx.globalAlpha=br*(dark()?0.85:0.50);
        const grad=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*5);
        grad.addColorStop(0,`rgba(${r},${g},${bl},1)`);
        grad.addColorStop(0.3,`rgba(${r},${g},${bl},0.6)`);
        grad.addColorStop(1,`rgba(${r},${g},${bl},0)`);
        ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*5,0,PI2); ctx.fill();
        ctx.globalAlpha=br; ctx.fillStyle='rgba(255,255,220,1)';
        ctx.beginPath(); ctx.arc(b.x,b.y,b.r*0.6,0,PI2); ctx.fill(); ctx.restore();
      });
      raf=requestAnimationFrame(loop);
    }
    loop();
    return { raf, cleanup:()=>{ ctx.clearRect(0,0,cv.width,cv.height); cv.style.display='none'; } };
  }

  /* ════════════════════════════════════════════════
     PÁGINA 9 — PÉTALOS DE PERGAMINO
     ════════════════════════════════════════════════ */
  function pergamino(cv) {
    const ctx = cv.getContext('2d');
    const pool = Array.from({length:12}, ()=>{ const h=hoja(); h.y=rand(0,cv.height); return h; });
    function hoja(){
      return { x:rand(0,cv.width), y:rand(-40,-5), vx:rand(-0.5,0.5), vy:rand(0.5,1.6),
               rot:rand(0,PI2), vrot:rand(-0.018,0.018), w:rand(13,26), h2:rand(7,14),
               vida:0, vidaMax:rand(220,380), osc:rand(0,PI2), vosc:rand(0.018,0.04) };
    }
    let raf;
    function loop(){
      cv.style.mixBlendMode = dark() ? 'screen' : 'multiply';
      cv.style.opacity      = dark() ? '0.40'   : '0.26';
      ctx.clearRect(0,0,cv.width,cv.height);
      if(pool.length<12&&Math.random()<0.04) pool.push(hoja());
      for(let i=pool.length-1;i>=0;i--){
        const h=pool[i]; h.vida++; h.osc+=h.vosc; h.rot+=h.vrot;
        h.x+=h.vx+Math.sin(h.osc)*0.5; h.y+=h.vy;
        const pct=h.vida/h.vidaMax;
        const alfa=pct<0.08?pct/0.08:pct>0.75?1-(pct-0.75)/0.25:1;
        if(h.y>cv.height+40||h.vida>h.vidaMax){pool.splice(i,1);continue;}
        ctx.save(); ctx.globalAlpha=alfa*(dark()?0.55:0.40);
        ctx.translate(h.x,h.y); ctx.rotate(h.rot);
        ctx.fillStyle=dark()?'rgba(200,175,110,1)':'rgba(120,90,30,1)';
        ctx.beginPath(); ctx.ellipse(0,0,h.w/2,h.h2/2,0,0,PI2); ctx.fill();
        ctx.strokeStyle=dark()?'rgba(220,195,130,0.4)':'rgba(90,60,10,0.3)';
        ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(-h.w/2,0); ctx.lineTo(h.w/2,0); ctx.stroke();
        ctx.restore();
      }
      raf=requestAnimationFrame(loop);
    }
    loop();
    return { raf, cleanup:()=>{ ctx.clearRect(0,0,cv.width,cv.height); cv.style.display='none'; } };
  }

})();
