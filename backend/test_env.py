#!/usr/bin/env python
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

print("Current working directory:", os.getcwd())
print("Script directory:", os.path.dirname(__file__))

env_path = os.path.join(os.path.dirname(__file__), ".env.local")
print(f"ENV path: {env_path}")
print(f"ENV file exists: {os.path.exists(env_path)}")

load_dotenv(dotenv_path=env_path)
api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key from environment: {api_key}")

if api_key:
    print("✅ API Key loaded successfully!")
    print(f"Key prefix: {api_key[:20]}...")
else:
    print("❌ API Key not found!")

# Now test genai
try:
    from google import genai
    print("\nTesting genai.Client initialization...")
    client = genai.Client(api_key=api_key)
    print("✅ genai.Client created successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
