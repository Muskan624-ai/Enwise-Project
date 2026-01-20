import os
import json
import fitz  # PyMuPDF
# 1. Update the import
from google import genai
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# --- INITIALIZATION ---
load_dotenv(dotenv_path=".env.local") 
API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Initialize the new Client
client = genai.Client(api_key=API_KEY)

# (Keep your helper functions: extract_text_from_pdf and clean_json_response)

@app.post("/generate-offline-pack")
async def generate_offline_pack(
    file: UploadFile = File(...), 
    subject: str = Form(...), 
    chapter: str = Form(...)
):
    print(f"📥 Generating Prerequisite Quiz for: {subject} - {chapter}")
    content = await file.read()
    text = extract_text_from_pdf(content)

    if not text:
        raise HTTPException(status_code=400, detail="Could not read PDF text.")

    try:
        prompt = f"""
        Act as an expert tutor for {subject}. 
        Notes for {chapter}: {text[:5000]}
        Generate a 5-question PREREQUISITE quiz testing ONLY foundational knowledge.
        Return ONLY a JSON object: {{"summary": [], "quiz": [{{"q": "", "options": [], "a": ""}}]}}
        """
        
        # 3. Update the generation call
        response = client.models.generate_content(
            model="gemini-1.5-flash", 
            contents=prompt
        )
        
        return json.loads(clean_json_response(response.text))
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail="Prerequisite Analysis Failed")

if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 for teammate access
    uvicorn.run(app, host="0.0.0.0", port=8000)