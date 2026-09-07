# GitHub Actions Calendar Sync — Complete Setup Guide

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

## Step 1: Create a Classic Personal Access Token

1. Go to **https://github.com/settings/tokens**
2. Click **"Generate new token (classic)"**
3. Fill in:
   - **Note:** `troop99-calendar-sync`
   - **Expiration:** Set a reasonable date (or leave unchecked for no expiry)
   - **Scopes:** Check only **`repo`** (full control of private repos — needed for write access)
4. Scroll down and click **"Generate token"**
5. **Copy the token value** (starts with `ghp_...`) — you won't see it again

> **Note:** We use a classic PAT instead of a fine-grained token because it supports no expiration, and since you only use GitHub for this one project, there's no meaningful security downside. If you ever create private repos or collaborators, consider switching to a fine-grained token with a 30-day rotation schedule.

---

## Step 2: Add the Token as a GitHub Secret

1. Go to **github.com/dschrec/Troop99 → Settings → Secrets and variables → Actions**
2. Click **"New repository secret"**
3. **Name:** `TOKEN`
4. **Value:** paste the token from Step 2
5. Click **"Add secret"**

---

## Step 3: Test the Workflow

1. Go to the **Actions** tab on the repo
2. Click **"Sync TroopMaster Calendar"** in the left sidebar
3. Click **"Run workflow"** → then **"Run workflow"** again to confirm
4. Check the run log — if successful, `data/calendar-events.json` will be updated
5. Verify the JSON looks correct

---

## Step 4: Remove the Old Cron Job (Optional)

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

---

## Regenerating or Updating the Token

You should regenerate or update the token if:
- The token expires (if you set an expiration date)
- You suspect the token was compromised
- You want to rotate the token for security

### To regenerate the token:

1. Go to **https://github.com/settings/tokens**
2. **Delete the existing token:**
   - Find `troop99-calendar-sync` in the list
   - Click the trash can icon or "Delete token" button
   - Confirm deletion
3. **Create a new token:**
   - Click **"Generate new token (classic)"**
   - Follow the same steps as in Section 1 above
   - Give it a name like `troop99-calendar-sync` (or `troop99-calendar-sync-v2`)
   - Check only the `repo` scope
   - Generate and copy the new token
4. **Update the GitHub secret:**
   - Go to **github.com/dschrec/Troop99 → Settings → Secrets and variables → Actions**
   - Click on the existing `TOKEN` secret to edit it
   - Replace the old token value with the new one
   - Click **"Update secret"**

No changes to the workflow file or code are needed — the workflow uses `${{ secrets.TOKEN }}` which always references the current secret value.

### Token Security Reminder
- Never share the token in email, chat, or public forums
- Never commit the token to any file
- Always delete the token from GitHub when it's no longer needed
- Consider setting an expiration date (e.g., 90 days) as a safety measure

---

## Alternative: Remove Cron Entirely?

If you prefer, we can keep both the cron job (server-side, no browser dependency) AND add the GitHub Actions workflow (for GitHub Pages deployment). They'd both write to the same file — whichever runs last updates it. But that's redundant if we trust one source.

My recommendation: **GitHub Actions replaces both the cron job and the CORS proxy entirely.** Once verified, remove the cron job.
