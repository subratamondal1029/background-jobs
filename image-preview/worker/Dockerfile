# Dev Dockerfile
FROM python:3.14-slim

WORKDIR /app

# install file-watcher for dev
RUN pip install watchfiles

# uv required
RUN pip install uv


CMD ["sh", "-c", "uv sync && watchfiles 'uv run main.py' ."]
