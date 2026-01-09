# Contract Analysis Automation Guide

## 🚀 Quick Start

The analysis tool now has **automatic virtual environment activation** and helper scripts!

### Simplest Usage

```bash
# Just run the wrapper script - it handles everything!
./tools/analyze
```

That's it! The script automatically:

1. ✅ Activates virtual environment if it exists
2. ✅ Loads tree-sitter from venv
3. ✅ Runs the analysis

## 📦 Setup (One-Time)

### Option 1: Automated Setup (Recommended)

```bash
# Ensures venv exists and installs all dependencies
./tools/ensure_venv.sh
```

This script:

- Creates `.venv/` if it doesn't exist
- Installs `tree-sitter`, `tree-sitter-javascript`, `tree-sitter-typescript`
- Verifies everything works

### Option 2: Manual Setup

```bash
# Create venv
python3 -m venv .venv

# Activate and install
source .venv/bin/activate
pip install tree-sitter tree-sitter-javascript tree-sitter-typescript
```

## 🎯 Usage Methods

### Method 1: Wrapper Script (Easiest) ⭐

```bash
./tools/analyze
./tools/analyze --debug
./tools/analyze --quiet
```

**Benefits:**

- ✅ Auto-activates venv
- ✅ No need to remember `source .venv/bin/activate`
- ✅ Works from any directory
- ✅ Passes all arguments through

### Method 2: Direct Python (Auto-Detects Venv)

```bash
python3 tools/analyze_contracts.py
```

**Benefits:**

- ✅ Auto-detects and uses `.venv/` if available
- ✅ Falls back to system packages if venv not found
- ✅ Works even without wrapper script

### Method 3: Manual Activation (Traditional)

```bash
source .venv/bin/activate
python3 tools/analyze_contracts.py
```

**When to use:**

- If you want explicit control
- If you're already in venv for other work

## 🔧 Available Automations

### 1. Auto-Venv Activation

The `analyze_contracts.py` script automatically:

- Detects `.venv/` directory
- Adds venv's site-packages to Python path
- Loads tree-sitter from venv if system install not available

**No manual activation needed!**

### 2. Wrapper Script (`./tools/analyze`)

A bash wrapper that:

- Auto-activates venv before running
- Passes all arguments to Python script
- Works from any directory

### 3. Setup Script (`./tools/ensure_venv.sh`)

Ensures everything is ready:

- Creates venv if missing
- Installs all dependencies
- Verifies installation

## 📝 Examples

### Basic Analysis

```bash
./tools/analyze
```

### With Debug Output

```bash
./tools/analyze --debug
```

### Quiet Mode (No Warnings)

```bash
./tools/analyze --quiet
```

### From Different Directory

```bash
cd /somewhere/else
/path/to/chat-server/tools/analyze
```

## 🔍 How Auto-Activation Works

### In `analyze_contracts.py`:

1. **Module Load Time**: Tries to import tree-sitter
2. **Main Function**: Calls `auto_activate_venv()`
3. **Venv Detection**: Checks for `.venv/` directory
4. **Path Injection**: Adds venv's site-packages to `sys.path`
5. **Retry Import**: Tries importing tree-sitter again from venv

### In `./tools/analyze`:

1. **Script Start**: Changes to chat-server directory
2. **Venv Check**: Checks if `.venv/` exists
3. **Activation**: Sources `.venv/bin/activate`
4. **Execution**: Runs Python script with all arguments

## 🎨 Integration Examples

### In CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Analyze Contracts
  run: |
    cd chat-server
    ./tools/ensure_venv.sh
    ./tools/analyze
```

### In Pre-commit Hook

```bash
#!/bin/bash
cd chat-server
./tools/analyze --quiet || exit 1
```

### In Makefile

```makefile
analyze:
	cd chat-server && ./tools/analyze

setup:
	cd chat-server && ./tools/ensure_venv.sh
```

## 🐛 Troubleshooting

### Issue: "tree-sitter not installed"

**Solution:**

```bash
./tools/ensure_venv.sh
```

### Issue: Wrapper script not executable

**Solution:**

```bash
chmod +x tools/analyze
chmod +x tools/ensure_venv.sh
```

### Issue: Venv not auto-detected

**Check:**

- `.venv/` directory exists in `chat-server/`
- Python version matches (venv was created with same Python)

**Fix:**

```bash
# Recreate venv
rm -rf .venv
./tools/ensure_venv.sh
```

## 📊 Comparison: Before vs After

### Before (Manual)

```bash
source .venv/bin/activate
python3 tools/analyze_contracts.py
```

### After (Automated) ⭐

```bash
./tools/analyze
```

**Benefits:**

- ✅ One command instead of two
- ✅ No need to remember venv activation
- ✅ Works from any directory
- ✅ Auto-detection as fallback

## 🎯 Best Practices

1. **Use wrapper script** for daily use: `./tools/analyze`
2. **Run setup script** after cloning: `./tools/ensure_venv.sh`
3. **Add to CI/CD** for automated checks
4. **Use `--quiet`** in scripts/automation
5. **Use `--debug`** when troubleshooting

---

**Status**: ✅ **Fully automated and ready to use!**
