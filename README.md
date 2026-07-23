# Envelope Budget — build an APK from your phone

This project is ready to go. You don't need Android Studio — GitHub's
servers will build the APK for you. Everything below can be done from
the GitHub app or github.com in your phone's browser.

## 1. Create the repo

- Open the GitHub app (or github.com) → **+** → **New repository**
- Name it anything (e.g. `budget-envelopes`) → set to **Public or Private**, either is fine
- Create it **without** a README (you already have one) — or with one, doesn't matter

## 2. Upload these files

On github.com (works in mobile browser), open your new repo and use
**Add file → Upload files**. Upload this whole folder, keeping the
folder structure intact — that part matters, especially the
`.github/workflows/build-apk.yml` file staying inside `.github/workflows/`.

If the mobile upload UI won't let you upload folders directly:
- Upload files one at a time into the right path, using **Add file → Create new file**
  and typing the full path (e.g. `src/App.jsx`, `.github/workflows/build-apk.yml`)
  — GitHub auto-creates the folders for you as you type the path.

Files to upload (12 total):
```
package.json
vite.config.js
index.html
tailwind.config.js
postcss.config.js
capacitor.config.json
src/main.jsx
src/index.css
src/App.jsx
.github/workflows/build-apk.yml
```

## 3. Run the build

- Go to the **Actions** tab of your repo
- You should see a workflow called **Build APK**
- Tap it → **Run workflow** → **Run workflow** (green button)
- It takes about 3-5 minutes. Refresh the page to check progress.

## 4. Download the APK

- Once the run shows a green checkmark, open it
- Scroll to the bottom **Artifacts** section
- Tap **app-debug-apk** to download a zip containing `app-debug.apk`

## 5. Install it on your phone

- Unzip and open `app-debug.apk` (your phone's file manager can unzip it,
  or just tap the download if your browser auto-unzips)
- Android will ask you to allow installing from this source the first time — allow it
- Install and open — your budgeting app is now a real app icon on your phone

## Notes

- This builds a **debug** APK — perfectly fine to install and use yourself,
  just not meant for the Play Store (that needs a signed release build,
  a separate step if you ever want to publish it).
- Data is saved with `localStorage` inside the app, so it persists between
  opens, but it's local to that one installed app — it won't sync across devices.
- To make changes later: edit `src/App.jsx` in the repo (GitHub's web
  editor works fine for small edits), commit, and re-run the workflow
  from the Actions tab to get a fresh APK.
