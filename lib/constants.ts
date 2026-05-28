export const LEVELS = [
  { code: "PRE_A1", nameTh: "เริ่มต้น", nameEn: "Starter", order: 1 },
  { code: "A1", nameTh: "ผู้เริ่มต้น", nameEn: "Beginner", order: 2 },
  { code: "A2", nameTh: "ขั้นต้น", nameEn: "Elementary", order: 3 },
  { code: "B1", nameTh: "ระดับกลาง", nameEn: "Intermediate", order: 4 },
  { code: "B2", nameTh: "ระดับกลาง-สูง", nameEn: "Upper Intermediate", order: 5 },
  { code: "C1", nameTh: "ขั้นสูง", nameEn: "Advanced", order: 6 },
  { code: "C2", nameTh: "เชี่ยวชาญ", nameEn: "Proficiency", order: 7 },
] as const;

export const LEARNING_PATHS = [
  { code: "GENERAL", nameTh: "ภาษาอังกฤษทั่วไป" },
  { code: "DAILY_LIFE", nameTh: "ภาษาอังกฤษในชีวิตประจำวัน" },
  { code: "STUDENTS", nameTh: "ภาษาอังกฤษสำหรับนักเรียน" },
  { code: "WORK", nameTh: "ภาษาอังกฤษสำหรับงาน" },
  { code: "TOEIC", nameTh: "เตรียมสอบ TOEIC" },
  { code: "TOEFL", nameTh: "เตรียมสอบ TOEFL" },
  { code: "IELTS", nameTh: "เตรียมสอบ IELTS" },
] as const;

export const SKILL_LABELS: Record<string, string> = {
  VOCABULARY: "คำศัพท์",
  GRAMMAR: "ไวยากรณ์",
  LISTENING: "การฟัง",
  SPEAKING: "การพูด",
  READING: "การอ่าน",
  WRITING: "การเขียน",
};

export const DAILY_GOAL_OPTIONS = [5, 10, 15, 30] as const;

export const AGE_GROUPS = [
  { code: "CHILD", label: "เด็ก (น้อยกว่า 12 ปี)" },
  { code: "TEEN", label: "วัยรุ่น (12–17 ปี)" },
  { code: "YOUNG_ADULT", label: "นักศึกษา / วัยรุ่นตอนปลาย (18–25 ปี)" },
  { code: "ADULT", label: "วัยทำงาน (26–45 ปี)" },
  { code: "SENIOR", label: "ผู้ใหญ่ (46 ปีขึ้นไป)" },
] as const;

export const STREAK_BADGES = [3, 7, 30, 100] as const;
