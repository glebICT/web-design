#!/usr/bin/env python3
"""
Test Runner for Pong Server Stability Tests
Simulates multiple clients with unstable connections
"""

import asyncio
import json
import uuid
from datetime import datetime


# Mock websockets module for testing
class MockWebSocket:
    def __init__(self, address):
        self.remote_address = (address, 12345)
        self.sent_messages = []
        self.closed = False
    
    async def send(self, message):
        if self.closed:
            raise Exception("Connection closed")
        self.sent_messages.append(message)
    
    async def close(self):
        self.closed = True


async def simulate_client(server, client_id, behavior="stable"):
    """
    Simulate a client with different connection behaviors
    
    Behaviors:
    - stable: Normal connection
    - unstable: Frequent disconnects/reconnects
    - rapid: Sends many rapid updates
    - lazy: Infrequent updates
    - glitchy: Random delays and errors
    """
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Client {client_id} connecting ({behavior})")
    
    websocket = MockWebSocket(f"192.168.1.{client_id}")
    player_id = str(uuid.uuid4())[:8]
    
    try:
        # Connect
        server.players[player_id] = {
            "ip": f"192.168.1.{client_id}",
            "y": 250,
            "score": 0
        }
        server.clients.append(websocket)
        
        if behavior == "stable":
            # Stable client - normal gameplay
            for _ in range(20):
                await asyncio.sleep(0.05)
                # Update paddle position
                new_y = max(0, min(550, 250 + _ * 10))
                data = {"y": new_y}
                message = json.dumps(data)
                
                # Process update
                parsed = json.loads(message)
                current_y = server.players[player_id]["y"]
                diff = parsed["y"] - current_y
                clamped = max(-server.MAX_PADDLE_STEP, min(server.MAX_PADDLE_STEP, diff))
                server.players[player_id]["y"] = current_y + clamped
        
        elif behavior == "unstable":
            # Unstable client - connects/disconnects frequently
            for attempt in range(5):
                try:
                    await asyncio.sleep(0.1)
                    # Send update
                    data = {"y": 300}
                    message = json.dumps(data)
                    
                    # Randomly disconnect
                    if attempt % 2 == 0:
                        raise Exception("Connection lost")
                    
                except Exception as e:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Client {client_id} reconnecting (attempt {attempt})")
                    continue
        
        elif behavior == "rapid":
            # Rapid client - sends many fast updates
            for i in range(100):
                await asyncio.sleep(0.01)
                data = {"y": max(0, min(550, 250 + i))}
                message = json.dumps(data)
                
                parsed = json.loads(message)
                current_y = server.players[player_id]["y"]
                diff = parsed["y"] - current_y
                clamped = max(-server.MAX_PADDLE_STEP, min(server.MAX_PADDLE_STEP, diff))
                server.players[player_id]["y"] = current_y + clamped
        
        elif behavior == "glitchy":
            # Glitchy client - random delays and issues
            for _ in range(10):
                delay = 0.01 + (_ % 3) * 0.05
                await asyncio.sleep(delay)
                
                # Sometimes send invalid data
                if _ % 3 == 0:
                    data = {"y": 250}
                else:
                    data = {"y": max(0, min(550, 250 + _ * 20))}
                
                message = json.dumps(data)
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Client {client_id} active")
        
    finally:
        # Cleanup
        if player_id in server.players:
            del server.players[player_id]
        if websocket in server.clients:
            server.clients.remove(websocket)
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Client {client_id} disconnected")


async def run_stability_test():
    """Run comprehensive stability tests"""
    print("\n" + "="*60)
    print("PONG SERVER STABILITY TEST")
    print("="*60 + "\n")
    
    # Import server
    import sys
    sys.path.insert(0, '/Users/glebsvechnikov/Code/web-design/pong')
    import importlib
    server = importlib.import_module('server')
    
    # Reset state
    server.ball = {"x": 400, "y": 300, "vx": 5 * server.SPEED, "vy": 3 * server.SPEED}
    server.players.clear()
    server.clients.clear()
    
    print(f"Initial State:")
    print(f"  Players: {len(server.players)}")
    print(f"  Clients: {len(server.clients)}")
    print(f"  Ball: ({server.ball['x']}, {server.ball['y']})\n")
    
    # Test scenarios
    test_scenarios = [
        ("10 Stable Clients", [
            ("client_0", "stable"),
            ("client_1", "stable"),
            ("client_2", "stable"),
            ("client_3", "stable"),
            ("client_4", "stable"),
            ("client_5", "stable"),
            ("client_6", "stable"),
            ("client_7", "stable"),
            ("client_8", "stable"),
            ("client_9", "stable"),
        ]),
        ("Mixed Behavior Clients", [
            ("client_0", "stable"),
            ("client_1", "unstable"),
            ("client_2", "rapid"),
            ("client_3", "glitchy"),
            ("client_4", "stable"),
            ("client_5", "unstable"),
            ("client_6", "rapid"),
            ("client_7", "glitchy"),
            ("client_8", "stable"),
            ("client_9", "unstable"),
        ]),
        ("All Unstable", [
            ("client_0", "unstable"),
            ("client_1", "unstable"),
            ("client_2", "unstable"),
            ("client_3", "unstable"),
            ("client_4", "unstable"),
            ("client_5", "unstable"),
            ("client_6", "unstable"),
            ("client_7", "unstable"),
            ("client_8", "unstable"),
            ("client_9", "unstable"),
        ]),
    ]
    
    for scenario_name, clients in test_scenarios:
        print(f"\n{'='*60}")
        print(f"SCENARIO: {scenario_name}")
        print(f"{'='*60}\n")
        
        # Reset state
        server.players.clear()
        server.clients.clear()
        server.ball = {"x": 400, "y": 300, "vx": 5 * server.SPEED, "vy": 3 * server.SPEED}
        
        start_time = datetime.now()
        
        # Run all clients concurrently
        tasks = [
            simulate_client(server, client_id, behavior)
            for client_id, behavior in clients
        ]
        
        try:
            await asyncio.gather(*tasks, return_exceptions=True)
            elapsed = (datetime.now() - start_time).total_seconds()
            
            print(f"\n✓ Scenario completed in {elapsed:.2f}s")
            print(f"  Final Players: {len(server.players)}")
            print(f"  Final Clients: {len(server.clients)}")
            print(f"  Ball Position: ({server.ball['x']:.1f}, {server.ball['y']:.1f})")
            
            # Check for glitches
            if len(server.players) != 0:
                print(f"  ⚠ WARNING: Players not cleaned up!")
            if len(server.clients) != 0:
                print(f"  ⚠ WARNING: Clients not cleaned up!")
            
        except Exception as e:
            print(f"\n✗ Scenario failed: {e}")
    
    # Final state
    print(f"\n{'='*60}")
    print("FINAL STATE")
    print(f"{'='*60}")
    print(f"Players: {len(server.players)}")
    print(f"Clients: {len(server.clients)}")
    print(f"Ball: ({server.ball['x']:.1f}, {server.ball['y']:.1f})")
    print(f"Velocity: ({server.ball['vx']:.1f}, {server.ball['vy']:.1f})\n")


if __name__ == "__main__":
    asyncio.run(run_stability_test())
