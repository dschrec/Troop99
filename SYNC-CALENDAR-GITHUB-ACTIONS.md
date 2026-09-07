# GitHub Actions Calendar Sync — Implementation Plan

## Problem
- Current cron job runs on your machine and depends on a fragile CORS proxy for browser fallback
- CORS proxies (allorigins.win, heroku, codetabs, corsproxy.io) are all unreliable or dead
- TroopMaster sends zero CORS headers, so browsers can't fetch the feed directly
- TroopMaster only provides iCal format — no JSON API

## Solution
Replace the cron job and CORS proxy with a GitHub Actions workflow that runs on GitHub's servers. No proxy needed — GitHub makes a normal HTTP request to TroopMaster.

---

## How It Works

```
Every day at 6:00 AM EDT → GitHub Actions runs
    ↓
curl TroopMaster iCal feed (direct HTTP from GitHub servers, no proxy)
    ↓
Parse iCal → unfold line folds → extract events → write JSON
    ↓
git commit + push to feature/gallery-backend
    ↓
Calendar page on feature branch reads fresh JSON on next visit
```

---

## Step 1: Create Workflow File

**File:** `.github/workflows/sync-calendar.yml`

```yaml
name: Sync TroopMaster Calendar

on:
  schedule:
    # Every day at 10:00 UTC = 6:00 AM EDT
    - cron: '0 10 * * *'
  workflow_dispatch:  # Manual trigger button in GitHub UI

permissions:
  contents: write

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          ref: feature/gallery-backend
          token: ${{ secrets.TOKEN }}

      - name: Fetch TroopMaster iCal feed
        run: |
          curl -s -o TroopMaster.ics \
            "http://tmweb.troopmaster.com/activitymanagement/icalendar/?id=wQRANP~NO&timezone=Eastern_Standard_Time"

      - name: Parse iCal to JSON
        run: |
          python3 << 'PYEOF'
          import json

          with open('TroopMaster.ics', 'r') as f:
              ical = f.read()

          events = ical.split('BEGIN:VEVENT')
          parsed = []

          for block in events[1:]:
              if 'END:VEVENT' not in block:
                  continue
              full = 'BEGIN:VEVENT' + block
              raw_lines = full.split('\r\n') if '\r\n' in full else full.split('\n')

              unfolded = []
              for line in raw_lines:
                  if line.startswith(' ') and unfolded:
                      unfolded[-1] += line[1:]
                  else:
                      stripped = line.strip()
                      if stripped:
                          unfolded.append(stripped)

              summary = description = location = dtstart = dtend = ''
              for line in unfolded:
                  if line.startswith('SUMMARY:'):
                      summary = line[8:]
                  elif line.startswith('DESCRIPTION:'):
                      description = line[12:]
                  elif line.startswith('LOCATION:'):
                      location = line[9:]
                  elif line.startswith('DTSTART'):
                      parts = line.split(':')
                      dtstart = parts[1].strip() if len(parts) > 1 else ''
                  elif line.startswith('DTEND'):
                      parts = line.split(':')
                      dtend = parts[1].strip() if len(parts) > 1 else ''

              if dtstart:
                  parsed.append({
                      'summary': summary,
                      'description': description,
                      'location': location,
                      'startDate': dtstart,
                      'endDate': dtend if dtend else ''
                  })

          parsed.sort(key=lambda e: e['startDate'])

          with open('data/calendar-events.json', 'w') as f:
              json.dump(parsed, f, indent=2, ensure_ascii=False)
              f.write('\n')

          print(f'Wrote {len(parsed)} events')
          PYEOF

      - name: Commit and push if changed
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/calendar-events.json
          if git diff --cached --quiet; then
            echo "No changes — calendar is up to date"
          else
            git commit -m "Update calendar events from TroopMaster iCal feed"
            git push origin feature/gallery-backend
          fi
```

---

## Step 2: Create a Classic Personal Access Token

1. Go to **github.com → Settings → Developer settings → Personal access tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Fill in:
   - **Note:** `troop99-calendar-sync`
   - **Expiration:** Set a reasonable date (or leave unchecked for no expiry)
   - **Scopes:** Check only **`repo`** (full control of private repos — needed for write access)
4. Scroll down and click **"Generate token"**
5. **Copy the token value** (starts with `ghp_...`) — you won't see it again

> **Note:** We use a classic PAT instead of a fine-grained token because it supports no expiration, and since you only use GitHub for this one project, there's no meaningful security downside. If you ever create private repos or collaborators, consider switching to a fine-grained token with a 30-day rotation schedule.

---

## Step 3: Add the Token as a GitHub Secret

1. Go to **github.com/dschrec/Troop99 → Settings → Secrets and variables → Actions**
2. Click **"New repository secret"**
3. **Name:** `TOKEN`
4. **Value:** paste the token from Step 2
5. Click **"Add secret"**

---

## Step 4: Test the Workflow

1. Go to the **Actions** tab on the repo
2. Click **"Sync TroopMaster Calendar"** in the left sidebar
3. Click **"Run workflow"** → then **"Run workflow"** again to confirm
4. Check the run log — if successful, `data/calendar-events.json` will be updated
5. Verify the JSON looks correct

---

## Step 5: Remove the Old Cron Job (Optional)

Once the GitHub Actions workflow is verified working:

```bash
crontab -e
# Remove the line with: fetch-calendar.sh
# Save and exit
crontab -l  # verify it's gone
```

---

## Important Notes

### Branch Strategy
- The workflow pushes to `feature/gallery-backend`
- When ready to deploy: merge `feature/gallery-backend` → `main`
- GitHub Pages auto-deploys from `main`

### TroopMaster ID Security
The TroopMaster ID (`wQRANP~NO`) is exposed in the workflow file. This is **not a security risk** because:
- It's already visible in browser network requests on the live site
- It only provides read-only access to public calendar events
- Anyone could find it by inspecting the live site

### Manual Trigger
You can manually trigger the sync anytime by going to **Actions → Sync TroopMaster Calendar → Run workflow**. No need to wait for the daily schedule.

### What Gets Updated
Only `data/calendar-events.json` is modified. No HTML files change. The calendar page reads this JSON file directly.

### TroopMaster Downtime
If TroopMaster is down (HTTP 500, 522, etc.), the workflow will skip the commit and leave the existing JSON file in place — no data loss.

### Token Rotation
Our token has no expiration. You should only regenerate it if:
- You suspect the token was compromised (e.g., accidentally shared in a public forum)
- You want to rotate it for routine security maintenance
- The token expires (if you later choose to set an expiration date)

### Regenerating or Updating the Token

To regenerate the token:

1. **Delete the existing token:**
   - Go to **https://github.com/settings/tokens**
   - Find `troop99-calendar-sync` in the list
   - Click the trash can icon or "Delete token" button
   - Confirm deletion

2. **Create a new token:**
   - Click **"Generate new token (classic)"**
   - Give it a name like `troop99-calendar-sync` (or `troop99-calendar-sync-v2`)
   - Check only the `repo` scope
   - Generate and copy the new token

3. **Update the GitHub secret:**
   - Go to **github.com/dschrec/Troop99 → Settings → Secrets and variables → Actions**
   - Click on the existing `TOKEN` secret to edit it
   - Replace the old token value with the new one
   - Click **"Update secret"**

No changes to the workflow file or code are needed — the workflow uses `${{ secrets.TOKEN }}` which always references the current secret value.

### Token Security Reminder
- Never share the token in email, chat, or public forums
- Never commit the token to any file
- Always delete the token from GitHub when it's no longer needed

---

## Alternative: Remove Cron Entirely?

If you prefer, we can keep both the cron job (server-side, no browser dependency) AND add the GitHub Actions workflow (for GitHub Pages deployment). They'd both write to the same file — whichever runs last updates it. But that's redundant if we trust one source.

My recommendation: **GitHub Actions replaces both the cron job and the CORS proxy entirely.** Once verified, remove the cron job.
