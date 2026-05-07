# Data Structure Documentation

## Overview
This document explains the structure of `data.json`, which contains all course/resource information for the OpenLearn platform.

---

## File: `data.json`

### Purpose
Contains an array of course objects that are loaded and displayed on the Courses page. This file is fetched dynamically by JavaScript to populate the course grid, tag filters, and search functionality.

### JSON Structure

```json
[
  {
    "title": "Course Name",
    "description": "Brief description of what you'll learn",
    "level": "Beginner|Intermediate|Advanced",
    "lessons": 5,
    "link": "URL or internal link to course",
    "tags": ["category1", "category2", "category3"]
  }
]
```

### Field Descriptions

#### `title` (String, Required)
- Purpose: The name of the course.
- Example: `"JavaScript Essentials"`
- Used for: Course card heading and search results.
- Important: Keep it concise for better card display.

#### `description` (String, Required)
- Purpose: Short overview of the course content.
- Example: `"Learn core JavaScript concepts with hands-on exercises"`
- Used for: Course card subtitle and search indexing.
- Important: Keep it under 100 characters for best display.

#### `level` (String, Required)
- Valid values: `"Beginner"`, `"Intermediate"`, `"Advanced"`
- Purpose: Indicates difficulty level for filtering.
- Used for: Level filter dropdown and course card metadata.
- Important: Must match exactly, including capitalization.

#### `lessons` (Number, Required)
- Purpose: Number of lessons in the course.
- Type: Integer
- Example: `8`
- Used for: Displayed as "X lessons" on course cards and resources.

#### `link` (String, Required)
- Purpose: URL where users click "Open" to access the course.
- Example: `"courses/javascript/javascript.html"` or `"https://example.com/javascript"`
- Used for: Open button on course cards.
- Important: Can be internal or external, but should always point to a valid destination.

#### `tags` (Array of Strings, Required)
- Purpose: Categories/topics for filtering and organization.
- Example: `["javascript", "programming", "web"]`
- Used for: Tag filter chips and search matching.
- Important: Use lowercase and keep tag names consistent.

---

## How Data Is Used

### 1. Loading Data
When the Courses page loads, JavaScript in `courses.html` fetches the data:

```javascript
const res = await fetch("data.json");
const data = await res.json();
```

### 2. Rendering Courses
Each course object is converted to a card:
- Title appears as a link.
- Description shows below the title.
- Tags appear as clickable chips.
- Level and lesson count show as metadata.
- Open button links to the course.

### 3. Filtering and Search
All filters use data from these fields:
- Text search checks `title` and `description`.
- Level filter matches the `level` field.
- Tag filter matches values in the `tags` array.
- Tag generation counts how many courses use each tag.

---

## Adding New Courses

### Step 1: Add to `data.json`
Add a new course object to the array:

```json
{
  "title": "Express.js Backend Development",
  "description": "Learn to build REST APIs and server applications with Express.js",
  "level": "Intermediate",
  "lessons": 12,
  "link": "https://example.com/expressjs-course",
  "tags": ["javascript", "backend", "nodejs", "api"]
}
```

### Step 2: Best Practices
- Use exact capitalization for `level`.
- Keep `tags` lowercase and consistent.
- Use short, descriptive titles.
- Keep descriptions under 100 characters.
- Remove duplicates before adding a new item.
- Do not add extra fields outside the current schema.
- Do not leave required fields empty.
- Do not break JSON syntax.

### Step 3: Testing
1. Save `data.json`.
2. Refresh `courses.html` in the browser.
3. Verify the new course appears in the grid.
4. Check that new tags appear in the filters.
5. Test search with course title keywords.
6. Test the level filter for the correct level.

---

## Common Mistakes and Solutions

### Problem: Course doesn't appear
- Check JSON syntax with a validator.
- Check that all required fields are present.
- Check the browser console for fetch errors.
- Refresh the page with a hard reload.

### Problem: Tags don't filter correctly
- Check that tags are lowercase.
- Check that tag names are consistent across courses.
- Standardize naming, for example use `"ml"` consistently.

### Problem: Search doesn't find a course
- Check that the keywords exist in the title or description.
- Check spelling.
- Search is case-insensitive and supports partial matches.

### Problem: Level filter shows the wrong level
- Check that `level` exactly matches `"Beginner"`, `"Intermediate"`, or `"Advanced"`.

---

## Example: Complete Course Entry

```json
{
  "title": "Python for Data Science",
  "description": "Learn Python programming with focus on data analysis and visualization",
  "level": "Intermediate",
  "lessons": 9,
  "link": "https://example.com/python-data-science",
  "tags": ["python", "data", "analysis", "pandas"]
}
```

### This course
- Has a descriptive, searchable title.
- Includes relevant tags for filtering.
- Specifies an appropriate difficulty level.
- Shows a realistic lesson count.
- Has a valid external link.
- Uses a concise description.

---

## Tech Notes for Developers

### Fetching Data

```javascript
const response = await fetch("data.json");
const courses = await response.json();
```

### Filtering Algorithm

```javascript
const filtered = courses.filter((course) => {
  const matchesSearch =
    searchText === "" || (course.title + course.description).includes(searchText);
  const matchesLevel = levelFilter === "" || course.level === levelFilter;
  const matchesTags =
    selectedTags.length === 0 || course.tags.some((tag) => selectedTags.includes(tag));

  return matchesSearch && matchesLevel && matchesTags;
});
```

### Tag Counting

```javascript
const tagCounts = {};
courses.forEach((course) => {
  course.tags.forEach((tag) => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  });
});
```

---

## Questions?
For issues or questions about the data structure, check:
1. Browser console for errors.
2. `DATA_STRUCTURE.md`
3. Comments in `courses.html`
4. Comments in `courses_Style.css`
