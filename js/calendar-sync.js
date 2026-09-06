/**
 * TroopMaster Calendar Sync
 * Loads calendar events from local JSON file
 * Optionally fetches fresh data from TroopMaster via CORS proxy
 */

document.addEventListener('DOMContentLoaded', function() {
  var calendarFeedURL = 'https://tmweb.troopmaster.com/activitymanagement/icalendar/?id=wQRANP~NO&timezone=Eastern_Standard_Time';
  var corsProxy = 'https://api.allorigins.win/raw?url=';
  var localEventsFile = 'data/calendar-events.json';
  var allEvents = [];
  var currentMonth = new Date().getMonth();
  var currentYear = new Date().getFullYear();
  var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper to decode iCal escaped text (literal \n to <br>)
  function decodeICalText(text) {
    if (!text) return '';
    var decoded = text;
    var idx = decoded.indexOf('\\n');
    while (idx !== -1) {
      decoded = decoded.substring(0, idx) + '<br>' + decoded.substring(idx + 2);
      idx = decoded.indexOf('\\n', idx + 4);
    }
    decoded = decoded.replace(/&/g, '&amp;')
                     .replace(/</g, '&lt;')
                     .replace(/>/g, '&gt;')
                     .replace(/"/g, '&quot;')
                     .replace(/'/g, '&#039;');
    return decoded;
  }

  // Load events from local JSON file (primary)
  function loadLocalEvents() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', localEventsFile, true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var events = JSON.parse(xhr.responseText);
          allEvents = events.map(function(e) {
            return {
              summary: decodeICalText(e.summary),
              description: decodeICalText(e.description),
              location: decodeICalText(e.location),
              startDate: new Date(e.startDate.replace(/T/, 'T')),
              endDate: e.endDate ? new Date(e.endDate.replace(/T/, 'T')) : null
            };
          });
          // Fix dates: parse "20260907T190000" properly
          allEvents.forEach(function(e) {
            var ds = e.startDate;
            var raw = e.startDate;
            if (raw && typeof raw === 'string') {
              var y = parseInt(raw.substring(0, 4));
              var m = parseInt(raw.substring(4, 6)) - 1;
              var d = parseInt(raw.substring(6, 8));
              var h = raw.length > 8 ? parseInt(raw.substring(9, 11)) : 0;
              var mi = raw.length > 11 ? parseInt(raw.substring(11, 13)) : 0;
              e.startDate = new Date(y, m, d, h, mi);
            }
            if (e.endDate && typeof e.endDate === 'string') {
              var y2 = parseInt(e.endDate.substring(0, 4));
              var m2 = parseInt(e.endDate.substring(4, 6)) - 1;
              var d2 = parseInt(e.endDate.substring(6, 8));
              var h2 = e.endDate.length > 8 ? parseInt(e.endDate.substring(9, 11)) : 0;
              var mi2 = e.endDate.length > 11 ? parseInt(e.endDate.substring(11, 13)) : 0;
              e.endDate = new Date(y2, m2, d2, h2, mi2);
            }
          });
          allEvents.sort(function(a, b) { return a.startDate - b.startDate; });
          console.log('Calendar loaded from local file: ' + allEvents.length + ' events');
          renderCalendarView();
        } catch(err) {
          console.error('Error parsing local events:', err);
          loadFromTroopMaster();
        }
      } else {
        console.log('Local file not found, trying TroopMaster...');
        loadFromTroopMaster();
      }
    };
    xhr.onerror = function() {
      console.log('Local file error, trying TroopMaster...');
      loadFromTroopMaster();
    };
    xhr.send();
  }

  // Fallback: try to fetch from TroopMaster
  function loadFromTroopMaster() {
    fetch(corsProxy + encodeURIComponent(calendarFeedURL))
      .then(function(response) {
        if (!response.ok) throw new Error('Network error: ' + response.status);
        return response.text();
      })
      .then(function(icalData) {
        var events = [];
        var eventBlocks = icalData.split('BEGIN:VEVENT');
        for (var i = 1; i < eventBlocks.length; i++) {
          var block = 'BEGIN:VEVENT' + eventBlocks[i];
          if (block.includes('END:VEVENT')) {
            var eventData = block.split('END:VEVENT')[0];
            var summary = '', description = '', location = '', dtStart = '', dtEnd = '';
            var lines = eventData.split('\n');
            for (var j = 0; j < lines.length; j++) {
              var l = lines[j].trim();
              if (l.startsWith('SUMMARY:')) summary = l.substring(8);
              else if (l.startsWith('DESCRIPTION:')) description = l.substring(12);
              else if (l.startsWith('LOCATION:')) location = l.substring(9);
              else if (l.startsWith('DTSTART')) dtStart = l.split(':')[1].trim();
              else if (l.startsWith('DTEND')) dtEnd = l.split(':')[1].trim();
            }
            if (dtStart) {
              var startDate;
              if (dtStart.includes('T')) {
                startDate = new Date(
                  parseInt(dtStart.substring(0,4)),
                  parseInt(dtStart.substring(4,6)) - 1,
                  parseInt(dtStart.substring(6,8)),
                  parseInt(dtStart.substring(9,11)),
                  parseInt(dtStart.substring(11,13))
                );
              } else {
                startDate = new Date(
                  parseInt(dtStart.substring(0,4)),
                  parseInt(dtStart.substring(4,6)) - 1,
                  parseInt(dtStart.substring(6,8))
                );
              }
              events.push({ summary: decodeICalText(summary), description: decodeICalText(description), location: decodeICalText(location), startDate: startDate, endDate: null });
            }
          }
        }
        allEvents = events.sort(function(a, b) { return a.startDate - b.startDate; });
        console.log('Calendar loaded from TroopMaster: ' + allEvents.length + ' events');
        renderCalendarView();
      })
      .catch(function(err) {
        console.error('Error loading from TroopMaster:', err);
        showFallback();
      });
  }

  // Show fallback if nothing loads
  function showFallback() {
    var container = document.getElementById('troopmaster-calendar');
    if (container) {
      container.innerHTML =
        '<div class="calendar-error">' +
          '<p>Unable to load calendar events.</p>' +
          '<p style="margin-top:1rem;">View the full calendar:</p>' +
          '<a href="' + calendarFeedURL + '" target="_blank" class="btn btn-secondary" style="margin-top:1rem;">Subscribe to Calendar</a>' +
          '<a href="https://tmweb.troopmaster.com/Website/Home#" target="_blank" class="btn btn-secondary" style="margin-top:1rem;margin-left:0.5rem;">View on TroopMaster</a>' +
        '</div>';
    }
  }

  // Render the calendar
  function renderCalendarView() {
    var container = document.getElementById('troopmaster-calendar');
    if (!container) return;

    // Get events for current month
    var monthEvents = allEvents.filter(function(ev) {
      return ev.startDate && ev.startDate.getMonth() === currentMonth && ev.startDate.getFullYear() === currentYear;
    });

    var firstDay = new Date(currentYear, currentMonth, 1);
    var lastDay = new Date(currentYear, currentMonth + 1, 0);
    var startDayOfWeek = firstDay.getDay();
    var daysInMonth = lastDay.getDate();

    var html = '<div class="calendar-header">' +
      '<button class="calendar-nav prev-month" id="prevMonthBtn">\u2190 Prev</button>' +
      '<h2 class="calendar-month-year">' + monthNames[currentMonth] + ' ' + currentYear + '</h2>' +
      '<button class="calendar-nav next-month" id="nextMonthBtn">Next \u2192</button>' +
      '</div>' +
      '<div class="calendar-days-of-week">' +
        dayNames.map(function(d) { return '<div class="day-label">' + d + '</div>'; }).join('') +
      '</div>' +
      '<div class="calendar-grid">';

    for (var i = 0; i < startDayOfWeek; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var currentDate = new Date(currentYear, currentMonth, day);
      var dayEvts = monthEvents.filter(function(e) { return e.startDate.getDate() === day; });
      var isToday = currentDate.toDateString() === new Date().toDateString();

      html += '<div class="calendar-day' + (isToday ? ' today' : '') + '" data-day="' + day + '">' +
        '<div class="day-number">' + day + '</div>';

      if (dayEvts.length > 0) {
        html += '<div class="day-events">';
        dayEvts.forEach(function(ev) {
          var time = ev.startDate.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
          html += '<div class="month-event" title="' + ev.summary + '">' +
            '<div class="event-time">' + time + '</div>' +
            '<div class="event-name">' + ev.summary + '</div>' +
          '</div>';
        });
        html += '</div>';
      }

      html += '</div>';
    }

    html += '</div>' +
      '<div class="calendar-footer">' +
        '<div class="calendar-legend"><span class="legend-item">\uD83D\uDDD5\uFE0F = Today</span></div>' +
        '<div class="calendar-subscribe">' +
          '<a href="' + calendarFeedURL + '" target="_blank" class="btn btn-secondary">\uD83D\uDCE5 Subscribe to Calendar</a>' +
          '<a href="https://tmweb.troopmaster.com/Website/Home#" target="_blank" class="btn btn-secondary" style="margin-left:0.5rem;">View on TroopMaster</a>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;

    // Click handlers for days
    var dayEls = container.querySelectorAll('.calendar-day:not(.empty)');
    for (var d = 0; d < dayEls.length; d++) {
      dayEls[d].addEventListener('click', function() {
        var dayNum = parseInt(this.getAttribute('data-day'));
        var dayEvts = monthEvents.filter(function(e) { return e.startDate.getDate() === dayNum; });
        if (dayEvts.length > 0) showDayEvents(dayNum, dayEvts);
      });
    }

    // Nav buttons
    document.getElementById('prevMonthBtn').addEventListener('click', function() {
      if (currentMonth === 0) { currentMonth = 11; currentYear--; } else { currentMonth--; }
      var detail = document.querySelector('.day-events-detail');
      if (detail) detail.remove();
      renderCalendarView();
    });

    document.getElementById('nextMonthBtn').addEventListener('click', function() {
      if (currentMonth === 11) { currentMonth = 0; currentYear++; } else { currentMonth++; }
      var detail = document.querySelector('.day-events-detail');
      if (detail) detail.remove();
      renderCalendarView();
    });
  }

  // Show day details
  function showDayEvents(day, dayEvents) {
    var container = document.getElementById('troopmaster-calendar');
    var html = '<div class="day-events-detail">' +
      '<h3>Events for ' + day + ' ' + monthNames[currentMonth] + '</h3>' +
      '<div class="events-list">';

    dayEvents.forEach(function(ev) {
      var time = ev.startDate.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true});
      html += '<div class="event-detail-card">' +
        '<div class="event-detail-time">' + time + '</div>' +
        '<div class="event-detail-content">' +
          '<h4 class="event-detail-title">' + ev.summary + '</h4>' +
          (ev.location ? '<p class="event-detail-location">\uD83D\uDCCD ' + ev.location + '</p>' : '') +
          (ev.description ? '<p class="event-detail-description">' + ev.description + '</p>' : '') +
        '</div>' +
      '</div>';
    });

    html += '</div></div>';
    var existing = document.querySelector('.day-events-detail');
    if (existing) existing.remove();
    var grid = container.querySelector('.calendar-grid');
    if (grid) grid.insertAdjacentHTML('afterend', html);
  }

  // Load events (try local first, fall back to TroopMaster)
  loadLocalEvents();
});
