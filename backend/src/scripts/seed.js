const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Exam = require('../models/Exam');

dotenv.config();

const SEED_USERS = [
  {
    name: 'Alex Rivera',
    email: 'student@examguard.io',
    password: 'password123',
    role: 'student',
  },
  {
    name: 'Prof. Marcus Vance',
    email: 'examiner@examguard.io',
    password: 'password123',
    role: 'examiner',
  },
  {
    name: 'System Admin',
    email: 'admin@examguard.io',
    password: 'password123',
    role: 'admin',
  },
];

const SEED_QUESTIONS = [
  {
    questionText: 'Which algorithm is commonly used for real-time face detection using integral images and Haar-like features?',
    options: [
      { text: 'Viola-Jones Framework', isCorrect: true },
      { text: 'Dijkstra Shortest Path', isCorrect: false },
      { text: 'K-Means Clustering', isCorrect: false },
      { text: 'PageRank Algorithm', isCorrect: false },
    ],
    points: 2,
  },
  {
    questionText: 'What is the primary computer vision neural architecture family used by YOLO (You Only Look Once)?',
    options: [
      { text: 'Single-stage Convolutional Object Detection Network', isCorrect: true },
      { text: 'Recurrent Long Short-Term Memory (LSTM)', isCorrect: false },
      { text: 'Support Vector Machine (SVM) Classifier', isCorrect: false },
      { text: 'Hidden Markov Model (HMM)', isCorrect: false },
    ],
    points: 2,
  },
  {
    questionText: 'In digital audio analysis for proctoring, which metric calculates Root Mean Square acoustic energy in decibels?',
    options: [
      { text: 'dBFS = 20 * log10(RMS + 1e-9)', isCorrect: true },
      { text: 'dB = 10 * exp(RMS)', isCorrect: false },
      { text: 'ZCR = sum(|sign(x)|)', isCorrect: false },
      { text: 'FFT = sum(x[n] * 2^n)', isCorrect: false },
    ],
    points: 2,
  },
  {
    questionText: 'Which data structure operates on a strict Last-In, First-Out (LIFO) order of elements?',
    options: [
      { text: 'Stack', isCorrect: true },
      { text: 'Queue', isCorrect: false },
      { text: 'Binary Search Tree', isCorrect: false },
      { text: 'Min-Heap', isCorrect: false },
    ],
    points: 1,
  },
  {
    questionText: 'What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree?',
    options: [
      { text: 'O(n)', isCorrect: true },
      { text: 'O(1)', isCorrect: false },
      { text: 'O(log n)', isCorrect: false },
      { text: 'O(n log n)', isCorrect: false },
    ],
    points: 2,
  },
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/examguard';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing seed records...');
    for (const u of SEED_USERS) {
      await User.deleteOne({ email: u.email });
    }

    console.log('Seeding default User accounts (Student, Examiner, Admin)...');
    const createdUsers = [];
    for (const u of SEED_USERS) {
      const user = await User.create(u);
      createdUsers.push(user);
      console.log(`✓ Created [${user.role.toUpperCase()}]: ${user.name} (${user.email})`);
    }

    const examiner = createdUsers.find((u) => u.role === 'examiner');

    console.log('Seeding standard Exam question bank...');
    await Exam.deleteMany({ title: 'CS501: Advanced Computer Vision & AI Proctoring' });

    const exam = await Exam.create({
      title: 'CS501: Advanced Computer Vision & AI Proctoring',
      description: 'Midterm Examination covering OpenCV Haar Cascades, YOLOv8 Object Detection, Acoustic Signal Analysis, and Real-Time Proctoring Architecture.',
      creator: examiner._id,
      durationMinutes: 30,
      randomizeQuestions: true,
      questions: SEED_QUESTIONS,
      assignedStudents: [],
      proctoringConfig: {
        faceMissingPersistenceSeconds: 5,
        phoneDetectionConfidenceThreshold: 0.35,
        trackTabFocus: true,
      },
    });

    console.log(`✓ Created Exam: "${exam.title}" (${exam.questions.length} questions, ${exam.durationMinutes} mins)`);
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  SEED_USERS,
  SEED_QUESTIONS,
};
