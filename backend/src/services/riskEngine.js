/**
 * ExamGuard AI - Advanced Risk Engine & Decay Service
 * Calculates cumulative risk scores with cooldowns, burst detection, and time decay.
 */

const RISK_WEIGHTS = {
  PHONE_DETECTED: 40,
  MULTIPLE_FACES: 30,
  CAMERA_DISABLED: 30,
  CAMERA_BLOCKED: 30,
  FACE_MISSING: 15,
  EXCESSIVE_LOOKING_AWAY: 10,
  TAB_FOCUS_LOST: 10,
  NETWORK_DISCONNECTED: 5,
  SUSPICIOUS_EVENT_BURST: 25,
};

const COOLDOWNS = {
  PHONE_DETECTED: 20,
  MULTIPLE_FACES: 20,
  CAMERA_DISABLED: 60,
  CAMERA_BLOCKED: 60,
  FACE_MISSING: 15,
  EXCESSIVE_LOOKING_AWAY: 30,
  TAB_FOCUS_LOST: 30,
  NETWORK_DISCONNECTED: 60,
};

class RiskEngine {
  /**
   * Calculates dynamic risk score with decay.
   * If a student is clean for more than `cleanWindowMinutes`, decay score by factor.
   */
  static applyScoreDecay(currentScore, lastIncidentTime, cleanWindowMinutes = 5, decayPoints = 5) {
    if (!lastIncidentTime || currentScore <= 0) return Math.max(0, currentScore);

    const now = new Date();
    const elapsedMinutes = (now.getTime() - new Date(lastIncidentTime).getTime()) / (1000 * 60);

    if (elapsedMinutes >= cleanWindowMinutes) {
      const decaySteps = Math.floor(elapsedMinutes / cleanWindowMinutes);
      return Math.max(0, currentScore - decaySteps * decayPoints);
    }

    return currentScore;
  }

  /**
   * Determine review priority category based on calculated score.
   */
  static getReviewPriority(score) {
    if (score >= 40) return { level: 'HIGH', color: '#f43f5e', actionRequired: true };
    if (score >= 20) return { level: 'MEDIUM', color: '#f59e0b', actionRequired: false };
    if (score > 0) return { level: 'LOW', color: '#3b82f6', actionRequired: false };
    return { level: 'NORMAL', color: '#10b981', actionRequired: false };
  }

  static getWeight(eventType) {
    return RISK_WEIGHTS[eventType] || 10;
  }

  static getCooldown(eventType) {
    return COOLDOWNS[eventType] || 15;
  }
}

module.exports = {
  RiskEngine,
  RISK_WEIGHTS,
  COOLDOWNS,
};
