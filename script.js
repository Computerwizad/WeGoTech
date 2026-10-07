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

  // ===== TECH MARQUEE =====
  const techs = ['Python','JavaScript','TypeScript','React','Next.js','Node.js','FastAPI','LangChain','ChromaDB','SQLite','Docker','Git','REST APIs','LLM APIs'];
  const track = document.getElementById('marquee-track');
  const list = [...techs, ...techs].map(t=>`<span>${t}</span>`).join('');
  track.innerHTML = list;

  // ===== CONTACT FORM (Netlify Forms) =====
  const form = document.getElementById('contact-form');
  const formError = document.getElementById('form-error');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    formError.classList.add('hidden');
    const body = new URLSearchParams(new FormData(form)).toString();
    fetch('/', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body
    }).then((res)=>{
      if(!res.ok) throw new Error('HTTP ' + res.status);
      form.classList.add('hidden');
      document.getElementById('confirm').classList.remove('hidden');
    }).catch(()=>{
      const v = (id)=>document.getElementById(id).value;
      const subject = encodeURIComponent('WeGoTech project request from ' + v('f-name'));
      const text = encodeURIComponent('Name: ' + v('f-name') + '\nCompany: ' + v('f-company') + '\nEmail: ' + v('f-email') + '\nBudget: ' + v('f-budget') + '\nProject type: ' + v('f-type') + '\n\n' + v('f-desc'));
      formError.innerHTML = 'Sorry, that did not send. <a href="mailto:wegotech130@gmail.com?subject=' + subject + '&body=' + text + '" style="color:var(--cyan);text-decoration:underline;">Send it by email instead</a>.';
      formError.classList.remove('hidden');
    });
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
