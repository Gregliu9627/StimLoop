/* StimLoop — interactive figures (no dependencies) */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- canvas helper ---------- */
  function setup(canvas, cssH) {
    const ctx = canvas.getContext('2d');
    const state = { ctx, w: 0, h: 0 };
    const baseH = cssH || +canvas.getAttribute('height') || 300;
    function fit() {
      const w = canvas.clientWidth || canvas.parentElement.clientWidth;
      const h = cssH === 0 ? canvas.clientHeight : Math.round(Math.min(baseH, Math.max(220, w * 0.7)));
      if (cssH !== 0) canvas.style.height = h + 'px';
      canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      state.w = w; state.h = h;
    }
    fit();
    state.fit = fit;
    return state;
  }
  // run an animation loop only while the element is on screen
  function animateWhileVisible(el, frame) {
    let visible = false, raf = 0, last = performance.now();
    const loop = (t) => { const dt = Math.min(0.05, (t - last) / 1000); last = t; frame(dt, t / 1000); if (visible) raf = requestAnimationFrame(loop); };
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduceMotion) { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
    }, { rootMargin: '80px' }).observe(el);
    frame(0, 0); // one static frame (also the reduced-motion view)
  }
  let resizeTimer;
  const resizeHooks = [];
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => resizeHooks.forEach(f => f()), 120); });

  /* ---------- nav ---------- */
  const nav = $('.nav'), toggle = $('.nav-toggle'), links = $('.nav-links');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => { links.classList.remove('open'); toggle.setAttribute('aria-expanded', false); }));
  const navMap = new Map($$('.nav-links a[href^="#"]:not(.btn)').map(a => [a.getAttribute('href').slice(1), a]));
  const secObs = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting && navMap.has(e.target.id)) { navMap.forEach(a => a.classList.remove('active')); navMap.get(e.target.id).classList.add('active'); }
  }), { rootMargin: '-45% 0px -50% 0px' });
  navMap.forEach((_, id) => { const s = document.getElementById(id); if (s) secObs.observe(s); });

  /* ---------- reveal on scroll ---------- */
  const revealEls = $$('.sec-head, .card, .mod, .pillar, .tl, .need-card, .step, .mcard, .pipeline, .diff, .stats');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealEls.forEach(el => el.classList.add('reveal'));
    const ro = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => ro.observe(el));
  }

  /* ---------- hero: multichannel neural traces ---------- */
  (function hero() {
    const canvas = $('#hero-canvas'); if (!canvas) return;
    const S = setup(canvas, 0);
    resizeHooks.push(S.fit);
    const N = 11;
    const chans = Array.from({ length: N }, (_, i) => ({
      comps: Array.from({ length: 4 }, () => ({ f: 0.6 + Math.random() * 5.5, a: 0.3 + Math.random(), p: Math.random() * 6.28 })),
      hi: i === 6,
    }));
    let t = 0;
    animateWhileVisible(canvas, (dt) => {
      t += dt;
      const { ctx, w, h } = S;
      ctx.clearRect(0, 0, w, h);
      const top = h * 0.12, gap = (h * 0.8) / (N - 1);
      const x0 = w * 0.3;
      for (let c = 0; c < N; c++) {
        const ch = chans[c], y0 = top + c * gap;
        ctx.beginPath();
        for (let x = x0; x <= w; x += 3) {
          const u = x / 140 + t * 0.9;
          let v = 0;
          for (const k of ch.comps) v += k.a * Math.sin(k.f * u + k.p);
          if (ch.hi) {
            // a TI-style burst: fast carrier inside a slow travelling envelope
            const env = Math.pow(Math.max(0, Math.cos((x / w) * 6 - t * 1.4)), 6);
            v = v * 0.35 + env * 3.2 * Math.sin(u * 22);
          }
          const y = y0 + v * (ch.hi ? 6 : 5);
          x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const fade = ctx.createLinearGradient(x0, 0, w, 0);
        if (ch.hi) { fade.addColorStop(0, 'rgba(52,211,255,0)'); fade.addColorStop(0.35, 'rgba(52,211,255,.85)'); fade.addColorStop(1, 'rgba(159,232,255,.9)'); ctx.lineWidth = 1.6; }
        else { fade.addColorStop(0, 'rgba(47,123,255,0)'); fade.addColorStop(0.4, 'rgba(47,123,255,.32)'); fade.addColorStop(1, 'rgba(90,150,255,.42)'); ctx.lineWidth = 1; }
        ctx.strokeStyle = fade; ctx.stroke();
      }
      // scanning "read head"
      const sx = x0 + ((t * 70) % (w - x0));
      const g = ctx.createLinearGradient(sx - 120, 0, sx, 0);
      g.addColorStop(0, 'rgba(52,211,255,0)'); g.addColorStop(1, 'rgba(52,211,255,.08)');
      ctx.fillStyle = g; ctx.fillRect(sx - 120, 0, 120, h);
      ctx.fillStyle = 'rgba(52,211,255,.35)'; ctx.fillRect(sx, 0, 1, h);
    });
  })();

  /* ---------- platform loop ---------- */
  (function loop() {
    const g = $('#loop-nodes'); if (!g) return;
    const stages = [
      { s: 'Acquire', t: 'Acquire', b: 'Neural signals arrive through one source interface, whether they come from a live amplifier, a recorded file or a simulator.',
        l: ['EEG, ECoG and LFP sources behind a fixed plugin interface', 'Clock alignment between acquisition and controller time', 'Per-channel quality flags; known bad channels excluded'] },
      { s: 'Estimate', t: 'Estimate the state', b: 'Stateful, causal filtering turns raw voltage into features without using any future samples, so live and offline results match.',
        l: ['Trailing-window band-power features', 'A normalized, continuous feedback measure', 'No disease classifier in the core'] },
      { s: 'Control', t: 'Control', b: 'Controllers propose the next parameters from the calibrated response, one bounded step at a time.',
        l: ['bounded_step · adaptive_gain (ARX/Kalman) · gp_bandit (GP-UCB)', 'Amplitude, pulse width and frequency as control dimensions', 'A HOLD / STEP gate decides whether parameters may change'] },
      { s: 'Supervise', t: 'Supervise', b: 'Every proposed output passes a protocol-aware supervisor before it reaches the device.',
        l: ['Typed SCS / DBS / TMS / TI protocols with unit and capability checks', 'Amplitude, waveform and charge limits within a session budget', 'An ALLOW / WAIT / SUSPEND gate; faults latch'] },
      { s: 'Stimulate', t: 'Stimulate & verify', b: 'Approved output goes to the attached stimulator through its device adapter, and the record shows what was actually delivered.',
        l: ['SCS, DBS, TMS and TI devices behind one stimulator interface', 'Delivery is confirmed by device evidence, never by the request alone', 'Unknown output is never retried automatically'] },
      { s: 'Reassess', t: 'Reassess', b: 'The next signal window closes the loop: the response is measured again and becomes new evidence.',
        l: ['Every window is quality-checked before it is used', 'On artifact or uncertain windows the controller abstains instead of guessing', 'Trusted feedback drives the next bounded step'] },
    ];
    const cal = { t: 'Calibrator', b: 'Each session starts by learning how this subject responds, before any adaptive control begins. The response model it builds is what the controller works from.',
      l: ['Zero-reference and active trials on a configurable schedule', 'Estimates response direction, gain, drift and uncertainty', 'Uncertain or unreachable targets stop output instead of escalating it', 'Between sessions, verified records suggest the next starting parameters'] };
    const NS = 'http://www.w3.org/2000/svg';
    const nodes = stages.map((st, i) => {
      const a = (-90 + i * 60) * Math.PI / 180, x = 300 + 210 * Math.cos(a), y = 300 + 210 * Math.sin(a);
      const n = document.createElementNS(NS, 'g');
      n.setAttribute('class', 'lnode'); n.setAttribute('tabindex', '0'); n.setAttribute('role', 'button');
      n.setAttribute('aria-label', `Stage ${i + 1}: ${st.t}`);
      n.innerHTML = `<circle class="bg" cx="${x}" cy="${y}" r="48"/><text class="num" x="${x}" y="${y - 8}" text-anchor="middle">0${i + 1}</text><text class="lbl" x="${x}" y="${y + 13}" text-anchor="middle">${st.s}</text>`;
      g.appendChild(n);
      return n;
    });
    // item 0 is the calibrator (session start), items 1..6 the stages on the ring
    const calNode = $('#loop-cal');
    const items = [cal, ...stages], els = [calNode, ...nodes];
    let cur = 0, auto = true, timer;
    function show(i) {
      cur = (i + items.length) % items.length;
      const st = items[cur];
      els.forEach((n, k) => n && n.classList.toggle('active', k === cur));
      $('#ld-step').textContent = cur === 0 ? 'Session start' : `Stage ${cur} / ${stages.length}`;
      $('#ld-title').textContent = st.t;
      $('#ld-body').textContent = st.b;
      $('#ld-list').innerHTML = st.l.map(x => `<li>${x}</li>`).join('');
    }
    const stop = () => { auto = false; clearInterval(timer); };
    els.forEach((n, i) => {
      if (!n) return;
      n.addEventListener('click', () => { stop(); show(i); });
      n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stop(); show(i); } });
    });
    $('#ld-prev').addEventListener('click', () => { stop(); show(cur - 1); });
    $('#ld-next').addEventListener('click', () => { stop(); show(cur + 1); });
    show(0);
    // travelling pulses on the ring
    const d1 = $('#loop-dot1'), d2 = $('#loop-dot2');
    let ph = 0;
    animateWhileVisible($('#loop-svg'), (dt) => {
      ph += dt * (2 * Math.PI / 7);
      [[d1, ph], [d2, ph + Math.PI]].forEach(([d, a]) => { d.setAttribute('cx', 300 + 210 * Math.sin(a)); d.setAttribute('cy', 300 - 210 * Math.cos(a)); });
    });
    if (!reduceMotion) timer = setInterval(() => auto && show(cur + 1), 6000);
  })();

  /* ---------- tTIS: interference waveform ---------- */
  (function tiWave() {
    const canvas = $('#ti-wave'); if (!canvas) return;
    const S = setup(canvas);
    resizeHooks.push(S.fit);
    const el = id => document.getElementById(id);
    const P = { f: 2000, df: 10, a1: 1000, a2: 1000, mode: 'ti' };
    let k = 0; // integer sample offset → no aliasing shimmer while scrolling
    function sync() {
      P.f = +el('ti-f').value; P.df = +el('ti-df').value; P.a1 = +el('ti-a1').value; P.a2 = +el('ti-a2').value;
      const df = P.mode === 'sham' ? 0 : P.df;
      el('ti-f-o').textContent = P.f + ' Hz';
      el('ti-df-o').textContent = (P.mode === 'sham' ? 0 : P.df) + ' Hz';
      el('ti-a1-o').textContent = P.a1 + ' µA';
      el('ti-a2-o').textContent = P.a2 + ' µA';
      el('ti-df').disabled = P.mode === 'sham';
      el('ro-env').textContent = df ? df + ' Hz' : 'none';
      el('ro-f2').textContent = (P.f + df) + ' Hz';
      const md = (P.a1 + P.a2) ? (df ? 2 * Math.min(P.a1, P.a2) / (P.a1 + P.a2) * 100 : 0) : 0;
      el('ro-md').textContent = md.toFixed(0) + '%';
    }
    ['ti-f', 'ti-df', 'ti-a1', 'ti-a2'].forEach(id => el(id).addEventListener('input', () => { sync(); if (reduceMotion) draw(0); }));
    $$('#ttis [data-mode]').forEach(b => b.addEventListener('click', () => {
      $$('#ttis [data-mode]').forEach(x => x.classList.toggle('active', x === b));
      P.mode = b.dataset.mode; sync(); if (reduceMotion) draw(0);
    }));
    sync();

    function lane(ctx, x0, w, yc, amp, T, nS, t0, fn, color, lw) {
      ctx.beginPath();
      for (let i = 0; i <= nS; i++) {
        const t = t0 + (i / nS) * T;
        const y = yc - fn(t) * amp;
        const x = x0 + (i / nS) * w;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
    }
    function label(ctx, txt, x, y, c) { ctx.fillStyle = c; ctx.font = '11px "JetBrains Mono", monospace'; ctx.fillText(txt, x, y); }

    function draw(dt) {
      const { ctx, w, h } = S;
      ctx.clearRect(0, 0, w, h);
      const df = P.mode === 'sham' ? 0 : P.df;
      const T = df ? 3 / df : 0.3;
      const nS = Math.round(w * 3);
      const dtS = T / nS;
      k += reduceMotion ? 0 : Math.max(1, Math.round(nS / 900));
      const t0 = k * dtS;
      const pad = 12, x0 = pad, ww = w - 2 * pad;
      const Amax = 2000;
      const w1 = 2 * Math.PI * P.f, w2 = 2 * Math.PI * (P.f + df);
      // grid
      ctx.strokeStyle = 'rgba(130,165,255,.07)'; ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) { const x = x0 + ww * i / 6; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      const l1 = h * 0.14, l2 = h * 0.35, l3 = h * 0.73;
      const ampC = h * 0.075, ampS = h * 0.14;
      lane(ctx, x0, ww, l1, ampC, T, nS, t0, t => P.a1 / Amax * Math.sin(w1 * t), 'rgba(47,123,255,.85)', 1);
      lane(ctx, x0, ww, l2, ampC, T, nS, t0, t => P.a2 / Amax * Math.sin(w2 * t), 'rgba(52,211,255,.85)', 1);
      ctx.strokeStyle = 'rgba(130,165,255,.12)'; ctx.beginPath(); ctx.moveTo(x0, h * 0.47); ctx.lineTo(x0 + ww, h * 0.47); ctx.stroke();
      lane(ctx, x0, ww, l3, ampS, T, nS, t0, t => (P.a1 * Math.sin(w1 * t) + P.a2 * Math.sin(w2 * t)) / Amax, 'rgba(210,240,255,.75)', 1);
      // analytic envelope
      const env = t => Math.sqrt(P.a1 * P.a1 + P.a2 * P.a2 + 2 * P.a1 * P.a2 * Math.cos(2 * Math.PI * df * t)) / Amax;
      ctx.setLineDash([5, 4]);
      lane(ctx, x0, ww, l3, ampS, T, 300, t0, env, 'rgba(255,180,84,.95)', 1.6);
      lane(ctx, x0, ww, l3, ampS, T, 300, t0, t => -env(t), 'rgba(255,180,84,.95)', 1.6);
      ctx.setLineDash([]);
      label(ctx, `CH1  ${P.f} Hz`, x0 + 4, 14, 'rgba(120,170,255,.95)');
      label(ctx, `CH2  ${P.f + df} Hz`, x0 + 4, h * 0.235, 'rgba(52,211,255,.95)');
      label(ctx, df ? `SUM AT TARGET · envelope ${df} Hz` : 'SUM AT TARGET · sham: no envelope', x0 + 4, h * 0.5 + 6, 'rgba(255,180,84,.95)');
      label(ctx, `window ${(T * 1000).toFixed(T < 0.1 ? 1 : 0)} ms`, w - pad - 110, h - 8, 'rgba(139,152,176,.8)');
    }
    animateWhileVisible(canvas, draw);
  })();

  /* ---------- tTIS: steerable focus (2-D field model) ---------- */
  (function tiField() {
    const canvas = $('#ti-field'); if (!canvas) return;
    const S = setup(canvas);
    const N = 120, R = 0.92;
    const off = document.createElement('canvas'); off.width = N; off.height = N;
    const octx = off.getContext('2d'); const img = octx.createImageData(N, N);
    const pol = d => [Math.cos(d * Math.PI / 180), Math.sin(d * Math.PI / 180)];
    const P1 = [pol(150), pol(210)], P2 = [pol(30), pol(-30)];
    let view = 'ti', ratio = 1, peak = [0, 0];
    const stops = [[0, [5, 10, 22]], [0.3, [14, 38, 98]], [0.58, [47, 123, 255]], [0.8, [52, 211, 255]], [1, [236, 252, 255]]];
    function cmap(v) {
      v = Math.max(0, Math.min(1, v));
      for (let i = 1; i < stops.length; i++) if (v <= stops[i][0]) {
        const [a, ca] = stops[i - 1], [b, cb] = stops[i], u = (v - a) / (b - a);
        return ca.map((c, j) => c + (cb[j] - c) * u);
      }
      return stops[stops.length - 1][1];
    }
    function field(x, y, [a, b], I) {
      const rx = x - a[0], ry = y - a[1], sx = x - b[0], sy = y - b[1];
      const ra = rx * rx + ry * ry + 1e-4, rb = sx * sx + sy * sy + 1e-4;
      return [I * (rx / ra - sx / rb), I * (ry / ra - sy / rb)];
    }
    function compute() {
      const I1 = ratio >= 1 ? 1 / ratio : 1, I2 = ratio >= 1 ? 1 : ratio; // keep max current = 1
      const vals = new Float32Array(N * N); const inside = [];
      let best = -1;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = (i + 0.5) / N * 2 - 1, y = (j + 0.5) / N * 2 - 1;
        if (x * x + y * y > R * R) { vals[j * N + i] = -1; continue; }
        const e1 = field(x, y, P1, I1), e2 = field(x, y, P2, I2);
        let v;
        if (view === 'single') v = Math.hypot(e1[0], e1[1]);
        else {
          let A = e1, B = e2, mA = Math.hypot(...A), mB = Math.hypot(...B);
          if (mB > mA) { [A, B] = [B, A]; [mA, mB] = [mB, mA]; }
          let dot = A[0] * B[0] + A[1] * B[1];
          if (dot < 0) { B = [-B[0], -B[1]]; dot = -dot; }
          const cos = dot / (mA * mB);
          if (mB < mA * cos) v = 2 * mB;
          else { const D = [A[0] - B[0], A[1] - B[1]]; v = 2 * Math.abs(B[0] * D[1] - B[1] * D[0]) / Math.hypot(...D); }
        }
        vals[j * N + i] = v; inside.push(v);
        if (v > best) { best = v; peak = [x, y]; }
      }
      inside.sort((a, b) => a - b);
      const ref = inside[Math.floor(inside.length * (view === 'single' ? 0.97 : 0.998))];
      for (let p = 0; p < N * N; p++) {
        const v = vals[p], o = p * 4;
        if (v < 0) { img.data[o + 3] = 0; continue; }
        const c = cmap(Math.pow(v / ref, view === 'single' ? 0.8 : 1.15));
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      draw();
    }
    function draw() {
      const { ctx, w, h } = S;
      ctx.clearRect(0, 0, w, h);
      const size = Math.min(h - 24, w - 90), cx = (w - 46) / 2, cy = h / 2, half = size / 2;
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(off, cx - half, cy - half, size, size);
      const toPx = ([x, y]) => [cx + x * half, cy + y * half];
      // head outline
      ctx.beginPath(); ctx.arc(cx, cy, half * R, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(200,220,255,.45)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, half * R * 0.5, 0, Math.PI * 2); ctx.setLineDash([2, 5]); ctx.strokeStyle = 'rgba(200,220,255,.18)'; ctx.stroke(); ctx.setLineDash([]);
      // electrodes
      const el = (p, txt, col) => { const [x, y] = toPx(p.map(v => v * R)); ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#050a16'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#cfe2ff'; ctx.font = '10.5px "JetBrains Mono", monospace'; ctx.fillText(txt, x + (p[0] < 0 ? -40 : 11), y + 4); };
      el(P1[0], 'CH1+', '#2f7bff'); el(P1[1], 'CH1−', '#2f7bff');
      if (view === 'ti') { el(P2[0], 'CH2+', '#34d3ff'); el(P2[1], 'CH2−', '#34d3ff'); }
      // peak marker
      if (view === 'ti') {
        const [px, py] = toPx(peak);
        ctx.strokeStyle = '#ffb454'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(px, py, 9, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px - 15, py); ctx.lineTo(px - 11, py); ctx.moveTo(px + 11, py); ctx.lineTo(px + 15, py); ctx.moveTo(px, py - 15); ctx.lineTo(px, py - 11); ctx.moveTo(px, py + 11); ctx.lineTo(px, py + 15); ctx.stroke();
        const depth = (1 - Math.hypot(...peak) / R) * 100;
        ctx.fillStyle = '#ffb454'; ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(`focus depth · ${depth.toFixed(0)}% of radius`, 10, 18);
      } else {
        ctx.fillStyle = 'rgba(255,180,84,.95)'; ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText('field peaks at the scalp', 10, 18);
      }
      // colour bar
      const bx = w - 30, by = cy - half * 0.8, bh = half * 1.6;
      for (let i = 0; i < bh; i++) { const c = cmap(1 - i / bh); ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; ctx.fillRect(bx, by + i, 10, 1.2); }
      ctx.strokeStyle = 'rgba(130,165,255,.3)'; ctx.strokeRect(bx, by, 10, bh);
      ctx.fillStyle = 'rgba(139,152,176,.9)'; ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('high', bx - 6, by - 6); ctx.fillText('low', bx - 3, by + bh + 13);
    }
    const slider = $('#ti-ratio'), out = $('#ti-ratio-o');
    function onRatio() {
      ratio = Math.pow(2, +slider.value / 40); // I2 / I1
      const a = ratio >= 1 ? 1 / ratio : 1, b = ratio >= 1 ? 1 : ratio;
      out.textContent = `${a.toFixed(2)} : ${b.toFixed(2)}`;
      compute();
    }
    slider.addEventListener('input', onRatio);
    $$('#ttis [data-view]').forEach(b => b.addEventListener('click', () => {
      $$('#ttis [data-view]').forEach(x => x.classList.toggle('active', x === b));
      view = b.dataset.view; slider.disabled = view === 'single'; compute();
    }));
    resizeHooks.push(() => { S.fit(); draw(); });
    onRatio();
  })();

  /* ---------- state monitor (illustrative closed loop) ---------- */
  (function monitor() {
    const canvas = $('#state-canvas'); if (!canvas) return;
    const S = setup(canvas);
    resizeHooks.push(S.fit);
    const stateLbl = $('#mon-state');
    const LEN = 600;
    const trace = new Float32Array(LEN), idx = new Float32Array(LEN), stim = new Uint8Array(LEN);
    let head = 0, t = 0, s = 0.1, drift = 0, stimOn = 0, acc = 0, acc2 = 0;
    const bands = [{ n: 'δ', v: .5 }, { n: 'θ', v: .4 }, { n: 'α', v: .6 }, { n: 'β', v: .35 }, { n: 'γ', v: .2 }];
    const lo = -0.35, hi = 0.35;
    let phase = [0, 0, 0, 0, 0];
    function step(dt) {
      t += dt;
      // latent state: slow random drift + periodic disturbance, pulled back while stimulation is on
      drift += (Math.random() - 0.5) * 0.06 - drift * 0.01;
      const disturb = 0.55 * Math.sin(t * 0.21) + 0.25 * Math.sin(t * 0.57 + 1);
      const target = 0;
      s += dt * (0.9 * (disturb + drift - s)) - dt * stimOn * 1.6 * (s - target);
      // controller: output ALLOW when outside target range, hold a little hysteresis
      if (s > hi || s < lo) stimOn = Math.min(1, stimOn + dt * 2);
      else if (Math.abs(s) < 0.18) stimOn = Math.max(0, stimOn - dt * 1.5);
      // eeg sample(s)
      const f = [2, 6, 10, 20, 40], amp = [0.9 + 0.5 * s, 0.6, 0.9 - 0.7 * s, 0.35 + 0.35 * s, 0.15];
      acc += dt * 60; acc2 += dt;
      while (acc >= 1) {
        acc -= 1;
        let v = 0;
        for (let i = 0; i < 5; i++) { phase[i] += 2 * Math.PI * f[i] / 160; v += Math.max(0.05, amp[i]) * Math.sin(phase[i]); }
        v += (Math.random() - 0.5) * 0.5;
        trace[head] = v; idx[head] = s; stim[head] = stimOn > 0.5 ? 1 : 0;
        head = (head + 1) % LEN;
      }
      for (let i = 0; i < 5; i++) bands[i].v += (Math.max(0.05, amp[i]) * (0.85 + Math.random() * 0.3) / 1.5 - bands[i].v) * Math.min(1, dt * 3);
      const out = s > hi || s < lo;
      stateLbl.textContent = stimOn > 0.5 ? (out ? 'out of range · output ALLOW' : 'returning · output ALLOW') : 'in target range · output WAIT';
      stateLbl.classList.toggle('out', stimOn > 0.5);
    }
    // warm up the buffer so the first frame is already populated
    for (let i = 0; i < 700; i++) step(1 / 60);
    function draw(dt) {
      if (dt) step(dt);
      const { ctx, w, h } = S;
      ctx.clearRect(0, 0, w, h);
      const narrow = w < 520;
      const plotW = narrow ? w - 24 : w * 0.7, x0 = 12;
      const yT = h * 0.24, aT = h * 0.085;
      const iTop = h * 0.48, iBot = h - 26, iH = iBot - iTop;
      const yOf = v => iTop + (1 - (v + 0.9) / 1.8) * iH;
      ctx.font = '10.5px "JetBrains Mono", monospace';
      // EEG trace
      ctx.fillStyle = 'rgba(139,152,176,.9)'; ctx.fillText('EEG · Fz (synthetic)', x0, 16);
      ctx.beginPath();
      for (let i = 0; i < LEN; i++) { const v = trace[(head + i) % LEN]; const x = x0 + i / (LEN - 1) * plotW; const y = yT - v * aT; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.strokeStyle = 'rgba(120,170,255,.85)'; ctx.lineWidth = 1; ctx.stroke();
      // target band
      ctx.fillStyle = 'rgba(62,224,161,.08)'; ctx.fillRect(x0, yOf(hi), plotW, yOf(lo) - yOf(hi));
      ctx.strokeStyle = 'rgba(62,224,161,.35)'; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x0, yOf(hi)); ctx.lineTo(x0 + plotW, yOf(hi)); ctx.moveTo(x0, yOf(lo)); ctx.lineTo(x0 + plotW, yOf(lo)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(139,152,176,.9)'; ctx.fillText('state index · target range', x0, iTop - 8);
      // stim ribbons
      ctx.fillStyle = 'rgba(255,180,84,.85)';
      for (let i = 0; i < LEN; i++) if (stim[(head + i) % LEN]) ctx.fillRect(x0 + i / (LEN - 1) * plotW, iBot + 8, plotW / LEN + 0.6, 5);
      ctx.fillStyle = 'rgba(255,180,84,.8)'; ctx.fillText('tTIS output', x0 + plotW - 78, h - 2);
      // index line
      ctx.beginPath();
      for (let i = 0; i < LEN; i++) { const v = idx[(head + i) % LEN]; const x = x0 + i / (LEN - 1) * plotW; const y = yOf(v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      const lg = ctx.createLinearGradient(x0, 0, x0 + plotW, 0); lg.addColorStop(0, 'rgba(52,211,255,.2)'); lg.addColorStop(1, 'rgba(159,232,255,1)');
      ctx.strokeStyle = lg; ctx.lineWidth = 1.8; ctx.stroke();
      const lastY = yOf(idx[(head + LEN - 1) % LEN]);
      ctx.beginPath(); ctx.arc(x0 + plotW, lastY, 3.5, 0, 7); ctx.fillStyle = '#9fe8ff'; ctx.fill();
      // band power bars
      if (!narrow) {
        const bx0 = w * 0.76, bw = w * 0.22, bTop = 34, bBot = h - 26, n = bands.length, gap = 8, barW = (bw - gap * (n - 1)) / n;
        ctx.fillStyle = 'rgba(139,152,176,.9)'; ctx.fillText('band power', bx0, 16);
        bands.forEach((b, i) => {
          const x = bx0 + i * (barW + gap), hh = Math.min(1, b.v) * (bBot - bTop);
          const g = ctx.createLinearGradient(0, bBot - hh, 0, bBot); g.addColorStop(0, '#34d3ff'); g.addColorStop(1, 'rgba(47,123,255,.25)');
          ctx.fillStyle = 'rgba(130,165,255,.08)'; ctx.fillRect(x, bTop, barW, bBot - bTop);
          ctx.fillStyle = g; ctx.fillRect(x, bBot - hh, barW, hh);
          ctx.fillStyle = 'rgba(207,216,232,.9)'; ctx.font = '12px "JetBrains Mono", monospace'; ctx.fillText(b.n, x + barW / 2 - 4, bBot + 16);
        });
        ctx.font = '10.5px "JetBrains Mono", monospace';
      }
    }
    animateWhileVisible(canvas, draw);
  })();
  /* ---------- personal-by-design loop video: respect reduced motion ---------- */
  (function personaVideo() {
    const v = $('#persona-vid'); if (!v) return;
    if (reduceMotion) { v.removeAttribute('autoplay'); v.pause(); v.setAttribute('controls', ''); }
  })();

  /* ---------- planning chart: hover / focus tooltip ---------- */
  (function planTip() {
    const fig = document.querySelector('.plan-chart');
    if (!fig) return;
    const tip = fig.querySelector('.pc-tip');
    function show(bar) {
      tip.textContent = bar.dataset.tip;
      tip.hidden = false;
      const f = fig.getBoundingClientRect(), b = bar.getBoundingClientRect();
      const x = Math.min(b.right - f.left + 8, f.width - tip.offsetWidth);
      tip.style.left = Math.max(0, x) + 'px';
      tip.style.maxWidth = f.width + 'px';
      tip.style.top = (b.top - f.top - tip.offsetHeight - 6) + 'px';
    }
    fig.querySelectorAll('.pc-bar').forEach(bar => {
      bar.addEventListener('pointerenter', () => show(bar));
      bar.addEventListener('focus', () => show(bar));
      bar.addEventListener('pointerleave', () => { tip.hidden = true; });
      bar.addEventListener('blur', () => { tip.hidden = true; });
    });
  })();
})();
