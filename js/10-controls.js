document.getElementById("shuffleBtn").addEventListener("click", () => {
  shuffleMode = !shuffleMode;
  const btn = document.getElementById("shuffleBtn");
  const mobileBtn = document.getElementById("m-shuffleBtn");
  if (shuffleMode) {
    CURRENT_DATA = shuffleArray(CURRENT_DATA);
    showToast("Shuffle questions: ON");
    [btn, mobileBtn].forEach((b) => {
      if (!b) return;
      b.classList.add("active");
      b.title = "Shuffle questions: ON";
      b.setAttribute("aria-label", "Shuffle questions ON");
    });
  } else {
    CURRENT_DATA.sort((a, b) => a.number - b.number); // Restore default question order.
    showToast("Shuffle questions: OFF");
    [btn, mobileBtn].forEach((b) => {
      if (!b) return;
      b.classList.remove("active");
      b.title = "Shuffle questions: OFF";
      b.setAttribute("aria-label", "Shuffle questions OFF");
    });
  }
  applySourceFilter();
  btn.classList.add("disabled");
  setTimeout(() => btn.classList.remove("disabled"), 2000);
});


document.getElementById("toggleExam").addEventListener("click", () => {
  if (!examMode) {
    setExamModeState(true);
    applySourceFilter();
    updateScoreUI();
    return;
  }

  openModeResetConfirm(
    "Are you sure you want to disable Exam Mode? This will reset your progress.",
    () => {
      setExamModeState(false);
      resetQuizProgress();
      applySourceFilter();
      updateScoreUI();
    }
  );
});

document.getElementById("toggleGodlike")?.addEventListener("click", () => {
  if (!godlikeMode) {
    setGodModeState(true);
    updateScoreUI();
    return;
  }

  openModeResetConfirm(
    "Are you sure you want to disable God Mode? This will reset your progress.",
    () => {
      setGodModeState(false);
      resetQuizProgress();
      applySourceFilter();
      updateScoreUI();
    }
  );
});

document.getElementById("resetQuiz").addEventListener("click", () => {
  openModeResetConfirm(
    "Are you sure you want to reset all progress?",
    () => {
      resetQuizProgress();
      applySourceFilter();
      updateScoreUI();
    }
  );
});

document.getElementById("new-fact").addEventListener("click", () => {
  const fact = document.getElementById("fact");
  fact.textContent = "Loading...";
  fetch("https://catfact.ninja/fact")
    .then((res) => res.json())
    .then((data) => (fact.textContent = data.fact))
    .catch(() => (fact.textContent = "Failed to load fact ðŸ˜¿"));
});

function setWidgetsVisible(show) {
  document
    .querySelectorAll(".side-banner, .cat-widget")
    .forEach((el) => el.classList.toggle("visible", show));
}

function toggleWidgetsVisibility() {
  const hasVisible = Array.from(
    document.querySelectorAll(".side-banner, .cat-widget")
  ).some((el) => el.classList.contains("visible"));
  setWidgetsVisible(!hasVisible);
}

function getWidgetDisplayMode() {
  const widgetsVisible = Array.from(
    document.querySelectorAll(".side-banner, .cat-widget")
  ).some((el) => el.classList.contains("visible"));
  const timer = document.getElementById("timer-wrapper");
  const timerVisible = !!timer && !timer.classList.contains("timer-hidden");
  if (widgetsVisible && timerVisible) return "all";
  if (widgetsVisible) return "widgets";
  if (timerVisible) return "timer";
  return "none";
}

function setTimerVisible(show) {
  const timer = document.getElementById("timer-wrapper");
  if (!timer) return;
  timer.classList.toggle("timer-hidden", !show);
}

function toggleTimerVisibility() {
  const timer = document.getElementById("timer-wrapper");
  if (!timer) return;
  const isVisible = !timer.classList.contains("timer-hidden");
  setTimerVisible(!isVisible);
  updateWidgetButtonsUI(getWidgetDisplayMode());
}

function applyWidgetDisplayMode(mode) {
  if (mode === "widgets") {
    setWidgetsVisible(true);
    setTimerVisible(false);
  } else if (mode === "timer") {
    setWidgetsVisible(false);
    setTimerVisible(true);
  } else if (mode === "all") {
    setWidgetsVisible(true);
    setTimerVisible(true);
  } else {
    setWidgetsVisible(false);
    setTimerVisible(false);
  }
  updateWidgetButtonsUI(getWidgetDisplayMode());
}

function updateWidgetButtonsUI(mode) {
  const map = {
    widgets: { icon: "🧩", label: "Widgets", title: "Display mode: Widgets only" },
    timer: { icon: "⏱️", label: "Timer", title: "Display mode: Timer only" },
    all: { icon: "🧩⏱️", label: "Both", title: "Display mode: Widgets + Timer" },
    none: { icon: "🚫", label: "Off", title: "Display mode: Off" },
  };
  const meta = map[mode] || map.none;
  const desktopBtn = document.getElementById("toggleWidgets");
  const mobileBtn = document.getElementById("m-toggleWidgets");
  [desktopBtn, mobileBtn].forEach((btn) => {
    if (!btn) return;
    setButtonIconLabel(btn, meta.icon, `Widgets: ${meta.label}`);
    btn.title = `${meta.title} (click to rotate)`;
    btn.setAttribute("aria-label", `${meta.title}. Click to rotate mode.`);
  });
}

function rotateWidgetDisplayMode() {
  const current = getWidgetDisplayMode();
  const next = {
    timer: "all",
    all: "widgets",
    widgets: "none",
    none: "timer",
  }[current] || "timer";
  applyWidgetDisplayMode(next);
}

document.getElementById("toggleWidgets").addEventListener("click", () => {
  rotateWidgetDisplayMode();
});
document.getElementById("m-toggleWidgets")?.addEventListener("click", () => {
  rotateWidgetDisplayMode();
});
let lastW = 0;
let lastT = 0;
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  const now = Date.now();

  if (key === "w") {
    if (now - lastW < 300) {
      rotateWidgetDisplayMode();
    }
    lastW = now;
  }

  if (key === "t") {
    if (now - lastT < 300) {
      toggleTimerVisibility();
    }
    lastT = now;
  }
});

const timerWidget = document.getElementById("timer-wrapper");
let offsetX = 0,
  offsetY = 0,
  isDragging = false;
let timerPointerId = null;

timerWidget.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  // Keep timer controls clickable; start drag only outside control buttons.
  if (e.target.closest("#timer-controls button")) return;
  const rect = timerWidget.getBoundingClientRect();
  // Convert from right-anchored to left/top absolute coords before drag.
  timerWidget.style.right = "auto";
  timerWidget.style.left = `${rect.left}px`;
  timerWidget.style.top = `${rect.top}px`;

  isDragging = true;
  timerPointerId = e.pointerId;
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  timerWidget.setPointerCapture(e.pointerId);
  e.preventDefault();
});

timerWidget.addEventListener("pointermove", (e) => {
  if (!isDragging || e.pointerId !== timerPointerId) return;
  const pad = 8;
  const maxX = Math.max(pad, window.innerWidth - timerWidget.offsetWidth - pad);
  const maxY = Math.max(pad, window.innerHeight - timerWidget.offsetHeight - pad);
  const left = clamp(e.clientX - offsetX, pad, maxX);
  const top = clamp(e.clientY - offsetY, pad, maxY);
  timerWidget.style.left = `${left}px`;
  timerWidget.style.top = `${top}px`;
});

function stopTimerDrag(e) {
  if (e.pointerId !== timerPointerId) return;
  isDragging = false;
  timerPointerId = null;
}

timerWidget.addEventListener("pointerup", stopTimerDrag);
timerWidget.addEventListener("pointercancel", stopTimerDrag);

function makeDraggable(el) {
  let isDown = false,
    offsetX = 0,
    offsetY = 0;
  const disableSelection = () => {
    document.body.style.userSelect = "none";
  };
  const enableSelection = () => {
    document.body.style.userSelect = "";
  };
  el.addEventListener("mousedown", (e) => {
    isDown = true;
    el.style.zIndex = 999999;
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;
    disableSelection();
    e.preventDefault();
  });
  document.addEventListener("mouseup", () => {
    isDown = false;
    enableSelection();
  });
  document.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    const pad = 8;
    const maxX = Math.max(pad, window.innerWidth - el.offsetWidth - pad);
    const maxY = Math.max(pad, window.innerHeight - el.offsetHeight - pad);
    const left = clamp(e.clientX - offsetX, pad, maxX);
    const top = clamp(e.clientY - offsetY, pad, maxY);
    el.style.left = left + "px";
    el.style.top = top + "px";
    el.style.position = "fixed";
  });
}

let allShown = false;

document.getElementById("toggleAll").addEventListener("click", () => {
  const btn = document.getElementById("toggleAll");
  const mobileBtn = document.getElementById("m-toggleAll");

  if (examMode || godlikeMode) return;

  allShown = !allShown;

  document.querySelectorAll(".card").forEach((card) => {
    const qid = String(card.dataset.qid || "");
    const question = CURRENT_DATA.find((q) => getQuestionId(q) === qid);
    const correctIndex = getCorrectIndex(question);
    const ansBox = card.querySelector(".answer");

    if (!Number.isInteger(correctIndex)) return;

    if (allShown) {
      card.querySelectorAll(".choice").forEach((el, idx) => {
        el.classList.toggle("correct", idx === correctIndex);
      });

      ansBox.textContent = `Correct: ${["A", "B", "C", "D", "E", "F", "G"][correctIndex]}`;
      ansBox.classList.add("show");
      btn.textContent = "🙈";
      btn.setAttribute("aria-label", "Hide all answers");
      btn.title = "Hide all answers";
      if (mobileBtn) {
        setButtonIconLabel(mobileBtn, "🙈", "Hide All");
        mobileBtn.setAttribute("aria-label", "Hide all answers");
        mobileBtn.title = "Hide all answers";
      }
    } else {
      card.querySelectorAll(".choice").forEach((el) => {
        el.classList.remove("correct");
      });

      ansBox.classList.remove("show");
      ansBox.textContent = "";
      btn.textContent = "👁️";
      btn.setAttribute("aria-label", "Show all answers");
      btn.title = "Show all answers";
      if (mobileBtn) {
        setButtonIconLabel(mobileBtn, "👁️", "Show All");
        mobileBtn.setAttribute("aria-label", "Show all answers");
        mobileBtn.title = "Show all answers";
      }
    }
  });
});

document.getElementById("shuffle-answers-btn").addEventListener("click", () => {
  shuffleAnswersMode = !shuffleAnswersMode;
  const btn = document.getElementById("shuffle-answers-btn");
  const mobileBtn = document.getElementById("m-shuffle-answers-btn");

  if (shuffleAnswersMode) {
    showToast("Shuffle answers: ON");
    CURRENT_DATA.forEach((q) => {
      const correctAnswerIndex = getCorrectIndex(q);
      if (!Number.isInteger(correctAnswerIndex)) return;
      if (!Array.isArray(q.choices_en) || q.choices_en.length === 0) return;

      const correctAnswer = q.choices_en[correctAnswerIndex];
      const wrongAnswers = shuffleArray(
        q.choices_en.filter((_, idx) => idx !== correctAnswerIndex)
      );
      const randomIndex = Math.floor(Math.random() * (wrongAnswers.length + 1));
      wrongAnswers.splice(randomIndex, 0, correctAnswer);
      q.choices_en = wrongAnswers;
      q.correctIndex = randomIndex;
    });
    [btn, mobileBtn].forEach((b) => {
      if (!b) return;
      b.classList.add("active");
      b.title = "Shuffle answers: ON";
      b.setAttribute("aria-label", "Shuffle answers ON");
    });
  } else {
    showToast("Shuffle answers: OFF");
    CURRENT_DATA.forEach((q) => {
      const original = ORIGINAL_ANSWERS[getQuestionId(q)];
      if (!original) return;
      q.choices_en = [...original.choices_en];
      if (Number.isInteger(original.correctIndex)) {
        q.correctIndex = original.correctIndex;
      }
    });
    [btn, mobileBtn].forEach((b) => {
      if (!b) return;
      b.classList.remove("active");
      b.title = "Shuffle answers: OFF";
      b.setAttribute("aria-label", "Shuffle answers OFF");
    });
  }

  applySourceFilter();
  btn.classList.add("disabled");
  setTimeout(() => btn.classList.remove("disabled"), 2000);
});

document.querySelectorAll(".draggable").forEach((el) => {
  // Timer has its own pointer-based drag logic.
  if (el.id === "timer-wrapper") return;
  makeDraggable(el);
});

// Keep widgets hidden by default until explicitly toggled.
setWidgetsVisible(false);
updateWidgetButtonsUI(getWidgetDisplayMode());

