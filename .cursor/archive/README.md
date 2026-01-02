# Archive Directory

This directory contains archived documentation and historical records of major refactorings, architectural changes, and system improvements.

## Purpose

The archive preserves historical context and implementation details for:

- **Refactoring documentation**: Major code refactorings and architectural improvements
- **Deprecated systems**: Documentation of systems that have been replaced or removed
- **Learning reference**: Past decisions and their rationale for future reference

## Organization Structure

Files are organized by category with dated filenames:

```
archive/
├── README.md              # This file
├── refactoring/           # Major refactoring documentation
│   ├── YYYYMMDD-*.md     # Dated refactoring documents
│   └── ...
└── [other-categories]/    # Future categories as needed
```

## File Naming Convention

Files use the format: `YYYYMMDD-DESCRIPTIVE_NAME.md`

- **YYYYMMDD**: Date when the document was created (ISO date format)
- **DESCRIPTIVE_NAME**: Clear, descriptive name in UPPER_SNAKE_CASE

**Examples:**

- `20250101-REFACTORING_SUMMARY.md` - Refactoring summary from January 1, 2025
- `20250101-USESENDMESSAGE_REFACTORING.md` - useSendMessage refactoring from January 1, 2025

## When to Archive

Archive documents when:

1. **Refactoring complete**: The refactoring has been fully implemented and integrated
2. **System deprecated**: A system has been replaced and is no longer in use
3. **Historical reference**: The document provides valuable context but is no longer actively used

## Adding New Documents

1. Use the date format `YYYYMMDD` for the filename prefix
2. Place in appropriate category directory (create if needed)
3. Use descriptive, UPPER_SNAKE_CASE names
4. Include a brief description in the document header

## Current Contents

### Refactoring (2025-01-01)

- `20250101-REFACTORING_SUMMARY.md` - Summary of useSendMessage refactoring
- `20250101-USESENDMESSAGE_REFACTORING.md` - Detailed useSendMessage refactoring guide

## Maintenance

- **Review quarterly**: Check if any documents should be moved to archive
- **Update README**: Keep this file updated when adding new categories
- **Preserve context**: Don't delete archived documents - they provide valuable historical context

---

**Last Updated**: 2025-01-02
