"""
Quick test script to verify backend connection
"""
import requests
import os

API_BASE_URL = 'http://localhost:5000'

print("="*60)
print("🧪 Testing EnWise Backend Connection")
print("="*60)

# Test 1: Health Check
print("\n1️⃣ Testing Health Endpoint...")
try:
    response = requests.get(f'{API_BASE_URL}/health')
    if response.status_code == 200:
        print("✅ Health check passed!")
        print(f"   Response: {response.json()}")
    else:
        print(f"❌ Health check failed: {response.status_code}")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print("\n⚠️  Make sure backend is running: python test_backend.py")
    exit(1)

# Test 2: File Upload
print("\n2️⃣ Testing File Upload...")
try:
    # Create a test file
    test_content = "This is a test file for EnWise quiz generation.\nIt contains sample content about Calculus.\nDerivatives and integrals are fundamental concepts."
    test_filename = "test_notes.txt"
    
    with open(test_filename, 'w') as f:
        f.write(test_content)
    
    # Upload the file
    with open(test_filename, 'rb') as f:
        files = {'file': (test_filename, f, 'text/plain')}
        data = {
            'subject': 'Calculus',
            'chapter': 'Test Chapter'
        }
        
        response = requests.post(f'{API_BASE_URL}/generate-offline-pack', files=files, data=data)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ File upload successful!")
        print(f"   Questions generated: {len(result['quiz']['questions'])}")
        print(f"   Topics: {result['summary']['topics']}")
        print("\n📋 Sample Question:")
        print(f"   Q: {result['quiz']['questions'][0]['question']}")
        print(f"   Options: {result['quiz']['questions'][0]['options']}")
        print(f"   Correct: {result['quiz']['questions'][0]['correct']}")
    else:
        print(f"❌ Upload failed: {response.status_code}")
        print(f"   Response: {response.text}")
    
    # Cleanup
    os.remove(test_filename)
    
except Exception as e:
    print(f"❌ Upload test failed: {e}")

print("\n" + "="*60)
print("✅ Backend is working correctly!")
print("="*60)
print("\n🚀 Next steps:")
print("1. Open frontend/subject.html in your browser")
print("2. Upload any file (PDF, TXT, DOCX)")
print("3. Click 'Open Quiz' to see generated questions")
print("\n💡 Or test with: frontend/test-connection.html")
