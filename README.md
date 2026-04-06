# GGP Lighting Assessment Tool

A mobile-friendly web application for recording and tracking light fixture
condition assessments at Gathering Place, Tulsa OK.

---

## Project Structure

```
ggp-lighting/
│
├── index.html                  ← Main application (open this in Live Server)
├── manifest.json               ← PWA manifest (home screen install)
├── generate_poles_json.py      ← Regenerate poles.json from Excel source
│
├── data/
│   └── poles.json              ← Auto-generated pole/fixture config (DO NOT hand-edit)
│
└── images/
    ├── poles/
    │   └── T4_pole.jpg         ← ← ← ADD POLE PHOTO HERE
    ├── satellite/
    │   └── park_satellite.jpg  ← ← ← ADD SATELLITE IMAGE HERE (from Google Earth Pro)
    └── icons/
        ├── icon-192.png        ← PWA icon (192×192)
        └── icon-512.png        ← PWA icon (512×512)
```

---

## Quick Start

1. Open the `ggp-lighting` folder in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. The app opens in your browser at `http://127.0.0.1:5500`

---

## Adding the Satellite Image

1. Export a high-resolution image of the park from **Google Earth Pro**
   - File → Save → Save Image (set maximum resolution)
   - Crop to the park boundary
   - Note the **lat/lng of the top-left and bottom-right corners** of your crop

2. Save the image as `images/satellite/park_satellite.jpg`

3. Open `data/poles.json`, find `"imageOverlay"` and update:
   ```json
   "imageOverlay": {
     "enabled": true,
     "imagePath": "images/satellite/park_satellite.jpg",
     "bounds": [[SOUTH_LAT, WEST_LNG], [NORTH_LAT, EAST_LNG]],
     "opacity": 1.0
   }
   ```
   Replace the four coordinate values with your actual corner coordinates.

---

## Adding the Pole Photo (T4)

1. Take or obtain a clear photo of the T4 pole showing all fixtures
2. Save as `images/poles/T4_pole.jpg`
3. The app will automatically display it in the detail panel

---

## Adding New Pole Types (T5, T6, etc.)

1. Add the new Excel sheet data to the source file (or a new Excel file)
2. Add a new entry to `POLE_TYPE_DEFINITIONS` in `generate_poles_json.py`
3. Run: `python generate_poles_json.py`
4. Add the corresponding image to `images/poles/`

---

## Updating Pole Data

When pole records change in your CMMS export:

1. Update the Excel source file
2. Run: `python generate_poles_json.py`
3. Refresh the app

---

## Deploying to GitHub Pages

1. Create a GitHub repository
2. Push this folder as the repository root
3. Go to Settings → Pages → Source: main branch / root
4. App will be live at `https://yourusername.github.io/ggp-lighting`

---

## Assessment Data

Assessment records are stored in **browser localStorage** on the device used.
To export all records: tap **Export CSV** in the app header.
The CSV can be opened in Excel for reporting and analysis.

---

## Condition Scale

| Value | Label          | Meaning                        |
|-------|----------------|--------------------------------|
| 0     | Not Assessed   | No assessment recorded         |
| 1     | 100% Functional| Fully operational              |
| 2     | >50% Functional| Majority of LEDs operational   |
| 3     | <50% Functional| Minority of LEDs operational   |
| 4     | Flickering     | Unstable / intermittent        |
| 5     | Non-Functional | Completely inoperative         |
