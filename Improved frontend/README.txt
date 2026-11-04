STEMMate Namibia - Offline Session Frontend Starter

WHAT THIS VERSION DOES
- Recreates the Home and Session Guide screens based on the supplied screenshots.
- Saves the sample water-filter session in IndexedDB on the current device.
- Lists saved sessions.
- Shows online/offline connection status.
- Includes a service worker to cache the app shell for offline reopening.
- Uses responsive mobile-first styling and visible keyboard focus.

IMPORTANT
- This is a frontend prototype. It does not yet connect to a server or synchronise data between devices.
- "Saved locally" means the session record is stored in this browser on this device.
- Do not label a session "Synchronised" until a real backend sync feature has been implemented and tested.
- Service workers require localhost or HTTPS. Do not test offline behavior by opening index.html directly as a file.

HOW TO RUN
Option 1 - VS Code:
1. Extract this ZIP.
2. Open the extracted folder in Visual Studio Code.
3. Install the "Live Server" extension if it is not already installed.
4. Right-click index.html and choose "Open with Live Server".
5. Open the local address shown by Live Server.

Option 2 - Python:
1. Open a terminal in the extracted folder.
2. Run: python -m http.server 8000
3. Open http://localhost:8000 in your browser.

HOW TO TEST SAVING
1. Open the Session Guide.
2. Click "Save for Offline Use".
3. Open Saved Sessions and check that the water-filter session appears.
4. Refresh the page and confirm it remains saved.
5. With the app loaded once, use browser DevTools > Network > Offline, then refresh and test that the app shell opens.
6. Reopen Saved Sessions and verify the saved session is still listed.

For a proper offline test, first load the app while online and allow the service worker to finish installing.

\nMEMBER 4 IMPLEMENTATION NOTES
- This is a frontend prototype with one sample activity.
- Saved records are stored in IndexedDB in this browser profile on this device.
- There is no account system, server database, or cross-device synchronisation.
- Start session moves keyboard focus to the first activity step.
- The service worker only uses the cached app document for failed page navigations; it does not return HTML in place of missing CSS or JavaScript.
- Keyboard checks are preliminary evidence, not a formal WCAG conformance audit.
- Automated tests and participant evaluation must be run and documented separately; do not report them as passed without evidence.
