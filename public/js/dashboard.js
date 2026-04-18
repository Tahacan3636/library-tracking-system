(function () {
  var token = localStorage.getItem('token');
  var primaryColor = '#8B1A2D';
  var primaryLight = 'rgba(139, 26, 45, 0.15)';
  var chartDaily = null;
  var chartHourly = null;
  var chartWeekly = null;

  loadDashboard();

  function loadDashboard() {
    fetch('/api/stats', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        renderStats(data);
        renderDailyChart(data.dailyVisits);
        renderHourlyChart(data.hourlyDist);
        renderWeeklyChart(data.thisWeekVisits, data.lastWeekVisits);
        renderTopStudents(data.topStudents);
      })
      .catch(function (err) {
        console.error('Dashboard error:', err);
      });
  }

  function renderStats(data) {
    document.getElementById('statTodayVisits').textContent = data.today.total_visits || 0;
    document.getElementById('statCurrentInside').textContent = data.today.currently_inside || 0;
    document.getElementById('statAvgDuration').textContent = data.avgDuration || 0;
    document.getElementById('statTotalStudents').textContent = data.totalStudents || 0;
  }

  function renderDailyChart(dailyVisits) {
    var ctx = document.getElementById('chartDaily');
    if (!ctx) return;

    var labels = [];
    var values = [];
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var dateStr = d.toISOString().split('T')[0];
      var dayName = dayNames[d.getDay()];
      labels.push(dayName + ' ' + d.getDate() + '/' + (d.getMonth() + 1));

      var found = dailyVisits.find(function (v) { return v.date === dateStr; });
      values.push(found ? found.count : 0);
    }

    if (chartDaily) chartDaily.destroy();
    chartDaily = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Visit Count',
          data: values,
          backgroundColor: primaryLight,
          borderColor: primaryColor,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 12 } },
            grid: { color: '#F3F4F6' }
          },
          x: {
            ticks: { font: { size: 11 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  function renderHourlyChart(hourlyDist) {
    var ctx = document.getElementById('chartHourly');
    if (!ctx) return;

    var labels = [];
    var values = [];
    for (var h = 7; h <= 23; h++) {
      labels.push(h + ':00');
      var found = hourlyDist.find(function (v) { return v.hour === h; });
      values.push(found ? found.count : 0);
    }

    if (chartHourly) chartHourly.destroy();
    chartHourly = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Entry Count',
          data: values,
          borderColor: primaryColor,
          backgroundColor: primaryLight,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: primaryColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 12 } },
            grid: { color: '#F3F4F6' }
          },
          x: {
            ticks: { font: { size: 10 }, maxRotation: 45 },
            grid: { display: false }
          }
        }
      }
    });
  }

  function renderWeeklyChart(thisWeek, lastWeek) {
    var ctx = document.getElementById('chartWeekly');
    if (!ctx) return;

    if (chartWeekly) chartWeekly.destroy();
    chartWeekly = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['This Week', 'Last Week'],
        datasets: [{
          data: [thisWeek || 0, lastWeek || 0],
          backgroundColor: [primaryColor, '#E5E7EB'],
          borderWidth: 0,
          spacing: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 13 }, padding: 16 }
          }
        }
      }
    });
  }

  function renderTopStudents(students) {
    var container = document.getElementById('topStudentsList');
    if (!container) return;

    if (students.length === 0) {
      container.innerHTML = '<p style="color:var(--text-light); text-align:center; padding:20px;">No data yet.</p>';
      return;
    }

    var html = '<div style="display:flex; flex-direction:column; gap:6px;">';
    students.forEach(function (s, i) {
      var medal = '';
      if (i === 0) medal = '<span style="color:#EAB308;">&#9733;</span> ';
      else if (i === 1) medal = '<span style="color:#9CA3AF;">&#9733;</span> ';
      else if (i === 2) medal = '<span style="color:#CD7F32;">&#9733;</span> ';

      var durationText = s.avg_duration ? s.avg_duration + ' min' : '-';
      html += '<div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:' + (i % 2 === 0 ? 'var(--bg)' : 'var(--white)') + '; border-radius:6px;">' +
        '<span style="font-size:13px; font-weight:500;">' + medal + (i + 1) + '. ' + escapeHtml(s.name + ' ' + s.surname) + '</span>' +
        '<span style="font-size:12px; font-weight:700; color:var(--primary); background:var(--primary-bg); padding:2px 8px; border-radius:4px;">avg. ' + durationText + '</span>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  window.openReport = function (period) {
    var now = new Date();
    var start, end;
    end = now.toISOString().split('T')[0];

    if (period === 'today') {
      start = end;
    } else if (period === 'week') {
      var d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }

    var url = '/api/export/report?start_date=' + start + '&end_date=' + end + '&token=' + token;
    window.open(url, '_blank');
  };

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
