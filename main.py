from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from google import genai  # THE NEW 2026 SDK
from google.genai import types 
import json
import fitz  # PyMuPDF

# --- 1. SETUP & ENVIRONMENT ---
load_dotenv()

# The Client now handles the API key and global configuration
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Use the latest stable 2.5 Flash model for reliability
MODEL_ID = "gemini-2.5-flash"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. DEFINE MODELS ---
class QuizRequest(BaseModel):
    topic: str
    difficulty: str

# --- 3. HELPERS ---
def extract_text_from_pdf(pdf_file: bytes) -> str:
    try:
        doc = fitz.open(stream=pdf_file, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

# --- 4. THE "DIAGNOSTIC & BRIDGE" ENDPOINT ---
@app.post("/generate-offline-pack")
async def generate_offline_pack(file: UploadFile = File(...)):
    print(f"🩺 Starting Diagnosis for: {file.filename}")
    
    content = await file.read()
    pdf_text = extract_text_from_pdf(content)[:15000]

    # Task prompt for adaptive learning diagnosis
    prompt = f"Identify prerequisite gaps and generate a Diagnostic JSON for these notes: {pdf_text}"

    try:
        # Using Structured Output configuration for Gemini
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                # SYSTEM INSTRUCTION: Sets the 'Professor Clone' persona
                system_instruction="You are a Professor Clone. Analyze the provided text for tone and adopt this persona. Always return valid JSON only.",
                response_mime_type="application/json",
            )
        )
        # Detailed log for terminal debugging
        print(f"Successfully generated diagnosis using {MODEL_ID}")
        return json.loads(response.text)
    except Exception as e:
        print(f"❌ DETAILED AI ERROR: {e}")
        return {"error": "Diagnosis failed. Check terminal for details."}

# --- 5. TRADITIONAL QUIZ ENDPOINT ---
@app.post("/generate-quiz")
async def generate_quiz(request: QuizRequest):
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=f"Create 5 {request.difficulty} quiz questions about {request.topic} as JSON.",
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return {"questions": json.loads(response.text)}
    except Exception as e:
        print(f"❌ Quiz Error: {e}")
        return {"questions": []}