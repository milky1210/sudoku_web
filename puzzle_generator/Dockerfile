FROM python:3.11-slim

WORKDIR /generator

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy generator scripts
COPY . .

# Run the generator
CMD ["python", "generate_puzzles.py"]
