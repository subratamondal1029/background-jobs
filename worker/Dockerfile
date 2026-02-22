FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY ./worker/requirements.txt .
RUN pip install -r requirements.txt

COPY ./worker/main.py ./worker/get_random_response.py ./

CMD ["python3", "-u", "main.py"]