# Quick Reference Guide - OpenLearn

## 🚀 Quick Start (30 seconds)

```bash
# Start local server
python -m http.server 8000

# Open in browser
http://localhost:8000/Courses.html
```

---

## 📁 File Quick Navigation

| File | Purpose | Edit This For |
|------|---------|---|
| `Courses.html` | Main page + all JS logic | Functionality, markup, filters |
| `Courses_Style.css` | Complete styling | Colors, layout, animations |
| `data.json` | Course database | Adding/editing courses |
| `index.html` | Landing page | Home page content |
| `style.css` | Landing page styling | Home page styling |

---

## 🎯 Most Important Code Sections

### 1. Search & Filter Logic (Courses.html)
```javascript
// Line ~140: Main filter function
function applyFilters() {
  const q = searchInput.value.toLowerCase();
  const level = levelDropdown.value;
  const active = Array.from(activeTags);
  
  // Filters by: search text + level + tags
  const filtered = courses.filter(c => {
    return matchesSearch && matchesLevel && matchesTags;
  });
  renderResources(filtered);
}
```

### 2. Course Card Creation (Courses.html)
```javascript
// Line ~65: Creates individual course cards
function createCard(item) {
  const el = document.createElement('article');
  el.className = 'resource-card';
  el.innerHTML = `
    <h3><a href="${item.link}">${item.title}</a></h3>
    <p>${item.description}</p>
  `;
  return el;
}
```

### 3. Load Data (Courses.html)
```javascript
// Line ~30: Fetch and init
async function loadResources() {
  const res = await fetch('data.json');
  const data = await res.json();
  window.__resources = data;
  renderTagRow(data);
  renderResources(data);
}
```

---

## 🎨 CSS Key Classes

```css
/* Grid for courses */
.course-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }

/* Individual cards */
.course-card { padding: 16px; border-radius: 14px; cursor: pointer; }
.course-card:hover { transform: translateY(-6px); }

/* Filter tags */
.tag-chip { border-radius: 999px; padding: 8px 12px; }
.tag-chip.active { background: var(--accent); color: #fff; }

/* Search area */
.filters-row { display: flex; gap: 12px; flex-wrap: wrap; }
.search-input { border: 0; padding: 10px; }
```

---

## 📊 Data.json Structure

```json
{
  "title": "Course Name",           // What to search for
  "description": "What you'll learn", // Search + card text
  "level": "Beginner",              // Filter: Beginner|Intermediate|Advanced
  "lessons": 5,                     // Card metadata
  "link": "URL to course",          // Click Open button → goes here
  "tags": ["python", "data"]        // Click tags to filter
}
```

---

## 🔧 Common Customizations

### Change Colors
**File**: `Courses_Style.css`
```css
:root {
  --bg: #f7f9fc;         /* Page background */
  --accent: #3b82f6;     /* Buttons, links */
  --muted: #6b7280;      /* Gray text */
  --card: #ffffff;       /* Card white */
}
```

### Add Course
**File**: `data.json`
```json
{
  "title": "New Course",
  "description": "Learn cool stuff",
  "level": "Intermediate",
  "lessons": 8,
  "link": "https://example.com",
  "tags": ["python", "web"]
}
```

### Change Number of Columns
**File**: `Courses_Style.css`
```css
/* Default: auto-fit (responsive) */
.course-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }

/* Force 3 columns */
.course-grid { grid-template-columns: repeat(3, 1fr); }

/* Force 1 column */
.course-grid { grid-template-columns: 1fr; }
```

### Change Mobile Breakpoint
**File**: `Courses_Style.css`
```css
/* Currently 800px - stack vertically on mobile */
@media (max-width: 800px) {
  .resource-main { max-width: 100%; }
  .resource-card { flex-direction: column; }
}
```

---

## 🐛 Debugging Checklist

### Courses not showing?
- [ ] `data.json` valid JSON? (Use jsonlint.com)
- [ ] Using local server? (python -m http.server)
- [ ] Console errors? (F12 → Console tab)
- [ ] File paths correct in html?

### Filters not working?
- [ ] JavaScript enabled?
- [ ] Course objects have required fields?
- [ ] Tags are lowercase?
- [ ] Page fully loaded?

### Styles look wrong?
- [ ] CSS file linked correctly?
- [ ] Hard refresh? (Ctrl+Shift+R)
- [ ] File paths correct?
- [ ] Browser supports flexbox/grid?

### Search not finding courses?
- [ ] Search text in title or description?
- [ ] Case-insensitive? (should be)
- [ ] Cleared filters?
- [ ] Course actually in data.json?

---

## 💡 JavaScript Function Reference

| Function | Location | What It Does |
|----------|----------|---|
| `loadResources()` | ~30 | Fetch data.json and init page |
| `createCard()` | ~65 | Build single course card HTML |
| `renderTagRow()` | ~90 | Create tag filter buttons |
| `renderResources()` | ~120 | Display course grid |
| `applyFilters()` | ~140 | Filter courses by all criteria |
| `injectCourseIcons()` | ~165 | Add icons to course cards |

---

## 🎨 CSS Sections

| Section | Line | Purpose |
|---------|------|---------|
| `:root` | 1 | Color variables |
| `body` | 20 | Global typography |
| `.container` | 35 | Page width limit |
| `.site-header` | 40 | Header styling |
| `.course-grid` | 70 | Grid layout |
| `.course-card` | 75 | Card styling |
| `.tag-chip` | 120 | Filter tags |
| `@media` | 140 | Mobile responsive |

---

## 📱 Mobile Optimization

### Default (Desktop)
- 2-3 columns
- Side-by-side layout
- Full hover effects
- Large touch targets

### Mobile (< 800px)
- Single column  
- Stacked layout
- Larger buttons
- Vertical filters

### Test Mobile
```bash
# Option 1: DevTools (F12) → Toggle device toolbar
# Option 2: Browser width < 800px
# Option 3: Open on phone http://your-ip:8000
```

---

## 🌟 Best Practices

✅ **DO:**
- Add courses to data.json
- Use lowercase tag names
- Keep descriptions short
- Test before pushing
- Comment your changes
- Use semantic HTML
- Test on mobile

❌ **DON'T:**
- Edit compressed JS (minified versions)
- Break JSON syntax
- Use MixedCase for tags
- Hardcode colors (use CSS variables)
- Skip mobile testing
- Remove comments from code

---

## 🚀 Performance Tips

### Optimize Data
```json
// Good - valid, formatted
{
  "title": "Python 101",
  "description": "Learn Python basics",
  "level": "Beginner",
  "lessons": 5,
  "link": "https://example.com",
  "tags": ["python"]
}

// Avoid - too long descriptions
{
  "description": "This is a very very very long description that..." // < Keep short!
}
```

### Optimize Strings
- Keep titles 3-7 words
- Keep descriptions < 100 chars
- Use short tag names (1-2 words)
- Avoid special characters in tags

---

## 📚 Learning Path

### Day 1: Understand Structure
1. Read `README.md`
2. Browse `Courses.html` structure
3. View `data.json` format
4. Check `Courses_Style.css` sections

### Day 2: Make Changes
1. Add 3 courses to `data.json`
2. Change colors in CSS `:root`
3. Modify card padding/margins
4. Add new tag searches

### Day 3: Advanced
1. Create new filter type
2. Add course categories
3. Implement sorting
4. Build course detail pages

---

## 🔗 Useful Resources

### Validation Tools
- **JSON**: jsonlint.com (validate data.json)
- **CSS**: jigsaw.w3.org/css-validator
- **HTML**: validator.w3.org

### Testing
- **Cross-browser**: browserstack.com
- **Mobile**: ngrok.io (share localhost)
- **Performance**: pagespeed.web.dev

### Learning
- **CSS Grid**: css-tricks.com/snippets/css/complete-guide-grid
- **Flexbox**: css-tricks.com/snippets/css/a-guide-to-flexbox
- **JavaScript**: developer.mozilla.org/en-US/docs/Web/JavaScript

---

## 🎯 Next Steps

1. ✅ Understand current code (read this guide + README)
2. ✅ Run locally (python -m http.server 8000)
3. ✅ Add your own courses
4. ✅ Try customizations
5. ✅ Extend with new features
6. ✅ Deploy to hosting

---

## 💬 FAQ Quick Answers

**Q: How do I add a course?**  
A: Edit `data.json` and add object with title, description, level, lessons, link, tags

**Q: How do I change colors?**  
A: Edit `:root` variables in `Courses_Style.css`

**Q: How do I test locally?**  
A: Run `python -m http.server 8000` then open `http://localhost:8000`

**Q: How do I deploy?**  
A: Upload all files to any static hosting (Netlify, GitHub Pages, etc.)

**Q: How do I add more filter types?**  
A: Create new select/checkbox, store selected value, filter by it in applyFilters()

**Q: How do I add animations?**  
A: Use CSS `@keyframes` and `animation` properties (see Courses_Style.css)

---

**Happy Coding! 🎉**

Last Updated: February 2026 | Version: 1.0
