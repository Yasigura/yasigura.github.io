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
  if (!container) return;
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
