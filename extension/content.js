/**
 * ExamGuard AI - Content Script
 * Injected into Exam Portal for secure session monitoring
 */

(() => {
  console.log("🛡️ ExamGuard AI Extension Content Script injected.");

  // Expose extension availability flag
  window.__EXAMGUARD_EXTENSION_READY__ = true;

  const emitSecuritySignal = (eventType, details = {}) => {
    window.postMessage({
      source: "EXAMGUARD_EXTENSION",
      type: "SECURITY_SIGNAL",
      eventType,
      details,
      timestamp: new Date().toISOString(),
    }, "*");
  };

  // 1. Detect Window Defocus / Blur
  window.addEventListener("blur", () => {
    emitSecuritySignal("WINDOW_DEFOCUS", { reason: "User switched application or clicked outside browser" });
  });

  // 2. Detect Fullscreen Change
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      emitSecuritySignal("FULLSCREEN_EXITED", { reason: "User exited fullscreen exam mode" });
    }
  });

  // 3. Prevent and report unauthorized Copy/Cut/Paste
  document.addEventListener("copy", (e) => {
    emitSecuritySignal("CLIPBOARD_ACTION", { action: "COPY" });
  });

  document.addEventListener("paste", (e) => {
    emitSecuritySignal("CLIPBOARD_ACTION", { action: "PASTE" });
  });

  // 4. Listen for signals from Background Worker
  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "EXAMGUARD_EXTENSION_SIGNAL") {
      emitSecuritySignal(request.event, { timestamp: request.timestamp });
    }
  });

  // Signal ready to web app
  window.dispatchEvent(new CustomEvent("ExamGuardExtensionReady"));
})();
