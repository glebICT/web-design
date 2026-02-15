import asyncio
import websockets
import json
import uuid

# Game state
ball = {"x": 400, "y": 300, "vx": 5, "vy": 3}
players = {}  # socket_id: {"ip": str, "y": 250, "score": 0}
clients = []  # list of active websocket connections

async def handle_client(websocket, path):
    player_id = str(uuid.uuid4())[:8]
    client_ip = websocket.remote_address[0]  # Get client IP
    
    players[player_id] = {"ip": client_ip, "y": 250, "score": 0}
    clients.append(websocket)
    
    print(f"Player {player_id} connected from {client_ip}")
    
    try:
        async for message in websocket:
            data = json.loads(message)
            if player_id in players:
                players[player_id]["y"] = max(0, min(550, data["y"]))
    except websockets.ConnectionClosed:
        pass
    finally:
        if player_id in players:
            del players[player_id]
        if websocket in clients:
            clients.remove(websocket)
        print(f"Player {player_id} disconnected")

def game_loop():
    while True:
        # Ball physics
        global ball
        ball["x"] += ball["vx"]
        ball["y"] += ball["vy"]
        
        # Wall bounce
        if ball["y"] < 0 or ball["y"] > 600:
            ball["vy"] *= -1
        
        # Score and reset
        if ball["x"] < 0:
            for p in players.values():
                p["score"] += 1
            ball = {"x": 400, "y": 300, "vx": 5, "vy": 3}
        if ball["x"] > 800:
            for p in players.values():
                p["score"] += 1
            ball = {"x": 400, "y": 300, "vx": -5, "vy": 3}
        
        # Paddle collision (simplified)
        for pid, player in players.items():
            if ball["x"] < 30 and abs(ball["y"] - player["y"]) < 50:
                ball["vx"] *= -1
            if ball["x"] > 770 and abs(ball["y"] - player["y"]) < 50:
                ball["vx"] *= -1
        
        # Broadcast state
        state = {"ball": ball, "players": players}
        asyncio.create_task(broadcast_state(state))
        asyncio.sleep(0.016)  # ~60 FPS

async def broadcast_state(state):
    message = json.dumps(state)
    disconnected = []
    for client in clients[:]:  # Copy list to avoid modification during iteration
        try:
            await client.send(message)
        except websockets.ConnectionClosed:
            disconnected.append(client)
    
    # Clean up disconnected clients
    for client in disconnected:
        clients.remove(client)

async def main():
    # Start game loop in background
    asyncio.create_task(asyncio.to_thread(game_loop))
    
    # Start WebSocket server
    server = await websockets.serve(handle_client, "0.0.0.0", 8765)
    print("Server running on ws://0.0.0.0:8765")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
