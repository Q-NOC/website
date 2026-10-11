(function(){
  "use strict";
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- language (PL first, EN second) ----------
     Static copy is paired in the markup (lang="pl" / lang="en") and switched by CSS.
     Only strings that JS writes itself live in this dictionary. */
  function steps(n, l){
    if (l === 'en') return n + ' step' + (n === 1 ? '' : 's');
    var d = n % 10, h = n % 100;
    if (n === 1) return n + ' krok';
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return n + ' kroki';
    return n + ' kroków';
  }
  var I18N = {
    pl: {
      title: 'Q-NOC — koło naukowe, Wydział Fizyki UW',
      desc: 'Q-NOC (Quantum Neuromorphic Optical Computing) to koło naukowe na Wydziale Fizyki Uniwersytetu Warszawskiego. Badamy obliczenia neuromorficzne, reservoir computing i sieci neuronowe oparte na świetle.',
      menuOpen: 'Otwórz menu', menuClose: 'Zamknij menu',
      formIdle: 'Odpowiemy mailowo.',
      formSending: 'Wysyłanie…',
      formOk: 'Dziękujemy — zgłoszenie zostało wysłane.',
      formErr: 'Coś poszło nie tak — napisz bezpośrednio na q-noc@fuw.edu.pl.',
      node: 'Węzeł rezerwuaru ',
      gStart: 'Uruchom rezerwuar', gRestart: 'Zacznij od nowa', gAgain: 'Uruchom ponownie',
      hudIdle: ['spoczynek', 'rezerwuar czeka'],
      hudRun: ['działa', 'obserwuj impulsy'],
      hudRead: ['odczyt', 'twoja kolej'],
      hudMatch: ['zgodność', 'stan odtworzony'],
      hudLost: ['zanik', 'pamięć utracona'],
      stIdle: 'Naciśnij start. Osiem węzłów, jedna pętla rekurencyjna, żadnego uczenia po twojej stronie.',
      stRun: 'Rezerwuar wysyła impulsy. Zapamiętaj kolejność — twoja pamięć też zanika.',
      stRead: function(n){ return 'Teraz odtwórz sekwencję — ' + steps(n, 'pl') + '.'; },
      stMatch: 'Odtworzono. Rezerwuar wydłuża sekwencję o jeden krok.',
      stLost: function(n){ return 'Ten stan zdążył już zaniknąć. Twoja pamięć objęła ' + steps(n, 'pl') + ' — prawdziwe rezerwuary zanikają tak samo. Spróbuj jeszcze raz.'; }
    },
    en: {
      title: 'Q-NOC — student research group, Faculty of Physics UW',
      desc: 'Q-NOC (Quantum Neuromorphic Optical Computing) is a student research group at the Faculty of Physics, University of Warsaw. We study neuromorphic computing, reservoir computing and light-based neural networks.',
      menuOpen: 'Open menu', menuClose: 'Close menu',
      formIdle: "We'll get back to you by email.",
      formSending: 'Sending…',
      formOk: 'Thanks — your application was sent.',
      formErr: 'Something went wrong — please email q-noc@fuw.edu.pl directly instead.',
      node: 'Reservoir node ',
      gStart: 'Run the reservoir', gRestart: 'Restart', gAgain: 'Run it again',
      hudIdle: ['idle', 'reservoir at rest'],
      hudRun: ['running', 'watch the spikes'],
      hudRead: ['read out', 'your turn'],
      hudMatch: ['match', 'state recovered'],
      hudLost: ['decayed', 'memory lost'],
      stIdle: 'Press run. Eight nodes, one recurrent loop, no training on your side.',
      stRun: 'The reservoir is firing. Hold the order in your own fading memory.',
      stRead: function(n){ return 'Now replay the sequence — ' + steps(n, 'en') + '.'; },
      stMatch: 'Recovered. The reservoir extends the sequence by one.',
      stLost: function(n){ return 'That state had already decayed. You held ' + steps(n, 'en') + ' of memory — real reservoirs fade the same way. Run it again.'; }
    }
  };
  var lang = root.lang === 'en' ? 'en' : 'pl';
  var onLang = [];                           // re-render hooks for JS-written strings
  function t(key, arg){
    var v = I18N[lang][key];
    return typeof v === 'function' ? v(arg) : v;
  }
  function applyLang(){
    root.lang = lang;
    document.title = t('title');
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', t('desc'));
    // attributes and <option> labels cannot be paired in markup, so they carry data-pl / data-en
    document.querySelectorAll('[data-pl]').forEach(function(el){
      var v = el.getAttribute('data-' + lang), attr = el.getAttribute('data-i18n-attr');
      if (attr) el.setAttribute(attr, v); else el.textContent = v;
    });
    document.querySelectorAll('.lang button').forEach(function(b){
      b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false');
    });
    onLang.forEach(function(fn){ fn(); });
  }
  document.querySelectorAll('.lang button').forEach(function(b){
    b.addEventListener('click', function(){
      lang = b.dataset.lang;
      try { localStorage.setItem('qnoc-lang', lang); } catch(e){}
      applyLang();
    });
  });

  /* ---------- mobile menu ---------- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var links = document.getElementById('nav-links');

  function setMenu(open){
    nav.dataset.open = open ? 'true' : 'false';
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', t(open ? 'menuClose' : 'menuOpen'));
  }
  burger.addEventListener('click', function(){ setMenu(nav.dataset.open !== 'true'); });
  links.addEventListener('click', function(e){ if(e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') setMenu(false); });
  onLang.push(function(){ setMenu(nav.dataset.open === 'true'); });

  /* ---------- sticky nav border ---------- */
  var onScroll = function(){ nav.dataset.stuck = window.scrollY > 8 ? 'true' : 'false'; };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });

  /* ---------- tabs ----------
     Each .panel is a tab addressed by its id. A hash that points inside a panel
     (#projects, #demo, #apply…) opens that panel and scrolls to the target. */
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  var navAnchors = Array.prototype.slice.call(links.querySelectorAll('a[href^="#"]'));
  function route(){
    var id = decodeURIComponent(location.hash.slice(1));
    var target = id ? document.getElementById(id) : null;
    var panel = target ? target.closest('.panel') : null;
    if (!panel){ panel = panels[0]; target = panel; }
    panels.forEach(function(p){ p.classList.toggle('is-active', p === panel); });
    navAnchors.forEach(function(a){
      if (a.getAttribute('href') === '#' + panel.id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (target === panel) window.scrollTo({ top: 0, behavior: 'instant' });
    else target.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  window.addEventListener('hashchange', route);
  route();

  /* ---------- scroll reveal ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)){
    revealables.forEach(function(el){ el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('in'); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function(el){ ro.observe(el); });
  }

  /* ---------- hero spike-train trace ---------- */
  (function(){
    var p = document.getElementById('trace-path');
    if(!p) return;
    var d = 'M0 22', x = 0;
    while (x < 420){
      var gap = 8 + Math.random()*36;
      x += gap;
      if (x > 418) break;
      var h = 6 + Math.random()*13;
      d += ' L' + x.toFixed(1) + ' 22 L' + x.toFixed(1) + ' ' + (22-h).toFixed(1) +
           ' L' + (x+1.4).toFixed(1) + ' ' + (22-h).toFixed(1) + ' L' + (x+1.4).toFixed(1) + ' 22';
      x += 1.4;
    }
    p.setAttribute('d', d + ' L420 22');
  })();

  /* ---------- project raster plots (spike rasters as cover art) ---------- */
  (function(){
    function mulberry(seed){
      return function(){
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    document.querySelectorAll('[data-raster]').forEach(function(box){
      var rnd = mulberry(parseInt(box.dataset.raster, 10) * 9871);
      var rows = 14, W = 320, H = 140, pad = 10;
      var out = '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none">';
      for (var r = 0; r < rows; r++){
        var y = pad + r * ((H - 2*pad) / (rows - 1));
        var burst = rnd();
        for (var x = pad; x < W - pad; x += 3 + rnd()*7){
          var local = 0.10 + 0.5 * Math.pow(Math.sin((x/W)*Math.PI*2 + burst*6) * 0.5 + 0.5, 3);
          if (rnd() < local){
            var op = (0.25 + rnd()*0.6).toFixed(2);
            out += '<rect x="'+x.toFixed(1)+'" y="'+(y-2.6).toFixed(1)+'" width="1.3" height="5.2" fill="#2454ff" opacity="'+op+'"/>';
          }
        }
      }
      out += '</svg>';
      box.innerHTML = out;
    });
  })();

  /* ---------- form ---------- */
  var form = document.getElementById('apply');
  var note = document.getElementById('form-note');
  function setNote(state){
    note.dataset.state = state;
    note.textContent = t({ idle: 'formIdle', sending: 'formSending', ok: 'formOk', error: 'formErr' }[state]);
  }
  onLang.push(function(){ setNote(note.dataset.state || 'idle'); });
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    setNote('sending');
    fetch('https://formsubmit.co/ajax/alaskowski3.14@gmail.com', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    }).then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
      .then(function(){ setNote('ok'); form.reset(); })
      .catch(function(){ setNote('error'); })
      .finally(function(){ btn.disabled = false; });
  });

  /* ============================================================
     DEMO — "Be the readout layer"
     The reservoir fires a spike sequence; the player replays it.
     Each cleared round is one more step of fading memory.
     ============================================================ */
  (function(){
    var rig = document.getElementById('rig');
    if (!rig) return;

    var N = 8, R = 36;                       // ring of 8 nodes, radius in % of the rig
    var cells = [], seq = [], input = [];
    var best = 0, playing = false, accepting = false, timers = [];

    var elRound  = document.getElementById('g-round');
    var elLen    = document.getElementById('g-len');
    var elBest   = document.getElementById('g-best');
    var elStatus = document.getElementById('g-status');
    var elStart  = document.getElementById('g-start');
    var elReplay = document.getElementById('g-replay');
    var elHud    = document.getElementById('g-hud');
    var wires    = document.getElementById('g-wires');

    var pos = [];
    for (var i = 0; i < N; i++){
      var a = -Math.PI / 2 + i * (Math.PI * 2 / N);
      pos.push({ x: 50 + Math.cos(a) * R, y: 50 + Math.sin(a) * R });
    }

    // recurrent-looking wiring: ring + skip connections
    var ns = 'http://www.w3.org/2000/svg', wireFrag = '';
    for (var i = 0; i < N; i++){
      var j = (i + 1) % N, k = (i + 3) % N;
      wireFrag += '<line x1="'+pos[i].x+'" y1="'+pos[i].y+'" x2="'+pos[j].x+'" y2="'+pos[j].y+'"/>';
      if (i % 2 === 0) wireFrag += '<line x1="'+pos[i].x+'" y1="'+pos[i].y+'" x2="'+pos[k].x+'" y2="'+pos[k].y+'"/>';
    }
    wires.innerHTML = wireFrag;

    for (var i = 0; i < N; i++){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cell';
      b.style.left = pos[i].x + '%';
      b.style.top = pos[i].y + '%';
      b.textContent = 'n' + i;
      b.setAttribute('aria-label', t('node') + i);
      b.disabled = true;
      b.dataset.i = i;
      b.addEventListener('click', onPick);
      rig.appendChild(b);
      cells.push(b);
    }

    function clearTimers(){ timers.forEach(clearTimeout); timers = []; }
    function later(fn, ms){ timers.push(setTimeout(fn, ms)); }
    // HUD, status line and start button remember their key so a language switch can redraw them
    var hudKey = 'hudIdle', stKey = 'stIdle', stArg = 0, startKey = 'gStart';
    function hud(key){ hudKey = key; var v = t(key); elHud.innerHTML = '<b>' + v[0] + '</b>' + v[1]; }
    function say(key, arg){ stKey = key; stArg = arg; elStatus.textContent = t(key, arg); }
    function label(key){ startKey = key; elStart.textContent = t(key); }
    onLang.push(function(){
      hud(hudKey); say(stKey, stArg); label(startKey);
      cells.forEach(function(c, i){ c.setAttribute('aria-label', t('node') + i); });
    });
    function setEnabled(on){ cells.forEach(function(c){ c.disabled = !on; }); }

    function fire(i, bad, ms){
      cells[i].dataset.fire = bad ? 'bad' : '1';
      later(function(){ delete cells[i].dataset.fire; }, ms || 330);
    }

    function play(){
      accepting = false;
      setEnabled(false);
      elReplay.disabled = true;
      hud('hudRun');
      say('stRun');
      var gap = Math.max(260, 620 - seq.length * 26);
      seq.forEach(function(n, idx){
        later(function(){ fire(n, false, gap * 0.62); }, idx * gap + 420);
      });
      later(function(){
        accepting = true;
        input = [];
        setEnabled(true);
        elReplay.disabled = false;
        hud('hudRead');
        say('stRead', seq.length);
      }, seq.length * gap + 520);
    }

    function nextRound(){
      // avoid immediate repeats so the sequence stays readable
      var last = seq[seq.length - 1];
      var n; do { n = (Math.random() * N) | 0; } while (n === last && N > 1);
      seq.push(n);
      elRound.textContent = seq.length;
      elLen.textContent = seq.length;
      play();
    }

    function onPick(e){
      if (!accepting) return;
      var i = parseInt(e.currentTarget.dataset.i, 10);
      var step = input.length;
      if (seq[step] === i){
        fire(i, false, 240);
        input.push(i);
        if (input.length === seq.length){
          accepting = false;
          setEnabled(false);
          elReplay.disabled = true;
          if (seq.length > best){
            best = seq.length;
            elBest.textContent = best;
          }
          hud('hudMatch');
          say('stMatch');
          later(nextRound, 900);
        }
      } else {
        fire(i, true, 700);
        accepting = false;
        playing = false;
        setEnabled(false);
        elReplay.disabled = true;
        hud('hudLost');
        say('stLost', seq.length - 1);
        label('gAgain');
        seq = [];
        elRound.textContent = '0';
      }
    }

    elStart.addEventListener('click', function(){
      clearTimers();
      seq = []; input = []; playing = true;
      label('gRestart');
      elLen.textContent = '0';
      nextRound();
    });

    elReplay.addEventListener('click', function(){
      if (!playing || !seq.length) return;
      clearTimers();
      play();
    });
  })();

  /* ============================================================
     RESERVOIR VISUALISATION
     Fixed sparse recurrent topology, drifting nodes,
     spikes propagating hop by hop along the edges.
     ============================================================ */
  var canvas = document.getElementById('reservoir');
  var ctx = canvas.getContext('2d', { alpha: true });
  var nodes = [], edges = [], adj = [], pulses = [];
  var W = 0, H = 0, dpr = 1, raf = null, last = 0, seedTimer = 0, visible = true;

  function count(){
    var w = window.innerWidth;
    if (w < 560) return 30;
    if (w < 1024) return 52;
    return 88;
  }

  function build(){
    var n = count();
    nodes = [];
    for (var i = 0; i < n; i++){
      // sunflower-ish placement keeps density even without clumping
      var a = i * 2.39996, r = Math.sqrt((i + 0.6) / n);
      var jx = (Math.random() - 0.5) * 0.07, jy = (Math.random() - 0.5) * 0.07;
      nodes.push({
        ax: 0.5 + (Math.cos(a) * r * 0.46) + jx,
        ay: 0.5 + (Math.sin(a) * r * 0.46) + jy,
        ph: Math.random() * Math.PI * 2,
        fq: 0.22 + Math.random() * 0.35,
        amp: 0.004 + Math.random() * 0.009,
        base: 1.1 + Math.random() * 1.1,
        flash: 0,
        x: 0, y: 0
      });
    }
    // sparse topology: each node links to its 2-3 nearest neighbours
    edges = []; adj = nodes.map(function(){ return []; });
    var seen = {};
    nodes.forEach(function(nd, i){
      var d = nodes.map(function(o, j){
        return { j: j, d: Math.hypot(o.ax - nd.ax, o.ay - nd.ay) };
      }).sort(function(a, b){ return a.d - b.d; });
      var k = 2 + (i % 2);
      for (var m = 1; m <= k && m < d.length; m++){
        var j = d[m].j, key = Math.min(i, j) + ':' + Math.max(i, j);
        if (seen[key]) continue;
        seen[key] = 1;
        edges.push([i, j]);
        adj[i].push(j); adj[j].push(i);
      }
    });
    document.querySelectorAll('[data-meta]').forEach(function(el){
      el.textContent = el.dataset.meta === 'n' ? nodes.length : edges.length;
    });
  }

  function resize(){
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = rect.width; H = rect.height;
  }

  function seed(){
    if (!nodes.length) return;
    var i = (Math.random() * nodes.length) | 0;
    nodes[i].flash = 1;
    adj[i].forEach(function(j){
      if (pulses.length < 70) pulses.push({ a: i, b: j, t: 0, gen: 0 });
    });
  }

  function step(dt){
    var time = performance.now() / 1000;
    var pad = Math.min(W, H) * 0.08;

    // node positions
    for (var i = 0; i < nodes.length; i++){
      var nd = nodes[i];
      nd.x = pad + (nd.ax + Math.sin(time * nd.fq + nd.ph) * nd.amp) * (W - 2 * pad);
      nd.y = pad + (nd.ay + Math.cos(time * nd.fq * 0.83 + nd.ph) * nd.amp) * (H - 2 * pad);
      nd.flash = Math.max(0, nd.flash - dt * 1.7);
    }

    // pulses
    var next = [];
    for (var p = 0; p < pulses.length; p++){
      var pl = pulses[p];
      var a = nodes[pl.a], b = nodes[pl.b];
      var len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      pl.t += dt * (170 / len);
      if (pl.t >= 1){
        b.flash = 1;
        if (pl.gen < 3 && pulses.length + next.length < 70){
          var nb = adj[pl.b];
          for (var q = 0; q < nb.length; q++){
            if (nb[q] === pl.a) continue;
            if (Math.random() < 0.62) next.push({ a: pl.b, b: nb[q], t: 0, gen: pl.gen + 1 });
          }
        }
      } else {
        next.push(pl);
      }
    }
    pulses = next;

    seedTimer -= dt;
    if (seedTimer <= 0 || pulses.length === 0){
      seed();
      seedTimer = 0.6 + Math.random() * 1.2;
    }
  }

  function draw(){
    ctx.clearRect(0, 0, W, H);

    // edges — faint, like a technical diagram on paper
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = 'rgba(20, 22, 26, 0.10)';
    ctx.beginPath();
    for (var e = 0; e < edges.length; e++){
      var a = nodes[edges[e][0]], b = nodes[edges[e][1]];
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    // nodes
    var t = performance.now() / 1000;
    for (var i = 0; i < nodes.length; i++){
      var nd = nodes[i];
      var pulse = 0.5 + 0.5 * Math.sin(t * 1.5 + nd.ph);
      var r = nd.base + pulse * 0.4 + nd.flash * 2.6;
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      if (nd.flash > 0.02){
        ctx.fillStyle = 'rgba(36, 84, 255, ' + (0.65 + nd.flash * 0.35).toFixed(3) + ')';
        ctx.shadowBlur = 6 * nd.flash;
        ctx.shadowColor = 'rgba(36, 84, 255, 0.5)';
      } else {
        ctx.fillStyle = 'rgba(20, 22, 26, ' + (0.22 + pulse * 0.18).toFixed(3) + ')';
        ctx.shadowBlur = 0;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // travelling spikes
    for (var p = 0; p < pulses.length; p++){
      var pl = pulses[p], A = nodes[pl.a], B = nodes[pl.b];
      var x = A.x + (B.x - A.x) * pl.t, y = A.y + (B.y - A.y) * pl.t;
      // short comet tail
      var tt = Math.max(0, pl.t - 0.16);
      ctx.strokeStyle = 'rgba(36, 84, 255, 0.4)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(A.x + (B.x - A.x) * tt, A.y + (B.y - A.y) * tt);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(36, 84, 255, 0.9)';
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(36, 84, 255, 0.6)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function loop(now){
    raf = requestAnimationFrame(loop);
    if (!last) last = now;
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt);
    draw();
  }

  function start(){
    if (raf || !visible || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(loop);
  }
  function stop(){
    if (raf){ cancelAnimationFrame(raf); raf = null; }
  }

  function init(){
    resize();
    build();
    if (reduce){
      // one static frame: topology stays readable, nothing moves
      step(0.016); draw();
      return;
    }
    start();
  }

  var rt = null;
  window.addEventListener('resize', function(){
    clearTimeout(rt);
    rt = setTimeout(function(){
      var before = nodes.length;
      resize();
      if (count() !== before) build();
      if (reduce){ step(0.016); draw(); }
    }, 200);
  }, { passive:true });

  document.addEventListener('visibilitychange', function(){
    if (document.hidden) stop(); else if (!reduce) start();
  });

  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      visible = entries[0].isIntersecting;
      if (visible){ resize(); if (reduce){ step(0.016); draw(); } }   // the hero tab may have been hidden or resized meanwhile
      if (!reduce){ visible ? start() : stop(); }
    }, { threshold: 0 }).observe(canvas);
  }

  init();
  applyLang();
})();
