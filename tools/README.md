# Python Tools

Python tools for auditing and dashboard functionality.

## Structure

```
tools/
├── __init__.py
├── audit/
│   ├── __init__.py
│   ├── git_history.py    # Git commit history analysis
│   └── db_analysis.py    # Database migration analysis
└── dashboard/
    ├── __init__.py
    ├── ui.py             # Dashboard UI utilities
    └── backend.py        # Dashboard backend functionality
```

## Installation

These tools use Python standard library only - no external dependencies required.

## Usage

### Git History Audit

```python
from tools.audit.git_history import get_git_log, analyze_commit_patterns

# Get recent commits
commits = get_git_log(limit=50)

# Analyze patterns
stats = analyze_commit_patterns(commits)
print(stats)
```

### Database Analysis

```python
from tools.audit.db_analysis import analyze_migrations

# Analyze all migrations
analysis = analyze_migrations('chat-server/migrations')
print(f"Total tables: {analysis['total_tables']}")
```

### Dashboard

```python
from tools.dashboard.backend import generate_report

# Generate complete report
report = generate_report()
print(report)
```

## Running

### Git History Tool

```bash
python tools/audit/git_history.py
```

### Database Analysis Tool

```bash
python tools/audit/db_analysis.py
```

### Dashboard Backend

```bash
python tools/dashboard/backend.py
```

## Features

### Audit Tools

- **git_history.py**: Analyzes git commit history
  - Get commit logs with structured data
  - Analyze commit patterns (by author, type, etc.)
  - Get file changes for specific commits

- **db_analysis.py**: Analyzes database structure
  - Find and parse SQL migration files
  - Extract table definitions
  - Analyze table dependencies

### Dashboard Tools

- **ui.py**: UI formatting utilities
  - Format commit statistics for display
  - Format database statistics
  - Generate summary reports

- **backend.py**: Backend functionality
  - Collect all statistics
  - Save/load dashboard data as JSON
  - Generate complete reports
