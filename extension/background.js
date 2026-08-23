/**
 * ExamGuard AI - Background Service Worker (Manifest V3)
 */

console.log("🛡️ ExamGuard AI Background Service Worker initialized.");

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    examActive: false,
    sessionId: null,
    violationsCount: 0,
  });
});

// Listen for tab switching events
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const data = await chrome.storage.local.get(["examActive", "sessionId", "examTabId"]);
  if (data.examActive && data.examTabId && activeInfo.tabId !== data.examTabId) {
    console.warn("⚠️ Student switched away from Exam Tab!");
    chrome.tabs.sendMessage(data.examTabId, {
      type: "EXAMGUARD_EXTENSION_SIGNAL",
      event: "TAB_SWITCH_DETECTED",
      timestamp: Date.now(),
    }).catch(() => {});
  }
});

// Listen for messages from web application content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXAM_STARTED") {
    chrome.storage.local.set({
      examActive: true,
      sessionId: message.sessionId,
      examTabId: sender.tab ? sender.tab.id : null,
    });
    sendResponse({ status: "ACK_EXAM_ACTIVE" });
  } else if (message.type === "EXAM_ENDED") {
    chrome.storage.local.set({
      examActive: false,
      sessionId: null,
      examTabId: null,
    });
    sendResponse({ status: "ACK_EXAM_CLEARED" });
  }
  return true;
});
