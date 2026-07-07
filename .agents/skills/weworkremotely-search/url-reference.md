# WeWorkRemotely URL Reference

**Base search URL:** `https://weworkremotely.com/remote-<slug>-jobs`

**Authentication:** None (public)

## Search URL Pattern

```
GET https://weworkremotely.com/remote-<keyword>-jobs
```

Parameters (query string):
- `page=<n>` — pagination (1-indexed)

## HTML Structure

Job cards are in `<li>` elements with class `job-listing`.

Each card contains:
- Job title in `<a class="job-link">`
- Company in `<a class="company-link">` or `<span class="company">
- Location/region in `<div class="location">`
- Posted date in `<time>` or `<div class="date">
- Categories/tags in `<div class="categories">`

Detail page: `https://weworkremotely.com/remote-jobs/<id>`

Job detail contains:
- Full description in `<div class="description">`
- Apply link in `<a class="apply-button">`

## Response Shape (parsed)

```json
{
  "id": "1234567",
  "title": "Python Developer",
  "company": "Acme Corp",
  "location": "Worldwide",
  "date": "2026-01-05",
  "url": "https://weworkremotely.com/remote-jobs/1234567",
  "categories": ["Software Development", "Python"],
  "apply_url": "https://weworkremotely.com/remote-jobs/1234567/apply"
}
```

## Rate Limiting

Respect robots.txt. Use delays between bulk requests.
