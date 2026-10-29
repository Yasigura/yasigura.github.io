// === глаз из пылинок на странице «Обо мне» ===
(function () {
  var canvas = document.getElementById('form');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rnd = Math.random;

  var IRIS = 0.5;                       // угловой радиус радужки на глазном яблоке
  var PUPIL_DARK = 0.22, PUPIL_LIT = 0.1;
  var CAM = 4;                          // расстояние камеры — сила перспективы

  // склера: пыль по глазному яблоку, кроме места под радужкой
  var sclera = [];
  var golden = Math.PI * (3 - Math.sqrt(5));
  var NS = 2400;
  for (var i = 0; i < NS; i++) {
    var y = 1 - (i / (NS - 1)) * 2;
    var r = Math.sqrt(1 - y * y);
    var a = golden * i + (rnd() - 0.5) * 0.5;
    var x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.acos(-z) < IRIS + 0.03) continue;
    sclera.push([x, y, z]);
  }

  // радужка: радиальные волокна от края зрачка к краю радужки
  // [азимут, u (0 — край зрачка, 1 — край радужки), случайная фаза, тип]
  var iris = [];
  var FIBERS = 110;
  for (var f = 0; f < FIBERS; f++) {
    var phi = (f / FIBERS) * Math.PI * 2;
    var steps = 7 + Math.floor(rnd() * 5);
    for (var s = 0; s < steps; s++) {
      iris.push([phi + (rnd() - 0.5) * 0.06, Math.min(1, (s + rnd() * 0.6) / steps), rnd() * 6.28, 0]);
    }
  }
  for (var p = 0; p < 70; p++) iris.push([p / 70 * 6.2832, 0, rnd() * 6.28, 1]);   // край зрачка
  for (var q = 0; q < 90; q++) iris.push([q / 90 * 6.2832, 1, rnd() * 6.28, 2]);   // край радужки

  var w = 0, h = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  // взгляд: следит за курсором по всей странице
  var lookX = 0, lookY = 0, curX = 0, curY = 0;
  var lastMove = -1e9, nextSaccade = 0;
  window.addEventListener('pointermove', function (e) {
    var rect = canvas.getBoundingClientRect();
    var dx = (e.clientX - (rect.left + rect.width / 2)) / window.innerWidth;
    var dy = (e.clientY - (rect.top + rect.height / 2)) / window.innerHeight;
    lookX = clamp(dx * 1.3, -0.45, 0.45);
    lookY = clamp(dy * 1.0, -0.2, 0.2);
    lastMove = performance.now();
    if (reduceMotion) draw(0);
  });

  // свет: чем ближе курсор к глазу, тем сильнее сужается зрачок и щурится глаз.
  // Реакция начинается примерно за два радиуса глаза от центра
  // само свечение — отдельный слой, который едет за курсором по всей странице
  var lamp = document.getElementById('cursorLight');
  var light = 0, lightTarget = 0;
  var px0 = -9999, py0 = -9999, spx = -9999, spy = -9999;
  function aim(e) {
    var rect = canvas.getBoundingClientRect();
    var R = Math.min(rect.width, rect.height) * 0.36;
    var lx = (e.clientX - rect.left - rect.width / 2) / R;
    var ly = (e.clientY - rect.top - rect.height / 2) / R;
    var dist = Math.sqrt(lx * lx + ly * ly);
    lightTarget = clamp((2 - dist) / 1.1, 0, 1);
    px0 = e.clientX;
    py0 = e.clientY;
    if (spx < -9000) { spx = px0; spy = py0; }
    if (reduceMotion) draw(0);
  }
  function release() {
    lightTarget = 0;
    if (reduceMotion) draw(0);
  }
  window.addEventListener('pointermove', aim);
  window.addEventListener('pointerdown', aim);
  window.addEventListener('pointercancel', release);
  window.addEventListener('pointerup', function (e) {
    if (e.pointerType !== 'mouse') release();
  });
  document.addEventListener('mouseleave', release);

  // разрез век: миндалина в координатах экрана, нормированных на радиус глаза
  var LID_A = 1.05, LID_TOP = 0.58, LID_BOT = 0.5;
  function lidTop(px, open) {
    var k = 1 - (px / LID_A) * (px / LID_A);
    return k <= 0 ? 0 : -LID_TOP * open * Math.pow(k, 0.85);
  }
  function lidBot(px, open) {
    var k = 1 - (px / LID_A) * (px / LID_A);
    return k <= 0 ? 0 : LID_BOT * open * Math.pow(k, 0.95);
  }

  var nextBlink = 1800 + rnd() * 3000, blinkStart = -1;

  function draw(t) {
    var smooth = reduceMotion ? 1 : 0.06;
    light += (lightTarget - light) * smooth;
    var follow = reduceMotion ? 1 : 0.25;
    spx += (px0 - spx) * follow;
    spy += (py0 - spy) * follow;
    if (lamp) {
      lamp.style.transform = 'translate3d(' + spx + 'px,' + spy + 'px,0)';
      lamp.style.opacity = light;
    }

    // если курсор давно не двигался — глаз сам осматривается короткими рывками
    if (!reduceMotion && t - lastMove > 3000 && t > nextSaccade) {
      lookX = (rnd() - 0.5) * 0.6;
      lookY = (rnd() - 0.5) * 0.25;
      nextSaccade = t + 1200 + rnd() * 2600;
    }
    var gaze = reduceMotion ? 1 : 0.18;
    curX += (lookX - curX) * gaze;
    curY += (lookY - curY) * gaze;

    var open = 1;
    if (!reduceMotion) {
      if (blinkStart < 0 && t > nextBlink) blinkStart = t;
      if (blinkStart >= 0) {
        var bt = (t - blinkStart) / 240;
        if (bt >= 1) { blinkStart = -1; nextBlink = t + 2500 + rnd() * 5000; }
        else open = 1 - Math.sin(bt * Math.PI);
      }
    }
    open = Math.max(0.02, open * (1 - 0.22 * light));

    ctx.clearRect(0, 0, w, h);
    var R = Math.min(w, h) * 0.36 * (1 + 0.012 * Math.sin(t * 0.0011));
    var cx = w / 2, cy = h / 2;
    ctx.fillStyle = '#E7E4DD';

    var cosP = Math.cos(curY), sinP = Math.sin(curY);
    var cosY = Math.cos(curX), sinY = Math.sin(curX);

    function plot(x, y, z, alpha, size) {
      var y1 = y * cosP - z * sinP;
      var z1 = y * sinP + z * cosP;
      var x2 = x * cosY - z1 * sinY;
      var z2 = x * sinY + z1 * cosY;
      if (z2 > 0.25) return;
      var persp = CAM / (CAM + z2);
      var px = x2 * persp, py = y1 * persp;
      var top = lidTop(px, open), bot = lidBot(px, open);
      if (py <= top || py >= bot) return;
      // у кромки век пыль гаснет — получается мягкая тень от века
      var edge = Math.min(py - top, bot - py) / 0.12;
      var near = (1 - z2) / 2;
      ctx.globalAlpha = Math.min(1, alpha * near * Math.min(1, edge));
      ctx.beginPath();
      ctx.arc(cx + px * R, cy + py * R, size * persp, 0, 6.2832);
      ctx.fill();
    }

    for (var i = 0; i < sclera.length; i++) {
      var sp = sclera[i];
      plot(sp[0], sp[1], sp[2], 0.6, 0.75);
    }

    var pupil = PUPIL_DARK + (PUPIL_LIT - PUPIL_DARK) * light;
    for (var j = 0; j < iris.length; j++) {
      var ip = iris[j];
      var u = ip[1];
      if (ip[3] === 0) u = clamp(u + 0.025 * Math.sin(t * 0.002 + ip[2]), 0, 1);
      var ang = pupil + u * (IRIS - pupil);
      var sa = Math.sin(ang);
      var alpha, size;
      if (ip[3] === 1) { alpha = 1.2; size = 0.9; }
      else if (ip[3] === 2) { alpha = 0.8; size = 0.8; }
      else { alpha = 0.55 + 0.6 * (1 - u) + 0.3 * light; size = 0.55 + 0.4 * (1 - u); }
      plot(sa * Math.cos(ip[0]), sa * Math.sin(ip[0]), -Math.cos(ang), alpha, size);
    }

    // веки: кромки из более плотной пыли
    for (var k = 0; k <= 140; k++) {
      var lxp = -LID_A + (k / 140) * LID_A * 2;
      var jt = Math.sin(k * 12.9898) * 0.006;
      var yt = lidTop(lxp, open), yb = lidBot(lxp, open);
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(cx + lxp * R, cy + (yt + jt) * R, 0.9, 0, 6.2832);
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(cx + lxp * R, cy + (yb - jt) * R, 0.75, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var visible = true, rafId = 0;
  function frame(t) {
    draw(t);
    rafId = visible ? requestAnimationFrame(frame) : 0;
  }

  resize();
  new ResizeObserver(function () {
    resize();
    if (reduceMotion) draw(0);
  }).observe(canvas);

  if (reduceMotion) {
    draw(0);
    return;
  }

  // не крутим анимацию, пока глаз за пределами экрана
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible && !rafId) rafId = requestAnimationFrame(frame);
  }).observe(canvas);
})();
