# AI Mediator Feature

## Overview
The AI mediator is an intelligent chat moderation system that uses OpenAI's GPT-3.5-turbo to analyze conversations and provide helpful interventions or comments when needed.

## Features
- **Smart Intervention**: Automatically detects when conversations need moderation
- **Helpful Comments**: Provides contextual comments to facilitate discussion
- **Conversation Tracking**: Maintains context from recent messages
- **Non-blocking**: AI analysis runs asynchronously and won't slow down messages

## Setup

### 1. Get an OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new secret key

### 2. Configure the API Key
Add your OpenAI API key to your environment:

**Option A: Using .env file (Recommended)**
```bash
cd chat-server
echo "OPENAI_API_KEY=sk-your-api-key-here" > .env
```

**Option B: Export in terminal**
```bash
export OPENAI_API_KEY=sk-your-api-key-here
```

**Option C: Add to start script**
Edit `start-chat.sh` and add:
```bash
export OPENAI_API_KEY=sk-your-api-key-here
```

## How It Works

### Message Flow
1. User sends a message
2. Message is broadcast to all users immediately
3. AI mediator analyzes the message in the background
4. If intervention is needed, AI message is sent to all users

### Intervention Types

**AI Intervention (Red styling)**
- Triggered when there's conflict, toxicity, or inappropriate content
- Helps de-escalate situations
- Example: "Let's keep things respectful! How about we discuss this calmly?"

**AI Comment (Purple styling)**
- Provides helpful context or facilitates discussion
- Example: "That's an interesting point! Can you tell us more?"

### Styling
- **AI Avatar**: 🤖 with purple gradient background
- **Interventions**: Red background with border
- **Comments**: Purple background with border

## Usage

1. Start the chat server with your OpenAI API key configured
2. Open multiple browser tabs to test with multiple users
3. Try sending messages that might trigger moderation
4. AI mediator will automatically respond when appropriate

## Testing Without API Key

If no `OPENAI_API_KEY` is set, the AI mediator will gracefully skip analysis and the chat will work normally. You'll see a message in the server logs indicating no API key is configured.

## Cost Considerations

The AI mediator uses GPT-3.5-turbo, which is OpenAI's most cost-effective model:
- Each analysis uses ~150-200 tokens
- Estimated cost: ~$0.0002 per analysis
- Only analyzes when messages are sent
- No cost when chat is idle

## Customization

You can modify the AI's behavior in `aiMediator.js`:

- **Change model**: Edit the `model` parameter in `analyzeAndIntervene`
- **Adjust temperature**: Change from 0.7 to make AI more/less creative
- **Modify prompt**: Edit the system or user prompts
- **Change context window**: Adjust `recentMessages.slice(-5)` to include more/less context

## Logs

Watch server logs to see AI activity:
```bash
# When AI intervenes
🤖 AI intervened: [message]

# When AI comments
🤖 AI commented: [message]
```

## Troubleshooting

**AI not responding?**
- Check that `OPENAI_API_KEY` is set correctly
- Look for errors in server logs
- Ensure you have OpenAI API credits

**AI responding too much/too little?**
- Adjust the prompt in `aiMediator.js`
- Modify the temperature setting
- Change the context window size

**Getting rate limited?**
- OpenAI has rate limits based on your tier
- Consider adding a cooldown between AI responses
- Use environment variable for lower rate limits

## Future Enhancements

Possible improvements:
- Sentiment analysis history per user
- Topic detection and summaries
- Spam detection
- Custom trigger words/phrases
- Whitelist/blacklist support
- Admin controls for moderation settings

