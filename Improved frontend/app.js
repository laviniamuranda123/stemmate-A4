const SESSION_ID = "water-filter-session";
const sessionData = {
  id: SESSION_ID,
  title: "Build a simple water filter",
  duration: "45 minutes",
  description: "Guide learners through clean water, filtration and a hands-on team experiment.",
  steps: [
    { title: "Explore the challenge", duration: "8 min", detail: "Ask: How can we make muddy water clearer using everyday materials?" },
    { title: "Build the filter", duration: "25 min", detail: "Layer cloth, gravel and sand in a cut bottle. Pour slowly and observe." },
    { title: "Discuss observations", duration: "12 min", detail: "Compare the water before and after filtering. Discuss what changed." }
  ],
  savedAt: null,
  syncStatus: "local-only"
};

const screens = ["homeScreen", "guideScreen", "savedScreen"];
const $ = (id) => document.getElementById(id);
let db;

function showScreen(screenId) {
  screens.forEach(id => $(id).classList.toggle("hidden", id !== screenId));
  const activeNav = {homeScreen:"navHome", guideScreen:"navGuide", savedScreen:"navSaved"}[screenId];
  ["navHome", "navGuide", "navSaved"].forEach(id => {
    const active = id === activeNav;
    $(id).classList.toggle("active", active);
    if (active) $(id).setAttribute("aria-current", "page");
    else $(id).removeAttribute("aria-current");
  });
  if (screenId === "savedScreen") renderSavedSessions();
  window.scrollTo({top: 0, behavior: "smooth"});
}

function announce(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("This browser does not support local storage for sessions."));
    const request = indexedDB.open("STEMMateDatabase", 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("sessions")) {
        database.createObjectStore("sessions", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveSession(session) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("sessions", "readwrite");
    transaction.objectStore("sessions").put(session);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function getAllSessions() {
  return new Promise((resolve, reject) => {
    const request = db.transaction("sessions", "readonly").objectStore("sessions").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function renderSavedSessions() {
  const list = $("savedList");
  const sessions = await getAllSessions();
  list.innerHTML = "";
  if (!sessions.length) {
    list.innerHTML = '<article class="saved-card"><h3>No saved sessions yet</h3><p>Open the session guide and choose “Save for Offline Use”.</p></article>';
    return;
  }
  sessions.forEach(session => {
    const card = document.createElement("article");
    card.className = "saved-card";
    const title = document.createElement("h3");
    title.textContent = session.title;
    const details = document.createElement("p");
    details.textContent = `${session.duration} · Saved on this device`;
    const button = document.createElement("button");
    button.textContent = "Open session";
    button.addEventListener("click", () => showScreen("guideScreen"));
    card.append(title, details, button);
    list.appendChild(card);
  });
}

async function updateSavedIndicators() {
  const sessions = await getAllSessions();
  $("savedCount").textContent = sessions.length
    ? `${sessions.length} session${sessions.length === 1 ? "" : "s"} saved on this device.`
    : "No sessions saved on this device yet.";
  $("homeSaveStatus").textContent = sessions.length
    ? "✓ " + sessions.length + " session saved locally"
    : "✓ Materials ready to explore";
}

async function saveForOffline() {
  const button = $("saveOffline");
  const message = $("saveMessage");
  button.disabled = true;
  button.textContent = "Saving…";
  message.textContent = "Saving this session on your device. Please wait.";
  try {
    const copy = {...sessionData, savedAt: new Date().toISOString(), syncStatus: "local-only"};
    await saveSession(copy);
    message.textContent = "✓ Saved locally on this device. You can reopen this session without an internet connection.";
    button.textContent = "Saved on this device";
    announce("Saved on this device. It is available offline in this browser.");
    await updateSavedIndicators();
  } catch (error) {
    message.textContent = "We couldn't save this session. Please check available device storage and try again.";
    button.disabled = false;
    button.textContent = "Try saving again";
    announce("Save failed. Please try again.");
    console.error(error);
  }
}

function updateConnection() {
  const online = navigator.onLine;
  const status = $("connectionStatus");
  status.textContent = online ? "● Online" : "● Offline";
  status.classList.toggle("offline", !online);
  if (!online) {
    if ($("saveOffline").textContent !== "Saved on this device") {
      $("saveMessage").textContent = "You're offline. You can still save this session on this device.";
    }
  } else if ($("saveOffline").textContent !== "Saved on this device") {
    $("saveMessage").textContent = "Save this guide on your device so you can open it without internet access.";
  }
}

$("openGuide").addEventListener("click", () => showScreen("guideScreen"));
$("backHome").addEventListener("click", () => showScreen("homeScreen"));
$("backFromSaved").addEventListener("click", () => showScreen("homeScreen"));
$("viewSaved").addEventListener("click", () => showScreen("savedScreen"));
$("navHome").addEventListener("click", () => showScreen("homeScreen"));
$("navGuide").addEventListener("click", () => showScreen("guideScreen"));
$("navSaved").addEventListener("click", () => showScreen("savedScreen"));
$("saveOffline").addEventListener("click", saveForOffline);
$("startSession").addEventListener("click", () => {
  announce("Session started. Begin with the first activity step.");
  $("firstSessionStep").focus();
});

window.addEventListener("online", updateConnection);
window.addEventListener("offline", updateConnection);

(async function initialise() {
  try {
    db = await openDatabase();
    await updateSavedIndicators();
  } catch (error) {
    $("saveMessage").textContent = "Local session storage is unavailable in this browser. Try a modern browser using localhost or HTTPS.";
    $("saveOffline").disabled = true;
    console.error(error);
  }
  updateConnection();
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("./sw.js").catch(error => console.warn("Service worker registration failed:", error));
  }
})();
