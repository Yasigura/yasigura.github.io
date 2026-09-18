// === зерно поверх страницы ===
(function () {
  var n = document.createElement('canvas');
  n.width = n.height = 180;

  var g = n.getContext('2d');
  var img = g.createImageData(180, 180);
  var d = img.data;

  for (var i = 0; i < d.length; i += 4) {
    var v = 110 + (Math.random() - 0.5) * 190;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 42;
  }

  g.putImageData(img, 0, 0);
  document.getElementById('grain').style.backgroundImage = 'url(' + n.toDataURL() + ')';
})();

// === пыль по всей сцене ===
(function () {
  var container = document.getElementById('dust');
  var rand = function (min, max) { return min + Math.random() * (max - min); };

  for (var i = 0; i < 42; i++) {
    var mote = document.createElement('span');
    mote.className = 'mote';
    mote.style.left = rand(0, 100) + '%';
    mote.style.top = rand(0, 100) + '%';
    mote.style.setProperty('--size', rand(1, 3).toFixed(1) + 'px');
    mote.style.setProperty('--o', rand(.08, .24).toFixed(2));
    mote.style.setProperty('--dur', rand(16, 30).toFixed(1) + 's');
    mote.style.setProperty('--delay', rand(-20, 5).toFixed(1) + 's');
    mote.style.setProperty('--dx', rand(-200, 200).toFixed(0) + 'px');
    mote.style.setProperty('--dy', rand(-200, 200).toFixed(0) + 'px');
    container.appendChild(mote);
  }
})();

// === переключатель звука ===
(function () {
  var btn = document.getElementById('soundToggle');
  var label = btn.querySelector('.sound-label');
  var audio = document.getElementById('bgAudio');
  var eq = document.getElementById('eq');
  var credit = document.getElementById('credit');
  var bars = eq.querySelectorAll('.eq-bar');
  var bandRanges = [];
  var audioCtx, analyser, dataArray, source, rafId;

  function syncEqWidth() {
    eq.style.width = btn.offsetWidth + 'px';
  }
  syncEqWidth();
  window.addEventListener('resize', syncEqWidth);

  function setupAudioGraph() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    source = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.35; // меньше = резче реагирует
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    // делим спектр на полосы логарифмически (как в настоящих эквалайзерах) —
    // иначе верхние частоты почти не попадают в бины и полоски стоят колом
    var bins = analyser.frequencyBinCount;
    for (var i = 0; i < bars.length; i++) {
      var start = Math.max(1, Math.floor(Math.pow(i / bars.length, 2) * bins));
      var end = Math.max(start + 1, Math.floor(Math.pow((i + 1) / bars.length, 2) * bins));
      bandRanges.push([start, Math.min(end, bins)]);
    }
  }

  function tick() {
    analyser.getByteFrequencyData(dataArray);
    for (var i = 0; i < bars.length; i++) {
      var range = bandRanges[i];
      var sum = 0;
      for (var j = range[0]; j < range[1]; j++) sum += dataArray[j];
      var avg = sum / (range[1] - range[0]);
      var boost = 1 + i * 0.1; // компенсируем то, что у верхов энергии от природы меньше
      var v = Math.min(255, avg * boost * 0.55); // общий запас, чтобы не утыкалось в потолок
      bars[i].style.height = (15 + (v / 255) * 85).toFixed(0) + '%';
    }
    rafId = requestAnimationFrame(tick);
  }

  btn.addEventListener('click', function () {
    if (audio.paused) {
      // создаём/включаем аудио-контекст строго тут, внутри клика —
      // иначе браузер может молча не дать звуку зазвучать
      setupAudioGraph();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      audio.play().catch(function (err) {
        console.error('Не удалось включить звук:', err);
      });
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', function () {
    btn.setAttribute('aria-pressed', 'true');
    label.textContent = 'Стоп';
    eq.classList.add('is-active');
    credit.classList.add('is-active');
    tick();
  });

  audio.addEventListener('pause', function () {
    btn.setAttribute('aria-pressed', 'false');
    label.textContent = 'Звук';
    eq.classList.remove('is-active');
    credit.classList.remove('is-active');
    cancelAnimationFrame(rafId);
  });

  audio.addEventListener('ended', function () {
    audio.currentTime = 0;
  });
})();
