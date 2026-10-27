# Deploy AutoLog

## Vercel

Import `bojan09/auto_log`, use `master` as the production branch, and keep the root directory at the repository root. The checked-in `vercel.json` sets Framework to Other (`null`), Build Command to `npm run build` and Output Directory to `dist`. No environment variables or backend are required. The service worker is served with revalidation enabled.

The Vercel build must use `dist`, not the default `public` directory. The configuration fixes `STATIC_BUILD_NO_OUT_DIR` after an otherwise successful build. A push to the connected production branch should trigger a new deployment; otherwise redeploy the latest commit from the Vercel dashboard. An npm `cache-dir` deprecation warning is unrelated to the missing output-directory error.

## GitHub Pages (free static hosting)

1. In `bojan09/auto_log`, open Settings → Pages and choose **GitHub Actions** as the source. Use the existing `master` branch; no publishing branch is needed.
2. Open Actions → **Publish AutoLog to GitHub Pages** → Run workflow, selecting `master`.
3. The manual workflow installs locked development dependencies, runs syntax/unit checks, builds the runtime directory, uploads it and deploys to the `github-pages` environment. Browser checks are run in the cloud development environment; this workflow does not claim to run them again.
4. Open the URL produced by the deployment job (normally `https://bojan09.github.io/auto_log/`). The trailing slash and relative asset paths matter. The packaged app's matching subpath was verified offline on a local test server.

The workflow is manual; pushes do not automatically deploy. No deployment was started during Phase 6. Repository visibility/account restrictions may affect free Pages availability. A custom domain is optional.

## Other static HTTPS hosts

Run `npm ci && npm run check && npm test && npm run build`, then upload the **contents of `dist/`** to the site root or project directory of a static HTTPS host. Preserve directories and MIME types (`.js` JavaScript, `.css` CSS, `.webmanifest` JSON/manifest, `.webp` image/webp). There are no environment variables, runtime secrets, API server or database service to configure. No SPA rewrite is necessary; navigation occurs inside the root page.

Serve `sw.js` with revalidation/no-cache when the host permits it. It must stay in the app directory so its scope includes the app. Avoid immutable caching for HTML, the worker and unversioned source assets. Deploy the complete directory atomically where supported; installation fails safely if a required asset is missing.

## After publishing

Open the HTTPS URL online once and wait for caching. Add a test vehicle, reload, switch the browser offline and reload again. Export and restore a test backup in a separate browser profile before using important data. On supported browsers, install through the browser's install menu or the app's offered install control. Actual OS installation remains a manual device check.

An existing open tab keeps its installed worker until old tabs close. On an update notice, save/close forms, close every AutoLog tab and standalone window, then reopen online. The new worker activates and removes obsolete app caches without clearing IndexedDB. Never clear site data to perform a normal update.

Browser data belongs to the origin. Changing hostname, protocol, browser or profile requires JSON export/import to transfer records. Back up before changing deployment location.

## Troubleshooting

- **Old design after deployment:** check Tools → Settings → Check for app updates while online, then close all tabs/windows and reopen. Verify all files from the same build were deployed.
- **Offline unavailable:** check HTTPS/localhost, correct project path and worker scope, asset 404s/MIME types and available storage. Complete an online load first. Private browsing may restrict storage or persistence.
- **Storage unavailable/full:** allow site storage, close other tabs, save external backups and download documents before removing unneeded files. AutoLog shows failed writes instead of claiming success. Clearing site data permanently removes local records.
- **Missing data on a new URL:** restore the backup at the new origin. The app has no server account that can retrieve records.
- **PDF preview blank:** use Download. Native PDF embedding varies by browser and sandbox support; images and report print-to-PDF have separate paths.
- **Restore rejected:** use an original AutoLog version-1 JSON backup under 50 MiB with embedded files under 5 MiB. Unsupported versions, malformed fields, broken vehicle/document links and forged document types are rejected before replacement. Keep the original file; do not edit financial values just to pass validation.
- **Calendar reminders absent:** only schedules/checklists with actual dates are exported. Import the ICS into a calendar application. Distance-only schedules do not become dated events automatically.
