// @ts-nocheck
import React, { useState, useRef } from "react";
import html2pdf from "html2pdf.js";

const allowedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export default function UploadWithProgress() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [promptSubmitted, setPromptSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultBoxRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setError("只支援 PDF, DOCX, TXT 檔案");
      return;
    }
    setSelectedFile(file);
    setResult(null);
    setError("");
    setPrompt("");
    setPromptSubmitted(false);
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !prompt.trim()) return;
    setPromptSubmitted(true);
    uploadFile(selectedFile, prompt);
  };

  const uploadFile = (file: File, prompt: string) => {
    setUploading(true);
    setProgress(0);
    setStage("");
    setError("");
    setResult(null); 
    const formData = new FormData();
    formData.append("file", file);
    formData.append("prompt", prompt);
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    if (!API_BASE_URL) {
      setError("VITE_API_URL 未設定，請聯絡管理員。");
      setUploading(false);
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/upload-and-analyze/progress`);
    xhr.setRequestHeader("Accept", "text/event-stream");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        const lines = xhr.responseText.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              if (data.progress !== undefined) {
                setProgress(data.progress);
                setStage(data.stage || "");
              }
              if (data.result) {
                setResult(data.result);
                setUploading(false);
              }
              if (data.error) {
                setError(data.error);
                setUploading(false);
              }
            } catch {}
          }
        }
      }
    };
    xhr.onerror = (error) => {
      setUploading(false);
      setError("網路錯誤，請確認後端已啟動於 2024 port 並重試");
    };
    xhr.send(formData);
  };

  return (
    <div style={{ minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#23272f' }}>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: 1 }}>AI Real Estate Analysis</h1>
        <div style={{ color: '#bbb', fontSize: 12, margin: 0 }}>歡迎，請上傳檔案並輸入分析需求</div>
        <div style={{ width: '80vw', maxWidth: 1100, minWidth: 600, margin: '0 auto', padding: 6, background: '#23272f', borderRadius: 10, boxShadow: '0 2px 6px #0002', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 4 }}>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                height: 40,
                fontSize: 16,
                padding: '0 32px',
                borderRadius: 12,
                background: uploading ? '#888' : 'linear-gradient(90deg, #22d3ee 0%, #4ade80 100%)',
                color: '#23272f',
                fontWeight: 700,
                boxShadow: uploading ? 'none' : '0 4px 24px #22d3ee88, 0 1.5px 0 #fff8 inset',
                border: 'none',
                outline: uploading ? 'none' : '2px solid #22d3ee',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                marginBottom: 8,
              }}
            >
              選擇檔案上傳
            </button>
            {selectedFile && !promptSubmitted && (
              <form onSubmit={handlePromptSubmit} style={{ width: "100%", marginTop: 16 }}>
                <label style={{ color: "#fff", fontWeight: 500, marginBottom: 8, display: "block" }}>請輸入分析提示詞（可用繁體中文或英文）：</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="請輸入你想要的分析內容，例如：請用繁體中文分析這份房地產文件的投資價值..."
                  style={{ width: "100%", minHeight: 56, fontSize: 16, borderRadius: 6, border: "1px solid #444", padding: 12, marginBottom: 12, color: "#23272f", background: "#fff", resize: "vertical" }}
                  disabled={uploading}
                />
                <button type="submit" style={{ padding: "10px 28px", background: uploading ? "#888" : "#22c55e", color: "#fff", border: "none", borderRadius: 6, fontSize: 16, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer" }} disabled={uploading || !prompt.trim()}>
                  送出分析
                </button>
              </form>
            )}
            {uploading && (
              <div style={{ width: "100%", marginTop: 8 }}>
                <div style={{ background: "#333", borderRadius: 4, height: 18, width: "100%", overflow: "hidden" }}>
                  <div style={{ background: "#4ade80", width: `${progress}%`, height: "100%", transition: "width 0.2s" }} />
                </div>
                <div style={{ color: "#fff", marginTop: 4, textAlign: "center" }}>{progress}% {stage && `- ${stage}`}</div>
              </div>
            )}
            {error && <div style={{ color: "#f87171", marginTop: 16, fontWeight: 500 }}>{error}</div>}
          </div>
          {result && (
            <>
              <div style={{
                width: '80vw',
                maxWidth: 1100,
                minWidth: 600,
                margin: '40px auto 0 auto',
                background: '#21304D',
                borderRadius: 22,
                boxShadow: '0 8px 32px 0 rgba(30,41,59,0.25), 0 2px 8px 0 #0006, 0 1.5px 0 #3b82f6 inset',
                border: '2.5px solid #2563eb',
                color: '#fff',
                maxHeight: '60vh',
                overflowY: 'auto',
                padding: 36,
                boxSizing: 'border-box',
                fontSize: 18,
                lineHeight: 1.7,
                letterSpacing: '0.01em',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                whiteSpace: 'pre-line',
              }} ref={resultBoxRef}>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>分析結果</div>
                <div style={{ marginBottom: 16 }}><b>摘要：</b>{result.summary}</div>
                <div style={{ marginBottom: 16 }}><b>投資評分：</b>{result.investment_score}</div>
                <div><b>來源：</b>{result.sources && result.sources.map((src: string, i: number) => (
                  <div key={i}><a href={src} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa" }}>{src}</a></div>
                ))}</div>
              </div>
              <div style={{ width: '80vw', maxWidth: 1100, minWidth: 600, margin: '0 auto', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    if (!resultBoxRef.current) return;
                    html2pdf().from(resultBoxRef.current).set({
                      margin: [0.5, 0.5],
                      filename: 'analysis.pdf',
                      image: { type: 'jpeg', quality: 0.98 },
                      html2canvas: { scale: 2 },
                      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
                      pagebreak: { mode: 'avoid-all' }
                    }).save();
                  }}
                  style={{
                    marginTop: 16,
                    padding: '12px 36px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 18,
                    fontWeight: 700,
                    boxShadow: '0 2px 8px #2563eb88',
                    cursor: 'pointer',
                    transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                  }}
                >下載 PDF</button>
              </div>
            </>
          )}
        </div>
    </div>
  );
} 