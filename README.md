# Multiplayer Tic-Tac-Toe Game

A real-time multiplayer tic-tac-toe game where two players can play asynchronously from different devices. Built with vanilla HTML, CSS, JavaScript, Supabase, and deployed on Vercel.

## Features

- **User Authentication**: Login/Register with nickname and password
- **Asynchronous Multiplayer**: Players can make moves at different times and from different devices
- **Challenge System**: Select opponents from a list and send game challenges
- **Turn-Based Gameplay**: Enforced turn order with visual indicators
- **Move Preview & Undo**: Click to place a symbol, double-click to remove before confirming
- **Game Management**:
  - Multiple simultaneous games per player
  - Cancel games (saved as "aborted")
  - Automatic win/draw detection
- **Results Tracking**: View personal game history with wins, losses, draws, and aborted games
- **Admin Dashboard**: View all game results and statistics
- **Mobile-Friendly**: Responsive design optimized for touch devices

## Design Specifications

- **Background**: Black (#000000)
- **Grid Lines**: White
- **X Symbol**: Violet (#8b5cf6)
- **O Symbol**: Light Green (#90ee90)
- **Winning Row**: Bold gray highlighting with animation
- **Confirm Turn Button**: Yellow (#fbbf24)
- **Cancel Button**: Red (#ef4444)

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL database)
- **Deployment**: Vercel
- **CDN**: Supabase JS Client v2

## Project Structure

```
/
├── index.html              # Redirects to login
├── login.html             # Login/Register page
├── game.html              # Main game interface
├── admin.html             # Admin dashboard
├── css/
│   └── styles.css         # All styling
├── js/
│   ├── supabase-client.js # Supabase configuration
│   ├── auth.js            # Authentication logic
│   ├── game.js            # Game logic
│   └── admin.js           # Admin dashboard logic
├── vercel.json            # Vercel configuration
├── .env.example           # Environment variables template
├── SUPABASE_SETUP.md      # Supabase setup guide
└── README.md              # This file
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Claude-tris01
```

### 2. Set Up Supabase

Follow the detailed instructions in [SUPABASE_SETUP.md](SUPABASE_SETUP.md):

1. Create a Supabase account and project
2. Run the SQL scripts to create tables
3. Get your API credentials (URL and anon key)
4. Update `js/supabase-client.js` with your credentials:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 3. Create Admin User (Optional)

In Supabase SQL Editor, create an admin account:

```sql
INSERT INTO users (nickname, password, is_admin)
VALUES ('admin', 'your-password', true);
```

### 4. Test Locally

You can test locally using any static file server:

**Using Python:**
```bash
python -m http.server 8000
```

**Using Node.js (http-server):**
```bash
npx http-server
```

**Using VS Code Live Server:**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

Then open your browser to `http://localhost:8000` (or the appropriate port).

### 5. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Vercel will auto-detect the configuration
5. Click "Deploy"

Your app will be live at `https://your-project.vercel.app`

## How to Play

### For Players

1. **Login/Register**
   - Enter your nickname and password
   - New users will be prompted to confirm their password
   - Existing users will be logged in automatically

2. **Start a Challenge**
   - Select an opponent from the dropdown
   - Click "Send Challenge"
   - You'll play as X (violet symbol)

3. **Accept a Challenge**
   - When you log in, you'll see pending challenges
   - Click on a game to view it
   - Make your first move to accept (you'll play as O - light green)

4. **Make a Move**
   - Click an empty cell to place your symbol
   - Double-click your pending move to remove it
   - Click the yellow "Confirm Turn" button to finalize your move

5. **Win Conditions**
   - Get 3 symbols in a row (horizontal, vertical, or diagonal)
   - Winning row will be highlighted in bold gray
   - Game automatically saves the result

6. **View Results**
   - Scroll to the bottom of the game page
   - See your last 10 games with wins, losses, draws, and aborted games

### For Admins

1. Go to `admin.html`
2. Login with admin credentials
3. View statistics and all game results

## Game Rules

- **Challenger**: Always plays with X (violet)
- **Defender**: Always plays with O (light green)
- **Turns**: Players alternate turns; system prevents out-of-turn moves
- **Multiple Games**: Players can have multiple active games simultaneously
- **Cancellation**: Either player can cancel a game (marked as "aborted")
- **Win Detection**: Automatic detection of 3 in a row or draw

## Database Schema

### Users Table
- `id`: UUID (primary key)
- `nickname`: Text (unique)
- `password`: Text (plain text - for development only)
- `is_admin`: Boolean
- `created_at`: Timestamp

### Games Table
- `id`: UUID (primary key)
- `challenger_id`: UUID (foreign key → users)
- `defender_id`: UUID (foreign key → users)
- `board_state`: JSONB (array of 9 cells)
- `current_turn`: UUID (foreign key → users)
- `status`: Text (pending, active, completed, aborted)
- `winner_id`: UUID (nullable, foreign key → users)
- `created_at`, `updated_at`: Timestamps

### Game Results Table
- `id`: UUID (primary key)
- `game_id`: UUID (foreign key → games)
- `challenger_id`: UUID (foreign key → users)
- `defender_id`: UUID (foreign key → users)
- `result`: Text (win, draw, aborted)
- `winner_id`: UUID (nullable, foreign key → users)
- `created_at`: Timestamp

## Security Considerations

⚠️ **For Production:**

1. **Password Hashing**: Currently using plain text passwords. Implement bcrypt or similar hashing before production.
2. **Row Level Security (RLS)**: Enable RLS in Supabase for better data protection.
3. **Rate Limiting**: Add rate limiting to prevent abuse.
4. **Input Validation**: Add server-side validation for all inputs.
5. **Environment Variables**: Use Vercel environment variables for Supabase credentials.

## Troubleshooting

### Connection Issues
- Verify Supabase URL and API key in `js/supabase-client.js`
- Check browser console for errors
- Ensure Supabase project is active

### Login Problems
- Verify user exists in Supabase users table
- Check password matches exactly
- Clear browser session storage and try again

### Game Not Updating
- Check browser console for errors
- Verify game status in Supabase dashboard
- Try refreshing the page

### Deployment Issues
- Ensure all files are committed to Git
- Check Vercel deployment logs
- Verify `vercel.json` is present

## Future Enhancements

- [ ] Real-time updates using Supabase Realtime subscriptions
- [ ] Password hashing and improved security
- [ ] Email notifications for challenges
- [ ] Chat feature between players
- [ ] Game history replay
- [ ] Player rankings/leaderboard
- [ ] Custom board sizes (4x4, 5x5)
- [ ] Time limits per move
- [ ] Sound effects and animations

## Contributing

Feel free to fork this project and submit pull requests for improvements!

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions, please open an issue on GitHub.

---

**Enjoy playing Multiplayer Tic-Tac-Toe!** 🎮
