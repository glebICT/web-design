import asyncio
import websockets
import json
import random

SPEED = 0.5          # ball speed multiplier
MAX_PADDLE_STEP = 8  # max pixels paddle can move per update from client
left_count = 0
right_count = 0

# Emoji collection for player IDs
EMOJIS = [
    "🚀", "⚡", "🔥", "💎", "⭐", "🌟", "🎯", "🦄", "🐲", "🦖",
    "⚽", "🏀", "🎾", "🥎", "🏐", "🏈", "🥍", "🏒", "🏓", "🥅",
    "👻", "👽", "🤖", "🧟", "🧛", "🧟‍♀️", "👾", "🎮", "🕹️", "💻",
    "🍕", "🍔", "🌮", "🍣", "🍜", "🌭", "🍦", "🍩", "🍪", "🍫"
]

# Game state
ball = {"x": 400, "y": 300, "vx": 5 * SPEED, "vy": 3 * SPEED}
players = {}
clients = []
used_emojis = set()

def get_random_emoji():
    """Get a random unused emoji"""
    available = [e for e in EMOJIS if e not in used_emojis]
    if not available:
        used_emojis.clear()  # Reset if all emojis used
        available = EMOJIS[:]
    emoji = random.choice(available)
    used_emojis.add(emoji)
    return emoji

async def handle_client(websocket):
    global left_count, right_count 
    player_id = get_random_emoji()
    client_ip = websocket.remote_address[0]
    
    player_id = get_random_emoji()
    client_ip = websocket.remote_address[0]

    # Now safe to use left_count/right_count
    if left_count <= right_count:
        side = "left"
        left_count += 1
    else:
        side = "right" 
        right_count += 1
    
    players[player_id] = {
        "ip": client_ip, 
        "y": 250, 
        "score": 0,
        "side": side
    }
    clients.append(websocket)

    print(f"Player {player_id} ({side}) connected from {client_ip}")

    try:
        async for message in websocket:
            data = json.loads(message)
            if player_id in players:
                new_y = max(0, min(550, data["y"]))
                current_y = players[player_id]["y"]
                diff = new_y - current_y
                clamped = max(-MAX_PADDLE_STEP, min(MAX_PADDLE_STEP, diff))
                players[player_id]["y"] = current_y + clamped
    except websockets.ConnectionClosed:
        pass
    finally:
        if player_id in players:
            player_side = players[player_id]["side"]
            if player_side == "left":
                left_count -= 1
            else:
                right_count -= 1
            used_emojis.discard(player_id)
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
            if player["side"] == "left" and ball["x"] < 30 and abs(ball["y"] - player["y"]) < 50:
                ball["vx"] *= -1
            elif player["side"] == "right" and ball["x"] > 770 and abs(ball["y"] - player["y"]) < 50:
                ball["vx"] *= -1

        # Broadcast state
        state = {"ball": ball, "players": players}
        asyncio.create_task(broadcast_state(state))
        await asyncio.sleep(1/60)

async def main():
    game_task = asyncio.create_task(game_loop())
    server = await websockets.serve(handle_client, "192.168.2.136", 8765)
    print("Server running on ws://192.168.2.136:8765")
    await asyncio.gather(game_task, server.wait_closed())

if __name__ == "__main__":
    asyncio.run(main())
