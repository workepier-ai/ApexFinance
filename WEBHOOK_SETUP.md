# Webhook Setup Guide for GitHub Codespaces

## Overview
This guide explains how to set up UP Bank webhooks in GitHub Codespaces for real-time transaction sync.

## Your Webhook URL
```
https://silver-space-fishstick-v675ggjgg7pxfxxjw-5000.app.github.dev/api/webhooks/up-bank
```

## Setup Steps

### 1. Configure Port Visibility (CRITICAL)

GitHub Codespaces requires port 5000 to be **Public** for external webhooks to reach it.

**In VS Code:**
1. Click on the **PORTS** tab (bottom panel, next to TERMINAL)
2. Find port **5000** in the list
3. Right-click on port 5000
4. Select **Port Visibility** → **Public**

**Visual confirmation:**
- Port 5000 should show a 🌐 globe icon indicating it's public
- The Visibility column should say "Public"

### 2. Test Port Accessibility

Run this command to verify the port is accessible:
```bash
./scripts/get-webhook-url.sh
```

Or test directly:
```bash
curl -X POST https://silver-space-fishstick-v675ggjgg7pxfxxjw-5000.app.github.dev/api/webhooks/up-bank \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 3. Set Up Webhook in the App

1. Open your app in the browser
2. Navigate to **Settings** page
3. Scroll to **Webhook Management** section
4. Click **Setup Webhook** button
5. The system will automatically:
   - Detect the Codespaces URL
   - Register the webhook with UP Bank
   - Store the configuration

### 4. Test Webhook Delivery

After setup:
1. Click **Test Webhook** button to send a ping
2. Click **View Logs** to see delivery status
3. Make a real transaction in UP Bank app
4. Check the logs to verify webhook was received

## How It Works

### Without Webhooks (Current - Full Sync)
- Every sync fetches 500 transactions from UP Bank
- High API usage
- Slower sync times
- Risk of hitting rate limits

### With Webhooks (Smart Sync)
- UP Bank notifies your app when events occur
- Only fetch transactions that had failed webhook deliveries
- Minimal API usage (often 0 transactions to fetch)
- Real-time updates
- Efficient and fast

## Webhook Events

UP Bank sends webhooks for these events:
- `TRANSACTION_CREATED` - New transaction
- `TRANSACTION_SETTLED` - Transaction settled
- `TRANSACTION_DELETED` - Transaction deleted

Your app processes these events and updates the database automatically.

## Troubleshooting

### Webhook setup fails with "Port not accessible"
- **Solution:** Make sure port 5000 is set to Public in PORTS tab

### Webhooks not being received
- **Solution:** Check the delivery logs in Settings → View Logs
- **Solution:** Verify the webhook URL in UP Bank dashboard

### 401 Unauthorized error
- **Solution:** Port 5000 must be Public (not Private)
- **Solution:** Restart the Codespace if recently changed visibility

### Temporary Codespace URL changes
- **Solution:** If you delete and recreate the Codespace, the URL changes
- **Solution:** Delete old webhook and create a new one with the new URL

## Benefits

✅ **Real-time sync** - Transactions appear instantly
✅ **Reduced API calls** - From 500+ per sync to 0-10
✅ **Lower rate limit risk** - Minimal API usage
✅ **Better performance** - No need to poll for changes
✅ **Cost effective** - Fewer API calls = better quota usage

## Production Deployment

For production (not Codespaces), you'll need:
1. A server with a public HTTPS URL
2. Valid SSL certificate
3. Deploy your app to that server
4. Update webhook URL to point to production server

Example production URLs:
- `https://your-domain.com/api/webhooks/up-bank`
- `https://your-app.herokuapp.com/api/webhooks/up-bank`
- `https://your-app.vercel.app/api/webhooks/up-bank`
