/**
 * TroopMaster Calendar Sync
 * Fetches and displays calendar events from TroopMaster iCal feed
 * Shows a full interactive calendar view
 */

document.addEventListener('DOMContentLoaded', function() {
  // Using HTTPS for TroopMaster feed
  var calendarFeedURL = 'https://tmweb.troopmaster.com/activitymanagement/icalendar/?id=wQRANP~NO&timezone=Eastern_Standard_Time';
  // CORS proxy to bypass browser security restrictions
  var corsProxy = 'https://api.allorigins.win/raw?url=';
  var allEvents = [];
  var currentMonth = new Date().getMonth();
  var currentYear = new Date().getFullYear();

  // Helper to decode iCal escaped text
  // iCal uses literal \n (backslash + n) to represent line breaks in field values
  function decodeICalText(text) {
    if (!text) return '';
    var decoded = text;
    // Convert \n (literal backslash + n) to HTML line breaks
    var idx = decoded.indexOf('\\n');
    while (idx !== -1) {
      decoded = decoded.substring(0, idx) + '<br>' + decoded.substring(idx + 2);
      idx = decoded.indexOf('\\n', idx + 4);
    }
    // HTML escape to prevent XSS
    decoded = decoded.replace(/&/g, '&amp;')
                     .replace(/</g, '&lt;')
                     .replace(/>/g, '&gt;')
                     .replace(/"/g, '&quot;')
                     .replace(/'/g, '&#039;');
    return decoded;
  }

  // Function to parse iCal event
  function parseICalEvent(eventData) {
    var lines = eventData.split('\n');
    var summary = '';
    var description = '';
    var startDate = null;
    var endDate = null;
    var location = '';

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();

      if (line.startsWith('SUMMARY:')) {
        summary = line.substring(8);
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.substring(12);
      } else if (line.startsWith('DTSTART')) {
        var dateStr = line.split(':')[1];
        // Parse iCal date format (20240915T190000 or 20240915)
        if (dateStr && dateStr.includes('T')) {
          startDate = new Date(
            parseInt(dateStr.substring(0, 4)),
            parseInt(dateStr.substring(4, 6)) - 1,
            parseInt(dateStr.substring(6, 8)),
            dateStr.length > 8 ? parseInt(dateStr.substring(9, 11)) : 0,
            dateStr.length > 11 ? parseInt(dateStr.substring(11, 13)) : 0
          );
        } else if (dateStr && dateStr.length === 8) {
          startDate = new Date(
            parseInt(dateStr.substring(0, 4)),
            parseInt(dateStr.substring(4, 6)) - 1,
            parseInt(dateStr.substring(6, 8))
          );
        }
      } else if (line.startsWith('DTEND')) {
        var dateStr2 = line.split(':')[1];
        if (dateStr2 && dateStr2.includes('T')) {
          endDate = new Date(
            parseInt(dateStr2.substring(0, 4)),
            parseInt(dateStr2.substring(4, 6)) - 1,
            parseInt(dateStr2.substring(6, 8)),
            dateStr2.length > 8 ? parseInt(dateStr2.substring(9, 11)) : 0,
            dateStr2.length > 11 ? parseInt(dateStr2.substring(11, 13)) : 0
          );
        } else if (dateStr2 && dateStr2.length === 8) {
          endDate = new Date(
            parseInt(dateStr2.substring(0, 4)),
            parseInt(dateStr2.substring(4, 6)) - 1,
            parseInt(dateStr2.substring(6, 8))
          );
        }
      } else if (line.startsWith('LOCATION:')) {
        location = line.substring(9);
      }
    }

    // Decode text fields
    summary = decodeICalText(summary);
    description = decodeICalText(description);
    location = decodeICalText(location);

    return {
      summary: summary,
      description: description,
      startDate: startDate,
      endDate: endDate,
      location: location
    };
  }

  // Function to fetch and parse all events
  function loadAllCalendarEvents() {
    fetch(corsProxy + encodeURIComponent(calendarFeedURL))
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.status);
        }
        return response.text();
      })
      .then(function(icalData) {
        allEvents = [];
        var eventBlocks = icalData.split('BEGIN:VEVENT');

        for (var i = 1; i < eventBlocks.length; i++) {
          var eventBlock = 'BEGIN:VEVENT' + eventBlocks[i];
          if (eventBlock.includes('END:VEVENT')) {
            var eventData = eventBlock.split('END:VEVENT')[0];
            var event = parseICalEvent(eventData);
            if (event.startDate) {
              allEvents.push(event);
            }
          }
        }

        // Sort events by date
        allEvents.sort(function(a, b) { return a.startDate - b.startDate; });

        // Log how many events we found
        console.log('Calendar loaded: ' + allEvents.length + ' events');
        console.log('First event: ' + allEvents[0].summary);

        // Render calendar view
        renderCalendarView();
      })
      .catch(function(error) {
        console.error('Error loading calendar:', error);
        var calendarContainer = document.getElementById('troopmaster-calendar');
        if (calendarContainer) {
          calendarContainer.innerHTML =
            '<p class="calendar-error">Unable to load calendar. Please try again later.</p>' +
            '<p class="calendar-error" style="margin-top:1rem;">Error: ' + error.message + '</p>' +
            '<a href="' + calendarFeedURL + '" target="_blank" class="btn btn-secondary" style="margin-top:1rem;display:inline-block;">View Full Calendar</a>';
        }
      });
  }

  // Function to render the full calendar view
  function renderCalendarView() {
    var calendarContainer = document.getElementById('troopmaster-calendar');
    if (!calendarContainer) return;

    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get first and last day of month
    var firstDay = new Date(currentYear, currentMonth, 1);
    var lastDay = new Date(currentYear, currentMonth + 1, 0);
    var startDayOfWeek = firstDay.getDay();
    var daysInMonth = lastDay.getDate();

    // Get events for this month
    var monthEvents = allEvents.filter(function(event) {
      return event.startDate.getMonth() === currentMonth &&
             event.startDate.getFullYear() === currentYear;
    });

    // Build calendar grid
    var calendarHTML =
      '<div class="calendar-header">' +
        '<button class="calendar-nav prev-month" id="prevMonthBtn">\u2190 Prev</button>' +
        '<h2 class="calendar-month-year">' + monthNames[currentMonth] + ' ' + currentYear + '</h2>' +
        '<button class="calendar-nav next-month" id="nextMonthBtn">Next \u2192</button>' +
      '</div>' +
      '<div class="calendar-days-of-week">' +
        dayNames.map(function(day) { return '<div class="day-label">' + day + '</div>'; }).join('') +
      '</div>' +
      '<div class="calendar-grid">';

    // Add empty cells for days before start of month
    for (var i = 0; i < startDayOfWeek; i++) {
      calendarHTML += '<div class="calendar-day empty"></div>';
    }

    // Add days of the month
    for (var day = 1; day <= daysInMonth; day++) {
      var currentDate = new Date(currentYear, currentMonth, day);
      var dayEvents = monthEvents.filter(function(e) {
        return e.startDate.getDate() === day;
      });

      var isToday = currentDate.toDateString() === new Date().toDateString();

      calendarHTML += '<div class="calendar-day' + (isToday ? ' today' : '') + '" data-day="' + day + '">' +
        '<div class="day-number">' + day + '</div>';

      if (dayEvents.length > 0) {
        calendarHTML += '<div class="day-events">';
        dayEvents.forEach(function(event) {
          calendarHTML += '<div class="month-event" title="' + event.summary + '">' +
            '<div class="event-time">' + event.startDate.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}) + '</div>' +
            '<div class="event-name">' + event.summary + '</div>' +
          '</div>';
        });
        calendarHTML += '</div>';
      }

      calendarHTML += '</div>';
    }

    calendarHTML += '</div>';

    // Add legend and subscribe info
    calendarHTML +=
      '<div class="calendar-footer">' +
        '<div class="calendar-legend">' +
          '<span class="legend-item">\uD83D\uDDD5\uFE0F = Today</span>' +
        '</div>' +
        '<div class="calendar-subscribe">' +
          '<a href="' + calendarFeedURL + '" target="_blank" class="btn btn-secondary">' +
            '\uD83D\uDCE5 Subscribe to Full Calendar' +
          '</a>' +
        '</div>' +
      '</div>';

    calendarContainer.innerHTML = calendarHTML;

    // Add click handlers to days
    var dayElements = document.querySelectorAll('.calendar-day:not(.empty)');
    for (var d = 0; d < dayElements.length; d++) {
      dayElements[d].addEventListener('click', function() {
        var dayNumber = parseInt(this.getAttribute('data-day'));
        var dayEvts = monthEvents.filter(function(e) {
          return e.startDate.getDate() === dayNumber;
        });

        if (dayEvts.length > 0) {
          showDayEvents(dayNumber, dayEvts);
        }
      });
    }

    // Navigation buttons
    document.getElementById('prevMonthBtn').addEventListener('click', function() {
      if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
      } else {
        currentMonth--;
      }
      // Remove detail panel
      var detail = document.querySelector('.day-events-detail');
      if (detail) detail.remove();
      renderCalendarView();
    });

    document.getElementById('nextMonthBtn').addEventListener('click', function() {
      if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
      } else {
        currentMonth++;
      }
      // Remove detail panel
      var detail = document.querySelector('.day-events-detail');
      if (detail) detail.remove();
      renderCalendarView();
    });
  }

  // Function to show events for a specific day
  function showDayEvents(day, dayEvents) {
    var calendarContainer = document.getElementById('troopmaster-calendar');

    var detailsHTML =
      '<div class="day-events-detail">' +
        '<h3>Events for ' + day + ' ' + monthNames[currentMonth] + '</h3>' +
        '<div class="events-list">';

    dayEvents.forEach(function(event) {
      var time = event.startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      detailsHTML +=
        '<div class="event-detail-card">' +
          '<div class="event-detail-time">' + time + '</div>' +
          '<div class="event-detail-content">' +
            '<h4 class="event-detail-title">' + event.summary + '</h4>' +
            (event.location ? '<p class="event-detail-location">\uD83D\uDCCD ' + event.location + '</p>' : '') +
            (event.description ? '<p class="event-detail-description">' + event.description + '</p>' : '') +
          '</div>' +
        '</div>';
    });

    detailsHTML += '</div></div>';

    // Remove existing detail panel if any
    var existing = document.querySelector('.day-events-detail');
    if (existing) existing.remove();

    // Insert after the calendar grid
    var calendarGrid = document.querySelector('.calendar-grid');
    calendarGrid.insertAdjacentHTML('afterend', detailsHTML);
  }

  // Load events and render calendar
  loadAllCalendarEvents();
});
