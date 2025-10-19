"""Test escalations API"""
import requests
import json

try:
    response = requests.get('http://localhost:8000/api/escalations', timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ ESCALATIONS API WORKING!")
        print(f"Total Escalations: {data['total']}")
        
        if data['escalations']:
            for esc in data['escalations']:
                print(f"\n📋 {esc['ticket_number']} - {esc['title']}")
                print(f"   Priority: {esc['priority']}")
                print(f"   Status: {esc['status']}")
                print(f"   Escalated: {esc['time_since_escalation']}")
                print(f"   Reason: {esc['escalation_reason']}")
        else:
            print("❌ No escalations found!")
    else:
        print(f"❌ API returned status {response.status_code}")
        print(response.text)
except requests.exceptions.ConnectionError:
    print("❌ Server not running! Start with: python run_server.py")
except Exception as e:
    print(f"❌ Error: {str(e)}")
