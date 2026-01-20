# Backend Integration Setup

## ✅ Frontend is Ready!

Your upload boxes are now functional and will send files to the Python backend.

## 🔧 What's Configured

1. **File Upload Boxes**: Click any sidebar card (Syllabus, ClassNotes) to upload files
2. **Backend URL**: Currently set to `http://localhost:5000`
3. **API Endpoint**: `/generate-offline-pack`

## 📋 What Happens When You Upload

1. User clicks Syllabus/Notes card → File picker opens
2. User selects a file → File is sent to backend API
3. Backend processes file → Returns quiz and summary JSON
4. Quiz data stored in browser → "Open Quiz" button appears
5. User clicks button → Opens quiz in new tab

## 🐍 Backend Requirements

Your Python backend needs to:

### Endpoint: `POST /generate-offline-pack`

**Expected Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file`: The uploaded file (PDF, DOC, TXT, etc.)
  - `subject`: Subject name (e.g., "Calculus")
  - `chapter`: Type of upload ("Syllabus" or "Notes")

**Expected Response:**
```json
{
  "quiz": {
    "questions": [
      {
        "question": "What is integration?",
        "options": ["Derivative inverse", "Multiplication", "Division", "Addition"],
        "correct": 0
      },
      {
        "question": "What is the power rule?",
        "options": ["n*x^(n-1)", "x^n", "n+x", "x/n"],
        "correct": 0
      }
    ]
  },
  "summary": {
    "topics": ["Integration", "Derivatives", "Limits"],
    "weakTopics": [],
    "source": "syllabus"
  }
}
```

**Alternative Format (also supported):**
```json
{
  "quiz": [
    {
      "q": "What is integration?",
      "options": ["Derivative inverse", "Multiplication", "Division", "Addition"],
      "a": "Derivative inverse"
    }
  ],
  "summary": {
    "topics": ["Integration"]
  }
}
```

**Important Notes:**
- The frontend will convert `quiz.questions[i].correct` (index) to the actual answer text
- Or you can provide the answer directly as `a` property with the exact text
- Questions are automatically formatted for the quiz page

## 🔄 Fallback Behavior

If the backend is **not running**:
- User sees error: "Make sure the Python backend is running at http://localhost:5000"
- File still marked as uploaded (✓ appears)
- Can still click "Generate Quiz" button for demo/local quiz

## ⚙️ Change Backend URL

To use a different backend URL, edit `subject.html` line 236:

```javascript
const API_BASE_URL = 'http://your-backend-url:port';
```

## 📦 Data Storage

Quiz data is stored in browser's `localStorage`:
- `latest_quiz_data`: Full quiz JSON
- `latest_summary_data`: Analysis summary

This allows the quiz page to access the data even after navigation.

## 🧪 Testing Without Backend

The upload boxes work without a backend - they just won't get AI-generated quizzes. The UI will still update and you can use the local quiz generation as a fallback.
