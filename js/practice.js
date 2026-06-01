/**
 * OpenLearn practice panels — checklists, progress, optional output check.
 * Works on static HTML lesson and project pages.
 */
(function () {
  const STORAGE_PREFIX = "openlearn-practice-";

  function storageKey(panel) {
    const page = window.location.pathname.replace(/^\//, "");
    const id = panel.dataset.practiceId || "default";
    return STORAGE_PREFIX + page + "-" + id;
  }

  function loadState(panel) {
    try {
      const raw = localStorage.getItem(storageKey(panel));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveState(panel, state) {
    try {
      localStorage.setItem(storageKey(panel), JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }

  function normalizeOutput(text) {
    return text
      .trim()
      .replace(/\r\n/g, "\n")
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function initPanel(panel) {
    const checks = panel.querySelectorAll(".practice-check input[type='checkbox']");
    const progressBar = panel.querySelector(".practice-progress__bar");
    const progressLabel = panel.querySelector(".practice-progress__label");
    const progressEl = panel.querySelector(".practice-progress");
    const successEl = panel.querySelector(".practice-success");
    const codeArea = panel.querySelector(".practice-code");
    const verifyBtn = panel.querySelector("[data-output-verify]");
    const outputInput = panel.querySelector(".practice-output-input");
    const outputFeedback = panel.querySelector(".practice-output-feedback");
    const isProject = panel.dataset.practiceType === "project";

    if (!checks.length) return;

    const saved = loadState(panel);
    if (saved) {
      checks.forEach((input, i) => {
        if (saved.checks && saved.checks[i]) input.checked = true;
      });
      if (codeArea && saved.code) codeArea.value = saved.code;
    }

    function updateProgress() {
      const total = checks.length;
      const done = [...checks].filter((c) => c.checked).length;
      const pct = total ? Math.round((done / total) * 100) : 0;

      if (progressBar) progressBar.style.width = pct + "%";
      if (progressLabel) progressLabel.textContent = pct + "% complete";
      if (progressEl) {
        progressEl.setAttribute("aria-valuenow", String(pct));
      }

      const allDone = done === total && total > 0;
      if (successEl) {
        successEl.hidden = !allDone;
      }

      saveState(panel, {
        checks: [...checks].map((c) => c.checked),
        code: codeArea ? codeArea.value : "",
      });

      return allDone;
    }

    checks.forEach((input) => {
      input.addEventListener("change", updateProgress);
    });

    if (codeArea) {
      codeArea.addEventListener("input", () => {
        saveState(panel, {
          checks: [...checks].map((c) => c.checked),
          code: codeArea.value,
        });
      });
    }

    if (verifyBtn && outputInput && outputFeedback) {
      const expected = panel.dataset.expectedOutput || "";
      verifyBtn.addEventListener("click", () => {
        const user = normalizeOutput(outputInput.value);
        const exp = normalizeOutput(expected);

        if (!user) {
          outputFeedback.hidden = false;
          outputFeedback.className = "practice-feedback practice-feedback--warn";
          outputFeedback.textContent = "Paste your terminal output first, then check again.";
          return;
        }

        if (!exp) {
          outputFeedback.hidden = false;
          outputFeedback.className = "practice-feedback practice-feedback--ok";
          outputFeedback.textContent = "Output saved. Confirm it matches the expected example above.";
          return;
        }

        const match =
          user === exp ||
          user.includes(exp) ||
          exp.split(" ").every((word) => word.length < 3 || user.includes(word));

        outputFeedback.hidden = false;
        if (match) {
          outputFeedback.className = "practice-feedback practice-feedback--ok";
          outputFeedback.textContent = isProject
            ? "Output looks right! Check off the remaining steps if you haven't yet."
            : "Nice — your output matches what we expected.";
          const outputCheck = panel.querySelector("[data-check='output']");
          if (outputCheck) {
            outputCheck.checked = true;
            updateProgress();
          }
        } else {
          outputFeedback.className = "practice-feedback practice-feedback--warn";
          outputFeedback.textContent =
            "Not quite yet. Compare line by line with the expected output, fix your code, and run again.";
        }
      });
    }

    updateProgress();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".practice-panel").forEach(initPanel);
  });
})();
