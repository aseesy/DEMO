# VAPID Keys Setup Guide

VAPID (Voluntary Application Server Identification) keys are required for Web Push API to send push notifications to users' devices.

## Generated Keys

Your VAPID keys have been generated:

**Public Key:**
```
BNnD6XTZ6cpMVf3t6kq5Gjx2hJhx0FpR8BxPNxEwje3XuiVQNtIc6UnyFtGdWxQjiiPfRQ5QUkCxGPp5uG91gqs
```

**Private Key:**
```
WU_mvOkJF60sCnFnZw8d9QVsOjublI1F__80D5UHsRw
```

## Setup Instructions

### 1. Local Development

The keys are already hardcoded in the code for local development. No action needed.

### 2. Production (Railway)

Set these as environment variables in your Railway project:

1. Go to your Railway project dashboard
2. Navigate to your service (chat-server)
3. Go to the "Variables" tab
4. Add the following environment variables:

```
VAPID_PUBLIC_KEY=BNnD6XTZ6cpMVf3t6kq5Gjx2hJhx0FpR8BxPNxEwje3XuiVQNtIc6UnyFtGdWxQjiiPfRQ5QUkCxGPp5uG91gqs
VAPID_PRIVATE_KEY=WU_mvOkJF60sCnFnZw8d9QVsOjublI1F__80D5UHsRw
```

### 3. Frontend

The public key is already updated in `chat-client-vite/src/hooks/pwa/usePWA.js`.

**Note:** The frontend public key must match the server's public key. Both are currently set to the same value.

## Regenerating Keys

If you need to regenerate keys (e.g., for security reasons):

```bash
cd chat-server
npx web-push generate-vapid-keys
```

Then update:
1. `VAPID_PUBLIC_KEY` in `chat-server/services/pushNotificationService.js`
2. `VAPID_PUBLIC_KEY` in `chat-client-vite/src/hooks/pwa/usePWA.js`
3. `VAPID_PRIVATE_KEY` environment variable in production (Railway)

## Security Notes

- **Never commit the private key to git** - it's already in `.gitignore` patterns
- The private key should only be set as an environment variable in production
- The public key can be safely included in client-side code (it's meant to be public)
- Keep your private key secure - anyone with it can send push notifications to your users

## Testing

After setting up the keys:

1. Users need to grant notification permissions
2. The app will automatically subscribe to push notifications
3. When a user receives a message, they'll get a push notification even if the app is closed

