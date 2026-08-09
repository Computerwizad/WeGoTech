(function(){
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // boot sequence
  const boot = document.getElementById('boot');
  const bootDelay = reducedMotion ? 200 : 1700;
  setTimeout(()=> boot.classList.add('hide'), bootDelay);

  // nav scroll state
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', ()=>{
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, {passive:true});

  // reveal on scroll
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, {threshold:0.15});
  revealEls.forEach(el=> io.observe(el));

  // philosophy line-reveal
  const philText = document.getElementById('philosophy-text');
  const words = philText.textContent.trim().split(' ');
  philText.innerHTML = words.map(w=>`<span>${w}</span>`).join(' ');
  const philSpans = philText.querySelectorAll('span');
  const philIO = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        philSpans.forEach((s,i)=> setTimeout(()=> s.classList.add('on'), reducedMotion?0:i*35));
        philIO.unobserve(e.target);
      }
    });
  }, {threshold:0.4});
  philIO.observe(philText);

  // service card micro svg network animation (card 01)
  const netG = document.querySelector('.net-viz');
  if(netG){
    const pts = [[10,28],[50,10],[50,46],[100,28],[150,14],[150,42],[205,28]];
    const edges = [[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,6]];
    edges.forEach(([a,b])=>{
      const l = document.createElementNS('http://www.w3.org/2000/svg','line');
      l.setAttribute('x1',pts[a][0]); l.setAttribute('y1',pts[a][1]);
      l.setAttribute('x2',pts[b][0]); l.setAttribute('y2',pts[b][1]);
      l.setAttribute('class','viz-line');
      netG.appendChild(l);
    });
    pts.forEach(p=>{
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx',p[0]); c.setAttribute('cy',p[1]); c.setAttribute('r',3);
      c.setAttribute('class','viz-dot');
      netG.appendChild(c);
    });
  }

  // ===== ECOSYSTEM RADIAL DIAGRAM =====
  const ecoLabels = ['Artificial Intelligence','Automation','Software','Data','IoT','Cloud','APIs','Smart Systems','Analytics'];
  const ecoConnections = {
    'Artificial Intelligence': ['Automation','Analytics','Software'],
    'Automation': ['Artificial Intelligence','APIs','IoT'],
    'Software': ['Artificial Intelligence','Cloud','APIs'],
    'Data': ['Analytics','Cloud','Artificial Intelligence'],
    'IoT': ['Smart Systems','Automation','Cloud'],
    'Cloud': ['Software','Data','APIs'],
    'APIs': ['Software','Automation','Cloud'],
    'Smart Systems': ['IoT','Automation','Analytics'],
    'Analytics': ['Data','Artificial Intelligence','Smart Systems']
  };
  const wrap = document.getElementById('radial-wrap');
  const svgNS = 'http://www.w3.org/2000/svg';
  const ecoSvg = document.getElementById('ecosystem-svg');
  const readout = document.getElementById('eco-readout');
  const nodeEls = [];
  const R = 42; // percent radius

  function layoutNodes(){
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const cx = w/2, cy = h/2, r = Math.min(w,h) * (R/100);
    nodeEls.forEach((el,i)=>{
      const angle = (i / ecoLabels.length) * Math.PI*2 - Math.PI/2;
      const x = cx + r*Math.cos(angle);
      const y = cy + r*Math.sin(angle);
      el.node.style.left = x+'px'; el.node.style.top = y+'px';
      el.cx = x; el.cy = y;
    });
    ecoSvg.setAttribute('width', w); ecoSvg.setAttribute('height', h);
    // redraw center-lines
    Array.from(ecoSvg.querySelectorAll('line.spoke')).forEach(l=>l.remove());
    nodeEls.forEach(el=>{
      const line = document.createElementNS(svgNS,'line');
      line.setAttribute('x1', cx); line.setAttribute('y1', cy);
      line.setAttribute('x2', el.cx); line.setAttribute('y2', el.cy);
      line.setAttribute('class','spoke');
      line.dataset.from = 'center'; line.dataset.to = el.label;
      ecoSvg.appendChild(line);
    });
  }

  ecoLabels.forEach((label)=>{
    const node = document.createElement('div');
    node.className = 'radial-node';
    node.textContent = label;
    node.dataset.label = label;
    wrap.appendChild(node);
    nodeEls.push({label, node});
  });

  function clearHighlights(){
    ecoSvg.querySelectorAll('line').forEach(l=>l.classList.remove('active'));
    nodeEls.forEach(n=>n.node.classList.remove('active'));
  }

  nodeEls.forEach(({label, node})=>{
    node.addEventListener('mouseenter', ()=> highlight(label));
    node.addEventListener('focus', ()=> highlight(label));
    node.addEventListener('mouseleave', ()=>{ clearHighlights(); readout.textContent='Hover a node to see what it connects to.'; });
    node.setAttribute('tabindex','0');
  });

  function highlight(label){
    clearHighlights();
    const connections = ecoConnections[label] || [];
    ecoSvg.querySelectorAll('line').forEach(l=>{
      if(l.dataset.to === label) l.classList.add('active');
    });
    nodeEls.forEach(n=>{ if(n.label===label) n.node.classList.add('active'); });
    readout.innerHTML = connections.map(c=>`<span>${label}</span> → ${c}`).join(' &nbsp;·&nbsp; ');
  }

  window.addEventListener('resize', layoutNodes);
  setTimeout(layoutNodes, 50);
  new IntersectionObserver((entries)=>{ entries.forEach(e=>{ if(e.isIntersecting) layoutNodes(); }); }, {threshold:0.1}).observe(wrap);

  // ===== STAT COUNTERS =====
  const statGrid = document.getElementById('stat-grid');
  let statsPlayed = false;
  function playStats(){
    if(statsPlayed) return; statsPlayed = true;
    document.querySelectorAll('.stat-value').forEach(el=>{
      const target = parseFloat(el.dataset.target);
      const decimal = parseInt(el.dataset.decimal || '0');
      const suffix = el.dataset.suffix || '';
      const dur = reducedMotion ? 1 : 1200;
      const start = performance.now();
      function tick(now){
        const p = Math.min(1,(now-start)/dur);
        const val = target * (1 - Math.pow(1-p,3));
        el.textContent = (decimal ? val.toFixed(decimal) : Math.round(val)) + suffix;
        if(p<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    document.querySelectorAll('.stat-bar i').forEach(bar=>{
      bar.style.width = bar.dataset.width;
    });
  }
  new IntersectionObserver((entries)=>{ entries.forEach(e=>{ if(e.isIntersecting) playStats(); }); }, {threshold:0.3}).observe(statGrid);

  // ===== AGENT DEMO =====
  const agentData = [
    {name:'SALES AGENT', user:'How many leads came in today?', ai:'47 new leads were recorded. 31 have been qualified and 16 require follow-up.'},
    {name:'SUPPORT AGENT', user:'What is our current response time?', ai:'Average first response time is 42 seconds across 214 conversations today.'},
    {name:'OPERATIONS AGENT', user:'Any workflows waiting on approval?', ai:'3 workflows are queued for approval. 12 completed automatically in the last hour.'},
    {name:'RESEARCH AGENT', user:"Summarize this week's competitor pricing changes.", ai:'2 competitors adjusted pricing this week. Full comparison compiled into a 1-page brief.'},
    {name:'DATA AGENT', user:"What's driving the drop in conversion?", ai:'Checkout abandonment rose 8% on mobile after the last release. Flagged for review.'}
  ];
  const agentBtns = document.querySelectorAll('.agent-btn');
  const termBody = document.getElementById('terminal-body');
  function renderAgent(i){
    const d = agentData[i];
    termBody.innerHTML = `<div class="t-user">${d.user}</div><div class="t-ai">${d.ai}<span class="cursor-blink"></span></div>`;
  }
  agentBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      agentBtns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderAgent(parseInt(btn.dataset.agent));
    });
  });
  renderAgent(0);

  // ===== SMART SPACE HOTSPOTS =====
  const spaceData = [
    {title:'SMART LIGHTING', body:'Automatically adjusts lighting based on occupancy, time, environmental conditions, and user preferences.'},
    {title:'SECURITY CAMERAS', body:'Continuous monitoring with motion-aware alerts across every entry point.'},
    {title:'CLIMATE CONTROL', body:'Learns occupancy patterns to balance comfort against energy use, room by room.'},
    {title:'ENERGY MONITORING', body:'Tracks consumption by device and surfaces where usage can be reduced.'},
    {title:'ACCESS CONTROL', body:'Keyless entry and permissioned access, managed remotely and logged automatically.'}
  ];
  document.querySelectorAll('.hotspot').forEach(h=>{
    h.addEventListener('click', ()=>{
      const d = spaceData[parseInt(h.dataset.spot)];
      document.getElementById('space-info').innerHTML = `<div class="si-title">${d.title}</div><div class="si-body">${d.body}</div>`;
    });
  });

  // ===== DATA CHART REVEAL =====
  const chartBox = document.getElementById('chart-box');
  new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        document.getElementById('line-path').classList.add('in');
        document.getElementById('area-path').classList.add('in');
        const pts = document.getElementById('line-path').getAttribute('points').trim().split(' ');
        const dotsG = document.getElementById('chart-dots');
        pts.forEach((p,i)=>{
          const [x,y] = p.split(',');
          const c = document.createElementNS(svgNS,'circle');
          c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r',3.5);
          c.setAttribute('class','chart-dot');
          dotsG.appendChild(c);
          setTimeout(()=> c.classList.add('in'), reducedMotion?0:400 + i*90);
        });
      }
    });
  }, {threshold:0.3}).observe(chartBox);

  // ===== TECH MARQUEE =====
  const techs = ['Python','JavaScript','TypeScript','React','Next.js','Node.js','FastAPI','TensorFlow','PyTorch','OpenCV','PostgreSQL','MongoDB','Docker','Git','REST APIs','GraphQL','LLM APIs','Cloud Platforms'];
  const track = document.getElementById('marquee-track');
  const list = [...techs, ...techs].map(t=>`<span>${t}</span>`).join('');
  track.innerHTML = list;

  // ===== CONTACT FORM =====
  const form = document.getElementById('contact-form');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    form.classList.add('hidden');
    document.getElementById('confirm').classList.remove('hidden');
  });

  // ===== HERO CANVAS NODE NETWORK =====
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  let W,H, mouseX=-9999, mouseY=-9999;
  const nodeCount = window.innerWidth < 700 ? 26 : 46;
  let nodes = [];

  function resize(){
    W = canvas.width = canvas.offsetWidth * devicePixelRatio;
    H = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }
  function initNodes(){
    nodes = [];
    for(let i=0;i<nodeCount;i++){
      nodes.push({
        x: Math.random()*W, y: Math.random()*H,
        vx: (Math.random()-0.5)*0.25*devicePixelRatio, vy:(Math.random()-0.5)*0.25*devicePixelRatio,
        r: Math.random()*1.6+1
      });
    }
  }
  resize(); initNodes();
  window.addEventListener('resize', ()=>{ resize(); initNodes(); });
  canvas.addEventListener('mousemove', (e)=>{
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX-rect.left)*devicePixelRatio;
    mouseY = (e.clientY-rect.top)*devicePixelRatio;
  });
  canvas.addEventListener('mouseleave', ()=>{ mouseX=-9999; mouseY=-9999; });

  const linkDist = 130*devicePixelRatio;
  const cyanRGB = '95,216,224', violetRGB = '139,107,255';

  function frame(){
    ctx.clearRect(0,0,W,H);
    for(const n of nodes){
      n.x += n.vx; n.y += n.vy;
      if(n.x<0||n.x>W) n.vx*=-1;
      if(n.y<0||n.y>H) n.vy*=-1;
      // mouse influence
      const dx = mouseX-n.x, dy = mouseY-n.y, d = Math.hypot(dx,dy);
      if(d < 160*devicePixelRatio){
        const f = (1 - d/(160*devicePixelRatio)) * 0.06;
        n.x += dx*f*0.02; n.y += dy*f*0.02;
      }
    }
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i], b=nodes[j];
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if(d < linkDist){
          const op = (1 - d/linkDist) * 0.35;
          ctx.strokeStyle = `rgba(${cyanRGB},${op})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
      // connect to mouse
      const n = nodes[i];
      const dm = Math.hypot(mouseX-n.x, mouseY-n.y);
      if(dm < 170*devicePixelRatio){
        ctx.strokeStyle = `rgba(${violetRGB},${(1-dm/(170*devicePixelRatio))*0.5})`;
        ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.lineTo(mouseX,mouseY); ctx.stroke();
      }
    }
    for(const n of nodes){
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(${cyanRGB},0.8)`; ctx.fill();
    }
    if(!reducedMotion) requestAnimationFrame(frame);
  }
  if(!reducedMotion){ requestAnimationFrame(frame); }
  else {
    // static single frame for reduced motion users
    frame();
  }
})();
