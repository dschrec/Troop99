/**
 * TroopMaster Calendar Sync
 * Loads calendar events from local JSON file
 * Supports multi-day event spans across calendar cells
 */

var calendarFeedURL = 'https://tmweb.troopmaster.com/activitymanagement/icalendar/?id=wQRANP~NO&timezone=Eastern_Standard_Time';
var localEventsFile = 'data/calendar-events.json';
var allEvents = [];
var currentMonth = new Date().getMonth();
var currentYear = new Date().getFullYear();
var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var BACKSLASH = String.fromCharCode(92);

// Helper: replace literal backslash+n with <br> and HTML-escape
function decodeICalText(text) {
  if (!text) return '';
  var out = '';
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (ch === BACKSLASH && i + 1 < text.length && text[i + 1] === 'n') {
      out += '<br>';
      i++;
    } else if (ch === '&') {
      out += '&amp;';
    } else if (ch === '<') {
      out += '&lt;';
    } else if (ch === '>') {
      out += '&gt;';
    } else {
      out += ch;
    }
  }
  return out;
}

// Parse "20260928T190000" into Date
function parseICalDate(str) {
  if (!str) return null;
  var y = parseInt(str.substring(0, 4));
  var m = parseInt(str.substring(4, 6)) - 1;
  var d = parseInt(str.substring(6, 8));
  var h = str.length > 8 ? parseInt(str.substring(9, 11)) : 0;
  var mi = str.length > 11 ? parseInt(str.substring(11, 13)) : 0;
  return new Date(y, m, d, h, mi, 0, 0);
}

// Check if two dates are the same day (ignoring time)
function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

// Check if an event is active on a given day
// Floors start date to midnight so PM events still show on their start day
// Keeps original end time so events ending during a day still show that day
function eventIsOnDay(event, day) {
  if (!event.startDate || !day) return false;
  var evDay = new Date(event.startDate.getFullYear(), event.startDate.getMonth(), event.startDate.getDate());
  var inputDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  var evEnd = event.endDate || event.startDate;
  return inputDay >= evDay && inputDay < evEnd;
}

// Parse and render events from JSON array
function renderEvents(events) {
  allEvents = [];
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    var ev = {
      summary: decodeICalText(e.summary),
      description: decodeICalText(e.description),
      location: decodeICalText(e.location),
      startDate: parseICalDate(e.startDate),
      endDate: e.endDate ? parseICalDate(e.endDate) : null
    };
    if (ev.startDate) allEvents.push(ev);
  }
  allEvents.sort(function(a, b) { return a.startDate - b.startDate; });
  console.log('Calendar loaded: ' + allEvents.length + ' events');
  renderCalendarView();
}

// Show fallback if JSON fails
function showFallback() {
  var container = document.getElementById('troopmaster-calendar');
  if (container) {
    container.innerHTML =
      '<div class="calendar-error">' +
        '<p>Unable to load calendar events.</p>' +
        '<p style="margin-top:1rem;">View the full calendar:</p>' +
        '<a href="' + calendarFeedURL + '" target="_blank" class="btn btn-primary" style="margin-top:1rem;">📥 Subscribe to Calendar</a>' +
      '</div>';
  }
}

// Load events from local JSON
function loadLocalEvents() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', localEventsFile, true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        var events = JSON.parse(xhr.responseText);
        renderEvents(events);
      } catch(err) {
        console.error('Error parsing local events:', err);
        showFallback();
      }
    } else {
      showFallback();
    }
  };
  xhr.onerror = function() {
    showFallback();
  };
  xhr.send();
}

// Render the calendar
function renderCalendarView() {
  var container = document.getElementById('troopmaster-calendar');
  if (!container) return;

  var firstDay = new Date(currentYear, currentMonth, 1);
  var lastDay = new Date(currentYear, currentMonth + 1, 0);
  var startDayOfWeek = firstDay.getDay();
  var daysInMonth = lastDay.getDate();

  // Filter events: include those that span into or overlap this month
  var monthEvents = allEvents.filter(function(ev) {
    var evStartFloor = new Date(ev.startDate.getFullYear(), ev.startDate.getMonth(), ev.startDate.getDate());
    return evStartFloor <= lastDay && (!ev.endDate || ev.endDate >= firstDay);
  });

  var html = '<div class="calendar-header">' +
    '<button class="calendar-nav prev-month" id="prevMonthBtn">\u2190 Prev</button>' +
    '<h2 class="calendar-month-year">' + monthNames[currentMonth] + ' ' + currentYear + '</h2>' +
    '<button class="calendar-nav next-month" id="next-month-btn">Next \u2192</button>' +
    '</div>' +
    '<div class="calendar-days-of-week">' +
      dayNames.map(function(d) { return '<div class="day-label">' + d + '</div>'; }).join('') +
    '</div>' +
    '<div class="calendar-grid">';

  for (var i = 0; i < startDayOfWeek; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  // Build day cells with multi-day support
  for (var day = 1; day <= daysInMonth; day++) {
    var currentDate = new Date(currentYear, currentMonth, day);
    var isToday = currentDate.toDateString() === new Date().toDateString();

    // Find all events active on this day
    var dayEvts = monthEvents.filter(function(e) {
      return eventIsOnDay(e, currentDate);
    });

    html += '<div class="calendar-day' + (isToday ? ' today' : '') + '" data-day="' + day + '">' +
      '<div class="day-number">' + day + '</div>';

    if (dayEvts.length > 0) {
      html += '<div class="day-events">';
      dayEvts.forEach(function(ev) {
        // Check if this event starts on this day (show time on start day only)
        var showTime = isSameDay(ev.startDate, currentDate);
        var time = showTime ? ev.startDate.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}) : '';
        // Show "continuing..." on days after start
        var isContinuing = ev.endDate && !isSameDay(ev.startDate, currentDate) && ev.endDate >= currentDate;
        html += '<div class="month-event" title="' + ev.summary + '">' +
          (showTime ? '<div class="event-time">' + time + '</div>' : '') +
          '<div class="event-name">' + (isContinuing ? '\u2026 ' : '') + ev.summary + '</div>' +
          '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
  }

  html += '</div>' +
    '<div class="calendar-footer">' +
      '<div class="calendar-subscribe">' +
        '<a href="' + calendarFeedURL + '" target="_blank" class="btn btn-primary">\uD83D\uDCE5 Subscribe to Calendar</a>' +
      '</div>' +
    '</div>';
  container.innerHTML = html;

  // Click handlers for days
  var dayEls = container.querySelectorAll('.calendar-day:not(.empty)');
  for (var d = 0; d < dayEls.length; d++) {
    dayEls[d].addEventListener('click', function() {
      var dayNum = parseInt(this.getAttribute('data-day'));
      var clickDate = new Date(currentYear, currentMonth, dayNum);
      // Find all events active on this day (not just starting today)
      var activeEvts = monthEvents.filter(function(e) {
        return eventIsOnDay(e, clickDate);
      });
      if (activeEvts.length > 0) showDayEvents(dayNum, activeEvts);
    });
  }

  // Nav buttons
  document.getElementById('prevMonthBtn').addEventListener('click', function() {
     if (currentMonth === 0) { currentMonth = 11; currentYear--; } else { currentMonth--; }
     var detail = document.querySelector('.day-events-detail');
     if (detail) detail.remove();
     renderCalendarView();
   });

   document.getElementById('next-month-btn').addEventListener('click', function() {
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
    var isMultiDay = ev.endDate && !isSameDay(ev.startDate, ev.endDate);
    var dateRange = '';
    if (isMultiDay) {
      var startDate = ev.startDate;
      var endDate = ev.endDate;
      dateRange = '<p class="event-detail-multiday"><strong>Multi-day event:</strong> ' +
        startDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) + ' \u2013 ' +
        endDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) + '</p>';
    }
    html += '<div class="event-detail-card">' +
      '<div class="event-detail-time">' + time + '</div>' +
      '<div class="event-detail-content">' +
        '<h4 class="event-detail-title">' + ev.summary + '</h4>' +
        dateRange +
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

// Load events - handle async script loading via document.write
// The script may load after DOMContentLoaded, so check readyState first
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadLocalEvents);
} else {
  // DOM already ready - run immediately
  loadLocalEvents();
}
