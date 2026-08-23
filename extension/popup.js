document.addEventListener('DOMContentLoaded', async () => {
  if (chrome.storage && chrome.storage.local) {
    const data = await chrome.storage.local.get(['examActive', 'sessionId']);
    const statusEl = document.getElementById('agent-status');
    const sessionEl = document.getElementById('session-display');

    if (data.examActive) {
      statusEl.textContent = 'Exam Active';
      statusEl.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
      statusEl.style.color = '#34d399';
      sessionEl.textContent = data.sessionId ? String(data.sessionId).substring(0, 10) + '...' : 'Live';
    } else {
      statusEl.textContent = 'Standby';
      statusEl.style.backgroundColor = 'rgba(148, 163, 184, 0.15)';
      statusEl.style.color = '#94a3b8';
      sessionEl.textContent = 'None';
    }
  }
});
