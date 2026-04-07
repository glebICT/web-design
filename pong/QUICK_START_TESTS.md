# Quick Start - Testing Pong Server Stability

## 🚀 Run Tests (3 Options)

### Option 1: Simple Test Runner (Recommended for First Time)
```bash
cd /Users/glebsvechnikov/Code/web-design/pong
python3 run_tests.py
```

This will show you exactly how the server behaves with 10 simultaneous clients.

---

### Option 2: Full Pytest Suite
```bash
# Install dependencies first
pip3 install -r test_requirements.txt

# Run all tests
python3 -m pytest test_server.py -v

# Run specific test
python3 -m pytest test_server.py::TestPongServerStability::test_10_simultaneous_connections -v
```

---

### Option 3: Manual Simulation
```bash
# Terminal 1: Start server
python3 server.py

# Terminal 2-11: Simulate 10 clients (you'll need a WebSocket client)
# Use websocat or similar tool
```

---

## 📊 What to Look For

### Good Signs ✅
- All scenarios complete without errors
- Final Players: 0 (proper cleanup)
- Final Clients: 0 (no memory leaks)
- Ball position stays in bounds (0-800, 0-600)

### Problems ⚠️
- RuntimeError exceptions
- Players/Clients not cleaned up
- Ball outside play area
- Very long completion times (>5s)

---

## 🔍 Understanding the Output

Example output from `run_tests.py`:

```
SCENARIO: 10 Stable Clients
==============================================
[20:28:57] Client client_0 connecting (stable)
[20:28:57] Client client_1 connecting (stable)
...
[20:28:58] Client client_0 active
[20:28:58] Client client_0 disconnected
...
✓ Scenario completed in 1.11s
  Final Players: 0  ← Should be 0
  Final Clients: 0  ← Should be 0
  Ball Position: (400.0, 300.0)  ← Should be in bounds
```

---

## 🐛 Common Issues & Solutions

### Issue: "Address already in use"
**Solution:** Server is still running from previous test
```bash
# Find and kill the process
lsof -i :8765
kill <PID>
```

### Issue: Module not found
**Solution:** Add pong directory to Python path
```bash
export PYTHONPATH="/Users/glebsvechnikov/Code/web-design/pong:$PYTHONPATH"
```

### Issue: pytest-asyncio errors
**Solution:** Add asyncio mode to pytest.ini or pyproject.toml
```ini
# pytest.ini
[pytest]
asyncio_mode = auto
```

---

## 📈 Performance Benchmarks

| Scenario | Expected Time | Warning Threshold |
|----------|---------------|-------------------|
| 10 Stable Clients | < 2s | > 5s |
| Mixed Behavior | < 3s | > 7s |
| All Unstable | < 1s | > 3s |

---

## 🎯 Next Steps After Testing

1. **Review ANALYSIS.md** for detailed issue breakdown
2. **Check TEST_README.md** for comprehensive documentation
3. **Implement critical fixes** from ANALYSIS.md
4. **Re-run tests** to verify fixes work

---

## 💡 Pro Tips

### Tip 1: Increase Verbosity
Add print statements to see more details:
```python
# In server.py game_loop()
print(f"Ball: ({ball['x']:.1f}, {ball['y']:.1f})")
```

### Tip 2: Stress Test Further
Increase client count in run_tests.py:
```python
# Change from 10 to 50
tasks = [simulate_client(server, i, "stable") for i in range(50)]
```

### Tip 3: Network Simulation
Use tools like `tc` (Linux) or Network Link Conditioner (macOS) to simulate:
- Latency
- Packet loss
- Bandwidth limits

---

## 🆘 Troubleshooting

### Tests won't start
```bash
# Check Python version (need 3.7+)
python3 --version

# Verify dependencies
pip3 list | grep -E "pytest|websockets"
```

### Import errors
```bash
# Make sure you're in the right directory
cd /Users/glebsvechnikov/Code/web-design/pong
ls -la
```

### Async issues
```bash
# Ensure pytest-asyncio is installed
pip3 install pytest-asyncio

# Check pytest configuration
python3 -m pytest --fixtures
```

---

## 📞 Support

If you encounter issues:

1. Check the error message carefully
2. Review ANALYSIS.md for known issues
3. Try running just one test scenario first
4. Verify all dependencies are installed

---

## ✅ Success Criteria

Your tests are successful when:
- ✅ All 3 scenarios complete without crashes
- ✅ No players/clients left after cleanup
- ✅ Ball stays within bounds
- ✅ Completion times are reasonable (<5s total)

---

**Remember:** The goal is to expose glitches, so failing tests are actually helpful - they show what needs to be fixed!
