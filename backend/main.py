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
# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(SCRIPT_DIR, ".env.local"))
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    logger.warning("⚠️ GEMINI_API_KEY not found! Set it in .env.local")
    raise ValueError("GEMINI_API_KEY is required. Please set it in .env.local file")

logger.info(f"✅ API Key loaded successfully (starts with: {API_KEY[:10]}...)")

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
try:
    client = genai.Client(api_key=API_KEY)
    logger.info("✅ Gemini Client initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize Gemini Client: {e}")
    raise

# --- DATA MODELS ---
class MindMapRequest(BaseModel):
    subject: str
    syllabus_text: str
    timetable_text: str
    days: int = 14

class ChatRequest(BaseModel):
    message: str
    subject: str = ""
    language: str = "auto"  # auto-detect or specify: english, hindi, spanish, etc.
    context: str = ""  # Additional context like uploaded notes

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

# List of models to try (each has separate quota)
FALLBACK_MODELS = [
    "gemini-2.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash-lite",
    "gemini-exp-1206",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite", 
    "gemini-2.5-flash",
]

async def generate_with_fallback(prompt: str):
    """Try multiple models until one works (each has separate rate limits)"""
    last_error = None
    for model in FALLBACK_MODELS:
        try:
            logger.info(f"🔄 Trying model: {model}")
            response = client.models.generate_content(
                model=model,
                contents=prompt
            )
            logger.info(f"✅ Success with model: {model}")
            return response.text
        except Exception as e:
            error_msg = str(e)
            logger.warning(f"⚠️ {model} failed: {error_msg[:100]}")
            last_error = e
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                continue  # Try next model
            else:
                raise  # Re-raise non-quota errors
    
    # All models exhausted
    raise last_error

# --- ENDPOINTS ---

@app.get("/health")
async def health():
    return {"status": "healthy", "models": FALLBACK_MODELS}

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
        
        # Use fallback system to try multiple models
        response_text = await generate_with_fallback(prompt)
        return json.loads(clean_json_response(response_text))
    except Exception as e:
        error_msg = str(e)
        logger.error(f"AI Quiz Error: {e}")
        
        # Handle rate limiting specifically
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            raise HTTPException(
                status_code=429, 
                detail="API rate limit reached. Free tier allows 20 requests/day. Please wait a minute and try again."
            )
        raise HTTPException(status_code=500, detail=f"Generation Failed: {error_msg}")

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
        response_text = await generate_with_fallback(prompt)
        return json.loads(clean_json_response(response_text))
    except Exception as e:
        logger.error(f"AI Roadmap Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def ai_tutor_chat(request: ChatRequest):
    """
    Flexible AI Tutor that can:
    - Explain any educational topic
    - Respond in multiple languages
    - Solve numerical problems step-by-step
    - Provide real-life analogies
    """
    logger.info(f"💬 Chat Request: {request.message[:50]}...")
    
    try:
        # Build the system prompt for a flexible educational AI
        system_prompt = f"""You are EnWise AI Tutor - an extremely flexible, knowledgeable, and friendly educational assistant.

YOUR CAPABILITIES:
1. **Multilingual**: Detect the language of the user's question and respond in the SAME language. If they ask in Hindi, reply in Hindi. If Spanish, reply in Spanish. If they explicitly request a language (e.g., "explain in French"), use that language.

2. **Any Educational Topic**: You can explain ANY subject - Science, Math, History, Literature, Programming, Economics, Philosophy, Art, Music, Languages, and more.

3. **Adaptive Explanations**:
   - Use simple language for beginners
   - Use technical terms for advanced questions
   - Always include real-life analogies and examples
   - Break down complex concepts step-by-step

4. **Problem Solving**:
   - Solve mathematical/numerical problems with detailed steps
   - Show formulas, calculations, and explain each step
   - Provide practice problems when helpful

5. **Learning Support**:
   - Create mnemonics and memory tricks
   - Suggest study strategies
   - Clarify doubts patiently
   - Encourage the student

CURRENT CONTEXT:
- Subject being studied: {request.subject if request.subject else 'General'}
- Additional context: {request.context[:1000] if request.context else 'None provided'}

RESPONSE STYLE:
- Be warm, encouraging, and patient
- Use emojis sparingly for friendliness
- Format responses with clear sections
- Keep explanations concise but complete
- If unsure, admit it and suggest resources

Remember: You are here to make learning enjoyable and accessible!"""

        # Create the full prompt
        full_prompt = f"{system_prompt}\n\nStudent's Question: {request.message}"
        
        response_text = await generate_with_fallback(full_prompt)
        
        return {
            "response": response_text,
            "detected_language": "auto",
            "subject": request.subject
        }
        
    except Exception as e:
        logger.error(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")

@app.post("/generate-pyq-quiz")
async def generate_pyq_quiz(
    file: UploadFile = File(...), 
    subject: str = Form(...),
    num_questions: int = Form(5)
):
    """
    Analyze PYQ papers and generate practice questions based on the patterns
    """
    logger.info(f"📚 PYQ Quiz Request: {subject} - {file.filename}")
    content = await file.read()
    text = extract_text_from_pdf(content)

    if not text:
        raise HTTPException(status_code=400, detail="Could not read PDF text.")

    try:
        prompt = f"""
        You are analyzing a Previous Year Question paper for {subject}.
        
        PYQ Content: {text[:8000]}
        
        Based on the patterns, topics, and difficulty level in this PYQ paper:
        1. Identify the key topics that appear frequently
        2. Generate {num_questions} NEW practice questions similar to the PYQ style
        3. Include a mix of conceptual and numerical questions if applicable
        4. Make questions exam-ready with proper difficulty
        
        Return ONLY a valid JSON object in this exact format:
        {{
            "topics_found": ["Topic 1", "Topic 2", "Topic 3"],
            "difficulty": "Medium",
            "quiz": [
                {{
                    "q": "Question text here?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "a": "Option A",
                    "explanation": "Brief explanation of the correct answer"
                }}
            ]
        }}
        """
        
        response_text = await generate_with_fallback(prompt)
        
        result = json.loads(clean_json_response(response_text))
        return result
        
    except Exception as e:
        logger.error(f"PYQ Quiz Error: {e}")
        raise HTTPException(status_code=500, detail=f"PYQ Generation Failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 so teammate can connect over Wi-Fi
    uvicorn.run(app, host="0.0.0.0", port=8000)