"""Test registration endpoint"""
import requests
import json

API_BASE = "http://localhost:8000"

# Test data
test_user = {
    "name": "Test User Registration",
    "email": "testuser@ndabase.com",
    "phone": "+27123456999",
    "password": "test123",
    "role": "helpdesk_officer"
}

print("\n" + "="*70)
print("🧪 TESTING REGISTRATION ENDPOINT")
print("="*70)

try:
    print(f"\nAttempting to register: {test_user['name']}")
    print(f"Email: {test_user['email']}")
    print(f"Role: {test_user['role']}")
    
    response = requests.post(
        f"{API_BASE}/api/auth/register",
        json=test_user,
        timeout=5
    )
    
    print(f"\nResponse Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        print("\n✅ SUCCESS! User registered successfully!")
        print(f"User ID: {data.get('id')}")
        print(f"Name: {data.get('name')}")
        print(f"Email: {data.get('email')}")
        print(f"Role: {data.get('role')}")
    elif response.status_code == 400:
        error = response.json()
        print(f"\n⚠️ Registration Failed: {error.get('detail')}")
    else:
        print(f"\n❌ Unexpected error: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("\n❌ ERROR: Cannot connect to server!")
    print("Make sure the server is running on http://localhost:8000")
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")

print("\n" + "="*70 + "\n")
