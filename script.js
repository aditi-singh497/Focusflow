/* ==========================================================================
   FocusFlow — script.js
   Vanilla JS, no frameworks. Everything is stored in localStorage so the
   app works fully offline and requires no backend.
   ========================================================================== */

// ---------------------------------------------------------------------------
// STORAGE KEYS
// Centralising the keys avoids typos scattered through the file and makes
// it obvious what state the app persists.
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  DUMP: "focusflow_dump",
  FOCUS: "focusflow_focus",
  REFLECTIONS: "focusflow_reflections",
};

// ---------------------------------------------------------------------------
// ELEMENT REFERENCES
// ---------------------------------------------------------------------------
const dumpInput = document.getElementById("dumpInput");
const dumpStatus = document.getElementById("dumpStatus");
const clearDumpBtn = document.getElementById("clearDump");

const focusSelect = document.getElementById("focusSelect");
const setFocusBtn = document.getElementById("setFocus");
const focusItem = document.getElementById("focusItem");

const aiAssistBtn = document.getElementById("aiAssistBtn");
const aiResponse = document.getElementById("aiResponse");

const reflectInput = document.getElementById("reflectInput");
const reflectionPrompt = document.getElementById("reflectionPrompt");
const aiPromptBtn = document.getElementById("aiPromptBtn");
const saveReflectionBtn = document.getElementById("saveReflection");
const reflectionLog = document.getElementById("reflectionLog");

const dayNavButtons = document.querySelectorAll(".day-nav__item");

// ===========================================================================
// SECTION 1 — BRAIN DUMP
// Autosaves the textarea to localStorage on every keystroke (debounced),
// so the person never has to think about "saving".
// ===========================================================================

let saveTimeout = null;

function loadDump() {
  const saved = localStorage.getItem(STORAGE_KEYS.DUMP);
  if (saved) dumpInput.value = saved;
}

function saveDump() {
  localStorage.setItem(STORAGE_KEYS.DUMP, dumpInput.value);
  dumpStatus.textContent = "Saved automatically";
  populateFocusOptions(); // keep Focus Mode's dropdown in sync
}

dumpInput.addEventListener("input", () => {
  dumpStatus.textContent = "Saving…";
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveDump, 500); // debounce so we don't hammer localStorage
});

clearDumpBtn.addEventListener("click", () => {
  const confirmed = confirm("Clear today's brain dump? This can't be undone.");
  if (!confirmed) return;
  dumpInput.value = "";
  saveDump();
});

// ===========================================================================
// SECTION 2 — FOCUS MODE
// Reads non-empty lines from the brain dump and lets the person pick exactly
// one of them to display, large and alone, as their current focus.
// ===========================================================================

function getDumpLines() {
  return dumpInput.value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function populateFocusOptions() {
  const lines = getDumpLines();
  const previousValue = focusSelect.value;

  // Reset to just the placeholder option, then rebuild.
  focusSelect.innerHTML = '<option value="">Choose from today\'s brain dump…</option>';

  lines.forEach((line) => {
    const option = document.createElement("option");
    option.value = line;
    option.textContent = line.length > 80 ? line.slice(0, 77) + "…" : line;
    focusSelect.appendChild(option);
  });

  // Preserve the selection if it still exists after the dump changed.
  if (lines.includes(previousValue)) {
    focusSelect.value = previousValue;
  }
}

function loadFocus() {
  const saved = localStorage.getItem(STORAGE_KEYS.FOCUS);
  if (saved) focusItem.textContent = saved;
}

setFocusBtn.addEventListener("click", () => {
  const chosen = focusSelect.value;
  if (!chosen) {
    focusItem.textContent = "Pick a line above whenever you're ready.";
    return;
  }
  focusItem.textContent = chosen;
  localStorage.setItem(STORAGE_KEYS.FOCUS, chosen);
  aiResponse.hidden = true; // hide any stale suggestion tied to the old focus
});

// ===========================================================================
// SECTION 3 — AI ASSIST ("Help me focus")
// This calls getAISuggestion(), a placeholder function documented below.
// Swap its internals for a real API call whenever a backend is ready —
// nothing else in the app needs to change.
// ===========================================================================

aiAssistBtn.addEventListener("click", async () => {
  const currentFocus = localStorage.getItem(STORAGE_KEYS.FOCUS);
  aiAssistBtn.disabled = true;
  aiAssistBtn.textContent = "Thinking gently…";

  const suggestion = await getAISuggestion(currentFocus);

  aiResponse.textContent = suggestion;
  aiResponse.hidden = false;
  aiAssistBtn.disabled = false;
  aiAssistBtn.textContent = "Help me focus";
});

/**
 * getAISuggestion(focusText)
 * -------------------------------------------------------------------------
 * PLACEHOLDER AI LOGIC.
 * Returns a short, calm suggestion related to the person's current focus
 * (or a general one if nothing is set yet). It is written as an async
 * function and returns a Promise so it can be replaced with a real
 * `fetch()` call to an AI API without changing any calling code.
 *
 * To wire up a real model:
 *   1. Replace the body of this function with a fetch() to your API
 *      (e.g. POST /v1/messages with the focus text as context).
 *   2. Keep the function signature `async (focusText) => string` the same.
 *   3. Everything else — the button, the loading state, the display —
 *      keeps working unmodified.
 * -------------------------------------------------------------------------
 */
async function getAISuggestion(focusText) {
  const genericSuggestions = [
    "Start with the smallest possible version of this. You can expand later.",
    "You don't need to finish it — you just need to begin it.",
    "Give this ten quiet minutes. Reassess after that.",
    "Write down what 'done enough' looks like before you start.",
    "It's alright if this takes longer than you'd like. Begin anyway.",
  ];

  const focusedSuggestions = [
    `Break "${focusText}" into one small first step, and do only that.`,
    `Set a timer for ten minutes on "${focusText}". Stop when it rings if you want to.`,
    `Ask yourself what a calm, unhurried version of "${focusText}" looks like.`,
    `"${focusText}" doesn't need to be perfect today — just started.`,
  ];

  const pool = focusText ? focusedSuggestions : genericSuggestions;

  // Simulated latency so the UI's loading state has something real to show.
  await new Promise((resolve) => setTimeout(resolve, 600));

  return pool[Math.floor(Math.random() * pool.length)];
}

// ===========================================================================
// SECTION 4 — END-OF-DAY REFLECTION
// A single evening prompt, saved as a dated entry in a small local history.
// ===========================================================================

const REFLECTION_PROMPTS = [
  "What's one thing that felt true today?",
  "What went better than expected?",
  "What can you set down before tomorrow?",
  "Where did you show yourself patience today?",
  "What's one thing worth remembering about today?",
];

function loadReflections() {
  const raw = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
  const entries = raw ? JSON.parse(raw) : [];
  renderReflectionLog(entries);
}

function renderReflectionLog(entries) {
  reflectionLog.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "log-empty";
    empty.textContent = "Nothing saved yet. Your first reflection will appear here.";
    reflectionLog.appendChild(empty);
    return;
  }

  // Most recent first.
  entries
    .slice()
    .reverse()
    .forEach((entry) => {
      const li = document.createElement("li");
      const date = document.createElement("span");
      date.className = "log-date";
      date.textContent = `${entry.date} — ${entry.prompt}`;
      const text = document.createElement("p");
      text.textContent = entry.text;
      text.style.margin = "0";
      li.appendChild(date);
      li.appendChild(text);
      reflectionLog.appendChild(li);
    });
}

saveReflectionBtn.addEventListener("click", () => {
  const text = reflectInput.value.trim();
  if (!text) return;

  const raw = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
  const entries = raw ? JSON.parse(raw) : [];

  entries.push({
    date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    prompt: reflectionPrompt.textContent,
    text,
  });

  localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(entries));
  reflectInput.value = "";
  renderReflectionLog(entries);
});

aiPromptBtn.addEventListener("click", () => {
  // Placeholder AI logic again — swap for a real API call the same way
  // as getAISuggestion() above if you want prompts generated dynamically.
  const current = reflectionPrompt.textContent;
  let next = current;
  while (next === current) {
    next = REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)];
  }
  reflectionPrompt.textContent = next;
});

// ===========================================================================
// SECTION 5 — DAY NAV (Morning / Midday / Evening)
// Simple scroll-to-section navigation with an active-state indicator.
// ===========================================================================

dayNavButtons.forEach((button) => {
  button.addEventListener("click", () => {
    dayNavButtons.forEach((b) => b.classList.remove("is-active"));
    button.classList.add("is-active");
    const target = document.getElementById(button.dataset.target);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// ===========================================================================
// INIT
// ===========================================================================

function init() {
  loadDump();
  populateFocusOptions();
  loadFocus();
  loadReflections();
}

init();
