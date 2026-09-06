# Troop 99 Website Maintenance Guide 🏕️

**Site:** newtownscouts.org  
**Last Updated:** September 2026  

---

## How This Site Works

The website runs **entirely on GitHub Pages**. It's a **static site** — no database, no backend, no admin panel. Everything is plain HTML, CSS, and JavaScript files stored in a GitHub repository.

**Repository:** `github.com/dschrec/Troop99`  
**Live site:** `https://newtownscouts.org/`

**All changes go through Git. There is no web interface for editing.**

---

## Site Structure

The main site lives in the `main` branch of the repository:

```
V6/                              ← Main site folder
├── index.html                   ← Homepage
├── about.html                   ← About page
├── activities.html              ← Activities page
├── gallery.html                 ← Gallery index page
├── calendar.html                ← Calendar page
├── eagle-scouts.html            ← Eagle Scout page
├── eagle-roster.html            ← T99 Eagles roster
├── contact.html                 ← Contact page
├── join.html                    ← Join page
├── adult-leadership.html        ← Leader bios (not live yet)
├── css/style.css                ← Site styling
├── js/script.js                 ← JavaScript (nav, slideshow, etc.)
├── data/
│   ├── data.json                ← Homepage slideshow data
│   └── gallery-config.json      ← Event gallery metadata
├── gallery/                     ← Event-based gallery system
│   ├── gallery.html             ← Gallery index (event thumbnails)
│   ├── css/style.css            ← Gallery-specific styles
│   ├── gallery/                 ← Individual event pages
│   │   ├── july-osr-summer-camp.html
│   │   ├── constitution-center.html
│   │   ├── may-memorial-day-parade.html
│   │   └── ...                  ← More event pages
│   └── _archive/                ← Archived event pages
│       └── index.html           ← List of archived events
├── images/                      ← All photos go here
│   ├── summer-camp-hero.jpg     ← Homepage slider background
│   ├── parade-hero.jpg          ← Parade-related images
│   ├── rafting-hero.jpg         ← Rafting/whitewater images
│   ├── valley-forge-hero.jpg    ← About page header
│   ├── hero-morrell-smith.jpg   ← Contact page header
│   └── ...                      ← Event photos (25+ photos)
├── SITE-MAINTENANCE-GUIDE.md    ← Detailed gallery guide
└── WEBMASTER-GUIDE.md           ← This file
```

---

## Part 1: Adding Photos

**This is the most important thing to understand:** Images are stored separately from text content.

**Step 1:** Upload the image file  
**Step 2:** Reference it in the appropriate file (HTML or JSON)

### How to Upload Images

Go to: `https://github.com/dschrec/Troop99`

1. Click on the `images/` folder
2. Click **\"Add file\" → \"Upload files\"**
3. Drag your photos in (you can upload multiple at once)
4. Name them clearly: `summer-camp-2025.jpg`, `spring-hike.jpg`, etc.
5. Click **\"Commit changes\"**

### Naming Your Images

- Use **lowercase letters only**: `summer-camp-hero.jpg`
- Use **hyphens** to separate words: `spring-hike-2025.jpg`
- Use **descriptive names**: `eagle-court-of-honor.jpg`
- Avoid spaces, numbers alone, or special characters

### Image Size Tips

- Keep files under **500KB** for fast loading
- Ideal dimensions: **1200×800 pixels** for slides, **800×600** for gallery
- Use JPG format (smaller file size than PNG for photos)
- To compress images: use [TinyPNG](https://tinypng.com/) (free)

### What Happens If the Image Isn't Found?

If you reference an image that doesn't exist, the site shows a broken image icon. Always double-check that the filename matches exactly (case-sensitive!).

---

## Part 2: Homepage Slideshow

The homepage slideshow data lives in `data/data.json`. To update it:

1. Go to `https://github.com/dschrec/Troop99`
2. Navigate to the `data/` folder
3. Click on `data.json`
4. Click the **pencil icon** (edit) in the top right
5. Edit the JSON (add/edit slides — follow the existing format)
6. Scroll down and click **\"Commit changes\"**

**Each slide needs:** image path, title, description, eyebrow text, and button text.

---

## Part 3: Event Gallery (New System)

The gallery uses a **JSON-driven event system**. Events are organized by year, with each event having its own page.

**Two card styles:**
- **Published** = clickable, drill into event page
- **Draft** = "Coming Soon" badge, non-clickable

**How to manage events:**

1. **Add a photo** → Upload to `images/` folder (Part 1)
2. **Create event page** → Copy an existing event HTML from `gallery/gallery/`
3. **Add to config** → Add entry to `data/gallery-config.json`
4. **Set status** → `"draft"` = not live, `"published"` = visible and clickable

See `SITE-MAINTENANCE-GUIDE.md` for detailed steps on creating and managing event galleries.

---

## Part 4: Editing Page Content

Some content is stored in HTML files directly. To edit them:

1. Go to `https://github.com/dschrec/Troop99`
2. Click on the file you want to edit (e.g., `about.html`)
3. Click the **pencil icon** (edit) in the top right
4. Make your changes (change text between `>` and `<` tags)
5. Scroll down and click **\"Commit changes\"**

**What's in HTML files (manual editing):**
- Page headers and section headings
- About page text
- Activities descriptions
- Eagle Scout list
- Footer content
- Contact page information

---

## Part 5: Adding New Pages

Adding a new page requires creating an HTML file.

### Step 1: Copy an Existing Page

Take any existing page (like `about.html`) as a template.

### Step 2: Customize the HTML

Change these parts:
- **Page title** (line 7): `<title>New Page - Troop 99 Scouts</title>`
- **Navigation menu** (around line 20-30): Add a link to your new page
- **Page header** (line 37+): Change the background image and heading
- **Main content** (inside `<section class="section">`): Add your content
- **Footer** (line 102+): No changes needed — the footer is the same on all pages

### Step 3: Save and Upload

1. Save the file with your page name: `new-page.html`
2. Upload to GitHub (add the file to a commit)
3. Push to GitHub

### Adding a Link in the Navigation Menu

In the navigation section of each HTML file, add this between the existing links:

```html
<li><a href="new-page.html" class="nav-link">New Page</a></li>
```

Place it in the correct order among the other links.

---

## Part 6: Changing Page Colors or Styling

The site styling is controlled by `css/style.css`. Only change this if you know CSS.

**Common styling locations in style.css:**
- Colors: Look for `var(--navy)`, `var(--gold)`, `var(--forest)`, etc.
- Fonts: Look for `font-family` declarations
- Layout: Look for `display: flex`, `padding`, `margin`

**Recommendation:** Ask Mr. Schrecengost before making CSS changes — small mistakes can break the entire site layout.

---

## Part 7: Useful Commands

### Check what changed
```bash
cd /home/shared/troop99/V6
git status
```

### See what you committed last time
```bash
git log --oneline -5
```

### Revert to a previous version
```bash
# Find the commit hash you want to restore
git log --oneline

# Restore to that commit
git checkout <commit-hash>
```

### List all images in the folder
```bash
ls -la /home/shared/troop99/V6/images/
```

---

## Troubleshooting

### "My changes aren't showing up!"
1. Did you commit to GitHub? (Check the repo)
2. Try hard-refreshing: **Ctrl+F5** (Windows) or **Cmd+Shift+R** (Mac)

### "The image isn't showing!"
1. Check the filename matches the uploaded file exactly (case-sensitive!)
2. Make sure the image is actually in the `images/` folder
3. The path should be `images/filename.jpg` (with the `images/` prefix)
4. Check the image file actually uploaded successfully

### "The whole page looks broken!"
1. Did you edit a file you shouldn't have? (like `style.css` or the navigation)
2. Check GitHub's "History" tab to restore a previous version
3. Contact Mr. Schrecengost for help

### "I made a mistake — how do I undo?"
1. Go to your commit on GitHub
2. Click "History" to see past commits
3. Click "Restore" on the version you want to go back to

---

## Quick Reference

| What to change | Where to change it |
|----------------|-------------------|
| Homepage slides | `data/data.json` (edit on GitHub) |
| Gallery events | `data/gallery-config.json` + event HTML files |
| Event pages | `gallery/gallery/*.html` (edit on GitHub) |
| Contact info | `contact.html` (edit file on GitHub) |
| About text | `about.html` (edit file on GitHub) |
| Activities text | `activities.html` (edit file on GitHub) |
| Eagle Scout list | `eagle-scouts.html` (edit file on GitHub) |
| New photos | Upload to `images/` folder, then reference in HTML/JSON |
| New pages | Create new HTML file, add to nav menu |

---

## Need Help?

Contact Mr. Schrecengost at: **troop99admin@gmail.com**

**Remember:** When in doubt, ask before making changes. It's always better to check first!
