// @ts-nocheck
import React, { useRef } from "react";
import html2pdf from "html2pdf.js";

export default function AnalysisCard({ content }: { content: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  // PDF 下載功能
  const handleDownloadPDF = () => {
    const element = cardRef.current;
    const opt = {
      margin:       [0.5, 0.5], // top, left (inch)
      filename:     'analysis.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'avoid-all' }
    };
    if (element) html2pdf().from(element).set(opt).save();
  };

  return (
    <div className="w-[80vw] max-w-6xl mx-auto mt-12 flex flex-col items-center">
      {/* 橫向寬大的卡片，左右有明顯留白，陰影、圓角、卡片樣式 */}
      <div
        ref={cardRef}
        className="bg-[#21304D] text-white rounded-2xl shadow-xl p-8 w-full"
        style={{
          minHeight: "320px",
          maxHeight: "70vh",
          overflowY: "auto",
          boxSizing: "border-box",
          letterSpacing: "0.5px",
        }}
      >
        {/* 內容：自動換行、分段 */}
        {content
          .split(/\n{2,}/)
          .map((para, idx) =>
            <p key={idx} className="mb-6 whitespace-pre-wrap leading-relaxed">{para.trim()}</p>
          )}
      </div>
      {/* 下載 PDF 按鈕 */}
      <button
        className="mt-6 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-lg rounded-xl font-semibold shadow-md transition"
        onClick={handleDownloadPDF}
      >
        下載 PDF
      </button>
    </div>
  );
} 