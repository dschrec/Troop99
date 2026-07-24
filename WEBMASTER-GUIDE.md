# Troop 99 Webmaster Guide 🏕️

Complete guide for maintaining the Troop 99 Scouts website.

---

## How This Site Works

The website lives in one GitHub repository. All changes go through GitHub, and then get pushed to the GoDaddy server where the live site runs.

**Repository:** `github.com/dschrec/Troop99`
**Live site:** `troop99.org` (and `newtownscouts.org`)

**The files:**
```
V5/                          ← Main site folder
├── index.html               ← Homepage
├── about.html               ← About page
├── activities.html          ← Activities page
├── gallery.html             ← Gallery page
├── calendar.html            ← Calendar page
├── eagle-scouts.html        ← Eagle Scouts page
├── contact.html             ← Contact page
├── join.html                ← Join page
├── css/style.css            ← Site styling
├── js/script.js             ← JavaScript
├── admin/
│   └── index.html           ← Admin panel
├── data/
│   └── data.json            ← Slides, events, gallery content
└── images/                  ← All photos go here
    ├── summer-camp-hero.jpg
    ├── rafting-hero.jpg
    ├── parade-hero.jpg
    └── ...
```

---

## Part 1: Quick Content Updates (No Code Needed)

Use the **Admin Panel** for simple updates — adding slides, events, or gallery items. No coding required.

### Step 1: Open the Admin Panel

Go to the admin panel URL:
- **On your local computer:** `http://localhost:8899/admin/`
- **On the live server:** `https://troop99.org/admin/`

### Step 2: Make Your Changes

The admin panel has 4 sections:

**📊 Slides** — The big hero carousel on the homepage
- Add new slides with photos and text
- Edit existing slides
- Drag to reorder slides
- Each slide has: image, eyebrow text (small label), title, description, and a button

**📅 Events** — Meetings, camps, and activities
- Title, date/time, description
- Example: "Troop Meeting" — "Every Monday at 7:00 PM"

**📸 Gallery** — Photos from events
- Title, image, and a link to the full album
- Images are stored in the `images/` folder (see Part 2 for adding photos)

**✉️ Messages** — Contact form messages
- View messages from people who filled out the contact form

### Step 3: Save Your Changes

**IMPORTANT:** Changes are saved to your browser only. To publish them:

1. Click **"💾 Download data.json"** button (on the Dashboard)
2. A file called `data.json` downloads to your computer
3. Upload this file to the GitHub repo (see Part 3)

---

## Part 2: Adding Photos (The Two-Step Process)

**This is the most important thing to understand:** Images are stored separately from the text content.

**Step 1: Upload the image file**
**Step 2: Reference it in the admin panel**

### How to Upload Images

You have **three options** to get photos onto the server:

#### Option A: Via GitHub (easiest for small files)

1. Go to: `https://github.com/dschrec/Troop99`
2. Click on the `images/` folder
3. Click **"Add file" → "Upload files"**
4. Drag your photos in (you can upload multiple at once)
5. Name them clearly: `summer-camp-2025.jpg`, `spring-hike.jpg`, etc.
6. Click **"Commit changes"**

#### Option B: Via cPanel File Manager (for large files or many files)

1. Log into your GoDaddy cPanel
2. Click **"File Manager"**
3. Navigate to: `home/shared/troop99/V5/images/`
4. Click **"Upload"** button
5. Select your photos and upload them
6. Wait for the upload to complete

#### Option C: Via FileZilla (FTP)

1. Open FileZilla and connect to your GoDaddy server
2. Navigate to `/home/shared/troop99/V5/images/`
3. Drag and drop your photos from your computer to the images folder
4. Wait for transfer to complete

### Naming Your Images

- Use **lowercase letters only**: `summer-camp-hero.jpg`
- Use **hyphens** to separate words: `spring-hike-2025.jpg`
- Use **descriptive names**: `eagle-court-of-honor.jpg`
- Avoid spaces, numbers alone, or special characters

### How to Reference the Image in the Admin Panel

Once the image is uploaded (let's say you named it `summer-camp-2025.jpg`):

1. Go to the Admin Panel
2. Navigate to the section where you want to use the image (Slides, Gallery, etc.)
3. Click "Add New" or "Edit" on an existing item
4. In the **Image Path** field, enter: `images/summer-camp-2025.jpg`
5. Save

**That's it!** The `images/` prefix tells the site to look in the images folder.

### Image Size Tips

- Keep files under **500KB** for fast loading
- Ideal dimensions: **1200×800 pixels** for slides, **800×600** for gallery
- Use JPG format (smaller file size than PNG for photos)
- To compress images: use [TinyPNG](https://tinypng.com/) (free)

### What Happens If the Image Isn't Found?

If you reference an image that doesn't exist, the site shows a gray placeholder box. Always double-check that the filename matches exactly (case-sensitive!).

---

## Part 3: Publishing Changes to GitHub

After making any changes (via admin panel or file edits), you must commit them to GitHub for the changes to go live.

### Method 1: Via GitHub Website (easiest)

**For text/data changes (admin panel):**
1. Go to `https://github.com/dschrec/Troop99`
2. Navigate to the `data/` folder
3. Click **"Upload files"**
4. Upload the `data.json` file you downloaded
5. Confirm overwrite when asked
6. Scroll down and click **"Commit changes"**
7. Add a message like "Added summer camp slide"

**For image changes:**
1. Go to `https://github.com/dschrec/Troop99`
2. Click on the `images/` folder
3. Click **"Add file" → "Upload files"**
4. Upload your new photos
5. Click **"Commit changes"**

### Method 2: Via Command Line (if you know git)

```bash
# Navigate to the V5 folder
cd /home/shared/troop99/V5

# Check what changed
git status

# Add your changes
git add -A

# Commit with a description
git commit -m "Added summer camp slide and new photos"

# Push to GitHub
git push origin main
```

---

## Part 4: Deploying to the Live Server

After pushing to GitHub, the changes need to reach the live GoDaddy server.

### If you have server access (SSH):

```bash
# Sync V5 to V4 (live site)
rsync -av /home/shared/troop99/V5/ /home/shared/troop99/V4/
```

### If you use cPanel File Manager:

1. Download the updated files from GitHub (or use FileZilla)
2. Upload them to the GoDaddy server via cPanel File Manager
3. Navigate to: `home/shared/troop99/V4/`
4. Upload/replace the changed files

### Verify the Changes

After deploying:
1. Open `https://troop99.org/` in your browser
2. Refresh the page (Ctrl+F5 or Cmd+Shift+R to force refresh)
3. Check that your changes appear correctly

---

## Part 5: Adding New Pages

Adding a new page requires creating an HTML file. Here's how:

### Step 1: Copy an Existing Page

Take any existing page (like `about.html`) as a template. Open it in any text editor.

### Step 2: Customize the HTML

Change these parts:
- **Page title** (line 7): `<title>New Page - Troop 99 Scouts</title>`
- **Navigation menu** (around line 20-30): Add a link to your new page
- **Page header** (line 37): Change the background image and heading
- **Main content** (inside `<section class="section">`): Add your content
- **Footer** (line 102+): No changes needed — the footer is the same on all pages

### Step 3: Save and Upload

1. Save the file with your page name: `new-page.html`
2. Add it to the `V5/` folder
3. Upload to GitHub (add the file to your commit)
4. Push to GitHub
5. Deploy to the live server (if you have access)

### Adding a Link in the Navigation Menu

In the navigation section of each HTML file, add this between the existing links:

```html
<li><a href="new-page.html" class="nav-link">New Page</a></li>
```

Place it in the correct order among the other links.

---

## Part 6: Editing Existing Page Content

Some page content is stored in the HTML files directly (not in the admin panel JSON). Here's how to update them:

### What's in HTML Files (Manual Editing):
- Page headers and section headings
- About page text
- Activities descriptions
- Eagle Scout list
- Footer content
- Contact page information

### What's in data.json (Admin Panel):
- Homepage slideshow (hero carousel)
- Events (meetings, camps)
- Gallery items

### Editing HTML Files:

1. Go to `https://github.com/dschrec/Troop99`
2. Click on the file you want to edit (e.g., `about.html`)
3. Click the **pencil icon** (edit) in the top right
4. Make your changes
5. Scroll down and click **"Commit changes"**

**Tip:** HTML editing is straightforward. You're just changing text between `>` and `<` tags. Be careful not to delete the tags themselves!

---

## Part 7: Updating the Calendar

The calendar page shows events from `data.json`. To add or change events:

1. Open the Admin Panel
2. Go to the **📅 Events** section
3. Click "Add New" or "Edit" an existing event
4. Fill in:
   - **Title**: Event name (e.g., "Unit Assembly")
   - **Date/Time**: When it happens (e.g., "September 15, 2026 at 6:30 PM")
   - **Description**: Details (e.g., "Monthly unit assembly for all scouts")
5. Save the change
6. Download data.json (from Dashboard)
7. Upload to GitHub (Part 3)

---

## Part 8: Updating the Gallery

The gallery shows photos with links to full albums on ScaryGhost.

### Adding a New Gallery Item:

1. Upload the photo to the `images/` folder (Part 2)
2. Open the Admin Panel → **📸 Gallery**
3. Click "Add New"
4. Fill in:
   - **Title**: Event name (e.g., "Summer Camp 2026")
   - **Image Path**: `images/your-photo-name.jpg`
   - **Album Link**: ScaryGhost album URL
   - **Type**: Normal, Large (spans 2 columns), or Tall (spans 2 rows)
5. Save → Download data.json → Upload to GitHub

### Current Gallery Photos:
| Photo | Event |
|-------|-------|
| `summer-camp-hero.jpg` | Summer Camp |
| `rafting-hero.jpg` | Whitewater Rafting |
| `parade-hero.jpg` | Memorial Day Parade |
| `west-point-hero.jpg` | West Point Camporee |
| `valley-forge-hero.jpg` | Valley Forge Campout |
| `mlk-hero.jpg` | MLK Service Project |

---

## Part 9: Changing Page Colors or Styling

The site styling is controlled by `css/style.css`. Only change this if you know CSS.

**Common styling locations in style.css:**
- Colors: Look for `var(--navy)`, `var(--gold)`, `var(--forest)`, etc.
- Fonts: Look for `font-family` declarations
- Layout: Look for `display: flex`, `padding`, `margin`

**Recommendation:** Ask Dennis before making CSS changes — small mistakes can break the entire site layout.

---

## Part 10: Useful Commands

### Check what changed
```bash
cd /home/shared/troop99/V5
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
ls -la /home/shared/troop99/V5/images/
```

---

## Troubleshooting

### "My changes aren't showing up!"
1. Did you commit to GitHub? (Check the repo)
2. Did you upload data.json if you used the admin panel?
3. Did you deploy to the live server?
4. Try hard-refreshing: **Ctrl+F5** (Windows) or **Cmd+Shift+R** (Mac)

### "The image isn't showing!"
1. Check the filename in the admin panel matches the uploaded file exactly (case-sensitive!)
2. Make sure the image is actually in the `images/` folder
3. The path should be `images/filename.jpg` (with the `images/` prefix)
4. Check the image file actually uploaded successfully

### "The whole page looks broken!"
1. Did you edit a file you shouldn't have? (like `style.css` or the navigation)
2. Check GitHub's "History" tab to restore a previous version
3. Contact Dennis for help

### "I made a mistake — how do I undo?"
1. Go to your commit on GitHub
2. Click "History" to see past commits
3. Click "Restore" on the version you want to go back to

---

## Quick Reference

| What to change | Where to change it |
|----------------|-------------------|
| Homepage slides | Admin Panel → Slides |
| Events (meetings, camp) | Admin Panel → Events |
| Gallery photos | Admin Panel → Gallery + upload image |
| Contact info | `contact.html` (edit file on GitHub) |
| About text | `about.html` (edit file on GitHub) |
| Activities text | `activities.html` (edit file on GitHub) |
| Eagle Scout list | `eagle-scouts.html` (edit file on GitHub) |
| New photos | Upload to `images/` folder, then reference in admin panel |
| New pages | Create new HTML file, add to nav menu |

---

## Need Help?

Contact Dennis at: **troop99newtown@gmail.com**

**Remember:** When in doubt, ask before making changes. It's always better to check first!
