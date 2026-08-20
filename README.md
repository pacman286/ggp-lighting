# GGP Lighting Assessment Tool

A mobile-friendly web application for recording and tracking light fixture
condition assessments at Gathering Place, Tulsa OK.

Live at: `https://pacman286.github.io/ggp-lighting`

---

## Project Structure

```
ggp-lighting/
│
├── index.html                  ← The entire application
├── Code.gs                     ← Google Apps Script backend (NOT served by GitHub)
├── manifest.json               ← Web app manifest
├── generate_poles_json.py      ← Regenerates poles.json from the Excel sources
├── .gitignore
│
└── data/
    └── poles.json              ← Item / fixture definitions and coordinates
```

The Excel source files (`Lighting_Type_*.xlsx`, `Additional_Light_Poles.xlsx`)
live in this folder locally but are excluded from Git by `.gitignore`.

---

## How the Pieces Fit Together

| Piece | Where it runs | What it does |
|---|---|---|
| `index.html` | Browser, served by GitHub Pages | Map, assessment UI, all app logic |
| `data/poles.json` | Fetched by the app | What items exist, where they are, what fixtures they carry |
| `Code.gs` | Google Apps Script | Reads and appends assessment records |
| Google Sheet | Google Drive | The assessment record of truth |

Base map imagery is Esri World Imagery, loaded live. No API key required.

---

## Local Development

1. Open the `ggp-lighting` folder in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. The app opens at `http://127.0.0.1:5500`

Live Server is required — opening `index.html` directly from the filesystem
will fail to load `poles.json` due to browser security restrictions.

---

## Deploying Changes

**App changes (`index.html`, `poles.json`):**

```bash
git add .
git commit -m "Description of the change"
git push
```

GitHub Pages rebuilds within about a minute. Hard refresh (`Ctrl+Shift+R`)
to bypass the browser cache.

**Backend changes (`Code.gs`):**

Pushing to GitHub does *nothing* for the Apps Script — it runs in the Google
account, not on GitHub. To deploy:

1. Open the Google Sheet → **Extensions → Apps Script**
2. Replace the code, save
3. **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**

The web app URL stays the same. When a release changes both, deploy the Apps
Script first so there's no window where the app is talking to an old backend.

---

## Adding New Item Types

1. Drop the new `Lighting_Type_XX.xlsx` into the project folder
2. Add one line to `EXCEL_SOURCES` in `generate_poles_json.py`
3. Add a matching block to `POLE_TYPE_DEFINITIONS` (fixtures listed top-down,
   left-to-right)
4. Run `python generate_poles_json.py`
5. Commit and push

Mixed-type additions (new items spanning types that already exist) go in a
file listed under `ADDITIONAL_FILES` instead — see `Additional_Light_Poles.xlsx`.

Coordinate columns are detected by value range, so swapped or misspelled
latitude/longitude headers are corrected automatically. `?` in any electrical
field is stored as null.

> **Keep the generator authoritative.** Hand-editing `data/poles.json` works,
> but the next generator run overwrites it. If you edit the JSON directly,
> mirror the change into `generate_poles_json.py` at the same time.

---

## Assessment Data

Records are appended to the **Assessment Log** tab of the Google Sheet, one row
per fixture assessment. The log is append-only — a re-assessment adds a row
rather than replacing one, so full history is preserved.

The app derives current condition by taking the highest `idx` per
device + fixture position. `idx` is assigned server-side inside a lock, so it is
reliable across multiple devices regardless of their clock settings.

**Offline / failed saves.** If a save can't be confirmed, the record is queued
locally and a red count appears on the refresh button (⟳). Tapping ⟳ retries the
queue and then pulls current state from the server. The queue survives a reload.
A record is never reported as saved unless the server confirms it.

**Multiple users.** State is fetched on page load, not polled. Teams do not see
each other's work until someone refreshes. Assign teams to different item types
and hide the rest in Settings to avoid overlap. The stats bar reflects only what
that device has loaded.

**Exporting.** Tap **Export CSV** in the header. To reduce to current condition
only: sort by `idx` descending, then **Data → Remove Duplicates** on the
`deviceNum` and `fixturePosition` columns.

---

## Resetting for a New Assessment Round

Delete the entire **Assessment Log** tab in the Google Sheet. The script
recreates it with correct headers on the first save of the new round.

There is deliberately no in-app reset. A destructive action in a field app
carried by several people risks wiping a round in progress.

---

## Condition Scale

| Value | Label | Meaning |
|-------|-------|---------|
| 0 | Not Assessed | No assessment recorded |
| 1 | 100% Functional | Fully operational |
| 2 | >50% Functional | Majority of LEDs operational |
| 3 | <50% Functional | Minority of LEDs operational |
| 4 | Flickering | Unstable / intermittent |
| 5 | Non-Functional | Completely inoperative |

A marker is coloured by the worst condition among its genuinely assessed
fixtures (condition 0 is ignored). A white centre dot means the item is
partially assessed — some fixtures still need a reading.

---

## Known Limitations

- The Apps Script endpoint is unauthenticated. Anyone with the URL can read or
  append records. The URL is visible in `index.html`, which is public.
- Multi-user state is not live; refresh is manual.
- Every page load fetches the full log. Fine at current volumes; would need
  server-side deduplication if the log were allowed to grow across many rounds.
