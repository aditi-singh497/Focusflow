// =====================
// Elements
// =====================

const dumpInput = document.getElementById("dumpInput");
const saveDumpBtn = document.getElementById("saveDump");

const focusSelect = document.getElementById("focusSelect");
const setFocusBtn = document.getElementById("setFocus");
const focusDisplay = document.getElementById("focusDisplay");

const reflectionInput = document.getElementById("reflectionInput");
const saveReflectionBtn = document.getElementById("saveReflection");
const reflectionList = document.getElementById("reflectionList");

const panels = document.querySelectorAll(".panel");
const dayNavButtons = document.querySelectorAll(".day-btn");

// =====================
// Navigation
// =====================

function activatePanel(id) {
  panels.forEach(panel =>
    panel.classList.toggle("is-active", panel.id === id)
  );

  dayNavButtons.forEach(btn =>
    btn.classList.toggle("is-active", btn.dataset.target === id)
  );
}

dayNavButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    activatePanel(btn.dataset.target);
  });
});

// =====================
// Morning — Brain Dump
// =====================

function loadDump() {
  dumpInput.value = localStorage.getItem("dump") || "";
}

saveDumpBtn.addEventListener("click", () => {
  localStorage.setItem("dump", dumpInput.value);
});

// =====================
// Midday — Focus
// =====================

function populateFocusOptions() {
  const dump = localStorage.getItem("dump") || "";
  const lines = dump.split("\n").filter(l => l.trim() !== "");

  focusSelect.innerHTML = "";
  lines.forEach(line => {
    const opt = document.createElement("option");
    opt.textContent = line;
    focusSelect.appendChild(opt);
  });
}

function loadFocus() {
  const focus = localStorage.getItem("focus");
  if (focus) focusDisplay.textContent = `Today's focus: ${focus}`;
}

setFocusBtn.addEventListener("click", () => {
  const value = focusSelect.value;
  if (!value) return;
  localStorage.setItem("focus", value);
  focusDisplay.textContent = `Today's focus: ${value}`;
});

// =====================
// Evening — Reflection
// =====================

function loadReflections() {
  const data = JSON.parse(localStorage.getItem("reflections") || "[]");
  reflectionList.innerHTML = "";
  data.forEach(text => {
    const div = document.createElement("div");
    div.textContent = text;
    reflectionList.appendChild(div);
  });
}

saveReflectionBtn.addEventListener("click", () => {
  const text = reflectionInput.value.trim();
  if (!text) return;

  const data = JSON.parse(localStorage.getItem("reflections") || "[]");
  data.unshift(text);
  localStorage.setItem("reflections", JSON.stringify(data));

  reflectionInput.value = "";
  loadReflections();
});

// =====================
// Init
// =====================

function init() {
  loadDump();
  populateFocusOptions();
  loadFocus();
  loadReflections();
  activatePanel("dump");
}

init();
