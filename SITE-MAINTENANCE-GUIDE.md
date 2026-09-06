# Troop 99 Website Maintenance Guide

**Site:** newtownscouts.org  
**Last Updated:** September 2026  

---

## Table of Contents
- [Overview](#overview)
- [How the Site Works](#how-the-site-works)
- [Adding a New Event](#adding-a-new-event)
- [Uploading Photos](#uploading-photos)
- [Publishing a Draft Event](#publishing-a-draft-event)
- [Archiving an Event](#archiving-an-event)
- [Editing Event Content](#editing-event-content)
- [General Tips](#general-tips)

---

## Overview

The Troop 99 website uses a **static, event-based gallery system**. All pages are plain HTML/CSS/JavaScript with no database or backend.

**Event gallery types:**
- **Published events** appear on the main gallery page and are clickable
- **Draft events** show as "Coming Soon" on the gallery page (non-clickable)
- **Archived events** are removed from the gallery index but remain accessible via direct link

**How it works:**
1. Photos are stored in `/images/` directory
2. Event metadata is managed in `/data/gallery-config.json`
3. JavaScript reads the JSON and renders the gallery dynamically
4. No manual HTML editing required for the gallery index
5. No database, no backend — just static files

---

## How the Site Works

**Important:** This website runs entirely on GitHub Pages. It's a **static site** — no admin panel, no database, no server-side code. Everything is just HTML, CSS, and JavaScript files.

**What this means for maintenance:**
- No web interface for adding photos (no admin panel)
- No drag-and-drop upload system
- Changes are made by editing files directly (JSON + HTML)
- All changes are tracked via Git — you can always revert

**The maintenance workflow:**
1. Photos are stored in `/images/` directory
2. Event metadata is managed in `/data/gallery-config.json`
3. JavaScript reads the JSON and renders the gallery dynamically
4. No manual HTML editing required for the gallery index
5. No database, no backend — just static files

---

## Adding a New Event

### Step 1: Upload the Event's Photo(s)

Place photo files in the `images/` directory. Use descriptive, lowercase filenames with hyphens:
```
images/august-paddle-trip.jpg
images/august-paddle-trip-2.jpg
```

### Step 2: Create the Event Page

Create a new HTML file in the `gallery/` directory:
```
gallery/august-paddle-trip.html
```

Copy the structure from an existing event page (e.g., `gallery/july-osr-summer-camp.html`) and update:
- Title (h1 heading)
- Description text
- Photo references (img src paths)

### Step 3: Add Entry to Gallery Config

Open `data/gallery-config.json` and add a new entry at the top of the events array:

```json
{
  "title": "August Paddle Trip",
  "slug": "august-paddle-trip",
  "year": 2026,
  "month": 8,
  "status": "draft",
  "description": "Our scouts spent a day paddle boarding on the river"
}
```

**Key fields:**
| Field | Description |
|-------|-------------|
| `title` | Event display name |
| `slug` | URL-friendly name (matches the HTML filename, lowercase with hyphens) |
| `year` | Event year |
| `month` | Event month number (1=January, 12=December) |
| `status` | `"draft"` = not visible on gallery, `"published"` = visible and clickable |
| `description` | Short description shown on the event page |

### Step 4: Save and Test

Save the file and visit:
- Draft: `http://your-server:8899/gallery/gallery/august-paddle-trip.html`
- Gallery index: `http://your-server:8899/gallery/gallery.html`

The event will appear as "Coming Soon" on the gallery page.

---

## Uploading Photos

1. Copy image files to the `images/` directory
2. Use consistent naming: lowercase, hyphens for spaces
3. Recommended format: JPG, under 2MB each for fast loading
4. Ensure the filename matches what's referenced in the HTML

**Common naming conventions:**
```
april-backpacking-trip.jpg
august-paddle-trip.jpg
july-osr-summer-camp.jpg
```

---

## Publishing a Draft Event

When an event is ready to go live:

1. Open `data/gallery-config.json`
2. Find the event entry
3. Change `"status": "draft"` to `"status": "published"`
4. Save the file

That's it — the event immediately appears on the gallery index and becomes clickable.

**Example change:**
```json
// Before
{
  "title": "August Paddle Trip",
  "status": "draft",
  ...
}

// After
{
  "title": "August Paddle Trip",
  "status": "published",
  ...
}
```

---

## Archiving an Event

When you want to remove an event from the gallery index but keep it accessible:

### Step 1: Move the HTML File
```bash
mv gallery/august-paddle-trip.html gallery/_archive/august-paddle-trip.html
```

### Step 2: Update the Config
Change the status to `"archived"`:
```json
{
  "title": "August Paddle Trip",
  "status": "archived",
  ...
}
```

### Step 3: Save
The event drops from the gallery index but remains accessible at:
```
gallery/_archive/august-paddle-trip.html
```

An "View archived event galleries" link at the bottom of the gallery page lists all archived events.

---

## Editing Event Content

### Edit Text/Photos on an Event Page

Open the event's HTML file in `gallery/`:
```
gallery/july-osr-summer-camp.html
```

Changes you can make:
- **Photo:** Update `<img src>` paths
- **Caption:** Edit the `div class="photo-caption"` text
- **Description:** Edit the text in the `.event-description` section
- **Title:** Edit the `<h1 class="event-header-title">` text

### Edit Gallery Index Metadata

Open `data/gallery-config.json` to change:
- `title` — Display name on gallery cards
- `description` — Subtitle on the event page
- `year` / `month` — Sorting order

---

## General Tips

### File Naming
- Use lowercase with hyphens: `april-backpacking-trip.jpg`
- Avoid spaces, uppercase, or special characters
- Use unique filenames for each event

### Gallery Config Tips
- Keep entries sorted by year (newest first)
- Published events always appear before draft events within the same year
- The `slug` must match the HTML filename exactly

### Photo Management
- Photos in `/images/` are shared across the site
- Before deleting a photo, check that no other page references it
- Use the same image on multiple pages if it's appropriate (no need to duplicate)

### Testing
- Always test draft pages before publishing
- Check links on mobile devices
- Verify all images load correctly

### Backing Up
- Commit changes regularly with descriptive messages
- The git history serves as a backup — you can revert changes if needed

---

## Quick Reference

| Action | What to Edit |
|--------|-------------|
| Add new event | Upload photo → Create HTML → Add JSON entry (status: draft) |
| Publish event | Change status to "published" in JSON |
| Archive event | Move HTML to `_archive/` + change status to "archived" |
| Edit event page | Edit HTML file in `gallery/` |
| Change event metadata | Edit `data/gallery-config.json` |
