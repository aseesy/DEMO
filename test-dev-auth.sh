#!/bin/bash

# Dev Auth Testing Script
# Tests the dev-only authentication endpoints

BASE_URL="http://localhost:3000"
COOKIE_FILE="cookies.txt"

echo "🧪 Testing Dev Auth Endpoints"
echo "================================"

# Test 1: Check dev routes status
echo -e "\n1. Checking dev routes status..."
STATUS=$(curl -s "$BASE_URL/__dev/status")
echo "$STATUS" | jq . 2>/dev/null || echo "$STATUS"

# Test 2: Create test user session
echo -e "\n2. Creating test user session..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/__dev/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "firstName": "Test", "lastName": "User"}' \
  -c "$COOKIE_FILE")

echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extract token if available
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

# Test 3: Get current user info
echo -e "\n3. Getting current user info..."
if [ -f "$COOKIE_FILE" ]; then
  ME_RESPONSE=$(curl -s "$BASE_URL/__dev/me" -b "$COOKIE_FILE")
  echo "$ME_RESPONSE" | jq . 2>/dev/null || echo "$ME_RESPONSE"
else
  echo "❌ Cookie file not found"
fi

# Test 4: Test protected API endpoint
echo -e "\n4. Testing protected API endpoint..."
if [ -f "$COOKIE_FILE" ]; then
  API_RESPONSE=$(curl -s "$BASE_URL/api/user/me" -b "$COOKIE_FILE")
  echo "$API_RESPONSE" | jq . 2>/dev/null || echo "$API_RESPONSE"
else
  echo "❌ Cookie file not found"
fi

# Test 5: Logout
echo -e "\n5. Logging out..."
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/__dev/logout" \
  -b "$COOKIE_FILE" \
  -c "$COOKIE_FILE")

echo "$LOGOUT_RESPONSE" | jq . 2>/dev/null || echo "$LOGOUT_RESPONSE"

# Test 6: Verify logout worked
echo -e "\n6. Verifying logout (should fail)..."
AFTER_LOGOUT=$(curl -s "$BASE_URL/__dev/me" -b "$COOKIE_FILE")
echo "$AFTER_LOGOUT" | jq . 2>/dev/null || echo "$AFTER_LOGOUT"

# Cleanup
rm -f "$COOKIE_FILE"

echo -e "\n✅ Dev auth testing complete!"
echo "================================"

