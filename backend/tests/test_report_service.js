const { buildPDFDocument } = require('../src/services/reportService');
const { Writable } = require('stream');

class BufferWritable extends Writable {
  constructor() {
    super();
    this.chunks = [];
  }

  _write(chunk, encoding, callback) {
    this.chunks.push(chunk);
    callback();
  }

  getBuffer() {
    return Buffer.concat(this.chunks);
  }
}

async function runReportTest() {
  console.log('🧪 Starting PDF Report Generation Unit Test...');

  const mockSession = {
    _id: '65e01234567890abcdef1234',
    student: {
      _id: 'usr_student_123',
      name: 'Alex Rivera',
      email: 'alex.rivera@university.edu',
    },
    exam: {
      title: 'CS501: Computer Vision & AI Proctoring Midterm',
    },
    status: 'COMPLETED',
    startedAt: new Date(Date.now() - 3600000),
    submittedAt: new Date(),
    riskScore: 45,
    answers: [{ questionId: 'q1', selectedOption: 0 }],
  };

  const mockEvents = [
    {
      _id: 'ev_1',
      eventType: 'PHONE_DETECTED',
      riskWeight: 40,
      confidence: 0.94,
      reviewStatus: 'CONFIRMED',
      createdAt: new Date(Date.now() - 1800000),
    },
    {
      _id: 'ev_2',
      eventType: 'EXCESSIVE_LOOKING_AWAY',
      riskWeight: 10,
      confidence: 0.88,
      reviewStatus: 'DISMISSED',
      createdAt: new Date(Date.now() - 900000),
    },
  ];

  const bufferStream = new BufferWritable();

  await new Promise((resolve, reject) => {
    bufferStream.on('finish', resolve);
    bufferStream.on('error', reject);
    buildPDFDocument(mockSession, mockEvents, bufferStream);
  });

  const pdfBuffer = bufferStream.getBuffer();

  console.log(`✓ PDF Generated successfully! Total size: ${pdfBuffer.length} bytes`);

  // Verify PDF header magic bytes
  const header = pdfBuffer.slice(0, 5).toString();
  if (header === '%PDF-') {
    console.log(`✓ PDF Header verified: "${header}"`);
  } else {
    throw new Error(`Invalid PDF header: ${header}`);
  }

  if (pdfBuffer.length < 1000) {
    throw new Error('PDF output buffer is suspiciously small');
  }

  console.log('✅ ALL PDF REPORT TESTS PASSED!');
}

runReportTest().catch((err) => {
  console.error('❌ PDF Report test failed:', err);
  process.exit(1);
});
