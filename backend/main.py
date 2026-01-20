import os
import json
import fitz  # PyMuPDF
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List

# --- CONFIGURATION ---
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

# Allow Frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if API_KEY:
    genai.configure(api_key=API_KEY)

# --- DATA MODELS ---
class QuizRequest(BaseModel):
    topic: str
    difficulty: str = "medium"

class AnswerSubmission(BaseModel):
    question_id: int
    selected_option: str
    correct_option: str

class TimetableSlot(BaseModel):
    day: str
    free_slots: List[str]

# --- HELPER FUNCTIONS ---
def extract_text_from_pdf(file_bytes):
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except:
        return ""

def clean_json_response(response_text):
    return response_text.replace("```json", "").replace("```", "").strip()

# --- ENDPOINTS ---
@app.post("/generate-map")
async def generate_map(file: UploadFile = File(...)):
    print(f"📥 Generating Map for: {file.filename}")
    content = await file.read()
    text = extract_text_from_pdf(content)

    if not API_KEY:
        return {"nodes": [{"id": "1", "label": "Mock Topic", "type": "bridge", "status": "unlocked"}]}

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"Create a hierarchical learning path (JSON) for this text: {text[:4000]}"
        response = model.generate_content(prompt)
        return json.loads(clean_json_response(response.text))
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail="AI Generation Failed")

@app.post("/generate-quiz")
async def generate_quiz(request: QuizRequest):
    return {"questions": [{"id": 1, "text": "Mock Question?", "options": ["A", "B"], "answer": "A"}]}

@app.post("/submit-quiz")
async def submit_quiz(answers: List[AnswerSubmission]):
    return {"passed": True}

@app.post("/optimize-schedule")
async def optimize_schedule(timetable: TimetableSlot):
    return {"optimized_schedule": []}

# --- RUNNER ---
if __name__ == "__main__":
    import uvicorn
    print("🚀 Enwise Backend Live on Port 8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)