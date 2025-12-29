# Data Integrity Scripts

These scripts help detect and fix data integrity issues that may have been introduced during migrations or naming convention changes.

## Scripts

### 1. `check-data-integrity.js`

Comprehensive data integrity checker that detects:
- **Email mismatches**: Messages where `user_email` doesn't match `users.email` (case, whitespace, or missing user)
- **Missing user records**: Messages from users that don't exist in the `users` table
- **Empty critical fields**: NULL or empty values in required fields (user_email, text, room_id, timestamp)
- **Orphaned messages**: Messages referencing rooms that don't exist
- **Orphaned room members**: Room members referencing missing users or rooms
- **Pairing inconsistencies**: Pairings with missing users or rooms
- **Room membership issues**: Rooms with no members or only one member
- **Naming inconsistencies**: Case mismatches and whitespace in emails

**Usage:**
```bash
# Check local database
node scripts/check-data-integrity.js

# Check production database
node scripts/check-data-integrity.js --production
```

### 2. `fix-data-integrity.js`

Automatically fixes common data integrity issues:
- Normalizes email case (converts to lowercase)
- Removes whitespace from emails
- Creates missing user records from messages (excludes placeholders and test emails)
- Removes orphaned room members

**Usage:**
```bash
# Dry run (see what would be fixed)
node scripts/fix-data-integrity.js --dry-run

# Apply fixes to local database
node scripts/fix-data-integrity.js

# Apply fixes to production database
node scripts/fix-data-integrity.js --production
```

## Common Issues and Solutions

### Issue: Messages with `sender: null`

**Cause**: User lookup fails because:
- Email case mismatch (e.g., `Athena@Example.com` vs `athena@example.com`)
- Whitespace in email (e.g., ` athena@example.com `)
- User record doesn't exist

**Solution**: 
1. Run `check-data-integrity.js` to identify issues
2. Run `fix-data-integrity.js` to automatically fix case and whitespace
3. For missing users, the fix script will create them (or you can create manually)

### Issue: Missing Messages in Production

**Cause**: 
- User lookup fails → `buildUserObject` returns `null` → message has `sender: null`
- Frontend may filter out messages with `sender: null`

**Solution**:
1. Fixed in code: `buildUserObject` now returns minimal object with `uuid: null` if user lookup fails
2. Run integrity check to find and fix email mismatches
3. Ensure all users exist in `users` table

### Issue: Room Not Found

**Cause**:
- Room lookup doesn't use `user_pairing_status` VIEW
- Pairing status changed but room still exists
- Room members don't match pairing

**Solution**:
- Code updated to use `user_pairing_status` VIEW consistently
- Run integrity check to find orphaned records

## Best Practices

1. **Run checks regularly**: Add to CI/CD or run weekly
2. **Always dry-run first**: Use `--dry-run` before applying fixes
3. **Backup before fixes**: Especially in production
4. **Review output**: Understand what will be fixed before applying
5. **Monitor after fixes**: Re-run check script to verify fixes

## Integration with CI/CD

You can add these scripts to your deployment pipeline:

```bash
# Pre-deployment check
node scripts/check-data-integrity.js --production

# Post-deployment check
node scripts/check-data-integrity.js --production
```

## Example Workflow

```bash
# 1. Check for issues
node scripts/check-data-integrity.js --production

# 2. Review the output

# 3. Dry-run fixes
node scripts/fix-data-integrity.js --production --dry-run

# 4. Apply fixes
node scripts/fix-data-integrity.js --production

# 5. Verify fixes
node scripts/check-data-integrity.js --production
```

