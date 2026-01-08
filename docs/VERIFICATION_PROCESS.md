# Verification Process for Configuration Changes

**Purpose**: Prevent incorrect changes by always verifying against actual codebase state

## The Problem

When reviewing documentation, I found inconsistencies and made changes based on assumptions rather than verification.

## The Mistake

**What I did wrong:**
1. Saw `README.md` showed `PORT=8080`
2. Assumed README.md was authoritative
3. Changed code to match README.md
4. **Didn't verify** against actual `.env` files or running code

**Result**: Changed everything to 8080, but actual codebase uses 3000

## Correct Process

### Step 1: Check Actual State First ✅

**Before making any changes, verify:**

```bash
# 1. Check actual .env files (source of truth)
cat chat-server/.env | grep PORT
cat chat-client-vite/.env | grep VITE_API_URL

# 2. Check what scripts actually use
grep "BACKEND_PORT\|PORT" scripts/dev.mjs

# 3. Check config files
grep "DEFAULT.*PORT\|PORT.*=" chat-server/config.js

# 4. Check what the code actually does
grep "process.env.PORT\|PORT.*||" chat-server/server.js
```

### Step 2: Identify Conflicts ✅

**If documentation and code don't match:**
- ❌ Don't assume documentation is wrong
- ❌ Don't assume code is wrong
- ✅ **Ask the user** which is correct
- ✅ Check git history to understand why

### Step 3: Verify Before Changing ✅

**Test your assumptions:**

```bash
# What port does the server actually use?
cd chat-server
node -e "require('dotenv').config(); const { SERVER_PORT } = require('./config'); console.log('Default:', SERVER_PORT); console.log('Env:', process.env.PORT || 'not set');"

# What does the dev script use?
grep "BACKEND_PORT" scripts/dev.mjs
```

### Step 4: Change Code, Then Docs ✅

**Order matters:**
1. ✅ Verify what code actually does
2. ✅ If code needs to change, change code first
3. ✅ Then update documentation to match
4. ✅ Never change code to match outdated docs

## Verification Checklist

**Before changing configuration values:**

- [ ] Check actual `.env` files
- [ ] Check config files (`config.js`)
- [ ] Check scripts (`dev.mjs`, etc.)
- [ ] Check running code behavior
- [ ] Check git history (`git log -p --all -S "PORT"`)
- [ ] Ask user if conflicts found

## Rules

### Rule 1: Code > Documentation
- Running code is always the source of truth
- Documentation can be outdated
- When they conflict, code wins

### Rule 2: Verify Multiple Sources
- Don't trust a single source
- Check `.env`, config, scripts, and code
- Cross-reference everything

### Rule 3: Ask When Uncertain
- If documentation and code conflict, ask
- Don't guess which is correct
- User knows their actual setup

### Rule 4: Test Assumptions
- Never change based on assumptions
- Always verify first
- Test your understanding

## Example: Port Configuration

**Wrong approach (what I did):**
1. Read README.md → saw `PORT=8080`
2. Assumed README.md is correct
3. Changed `config.js` to 8080
4. Changed all docs to 8080
5. ❌ But actual `.env` had `PORT=3000`

**Correct approach:**
1. Read README.md → saw `PORT=8080`
2. Check actual `.env` → found `PORT=3000`
3. Check `dev.mjs` → found `BACKEND_PORT = ... || 3000`
4. Check `config.js` → found `DEFAULT_BACKEND_PORT = 3000`
5. **Ask user**: "README.md says 8080, but your code uses 3000. Which is correct?"
6. User says: "3000 is correct"
7. ✅ Update README.md to match code (3000)

## Prevention Strategy

### For AI Assistants

1. **Always verify** before changing configuration
2. **Check multiple sources** (code, .env, scripts, docs)
3. **Ask when uncertain** - don't guess
4. **Test assumptions** - verify your understanding

### For Documentation

1. **Keep docs in sync** with code
2. **Update docs** when code changes
3. **Verify examples** match actual usage
4. **Test examples** before committing

### For Code Reviews

1. **Verify configuration** matches documentation
2. **Check for inconsistencies** across files
3. **Test actual behavior** not just code
4. **Document assumptions** in comments

---

**Key Takeaway**: Always verify against actual codebase state before making changes. Code is the source of truth, not documentation.

