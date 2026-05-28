// Static placement test questions — 20 questions covering Pre-A1 to A2
// Score 0-5 → PRE_A1, 6-9 → A1, 10-14 → A2, 15-20 → B1+

export interface PlacementQuestion {
  id: string;
  type: "MCQ" | "FILL_BLANK" | "TRUE_FALSE";
  skill: "VOCABULARY" | "GRAMMAR" | "READING";
  level: "PRE_A1" | "A1" | "A2" | "B1";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanationTh: string;
  points: number;
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // ── PRE_A1 ──────────────────────────────────────────────────────────────
  {
    id: "p1",
    type: "MCQ",
    skill: "VOCABULARY",
    level: "PRE_A1",
    question: "What color is the sky?",
    options: ["Red", "Blue", "Green", "Yellow"],
    correctAnswer: "Blue",
    explanationTh: "ท้องฟ้าสีน้ำเงิน (blue)",
    points: 1,
  },
  {
    id: "p2",
    type: "MCQ",
    skill: "VOCABULARY",
    level: "PRE_A1",
    question: "Which is a number?",
    options: ["Apple", "Cat", "Three", "Red"],
    correctAnswer: "Three",
    explanationTh: "Three (สาม) คือตัวเลข",
    points: 1,
  },
  {
    id: "p3",
    type: "TRUE_FALSE",
    skill: "VOCABULARY",
    level: "PRE_A1",
    question: 'A "dog" is an animal.',
    correctAnswer: "True",
    explanationTh: "dog (สุนัข) เป็นสัตว์",
    points: 1,
  },
  {
    id: "p4",
    type: "MCQ",
    skill: "VOCABULARY",
    level: "PRE_A1",
    question: "How many letters are in the English alphabet?",
    options: ["24", "25", "26", "27"],
    correctAnswer: "26",
    explanationTh: "ตัวอักษรภาษาอังกฤษมี 26 ตัว",
    points: 1,
  },
  {
    id: "p5",
    type: "FILL_BLANK",
    skill: "GRAMMAR",
    level: "PRE_A1",
    question: "I ___ a student. (am / is / are)",
    correctAnswer: "am",
    explanationTh: "ประธาน I ใช้ am",
    points: 1,
  },
  // ── A1 ───────────────────────────────────────────────────────────────────
  {
    id: "p6",
    type: "MCQ",
    skill: "GRAMMAR",
    level: "A1",
    question: "She ___ to school every day.",
    options: ["go", "goes", "going", "gone"],
    correctAnswer: "goes",
    explanationTh: "ประธาน She/He/It ใน Present Simple เติม -s/-es",
    points: 1,
  },
  {
    id: "p7",
    type: "MCQ",
    skill: "VOCABULARY",
    level: "A1",
    question: "What is the opposite of 'big'?",
    options: ["Tall", "Small", "Heavy", "Old"],
    correctAnswer: "Small",
    explanationTh: "คำตรงข้ามของ big (ใหญ่) คือ small (เล็ก)",
    points: 1,
  },
  {
    id: "p8",
    type: "TRUE_FALSE",
    skill: "GRAMMAR",
    level: "A1",
    question: '"They is happy" is correct English.',
    correctAnswer: "False",
    explanationTh: "ต้องเป็น They ARE happy — They ใช้ are",
    points: 1,
  },
  {
    id: "p9",
    type: "FILL_BLANK",
    skill: "GRAMMAR",
    level: "A1",
    question: "There ___ two cats on the sofa. (is / are / am)",
    correctAnswer: "are",
    explanationTh: "There are ใช้กับ plural noun",
    points: 1,
  },
  {
    id: "p10",
    type: "MCQ",
    skill: "READING",
    level: "A1",
    question: 'Read: "Tom is 10 years old. He likes football." How old is Tom?',
    options: ["8", "9", "10", "11"],
    correctAnswer: "10",
    explanationTh: "บทความบอกว่า Tom is 10 years old",
    points: 1,
  },
  // ── A2 ───────────────────────────────────────────────────────────────────
  {
    id: "p11",
    type: "MCQ",
    skill: "GRAMMAR",
    level: "A2",
    question: "I ___ dinner when she called.",
    options: ["cook", "cooked", "was cooking", "am cooking"],
    correctAnswer: "was cooking",
    explanationTh: "Past Continuous — กำลังทำอยู่เมื่อมีเหตุการณ์อื่นเกิดขึ้น",
    points: 1,
  },
  {
    id: "p12",
    type: "FILL_BLANK",
    skill: "GRAMMAR",
    level: "A2",
    question: "She ___ in Bangkok for five years before she moved. (lived / has lived / lives)",
    correctAnswer: "lived",
    explanationTh: "เหตุการณ์จบสิ้นแล้ว + ระยะเวลา → Past Simple",
    points: 1,
  },
  {
    id: "p13",
    type: "MCQ",
    skill: "VOCABULARY",
    level: "A2",
    question: "Which word means 'to travel somewhere for pleasure'?",
    options: ["Commute", "Migrate", "Journey", "Transport"],
    correctAnswer: "Journey",
    explanationTh: "Journey หมายถึงการเดินทาง โดยเฉพาะเพื่อความสุข",
    points: 1,
  },
  {
    id: "p14",
    type: "MCQ",
    skill: "READING",
    level: "A2",
    question: 'Read: "The shop opens at 9am and closes at 9pm Monday to Friday. On weekends it opens at 10am." When does the shop open on Saturday?',
    options: ["8am", "9am", "10am", "11am"],
    correctAnswer: "10am",
    explanationTh: "บทความระบุว่าวันหยุดสุดสัปดาห์เปิด 10am",
    points: 1,
  },
  {
    id: "p15",
    type: "TRUE_FALSE",
    skill: "GRAMMAR",
    level: "A2",
    question: '"Have you ever been to Paris?" is a correct question.',
    correctAnswer: "True",
    explanationTh: "Present Perfect ใช้ถาม experience ถูกต้อง",
    points: 1,
  },
  // ── B1 ───────────────────────────────────────────────────────────────────
  {
    id: "p16",
    type: "MCQ",
    skill: "GRAMMAR",
    level: "B1",
    question: "If I ___ more time, I would learn another language.",
    options: ["have", "had", "will have", "would have"],
    correctAnswer: "had",
    explanationTh: "Second Conditional: If + Past Simple, would + base verb",
    points: 1,
  },
  {
    id: "p17",
    type: "FILL_BLANK",
    skill: "GRAMMAR",
    level: "B1",
    question: "The report ___ by the manager yesterday. (wrote / was written / has written)",
    correctAnswer: "was written",
    explanationTh: "Passive Voice — Past Simple passive",
    points: 1,
  },
  {
    id: "p18",
    type: "MCQ",
    skill: "VOCABULARY",
    level: "B1",
    question: "Which word is closest in meaning to 'significant'?",
    options: ["Small", "Important", "Quiet", "Difficult"],
    correctAnswer: "Important",
    explanationTh: "Significant แปลว่า สำคัญ (important)",
    points: 1,
  },
  {
    id: "p19",
    type: "MCQ",
    skill: "READING",
    level: "B1",
    question: 'Read: "Despite the rain, the event was a great success. Over 500 people attended, which exceeded expectations." What can we infer?',
    options: [
      "The event was cancelled",
      "Fewer people attended than expected",
      "More people attended than expected",
      "The weather was good",
    ],
    correctAnswer: "More people attended than expected",
    explanationTh: '"exceeded expectations" หมายถึง มากกว่าที่คาดไว้',
    points: 1,
  },
  {
    id: "p20",
    type: "MCQ",
    skill: "GRAMMAR",
    level: "B1",
    question: "She asked me ___ I had finished the project.",
    options: ["that", "if", "what", "which"],
    correctAnswer: "if",
    explanationTh: "Reported question ใช้ if/whether สำหรับ yes/no question",
    points: 1,
  },
];

export function calculatePlacementResult(answers: Record<string, string>): {
  recommendedLevel: "PRE_A1" | "A1" | "A2" | "B1";
  totalScore: number;
  maxScore: number;
  skillBreakdown: Record<string, { score: number; max: number }>;
  strengths: string[];
  weaknesses: string[];
} {
  let totalScore = 0;
  const skillTotals: Record<string, { score: number; max: number }> = {
    VOCABULARY: { score: 0, max: 0 },
    GRAMMAR: { score: 0, max: 0 },
    READING: { score: 0, max: 0 },
  };

  for (const q of PLACEMENT_QUESTIONS) {
    const userAnswer = (answers[q.id] ?? "").trim().toLowerCase();
    const correct = q.correctAnswer.trim().toLowerCase();
    skillTotals[q.skill].max += q.points;
    if (userAnswer === correct) {
      totalScore += q.points;
      skillTotals[q.skill].score += q.points;
    }
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  for (const [skill, { score, max }] of Object.entries(skillTotals)) {
    const pct = max > 0 ? (score / max) * 100 : 0;
    if (pct >= 70) strengths.push(skill);
    else weaknesses.push(skill);
  }

  let recommendedLevel: "PRE_A1" | "A1" | "A2" | "B1";
  if (totalScore <= 5) recommendedLevel = "PRE_A1";
  else if (totalScore <= 9) recommendedLevel = "A1";
  else if (totalScore <= 14) recommendedLevel = "A2";
  else recommendedLevel = "B1";

  return {
    recommendedLevel,
    totalScore,
    maxScore: 20,
    skillBreakdown: skillTotals,
    strengths,
    weaknesses,
  };
}
