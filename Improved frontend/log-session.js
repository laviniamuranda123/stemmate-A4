const DRAFT_KEY = "stemmate_drafts";
const FAC_KEY = "stemmate_facilitators";
const form = document.getElementById("sessionForm");
const msg = document.getElementById("msg");
const pendingEl = document.getElementById("pending");
const connEl = document.getElementById("conn");

function today() { return new Date().toLocaleDateString("en-CA"); }
document.getElementById("date").value = today();

function getDrafts() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || []; } catch (e) { return []; }
}
function setDrafts(list) { localStorage.setItem(DRAFT_KEY, JSON.stringify(list)); }
function newId() {
  return (crypto.randomUUID && crypto.randomUUID()) || "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}
function show(text, cls) { msg.textContent = text; msg.className = cls || ""; }

function showPending() {
  const n = getDrafts().length;
  pendingEl.textContent = n ? n + " session(s) saved on this device, waiting to send." : "";
}
function showConn() {
  connEl.textContent = navigator.onLine ? "Online" : "Offline: sessions will be saved on this device.";
}

async function loadFacilitators() {
  const sel = document.getElementById("facilitator");
  let list = [];
  try {
    const r = await fetch("/api/facilitators");
    list = await r.json();
    localStorage.setItem(FAC_KEY, JSON.stringify(list));
  } catch (e) {
    try { list = JSON.parse(localStorage.getItem(FAC_KEY)) || []; } catch (e2) { list = []; }
  }
  sel.innerHTML = "";
  list.forEach(function (f) {
    const o = document.createElement("option");
    o.value = f.code; o.textContent = f.display_name;
    sel.appendChild(o);
  });
}

async function send(payload) {
  const r = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  let body = {};
  try { body = await r.json(); } catch (e) { body = {}; }
  return { status: r.status, body: body };
}

async function syncDrafts() {
  const drafts = getDrafts();
  if (!drafts.length) return;
  const keep = [];
  for (const d of drafts) {
    try {
      const res = await send(d);
      if (res.status !== 200 && res.status !== 201) keep.push(d);
    } catch (e) { keep.push(d); }
  }
  setDrafts(keep);
  showPending();
  if (keep.length < drafts.length) show("Saved drafts were sent to the server.", "ok");
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const payload = {
    client_id: newId(),
    facilitator_code: document.getElementById("facilitator").value,
    session_date: document.getElementById("date").value,
    topic: document.getElementById("topic").value.trim(),
    attendee_count: document.getElementById("count").value,
    notes: document.getElementById("notes").value.trim(),
    created_offline: 0
  };
  try {
    const res = await send(payload);
    if (res.status === 201 || res.status === 200) {
      show("Session saved.", "ok");
      form.reset();
      document.getElementById("date").value = today();
    } else if (res.status === 400) {
      show("Please fix: " + Object.values(res.body.errors || {}).join(" "), "err");
    } else {
      throw new Error("server");
    }
  } catch (err) {
    payload.created_offline = 1;
    const drafts = getDrafts();
    drafts.push(payload);
    setDrafts(drafts);
    show("No connection. Session saved on this device and will be sent when you are online.", "ok");
    form.reset();
    document.getElementById("date").value = today();
  }
  showPending();
});

window.addEventListener("online", function () { showConn(); syncDrafts(); });
window.addEventListener("offline", showConn);

showConn();
showPending();
loadFacilitators().then(syncDrafts);