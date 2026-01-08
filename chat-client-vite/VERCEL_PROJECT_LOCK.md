# VERCEL PROJECT LOCK - DO NOT MODIFY

⚠️ **CRITICAL: This file ensures deployments only go to the correct Vercel project**

## CORRECT PROJECT CONFIGURATION

**ONLY DEPLOY TO THIS PROJECT:**
- **Project Name**: `chat-client-vite`
- **Project ID**: `prj_3Iz716ASKvPuwjAcu6oGzs8LUhRr`
- **Vercel URL**: `chat-client-vite-a3vgwwysr-aseesys-projects.vercel.app`
- **Org ID**: `team_HQ1x0PlLlVkC2xk3bQ8RXAcH`

## NEVER DEPLOY TO

❌ **DO NOT deploy the main app to:**
- `marketing-site` project
- Any other Vercel project
- Root directory deployments

## VERIFICATION

Before any deployment, verify the project is correct:

```bash
cd chat-client-vite
cat .vercel/project.json
```

Must show:
- `"projectName": "chat-client-vite"`
- `"projectId": "prj_3Iz716ASKvPuwjAcu6oGzs8LUhRr"`

## DEPLOYMENT COMMANDS

**CORRECT deployment (from chat-client-vite directory):**
```bash
cd chat-client-vite
vercel --prod --yes
```

**WRONG deployment (from root or wrong directory):**
```bash
# ❌ NEVER DO THIS:
vercel --prod  # from root directory
cd .. && vercel --prod  # from parent directory
```

## AUTOMATED VALIDATION

All deployment scripts MUST:
1. Check we're in `chat-client-vite` directory
2. Verify `.vercel/project.json` exists
3. Verify project name is `chat-client-vite`
4. Verify project ID matches `prj_3Iz716ASKvPuwjAcu6oGzs8LUhRr`
5. Fail if any check fails

