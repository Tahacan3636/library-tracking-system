document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('checkinForm');
  var input = document.getElementById('schoolNo');
  var btn = document.getElementById('submitBtn');
  var messageBox = document.getElementById('messageBox');
  var resetTimer = null;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var schoolNo = input.value.trim();
    if (!schoolNo) return;

    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
      var res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_no: schoolNo })
      });
      var data = await res.json();

      showMessage(data);
    } catch (err) {
      showMessage({ status: 'error', message: 'A server error occurred.' });
    }

    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(function () {
      messageBox.classList.add('hidden');
      messageBox.className = 'message-box hidden';
      input.value = '';
      input.focus();
      btn.disabled = false;
      btn.textContent = 'Confirm';
    }, 3000);
  });

  function showMessage(data) {
    messageBox.classList.remove('hidden', 'message-entry', 'message-exit', 'message-error', 'message-warning');

    var html = '';
    switch (data.status) {
      case 'entry':
        messageBox.classList.add('message-entry');
        html = data.message;
        break;
      case 'exit':
        messageBox.classList.add('message-exit');
        html = data.message;
        if (data.durationText) {
          html += '<span class="message-duration">' + data.durationText + '</span>';
        }
        break;
      case 'already_inside':
        messageBox.classList.add('message-warning');
        html = data.message;
        break;
      case 'not_found':
        messageBox.classList.add('message-error');
        html = data.message;
        break;
      default:
        messageBox.classList.add('message-error');
        html = data.message || data.error || 'An error occurred.';
    }

    messageBox.innerHTML = html;
  }
});
