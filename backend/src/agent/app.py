from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File, Form
from fastapi.responses import StreamingResponse

app = FastAPI()

origins = [
    "https://skc-research-ear9.vercel.app",  # 新的 Vercel 前端網址
    "http://localhost:3000"  # 本地測試用
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

@app.post("/upload-and-analyze/progress")
async def upload_and_analyze(file: UploadFile = File(...), prompt: str = Form(...)):
    # 範例：模擬進度回報與假分析結果
    def event_stream():
        yield 'data: {"progress": 10, "stage": "開始分析"}\n\n'
        yield 'data: {"progress": 100, "stage": "完成", "result": {"summary": "分析完成", "investment_score": 90, "sources": []}}\n\n'
    return StreamingResponse(event_stream(), media_type="text/event-stream") 