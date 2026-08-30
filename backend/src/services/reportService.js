const PDFDocument = require('pdfkit');
const Session = require('../models/Session');
const ProctorEvent = require('../models/ProctorEvent');

/**
 * Builds the PDF document stream from structured session and event data.
 * Can be called with raw objects for unit testing or with populated Mongoose documents.
 * @param {Object} session - Session details
 * @param {Array} events - Array of proctoring events
 * @param {Object} stream - Writable stream (e.g. res or fs.WriteStream)
 */
const buildPDFDocument = (session, events = [], stream) => {
  const riskScore = session.riskScore || 0;
  let riskLevel = 'LOW RISK / VERIFIED';
  let riskColor = '#10b981'; // emerald

  if (riskScore >= 50) {
    riskLevel = 'CRITICAL / HIGH RISK';
    riskColor = '#f43f5e'; // rose
  } else if (riskScore >= 20) {
    riskLevel = 'MODERATE RISK';
    riskColor = '#f59e0b'; // amber
  }

  // Count event frequencies
  const eventCounts = {};
  events.forEach((ev) => {
    eventCounts[ev.eventType] = (eventCounts[ev.eventType] || 0) + 1;
  });

  const sessionIdStr = session._id ? session._id.toString() : 'DEMO_SESSION';

  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    info: {
      Title: `ExamGuard_Report_${sessionIdStr}`,
      Author: 'ExamGuard AI Proctoring System',
      Subject: `Integrity Audit for Session ${sessionIdStr}`,
      Keywords: 'exam, proctoring, ai, audit, integrity',
    },
  });

  doc.pipe(stream);

  // --- 1. Header Banner & Branding ---
  doc.rect(40, 40, 515, 60).fill('#0f172a');

  doc
    .fillColor('#6366f1')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('EXAMGUARD AI', 55, 55);

  doc
    .fillColor('#94a3b8')
    .fontSize(9)
    .font('Helvetica')
    .text('Automated Examination Integrity & Incident Audit Report', 55, 78);

  doc
    .fillColor('#e2e8f0')
    .fontSize(8)
    .font('Helvetica')
    .text(`Report ID: EGR-${sessionIdStr.slice(-8).toUpperCase()}`, 380, 55, { align: 'right' })
    .text(`Generated: ${new Date().toUTCString()}`, 380, 72, { align: 'right' });

  doc.moveDown(3);

  // --- 2. Session & Student Overview Box ---
  const boxTop = 115;
  doc.rect(40, boxTop, 515, 95).strokeColor('#e2e8f0').lineWidth(1).stroke();

  doc
    .fillColor('#1e293b')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('EXAMINATION & CANDIDATE DETAILS', 55, boxTop + 10);

  // Column 1: Candidate
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('Candidate Name:', 55, boxTop + 30)
    .font('Helvetica')
    .fillColor('#0f172a')
    .text(session.student?.name || 'Candidate', 150, boxTop + 30)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('Candidate Email:', 55, boxTop + 48)
    .font('Helvetica')
    .fillColor('#0f172a')
    .text(session.student?.email || 'N/A', 150, boxTop + 48)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('Candidate ID:', 55, boxTop + 66)
    .font('Helvetica')
    .fillColor('#0f172a')
    .text(session.student?._id ? session.student._id.toString() : 'usr_id', 150, boxTop + 66);

  // Column 2: Exam Session
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('Exam Title:', 320, boxTop + 30)
    .font('Helvetica')
    .fillColor('#0f172a')
    .text(session.exam?.title || 'Online Assessment', 395, boxTop + 30)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('Start Time:', 320, boxTop + 48)
    .font('Helvetica')
    .fillColor('#0f172a')
    .text(session.startedAt ? new Date(session.startedAt).toLocaleString() : 'N/A', 395, boxTop + 48)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('Status:', 320, boxTop + 66)
    .font('Helvetica')
    .fillColor('#0f172a')
    .text(session.status || 'ACTIVE', 395, boxTop + 66);

  // --- 3. Risk Assessment Summary ---
  const riskBoxTop = 225;
  doc.rect(40, riskBoxTop, 515, 80).fill('#f8fafc');
  doc.rect(40, riskBoxTop, 515, 80).strokeColor('#cbd5e1').lineWidth(1).stroke();

  doc
    .fillColor('#1e293b')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('INTEGRITY & RISK EVALUATION', 55, riskBoxTop + 10);

  // Score Badge
  doc
    .rect(55, riskBoxTop + 30, 90, 35)
    .fill(riskColor);

  doc
    .fillColor('#ffffff')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(`${riskScore}`, 55, riskBoxTop + 35, { width: 90, align: 'center' });

  doc
    .fillColor('#ffffff')
    .fontSize(7)
    .font('Helvetica')
    .text('RISK INDEX', 55, riskBoxTop + 54, { width: 90, align: 'center' });

  // Risk Classification
  doc
    .fillColor('#1e293b')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(`Integrity Rating: ${riskLevel}`, 160, riskBoxTop + 32);

  const totalIncidents = events.length;
  doc
    .fillColor('#64748b')
    .fontSize(8.5)
    .font('Helvetica')
    .text(
      `Total Proctoring Flag Events: ${totalIncidents} | Total Questions Answered: ${session.answers?.length || 0}`,
      160,
      riskBoxTop + 48
    );

  // --- 4. Incident Category Frequency Breakdown ---
  const categoryTop = 320;
  doc
    .fillColor('#1e293b')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('INCIDENT FREQUENCY BREAKDOWN', 40, categoryTop);

  const categories = [
    { label: 'Missing Face', key: 'FACE_MISSING' },
    { label: 'Gaze / Head Away', key: 'EXCESSIVE_LOOKING_AWAY' },
    { label: 'Mobile Device', key: 'PHONE_DETECTED' },
    { label: 'Multiple Faces', key: 'MULTIPLE_FACES' },
    { label: 'Tab Focus Lost', key: 'TAB_FOCUS_LOST' },
    { label: 'Camera Blocked', key: 'CAMERA_BLOCKED' },
  ];

  let catX = 40;
  categories.forEach((cat) => {
    const count = eventCounts[cat.key] || 0;
    doc.rect(catX, categoryTop + 15, 80, 42).fill('#f1f5f9');
    doc.rect(catX, categoryTop + 15, 80, 42).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

    doc
      .fillColor('#475569')
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text(cat.label, catX + 2, categoryTop + 20, { width: 76, align: 'center' });

    doc
      .fillColor(count > 0 ? '#e11d48' : '#0f172a')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`${count}`, catX, categoryTop + 35, { width: 80, align: 'center' });

    catX += 87;
  });

  // --- 5. Chronological Incident Audit Trail Table ---
  let tableTop = 395;
  doc
    .fillColor('#1e293b')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('CHRONOLOGICAL AUDIT TRAIL', 40, tableTop);

  tableTop += 15;

  // Table Header
  doc.rect(40, tableTop, 515, 20).fill('#1e293b');
  doc
    .fillColor('#ffffff')
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('TIME (UTC)', 50, tableTop + 6)
    .text('INCIDENT TYPE', 160, tableTop + 6)
    .text('WEIGHT', 300, tableTop + 6)
    .text('CONFIDENCE', 360, tableTop + 6)
    .text('VERIFICATION STATUS', 440, tableTop + 6);

  let currentY = tableTop + 20;

  if (events.length === 0) {
    doc.rect(40, currentY, 515, 25).fill('#f8fafc');
    doc
      .fillColor('#10b981')
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text('Clean Session: No suspicious anomalies or violations detected.', 50, currentY + 8);
    currentY += 30;
  } else {
    events.slice(0, 14).forEach((ev, idx) => {
      const isEven = idx % 2 === 0;
      doc.rect(40, currentY, 515, 18).fill(isEven ? '#ffffff' : '#f8fafc');
      doc.rect(40, currentY, 515, 18).strokeColor('#f1f5f9').lineWidth(0.5).stroke();

      const timeStr = new Date(ev.createdAt).toLocaleTimeString();
      const confStr = `${Math.round((ev.confidence || 1.0) * 100)}%`;
      const statusStr = ev.reviewStatus || 'PENDING';
      const statusColor =
        statusStr === 'CONFIRMED' ? '#e11d48' : statusStr === 'DISMISSED' ? '#10b981' : '#64748b';

      doc
        .fillColor('#334155')
        .fontSize(7.5)
        .font('Helvetica')
        .text(timeStr, 50, currentY + 5)
        .text(ev.eventType, 160, currentY + 5)
        .text(`+${ev.riskWeight}`, 300, currentY + 5)
        .text(confStr, 360, currentY + 5)
        .fillColor(statusColor)
        .font('Helvetica-Bold')
        .text(statusStr, 440, currentY + 5);

      currentY += 18;
    });

    if (events.length > 14) {
      doc
        .fillColor('#64748b')
        .fontSize(7.5)
        .font('Helvetica-Oblique')
        .text(`... and ${events.length - 14} additional recorded events. Complete logs accessible in online console.`, 50, currentY + 4);
      currentY += 15;
    }
  }

  // --- 6. Examiner Sign-Off & Verification Block ---
  const signTop = Math.max(currentY + 25, 680);
  doc.rect(40, signTop, 515, 80).fill('#f8fafc');
  doc.rect(40, signTop, 515, 80).strokeColor('#cbd5e1').lineWidth(1).stroke();

  doc
    .fillColor('#1e293b')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('EXAMINER / PROCTOR SIGN-OFF CERTIFICATION', 50, signTop + 8);

  doc
    .fillColor('#475569')
    .fontSize(7.5)
    .font('Helvetica')
    .text(
      'I hereby certify that I have reviewed the automated AI proctoring telemetry, incident video snapshots, and timeline recorded above in accordance with institutional examination integrity policies.',
      50,
      signTop + 22,
      { width: 500 }
    );

  doc
    .font('Helvetica-Bold')
    .text('Lead Examiner Signature: _______________________', 50, signTop + 55)
    .text('Date: ______________', 340, signTop + 55)
    .text('Decision: [ ] VALID  [ ] REJECT', 430, signTop + 55);

  // Footer
  doc
    .fillColor('#94a3b8')
    .fontSize(7)
    .font('Helvetica')
    .text('ExamGuard AI Platform • Confidential & Tamper-Evident Examination Audit Record', 40, 790, {
      align: 'center',
      width: 515,
    });

  doc.end();
  return doc;
};

/**
 * Generate a comprehensive PDF Examination Integrity & Proctoring Audit Report from MongoDB
 * @param {string} sessionId - MongoDB Session ID
 * @param {Object} stream - Writable stream (e.g., Express res or file stream)
 */
const generateSessionPDFReport = async (sessionId, stream) => {
  const session = await Session.findById(sessionId)
    .populate('student', 'name email')
    .populate('exam');

  if (!session) {
    throw new Error('Exam session not found');
  }

  const events = await ProctorEvent.find({ session: sessionId })
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: 1 });

  return buildPDFDocument(session, events, stream);
};

module.exports = {
  buildPDFDocument,
  generateSessionPDFReport,
};
