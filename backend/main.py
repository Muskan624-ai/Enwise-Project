import os
import json
import fitz  # PyMuPDF
from google import genai
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List, Optional
import logging
from datetime import datetime

# --- SETUP LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# --- INITIALIZATION ---
load_dotenv(dotenv_path=".env.local") 
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")
    raise ValueError("Please set GEMINI_API_KEY in .env.local file")

app = FastAPI(
    title="Study Planner API",
    description="API for generating prerequisite quizzes and study plans from PDFs",
    version="1.0.0"
)

# --- STEP 1: ENABLE CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini client
try:
    client = genai.Client(api_key=API_KEY)
    logger.info("Gemini client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Gemini client: {e}")
    raise

# --- DATA MODELS ---
class MindMapRequest(BaseModel):
    subject: str
    syllabus_text: str
    timetable_text: str
    days: int = 14

class QuizResponse(BaseModel):
    summary: List[str]
    quiz: List[dict]

class StudyPlanResponse(BaseModel):
    root: str
    days: List[dict]

# --- HELPER FUNCTIONS ---
def validate_pdf(file_bytes: bytes) -> bool:
    """Check if the file is a valid PDF"""
    if len(file_bytes) < 4:
        return False
    # Check PDF magic number
    return file_bytes[:4] == b'%PDF'

def extract_text_from_pdf(file_bytes: bytes, max_size_mb: int = 20) -> str:
    """
    Extract text from PDF with validation and error handling
    
    Args:
        file_bytes: PDF file as bytes
        max_size_mb: Maximum file size in MB
    
    Returns:
        Extracted text as string
    """
    try:
        # Validate file size
        max_bytes = max_size_mb * 1024 * 1024
        if len(file_bytes) > max_bytes:
            raise ValueError(f"PDF file too large. Maximum size is {max_size_mb}MB")
        
        # Validate PDF format
        if not validate_pdf(file_bytes):
            raise ValueError("Invalid PDF file format")
        
        # Extract text using PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        extracted_text = []
        
        for page_num, page in enumerate(doc, 1):
            try:
                text = page.get_text()
                if text.strip():
                    extracted_text.append(f"--- Page {page_num} ---\n{text}")
                else:
                    # Try to extract text from images/OCR if needed
                    # You could add OCR here if needed
                    extracted_text.append(f"--- Page {page_num} ---\n[No extractable text found]")
            except Exception as page_error:
                logger.warning(f"Error extracting text from page {page_num}: {page_error}")
                extracted_text.append(f"--- Page {page_num} ---\n[Error extracting text]")
        
        doc.close()
        
        full_text = "\n\n".join(extracted_text)
        logger.info(f"Successfully extracted text from PDF ({len(full_text)} characters)")
        
        return full_text[:10000]  # Limit to first 10k characters for API
        
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")

def clean_json_response(response_text: str) -> str:
    """
    Robustly extracts JSON from Gemini response
    
    Args:
        response_text: Raw response from Gemini API
    
    Returns:
        Clean JSON string
    """
    text = response_text.strip()
    
    # Remove markdown code blocks
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        # Handle generic code blocks
        parts = text.split("```")
        if len(parts) >= 3:
            text = parts[1].strip()
            # Check if it starts with json or { after stripping
            if text.startswith("json"):
                text = text[4:].strip()
    
    # Sometimes Gemini adds explanations before/after JSON
    # Try to find JSON object boundaries
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        text = text[start_idx:end_idx + 1]
    
    return text.strip()

# --- HEALTH CHECK ENDPOINT ---
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "active",
        "service": "Study Planner API",
        "version": "1.0.0",
        "endpoints": [
            "/generate-offline-pack (POST)",
            "/generate-14-day-plan (POST)"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Study Planner API"
    }

# --- STEP 2: PREREQUISITE QUIZ ENDPOINT ---
@app.post("/generate-offline-pack", response_model=QuizResponse)
async def generate_offline_pack(
    file: UploadFile = File(...), 
    subject: str = Form(...), 
    chapter: str = Form(...)
):
    """
    Generate a prerequisite quiz from a PDF document
    
    Args:
        file: PDF file containing study material
        subject: Subject name (e.g., "Mathematics")
        chapter: Chapter name (e.g., "Calculus")
    
    Returns:
        JSON with summary and quiz questions
    """
    logger.info(f"📥 Generating Prerequisite Quiz for: {subject} - {chapter}")
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400, 
            detail="Only PDF files are supported"
        )
    
    try:
        # Read and extract text from PDF
        content = await file.read()
        text = extract_text_from_pdf(content)
        
        if not text or len(text.strip()) < 100:
            raise HTTPException(
                status_code=400, 
                detail="PDF contains too little text or could not be extracted properly"
            )
        
        logger.info(f"Extracted {len(text)} characters from PDF")
        
        # Create prompt for Gemini
        prompt = f"""
        Act as an expert tutor for {subject}. 
        
        CHAPTER: {chapter}
        
        STUDY MATERIAL (first 5000 characters):
        {text[:5000]}
        
        TASK: Generate a 5-question PREREQUISITE quiz testing ONLY foundational knowledge needed for this chapter.
        
        GUIDELINES:
        1. Focus on concepts that MUST be understood before starting this chapter
        2. Questions should be multiple choice with 4 options each
        3. Include clear, concise explanations for correct answers
        4. Make questions practical and application-based when possible
        
        RETURN FORMAT (JSON ONLY):
        {{
            "summary": [
                "Key prerequisite concept 1",
                "Key prerequisite concept 2",
                "Key prerequisite concept 3",
                "Key prerequisite concept 4",
                "Key prerequisite concept 5"
            ],
            "quiz": [
                {{
                    "q": "Question text here?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "a": "Correct answer text (matching exactly one option)",
                    "explanation": "Brief explanation of why this is correct"
                }}
            ]
        }}
        
        IMPORTANT: Return ONLY the JSON object, no additional text.
        """
        
        # Call Gemini API
        logger.info("Calling Gemini API for quiz generation...")
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        
        # Process response
        cleaned_response = clean_json_response(response.text)
        logger.info(f"Received response from Gemini: {len(cleaned_response)} characters")
        
        try:
            result = json.loads(cleaned_response)
            
            # Validate response structure
            if "summary" not in result or "quiz" not in result:
                raise ValueError("Invalid response structure from Gemini")
            
            if len(result["quiz"]) != 5:
                logger.warning(f"Expected 5 questions, got {len(result['quiz'])}")
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            logger.error(f"Raw response: {response.text[:500]}")
            raise HTTPException(
                status_code=500, 
                detail="Failed to parse AI response. Please try again."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_offline_pack: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )

# --- STEP 3: 14-DAY MINDMAP ENDPOINT ---
@app.post("/generate-14-day-plan", response_model=StudyPlanResponse)
async def generate_14_day_plan(request: MindMapRequest):
    """
    Creates a study roadmap by mapping syllabus topics to free slots in the timetable
    
    Args:
        request: Contains subject, syllabus text, timetable text, and days
    
    Returns:
        JSON with 14-day study plan
    """
    logger.info(f"📥 Building {request.days}-Day Study Plan for: {request.subject}")
    
    try:
        # Prepare the prompt
        prompt = f"""
        Act as a Study Architect for {request.subject}.
        
        SYLLABUS CONTENT (first 3000 characters):
        {request.syllabus_text[:3000]}
        
        TIMETABLE/SCHEDULE (first 2000 characters):
        {request.timetable_text[:2000]}
        
        TASK: Create a {request.days}-day personalized study plan. 
        
        INSTRUCTIONS:
        1. Analyze the syllabus and break it into logical topics/subtopics
        2. Analyze the timetable to identify free time slots
        3. Distribute topics across {request.days} days based on:
           - Topic difficulty/complexity
           - Available study time each day
           - Logical progression of concepts
           - Time needed for revision
        4. Include specific topics and subtopics for each day
        5. Allocate time for review sessions
        
        RETURN FORMAT (JSON ONLY):
        {{
            "root": "{request.subject} {request.days}-Day Roadmap",
            "days": [
                {{
                    "day": 1,
                    "date": "Optional: suggested date if timetable provides",
                    "topic": "Specific Topic Name",
                    "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"],
                    "duration": "Suggested time (e.g., '2 hours')",
                    "time_slot": "Recommended time of day (e.g., 'Morning')",
                    "status": "pending",
                    "resources": ["Textbook Chapter X", "Practice Problems Y"],
                    "learning_objectives": ["Understand concept A", "Solve problems of type B"]
                }},
                ... repeat for all {request.days} days
            ],
            "meta": {{
                "total_topics": "number",
                "total_study_hours": "number",
                "revision_days": "number"
            }}
        }}
        
        IMPORTANT: 
        - Make the plan realistic and achievable
        - Consider difficulty level when allocating time
        - Include at least 2 revision days in the {request.days}-day period
        - Return ONLY the JSON object, no additional text.
        """
        
        # Call Gemini API
        logger.info("Calling Gemini API for study plan generation...")
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        
        # Process response
        cleaned_response = clean_json_response(response.text)
        logger.info(f"Received response from Gemini: {len(cleaned_response)} characters")
        
        try:
            result = json.loads(cleaned_response)
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            logger.error(f"Raw response: {response.text[:500]}")
            
            # Provide a fallback response
            return {
                "root": f"{request.subject} {request.days}-Day Roadmap",
                "days": [
                    {
                        "day": i,
                        "topic": f"Topic {i}",
                        "subtopics": ["Study and practice"],
                        "status": "pending"
                    }
                    for i in range(1, request.days + 1)
                ]
            }
            
    except Exception as e:
        logger.error(f"Error in generate_14_day_plan: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate study plan: {str(e)}"
        )

# --- UTILITY ENDPOINTS ---
@app.post("/extract-pdf-text")
async def extract_pdf_only(file: UploadFile = File(...)):
    """
    Utility endpoint to extract text from PDF without analysis
    """
    try:
        content = await file.read()
        text = extract_text_from_pdf(content)
        return {
            "filename": file.filename,
            "text_length": len(text),
            "text_preview": text[:500] + "..." if len(text) > 500 else text
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting Study Planner API server...")
    logger.info("Server will run on: http://0.0.0.0:8000")
    logger.info("API Documentation: http://0.0.0.0:8000/docs")
    
    uvicorn.run(
        app, 
        host="0.0.0.0",  # Critical for team access
        port=8000,
        log_level="info"
    )
    