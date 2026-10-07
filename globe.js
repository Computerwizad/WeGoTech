/* WeGoTech rotating globe: drawn in code (no image, no library). Land data: Natural Earth (public domain). */
(function(){
  var canvas = document.getElementById('globe-canvas');
  if(!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if(!ctx) return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PERIOD = 36;                 // seconds per full turn (constant speed)
  var TILT = 18 * Math.PI / 180;   // axial tilt towards the viewer
  var RING_TILT = 11 * Math.PI / 180;
  var CW = 144, CH = 72;           // land mask: 2.5 degree cells
  var MASK = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAAAAAAAAAD/////AAAAAAAIAAAAAAAAAEH/P//8AB4AAAAEAAAAAAAAA6b8P//8AAAAAgAX4AIAAAAADgK8Af/8AAAACAH/+IIAAAEADfO/gP/4AAAAEH/////gAA////vp4H/gAAf4B////////5/////4+H8DAB///////////A/////IcHwGAD3//////////A////+BwDgAAPn////////74AOB//+B+AAAAPj///////4CAAIAf//h/AAACHP///////gOAAAAP//7/gAAPH////////4MAAAAH////wAAD/////////4AAAAAD///84AAB/////////wAAAAAD///+AAAB///3/////gAAAAAD///wAAAF6+Dn/////MAAAAAD///wAAAPhv73////8IAAAAAB///AAAAPAp/3////IIAAAAAB///AAAAG8Af/////EwAAAAAA//+AAAAH+AP/////DAAAAAAAf/8AAAAP/v//////gAAAAAAAP8EAAAAf///v////gAAAAAAAD4EAAAA////z////AAAAAAAAB4AAAAA///3+H//+gAAAAAAAA4jAAAB///7/D+f4AAAAAAAAA9gQAAB///7+B8fgAAAAAAAAAPgAAAB///94B4PggAAAAAAAAA4AAAB////gAwHwgAAAAAAAAAY4AAA////QAwFgQAAAAAAAAAP/AAAf///wAYEAYAAAAAAAAAB/gAAP///wAACCAAAAAAAAAAB/8AAAD//gAAGGAAAAAAAAAAD/8AAAD//AAAHOAAAAAAAAAAD//AAAD/+AAADOhAAAAAAAAAD//4AAD/8AAABAh8AAAAAAAAD//8AAB/8AAAAgAeAAAAAAAAD//8AAB/8AAAAAAJAAAAAAAAB//4AAB/8AAAAAAAAAAAAAAAB//4AAB/8QAAAADkAAAAAAAAA//wAAB/8wAAAAfsAAAAAAAAAP/wAAB/4wAAAAf+AAAAAAAAAP/wAAB/xgAAAD//AAAAAAAAAP/AAAA/xgAAAH//gAAAAAAAAP+AAAA/gAAAAH//gAAAAAAAAf8AAAA/gAAAAD//gAAAAAAAAf8AAAAfAAAAAD//gAAAAAAAAf4AAAAeAAAAADg/gAAAAAAAAfgAAAAAAAAAAAAPAAAAAAAAAfAAAAAAAAAAAAACACAAAAAAA+AAAAAAAAAAAAACAEAAAAAAA8AAAAAAAAAAAAAAAIAAAAAAA4AAAAAAAAAAAAAAAQAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAGAABMDgAAAAAAAAAEAAAAAAT/8f////wAAAAAAAAeAAAH////9//////wAAABAf//AAA////////////wAAf////4AAf////////////AAX////+ADD/////////////AAB//////HP////////////+AAB/////////////////////w////////////////////////////////////////////////";

  // ---- build land dots from the mask ----
  var bin = atob(MASK), bits = new Uint8Array(CW * CH), i, j;
  for(i = 0; i < CW * CH; i++){ bits[i] = (bin.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1; }
  var DEG = Math.PI / 180, bx = [], by = [], bz = [];
  for(var r = 0; r < CH; r++){
    var lat = (90 - (r + 0.5) * 2.5) * DEG, cl = Math.cos(lat);
    var step = Math.max(1, Math.round(1 / Math.max(cl, 0.05)));
    for(var c = (r * 7) % step; c < CW; c += step){
      if(!bits[r * CW + c]) continue;
      var lon = (-180 + (c + 0.5) * 2.5) * DEG;
      bx.push(cl * Math.sin(lon)); by.push(Math.sin(lat)); bz.push(cl * Math.cos(lon));
    }
  }
  var N = bx.length;
  var PX = new Float32Array(N), PY = new Float32Array(N), PZ = new Float32Array(N);

  // ---- network lines between nearby land dots (fixed, pseudo-random subset) ----
  var pairs = [], cMax = Math.cos(3.2 * DEG), cMin = Math.cos(7.5 * DEG);
  for(i = 0; i < N; i++){
    for(j = i + 1; j < N; j++){
      var d = bx[i]*bx[j] + by[i]*by[j] + bz[i]*bz[j];
      if(d < cMax && d > cMin && ((i * 31 + j * 17) % 21) === 0) pairs.push(i, j);
    }
  }
  var nodes = []; for(i = 5; i < N; i += 47) nodes.push(i);

  // ---- graticule (lat/lon lines) ----
  var grid = [], seg = 48, k, m;
  for(k = -60; k <= 60; k += 30){
    var line = [], la = k * DEG;
    for(m = 0; m <= seg; m++){ var lo = m / seg * Math.PI * 2; line.push([Math.cos(la)*Math.sin(lo), Math.sin(la), Math.cos(la)*Math.cos(lo)]); }
    grid.push(line);
  }
  for(k = 0; k < 360; k += 30){
    var line2 = [], lo2 = k * DEG;
    for(m = 0; m <= seg; m++){ var la2 = (m / seg - 0.5) * Math.PI; line2.push([Math.cos(la2)*Math.sin(lo2), Math.sin(la2), Math.cos(la2)*Math.cos(lo2)]); }
    grid.push(line2);
  }

  // ---- canvas sizing ----
  var S = 0, cx = 0, cy = 0, R = 0, dpr = 1, t0 = performance.now();
  function size(){
    var w = Math.round(canvas.getBoundingClientRect().width) || 0;
    if(w < 60) return false;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(w * dpr);
    S = canvas.width; cx = cy = S / 2; R = 0.30 * S;
    buildLayers();
    return true;
  }

  function rot(x, y, z, cth, sth, cph, sph){
    var x1 = x * cth + z * sth, z1 = -x * sth + z * cth;
    var y2 = y * cph - z1 * sph, z2 = y * sph + z1 * cph;
    return [x1, y2, z2];
  }

  function ringPath(from, to){
    var a = 0.465 * S, b = 0.105 * S, cr = Math.cos(RING_TILT), sr = Math.sin(RING_TILT), n = 90;
    ctx.beginPath();
    for(var q = 0; q <= n; q++){
      var t = from + (to - from) * q / n, ex = a * Math.cos(t), ey = b * Math.sin(t);
      var x = cx + ex * cr - ey * sr, y = cy + ex * sr + ey * cr;
      if(q === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
  }
  function strokeRing(from, to, alpha){
    var grad = ctx.createLinearGradient(cx - 0.47 * S, 0, cx + 0.47 * S, 0);
    grad.addColorStop(0, 'rgba(95,216,224,1)'); grad.addColorStop(0.5, 'rgba(150,200,255,1)'); grad.addColorStop(1, 'rgba(139,107,255,1)');
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = grad; ctx.lineCap = 'round';
    ringPath(from, to); ctx.lineWidth = 8 * dpr; ctx.globalAlpha = alpha * 0.14; ctx.stroke();
    ringPath(from, to); ctx.lineWidth = 3.2 * dpr; ctx.globalAlpha = alpha * 0.45; ctx.stroke();
    ringPath(from, to); ctx.lineWidth = 1.3 * dpr; ctx.globalAlpha = alpha; ctx.strokeStyle = 'rgba(205,240,255,1)'; ctx.stroke();
    ctx.restore();
  }

  // ---- static layers, drawn once per size change (keeps each frame cheap) ----
  var under = null, over = null;
  function mk(){ var c = document.createElement('canvas'); c.width = S; c.height = S; return c; }
  function buildLayers(){
    var main = ctx; under = mk(); over = mk();
    ctx = under.getContext('2d');
    // soft outer glow
    var g = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.6);
    g.addColorStop(0, 'rgba(60,150,255,0.22)'); g.addColorStop(1, 'rgba(60,150,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);

    // back half of the ring (hidden behind the globe)
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, S, S); ctx.arc(cx, cy, R, 0, Math.PI * 2, true); ctx.clip('evenodd');
    strokeRing(Math.PI, Math.PI * 2, 0.55); ctx.restore();

    // sphere body
    var bg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
    bg.addColorStop(0, 'rgba(34,120,235,0.55)'); bg.addColorStop(0.6, 'rgba(8,42,125,0.6)'); bg.addColorStop(1, 'rgba(3,12,48,0.75)');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    ctx = over.getContext('2d');
    // rim light
    var rim = ctx.createRadialGradient(cx, cy, R * 0.86, cx, cy, R * 1.04);
    rim.addColorStop(0, 'rgba(95,216,224,0)'); rim.addColorStop(0.8, 'rgba(95,216,224,0.28)'); rim.addColorStop(1, 'rgba(95,216,224,0)');
    ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R * 1.04, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(140,225,255,0.55)'; ctx.lineWidth = 1.2 * dpr; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    // front half of the ring (passes in front of the globe)
    strokeRing(0, Math.PI, 1);
    ctx = main;
  }

  var stride = 1;   // network-line detail; drops automatically on slow devices
  function draw(now){
    if(!S) return;
    var th = ((now - t0) / 1000) * (Math.PI * 2 / PERIOD);
    var cth = Math.cos(th), sth = Math.sin(th), cph = Math.cos(TILT), sph = Math.sin(TILT);
    ctx.clearRect(0, 0, S, S);

    ctx.drawImage(under, 0, 0);

    // graticule (front side)
    ctx.strokeStyle = 'rgba(95,216,224,0.17)'; ctx.lineWidth = 0.8 * dpr; ctx.beginPath();
    for(var gi = 0; gi < grid.length; gi++){
      var ln = grid[gi], pen = false;
      for(var gj = 0; gj < ln.length; gj++){
        var p = rot(ln[gj][0], ln[gj][1], ln[gj][2], cth, sth, cph, sph);
        if(p[2] > 0){ var sx = cx + R * p[0], sy = cy - R * p[1]; if(pen) ctx.lineTo(sx, sy); else { ctx.moveTo(sx, sy); pen = true; } }
        else pen = false;
      }
    }
    ctx.stroke();

    // project land dots
    for(i = 0; i < N; i++){
      var q = rot(bx[i], by[i], bz[i], cth, sth, cph, sph);
      PX[i] = cx + R * q[0]; PY[i] = cy - R * q[1]; PZ[i] = q[2];
    }

    // network lines
    ctx.strokeStyle = 'rgba(120,225,255,0.24)'; ctx.lineWidth = 0.8 * dpr; ctx.beginPath();
    for(i = 0; i < pairs.length; i += 2 * stride){
      var a = pairs[i], b = pairs[i + 1];
      if(PZ[a] > 0.1 && PZ[b] > 0.1){ ctx.moveTo(PX[a], PY[a]); ctx.lineTo(PX[b], PY[b]); }
    }
    ctx.stroke();

    // dots: far side (faint), edge (dim), front (bright)
    var s1 = 1.15 * dpr, s2 = 1.5 * dpr, s3 = 1.9 * dpr;
    ctx.fillStyle = 'rgba(95,216,224,0.13)';
    for(i = 0; i < N; i++) if(PZ[i] <= 0) ctx.fillRect(PX[i] - s1 / 2, PY[i] - s1 / 2, s1, s1);
    ctx.fillStyle = 'rgba(95,216,224,0.6)';
    for(i = 0; i < N; i++) if(PZ[i] > 0 && PZ[i] <= 0.35) ctx.fillRect(PX[i] - s2 / 2, PY[i] - s2 / 2, s2, s2);
    ctx.fillStyle = 'rgba(150,235,255,0.95)';
    for(i = 0; i < N; i++) if(PZ[i] > 0.35) ctx.fillRect(PX[i] - s3 / 2, PY[i] - s3 / 2, s3, s3);

    // bright network nodes
    for(i = 0; i < nodes.length; i++){
      var n = nodes[i]; if(PZ[n] < 0.15) continue;
      ctx.fillStyle = 'rgba(120,225,255,' + (0.22 * PZ[n]).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(PX[n], PY[n], 5.5 * dpr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(235,250,255,' + Math.min(1, 0.4 + PZ[n]).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(PX[n], PY[n], 1.9 * dpr, 0, Math.PI * 2); ctx.fill();
    }

    ctx.drawImage(over, 0, 0);
  }

  // ---- run loop: only while visible; one still frame for reduced-motion users ----
  var raf = 0, running = false, visible = true;
  var last = 0, ema = 16, frames = 0;
  function tick(now){
    if(last){ ema = ema * 0.9 + (now - last) * 0.1; frames++; if(frames > 40 && ema > 30 && stride < 4){ stride *= 2; frames = 0; ema = 16; } }
    last = now; draw(now); raf = requestAnimationFrame(tick);
  }
  function start(){ if(running || !visible || reduced || document.hidden || !S) return; running = true; raf = requestAnimationFrame(tick); }
  function stop(){ running = false; last = 0; cancelAnimationFrame(raf); }

  function init(){ if(size()){ draw(t0 + 6000); start(); } }
  init();
  if(window.ResizeObserver){ new ResizeObserver(function(){ if(size()){ draw(performance.now()); start(); } }).observe(canvas); }
  else window.addEventListener('resize', function(){ if(size()) draw(performance.now()); });
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if(visible) start(); else stop(); }, {threshold: 0.05}).observe(canvas);
  }
  document.addEventListener('visibilitychange', function(){ if(document.hidden) stop(); else start(); });
})();

/* Parallax: elements marked data-parallax drift slower than the page, so they read as a deeper layer. */
(function(){
  var els = [].slice.call(document.querySelectorAll('[data-parallax]'));
  if(!els.length || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var ticking = false;
  function update(){
    ticking = false;
    var vh = window.innerHeight;
    els.forEach(function(el){
      var host = el.parentElement.getBoundingClientRect();
      if(host.bottom < -300 || host.top > vh + 300) return;
      var d = (host.top + host.height / 2) - vh / 2;
      var k = parseFloat(el.getAttribute('data-parallax')) || 0.2;
      var y = Math.max(-90, Math.min(90, -d * k));
      el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    });
  }
  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  update();
})();
