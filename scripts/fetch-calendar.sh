#!/bin/bash
# Fetch TroopMaster iCal feed and regenerate calendar-events.json
# This script unfolds iCal line folding to get full descriptions

ICAL_URL="http://tmweb.troopmaster.com/activitymanagement/icalendar/?id=wQRANP~NO&timezone=Eastern_Standard_Time"
TEMP_FILE=$(mktemp)

# Fetch the iCal feed
curl -s -o "$TEMP_FILE" "$ICAL_URL"

if [ $? -ne 0 ] || [ ! -s "$TEMP_FILE" ]; then
    echo "ERROR: Failed to fetch iCal feed"
    rm -f "$TEMP_FILE"
    exit 1
fi

# Parse and unfold lines using Python
python3 -c "
import json, sys
with open('$TEMP_FILE', 'r') as f:
    ical_data = f.read()
events = ical_data.split('BEGIN:VEVENT')
parsed_events = []
for i in range(1, len(events)):
    block = 'BEGIN:VEVENT' + events[i]
    if 'END:VEVENT' not in block:
        continue
    lines = block.split('\r\n') if '\r\n' in block else block.split('\n')
    unfolded = []
    for line in lines:
        if line.startswith(' ') and unfolded:
            unfolded[-1] = unfolded[-1] + line[1:]
        else:
            if line.strip():
                unfolded.append(line.strip())
    summary = description = location = dtstart = dtend = ''
    for line in unfolded:
        if line.startswith('SUMMARY:'): summary = line[8:]
        elif line.startswith('DESCRIPTION:'): description = line[12:]
        elif line.startswith('LOCATION:'): location = line[9:]
        elif line.startswith('DTSTART'): dtstart = line.split(':')[1].strip() if ':' in line else ''
        elif line.startswith('DTEND'): dtend = line.split(':')[1].strip() if ':' in line else ''
    if not dtstart: continue
    parsed_events.append({'summary': summary, 'description': description, 'location': location, 'startDate': dtstart, 'endDate': dtend if dtend else ''})
parsed_events.sort(key=lambda e: e['startDate'])
with open('/home/shared/troop99/V6/data/calendar-events.json', 'w') as f:
    json.dump(parsed_events, f, indent=2, ensure_ascii=False)
print(f'Updated {len(parsed_events)} events')
"

rm -f "$TEMP_FILE"

# Commit and push
cd /home/shared/troop99/V6
if git diff --quiet data/calendar-events.json; then
    echo "No changes detected"
else
    git add data/calendar-events.json
    git commit -m "Update calendar events from TroopMaster iCal feed"
    git push origin feature/gallery-backend
    echo "Pushed to feature/gallery-backend"
fi
