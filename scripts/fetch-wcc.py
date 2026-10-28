#!/usr/bin/env python3
"""
Fetch Washington Crossing Council (wccscouting.org) calendar events and
write an Outlook/Google/Apple-compatible ICS to data/wcc-events.ics.

WCC migrated to WordPress (Councilware plugin); their own calendar widget
now fetches from:
  GET /wp-content/plugins/councilware/calendar/render.php?calendarID=N&start=YYYY-MM-DD&end=YYYY-MM-DD
Calendars: 1=Council, 3=OSR, 6=Training. The endpoint caps results per
query, so we fetch month-by-month and dedupe by (calendarId, eventId).

(R2026-10: the old ColdFusion /cfroot/campsCMSWrapper.cfc endpoint 404s.)
Runs on GitHub Actions (ubuntu-latest, python3) and locally. Stdlib only.
"""
import json
import re
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    from zoneinfo import ZoneInfo
    TZ = ZoneInfo("America/New_York")
except Exception:  # tzdata missing on runner
    TZ = timezone(timedelta(hours=-5))

RENDER_URL = "https://www.wccscouting.org/wp-content/plugins/councilware/calendar/render.php"
CAL_IDS = (1, 3, 6)  # Council, OSR, Training
OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "wcc-events.ics"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def fetch_chunk(cid, start, end):
    url = f"{RENDER_URL}?calendarID={cid}&start={start:%Y-%m-%d}&end={end:%Y-%m-%d}"
    last_err = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": UA,
                "Referer": "https://www.wccscouting.org/calendar/",
            })
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            snippet = e.read().decode("utf-8", "replace")[:200]
            last_err = f"HTTP {e.code}: {snippet}"
            print(f"cal{cid} {start:%Y-%m-%d} attempt {attempt+1} failed: {last_err}", flush=True)
        except Exception as e:
            last_err = str(e)
            print(f"cal{cid} {start:%Y-%m-%d} attempt {attempt+1} failed: {last_err}", flush=True)
        time.sleep(2 ** (attempt + 1))  # 2s, 4s, 8s backoff
    raise SystemExit(f"WCC fetch failed after retries (cal{cid} {start:%Y-%m-%d}): {last_err}")


def fetch_all(start_date, end_date):
    """Month-by-month over all calendars; dedupe by (calendarId, eventId)."""
    events = {}
    cur = start_date
    while cur <= end_date:
        nxt = min(cur + timedelta(days=31), end_date)
        for cid in CAL_IDS:
            for ev in fetch_chunk(cid, cur, nxt):
                key = f"cal{ev.get('calendarId', cid)}-{ev['eventId']}"
                events[key] = ev
        cur = nxt + timedelta(days=1)
    return events


def parse_dt(value):
    """Feed dates look like '2026-10-24T00:00:00' — Eastern local, naive.
    Some events have an empty end date; fall back to the start."""
    if not value:
        return None
    dt = datetime.strptime(value, "%Y-%m-%dT%H:%M:%S")
    return dt.replace(tzinfo=TZ)


def clean_html(text):
    text = re.sub(r"<br\s*/?>", "\n", text or "")
    text = re.sub(r"</(p|div|li)>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    for a, b in (("&nbsp;", " "), ("&amp;", "&"), ("&#39;", "'"),
                 ("&quot;", '"'), ("&lt;", "<"), ("&gt;", ">")):
        text = text.replace(a, b)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def esc(text):
    return (text or "").replace("\\", "\\\\").replace(";", "\\;") \
                        .replace(",", "\\,").replace("\n", "\\n")


def fold(line):
    out, cur = [], ""
    for ch in line:
        if len((cur + ch).encode()) > 73:
            out.append(cur)
            cur = " " + ch
        else:
            cur += ch
    out.append(cur)
    return "\r\n".join(out)


def to_utc(dt):
    return dt.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def build_ics(events, generated):
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Troop99//WCC Calendar Sync//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:WCC Scouting Events",
        "X-WR-TIMEZONE:America/New_York",
        fold(f"X-WR-CALDESC:Washington Crossing Council events (synced from wccscouting.org; generated {generated.isoformat()})"),
    ]
    for key in sorted(events, key=lambda k: (events[k]["start"], events[k]["title"])):
        ev = events[key]
        if str(ev.get("isCancelled", "false")).lower() == "true":
            continue

        start = parse_dt(ev["start"])
        if start is None:
            continue
        end = parse_dt(ev.get("end"))
        if end is None:
            # Feed omits end for some events: treat as all-day on start day.
            end = start
        # Feed marks all-day events as 00:00:00 -> 23:59:59 (or midnight->midnight).
        allday = start.time() == datetime.min.time() and (
            end.time() >= datetime(1, 1, 1, 23, 59).time() or end.date() > start.date()
            and end.time() == datetime.min.time())

        url = ev.get("eventPageURL") or ev.get("registrationURL") or ""
        desc = clean_html(ev.get("description", ""))
        reg = ev.get("registrationURL") or ""
        if reg and reg != url:
            desc = (desc + ("\n" if desc else "") + f"Register: {reg}").strip()
        if url:
            desc = (desc + ("\n" if desc else "") + f"Details: {url}").strip()

        lines.append("BEGIN:VEVENT")
        lines.append(fold(f"UID:wcc-{key}@troop99"))
        lines.append(fold(f"DTSTAMP:{to_utc(generated)}"))
        if allday:
            # DTEND is exclusive in RFC5545: 23:59:59 end -> next day.
            dtend = end.date() + timedelta(days=1) if end.time() >= datetime(1, 1, 1, 23, 59).time() else end.date()
            if dtend <= start.date():
                dtend = start.date() + timedelta(days=1)
            lines.append(f"DTSTART;VALUE=DATE:{start:%Y%m%d}")
            lines.append(f"DTEND;VALUE=DATE:{dtend:%Y%m%d}")
        else:
            if end <= start:
                end = start + timedelta(hours=1)
            lines.append(f"DTSTART:{to_utc(start)}")
            lines.append(f"DTEND:{to_utc(end)}")
        title = ev.get("title") or ev.get("fullName") or "WCC Event"
        lines.append(fold(f"SUMMARY:{esc(title)}"))
        if ev.get("location"):
            lines.append(fold(f"LOCATION:{esc(ev['location'])}"))
        if desc:
            lines.append(fold(f"DESCRIPTION:{esc(desc)}"))
        if url:
            lines.append(fold(f"URL:{url}"))
        lines.append("END:VEVENT")
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"


def main():
    now = datetime.now(TZ)
    # Midnight-UTC stamp => byte-identical file when nothing changed
    # => the Actions workflow commits nothing (idempotent sync).
    stamp = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = (now - timedelta(days=7)).date()
    end_date = now.date() + timedelta(days=365)

    events = fetch_all(start_date, end_date)
    OUT_PATH.write_text(build_ics(events, stamp), encoding="utf-8")
    print(f"Wrote {len(events)} WCC events to {OUT_PATH}")


if __name__ == "__main__":
    main()
