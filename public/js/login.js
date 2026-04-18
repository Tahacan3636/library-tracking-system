document.addEventListener('DOMContentLoaded', function () {
  // If already logged in, redirect
  var token = localStorage.getItem('token');
  var user = JSON.parse(localStorage.getItem('user') || 'null');
  if (token && user) {
    redirectByRole(user.role);
    return;
  }

  var form = document.getElementById('loginForm');
  var errorBox = document.getElementById('errorBox');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errorBox.style.display = 'none';

    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value;

    try {
      var res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
      });
      var data = await res.json();

      if (!res.ok) {
        errorBox.textContent = data.error || 'Giris basarisiz.';
        errorBox.style.display = 'block';
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      redirectByRole(data.user.role);
    } catch (err) {
      errorBox.textContent = 'Sunucu ile baglanti kurulamadi.';
      errorBox.style.display = 'block';
    }
  });

  function redirectByRole(role) {
    if (role === 'admin') {
      window.location.href = '/pages/admin.html';
    } else {
      window.location.href = '/pages/staff.html';
    }
  }
});
