# START HERE - SDD Agentic Framework Setup

**One-command setup for Windows, macOS, and Linux**

This framework automatically installs all dependencies and guides you through project initialization. No technical experience required!

---

## 🚀 Quick Setup (Choose Your Platform)

### Windows (PowerShell or CMD)

Open PowerShell or Command Prompt and run:

```powershell
# Navigate to the framework directory
cd path\to\sdd-agentic-framework

# Run automatic setup (installs everything for you)
powershell -ExecutionPolicy Bypass -File .specify\scripts\setup-windows.ps1
```

**What this installs automatically:**

- Git for Windows (includes Git Bash)
- Node.js v20 LTS (includes npm)
- Claude Code CLI (with guidance)
- Framework dependencies
- Project configuration

---

### macOS (Terminal)

Open Terminal and run:

```bash
# Navigate to the framework directory
cd path/to/sdd-agentic-framework

# Run automatic setup (installs everything for you)
bash .specify/scripts/setup.sh
```

**What this installs automatically:**

- Node.js (via Homebrew if available)
- Git (if not already installed)
- Claude Code CLI (with guidance)
- Framework dependencies
- Project configuration

---

### Linux (Terminal)

Open Terminal and run:

```bash
# Navigate to the framework directory
cd path/to/sdd-agentic-framework

# Run automatic setup (installs everything for you)
bash .specify/scripts/setup.sh
```

**What this installs automatically:**

- Node.js (via apt/yum/dnf)
- Git (if not already installed)
- Claude Code CLI (with guidance)
- Framework dependencies
- Project configuration

---

## ✅ That's It!

The setup script will:

1. ✅ Detect your operating system
2. ✅ Check for required software (Node.js, Git, Claude Code)
3. ✅ Install missing dependencies automatically
4. ✅ Set up the framework
5. ✅ Guide you through creating your first PRD
6. ✅ Offer to launch Claude Code for you

**No manual installation required!**

---

## 🎯 After Setup: Your First Steps

Once setup completes, you'll be guided through:

### Step 1: Create a Product Requirements Document (PRD)

The setup will recommend creating a PRD first. This serves as your Single Source of Truth (SSOT).

```bash
# Claude Code will open automatically, then run:
/create-prd "Your Project Name"
```

### Step 2: Customize the Constitution

Edit `.specify/memory/constitution.md` using guidance from your PRD to customize all 14 principles for your project.

### Step 3: Create Specialized Agents (Optional)

```bash
# In Claude Code:
/create-agent "agent-name" "Description of what this agent does"
```

### Step 4: Start Feature Development

```bash
# In Claude Code:
/specify "feature name"  # Create specification
/plan                    # Generate implementation plan
/tasks                   # Create task list
```

---

## 📋 Manual Setup (If Automatic Setup Fails)

If the automatic setup doesn't work for any reason, you can install dependencies manually:

### Windows Manual Steps

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org/) (v18 or higher)
   - Run installer, accept defaults
   - Restart PowerShell

2. **Install Git for Windows**
   - Download from [git-scm.com](https://git-scm.com/download/win)
   - Run installer, accept defaults
   - Restart PowerShell

3. **Install Claude Code**
   - Visit [claude.ai/code](https://claude.ai/code)
   - Follow Windows installation instructions
   - Run `claude login` in PowerShell

4. **Run Framework Setup**
   ```powershell
   npm install
   ```

### macOS/Linux Manual Steps

1. **Install Node.js**

   ```bash
   # macOS (with Homebrew)
   brew install node

   # Linux (Ubuntu/Debian)
   sudo apt-get update && sudo apt-get install -y nodejs npm

   # Linux (Fedora/RHEL)
   sudo dnf install -y nodejs npm
   ```

2. **Install Git**

   ```bash
   # macOS
   brew install git
   # Or: xcode-select --install

   # Linux (Ubuntu/Debian)
   sudo apt-get install -y git

   # Linux (Fedora/RHEL)
   sudo dnf install -y git
   ```

3. **Install Claude Code**
   - Visit [claude.ai/code](https://claude.ai/code)
   - Follow installation instructions for your platform
   - Run `claude login`

4. **Run Framework Setup**
   ```bash
   npm install
   ```

---

## 🔧 Alternative Setup Commands (If You Already Have Node.js)

If you already have Node.js installed, you can use npm scripts:

```bash
# Windows
npm run setup:windows

# macOS
npm run setup:macos

# Linux
npm run setup:linux

# Auto-detect (may not work on Windows)
npm run setup
```

---

## 🤖 What is Claude Code?

Claude Code is your AI development assistant for this framework. It:

- Guides you through setup and configuration
- Helps troubleshoot any errors
- Executes framework commands (`/specify`, `/plan`, `/tasks`, `/create-prd`)
- Assists with feature development
- Answers questions about the framework

**Think of Claude Code as your co-pilot throughout development.**

---

## 🆘 Troubleshooting

### Setup Script Won't Run

**Windows:**

- Make sure you're in PowerShell or CMD (not Git Bash for the initial setup)
- Try running PowerShell as Administrator
- Check the full command:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .specify\scripts\setup-windows.ps1
  ```

**macOS/Linux:**

- Make sure the script is executable:
  ```bash
  chmod +x .specify/scripts/setup.sh
  bash .specify/scripts/setup.sh
  ```

### Line Ending Errors (CRLF Issues)

**Symptoms:**

```bash
bash: $'\r': command not found
syntax error near unexpected token `$'\r''
cannot execute: required file not found
```

**Cause:** Scripts have Windows line endings (CRLF) instead of Unix line endings (LF)

**Quick Fix:**

```bash
# Run the emergency line ending fixer
bash fix-line-endings.sh
```

**Manual Fix:**

```bash
# Remove carriage returns from all scripts
find .specify/scripts -name "*.sh" -type f -exec sed -i 's/\r$//' {} \;

# Make scripts executable
chmod +x .specify/scripts/*.sh
chmod +x .specify/scripts/bash/*.sh

# Try setup again
bash .specify/scripts/setup.sh
```

**Why this happens:**

- Git on Windows may checkout files with CRLF line endings
- Running the scripts in WSL/Git Bash requires LF endings
- The framework now includes `.gitattributes` to prevent this

### PowerShell Parse Errors

**Symptoms:**

```powershell
Unexpected token 'Path","User")
Missing expression after unary operator '--'
```

**Cause:** Character encoding issues or corrupted script

**Fix:**

```powershell
# Re-clone the repository
cd ..
git clone https://github.com/kelleysd-apps/sdd-agentic-framework.git
cd sdd-agentic-framework

# Try setup again
powershell -ExecutionPolicy Bypass -File .specify\scripts\setup-windows.ps1
```

### Downloads Fail

- Check your internet connection
- Try downloading manually from:
  - Node.js: https://nodejs.org/
  - Git: https://git-scm.com/
  - Claude Code: https://claude.ai/code

### Claude Code Won't Install

Claude Code installation may require manual steps:

1. Visit https://claude.ai/code
2. Sign in or create an account
3. Follow platform-specific installation instructions
4. Run `claude login` after installation
5. Re-run the setup script

### Still Stuck?

Once Claude Code is installed, open it and ask:

```
"I'm having trouble setting up the SDD framework. Here's the error I'm getting: [paste error]"
```

Claude Code has full context of the framework and can help troubleshoot!

---

## 📊 What Gets Installed

The setup scripts install the following:

| Software        | Version    | Purpose                              | Size                                |
| --------------- | ---------- | ------------------------------------ | ----------------------------------- |
| **Node.js**     | v18-20 LTS | JavaScript runtime for framework     | ~50MB                               |
| **npm**         | v9+        | Package manager (comes with Node.js) | Included                            |
| **Git**         | Latest     | Version control                      | ~250MB (Windows), ~50MB (Mac/Linux) |
| **Claude Code** | Latest     | AI development assistant             | ~100MB                              |

**Total download size:** ~300-400MB depending on platform

**Installation time:** 5-15 minutes depending on internet speed

---

## 🎓 Framework Overview

Once setup is complete, you'll have access to:

### Core Workflow Commands

| Command         | Purpose                              | When to Use                      |
| --------------- | ------------------------------------ | -------------------------------- |
| `/create-prd`   | Create Product Requirements Document | **Start here** - Before any code |
| `/specify`      | Create feature specification         | Beginning of each feature        |
| `/plan`         | Generate implementation plan         | After specification              |
| `/tasks`        | Create dependency-ordered task list  | After planning                   |
| `/create-agent` | Create specialized AI agent          | When you need domain expertise   |
| `/finalize`     | Pre-commit compliance validation     | Before committing code           |

### 14 Constitutional Principles

The framework enforces 14 core principles:

- **Principle I-III:** Library-First, Test-First, Contract-First (Immutable)
- **Principle IV-IX:** Quality & Safety (Idempotency, Progressive Enhancement, Git Approval, Observability, Documentation Sync, Dependency Management)
- **Principle X-XIV:** Workflow & Delegation (Agent Delegation, Input Validation, Design System, Access Control, AI Model Selection)

### DS-STAR Multi-Agent System

5 specialized agents for quality and automation:

- **VerificationAgent** - Quality gates at each workflow stage
- **FinalizerAgent** - Pre-commit constitutional compliance
- **RouterAgent** - Intelligent multi-agent orchestration
- **AutoDebugAgent** - Self-healing (>70% fix rate target)
- **ContextAnalyzerAgent** - Codebase intelligence

---

## 📁 Project Structure

After setup, your project will have:

```
your-project/
├── .specify/              # Framework core
│   ├── memory/           # Constitution and agent triggers
│   ├── scripts/          # Automation scripts
│   ├── templates/        # Document templates
│   └── config/           # Framework configuration
├── .claude/              # AI assistant configuration
│   ├── agents/           # Specialized agent definitions
│   └── commands/         # Custom command documentation
├── .docs/                # Project documentation
│   ├── agents/           # Agent memory and context
│   └── prd/              # Product requirements
├── specs/                # Feature specifications
├── .env                  # Environment configuration
├── package.json          # Project configuration
├── CLAUDE.md             # AI instructions (auto-updated)
├── README.md             # Your project readme
└── START_HERE.md         # This file
```

---

## 🎯 Success Criteria

You'll know setup succeeded when:

- ✅ No error messages during setup
- ✅ Claude Code launches successfully
- ✅ You can run `/create-prd` in Claude Code
- ✅ Files exist in `.specify/`, `.claude/`, and `.docs/` directories
- ✅ `npm install` completed without errors

---

## 🚦 Next Steps After Setup

1. **Open Claude Code** (if not already open)

   ```bash
   claude code .
   ```

2. **Create your PRD** (Recommended first step)

   ```
   /create-prd "Your Project Name"
   ```

3. **Customize constitution** with guidance from PRD

   ```
   Edit: .specify/memory/constitution.md
   ```

4. **Create your first feature**

   ```
   /specify "user authentication"
   /plan
   /tasks
   ```

5. **Start developing!** 🎉

---

## 💡 Pro Tips

- **Always start with a PRD** - It saves time by providing clear direction
- **Use Claude Code for everything** - It's your co-pilot, not just a tool
- **Read the constitution** - `.specify/memory/constitution.md` explains the rules
- **Follow the workflow** - PRD → Spec → Plan → Tasks → Implement → Finalize
- **Ask Claude when stuck** - "How do I [task]?" works great
- **Trust the quality gates** - They prevent bugs and enforce best practices

---

## 📚 Additional Resources

After completing setup, explore these files:

- **CLAUDE.md** - Complete AI assistant instructions
- **README.md** - Framework features and architecture
- **.specify/memory/constitution.md** - 14 development principles
- **AGENTS.md** - Specialized agent documentation
- **.claude/commands/** - Custom command documentation

---

## ✨ You're Ready!

The framework is now set up and ready to use. Remember:

1. **Start with `/create-prd`** to establish your Single Source of Truth
2. **Use Claude Code** as your co-pilot throughout development
3. **Follow the workflow** for consistent, high-quality results
4. **Ask Claude for help** whenever you're unsure

Welcome to specification-driven development with AI assistance! 🚀
