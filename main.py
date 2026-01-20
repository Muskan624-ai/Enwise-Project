from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware
import json  # <--- Essential for safe parsing

# --- 1. SETUP ENV & KEY ---
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, ".env")
load_dotenv(env_path)

API_KEY = os.getenv("GEMINI_API_KEY")

print("--------------------------------------------------")
print(f"🔍 DEBUG CHECK:")
if API_KEY:
    print(f"   - API Key Found: ✅ YES")
    genai.configure(api_key=API_KEY)
else:
    print(f"   - API Key Found: ❌ NO")
print("--------------------------------------------------")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuizRequest(BaseModel):
    topic: str
    difficulty: str

@app.post("/generate-quiz")
async def generate_quiz(request: QuizRequest):
    print(f"📩 Request Received: {request.topic} ({request.difficulty})")
    
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
    Create 5 multiple choice questions about {request.topic}.
    Difficulty: {request.difficulty}.
    Return ONLY a raw JSON list. No markdown. No ```json```.
    Format:
    [
      {{
        "id": 1,
        "text": "Question?",
        "options": ["A", "B", "C", "D"],
        "answer": "Correct Option"
      }}
    ]
    """

    try:
        response = model.generate_content(prompt)
        # Clean markdown if Gemini adds it
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        
        # FIX: Use json.loads instead of eval()
        data = json.loads(clean_text)
        
        print("✅ Gemini Success! Sending real questions.")
        return {"questions": data}
        
    except Exception as e:
        print(f"❌ ERROR: Gemini Failed. Reason: {e}")
        print("⚠️  Switching to Mock Data...")
        
        return {
            "questions": [
                {
                    "id": 1,
                    "text": f"Mock Question about {request.topic}?",
                    "options": ["A", "B"],
                    "answer": "A"
                }
            ]
        }
# --- NEW: ROADMAP REQUEST MODEL ---
class RoadmapRequest(BaseModel):
    topic: str
    duration: str  # e.g., "4 weeks", "3 months"

# --- NEW: ROADMAP ENDPOINT ---
@app.post("/generate-map")
async def generate_map(request: RoadmapRequest):
    print(f"🗺️  Generating Roadmap for: {request.topic} ({request.duration})")
    
    # We use the same model you already set up
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
    Create a {request.duration} study roadmap for {request.topic}.
    Return ONLY a raw JSON list. No markdown.
    Format:
    [
      {{
        "week": 1,
        "theme": "Basics",
        "topics": ["Topic A", "Topic B"],
        "project": "Build a simple X"
      }}
    ]
    """
    
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)
        print("✅ Roadmap Generated Successfully!")
        return {"roadmap": data}
        
    except Exception as e:
        print(f"❌ Roadmap Error: {e}")
        return {"error": "Failed to generate roadmap"}
    
# --- NEW: GRADING REQUEST MODEL ---
class SubmitRequest(BaseModel):
    question: str
    user_answer: str
    correct_answer: str

# --- NEW: GRADING ENDPOINT ---
@app.post("/submit-quiz")
async def submit_quiz(request: SubmitRequest):
    print(f"📝 Grading Answer: {request.user_answer} (Correct: {request.correct_answer})")
    
    # Logic: If correct, just cheer. If wrong, ask AI to explain.
    is_correct = (request.user_answer.strip().lower() == request.correct_answer.strip().lower())
    
    if is_correct:
        return {
            "correct": True,
            "feedback": "🎉 Spot on! That is the correct answer."
        }
    else:
        # Ask Gemini to explain WHY it's wrong (The "AI Tutor" Feature)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # --- THE ENWISE PERSONA UPDATE IS HERE ---
        prompt = f"""
        The user answered "{request.user_answer}" to the question: "{request.question}".
        The correct answer was "{request.correct_answer}".
        Explain briefly (in 1 sentence) why the user is wrong and why the correct answer is right.
        You are Enwise, a wise and encouraging AI Tutor. Explain the mistake simply, using an analogy if possible.
        """
        
        try:
            response = model.generate_content(prompt)
            feedback = response.text.strip()
        except:
            feedback = f"Incorrect. The right answer was {request.correct_answer}."
            
        return {
            "correct": False,
            "feedback": feedback
        }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)