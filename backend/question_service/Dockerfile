# Use the same slim Python image
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy the question-service specific requirements
COPY requirements.txt .

# Install dependencies (this will include httpx for service communication)
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the question-service code
COPY . .

# Expose the internal port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]