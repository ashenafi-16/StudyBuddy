
import asyncio
import json
import websockets
import requests

# Config
BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8001" # Using 8001 as daphne is running there now? 
# Wait, user ran `daphne studybuddy.asgi:application` which defaults to 8000.
# But I ran daphne on 8001 in background. Let's check lsof.
# The user's metadata says: running terminal commands: daphne studybuddy.asgi:application (in ... running for 4m38s).
# So port 8000 is occupied by daphne. My port 8001 run was killed (or I should check).
# I'll try 8000 first.

WS_URL = "ws://localhost:8000"
GROUP_ID = 12
USER_B_EMAIL = "khalid@gmail.com"
USER_B_PASS = "12345678"

async def main():
    # 1. Login to get token
    print(f"Logging in as {USER_B_EMAIL}...")
    try:
        resp = requests.post(f"{BASE_URL}/api/auth/jwt/create/", data={
            "email": USER_B_EMAIL,
            "password": USER_B_PASS
        })
        resp.raise_for_status()
        token = resp.json()['access']
        print(f"Got token: {token[:10]}...")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    # 2. Connect to WebSocket
    uri = f"{WS_URL}/ws/pomodoro/{GROUP_ID}/?token={token}"
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected! Listening for messages...")
            while True:
                message = await websocket.recv()
                data = json.loads(message)
                print(f"\nRECEIVED MESSAGE: {data.get('type')}")
                print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
