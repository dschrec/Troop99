/**
 * TroopMaster Calendar Sync
 * Fetches and displays calendar events from TroopMaster iCal feed
 * Shows a full interactive calendar view
 */

document.addEventListener('DOMContentLoaded', function() {
  // Note: Using HTTPS for TroopMaster feed (http was likely being upgraded or blocked)
  const calendarFeedURL = 'https://tmweb.troopmaster.com/activitymanagement/icalendar/?id=wQRANP~NO&timezone=Eastern_Standard_Time';
  // CORS proxy to bypass browser security restrictions
  const corsProxy = 'https://api.allorigins.win/raw?url=';
  let allEvents = [];
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  // Function to parse iCal event
  function parseICalEvent(eventData) {
    const lines = eventData.split('\n');
    let summary = '';
    let description = '';
    let startDate = null;
    let endDate = null;
    let location = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('SUMMARY:')) {
        summary = line.substring(8);
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.substring(12);
      } else if (line.startsWith('DTSTART')) {
        const dateStr = line.split(':')[1];
        // Parse iCal date format (20240915T190000 or 20240915)
        if (dateStr.includes('T')) {
          startDate = new Date(
            parseInt(dateStr.substring(0, 4)),
            parseInt(dateStr.substring(4, 6)) - 1,
            parseInt(dateStr.substring(6, 8)),
            dateStr.length > 8 ? parseInt(dateStr.substring(9, 11)) : 0,
            dateStr.length > 11 ? parseInt(dateStr.substring(11, 13)) : 0
          );
        } else {
          startDate = new Date(
            parseInt(dateStr.substring(0, 4)),
            parseInt(dateStr.substring(4, 6)) - 1,
            parseInt(dateStr.substring(6, 8))
          );
        }
      } else if (line.startsWith('DTEND')) {
        const dateStr = line.split(':')[1];
        if (dateStr.includes('T')) {
          endDate = new Date(
            parseInt(dateStr.substring(0, 4)),
            parseInt(dateStr.substring(4, 6)) - 1,
            parseInt(dateStr.substring(6, 8)),
            dateStr.length > 8 ? parseInt(dateStr.substring(9, 11)) : 0,
            dateStr.length > 11 ? parseInt(dateStr.substring(11, 13)) : 0
          );
        } else {
          endDate = new Date(
            parseInt(dateStr.substring(0, 4)),
            parseInt(dateStr.substring(4, 6)) - 1,
            parseInt(dateStr.substring(6, 8))
          );
        }
      } else if (line.startsWith('LOCATION:')) {
        location = line.substring(9);
      }
    }
    
    return {
      summary,
      description,
      startDate,
      endDate,
      location
    };
  }

  // Function to fetch and parse all events
  function loadAllCalendarEvents() {
    fetch(corsProxy + encodeURIComponent(calendarFeedURL))
      .then(response => response.text())
      .then(icalData => {
        allEvents = [];
        const eventBlocks = icalData.split('BEGIN:VEVENT');
        
        for (let i = 1; i < eventBlocks.length; i++) {
          const eventBlock = 'BEGIN:VEVENT' + eventBlocks[i];
          if (eventBlock.includes('END:VEVENT')) {
            const eventData = eventBlock.split('END:VEVENT')[0];
            const event = parseICalEvent(eventData);
            if (event.startDate) {
              allEvents.push(event);
            }
          }
        }
        
        // Sort events by date
        allEvents.sort((a, b) => a.startDate - b.startDate);
        
        // Render calendar view
        renderCalendarView();
        
        // Add subscribe link
        const subscribeLink = document.getElementById('calendar-subscribe');
        if (subscribeLink) {
          subscribeLink.href = calendarFeedURL;
        }
      })
      .catch(error => {
        console.error('Error loading calendar:', error);
        const calendarContainer = document.getElementById('troopmaster-calendar');
        if (calendarContainer) {
          calendarContainer.innerHTML = `
            <p class="calendar-error">Unable to load calendar. Please try again later.</p>
            <a href="${calendarFeedURL}" target="_blank" class="btn btn-secondary">View Full Calendar</a>
          `;
        }
      });
  }

  // Function to render the full calendar view
  function renderCalendarView() {
    const calendarContainer = document.getElementById('troopmaster-calendar');
    if (!calendarContainer) return;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get first and last day of month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // Get events for this month
    const monthEvents = allEvents.filter(event => {
      return event.startDate.getMonth() === currentMonth && 
             event.startDate.getFullYear() === currentYear;
    });

    // Build calendar grid
    let calendarHTML = `
      <div class="calendar-header">
        <button class="calendar-nav prev-month" onclick="window.calendarApp.prevMonth()">← Prev</button>
        <h2 class="calendar-month-year">${monthNames[currentMonth]} ${currentYear}</h2>
        <button class="calendar-nav next-month" onclick="window.calendarApp.nextMonth()">Next →</button>
      </div>
      
      <div class="calendar-days-of-week">
        ${dayNames.map(day => `<div class="day-label">${day}</div>`).join('')}
      </div>
      
      <div class="calendar-grid">
    `;

    // Add empty cells for days before start of month
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarHTML += `<div class="calendar-day empty"></div>`;
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentYear, currentMonth, day);
      const dayEvents = monthEvents.filter(event => 
        event.startDate.getDate() === day
      );
      
      const isToday = currentDate.toDateString() === new Date().toDateString();
      
      calendarHTML += `<div class="calendar-day ${isToday ? 'today' : ''}">`;
      calendarHTML += `<div class="day-number">${day}</div>`;
      
      if (dayEvents.length > 0) {
        calendarHTML += '<div class="day-events">';
        dayEvents.forEach(event => {
          calendarHTML += `<div class="month-event" title="${event.summary}">`;
          calendarHTML += `<div class="event-time">${event.startDate.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}</div>`;
          calendarHTML += `<div class="event-name">${event.summary}</div>`;
          calendarHTML += '</div>';
        });
        calendarHTML += '</div>';
      }
      
      calendarHTML += '</div>';
    }

    calendarHTML += '</div>';

    // Add legend and subscribe info
    calendarHTML += `
      <div class="calendar-footer">
        <div class="calendar-legend">
          <span class="legend-item">📅 = Today</span>
        </div>
        <div class="calendar-subscribe">
          <a href="${calendarFeedURL}" target="_blank" class="btn btn-secondary">
            📥 Subscribe to Full Calendar
          </a>
        </div>
      </div>
    `;

    calendarContainer.innerHTML = calendarHTML;

    // Add click handlers to days
    document.querySelectorAll('.calendar-day:not(.empty)').forEach(dayEl => {
      dayEl.addEventListener('click', function() {
        const dayNumber = parseInt(this.querySelector('.day-number').textContent);
        const dayEvents = monthEvents.filter(event => 
          event.startDate.getDate() === dayNumber
        );
        
        if (dayEvents.length > 0) {
          showDayEvents(dayNumber, dayEvents);
        }
      });
    });
  }

  // Helper function to convert \n escapes to HTML line breaks
  function decodeICalText(text) {
    if (!text) return '';
    // Replace literal \n (backslash + n) with <br> tags
    return text.replace(/\\n/g, '<br>');
  }

  // Function to show events for a specific day
  function showDayEvents(day, dayEvents) {
    const calendarContainer = document.getElementById('troopmaster-calendar');
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    let detailsHTML = `
      <div class="day-events-detail">
        <h3>Events for ${day} ${monthNames[currentMonth]}</h3>
        <div class="events-list">
    `;
    
    dayEvents.forEach(event => {
      const time = event.startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const decodedLocation = decodeICalText(event.location);
      const decodedDescription = decodeICalText(event.description);
      
      detailsHTML += `
        <div class="event-detail-card">
          <div class="event-detail-time">${time}</div>
          <div class="event-detail-content">
            <h4 class="event-detail-title">${event.summary}</h4>
            ${decodedLocation ? `<p class="event-detail-location">📍 ${decodedLocation}</p>` : ''}
            ${decodedDescription ? `<p class="event-detail-description">${decodedDescription}</p>` : ''}
          </div>
        </div>
      `;
    });
    
    detailsHTML += '</div></div>';
    
    // Insert after the calendar grid
    const calendarGrid = calendarContainer.querySelector('.calendar-grid');
    calendarGrid.insertAdjacentHTML('afterend', detailsHTML);
  }

  // Month navigation functions
  window.calendarApp = {
    prevMonth: function() {
      if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
      } else {
        currentMonth--;
      }
      renderCalendarView();
    },
    
    nextMonth: function() {
      if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
      } else {
        currentMonth++;
      }
      renderCalendarView();
    }
  };

  // Load events and render calendar
  loadAllCalendarEvents();
});
