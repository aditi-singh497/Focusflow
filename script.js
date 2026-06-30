function saveDump() {
  const dumpText = document.getElementById("brainDump").value;

  if (!dumpText.trim()) {
    document.getElementById("focusTask").innerText =
      "Take a slow breath. You can start when ready.";
    return;
  }

  // Split tasks by new lines and clean them
  const tasks = dumpText
    .split("\n")
    .map(task => task.trim())
    .filter(task => task.length > 0);

  // Save all tasks
  localStorage.setItem("tasks", JSON.stringify(tasks));

  // Pick the first task gently
  document.getElementById("focusTask").innerText =
    "For now, just do this:\n" + tasks[0];
}

function saveReflection() {
  const reflection = document.getElementById("reflection").value;
  localStorage.setItem("reflection", reflection);
  alert("Saved 🤍 You showed up today.");
}
const brainDumpInput = document.getElementById("brainDump");
const saveBrainDumpBtn = document.getElementById("saveBrainDump");
const focusTaskText = document.getElementById("focusTask");

saveBrainDumpBtn.addEventListener("click", () => {
  const text = brainDumpInput.value.trim();

  if (text === "") {
    alert("Write something first 🌱");
    return;
  }

  const firstTask = text.split("\n")[0];
  focusTaskText.textContent = firstTask;
});
