function saveDump() {
  const dump = document.getElementById("brainDump").value;
  localStorage.setItem("brainDump", dump);
  document.getElementById("focusTask").innerText =
    dump.split("\n")[0] || "Take a deep breath.";
}

function saveReflection() {
  const reflection = document.getElementById("reflection").value;
  localStorage.setItem("reflection", reflection);
  alert("Saved. You did enough today 🤍");
}
