// ============================================
// TOAST NOTIFICATIONS & SOUND ALERTS
// ============================================

(function () {
  var audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  // Play a short beep sound
  window.playSound = function (type) {
    try {
      var ctx = getAudioContext();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'entry') {
        // Rising tone for entry
        osc.frequency.setValueAtTime(523, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
      } else {
        // Falling tone for exit
        osc.frequency.setValueAtTime(784, ctx.currentTime);
        osc.frequency.setValueAtTime(523, ctx.currentTime + 0.15);
      }

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio not supported - ignore
    }
  };

  // Show toast notification
  window.showToast = function (type, title, message) {
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    var icon = type === 'entry' ? '&#9989;' : '&#128075;';

    toast.innerHTML =
      '<div class="toast-icon">' + icon + '</div>' +
      '<div class="toast-body">' +
        '<div class="toast-title">' + title + '</div>' +
        '<div class="toast-msg">' + message + '</div>' +
      '</div>';

    container.appendChild(toast);

    // Remove after animation
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
  };

  // Enable audio context on first user interaction (browser policy)
  document.addEventListener('click', function () {
    try { getAudioContext().resume(); } catch (e) {}
  }, { once: true });
})();
