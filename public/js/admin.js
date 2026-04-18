document.addEventListener('DOMContentLoaded', function () {
  var token = localStorage.getItem('token');
  var currentStudentPage = 1;
  var currentLogPage = 1;
  var searchTimeout = null;

  var socket = io({ auth: { token: token } });

  socket.on('student:entry', function (data) {
    var countEl = document.getElementById('adminStudentCount');
    var current = parseInt(countEl.textContent, 10) || 0;
    countEl.textContent = current + 1;
    addActiveRow(data.student, data.session);
    playSound('entry');
    showToast('entry', 'Checked In', data.student.name + ' ' + data.student.surname + ' entered the library.');
  });

  socket.on('student:exit', function (data) {
    var countEl = document.getElementById('adminStudentCount');
    var current = parseInt(countEl.textContent, 10) || 0;
    countEl.textContent = Math.max(0, current - 1);
    removeActiveRow(data.session.id);
    playSound('exit');
    showToast('exit', 'Checked Out', data.student.name + ' ' + data.student.surname + ' left the library.');
  });

  loadStudents();

  window.switchTab = function (tab) {
    document.querySelectorAll('.tab-content').forEach(function (el) {
      el.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(function (el) {
      el.classList.remove('active');
    });
    document.getElementById('tab-' + tab).classList.add('active');
    event.target.classList.add('active');

    if (tab === 'students') loadStudents();
    if (tab === 'logs') loadLogs();
    if (tab === 'status') loadActiveStatus();
    if (tab === 'users') loadUsers();
  };

  window.searchStudents = function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function () {
      currentStudentPage = 1;
      loadStudents();
    }, 300);
  };

  function loadStudents() {
    var search = document.getElementById('studentSearch').value;
    apiFetch('/api/students?page=' + currentStudentPage + '&limit=20&search=' + encodeURIComponent(search))
      .then(function (data) {
        renderStudentsTable(data.students);
        renderPagination('studentsPagination', data.total, 20, currentStudentPage, function (p) {
          currentStudentPage = p;
          loadStudents();
        });
      });
  }

  function renderStudentsTable(students) {
    var tbody = document.getElementById('studentsTableBody');
    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-message">No students found.</td></tr>';
      return;
    }
    tbody.innerHTML = students.map(function (s) {
      return '<tr>' +
        '<td>' + escapeHtml(s.name) + '</td>' +
        '<td>' + escapeHtml(s.surname) + '</td>' +
        '<td>' + escapeHtml(s.school_no) + '</td>' +
        '<td>' +
          '<button class="btn btn-primary btn-sm" onclick="editStudent(' + s.id + ',\'' + escapeAttr(s.name) + '\',\'' + escapeAttr(s.surname) + '\',\'' + escapeAttr(s.school_no) + '\')">Edit</button> ' +
          '<button class="btn btn-danger btn-sm" onclick="deleteStudent(' + s.id + ',\'' + escapeAttr(s.name) + ' ' + escapeAttr(s.surname) + '\')">Delete</button>' +
        '</td></tr>';
    }).join('');
  }

  window.showAddStudent = function () {
    document.getElementById('modalTitle').textContent = 'Add New Student';
    document.getElementById('editStudentId').value = '';
    document.getElementById('modalName').value = '';
    document.getElementById('modalSurname').value = '';
    document.getElementById('modalSchoolNo').value = '';
    document.getElementById('studentModal').classList.remove('hidden');
  };

  window.editStudent = function (id, name, surname, schoolNo) {
    document.getElementById('modalTitle').textContent = 'Edit Student';
    document.getElementById('editStudentId').value = id;
    document.getElementById('modalName').value = name;
    document.getElementById('modalSurname').value = surname;
    document.getElementById('modalSchoolNo').value = schoolNo;
    document.getElementById('studentModal').classList.remove('hidden');
  };

  window.closeModal = function () {
    document.getElementById('studentModal').classList.add('hidden');
  };

  window.saveStudent = async function () {
    var id = document.getElementById('editStudentId').value;
    var body = {
      name: document.getElementById('modalName').value.trim(),
      surname: document.getElementById('modalSurname').value.trim(),
      school_no: document.getElementById('modalSchoolNo').value.trim()
    };

    if (!body.name || !body.surname || !body.school_no) {
      alert('All fields are required.');
      return;
    }

    try {
      if (id) {
        await apiFetch('/api/students/' + id, 'PUT', body);
      } else {
        await apiFetch('/api/students', 'POST', body);
      }
      closeModal();
      loadStudents();
    } catch (err) {
      alert(err.message || 'An error occurred.');
    }
  };

  window.deleteStudent = async function (id, name) {
    if (!confirm('Are you sure you want to delete ' + name + '?')) return;
    try {
      await apiFetch('/api/students/' + id, 'DELETE');
      loadStudents();
    } catch (err) {
      alert(err.message || 'An error occurred.');
    }
  };

  window.showImport = function () {
    document.getElementById('importModal').classList.remove('hidden');
    document.getElementById('importResult').innerHTML = '';
    document.getElementById('importFile').value = '';
    document.getElementById('fileLabel').textContent = 'Click to select a file (.csv or .xlsx)';
    document.getElementById('importBtn').disabled = true;
  };

  window.closeImportModal = function () {
    document.getElementById('importModal').classList.add('hidden');
  };

  window.onFileSelect = function (input) {
    if (input.files.length > 0) {
      document.getElementById('fileLabel').textContent = input.files[0].name;
      document.getElementById('importBtn').disabled = false;
    }
  };

  window.uploadFile = async function () {
    var fileInput = document.getElementById('importFile');
    if (!fileInput.files.length) return;

    var formData = new FormData();
    formData.append('file', fileInput.files[0]);

    var importBtn = document.getElementById('importBtn');
    importBtn.disabled = true;
    importBtn.textContent = 'Uploading...';

    try {
      var res = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });
      var data = await res.json();

      var resultDiv = document.getElementById('importResult');
      resultDiv.innerHTML = '<div class="alert alert-success">' +
        'Imported: ' + data.imported + ', Skipped: ' + data.skipped +
        (data.errors && data.errors.length > 0 ? '<br>Errors: ' + data.errors.map(function (e) { return e.school_no + ': ' + e.error; }).join(', ') : '') +
        '</div>';

      loadStudents();
    } catch (err) {
      document.getElementById('importResult').innerHTML = '<div class="alert alert-error">Upload failed.</div>';
    }

    importBtn.disabled = false;
    importBtn.textContent = 'Upload';
  };

  window.loadLogs = function () {
    var params = new URLSearchParams();
    var startDate = document.getElementById('logStartDate').value;
    var endDate = document.getElementById('logEndDate').value;
    var name = document.getElementById('logStudentName').value;
    var schoolNo = document.getElementById('logSchoolNo').value;

    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    if (name) params.set('student_name', name);
    if (schoolNo) params.set('school_no', schoolNo);
    params.set('page', currentLogPage);
    params.set('limit', 50);

    apiFetch('/api/logs?' + params.toString())
      .then(function (data) {
        renderLogsTable(data.logs);
        renderPagination('logsPagination', data.total, 50, currentLogPage, function (p) {
          currentLogPage = p;
          loadLogs();
        });
      });
  };

  function renderLogsTable(logs) {
    var tbody = document.getElementById('logsTableBody');
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-message">No records found.</td></tr>';
      return;
    }
    tbody.innerHTML = logs.map(function (l) {
      var entryTime = new Date(l.entry_time).toLocaleString('en-US');
      var exitTime = l.exit_time ? new Date(l.exit_time).toLocaleString('en-US') : '-';
      var duration = l.duration !== null ? l.duration + ' min' : '-';
      return '<tr>' +
        '<td>' + escapeHtml(l.name + ' ' + l.surname) + '</td>' +
        '<td>' + escapeHtml(l.school_no) + '</td>' +
        '<td>' + entryTime + '</td>' +
        '<td>' + exitTime + '</td>' +
        '<td>' + duration + '</td></tr>';
    }).join('');
  }

  window.exportLogs = function (format) {
    var params = new URLSearchParams();
    var startDate = document.getElementById('logStartDate').value;
    var endDate = document.getElementById('logEndDate').value;
    var name = document.getElementById('logStudentName').value;
    var schoolNo = document.getElementById('logSchoolNo').value;

    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    if (name) params.set('student_name', name);
    if (schoolNo) params.set('school_no', schoolNo);
    params.set('format', format);

    var link = document.createElement('a');
    link.href = '/api/export/logs?' + params.toString() + '&token=' + token;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function loadActiveStatus() {
    apiFetch('/api/active')
      .then(function (data) {
        document.getElementById('adminStudentCount').textContent = data.count;
        renderActiveTable(data.students);
      });
  }

  function renderActiveTable(students) {
    var tbody = document.getElementById('adminActiveTable');
    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-message">No students inside yet.</td></tr>';
      return;
    }
    tbody.innerHTML = students.map(function (s) {
      var time = new Date(s.entry_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return '<tr data-session-id="' + s.session_id + '">' +
        '<td>' + escapeHtml(s.name + ' ' + s.surname) + '</td>' +
        '<td>' + escapeHtml(s.school_no) + '</td>' +
        '<td>' + time + '</td>' +
        '<td><button class="exit-btn" onclick="adminManualExit(' + s.session_id + ', this)">Check Out</button></td>' +
        '</tr>';
    }).join('');
  }

  function addActiveRow(student, session) {
    var tbody = document.getElementById('adminActiveTable');
    var emptyRow = tbody.querySelector('.empty-message');
    if (emptyRow) emptyRow.parentElement.remove();

    var tr = document.createElement('tr');
    tr.setAttribute('data-session-id', session.id);
    var time = new Date(session.entry_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    tr.innerHTML =
      '<td>' + escapeHtml(student.name + ' ' + student.surname) + '</td>' +
      '<td>' + escapeHtml(student.school_no) + '</td>' +
      '<td>' + time + '</td>' +
      '<td><button class="exit-btn" onclick="adminManualExit(' + session.id + ', this)">Check Out</button></td>';
    tbody.insertBefore(tr, tbody.firstChild);
  }

  function removeActiveRow(sessionId) {
    var tbody = document.getElementById('adminActiveTable');
    var row = tbody.querySelector('[data-session-id="' + sessionId + '"]');
    if (row) row.remove();
    if (tbody.children.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-message">No students inside yet.</td></tr>';
    }
  }

  window.adminManualExit = async function (sessionId, btn) {
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

  window.loadUsers = function () {
    apiFetch('/api/auth/users')
      .then(function (data) {
        var tbody = document.getElementById('usersTableBody');
        if (!data.users || data.users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" class="empty-message">No users found.</td></tr>';
          return;
        }
        var currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        tbody.innerHTML = data.users.map(function (u) {
          var deleteBtn = u.id !== currentUser.id
            ? '<button class="btn btn-danger btn-sm" onclick="deleteUser(' + u.id + ',\'' + escapeAttr(u.username) + '\')">Delete</button>'
            : '<span style="color:var(--text-light); font-size:13px;">Active Account</span>';
          return '<tr>' +
            '<td>' + u.id + '</td>' +
            '<td>' + escapeHtml(u.username) + '</td>' +
            '<td><span style="background:' + (u.role === 'admin' ? 'var(--primary-bg); color:var(--primary)' : 'var(--info-bg); color:var(--info)') + '; padding:3px 10px; border-radius:4px; font-size:12px; font-weight:600; text-transform:uppercase;">' + u.role + '</span></td>' +
            '<td>' + deleteBtn + '</td></tr>';
        }).join('');
      });
  };

  window.showAddUser = function () {
    document.getElementById('newUsername').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserRole').value = 'staff';
    document.getElementById('userModal').classList.remove('hidden');
  };

  window.createUser = async function () {
    var username = document.getElementById('newUsername').value.trim();
    var password = document.getElementById('newUserPassword').value;
    var role = document.getElementById('newUserRole').value;

    if (!username || !password) {
      alert('Username and password are required.');
      return;
    }

    try {
      await apiFetch('/api/auth/users', 'POST', { username: username, password: password, role: role });
      document.getElementById('userModal').classList.add('hidden');
      loadUsers();
    } catch (err) {
      alert(err.message || 'An error occurred.');
    }
  };

  window.deleteUser = async function (id, username) {
    if (!confirm('Are you sure you want to delete user ' + username + '?')) return;
    try {
      await apiFetch('/api/auth/users/' + id, 'DELETE');
      loadUsers();
    } catch (err) {
      alert(err.message || 'An error occurred.');
    }
  };

  window.showChangePassword = function () {
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('passwordResult').innerHTML = '';
    document.getElementById('passwordModal').classList.remove('hidden');
  };

  window.changePassword = async function () {
    var current = document.getElementById('currentPassword').value;
    var newPw = document.getElementById('newPassword').value;
    var resultDiv = document.getElementById('passwordResult');

    if (!current || !newPw) {
      resultDiv.innerHTML = '<div class="alert alert-error" style="margin-top:12px;">All fields are required.</div>';
      return;
    }

    try {
      await apiFetch('/api/auth/change-password', 'POST', { current_password: current, new_password: newPw });
      resultDiv.innerHTML = '<div class="alert alert-success" style="margin-top:12px;">Password changed successfully.</div>';
      setTimeout(function () {
        document.getElementById('passwordModal').classList.add('hidden');
      }, 1500);
    } catch (err) {
      resultDiv.innerHTML = '<div class="alert alert-error" style="margin-top:12px;">' + escapeHtml(err.message) + '</div>';
    }
  };

  async function apiFetch(url, method, body) {
    var options = {
      method: method || 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    };
    if (body) options.body = JSON.stringify(body);

    var res = await fetch(url, options);
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'An error occurred');
    return data;
  }

  function renderPagination(containerId, total, limit, currentPage, onPageChange) {
    var container = document.getElementById(containerId);
    var totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    var html = '';
    html += '<button ' + (currentPage <= 1 ? 'disabled' : '') + ' onclick="void(0)">Previous</button>';
    for (var i = 1; i <= totalPages && i <= 10; i++) {
      html += '<button class="' + (i === currentPage ? 'active' : '') + '">' + i + '</button>';
    }
    html += '<button ' + (currentPage >= totalPages ? 'disabled' : '') + ' onclick="void(0)">Next</button>';
    container.innerHTML = html;

    container.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.textContent;
        if (text === 'Previous') onPageChange(currentPage - 1);
        else if (text === 'Next') onPageChange(currentPage + 1);
        else onPageChange(parseInt(text, 10));
      });
    });
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }
});

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/login.html';
}
