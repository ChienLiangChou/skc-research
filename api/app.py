from fastapi import FastAPI, Response, UploadFile, File, HTTPException, Request, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pathlib
from .utils import extract_text_from_file
from .graph import graph
from langchain_core.messages import HumanMessage
import asyncio
import json

# Define the FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://skc-research-35nnjw7i1-skc-realty-teams-projects.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_frontend_router(build_dir="../frontend/dist"):
    """Creates a router to serve the React frontend.

    Args:
        build_dir: Path to the React build directory relative to this file.

    Returns:
        A Starlette application serving the frontend.
    """
    build_path = pathlib.Path(__file__).parent.parent.parent / build_dir

    if not build_path.is_dir() or not (build_path / "index.html").is_file():
        print(
            f"WARN: Frontend build directory not found or incomplete at {build_path}. Serving frontend will likely fail."
        )
        # Return a dummy router if build isn't ready
        from starlette.routing import Route

        async def dummy_frontend(request):
            return Response(
                "Frontend not built. Run 'npm run build' in the frontend directory.",
                media_type="text/plain",
                status_code=503,
            )

        return Route("/{path:path}", endpoint=dummy_frontend)

    return StaticFiles(directory=build_path, html=True)


# Mount the frontend under /app to not conflict with the LangGraph API routes
app.mount(
    "/app",
    create_frontend_router(),
    name="frontend",
)

@app.post("/upload-and-analyze/progress")
@app.post("/upload-and-analyze/progress/")
async def upload_and_analyze_progress(request: Request, file: UploadFile = File(...), prompt: str = Form("")):
    file_bytes = await file.read()  # 只讀一次
    async def event_stream():
        try:
            yield f"data: {{\"progress\": 10, \"stage\": \"檔案解析中...\"}}\n\n"
            await asyncio.sleep(0.2)
            text = extract_text_from_file(file_bytes, file.filename)
            yield f"data: {{\"progress\": 30, \"stage\": \"產生查詢...\"}}\n\n"
            await asyncio.sleep(0.2)
            # 自動偵測語言並加上語言指示
            def contains_chinese(s):
                return any('\u4e00' <= c <= '\u9fff' for c in s)
            if prompt:
                if contains_chinese(prompt):
                    lang_prefix = "請用繁體中文回答。"
                else:
                    lang_prefix = "Please answer in English."
                combined = f"{lang_prefix}\n【分析需求】\n{prompt}\n\n【PDF內容】\n{text}"
            else:
                combined = text
            state = {"messages": [HumanMessage(content=text)]}
            yield f"data: {{\"progress\": 50, \"stage\": \"進行網路搜尋...\"}}\n\n"
            await asyncio.sleep(0.2)
            result = graph.invoke(state)
            yield f"data: {{\"progress\": 80, \"stage\": \"彙整分析...\"}}\n\n"
            await asyncio.sleep(0.2)
            messages = result.get("messages", [])
            summary = messages[-1].content if messages else ""
            sources = result.get("sources_gathered", [])
            investment_score = min(100, max(0, 60 + len(sources) * 10))
            result_dict = {
                "progress": 100,
                "stage": "完成",
                "result": {
                    "summary": summary,
                    "investment_score": investment_score,
                    "sources": [s["value"] for s in sources],
                },
            }
            yield f"data: {json.dumps(result_dict, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"
    response = StreamingResponse(event_stream(), media_type="text/event-stream")
    response.headers["Access-Control-Allow-Origin"] = "https://skc-research-35nnjw7i1-skc-realty-teams-projects.vercel.app"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

from fastapi import Response

@app.options("/upload-and-analyze/progress")
@app.options("/upload-and-analyze/progress/")
async def options_upload_and_analyze_progress():
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = "https://skc-research-35nnjw7i1-skc-realty-teams-projects.vercel.app"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.get("/health")
def health():
    return {"status": "ok"}