(function () {
  var token = localStorage.getItem('token');
  var user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) {
    window.location.href = '/pages/login.html';
    return;
  }

  try {
    var payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/pages/login.html';
      return;
    }

    var remaining = payload.exp * 1000 - Date.now();
    setTimeout(function () {
      alert('Your session has expired. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/pages/login.html';
    }, remaining);
  } catch (e) {
    window.location.href = '/pages/login.html';
    return;
  }

  var page = window.location.pathname;
  if (page.includes('admin') && user.role !== 'admin') {
    window.location.href = '/pages/staff.html';
    return;
  }
})();
