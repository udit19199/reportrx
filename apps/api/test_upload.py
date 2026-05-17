#!/usr/bin/env python3
"""
Test script to verify the complete upload and processing flow.

Run this after:
1. Starting the API server: python -m src.main (or uvicorn)
2. Starting Ollama with gpt-oss-20b and nomic-embed-text
3. Creating test data with: python test_upload.py --setup

Usage:
    python test_upload.py --setup          # Create test auth token
    python test_upload.py --test           # Test upload flow
"""

import asyncio
import httpx
import json
import sys
import time
from pathlib import Path
import jwt
from datetime import datetime, timedelta

API_URL = "http://127.0.0.1:4000"
JWT_SECRET = "reportrx"  # From config
USER_ID = "test-user-001"
EMAIL = "test@example.com"

def create_test_token():
    """Create a valid JWT token for testing."""
    payload = {
        "sub": USER_ID,
        "email": EMAIL,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

async def test_upload():
    """Test the complete upload and processing flow."""
    token = create_test_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    pdf_path = Path("test_report.pdf")
    if not pdf_path.exists():
        print("❌ test_report.pdf not found. Run with --setup first.")
        return False
    
    print(f"\n📋 Test Upload Flow")
    print(f"{'=' * 60}")
    print(f"Token: {token[:50]}...")
    print(f"PDF file: {pdf_path.name} ({pdf_path.stat().st_size} bytes)")
    
    async with httpx.AsyncClient(timeout=30) as client:
        # Step 1: Upload the PDF
        print(f"\n1️⃣ Uploading PDF...")
        with open(pdf_path, "rb") as f:
            files = {"file": ("test_report.pdf", f, "application/pdf")}
            try:
                resp = await client.post(
                    f"{API_URL}/api/reports",
                    headers=headers,
                    files=files
                )
            except Exception as e:
                print(f"❌ Upload failed: {e}")
                print(f"   Is the API running? (python -m src.main or uvicorn src.main:app --reload)")
                return False
        
        if resp.status_code not in (200, 201):
            print(f"❌ Upload failed with status {resp.status_code}")
            print(f"   Response: {resp.text}")
            return False
        
        data = resp.json()
        report = data.get("report", {})
        report_id = report.get("id")
        
        print(f"✅ Upload successful!")
        print(f"   Report ID: {report_id}")
        print(f"   Status: {report.get('status')}")
        print(f"   Filename: {report.get('filename')}")
        
        # Step 2: Poll for completion
        print(f"\n2️⃣ Waiting for processing (max 2 minutes)...")
        start_time = time.time()
        max_wait = 120  # 2 minutes
        poll_interval = 3  # Check every 3 seconds
        
        while time.time() - start_time < max_wait:
            try:
                resp = await client.get(
                    f"{API_URL}/api/reports/{report_id}",
                    headers=headers
                )
            except Exception as e:
                print(f"❌ Status check failed: {e}")
                return False
            
            if resp.status_code != 200:
                print(f"❌ Status check failed with status {resp.status_code}")
                return False
            
            report = resp.json().get("report", {})
            status = report.get("status")
            elapsed = int(time.time() - start_time)
            
            print(f"   [{elapsed}s] Status: {status}")
            
            if status == "ready":
                print(f"\n✅ Processing complete!")
                print(f"   Summary: {report.get('summary', 'N/A')[:100]}...")
                print(f"   Insights: {report.get('insights', 'N/A')[:100]}...")
                print(f"   Next Actions: {report.get('nextActions', 'N/A')[:100]}...")
                return True
            elif status == "failed":
                print(f"\n❌ Processing failed!")
                print(f"   Error: {report.get('errorMessage', 'Unknown error')}")
                return False
            
            await asyncio.sleep(poll_interval)
        
        print(f"\n⏱️ Timeout waiting for processing (>{max_wait}s)")
        print(f"   Current status: {status}")
        print(f"   Check watchdog logs if stuck in 'processing'")
        return False

async def main():
    if "--setup" in sys.argv:
        token = create_test_token()
        print("✅ Test Token Created:")
        print(f"   {token}")
        print("\nUse this token as Authorization: Bearer <token>")
        return
    
    if "--test" in sys.argv or len(sys.argv) == 1:
        success = await test_upload()
        sys.exit(0 if success else 1)
    
    print("Usage: python test_upload.py [--setup|--test]")

if __name__ == "__main__":
    asyncio.run(main())
