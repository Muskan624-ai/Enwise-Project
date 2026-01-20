"""
Simple Test Backend for EnWise Quiz Generation
Run this to test the frontend connection before implementing full AI
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend connection

@app.route('/generate-offline-pack', methods=['POST'])
def generate_quiz():
    """Generate a test quiz based on uploaded file"""
    
    try:
        # Get uploaded file and metadata
        file = request.files.get('file')
        subject = request.form.get('subject', 'Unknown Subject')
        chapter = request.form.get('chapter', 'Unknown')
        
        if not file:
            return jsonify({"error": "No file uploaded"}), 400
        
        # Log the request
        print(f"\n✅ Received file: {file.filename}")
        print(f"   Subject: {subject}")
        print(f"   Chapter: {chapter}")
        
        # Generate sample quiz (replace this with your AI logic)
        quiz_data = {
            "quiz": {
                "questions": [
                    {
                        "question": f"What is the fundamental concept in {subject}?",
                        "options": [
                            "Basic principles and foundations",
                            "Advanced theoretical frameworks",
                            "Practical applications only",
                            "Historical development"
                        ],
                        "correct": 0
                    },
                    {
                        "question": f"Which prerequisite is essential for studying {subject}?",
                        "options": [
                            "No prerequisites needed",
                            "Foundation knowledge in related areas",
                            "Expert-level understanding",
                            "Industry experience"
                        ],
                        "correct": 1
                    },
                    {
                        "question": f"What is the best approach to learn {subject}?",
                        "options": [
                            "Memorize all formulas",
                            "Skip the basics",
                            "Build understanding step-by-step",
                            "Learn only when needed"
                        ],
                        "correct": 2
                    },
                    {
                        "question": f"How does {subject} relate to real-world problems?",
                        "options": [
                            "No practical applications",
                            "Only theoretical value",
                            "Direct applications in multiple fields",
                            "Limited to academic settings"
                        ],
                        "correct": 2
                    },
                    {
                        "question": f"What skill is most important for mastering {subject}?",
                        "options": [
                            "Speed in calculations",
                            "Understanding core concepts",
                            "Memorization ability",
                            "Previous experience"
                        ],
                        "correct": 1
                    }
                ]
            },
            "summary": {
                "topics": [
                    f"{subject} Fundamentals",
                    "Prerequisites",
                    "Learning Approach",
                    "Applications"
                ],
                "weakTopics": [],
                "source": chapter,
                "message": "Quiz generated successfully from uploaded file"
            }
        }
        
        print("✅ Quiz generated successfully!")
        return jsonify(quiz_data)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "running",
        "message": "EnWise Test Backend is working!"
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 EnWise Test Backend Server")
    print("="*60)
    print("📡 Server running on: http://localhost:5000")
    print("📝 Endpoint: POST /generate-offline-pack")
    print("❤️  Health check: GET /health")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
