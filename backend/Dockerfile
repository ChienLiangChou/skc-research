FROM python:3.11-slim

WORKDIR /app

# 安裝 poetry
RUN pip install poetry==1.7.1

# 複製 poetry 檔案
COPY pyproject.toml poetry.lock ./

# 安裝依賴
RUN poetry config virtualenvs.create false \
  && poetry install --no-interaction --no-ansi --only main

# 複製程式碼
COPY . .

# 啟動指令
CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "10000"] 