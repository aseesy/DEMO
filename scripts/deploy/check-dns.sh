#!/bin/bash
echo "🔍 Checking DNS propagation for www.coparentliaizen.com"
echo "Target: Vercel (cname.vercel-dns.com or 76.76.21.98)"
echo "Current: Railway (xti1fefp.up.railway.app or 66.33.22.121)"
echo ""

while true; do
  RESULT=$(dig www.coparentliaizen.com +short | head -1)
  TIMESTAMP=$(date '+%H:%M:%S')
  
  if echo "$RESULT" | grep -q "vercel\|76.76.21"; then
    echo "[$TIMESTAMP] ✅ DNS updated! Now pointing to Vercel: $RESULT"
    exit 0
  else
    echo "[$TIMESTAMP] ⏳ Still pointing to Railway: $RESULT"
  fi
  
  sleep 60
done
