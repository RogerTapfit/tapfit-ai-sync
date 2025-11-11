# Voice Chat Testing Guide

This guide will help you test the ElevenLabs voice chat integration with different avatar genders.

## Overview

The voice chat system automatically selects the appropriate ElevenLabs voice based on the avatar's gender:

- **Female avatars** → **Aria voice** (agent: `agent_8901k9t4q9pxfbzrjrhw4ykv5xna`)
- **Male avatars** → **Roger voice** (agent: `agent_5201k9t9zf56fxfb8617pr308eat`)
- **Neutral avatars** → **River voice** (agent: `agent_4701k9tab8wxf7htq5vyf5qdcbjs`)

## Current Avatar Gender Assignments

### Female Avatars (Aria Voice)
- **Tails** (id: `dd728a36-feb1-449c-9b65-d8e09b6f17d8`)
- **Tygrus** (id: `d34481a8-f552-4292-b1f5-f531ba8e37cb`)

### Male Avatars (Roger Voice)
- **Stark** (id: `2b1b5087-d661-49aa-83b8-40e89ea5afd1`)
- **Petrie** (id: `98200741-5b4d-40aa-98b9-f2ed331a929a`)
- **Night Hawk** (id: `83054791-f1d8-41fa-9465-e0ce56e1d390`)

### Neutral Avatars (River Voice)
- **Banjo** (id: `c7eaad4e-479f-4718-9255-26a6a7b80c1c`)
- **Reptile** (id: `6e426666-7b43-4bf5-b5b8-7934d69339aa`)
- **Ceasar** (id: `38931b89-dbdb-41ba-8052-3d41135ad41c`)
- **Rhydon** (id: `b5acdf2d-2bf8-4d7c-9895-7f2c85f2eeca`)
- All other avatars (default to neutral)

## Testing Steps

### 1. Open Developer Console
- Press `F12` or `Cmd+Option+I` (Mac) to open browser DevTools
- Navigate to the **Console** tab
- This will show detailed logging about which voice is being used

### 2. Select an Avatar
1. Navigate to the Avatar Selection page:
   - Go to **Profile** → **Choose Your Coach**
   - Or directly visit `/avatar-selection`
2. Select an avatar from one of the gender categories above
3. Check the console for:
   ```
   👤 Current Avatar: { name: "...", gender: "...", expectedVoice: "..." }
   ```

### 3. Test Voice Chat
1. Go to any page with voice chat (e.g., **Workout List** page)
2. Click the **voice chat button** (microphone icon)
3. The chat will connect to ElevenLabs

### 4. Verify Voice Configuration
When voice chat connects, check the console logs for:

```javascript
🎤 Voice Chat Configuration: {
  avatarName: "Tails",
  avatarId: "dd728a36-feb1-449c-9b65-d8e09b6f17d8",
  gender: "female",
  voiceName: "Aria",
  agentId: "agent_8901k9t4q9pxfbzrjrhw4ykv5xna"
}
✨ Using Aria voice (female) for Tails
```

### 5. Check Visual Indicators
In the voice chat interface, you should see:
- Avatar name with gender symbol (♀ for female, ♂ for male, ⚪ for neutral)
- Voice name displayed when connected: `Voice: Aria • 🎤 Listening...`

### 6. Listen to the Voice
- Speak into your microphone
- Listen to the AI's response
- Verify the voice matches the expected gender:
  - **Aria** = Clear, professional female voice
  - **Roger** = Deep, confident male voice
  - **River** = Neutral, balanced voice

## Quick Test Matrix

| Avatar | Gender | Expected Voice | Agent ID |
|--------|--------|---------------|----------|
| Tails | Female | Aria | agent_8901k9t4q9pxfbzrjrhw4ykv5xna |
| Tygrus | Female | Aria | agent_8901k9t4q9pxfbzrjrhw4ykv5xna |
| Stark | Male | Roger | agent_5201k9t9zf56fxfb8617pr308eat |
| Petrie | Male | Roger | agent_5201k9t9zf56fxfb8617pr308eat |
| Night Hawk | Male | Roger | agent_5201k9t9zf56fxfb8617pr308eat |
| Banjo | Neutral | River | agent_4701k9tab8wxf7htq5vyf5qdcbjs |
| Reptile | Neutral | River | agent_4701k9tab8wxf7htq5vyf5qdcbjs |
| Ceasar | Neutral | River | agent_4701k9tab8wxf7htq5vyf5qdcbjs |
| Rhydon | Neutral | River | agent_4701k9tab8wxf7htq5vyf5qdcbjs |

## Troubleshooting

### Voice doesn't match expected gender
1. Check the avatar's gender in the database:
   ```sql
   SELECT id, name, gender FROM avatars WHERE name = 'AvatarName';
   ```
2. Verify the avatar gender was updated in the migration
3. Check console logs for the agent ID being used

### "Agent IDs not configured" error
- Ensure all three secrets are set:
  - `ELEVEN_LABS_AGENT_ID_FEMALE`
  - `ELEVEN_LABS_AGENT_ID_MALE`
  - `ELEVEN_LABS_AGENT_ID_NEUTRAL`
- Check Settings → Secrets in Lovable

### Connection fails
- Verify `ELEVEN_LABS_API_KEY` is set
- Check browser console for detailed error messages
- Ensure microphone permissions are granted

## Expected Console Output Example

```javascript
// When selecting avatar
👤 Current Avatar: {
  name: "Stark",
  id: "2b1b5087-d661-49aa-83b8-40e89ea5afd1",
  gender: "male",
  expectedVoice: "Roger"
}

// When connecting to voice chat
Connecting to voice chat...
Getting ElevenLabs session for avatar: Stark 2b1b5087-d661-49aa-83b8-40e89ea5afd1

🎤 Voice Chat Configuration: {
  avatarName: "Stark",
  avatarId: "2b1b5087-d661-49aa-83b8-40e89ea5afd1",
  gender: "male",
  voiceName: "Roger",
  agentId: "agent_5201k9t9zf56fxfb8617pr308eat"
}
✨ Using Roger voice (male) for Stark

ElevenLabs WebSocket opened
Voice connection established
Microphone started successfully
```

## Success Criteria

✅ **Female avatars** use **Aria** voice  
✅ **Male avatars** use **Roger** voice  
✅ **Neutral avatars** use **River** voice  
✅ Console logs show correct agent ID and voice name  
✅ Voice quality matches expected gender characteristics  
✅ UI displays correct voice name when connected  

## Notes

- The voice selection happens automatically based on the avatar's `gender` column in the database
- The `elevenlabs-session` edge function fetches the avatar's gender and selects the appropriate agent
- All voice data is logged to the console for easy debugging
- The system falls back to River (neutral) if gender is undefined or invalid
