// === плееры треков на странице "Проекты" ===
(function () {
  var players = document.querySelectorAll('.player');
  if (!players.length) return;

  function fmt(t) {
    if (!isFinite(t)) return '0:00';
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  players.forEach(function (wrap) {
    var audio = wrap.querySelector('.player-audio');
    var btn = wrap.querySelector('.player-toggle');
    var bar = wrap.querySelector('.player-bar');
    var progress = wrap.querySelector('.player-progress');
    var curEl = wrap.querySelector('.player-current');
    var durEl = wrap.querySelector('.player-duration');

    audio.addEventListener('loadedmetadata', function () {
      durEl.textContent = fmt(audio.duration);
    });

    audio.addEventListener('timeupdate', function () {
      curEl.textContent = fmt(audio.currentTime);
      if (audio.duration) {
        progress.style.width = (audio.currentTime / audio.duration * 100) + '%';
      }
    });

    btn.addEventListener('click', function () {
      if (audio.paused) {
        // останавливаем остальные плееры на странице — чтобы треки не играли одновременно
        players.forEach(function (other) {
          if (other !== wrap) other.querySelector('.player-audio').pause();
        });
        audio.play().catch(function (err) {
          console.error('Не удалось включить трек:', err);
        });
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', function () { btn.setAttribute('aria-pressed', 'true'); });
    audio.addEventListener('pause', function () { btn.setAttribute('aria-pressed', 'false'); });
    audio.addEventListener('ended', function () { audio.currentTime = 0; });

    function seek(evt) {
      var rect = bar.getBoundingClientRect();
      var x = (evt.touches ? evt.touches[0].clientX : evt.clientX) - rect.left;
      var ratio = Math.min(1, Math.max(0, x / rect.width));
      if (audio.duration) audio.currentTime = ratio * audio.duration;
    }
    bar.addEventListener('click', seek);
  });
})();
