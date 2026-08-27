import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from './supabaseClient.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'default-gacha-countdown-jwt-secret-key-12345';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// In-Memory Fallback Database for quick testing when Supabase is not connected
const useFallback = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  return !url || !key || url === 'your-supabase-url' || key === 'your-supabase-anon-key';
};

const fallbackDb = {
  users: [
    // Pre-seed an admin account for convenience
    // Password: adminpassword (hashed with bcrypt)
    {
      id: 'f94dbcb1-c30f-48d8-963d-49527ec56c7d',
      nama: 'Admin MasComunity',
      email: 'admin@mascomunity.com',
      role: 'admin',
      password: '$2a$10$w66XG.xGgPymQ6lX0C9v/.i96sV5a/hH8/QzMhM67K1HlK7E3s/Fm' // bcrypt hash of "adminpassword"
    }
  ],
  games: [
    {
      id: '1',
      nama_game: 'Genshin Impact',
      nama_event: 'Spiral Abyss',
      kategori: 'endgame',
      tanggal_mulai: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      tanggal_berakhir: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000).toISOString(), // ~32d 22h from now
      gambar: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=60' // generic anime backdrop
    },
    {
      id: '2',
      nama_game: 'Genshin Impact',
      nama_event: 'Imaginarium Theater',
      kategori: 'endgame',
      tanggal_mulai: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      tanggal_berakhir: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
      gambar: ''
    },
    {
      id: '3',
      nama_game: 'Genshin Impact',
      nama_event: 'Stygian Onslaught',
      kategori: 'endgame',
      tanggal_mulai: new Date(Date.now()).toISOString(),
      tanggal_berakhir: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      gambar: ''
    },
    {
      id: '4',
      nama_game: 'Genshin Impact',
      nama_event: 'Imaginarium Theater Event',
      kategori: 'event',
      tanggal_mulai: new Date(Date.now()).toISOString(),
      tanggal_berakhir: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      gambar: ''
    },
    {
      id: '5',
      nama_game: 'Honkai: Star Rail',
      nama_event: 'Memory of Chaos',
      kategori: 'endgame',
      tanggal_mulai: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      tanggal_berakhir: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      gambar: ''
    }
  ]
};

// Import authenticate token middleware
import { authenticateToken } from './authMiddleware.js';

// Status check API
app.get('/api/status', (req, res) => {
  const isSupabaseReady = !useFallback();
  res.json({
    status: 'online',
    database: isSupabaseReady ? 'Supabase Connected' : 'In-Memory Fallback Active (Missing credentials in .env)',
    timestamp: new Date().toISOString()
  });
});

// --- AUTHENTICATION ROUTES ---

// Admin Registration
app.post('/api/auth/register', async (req, res) => {
  const { nama, email, password } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = {
      nama,
      email,
      role: 'admin',
      password: hashedPassword
    };

    if (useFallback()) {
      console.log('[Auth] Using fallback DB for register');
      const existingUser = fallbackDb.users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      const createdUser = { id: crypto.randomUUID(), ...newAdmin };
      fallbackDb.users.push(createdUser);

      // Create JWT
      const token = jwt.sign(
        { id: createdUser.id, email: createdUser.email, role: createdUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        message: 'Admin registered successfully (Fallback Mode)',
        token,
        user: { id: createdUser.id, nama: createdUser.nama, email: createdUser.email, role: createdUser.role }
      });
    }

    // Supabase Registration
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('user')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Insert user
    const { data: createdUser, error } = await supabase
      .from('user')
      .insert([newAdmin])
      .select('id, nama, email, role')
      .single();

    if (error) {
      throw error;
    }

    const token = jwt.sign(
      { id: createdUser.id, email: createdUser.email, role: createdUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      user: createdUser
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Admin Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    if (useFallback()) {
      console.log('[Auth] Using fallback DB for login');
      const user = fallbackDb.users.find(u => u.email === email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Login successful (Fallback Mode)',
        token,
        user: { id: user.id, nama: user.nama, email: user.email, role: user.role }
      });
    }

    // Supabase login
    const { data: user, error } = await supabase
      .from('user')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, nama: user.nama, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});


// --- GAME COUNTDOWN ROUTES ---

// Get all countdowns (Public)
app.get('/api/games', async (req, res) => {
  const { game, all } = req.query;

  try {
    let gamesList = [];

    if (useFallback()) {
      gamesList = [...fallbackDb.games];
    } else {
      const { data, error } = await supabase
        .from('game')
        .select('*');
      if (error) throw error;
      gamesList = data || [];
    }

    const now = Date.now();
    let updatedGames = [];

    // Process and check for auto-looping of endgame events
    for (let event of gamesList) {
      // Ensure event status is populated
      event.status = event.status || 'active';

      const isEndgame = event.kategori.toLowerCase() === 'endgame' || event.kategori.toLowerCase() === 'end game';
      const isExpiredTime = now > new Date(event.tanggal_berakhir).getTime();
      const isExpiredStatus = event.status === 'expired';

      if (isEndgame && (isExpiredTime || isExpiredStatus)) {
        // Calculate duration
        let start = new Date(event.tanggal_mulai).getTime();
        let end = new Date(event.tanggal_berakhir).getTime();
        let duration = end - start;

        if (duration <= 0) {
          duration = 14 * 24 * 60 * 60 * 1000; // 14 days default
        }

        // Roll dates forward until the end date is in the future
        while (end <= now) {
          start += duration;
          end += duration;
        }

        event.tanggal_mulai = new Date(start).toISOString();
        event.tanggal_berakhir = new Date(end).toISOString();
        event.status = 'active'; // Reset status to active

        // Persist change
        if (useFallback()) {
          const idx = fallbackDb.games.findIndex(g => g.id === event.id);
          if (idx !== -1) {
            fallbackDb.games[idx] = { ...event };
          }
        } else {
          await supabase
            .from('game')
            .update({ 
              tanggal_mulai: event.tanggal_mulai, 
              tanggal_berakhir: event.tanggal_berakhir, 
              status: 'active' 
            })
            .eq('id', event.id);
        }
      }
      updatedGames.push(event);
    }

    // Filter games
    let filtered = [...updatedGames];

    // Filter by game name
    if (game) {
      filtered = filtered.filter(g => g.nama_game.toLowerCase() === game.toLowerCase());
    }

    // Filter by status (unless 'all=true' is set for admin view)
    if (all !== 'true') {
      filtered = filtered.filter(g => g.status === 'active');
    }

    // Sort by end date
    filtered.sort((a, b) => new Date(a.tanggal_berakhir) - new Date(b.tanggal_berakhir));

    res.json(filtered);
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ message: 'Failed to fetch games data', error: error.message });
  }
});

// Create new event (Admin only)
app.post('/api/games', authenticateToken, async (req, res) => {
  const { nama_game, nama_event, kategori, tanggal_mulai, tanggal_berakhir, gambar, status } = req.body;

  if (!nama_game || !nama_event || !kategori || !tanggal_mulai || !tanggal_berakhir) {
    return res.status(400).json({ message: 'All fields except image are required' });
  }

  const newEvent = {
    nama_game,
    nama_event,
    kategori,
    tanggal_mulai,
    tanggal_berakhir,
    gambar: gambar || '',
    status: status || 'active'
  };

  try {
    if (useFallback()) {
      const createdEvent = { id: crypto.randomUUID(), ...newEvent };
      fallbackDb.games.push(createdEvent);
      return res.status(201).json(createdEvent);
    }

    const { data, error } = await supabase
      .from('game')
      .insert([newEvent])
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ message: 'Failed to create game event', error: error.message });
  }
});

// Update an event (Admin only)
app.put('/api/games/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nama_game, nama_event, kategori, tanggal_mulai, tanggal_berakhir, gambar, status } = req.body;

  try {
    if (useFallback()) {
      const idx = fallbackDb.games.findIndex(g => g.id === id);
      if (idx === -1) {
        return res.status(404).json({ message: 'Event not found' });
      }

      fallbackDb.games[idx] = {
        ...fallbackDb.games[idx],
        nama_game: nama_game || fallbackDb.games[idx].nama_game,
        nama_event: nama_event || fallbackDb.games[idx].nama_event,
        kategori: kategori || fallbackDb.games[idx].kategori,
        tanggal_mulai: tanggal_mulai || fallbackDb.games[idx].tanggal_mulai,
        tanggal_berakhir: tanggal_berakhir || fallbackDb.games[idx].tanggal_berakhir,
        gambar: gambar !== undefined ? gambar : fallbackDb.games[idx].gambar,
        status: status || fallbackDb.games[idx].status
      };

      return res.json(fallbackDb.games[idx]);
    }

    const { data, error } = await supabase
      .from('game')
      .update({ nama_game, nama_event, kategori, tanggal_mulai, tanggal_berakhir, gambar, status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ message: 'Failed to update game event', error: error.message });
  }
});

// Delete an event (Admin only)
app.delete('/api/games/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    if (useFallback()) {
      const idx = fallbackDb.games.findIndex(g => g.id === id);
      if (idx === -1) {
        return res.status(404).json({ message: 'Event not found' });
      }

      fallbackDb.games.splice(idx, 1);
      return res.json({ message: 'Event deleted successfully' });
    }

    const { error } = await supabase
      .from('game')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ message: 'Failed to delete game event', error: error.message });
  }
});

// Start express server
app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  if (useFallback()) {
    console.log('[Server] Note: Database operations are running in fallback in-memory mode.');
    console.log('[Server] Pre-seeded admin: admin@mascomunity.com / adminpassword');
  } else {
    console.log('[Server] Connected to Supabase.');
  }
});
