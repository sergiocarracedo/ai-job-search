# RemoteOK API Reference

**Base URL:** `https://remoteok.com/remote-jobs.json`

**Authentication:** None (public API)

**Method:** `GET`

## Search Endpoint

```
GET https://remoteok.com/remote-jobs.json?q=<keyword>&location=<country>
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Keyword search (job title, skill, company) |
| `location` | string | Optional location filter (e.g. "Europe", "US") |

### Response Shape

```json
[
  { "id": "...", "position": "...", "company": "...", "location": "...", "tags": [...], "date": "...", "description": "...", "url": "...", "logo": "...", "remote": true, "apply_url": "...", "salary": "..." },
  ...
]
```

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique job ID |
| `position` | string | Job title |
| `company` | string | Company name |
| `location` | string | Location/region or "Anywhere" |
| `tags` | string[] | Skills/tags |
| `date` | string | Posting date (relative, e.g. "2 days ago") |
| `url` | string | Job board listing URL |
| `apply_url` | string | Direct apply link |
| `remote` | boolean | Always `true` for RemoteOK |
| `salary` | string | Salary range (if listed) |
| `logo` | string | Company logo URL |

## Job Detail

RemoteOK doesn't have a separate detail endpoint — the search result contains the full description.

## Rate Limiting

RemoteOK may rate-limit aggressive scraping. Use reasonable delays between requests.
