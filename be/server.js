import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

import { supabase } from './supabaseClient.js';
import { authenticateToken } from './authMiddleware.js';

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
    {
      id: 'f94dbcb1-c30f-48d8-963d-49527ec56c7d',
      nama: 'Admin MasComunity',
      email: 'admin@mascomunity.com',
      role: 'admin',
      password: '$2a$10$w66XG.xGgPymQ6lX0C9v/.i96sV5a/hH8/QzMhM67K1HlK7E3s/Fm'
    }
  ],
  games: [
    {
      id: '1',
      nama_game: 'Genshin Impact',
      nama_event: 'Spiral Abyss',
      kategori: 'endgame',
      tanggal_mulai: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      tanggal_berakhir: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000).toISOString(),
      gambar: '',
      status: 'active'
    }
  ]
};

// Status check API
app.get('/api/status', (req, res) => {
  const isSupabaseReady = !useFallback();
  res.json({
    status: 'online',
    database: isSupabaseReady ? 'Supabase Connected' : 'In-Memory Fallback Active',
    timestamp: new Date().toISOString()
  });
});

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
      const existingUser = fallbackDb.users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      const createdUser = { id: crypto.randomUUID(), ...newAdmin };
      fallbackDb.users.push(createdUser);

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

    const { data: existingUser } = await supabase
      .from('user')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const { data: createdUser, error } = await supabase
      .from('user')
      .insert([newAdmin])
      .select('id, nama, email, role')
      .single();

    if (error) throw error;

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

// Get all countdowns
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

    for (let event of gamesList) {
      event.status = event.status || 'active';

      const isEndgame = event.kategori && (
        event.kategori.toLowerCase() === 'endgame' || 
        event.kategori.toLowerCase() === 'end game'
      );
      const endTime = new Date(event.tanggal_berakhir).getTime();

      // 60-second safety buffer past end time to prevent premature server resets when client refreshes near 0s
      if (now >= endTime + 60000) {
        if (isEndgame) {
          let start = new Date(event.tanggal_mulai).getTime();
          let end = endTime;
          let duration = end - start;

          if (duration <= 0) {
            duration = 14 * 24 * 60 * 60 * 1000;
          }

          while (end <= now) {
            start += duration;
            end += duration;
          }

          event.tanggal_mulai = new Date(start).toISOString();
          event.tanggal_berakhir = new Date(end).toISOString();
          event.status = 'active';

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
        } else if (event.status === 'active') {
          // Automatically change status to expired in database when end time passes
          event.status = 'expired';

          if (useFallback()) {
            const idx = fallbackDb.games.findIndex(g => g.id === event.id);
            if (idx !== -1) {
              fallbackDb.games[idx].status = 'expired';
            }
          } else {
            await supabase
              .from('game')
              .update({ status: 'expired' })
              .eq('id', event.id);
          }
        }
      }

      updatedGames.push(event);
    }

    let filtered = [...updatedGames];

    if (game) {
      filtered = filtered.filter(g => g.nama_game.toLowerCase() === game.toLowerCase());
    }

    if (all !== 'true') {
      filtered = filtered.filter(g => g.status === 'active');
    }

    filtered.sort((a, b) => new Date(a.tanggal_berakhir) - new Date(b.tanggal_berakhir));

    res.json(filtered);
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ message: 'Failed to fetch games data', error: error.message });
  }
});

// Create new event
app.post('/api/games', authenticateToken, async (req, res) => {
  const { nama_game, nama_event, kategori, tanggal_mulai, tanggal_berakhir, gambar, status } = req.body;

  if (!nama_game || !nama_event || !kategori || !tanggal_mulai || !tanggal_berakhir) {
    return res.status(400).json({ message: 'All fields except image are required' });
  }

  const dbPayload = {
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
      const createdEvent = { id: crypto.randomUUID(), ...dbPayload, updated_at: new Date().toISOString() };
      fallbackDb.games.push(createdEvent);
      return res.status(201).json(createdEvent);
    }

    const { data, error } = await supabase
      .from('game')
      .insert([dbPayload])
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ message: 'Failed to create game event', error: error.message });
  }
});

// Update an event
app.put('/api/games/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nama_game, nama_event, kategori, tanggal_mulai, tanggal_berakhir, gambar, status } = req.body;

  const updatePayload = {
    nama_game,
    nama_event,
    kategori,
    tanggal_mulai,
    tanggal_berakhir,
    gambar,
    status
  };

  Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

  try {
    if (useFallback()) {
      const idx = fallbackDb.games.findIndex(g => g.id === id);
      if (idx === -1) {
        return res.status(404).json({ message: 'Event not found' });
      }

      fallbackDb.games[idx] = {
        ...fallbackDb.games[idx],
        ...updatePayload,
        updated_at: new Date().toISOString()
      };

      return res.json(fallbackDb.games[idx]);
    }

    const { data, error } = await supabase
      .from('game')
      .update(updatePayload)
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

// Delete an event
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

app.listen(PORT, () => {
  console.log(`[BE Server] Running on http://localhost:${PORT}`);
  if (useFallback()) {
    console.log('[BE Server] In-Memory fallback mode active (Supabase not configured)');
  } else {
    console.log('[BE Server] Connected to Supabase.');
  }
});
