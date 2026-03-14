FROM python:3.13-slim

# Prevent Python from buffering stdout/stderr and writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the service code
COPY . .

EXPOSE 8000

# host 0.0.0.0 is required to map the port to your machine
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]