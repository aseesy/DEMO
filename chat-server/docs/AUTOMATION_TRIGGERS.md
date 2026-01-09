# Contract Analysis Automation Triggers

## ✅ Automatic Triggers (Now Configured)

The contract analysis now runs automatically at these points:

### 1. Pre-Commit Hook (Warning Only) ⚠️

**When**: Before every `git commit`  
**Location**: `.husky/pre-commit`  
**Behavior**:

- ✅ Runs analysis
- ⚠️ Shows warnings if violations found
- ✅ **Does NOT block commit** (warning only)
- 💡 Reminds you to fix before pushing

**Why Warning Only?**

- Pre-commit should be fast
- Full analysis can take a few seconds
- You can fix issues before pushing

### 2. Pre-Push Hook (Blocks Push) ❌

**When**: Before every `git push`  
**Location**: `.husky/pre-push`  
**Behavior**:

- ✅ Runs full analysis
- ❌ **Blocks push if violations found**
- ✅ Must fix issues before pushing

**What Blocks Push?**

- Cross-layer import violations
- Critical architecture violations
- API contract mismatches

### 3. CI/CD Pipeline (Quality Gate) ❌

**When**: On every PR and push to main  
**Location**: `.github/workflows/quality-gates.yml`  
**Behavior**:

- ✅ Runs in GitHub Actions
- ✅ Sets up venv automatically
- ❌ **Fails PR if violations found**
- ✅ Must fix before merging

## 🎯 What Gets Checked

1. **Cross-Layer Imports** ❌
   - Client importing from server
   - Server importing from client
   - Architecture boundary violations

2. **API Schema Validation** ⚠️
   - Routes missing Zod schemas
   - Missing validation middleware

3. **Code Quality Issues** ⚠️
   - `@ts-ignore` comments
   - `any` type usage
   - Hardcoded URLs

4. **API Contract Mismatches** ⚠️
   - Client calls non-existent routes
   - Route path mismatches

## 🚀 Manual Triggers

You can also run manually:

```bash
# From project root
./tools/analyze-contracts

# From chat-server
cd chat-server
./tools/analyze

# Via npm script
cd chat-server
npm run analyze:contracts
```

## ⚙️ Configuration

### Skip Hooks (Not Recommended)

```bash
# Skip pre-commit (analysis still runs in pre-push)
git commit --no-verify

# Skip pre-push (not recommended - violations will fail CI)
git push --no-verify
```

### Disable Analysis Temporarily

Edit `.husky/pre-commit` or `.husky/pre-push` and comment out the analysis section.

## 📊 Example Output

### Pre-Commit (Warning)

```
🔍 Running contract analysis (warning only)...
⚠️  134 routes without schema validation
⚠️  Found 25 code quality issues
💡 Fix contract violations before pushing (run: ./tools/analyze-contracts)
```

### Pre-Push (Blocking)

```
🔍 Running contract & architecture analysis...
❌ Contract analysis found violations!
   Run: ./tools/analyze-contracts to see details
```

### CI/CD (Failing)

```
Run contract analysis...
❌ Contract analysis found violations!
Error: Process completed with exit code 1
```

## 🔧 Troubleshooting

### Issue: "analyze_contracts.py not found"

**Solution**: Make sure you're in the project root or chat-server directory.

### Issue: ".venv not found"

**Solution**: Run setup:

```bash
cd chat-server
./tools/ensure_venv.sh
```

### Issue: Analysis too slow in pre-commit

**Solution**: Pre-commit only shows warnings. Full check happens in pre-push and CI.

### Issue: Want to skip analysis temporarily

**Solution**: Use `--no-verify` flag (not recommended):

```bash
git commit --no-verify
git push --no-verify  # Still fails in CI
```

## 📈 Benefits

1. **Catch Issues Early** ✅
   - Find violations before they reach main
   - Prevent architecture drift

2. **Enforce Standards** ✅
   - All routes must have schemas
   - No cross-layer imports
   - Clean architecture boundaries

3. **Prevent Breaking Changes** ✅
   - API contract mismatches caught
   - Client/server sync verified

4. **Team Consistency** ✅
   - Everyone runs same checks
   - CI ensures compliance

---

**Status**: ✅ **Fully automated and integrated!**
