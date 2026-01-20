import os
import json
import fitz  # PyMuPDF
from google import genai
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List
import logging

# --- SETUP LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- INITIALIZATION ---
load_dotenv(dotenv_path=".env.local") 
API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI(title="Enwise AI Backend")

# Enable CORS for teammate access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the Client with Gemini 2.5 capabilities
client = genai.Client(api_key=API_KEY)

# --- DATA MODELS ---
class MindMapRequest(BaseModel):
    subject: str
    syllabus_text: str
    timetable_text: str
    days: int = 14

# --- HELPER FUNCTIONS ---
def extract_text_from_pdf(file_bytes):
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = "".join([page.get_text() for page in doc])
        doc.close()
        return text
    except Exception as e:
        logger.error(f"PDF Extraction Error: {e}")
        return ""

def clean_json_response(response_text):
    """Extracts JSON from markdown-wrapped AI responses"""
    text = response_text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
    
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        text = text[start:end+1]
    return text.strip()

# --- ENDPOINTS ---

@app.get("/health")
async def health():
    return {"status": "healthy", "model": "gemini-2.5-flash"}

@app.post("/generate-offline-pack")
async def generate_offline_pack(
    file: UploadFile = File(...), 
    subject: str = Form(...), 
    chapter: str = Form(...)
):
    logger.info(f"📥 Quiz Request: {subject} - {chapter}")
    content = await file.read()
    text = extract_text_from_pdf(content)

    if not text:
        raise HTTPException(status_code=400, detail="Could not read PDF text.")

    try:
        prompt = f"""
        Act as an expert tutor for {subject}. 
        Material for {chapter}: {text[:6000]}
        Generate a 5-question PREREQUISITE quiz testing ONLY foundational knowledge.
        Return ONLY a JSON object: {{"summary": ["Key Concept 1"], "quiz": [{{"q": "Quest?", "options": ["A","B","C","D"], "a": "A"}}]}}
        """
        
        # Using the verified Gemini 2.5 Flash model
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=prompt
        )
        return json.loads(clean_json_response(response.text))
    except Exception as e:
        logger.error(f"AI Quiz Error: {e}")
        raise HTTPException(status_code=500, detail=f"Generation Failed: {str(e)}")

@app.post("/generate-14-day-plan")
async def generate_14_day_plan(request: MindMapRequest):
    logger.info(f"📥 Generating 14-Day Roadmap for: {request.subject}")
    try:
        prompt = f"""
        Subject: {request.subject}
        Syllabus: {request.syllabus_text[:4000]}
        Timetable: {request.timetable_text[:3000]}
        
        Create a 14-day study roadmap. Map syllabus topics to the free slots in the timetable.
        Return ONLY a JSON object: 
        {{
            "root": "{request.subject} Plan", 
            "days": [{{
                "day": 1, 
                "topic": "Topic Name", 
                "subtopics": ["Part 1", "Part 2"],
                "duration": "2 hours"
            }}]
        }}
        """
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=prompt
        )
        return json.loads(clean_json_response(response.text))
    except Exception as e:
        logger.error(f"AI Roadmap Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 so teammate can connect over Wi-Fi
    uvicorn.run(app, host="0.0.0.0", port=8000)