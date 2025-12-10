# Documentation Standards

## File Naming Conventions

### ✅ Permanent Documentation
- **Reference docs**: `*_REFERENCE.md` or `*_GUIDE.md`
- **Specifications**: `specs/**/spec.md`, `plan.md`, `tasks.md`
- **Policies**: `policies/*.md`
- **Setup guides**: `docs/*_SETUP.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`

### ❌ Temporary/Historical Files
- **DO NOT USE** in root: `*_COMPLETE.md`, `*_SUMMARY.md`, `*_RESULTS.md`, `*_PROGRESS.md`
- These should go to `docs-archive/` after completion
- Use git commits for completion tracking instead

## When to Create New Docs

### ✅ Create New Documentation
- Feature specifications (specs/)
- Policy updates (policies/)
- Setup guides (docs/)
- Reference documentation (root with *_REFERENCE.md)

### ❌ Don't Create New Files For
- One-time completion reports → Use git commits
- Test summaries → Use test output/reports/
- Scan results → Use reports/ directory
- Progress updates → Use project management tools

## Documentation Lifecycle

1. **Active** (0-6 months): In root or docs/ (actively maintained)
2. **Archive** (6-12 months): Move to docs-archive/ after inactivity
3. **Review** (12+ months): Delete if not referenced or merge into guides

## File Organization

```
/
├── README.md                    # Main project readme
├── START_HERE.md               # Onboarding
├── *_REFERENCE.md              # Reference docs (keep in root)
├── docs/                       # Active operational docs
│   ├── DEPLOYMENT.md
│   ├── *_SETUP.md
│   └── TROUBLESHOOTING.md
├── docs-archive/               # Historical completion reports
├── specs/                      # Feature specifications
└── prompts/                    # Design system & prompts
```

## Pre-Commit Checklist

Before committing markdown files:
- [ ] Is this a completion report? → Move to docs-archive/
- [ ] Is this a one-time summary? → Consider git commit message instead
- [ ] Does this duplicate existing docs? → Merge instead
- [ ] Is this actively maintained? → Keep in root/docs/

