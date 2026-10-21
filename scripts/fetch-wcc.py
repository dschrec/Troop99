#!/usr/bin/env python3
"""
Fetch Washington Crossing Council (wccscouting.org) calendar events and
write an Outlook/Google/Apple-compatible ICS to data/wcc-events.ics.

Uses the same JSON endpoint the council's own calendar widget calls:
POST /cfroot/campsCMSWrapper.cfc  method=GetRemoteCMSEvents

Runs on GitHub Actions (ubuntu-latest, python3) and locally.
Stdlib only.
"""
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    from zoneinfo import ZoneInfo
    TZ = ZoneInfo("America/New_York")
except Exception:  # tzdata missing on runner
    TZ = timezone(timedelta(hours=-5))

API_URL = "https://www.wccscouting.org/cfroot/campsCMSWrapper.cfc"
SITE_URL = "https://www.wccscouting.org"
OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "wcc-events.ics"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def fetch_events(start, end):
    fields = {
        "method": "GetRemoteCMSEvents",
        "returnformat": "json",
        "CalendarStartDate": start.strftime("%Y-%m-%d"),
        "CalendarEndDate": end.strftime("%Y-%m-%d"),
        "StartDate": start.strftime("%Y-%m-%d"),
        "SiteID": "116",
        "CampID": "119",
        "DistrictIDi": "0",
        "EventCategoryID": "0",
    }
    body = urllib.parse.urlencode(fields)
    req = urllib.request.Request(
        API_URL,
        data=body.encode(),
        headers={
            "User-Agent": UA,
            "Referer": f"{SITE_URL}/calendar",
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def parse_dt(value):
    dt = datetime.strptime(value, "%a, %d %b %Y %H:%M:%S")
    return dt.replace(tzinfo=TZ)


def clean_html(text):
    text = re.sub(r"<br\s*/?>", "\n", text or "")
    text = re.sub(r"</p>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    for a, b in (("&nbsp;", " "), ("&amp;", "&"), ("&#39;", "'"),
                 ("&quot;", '"'), ("&lt;", "<"), ("&gt;", ">")):
        text = text.replace(a, b)
    return text.strip()


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
    seen = set()
    for ev in events:
        eid = str(ev.get("ID") or ev.get("BLOGID"))
        if not eid or eid in seen:
            continue
        seen.add(eid)

        start = parse_dt(ev["STARTDATE"])
        end = parse_dt(ev["ENDDATE"])
        allday = ev.get("ISALLDAY") == 1
        url = ev.get("SHORTURL") or ""
        if url and not url.startswith("http"):
            url = SITE_URL + url

        desc = clean_html(ev.get("DESCRIPTION", ""))
        if url:
            desc = (desc + ("\n" if desc else "") + f"Details: {url}").strip()

        lines.append("BEGIN:VEVENT")
        lines.append(fold(f"UID:wcc-{eid}@troop99"))
        lines.append(fold(f"DTSTAMP:{to_utc(generated)}"))
        if allday:
            lines.append(f"DTSTART;VALUE=DATE:{start.strftime('%Y%m%d')}")
            lines.append(f"DTEND;VALUE=DATE:{end.strftime('%Y%m%d')}")
        else:
            lines.append(f"DTSTART:{to_utc(start)}")
            lines.append(f"DTEND:{to_utc(end)}")
        lines.append(fold(f"SUMMARY:{esc(ev.get('NAME', 'WCC Event'))}"))
        if ev.get("LOCATION"):
            lines.append(fold(f"LOCATION:{esc(ev['LOCATION'])}"))
        if desc:
            lines.append(fold(f"DESCRIPTION:{esc(desc)}"))
        if url:
            lines.append(fold(f"URL:{url}"))
        lines.append("END:VEVENT")
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"


def main():
    now = datetime.now(TZ)
    # Stamp at midnight UTC so an unchanged day produces a byte-identical
    # file and the Actions workflow commits nothing (idempotent sync).
    stamp = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    start = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
    end = now + timedelta(days=365)

    events = fetch_events(start, end)
    OUT_PATH.write_text(build_ics(events, stamp), encoding="utf-8")
    print(f"Wrote {len(events)} WCC events to {OUT_PATH}")


if __name__ == "__main__":
    main()
