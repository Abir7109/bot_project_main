# Bot Project 1

A simple personal Discord bot with minimal commands and features.

## Features

- **Welcome Messages**: Automatically welcomes new members
- **Basic Commands**:
  - `!hello` - Bot greets you
  - `!ping` - Check bot latency
  - `!info` - Display bot information
  - `!help` - Show all available commands (built-in)

## Setup

1. **Install Python** (3.8 or higher)

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Create a Discord Bot**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to "Bot" section and create a bot
   - Copy the bot token

4. **Configure environment**:
   - Copy `.env.example` to `.env`
   - Replace `your_bot_token_here` with your actual bot token

5. **Run the bot**:
   ```bash
   python bot.py
   ```

## Future Features

Add your planned features here as you expand the bot:
- [ ] Moderation commands
- [ ] Music playback
- [ ] Custom reactions
- [ ] Database integration
- [ ] More interactive commands

## Notes

- Bot prefix: `!`
- Make sure to enable Message Content Intent in Discord Developer Portal
