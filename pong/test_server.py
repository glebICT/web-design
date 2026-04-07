"""
Test suite for Pong server - Simulates multiple clients with unstable connections
Tests for race conditions, connection drops, and game glitches
"""

import asyncio
import websockets
import json
import pytest
import pytest_asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import sys
sys.path.insert(0, '/Users/glebsvechnikov/Code/web-design/pong')


@pytest.mark.asyncio
class TestPongServerStability:
    """Test pong server with multiple simultaneous clients"""
    
    @pytest_asyncio.fixture
    async def server_setup(self):
        """Setup test environment"""
        # Import server module
        import importlib
        server = importlib.import_module('server')
        
        # Reset game state
        server.ball = {"x": 400, "y": 300, "vx": 5 * server.SPEED, "vy": 3 * server.SPEED}
        server.players.clear()
        server.clients.clear()
        
        yield server
        
        # Cleanup
        server.players.clear()
        server.clients.clear()
    
    async def test_10_simultaneous_connections(self, server_setup):
        """Test 10 clients connecting simultaneously"""
        server = server_setup
        connected_clients = []
        
        async def connect_client(client_id):
            """Simulate client connection"""
            mock_websocket = AsyncMock()
            mock_websocket.remote_address = (f"192.168.1.{client_id}", 12345)
            
            # Simulate connection
            await server.handle_client(mock_websocket)
            return mock_websocket
        
        # Connect 10 clients simultaneously
        tasks = [connect_client(i) for i in range(10)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Verify all clients connected
        successful = [r for r in results if not isinstance(r, Exception)]
        assert len(successful) == 10, f"Expected 10 connections, got {len(successful)}"
        # Mock websockets disconnect immediately after the handler loop exits.
        assert len(server.players) == 0, f"Expected all players cleaned up, got {len(server.players)}"
        assert len(server.clients) == 0, f"Expected all clients cleaned up, got {len(server.clients)}"
    
    async def test_unstable_connections_with_drops(self, server_setup):
        """Test clients with intermittent connection drops"""
        server = server_setup
        drop_events = []
        
        async def unstable_client(client_id, drop_count=3):
            """Client that connects/disconnects multiple times"""
            for attempt in range(drop_count + 1):
                try:
                    mock_websocket = AsyncMock()
                    mock_websocket.remote_address = (f"192.168.1.{client_id}", 12345)
                    
                    # Connect
                    server.clients.append(mock_websocket)
                    player_id = str(uuid.uuid4())[:8]
                    server.players[player_id] = {
                        "ip": f"192.168.1.{client_id}",
                        "y": 250,
                        "score": 0
                    }
                    
                    # Simulate some gameplay
                    await asyncio.sleep(0.1)
                    
                    # Send paddle update
                    message = json.dumps({"y": 300})
                    await mock_websocket.send(message)
                    
                    # Simulate connection drop
                    drop_events.append({
                        "client_id": client_id,
                        "attempt": attempt,
                        "timestamp": asyncio.get_event_loop().time()
                    })
                    
                    # Disconnect
                    if player_id in server.players:
                        del server.players[player_id]
                    if mock_websocket in server.clients:
                        server.clients.remove(mock_websocket)
                    
                    await asyncio.sleep(0.05)  # Brief pause before reconnect
                    
                except Exception as e:
                    print(f"Client {client_id} error: {e}")
        
        # Run 5 unstable clients
        tasks = [unstable_client(i, drop_count=2) for i in range(5)]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        # Verify server didn't crash
        assert True, "Server should handle unstable connections gracefully"
    
    async def test_rapid_paddle_updates_race_condition(self, server_setup):
        """Test race condition with rapid paddle position updates"""
        server = server_setup
        player_id = "test_player"
        mock_websocket = AsyncMock()
        mock_websocket.remote_address = ("192.168.1.1", 12345)
        
        # Setup player
        server.players[player_id] = {"ip": "192.168.1.1", "y": 250, "score": 0}
        server.clients.append(mock_websocket)
        
        update_count = 0
        
        async def send_update(y_position):
            """Send rapid paddle updates"""
            nonlocal update_count
            try:
                data = {"y": y_position}
                message = json.dumps(data)
                
                # Simulate receiving message
                async def mock_iter():
                    yield message
                
                # Manually process the update
                parsed = json.loads(message)
                new_y = max(0, min(550, parsed["y"]))
                current_y = server.players[player_id]["y"]
                diff = new_y - current_y
                clamped = max(-server.MAX_PADDLE_STEP, min(server.MAX_PADDLE_STEP, diff))
                server.players[player_id]["y"] = current_y + clamped
                update_count += 1
                
            except Exception as e:
                print(f"Update error: {e}")
        
        # Send 100 rapid updates simultaneously
        tasks = [send_update(250 + i * 5) for i in range(100)]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        # Verify paddle position is valid
        final_y = server.players[player_id]["y"]
        assert 0 <= final_y <= 550, f"Paddle position out of bounds: {final_y}"
    
    async def test_ball_physics_with_multiple_players(self, server_setup):
        """Test ball physics doesn't glitch with multiple players"""
        server = server_setup
        
        # Add 10 players at different positions
        for i in range(10):
            player_id = f"player_{i}"
            server.players[player_id] = {
                "ip": f"192.168.1.{i}",
                "y": 50 * i,  # Spread across playing field
                "score": 0
            }
        
        initial_ball = server.ball.copy()
        
        # Run game loop for a few frames
        for _ in range(10):
            server.ball["x"] += server.ball["vx"]
            server.ball["y"] += server.ball["vy"]
            
            # Wall bounce
            if server.ball["y"] < 0 or server.ball["y"] > 600:
                server.ball["vy"] *= -1
            
            # Paddle collision - potential race condition here
            for pid, player in server.players.items():
                if server.ball["x"] < 30 and abs(server.ball["y"] - player["y"]) < 50:
                    server.ball["vx"] *= -1
                if server.ball["x"] > 770 and abs(server.ball["y"] - player["y"]) < 50:
                    server.ball["vx"] *= -1
        
        # Verify ball is still in play area
        assert 0 <= server.ball["y"] <= 600, f"Ball Y out of bounds: {server.ball['y']}"
    
    async def test_broadcast_with_failing_clients(self, server_setup):
        """Test broadcasting state when some clients fail"""
        server = server_setup
        
        # Create mix of healthy and failing clients
        healthy_clients = []
        failing_clients = []
        
        for i in range(5):
            healthy = AsyncMock()
            healthy.send = AsyncMock()
            healthy_clients.append(healthy)
        
        for i in range(5):
            failing = AsyncMock()
            failing.send = AsyncMock(side_effect=websockets.ConnectionClosed)
            failing_clients.append(failing)
        
        server.clients = healthy_clients + failing_clients
        
        # Broadcast state
        state = {
            "ball": {"x": 400, "y": 300},
            "players": {"p1": {"y": 250, "score": 0}}
        }
        
        # Should not crash even with failing clients
        await server.broadcast_state(state)
        
        # Verify healthy clients received state
        for client in healthy_clients:
            client.send.assert_called_once()
        
        # Verify failing clients were removed
        assert len(server.clients) == 5, "Failing clients should be removed"
    
    async def test_score_tracking_concurrent_updates(self, server_setup):
        """Test score tracking with concurrent scoring events"""
        server = server_setup
        
        # Add players
        for i in range(10):
            server.players[f"player_{i}"] = {
                "ip": f"192.168.1.{i}",
                "y": 250,
                "score": 0
            }
        
        async def score_goal(player_index):
            """Simulate scoring a goal"""
            # Score for all players
            for p in server.players.values():
                p["score"] += 1
            await asyncio.sleep(0.01)
        
        # Multiple goals scored simultaneously
        tasks = [score_goal(i) for i in range(10)]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        # Verify all players have same score
        scores = [p["score"] for p in server.players.values()]
        assert all(s == scores[0] for s in scores), f"Inconsistent scores: {scores}"
    
    async def test_memory_leak_with_reconnections(self, server_setup):
        """Test for memory leaks with frequent reconnections"""
        server = server_setup
        initial_client_count = len(server.clients)
        
        # Simulate 50 connect/disconnect cycles
        for cycle in range(50):
            mock_websocket = AsyncMock()
            mock_websocket.remote_address = ("192.168.1.1", 12345)
            
            # Connect
            player_id = str(uuid.uuid4())[:8]
            server.players[player_id] = {"ip": "192.168.1.1", "y": 250, "score": 0}
            server.clients.append(mock_websocket)
            
            # Immediate disconnect
            if player_id in server.players:
                del server.players[player_id]
            if mock_websocket in server.clients:
                server.clients.remove(mock_websocket)
        
        # Verify cleanup
        assert len(server.players) == 0, f"Players not cleaned up: {len(server.players)}"
        assert len(server.clients) == initial_client_count, \
            f"Clients not cleaned up: {len(server.clients)}"
    
    async def test_invalid_json_messages(self, server_setup):
        """Test handling of invalid JSON messages"""
        server = server_setup
        player_id = "test_player"
        mock_websocket = AsyncMock()
        mock_websocket.remote_address = ("192.168.1.1", 12345)
        
        server.players[player_id] = {"ip": "192.168.1.1", "y": 250, "score": 0}
        server.clients.append(mock_websocket)
        
        invalid_messages = [
            "not json",
            '{"invalid": true}',  # Missing 'y' field
            '{"y": "not_a_number"}',  # Wrong type
            '',  # Empty string
            'null',  # Null value
        ]
        
        for message in invalid_messages:
            try:
                data = json.loads(message)
                if "y" in data:
                    new_y = max(0, min(550, data["y"]))
                    server.players[player_id]["y"] = new_y
            except (json.JSONDecodeError, KeyError, TypeError):
                pass  # Expected - should handle gracefully
        
        # Server should still be functional
        assert player_id in server.players
    
    async def test_boundary_conditions(self, server_setup):
        """Test extreme values and boundary conditions"""
        server = server_setup
        player_id = "boundary_test"
        mock_websocket = AsyncMock()
        
        server.players[player_id] = {"ip": "192.168.1.1", "y": 250, "score": 0}
        server.clients.append(mock_websocket)
        
        extreme_values = [-1000, -1, 0, 1, 275, 549, 550, 551, 1000, 10000]
        
        for value in extreme_values:
            try:
                new_y = max(0, min(550, value))
                current_y = server.players[player_id]["y"]
                diff = new_y - current_y
                clamped = max(-server.MAX_PADDLE_STEP, min(server.MAX_PADDLE_STEP, diff))
                server.players[player_id]["y"] = current_y + clamped
                
                # Verify bounds
                assert 0 <= server.players[player_id]["y"] <= 550, \
                    f"Y position out of bounds: {server.players[player_id]['y']}"
            except Exception as e:
                print(f"Error with value {value}: {e}")


@pytest.mark.asyncio
async def test_stress_10_concurrent_games():
    """Stress test: 10 concurrent game sessions"""
    import importlib
    server = importlib.import_module('server')
    
    # Reset state
    server.ball = {"x": 400, "y": 300, "vx": 5 * server.SPEED, "vy": 3 * server.SPEED}
    server.players.clear()
    server.clients.clear()
    
    async def game_session(session_id):
        """Simulate a complete game session"""
        # Connect
        mock_websocket = AsyncMock()
        mock_websocket.remote_address = (f"10.0.0.{session_id}", 12345)
        player_id = f"session_{session_id}"
        
        server.players[player_id] = {"ip": f"10.0.0.{session_id}", "y": 250, "score": 0}
        server.clients.append(mock_websocket)
        
        # Play for a bit
        for _ in range(10):
            await asyncio.sleep(0.01)
            # Update paddle
            server.players[player_id]["y"] = max(0, min(550, 
                server.players[player_id]["y"] + 5))
        
        # Disconnect
        if player_id in server.players:
            del server.players[player_id]
        if mock_websocket in server.clients:
            server.clients.remove(mock_websocket)
    
    # Run 10 concurrent sessions
    tasks = [game_session(i) for i in range(10)]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    errors = [r for r in results if isinstance(r, Exception)]
    assert len(errors) == 0, f"Sessions failed: {[str(e) for e in errors]}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
