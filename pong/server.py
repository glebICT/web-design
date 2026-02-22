import asyncio
import websockets
import json
import uuid

SPEED = 0.5          # ball speed multiplier
MAX_PADDLE_STEP = 8  # max pixels paddle can move per update from client

# Game state
ball = {"x": 400, "y": 300, "vx": 5 * SPEED, "vy": 3 * SPEED}
players = {}
clients = []

async def handle_client(websocket):
    player_id = str(uuid.uuid4())[:8]
    client_ip = websocket.remote_address[0]

    players[player_id] = {"ip": client_ip, "y": 250, "score": 0}
    clients.append(websocket)

    print(f"Player {player_id} connected from {client_ip}")

    try:
        async for message in websocket:
            data = json.loads(message)
            if player_id in players:
                new_y = max(0, min(550, data["y"]))
                current_y = players[player_id]["y"]
                diff = new_y - current_y
                # Clamp how much it can move per message
                clamped = max(-MAX_PADDLE_STEP, min(MAX_PADDLE_STEP, diff))
                players[player_id]["y"] = current_y + clamped
    except websockets.ConnectionClosed:
        pass
    finally:
        if player_id in players:
            del players[player_id]
        if websocket in clients:
            clients.remove(websocket)
        print(f"Player {player_id} disconnected")

async def broadcast_state(state):
    message = json.dumps(state)
    disconnected = []
    for client in clients[:]:
        try:
            await client.send(message)
        except websockets.ConnectionClosed:
            disconnected.append(client)
    for client in disconnected:
        if client in clients: 
            clients.remove(client)

async def game_loop():
    global ball
    while True:
        # Ball physics
        ball["x"] += ball["vx"]
        ball["y"] += ball["vy"]

        # Wall bounce
        if ball["y"] < 0 or ball["y"] > 600:
            ball["vy"] *= -1

        # Score and reset
        if ball["x"] < 0:
            for p in players.values():
                p["score"] += 1
            ball = {"x": 400, "y": 300, "vx": 5 * SPEED, "vy": 3 * SPEED}
        if ball["x"] > 800:
            for p in players.values():
                p["score"] += 1
            ball = {"x": 400, "y": 300, "vx": -5 * SPEED, "vy": 3 * SPEED}

        # Paddle collision
        for pid, player in players.items():
            if ball["x"] < 30 and abs(ball["y"] - player["y"]) < 50:
                ball["vx"] *= -1
            if ball["x"] > 770 and abs(ball["y"] - player["y"]) < 50:
                ball["vx"] *= -1

        # Broadcast state
        state = {"ball": ball, "players": players}
        asyncio.create_task(broadcast_state(state))
        await asyncio.sleep(1/60)

async def main():
    game_task = asyncio.create_task(game_loop())
    server = await websockets.serve(handle_client, "192.168.1.101", 8765, reuse_port=True)
    print("Server running on ws://192.168.1.101:8765")
    await asyncio.gather(game_task, server.wait_closed())

if __name__ == "__main__":
    asyncio.run(main())