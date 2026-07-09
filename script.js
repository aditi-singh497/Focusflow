/* ==========================================================================
   FocusFlow — script.js
   ========================================================================== */

const STORAGE_KEYS = {
  DUMP: "focusflow_dump",
  FOCUS: "focusflow_focus",
  REFLECTIONS: "focusflow_reflections",
  REFLECT_DRAFT: "focusflow_reflect_draft",
};

/* ==========================================================================
   1. VIEW NAVIGATION
   Every screen is a `.view` element with a unique id (hero, dump, focus,
   reflect, timer). Exactly one carries `.is-active` at a time. This is the
   ONLY thing that controls what's visible — no scrolling, no reloads.
   ========================================================================== */

const views = document.querySelectorAll(".view");

function showView(targetId) {
  const target = document.getElementById(targetId);
  if (!target) {
    console.warn(`FocusFlow: no view found with id "${targetId}"`);
    return;
  }

  views.forEach((view) => {
    view.classList.toggle("is-active", view.id === targetId);
  });

  document.querySelectorAll(".day-nav__item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.target === targetId);
  });
}

// Wire up every button that should trigger navigation: the four nav pills,
// and the hero's "Start your morning" button. Both carry data-target.
document.querySelectorAll(".day-nav__item[data-target], .hero-actions [data-target]")
  .forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      showView(trigger.dataset.target);
    });
  });

const goHomeBtn = document.getElementById("goHome");
if (goHomeBtn) {
  goHomeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showView("hero");
  });
}

/* ==========================================================================
   2. BRAIN DUMP
   ========================================================================== */

const dumpInput = document.getElementById("dumpInput");
const dumpStatus = document.getElementById("dumpStatus");
const clearDumpBtn = document.getElementById("clearDump");

let dumpSaveTimeout = null;
let statusTimeout = null;

function flashStatus(el, message) {
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => el.classList.remove("is-visible"), 1800);
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
  if (!confirm("Clear today's brain dump? This can't be undone.")) return;
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
   4. AI ASSIST
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
  renderReflectionLog(raw ? JSON.parse(raw) : []);
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

  entries.slice().reverse().forEach((entry) => {
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
   Two UI modes: #setupMode (choose a rhythm) and #runningMode (immersive
   countdown). Starting the timer crossfades into running mode; resetting
   or finishing all rounds crossfades back to setup.
   ========================================================================== */

const setupMode = document.getElementById("setupMode");
const runningMode = document.getElementById("runningMode");
const timerCard = document.getElementById("timerCard");
const beginTimerBtn = document.getElementById("beginTimerBtn");

const presetButtons = document.querySelectorAll(".preset-btn");
const customPanel = document.getElementById("timerCustom");
const customFocusInput = document.getElementById("customFocus");
const customBreakInput = document.getElementById("customBreak");
const customRoundsInput = document.getElementById("customRounds");
const applyCustomBtn = document.getElementById("applyCustom");

const roundInfoEl = document.getElementById("roundInfo");
const bigTimerEl = document.getElementById("bigTimer");
const ringProgress = document.getElementById("timerRingProgress");
const timerStartBtn = document.getElementById("timerStart");
const timerPauseBtn = document.getElementById("timerPause");
const timerResetBtn = document.getElementById("timerReset");
// --- Session modals --------------------------------------------------------
const sessionEndModal = document.getElementById("sessionEndModal");
const startBreakBtn = document.getElementById("startBreakBtn");
const dismissSessionBtn = document.getElementById("dismissSessionBtn");

const finalCompletionModal = document.getElementById("finalCompletionModal");
const completedCountEl = document.getElementById("completedCount");
const writeReflectionBtn = document.getElementById("writeReflectionBtn");
const doneModalBtn = document.getElementById("doneModalBtn");

let activeModal = null;
let lastFocusedBeforeModal = null;

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")
  ).filter((el) => !el.disabled);
}

function showModal(modalEl) {
  lastFocusedBeforeModal = document.activeElement;
  activeModal = modalEl;
  modalEl.classList.add("is-open");

  // Move focus inside the modal for keyboard/screen-reader users.
  const focusables = getFocusableElements(modalEl);
  if (focusables.length) focusables[0].focus();

  document.addEventListener("keydown", handleModalKeydown);
}

function hideModal(modalEl) {
  modalEl.classList.remove("is-open");
  document.removeEventListener("keydown", handleModalKeydown);
  activeModal = null;

  // Return focus to whatever triggered the modal.
  if (lastFocusedBeforeModal) lastFocusedBeforeModal.focus();
}

// Escape closes the open modal; Tab is trapped inside it.
function handleModalKeydown(e) {
  if (!activeModal) return;

  if (e.key === "Escape") {
    e.preventDefault();
    hideModal(activeModal);
    return;
  }

  if (e.key === "Tab") {
    const focusables = getFocusableElements(activeModal);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

// --- Wiring modal buttons to existing timer logic --------------------------

startBreakBtn.addEventListener("click", () => {
  hideModal(sessionEndModal);
  startTimer(); // timerState.phase/remainingSeconds were already set to "break" below
});

dismissSessionBtn.addEventListener("click", () => {
  hideModal(sessionEndModal);
  // Timer stays paused in break phase — the person can hit Start whenever ready.
});

doneModalBtn.addEventListener("click", () => {
  hideModal(finalCompletionModal);
  exitRunningMode();
});

writeReflectionBtn.addEventListener("click", () => {
  hideModal(finalCompletionModal);
  exitRunningMode();
  showView("reflect"); // reuses your existing nav function — same smooth fade transition
});

// --- What happens when a focus segment hits 00:00 --------------------------
function handleFocusSessionComplete() {
  stopTimer(); // pause the countdown while the modal is open
  playBreakStartChime();

  if (timerState.currentRound >= timerState.totalRounds) {
    completedCountEl.textContent = timerState.totalRounds;
    showModal(finalCompletionModal);
  } else {
    // Pre-load the break so "Start Break" can begin it immediately.
    timerState.phase = "break";
    timerState.remainingSeconds = timerState.breakMinutes * 60;
    renderTimer();
    showModal(sessionEndModal);
  }
}

// --- Progress ring setup ---------------------------------------------------
const RING_RADIUS = 100;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
ringProgress.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
ringProgress.style.strokeDashoffset = "0";

// --- Sound effects (Web Audio API — no external files, no libraries) ------
// ENABLE_TICK_SOUND is a simple in-code toggle: flip to false to silence
// the subtle per-second tick while keeping the phase-change chimes.
const ENABLE_TICK_SOUND = true;

let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// A very short, quiet blip — deliberately subtle so it never feels harsh.
function playTick() {
  if (!ENABLE_TICK_SOUND) return;
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 1000;
  gain.gain.setValueAtTime(0.02, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}

// A soft, single-note chime for phase transitions. Different pitches for
// "settling into a break" vs. "returning to focus" so they're distinguishable
// without being sharp. Each chime is a one-shot, so they never overlap.
function playChime(frequency) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 1.2);
}

function playBreakStartChime() { playChime(392.0); }  // G4 — calmer, lower
function playFocusStartChime() { playChime(523.25); } // C5 — slightly brighter

// --- Mode switching ---------------------------------------------------------
function enterRunningMode() {
  setupMode.classList.add("is-hidden");
  runningMode.classList.remove("is-hidden");
}

function exitRunningMode() {
  runningMode.classList.add("is-hidden");
  setupMode.classList.remove("is-hidden");
}

// --- Timer state --------------------------------------------------------
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

function currentPhaseTotalSeconds() {
  return (timerState.phase === "focus" ? timerState.focusMinutes : timerState.breakMinutes) * 60;
}

function renderTimer() {
  const phaseLabel = timerState.phase === "focus" ? "Focus" : "Break";
  roundInfoEl.textContent = `${phaseLabel} — Round ${timerState.currentRound} of ${timerState.totalRounds}`;
  bigTimerEl.textContent = formatClock(timerState.remainingSeconds);

  const total = currentPhaseTotalSeconds();
  const fraction = total > 0 ? timerState.remainingSeconds / total : 0;
  ringProgress.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - fraction)}`;

  // Break-mode palette — set directly so it works regardless of external CSS.
  const isBreak = timerState.phase === "break";
  timerCard.classList.toggle("is-break", isBreak);
  bigTimerEl.style.color = isBreak ? "#5F6E57" : "#2B2A26";
  ringProgress.style.stroke = isBreak ? "#7C8B73" : "#2B2A26";
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
    playTick();
    renderTimer();
    return;
  }

  if (timerState.phase === "focus") {
    // Focus stretch just ended — move into a break.
    timerState.phase = "break";
    timerState.remainingSeconds = timerState.breakMinutes * 60;
    playBreakStartChime();
  } else if (timerState.currentRound < timerState.totalRounds) {
    // Break just ended and more rounds remain — start the next focus round.
    timerState.currentRound += 1;
    timerState.phase = "focus";
    timerState.remainingSeconds = timerState.focusMinutes * 60;
    playFocusStartChime();
  } else {
    // All rounds complete — stop and return to setup.
    stopTimer();
    roundInfoEl.textContent = "Session complete";
    bigTimerEl.textContent = "00:00";
    exitRunningMode();
    return;
  }

  renderTimer();
}

function startTimer() {
  if (timerState.isRunning) return;
  getAudioContext(); // ensure the audio context is created/resumed on a user gesture
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
  exitRunningMode();
}

// --- Wiring ---------------------------------------------------------------
beginTimerBtn.addEventListener("click", () => {
  enterRunningMode();
  startTimer();
});

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
    configureTimer(
      Number(button.dataset.focus),
      Number(button.dataset.break),
      Number(button.dataset.rounds)
    );
  });
});

applyCustomBtn.addEventListener("click", () => {
  configureTimer(
    Math.max(1, Number(customFocusInput.value) || 25),
    Math.max(1, Number(customBreakInput.value) || 5),
    Math.max(1, Number(customRoundsInput.value) || 1)
  );
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
