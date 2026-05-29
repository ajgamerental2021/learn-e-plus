"use client";

import { useState } from "react";

export default function ExportPdfButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/export");
      const data = await res.json();

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const W = 210;
      let y = 20;

      // Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, W, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text("Learn E+ Progress Report", W / 2, 18, { align: "center" });
      doc.setFontSize(11);
      doc.text(`${data.name} — ${data.level}`, W / 2, 28, { align: "center" });
      doc.setFontSize(9);
      doc.text(`สร้างเมื่อ: ${data.generatedAt}`, W / 2, 36, { align: "center" });

      y = 55;
      doc.setTextColor(30, 30, 30);

      // Stats
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("สรุปผลการเรียน", 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const stats = [
        ["บทเรียนที่เรียนจบ", `${data.stats.lessonsCompleted} บท`],
        ["Streak ปัจจุบัน", `${data.stats.currentStreak} วัน`],
        ["Streak สูงสุด", `${data.stats.longestStreak} วัน`],
        ["คำศัพท์ที่จำได้", `${data.stats.masteredVocab} / ${data.stats.totalVocab} คำ`],
      ];
      for (const [label, value] of stats) {
        doc.text(`• ${label}: ${value}`, 25, y);
        y += 7;
      }

      y += 5;

      // Skills
      if (data.skills.length > 0) {
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("ทักษะ", 20, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        for (const s of data.skills) {
          doc.text(`${s.name}`, 25, y);
          // Bar
          doc.setFillColor(230, 230, 230);
          doc.rect(60, y - 4, 80, 5, "F");
          doc.setFillColor(s.score >= 70 ? 34 : s.score >= 50 ? 234 : 239,
                           s.score >= 70 ? 197 : s.score >= 50 ? 179 : 68,
                           s.score >= 70 ? 94 : s.score >= 50 ? 8 : 68);
          doc.rect(60, y - 4, 80 * (s.score / 100), 5, "F");
          doc.setTextColor(100, 100, 100);
          doc.text(`${s.score}%`, 145, y);
          doc.setTextColor(30, 30, 30);
          y += 8;
        }
        y += 3;
      }

      // Recent lessons
      if (data.recentLessons.length > 0) {
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("บทเรียนล่าสุด", 20, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        for (const l of data.recentLessons.slice(0, 15)) {
          if (y > 270) break;
          doc.text(`• ${l.name}`, 25, y);
          doc.setTextColor(150, 150, 150);
          doc.text(l.date, 170, y, { align: "right" });
          doc.setTextColor(30, 30, 30);
          y += 6;
        }
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Learn E+ — English Learning Platform", W / 2, 290, { align: "center" });

      doc.save(`learn-e-plus-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
    >
      {loading ? "⏳ กำลังสร้าง..." : "📄 Export PDF"}
    </button>
  );
}
