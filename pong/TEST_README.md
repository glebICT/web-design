# Pong Server Stability Tests

## Overview

This test suite simulates multiple simultaneous clients connecting to the pong server, including scenarios with unstable connections that can cause glitches.

## Installation

```bash
pip install -r requirements.txt
```

## Running Tests

### Option 1: Pytest Suite
```bash
python -m pytest test_server.py -v
```

### Option 2: Interactive Test Runner
```bash
python run_tests.py
```

## Test Scenarios

### 1. **10 Simultaneous Connections**
- Tests basic server capacity with 10 concurrent clients
- Verifies all players are registered correctly
- Checks for race conditions in player registration

### 2. **Unstable Connection Drops**
- Simulates clients frequently disconnecting and reconnecting
- Tests cleanup of disconnected players
- Verifies no memory leaks from abandoned connections

### 3. **Rapid Paddle Updates**
- Sends 100 rapid position updates simultaneously
- Tests clamping logic prevents out-of-bounds positions
- Checks for race conditions in state updates

### 4. **Ball Physics with Multiple Players**
- Verifies ball collision detection doesn't glitch with many players
- Tests scoring system works correctly
- Checks wall bounce mechanics remain stable

### 5. **Broadcast with Failing Clients**
- Tests message broadcasting when some clients fail
- Verifies failed clients are properly removed
- Ensures healthy clients continue receiving updates

### 6. **Score Tracking Concurrency**
- Tests score updates don't have race conditions
- Verifies all players receive correct scores
- Checks atomic operations on shared state

### 7. **Memory Leak Detection**
- Runs 50 connect/disconnect cycles
- Verifies proper cleanup of players and clients
- Checks for orphaned resources

## Known Issues Identified

### 🐛 Critical Issues

1. **Race Condition in Paddle Collision**
   - When multiple players update positions rapidly, collision detection can miss hits
   - Ball can pass through paddles during high-frequency updates

2. **No Thread Safety on Shared State**
   - `ball` dictionary modified without locks
   - `players` and `clients` can be modified during iteration
   - Can cause `RuntimeError` or inconsistent state

3. **Connection Cleanup Issues**
   - Disconnected clients not always removed from list immediately
   - Can cause broadcast failures affecting other clients

### ⚠️ Glitch Causes

1. **Unstable Connections**
   - Rapid connect/disconnect causes player state inconsistency
   - Ball physics can glitch if player disconnects mid-collision

2. **Missing Error Handling**
   - Invalid JSON messages can crash client handler
   - No validation on paddle position values

3. **Timing Issues**
   - Game loop runs at fixed 60 FPS regardless of client count
   - Can cause lag with many simultaneous clients

## Recommendations

### Immediate Fixes

1. **Add Async Locks**
```python
state_lock = asyncio.Lock()

async def handle_client(websocket):
    async with state_lock:
        # Critical section
        pass
```

2. **Improve Connection Cleanup**
```python
async def cleanup_client(player_id, websocket):
    try:
        if player_id in players:
            del players[player_id]
        if websocket in clients:
            clients.remove(websocket)
    except Exception as e:
        print(f"Cleanup error: {e}")
```

3. **Add Input Validation**
```python
try:
    data = json.loads(message)
    if "y" not in data or not isinstance(data["y"], (int, float)):
        raise ValueError("Invalid paddle position")
except (json.JSONDecodeError, ValueError) as e:
    print(f"Invalid message: {e}")
    continue
```

### Long-term Improvements

1. **Use asyncio.Queue** for thread-safe state updates
2. **Implement heartbeat/ping** to detect dead connections
3. **Add reconnection logic** with state preservation
4. **Rate limit** client updates to prevent flooding
5. **Use dataclasses** for structured game state

## Test Results Interpretation

### Passing Tests
- All clients connected successfully
- No exceptions thrown
- Proper cleanup after disconnections
- Game state remains consistent

### Failing Tests Indicate
- Race conditions present
- Memory leaks occurring
- State corruption happening
- Error handling insufficient

## Performance Metrics

Expected results:
- 10 stable clients: < 2 seconds
- Mixed behavior: < 3 seconds  
- All unstable: < 5 seconds

If tests take significantly longer, investigate:
- Connection handling bottlenecks
- Broadcast inefficiencies
- State update contention
