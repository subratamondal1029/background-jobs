# Dev Dockerfile
FROM python:3.14-slim

WORKDIR /app

# uv required
RUN pip install uv


CMD ["sh", "-c", "uv sync && uv run main.py"]
