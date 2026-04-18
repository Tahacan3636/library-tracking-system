document.addEventListener('DOMContentLoaded', function () {
  var baseUrl = window.location.origin;
  var formUrl = baseUrl + '/pages/form.html';
  var container = document.getElementById('qrcode');

  QRCode.toCanvas(formUrl, {
    width: 400,
    margin: 2,
    color: { dark: '#1e3a5f', light: '#ffffff' }
  }, function (err, canvas) {
    if (err) {
      console.error(err);
      container.textContent = 'Failed to generate QR code';
      return;
    }
    container.appendChild(canvas);
  });
});
