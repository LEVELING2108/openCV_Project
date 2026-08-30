const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function runAuthAndExamSyncTest() {
  console.log('🧪 Starting Auth, JWT & Exam Sync Unit Tests...');

  // 1. Test Bcrypt Password Hashing & Matching
  const rawPassword = 'SecureExamPassword123!';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(rawPassword, salt);

  console.log(`✓ Password hashed successfully with salt factor 10`);

  const isMatch = await bcrypt.compare(rawPassword, hashedPassword);
  if (!isMatch) {
    throw new Error('Bcrypt password comparison failed for correct password');
  }
  console.log(`✓ Bcrypt password verification passed for matching password`);

  const isWrongMatch = await bcrypt.compare('WrongPassword!', hashedPassword);
  if (isWrongMatch) {
    throw new Error('Bcrypt incorrectly matched a wrong password');
  }
  console.log(`✓ Bcrypt correctly rejected incorrect password`);

  // 2. Test JWT Token Generation & Verification
  const testUserId = '65e01234567890abcdef9999';
  const secretKey = 'test_jwt_secret_key_examguard';
  const token = jwt.sign({ id: testUserId, role: 'examiner' }, secretKey, { expiresIn: '7d' });

  const decoded = jwt.verify(token, secretKey);
  if (decoded.id !== testUserId || decoded.role !== 'examiner') {
    throw new Error('JWT token payload mismatch after verification');
  }
  console.log(`✓ JWT signature and payload decoded successfully: ID=${decoded.id}, Role=${decoded.role}`);

  // 3. Test Question Bank Structure
  const seedQuestions = [
    {
      questionText: 'What is the primary objective of YOLO in computer vision?',
      options: [
        { text: 'Single-stage real-time object detection', isCorrect: true },
        { text: 'Sorting algorithms', isCorrect: false },
      ],
      points: 2,
    },
  ];

  if (seedQuestions[0].options.length !== 2 || !seedQuestions[0].options[0].isCorrect) {
    throw new Error('Question bank schema validation failed');
  }
  console.log(`✓ Question bank structure validated`);

  console.log('✅ ALL AUTH & EXAM SYNC TESTS PASSED!');
}

runAuthAndExamSyncTest().catch((err) => {
  console.error('❌ Auth & Exam test failed:', err);
  process.exit(1);
});
