function resetQuizProgress() {
  const prev = { total: progress.total, correct: progress.correct };
  appStorage.removeItem("quiz-progress");
  progress = { answered: {}, correct: 0, total: 0 };
  logActivity("reset", { kind: "progress", prev });
}

function setExamModeState(enabled) {
  const prev = examMode;
  examMode = enabled;
  const examBtn = document.getElementById("toggleExam");
  const examBtnMobile = document.getElementById("m-toggleExam");
  examBtn?.classList.toggle("active", examMode);
  examBtnMobile?.classList.toggle("active", examMode);
  document.body.classList.toggle("exam-on", examMode);
  if (prev !== enabled) {
    logActivity("mode", { name: "exam", state: enabled ? "on" : "off" });
  }
}

function setGodModeState(enabled) {
  const prev = godlikeMode;
  godlikeMode = enabled;
  document.body.classList.toggle("god-on", godlikeMode);
  if (prev !== enabled) {
    logActivity("mode", { name: "god", state: enabled ? "on" : "off" });
  }
}

function closeModeResetConfirm() {
  if (modeResetConfirmModal) modeResetConfirmModal.style.display = "none";
  document.getElementById("modeResetConfirmDialog")?.classList.remove("is-destructive");
  if (modeResetConfirmYes) modeResetConfirmYes.textContent = "Yes";
  if (modeResetConfirmNo)  modeResetConfirmNo.textContent  = "No";
  pendingModeResetAction = null;
  pendingModeResetCancel = null;
}

let pendingModeResetCancel = null;

function openModeResetConfirm(message, onConfirm, onCancel, opts = {}) {
  if (!modeResetConfirmModal || !modeResetConfirmText) {
    onConfirm?.();
    return;
  }
  modeResetConfirmText.textContent = message;
  pendingModeResetAction = onConfirm;
  pendingModeResetCancel = typeof onCancel === "function" ? onCancel : null;

  const dialog = document.getElementById("modeResetConfirmDialog");
  if (opts.destructive) {
    dialog?.classList.add("is-destructive");
    if (modeResetConfirmYes) modeResetConfirmYes.textContent = opts.confirmLabel || "Delete";
    if (modeResetConfirmNo)  modeResetConfirmNo.textContent  = opts.cancelLabel  || "Cancel";
  } else {
    dialog?.classList.remove("is-destructive");
    if (modeResetConfirmYes) modeResetConfirmYes.textContent = opts.confirmLabel || "Yes";
    if (modeResetConfirmNo)  modeResetConfirmNo.textContent  = opts.cancelLabel  || "No";
  }

  modeResetConfirmModal.style.display = "flex";
}

modeResetConfirmYes?.addEventListener("click", () => {
  const action = pendingModeResetAction;
  closeModeResetConfirm();
  action?.();
});

modeResetConfirmNo?.addEventListener("click", () => {
  const cancel = pendingModeResetCancel;
  closeModeResetConfirm();
  cancel?.();
});

["mouseenter", "pointerdown", "touchstart", "click"].forEach((evt) => {
  gayThemeNo2?.addEventListener(evt, (e) => {
    if (gayNoHidePhaseActive) {
      e.preventDefault();
      if (evt === "click" && gayNoHoverCount >= GAY_NO_MOVE_LIMIT) {
        handleGayNoAfterPersistence();
      }
      return;
    }

    if (
      !gayNoHidePhaseDone &&
      gayNoHoverCount >= GAY_NO_HIDE_PHASE_START &&
      gayNoHoverCount < GAY_NO_MOVE_LIMIT
    ) {
      e.preventDefault();
      startGayNoHidePhase();
      return;
    }

    if (gayNoHoverCount < GAY_NO_MOVE_LIMIT) {
      e.preventDefault();
      moveNoButtonRandomly(gayThemeNo2);
      return;
    }
    if (evt === "click") {
      e.preventDefault();
      handleGayNoAfterPersistence();
    }
  });
});

// =======================================================
// --- Simple Timer with Start / Stop / Reset ---
// =======================================================

const display = document.getElementById("timer-display");
const btnStart = document.getElementById("timer-start");
const btnStop = document.getElementById("timer-stop");
const btnReset = document.getElementById("timer-reset");

let startTime = 0; // Timestamp when the timer was last started.
let elapsed = 0; // Total accumulated elapsed time in milliseconds.
let timerId = null; // Active interval id, or null when stopped.

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const millis = String(ms % 1000).padStart(3, "0");
  return `${minutes}:${seconds}.${millis}`;
}

function updateDisplay() {
  const now = Date.now();
  const current = elapsed + (now - startTime);
  display.textContent = formatTime(current);
}

function startTimer() {
  if (timerId !== null) return; // Timer is already running.

  startTime = Date.now();
  timerId = setInterval(updateDisplay, 10);
}

function stopTimer() {
  if (timerId === null) return;

  clearInterval(timerId);
  timerId = null;
  elapsed += Date.now() - startTime;
  display.textContent = formatTime(elapsed);
}

function resetTimer() {
  clearInterval(timerId);
  timerId = null;
  elapsed = 0;
  startTime = 0;
  display.textContent = "00:00.000";
}

btnStart.addEventListener("click", () => {
  startTimer();
  logActivity("timer", { event: "start" });
  PROCTOR_TONES["timer-tick"]?.();
});
btnStop.addEventListener("click", () => {
  stopTimer();
  logActivity("timer", { event: "stop", elapsedMs: elapsed });
  PROCTOR_TONES["timer-fire"]?.();
});
btnReset.addEventListener("click", () => {
  resetTimer();
  logActivity("timer", { event: "reset" });
  PROCTOR_TONES["reset"]?.();
});

