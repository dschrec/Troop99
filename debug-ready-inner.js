// This simulates what calendar-sync.js does when loaded via document.write
var log = document.getElementById('log');
function msg(text) { if (log) log.innerHTML += text + '<br>'; }

// Check readyState when this script loads (simulating calendar-sync.js behavior)
msg('INNER SCRIPT: document.readyState = ' + document.readyState);
msg('INNER SCRIPT: document.getElementById("cal") = ' + (document.getElementById('cal') !== null));

// Simulate the calendar-sync.js logic:
// if (document.readyState === 'loading') { wait } else { run immediately }
if (document.readyState === 'loading') {
  msg('INNER SCRIPT: DOM is loading, will wait for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', function() {
    msg('INNER SCRIPT: DOMContentLoaded fired - would run loadLocalEvents()');
  });
} else {
  msg('INNER SCRIPT: DOM already ready, running immediately');
  msg('INNER SCRIPT: This should be what calendar-sync.js does');
  msg('INNER SCRIPT: readyState check passed - script WILL run');
  msg('INNER SCRIPT: === SUCCESS: The readyState fix WORKS ===');
}

// Also check: is there a #troopmaster-calendar div?
var calDiv = document.getElementById('troopmaster-calendar');
msg('INNER SCRIPT: troopermaster-calendar exists: ' + (calDiv !== null));
