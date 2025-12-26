# Supabase Setup Instructions

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in the project details:
   - Name: `multiplayer-tictactoe` (or your preferred name)
   - Database Password: Create a strong password (save this!)
   - Region: Choose the closest to your users
5. Click "Create new project" and wait for it to initialize

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon)
2. Click **API** in the sidebar
3. You'll need two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys")

## Step 3: Configure the Application

1. Open `js/supabase-client.js` in your project
2. Replace the placeholder values:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

## Step 4: Create Database Tables

Go to the **SQL Editor** in your Supabase dashboard and run these SQL commands:

### 1. Create Users Table

```sql
-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nickname TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on nickname for faster lookups
CREATE INDEX idx_users_nickname ON users(nickname);
```

### 2. Create Games Table

```sql
-- Create games table
CREATE TABLE games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenger_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    defender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    board_state JSONB DEFAULT '["","","","","","","","",""]'::jsonb,
    current_turn UUID REFERENCES users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'aborted')),
    winner_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_games_challenger ON games(challenger_id);
CREATE INDEX idx_games_defender ON games(defender_id);
CREATE INDEX idx_games_status ON games(status);
```

### 3. Create Game Results Table

```sql
-- Create game_results table
CREATE TABLE game_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    challenger_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    defender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    result TEXT CHECK (result IN ('win', 'draw', 'aborted')) NOT NULL,
    winner_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_game_results_challenger ON game_results(challenger_id);
CREATE INDEX idx_game_results_defender ON game_results(defender_id);
CREATE INDEX idx_game_results_game ON game_results(game_id);
```

### 4. Create Update Timestamp Trigger

```sql
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 5. Create Admin User (Optional)

```sql
-- Insert an admin user (change the nickname and password!)
INSERT INTO users (nickname, password, is_admin)
VALUES ('admin', 'admin123', true);
```

## Step 5: Configure Row Level Security (RLS)

For security, you should enable RLS. Run these commands:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert themselves" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update themselves" ON users FOR UPDATE USING (true);

-- Games table policies
CREATE POLICY "Players can read their games" ON games FOR SELECT USING (
    challenger_id = (SELECT id FROM users WHERE nickname = current_setting('request.jwt.claims', true)::json->>'nickname') OR
    defender_id = (SELECT id FROM users WHERE nickname = current_setting('request.jwt.claims', true)::json->>'nickname')
);
CREATE POLICY "Users can create games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update their games" ON games FOR UPDATE USING (
    challenger_id = (SELECT id FROM users WHERE nickname = current_setting('request.jwt.claims', true)::json->>'nickname') OR
    defender_id = (SELECT id FROM users WHERE nickname = current_setting('request.jwt.claims', true)::json->>'nickname')
);

-- Game results policies
CREATE POLICY "Users can read all results" ON game_results FOR SELECT USING (true);
CREATE POLICY "System can insert results" ON game_results FOR INSERT WITH CHECK (true);
```

**Note:** For simplicity during development, you can disable RLS temporarily:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_results DISABLE ROW LEVEL SECURITY;
```

## Step 6: Test the Connection

1. Open your browser's developer console (F12)
2. Load your application
3. Check for any Supabase connection errors
4. Try logging in with the admin credentials (if you created them)

## Troubleshooting

- **Connection errors**: Double-check your SUPABASE_URL and SUPABASE_ANON_KEY
- **Table not found**: Make sure you ran all SQL commands in the SQL Editor
- **CORS errors**: This shouldn't happen with Supabase, but ensure your domain is allowed
- **RLS blocking queries**: Disable RLS during development if needed

## Production Recommendations

1. **Enable RLS**: Row Level Security protects your data
2. **Use environment variables**: Don't hardcode credentials in production
3. **Hash passwords**: Implement proper password hashing (bcrypt, argon2)
4. **Add rate limiting**: Prevent abuse of your API
5. **Monitor usage**: Check Supabase dashboard for usage stats

---

Your Supabase backend is now ready for the multiplayer tic-tac-toe game!
