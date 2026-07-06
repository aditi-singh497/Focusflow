/* ==========================================================================
   FocusFlow — script.js
   Vanilla JS, no frameworks. Everything is stored in localStorage so the
   app works fully offline and requires no backend.

   Sections of this file:
     1. View navigation (button-driven, no scroll, no reload)
     2. Brain Dump (autosave + status)
     3. Focus Mode
     4. AI Assist placeholder
     5. End-of-Day Reflection (autosave draft + saved log)
     6. Focus Timer (Pomodoro-style)
     7. Init
   ========================================================================== */

// ---------------------------------------------------------------------------
// STORAGE KEYS
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  DUMP: "focusflow_dump",
  FOCUS: "focusflow_focus",
  REFLECTIONS: "focusflow_reflections",
  REFLECT_DRAFT: "focusflow_reflect_draft",
};

/* ==========================================================================
   1. VIEW NAVIGATION
   ========================================================================== */

const views = document.querySelectorAll(".view");
const navButtons = document.querySelectorAll(".day-nav__item");
const goHomeBtn = document.getElementById("goHome");

function showView(targetId) {
  views.forEach((view) => {
    view.classList.toggle("is-active", view.id === targetId);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.target === targetId);
  });
}

document.querySelectorAll("[data-target]").forEach((trigger) => {
  if (trigger.classList.contains("preset-btn")) return;
  trigger.addEventListener("click", () => showView(trigger.dataset.target));
});

goHomeBtn.addEventListener("click", () => showView("hero"));

/* ==========================================================================
   2. BRAIN DUMP
   ========================================================================== */

const dumpInput = document.getElementById("dumpInput");
const dumpStatus = document.getElementById("dumpStatus");
const clearDumpBtn = document.getElementById("clearDump");

let dumpSaveTimeout = null;
let dumpStatusTimeout = null;

function flashStatus(el, message) {
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(dumpStatusTimeout);
  dumpStatusTimeout = setTimeout(() => el.classList.remove("is-visible"), 1800);
}

function loadDump() {
  const saved = localStorage.getItem(STORAGE_KEYS.DUMP);
  if (saved) dumpInput.value = saved;
}

function saveDump() {
  localStorage.setItem(STORAGE_KEYS.DUMP, dumpInput.value);
  flashStatus(dumpStatus, "Saved locally");
  populateFocusOptions();
}

dumpInput.addEventListener("input", () => {
  clearTimeout(dumpSaveTimeout);
  dumpSaveTimeout = setTimeout(saveDump, 500);
});

clearDumpBtn.addEventListener("click", () => {
  const confirmed = confirm("Clear today's brain dump? This can't be undone.");
  if (!confirmed) return;
  dumpInput.value = "";
  saveDump();
});

/* ==========================================================================
   3. FOCUS MODE
   ========================================================================== */

const focusSelect = document.getElementById("focusSelect");
const setFocusBtn = document.getElementById("setFocus");
const focusItem = document.getElementById("focusItem");
const aiResponse = document.getElementById("aiResponse");

function getDumpLines() {
  return dumpInput.value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function populateFocusOptions() {
  const lines = getDumpLines();
  const previousValue = focusSelect.value;

  focusSelect.innerHTML = '<option value="">Choose from today\'s brain dump…</option>';

  lines.forEach((line) => {
    const option = document.createElement("option");
    option.value = line;
    option.textContent = line.length > 80 ? line.slice(0, 77) + "…" : line;
    focusSelect.appendChild(option);
  });

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
  aiResponse.hidden = true;
});

/* ==========================================================================
   4. AI ASSIST ("Help me focus")
   ========================================================================== */

const aiAssistBtn = document.getElementById("aiAssistBtn");

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
 * PLACEHOLDER AI LOGIC — replace the body with a fetch() call to a real
 * API later; the function signature (async, returns a string) stays the same.
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

  await new Promise((resolve) => setTimeout(resolve, 600));

  return pool[Math.floor(Math.random() * pool.length)];
}

/* ==========================================================================
   5. END-OF-DAY REFLECTION
   ========================================================================== */

const reflectInput = document.getElementById("reflectInput");
const reflectStatus = document.getElementById("reflectStatus");
const reflectionPrompt = document.getElementById("reflectionPrompt");
const aiPromptBtn = document.getElementById("aiPromptBtn");
const saveReflectionBtn = document.getElementById("saveReflection");
const reflectionLog = document.getElementById("reflectionLog");

const REFLECTION_PROMPTS = [
  "What's one thing that felt true today?",
  "What went better than expected?",
  "What can you set down before tomorrow?",
  "Where did you show yourself patience today?",
  "What's one thing worth remembering about today?",
];

let reflectSaveTimeout = null;

function loadReflectDraft() {
  const saved = localStorage.getItem(STORAGE_KEYS.REFLECT_DRAFT);
  if (saved) reflectInput.value = saved;
}

reflectInput.addEventListener("input", () => {
  clearTimeout(reflectSaveTimeout);
  reflectSaveTimeout = setTimeout(() => {
    localStorage.setItem(STORAGE_KEYS.REFLECT_DRAFT, reflectInput.value);
    flashStatus(reflectStatus, "Saved locally");
  }, 500);
});

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
  renderReflectionLog(entries);
});

aiPromptBtn.addEventListener("click", () => {
  const current = reflectionPrompt.textContent;
  let next = current;
  while (next === current) {
    next = REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)];
  }
  reflectionPrompt.textContent = next;
});

/* ==========================================================================
   6. FOCUS TIMER (Pomodoro-style)
   ========================================================================== */

const presetButtons = document.querySelectorAll(".preset-btn");
const customPanel = document.getElementById("timerCustom");
const customFocusInput = document.getElementById("customFocus");
const customBreakInput = document.getElementById("customBreak");
const customRoundsInput = document.getElementById("customRounds");
const applyCustomBtn = document.getElementById("applyCustom");

const timerPhaseEl = document.getElementById("timerPhase");
const timerClockEl = document.getElementById("timerClock");
const timerRoundEl = document.getElementById("timerRound");
const timerStartBtn = document.getElementById("timerStart");
const timerPauseBtn = document.getElementById("timerPause");
const timerResetBtn = document.getElementById("timerReset");

const timerState = {
  focusMinutes: 25,
  breakMinutes: 10,
  totalRounds: 1,
  currentRound: 1,
  phase: "focus", // "focus" | "break"
  remainingSeconds: 25 * 60,
  intervalId: null,
  isRunning: false,
};

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function renderTimer() {
  timerPhaseEl.textContent = timerState.phase === "focus" ? "Focus" : "Break";
  timerClockEl.textContent = formatClock(timerState.remainingSeconds);
  timerRoundEl.textContent = `Round ${timerState.currentRound} of ${timerState.totalRounds}`;
}

function configureTimer(focusMinutes, breakMinutes, totalRounds) {
  stopTimer();
  timerState.focusMinutes = focusMinutes;
  timerState.breakMinutes = breakMinutes;
  timerState.totalRounds = totalRounds;
  timerState.currentRound = 1;
  timerState.phase = "focus";
  timerState.remainingSeconds = focusMinutes * 60;
  renderTimer();
}

function tick() {
  if (timerState.remainingSeconds > 0) {
    timerState.remainingSeconds -= 1;
    renderTimer();
    return;
  }

  if (timerState.phase === "focus") {
    timerState.phase = "break";
    timerState.remainingSeconds = timerState.breakMinutes * 60;
  } else if (timerState.currentRound < timerState.totalRounds) {
    timerState.currentRound += 1;
    timerState.phase = "focus";
    timerState.remainingSeconds = timerState.focusMinutes * 60;
  } else {
    stopTimer();
    timerPhaseEl.textContent = "Complete";
    timerClockEl.textContent = "00:00";
    return;
  }

  renderTimer();
}

function startTimer() {
  if (timerState.isRunning) return;
  timerState.isRunning = true;
  timerState.intervalId = setInterval(tick, 1000);
  timerStartBtn.disabled = true;
  timerPauseBtn.disabled = false;
}

function pauseTimer() {
  if (!timerState.isRunning) return;
  clearInterval(timerState.intervalId);
  timerState.isRunning = false;
  timerStartBtn.disabled = false;
  timerPauseBtn.disabled = true;
}

function stopTimer() {
  clearInterval(timerState.intervalId);
  timerState.isRunning = false;
  timerStartBtn.disabled = false;
  timerPauseBtn.disabled = true;
}

function resetTimer() {
  configureTimer(timerState.focusMinutes, timerState.breakMinutes, timerState.totalRounds);
}

timerStartBtn.addEventListener("click", startTimer);
timerPauseBtn.addEventListener("click", pauseTimer);
timerResetBtn.addEventListener("click", resetTimer);

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    presetButtons.forEach((b) => b.classList.remove("is-active"));
    button.classList.add("is-active");

    if (button.dataset.custom) {
      customPanel.hidden = false;
      return;
    }

    customPanel.hidden = true;
    const focusMinutes = Number(button.dataset.focus);
    const breakMinutes = Number(button.dataset.break);
    const rounds = Number(button.dataset.rounds);
    configureTimer(focusMinutes, breakMinutes, rounds);
  });
});

applyCustomBtn.addEventListener("click", () => {
  const focusMinutes = Math.max(1, Number(customFocusInput.value) || 25);
  const breakMinutes = Math.max(1, Number(customBreakInput.value) || 5);
  const rounds = Math.max(1, Number(customRoundsInput.value) || 1);
  configureTimer(focusMinutes, breakMinutes, rounds);
});

/* ==========================================================================
   7. INIT
   ========================================================================== */

function init() {
  loadDump();
  populateFocusOptions();
  loadFocus();
  loadReflectDraft();
  loadReflections();
  renderTimer();
  showView("hero");
}

init();
