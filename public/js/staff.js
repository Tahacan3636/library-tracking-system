document.addEventListener('DOMContentLoaded', function () {
  var token = localStorage.getItem('token');
  var countEl = document.getElementById('studentCount');
  var tableBody = document.getElementById('studentTable');
  var connStatus = document.getElementById('connStatus');

  var socket = io({ auth: { token: token } });

  socket.on('connect', function () {
    connStatus.className = 'connection-status connected';
  });

  socket.on('disconnect', function () {
    connStatus.className = 'connection-status disconnected';
  });

  socket.on('student:entry', function (data) {
    addRow(data.student, data.session);
    updateCount(1);
    playSound('entry');
    showToast('entry', 'Checked In', data.student.name + ' ' + data.student.surname + ' entered the library.');
  });

  socket.on('student:exit', function (data) {
    removeRow(data.session.id);
    updateCount(-1);
    playSound('exit');
    showToast('exit', 'Checked Out', data.student.name + ' ' + data.student.surname + ' left the library.');
  });

  loadActive();

  async function loadActive() {
    try {
      var res = await fetch('/api/active', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var data = await res.json();
      countEl.textContent = data.count;
      renderTable(data.students);
    } catch (err) {
      console.error('Error loading active students:', err);
    }
  }

  function renderTable(students) {
    if (students.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="empty-message">No students inside yet.</td></tr>';
      return;
    }
    tableBody.innerHTML = '';
    students.forEach(function (s) {
      addRowElement(s.name + ' ' + s.surname, s.school_no, s.entry_time, s.session_id);
    });
  }

  function addRow(student, session) {
    var emptyRow = tableBody.querySelector('.empty-message');
    if (emptyRow) emptyRow.parentElement.remove();

    addRowElement(
      student.name + ' ' + student.surname,
      student.school_no,
      session.entry_time,
      session.id
    );
  }

  function addRowElement(fullName, schoolNo, entryTime, sessionId) {
    var tr = document.createElement('tr');
    tr.setAttribute('data-session-id', sessionId);

    var time = new Date(entryTime);
    var timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    tr.innerHTML =
      '<td>' + escapeHtml(fullName) + '</td>' +
      '<td>' + escapeHtml(schoolNo) + '</td>' +
      '<td>' + timeStr + '</td>' +
      '<td><button class="exit-btn" onclick="manualExit(' + sessionId + ', this)">Check Out</button></td>';

    tableBody.insertBefore(tr, tableBody.firstChild);
  }

  function removeRow(sessionId) {
    var row = tableBody.querySelector('[data-session-id="' + sessionId + '"]');
    if (row) row.remove();

    if (tableBody.children.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="empty-message">No students inside yet.</td></tr>';
    }
  }

  function updateCount(delta) {
    var current = parseInt(countEl.textContent, 10) || 0;
    countEl.textContent = Math.max(0, current + delta);
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  window.manualExit = async function (sessionId, btn) {
    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
      var res = await fetch('/api/check-in/manual-exit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      if (!res.ok) {
        var data = await res.json();
        alert(data.error || 'An error occurred');
        btn.disabled = false;
        btn.textContent = 'Check Out';
      }
    } catch (err) {
      alert('Server error');
      btn.disabled = false;
      btn.textContent = 'Check Out';
    }
  };
});

window.showStaffPasswordModal = function () {
  document.getElementById('staffCurrentPw').value = '';
  document.getElementById('staffNewPw').value = '';
  document.getElementById('staffPwResult').innerHTML = '';
  document.getElementById('staffPasswordModal').classList.remove('hidden');
};

window.staffChangePassword = async function () {
  var token = localStorage.getItem('token');
  var current = document.getElementById('staffCurrentPw').value;
  var newPw = document.getElementById('staffNewPw').value;
  var resultDiv = document.getElementById('staffPwResult');

  if (!current || !newPw) {
    resultDiv.innerHTML = '<div class="alert alert-error" style="margin-top:12px;">All fields are required.</div>';
    return;
  }

  try {
    var res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ current_password: current, new_password: newPw })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'An error occurred');
    resultDiv.innerHTML = '<div class="alert alert-success" style="margin-top:12px;">Password changed successfully.</div>';
    setTimeout(function () { document.getElementById('staffPasswordModal').classList.add('hidden'); }, 1500);
  } catch (err) {
    resultDiv.innerHTML = '<div class="alert alert-error" style="margin-top:12px;">' + err.message + '</div>';
  }
};

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/login.html';
}
