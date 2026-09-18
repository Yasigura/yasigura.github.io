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
  var bars = eq.querySelectorAll('.eq-bar');
  var binIndexes = [];
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
    analyser.fftSize = 64;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    for (var i = 0; i < bars.length; i++) {
      binIndexes.push(1 + Math.floor(i * (analyser.frequencyBinCount - 2) / (bars.length - 1)));
    }
  }

  function tick() {
    analyser.getByteFrequencyData(dataArray);
    for (var i = 0; i < bars.length; i++) {
      var v = dataArray[binIndexes[i]] || 0;
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
    tick();
  });

  audio.addEventListener('pause', function () {
    btn.setAttribute('aria-pressed', 'false');
    label.textContent = 'Звук';
    eq.classList.remove('is-active');
    cancelAnimationFrame(rafId);
  });

  audio.addEventListener('ended', function () {
    audio.currentTime = 0;
  });
})();
