# 🐛 Audio & Notification Debugging Guide

The audio issues you're experiencing are likely caused by browser autoplay policies and audio context initialization. Here's how to debug and fix:

## 🔧 Step 1: Test Audio Directly

1. **Open the Audio Debug Page:**
   ```
   http://localhost:5173/audio-debug
   ```
2. **Test each audio function manually**
3. **Check browser console** for error messages

## 🎵 Common Audio Issues & Fixes

### Issue 1: Audio Context Suspended

**Problem:** Browser blocks audio until user interaction
**Symptoms:** No sound, console shows "suspended" state

**Fix:** Audio context now auto-resumes on first click/keydown

### Issue 2: Gain Starting at Zero

**Problem:** Dialing sound starts with 0 volume
**Symptoms:** Dialing sound doesn't play

**Fix:** Modified to start immediately with 0.1 gain

### Issue 3: Notification Permission

**Problem:** Browser blocks notifications
**Symptoms:** No incoming call notifications

**Fix:** Check permission status in debug page

## 📱 Testing Steps

1. **Open two browser windows** (different users)
2. **Test audio debug page first** in both windows
3. **Start a call** from User A to User B
4. **Check console logs** for these events:

**Expected Logs (Caller):**

```
📞 Playing dialing sound
🎵 Audio context initialized
📞 [WebSocket] Sending call signal: {type: 'call-offer', ...}
```

**Expected Logs (Receiver):**

```
📞 [WebSocket] Received incoming-call: {...}
📞 Processing call signal: {...}
📞 Received call offer: {...}
🔔 Starting ringing and notification for incoming call
```

## 🔍 If Still Not Working

### Check 1: Browser Console

- Open Developer Tools (F12)
- Look for red error messages
- Check that AudioContext is available

### Check 2: Notification Permissions

- In debug page, check permission status
- If "denied", reset in browser settings

### Check 3: WebSocket Connection

- Ensure both users show "Connected" status
- Check for WebSocket errors in console

### Check 4: Microphone Access (for future video calls)

- Browser may prompt for microphone access
- Must allow for WebRTC to work

## 🧪 Manual Sound Testing

Use the audio debug page to test each sound individually:

1. **Request notifications** first
2. **Test dialing** - should hear pulsing tone
3. **Test ringing** - should hear phone ring pattern
4. **Test effects** - accept/reject sounds

## 📊 Status Indicators

In the audio debug page, check:

- ✅ Audio Context: Available
- ✅ Notification Permission: granted
- 🔔 Ring Status: Should show when ringing
- 📞 Dial Status: Should show when dialing

## 🚀 If Everything Works

If audio debug page works but calling doesn't:

1. Check WebSocket connection in chat
2. Verify call signals are being sent/received
3. Check that incoming calls update call state

## 💡 Quick Fix Summary

The main fixes applied:

1. ✅ **Added hangup button** to outgoing call modal
2. ✅ **Fixed dialing sound** - now starts with proper volume
3. ✅ **Fixed audio context** - auto-resumes on user interaction
4. ✅ **Added notification handling** for incoming calls
5. ✅ **Added extensive debugging** logs throughout

**Test now at:** `http://localhost:5173/audio-debug`
