#!/bin/bash

# Get the webhook URL for GitHub Codespaces or local development

if [ -n "$CODESPACE_NAME" ]; then
  # We're in GitHub Codespaces
  WEBHOOK_URL="https://${CODESPACE_NAME}-5000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/api/webhooks/up-bank"
  echo "🚀 GitHub Codespaces Detected"
  echo ""
  echo "Your webhook URL is:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$WEBHOOK_URL"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "⚠️  IMPORTANT: Make sure port 5000 is set to PUBLIC in VS Code PORTS tab"
  echo ""
  echo "To set up the webhook:"
  echo "1. Go to Settings in your app"
  echo "2. Scroll to 'Webhook Management' section"
  echo "3. Click 'Setup Webhook' button"
  echo "4. The system will automatically use the above URL"
  echo ""
else
  echo "⚠️  Not running in GitHub Codespaces"
  echo ""
  echo "For local development, you need to use ngrok or similar:"
  echo "1. Install ngrok: https://ngrok.com/download"
  echo "2. Run: ngrok http 5000"
  echo "3. Copy the https URL (e.g., https://abc123.ngrok.io)"
  echo "4. Use that URL + /api/webhooks/up-bank"
  echo ""
fi
