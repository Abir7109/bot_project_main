# ABIR Bot Project - Summary & Changelog

## Project Overview
**Bot Name:** ABIR Chat Bot  
**Type:** Facebook Messenger Bot (Unofficial)  
**Platform:** Node.js  
**Deployment:** Render (render.com)  
**Repository:** https://github.com/Abir7109/bot_project_main  
**Owner:** ABIR  
**Contact:** https://www.facebook.com/ABIRMAHMMUD1344  

## Bot Details
- **Prefix:** `/`
- **Node Version:** 20.x
- **Main Files:** 
  - Entry: `Abir.js` (Express server + bot launcher)
  - Bot Logic: `Main.js` (command handler & event listener)
  - Config: `config.json`
  - Auth: `appstate.json` (Facebook session)

## Project History
1. **Original Source:** Repurposed from meal-command bot by Shahadat/Sahu
2. **Rebranding:** Completely rebranded to ABIR
3. **Cleanup:** Removed all meal commands and old branding
4. **Enhancement:** Added new commands, points system, interactive features
5. **Deployment:** Configured for Render with automated deployment

---

## Current Commands (17 Total)

### Core Commands
1. **help** - Interactive numbered menu with photo, reply-to-run feature
2. **admin** - Shows bot admin and owner info
3. **uid** - Get user ID

### AI Commands
4. **ai** - Ask AI questions (Groq-powered)
5. **autoai** - Auto-reply AI in chat (mode: all/smart/mention)

### Fun & Games
6. **joke** - Random jokes with image
7. **truth** - Truth game with points system (15 questions)
8. **dare** - Dare game with points system (15 challenges)
9. **time** - Current time & bot uptime
10. **anime** - Random anime video clips (20 videos)

### Social Interaction
11. **hug** - Create hug image with avatars
12. **slap** - Slap GIF with mentions

### Utility
13. **weather** - Weather info (wttr.in API)

---

## Key Features

### 1. Points System (Truth & Dare)
- Users earn points by completing truth questions or dare challenges
- Reply to bot message to submit answer/proof
- Stats tracked per user in `data/truthdare.json`
- Separate tracking: Truth points, Dare points, Total points

### 2. Interactive Help Command
- Numbered command list with ABIR photo
- Reply with number to instantly run command
- Clean, attractive UI with box design
- Shows creator info and social links

### 3. Auto AI (autoai)
- Three modes: `all`, `smart`, `mention`
- Default: `all` (responds to any text)
- Configurable cooldown (default: 20s)
- Context-aware conversations (optional)
- Bangla/Banglish support
- Uses Groq AI (requires GROQ_API_KEY env var)

### 4. Media Management
- All command images cached in `Script/commands/cache/`
- No external download errors
- Canvas templates for hug/slap commands
- Auto-cleanup after sending

---

## Recent Changes (Session: Nov 13, 2025)

### Session Summary
**Duration:** ~2 hours  
**Major Tasks:** Rebranding, cleanup, feature additions, deployment setup  

### Changes Log

#### 1. Rebranding (Initial)
- Replaced all "Shahadat/Sahu" references with "ABIR"
- Updated owner info, links, and branding across all files
- Changed image URLs to ABIR's photos
- Updated credits in all commands

#### 2. Command Cleanup
- Removed ALL meal-related commands (mealctl, meal, mealsync, mealannounce)
- Fixed Main.js to show dynamic command list
- Removed old project files and unnecessary dependencies

#### 3. Repository Restructuring
- Moved bot files from `abir-bot/` subdirectory to root
- Removed duplicate projects (abirchatbot, custom_commands)
- Fixed git submodule issues
- Cleaned repo structure for Render deployment

#### 4. Command Imports & Fixes
- Imported commands from old project: joke, truth, dare, weather, time, hug, slap
- Fixed all cache directory issues (added fs.ensureDirSync)
- Fixed time.js syntax error (missing comma)
- Updated weather.js to use wttr.in (no API key needed)
- Refactored hug.js to work without global.nodemodule
- Updated branding in all imported commands

#### 5. Media Assets
- Copied `Script/commands/cache/` directory (173 files, 44MB)
- Copied `Script/commands/noprefix/` directory
- Ensured all command images available offline
- Canvas templates for interactive commands

#### 6. Enhanced Truth & Dare
- Expanded to 15 questions each (from 5)
- Added points system with persistent storage
- Reply-to-complete functionality
- Stats tracking per user
- Shows current stats before/after challenges
- 5-minute timeout per challenge
- Validates answers (min 10 chars for truth, 5 for dare)

#### 7. Help Command Upgrade
- Beautiful numbered list with box design
- Interactive: reply with number to run command
- Shows ABIR photo from postimg
- Dynamic command listing
- Creator info and social links
- Integrated with handleReply system

#### 8. AutoAI Improvements
- Changed default mode from `smart` to `all`
- Added greeting detection (hi, hello, salam, etc.)
- Added help request detection
- More question patterns
- Now responds to any text when enabled
- Better Bangla/Banglish support

#### 9. Anime Command
- Added anime video command (20 clips)
- Random selection from Google Drive
- Download progress indicator
- Error handling
- Auto-cleanup

#### 10. Deployment Configuration
- Set up for Render.com deployment
- Added dotenv support for environment variables
- Updated package.json with all dependencies
- Created render.yaml (though not needed for root deployment)
- Fixed .gitignore to include cache assets
- Environment variable setup for GROQ_API_KEY

---

## File Structure

```
bot project 1/
├── Abir.js                 # Express server + bot launcher
├── Main.js                 # Command handler & listener
├── config.json             # Bot configuration
├── appstate.json           # Facebook session (blank in repo)
├── package.json            # Dependencies
├── .env                    # Local env vars (gitignored)
├── .gitignore              # Git ignore rules
├── README.md               # Project documentation
├── PROJECT_SUMMARY.md      # This file
├── render.yaml             # Render config
├── index.html              # Bot info page
├── data/                   # Persistent data
│   ├── truthdare.json      # Points tracking
│   ├── autoai.json         # AutoAI config
│   ├── threads.json        # Thread tracking
│   └── ban.json            # Ban list
├── Script/
│   ├── commands/           # Command files
│   │   ├── help.js
│   │   ├── truth.js
│   │   ├── dare.js
│   │   ├── anime.js
│   │   ├── ai.js
│   │   ├── autoai.js
│   │   ├── admin.js
│   │   ├── uid.js
│   │   ├── joke.js
│   │   ├── time.js
│   │   ├── weather.js
│   │   ├── hug.js
│   │   ├── slap.js
│   │   └── cache/          # Media assets (173 files)
│   │       ├── canvas/     # Image templates
│   │       └── noprefix/   # No-prefix media
│   └── events/             # Event handlers
├── utils/
│   ├── log.js              # Logger
│   └── aiProvider.js       # AI abstraction (Groq/Grok)
└── assets/                 # Bot assets
    └── cache/              # General cache
```

---

## Dependencies

### Production
- `axios`: HTTP requests
- `chalk`: Terminal colors
- `dotenv`: Environment variables
- `express`: Web server
- `fs-extra`: File system utilities
- `jimp`: Image processing
- `moment-timezone`: Date/time handling
- `request`: HTTP downloads
- `sahu-fca`: Facebook Chat API (unofficial)

---

## Environment Variables

### Required in Render
- `GROQ_API_KEY`: API key for Groq AI (for /ai and /autoai commands)

### Local Development
Create `.env` file:
```
GROQ_API_KEY=your_api_key_here
```

---

## Configuration (config.json)

```json
{
  "Author": "Abir",
  "version": "0.1.0",
  "language": "en",
  "BOTNAME": "Abir Chat Bot",
  "PREFIX": "/",
  "ADMINBOT": ["61556527816380"],
  "APPSTATEPATH": "appstate.json",
  "OWNER": {
    "name": "Abir",
    "facebook": "https://www.facebook.com/ABIRMAHMMUD1344",
    "whatsapp": "https://wa.me/8801919069898",
    "photo": "https://i.postimg.cc/rFnmYvCy/abir4.jpg",
    "birthday": "2026-04-14T00:00:00+06:00"
  },
  "FCAOption": {
    "selfListen": false,
    "listenEvents": true,
    "autoReconnect": true,
    "online": false
  }
}
```

---

## Render Deployment

### Setup
1. **Repository:** https://github.com/Abir7109/bot_project_main
2. **Service Type:** Web Service
3. **Build Command:** `npm install --no-fund --no-audit`
4. **Start Command:** `npm start`
5. **Root Directory:** (empty - files in root)
6. **Environment:** Node
7. **Plan:** Free

### Environment Variables
- Add `GROQ_API_KEY` in Render dashboard

### Health Check
- Endpoint: `/healthz`
- Returns: `ok`

---

## Known Issues & Solutions

### Issue: Commands not loading
**Solution:** Check Main.js loadCommands() function, ensure all command files have proper config.name

### Issue: Images not showing
**Solution:** All media now in cache/, ensure cache directory is committed to git

### Issue: AutoAI not responding
**Solution:** 
1. Enable: `/autoai on`
2. Check mode: `/autoai status`
3. Set to all: `/autoai mode all`
4. Verify GROQ_API_KEY in Render

### Issue: Truth/Dare points not saving
**Solution:** Check data/ directory has write permissions, truthdare.json created automatically

---

## Future Enhancements (Not Yet Done)

### Potential Additions
- Leaderboard command for truth/dare points
- More game commands
- Music/song search
- Meme generator
- Admin moderation commands
- Custom prefix per thread
- Multi-language support enhancement
- Database integration (MongoDB/PostgreSQL)

---

## Important Notes

1. **appstate.json:** Must be added manually (contains Facebook session cookies)
2. **Private Repo:** Keep repo private if appstate.json is committed
3. **GROQ_API_KEY:** Required for AI features to work properly
4. **Cache Directory:** Must be committed to git for images to work on Render
5. **Cooldowns:** Prevent spam, adjustable per command
6. **Admin UID:** Update in config.json for bot admin commands

---

## Testing Checklist

### Commands to Test
- [ ] `/help` - Shows numbered list with photo
- [ ] Reply to help with number - Runs command
- [ ] `/truth` - Shows challenge, reply awards point
- [ ] `/dare` - Shows challenge, reply awards point
- [ ] `/ai <question>` - AI responds
- [ ] `/autoai on` - Enable auto-reply
- [ ] `/anime` - Sends random anime video
- [ ] `/joke` - Shows joke with image
- [ ] `/time` - Shows time and uptime
- [ ] `/weather <city>` - Shows weather
- [ ] `/hug @user` - Creates hug image
- [ ] `/slap @user` - Sends slap GIF
- [ ] `/admin` - Shows admin info
- [ ] `/uid` - Shows user ID

---

## Git Commits Summary

1. Initial push with blank appstate
2. Fix: Add bot files properly (not as submodules)
3. Clean repo: Move bot to root, remove unnecessary files
4. Remove all meal commands and update help
5. Add help command
6. Add dotenv support for environment variables
7. Integrate commands from external path
8. Upgrade help command with attractive UI
9. Fix all cache directory issues
10. Add all media assets (173 files)
11. Upgrade Truth & Dare with points system
12. Improve autoai smart mode
13. Change autoai default to 'all' mode
14. Add anime command

---

## Contact & Support

**Bot Owner:** ABIR  
**Facebook:** https://www.facebook.com/ABIRMAHMMUD1344  
**WhatsApp:** https://wa.me/8801919069898  
**GitHub:** https://github.com/Abir7109/bot_project_main  
**Render URL:** https://bot-project-main-t63u.onrender.com  

---

*Last Updated: November 13, 2025*  
*Document Version: 1.0*
