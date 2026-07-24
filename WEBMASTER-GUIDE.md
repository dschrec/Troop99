# Troop 99 Webmaster Guide

## How to Update the Website

The Troop 99 website is a simple static site. You can update it by editing content in the **Admin Panel** and committing changes to GitHub.

### Step 1: Open the Admin Panel

Go to the admin panel on your local machine or server:
```
http://localhost:8899/admin/
```
(or the URL where the site is hosted)

### Step 2: Make Your Changes

The admin panel has sections for:

- **Slides** - The hero carousel images on the homepage
- **Events** - Upcoming events (meetings, camp, etc.)
- **Gallery** - Photos and links to albums
- **Messages** - Contact form submissions

You can:
- **Add** new items by clicking "Add New"
- **Edit** existing items by clicking "Edit"
- **Delete** items by clicking "Delete"
- **Reorder** slides by dragging them

All changes save automatically to your browser (localStorage).

### Step 3: Download Your Changes

When you're ready to publish:

1. Go to the **Dashboard** (first page)
2. Click the **"💾 Download data.json"** button (top right, near the navigation)
3. A file called `data.json` will download to your computer

### Step 4: Replace and Commit to GitHub

**Option A - Using GitHub (easiest):**

1. Go to: `https://github.com/dschrec/Troop99`
2. Navigate to the `data/` folder
3. Click "Upload files"
4. Upload the `data.json` file you downloaded (confirm overwrite)
5. Click "Commit changes" at the bottom
6. Add a message like "Updated slides/events" and click "Commit changes"

**Option B - Using the Terminal (if you have git installed):**

```bash
# Copy the downloaded file to the V5 folder
cp ~/Downloads/data.json /path/to/V5/data/data.json

# Commit and push
cd /path/to/V5
git add data/data.json
git commit -m "Updated slides/events from admin panel"
git push origin main
```

### Step 5: Deploy (if you have server access)

If you also have access to the GoDaddy server:

```bash
# Sync V5 to the live server
rsync -av /home/shared/troop99/V5/ /home/shared/troop99/V4/
```

Or upload via cPanel File Manager / FileZilla.

---

## Quick Tips

- **Images**: Image paths in the admin panel should be like `images/summer-camp-hero.jpg` (relative to site root)
- **Gallery links**: Point to your ScaryGhost photo albums
- **Safety first**: The admin panel edits are just in your browser until you click "Download data.json" and commit to GitHub
- **Backup**: GitHub acts as your backup - you can always restore old versions from the "History" tab

## Troubleshooting

- **Changes don't show up?** Make sure you committed to GitHub and deployed to the server
- **Images not loading?** Check that the image path is correct and the file exists in the `images/` folder
- **Accidentally deleted something?** You can restore any previous `data.json` from GitHub's "History" tab

---

**Questions?** Contact Dennis at troop99newtown@gmail.com
