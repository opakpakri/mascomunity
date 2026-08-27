import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Plus, Trash2, Edit2, Shield, Calendar, Gamepad2, Layers, Image as ImageIcon, Eye, EyeOff, ArrowUp } from 'lucide-react';
import Swal from 'sweetalert2';

export default function App() {
  const [view, setView] = useState('login'); // 'login', 'register', 'dashboard'
  const [token, setToken] = useState(localStorage.getItem('admin_token') || null);
  const [adminUser, setAdminUser] = useState(JSON.parse(localStorage.getItem('admin_user')) || null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '';

  // Scroll listener for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form states
  const [authForm, setAuthForm] = useState({ nama: '', email: '', password: '' });
  const [eventForm, setEventForm] = useState({
    id: null,
    nama_game: '',
    nama_event: '',
    kategori: '',
    tanggal_mulai: '',
    tanggal_berakhir: '',
    gambar: '',
    status: 'active'
  });

  const [events, setEvents] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Dropdown options
  const gamesList = [
    'Genshin Impact',
    'Honkai: Star Rail',
    'Zenless Zone Zero',
    'Wuthering Waves',
    'Arknights Endfield',
    'Neverness To Everness'
  ];

  useEffect(() => {
    if (token) {
      setView('dashboard');
      fetchEvents();
    }
  }, [token]);

  const triggerToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchEvents = async () => {
    try {
      // Pass 'all=true' query parameter to retrieve active and expired events for admin
      const response = await fetch(`${API_URL}/api/games?all=true`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('API connection error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Connection Failed',
        text: 'Failed to fetch countdown data from server.'
      });
    }
  };

  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventForm({ ...eventForm, [name]: value });
    // Remove error highlights once modified
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  // Convert uploaded image to compressed WebP (base64 string)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 5MB Limit check
    const LIMIT_5MB = 5 * 1024 * 1024;
    if (file.size > LIMIT_5MB) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'The selected file size exceeds the 5MB limit. Please choose a smaller image.'
      });
      e.target.value = ''; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down width if larger than 1000px to optimize Supabase text storage sizes
        const MAX_WIDTH = 1000;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert any format (jpg, png, webp) to highly optimized webp at 0.8 quality
        const webpBase64 = canvas.toDataURL('image/webp', 0.8);
        setEventForm(prev => ({ ...prev, gambar: webpBase64 }));
        
        Swal.fire({
          icon: 'success',
          title: 'Format Converted',
          text: 'Image successfully converted to lightweight WebP format!',
          timer: 1500,
          showConfirmButton: false
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!authForm.nama || !authForm.email || !authForm.password) {
      return Swal.fire({
        icon: 'warning',
        title: 'Incomplete Fields',
        text: 'Please fill out all fields to create an account.'
      });
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        setToken(data.token);
        setAdminUser(data.user);
        Swal.fire({
          icon: 'success',
          title: 'Registered!',
          text: 'Admin account created successfully.',
          timer: 2000,
          showConfirmButton: false
        });
        setView('dashboard');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: data.message || 'Server rejected registration.'
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Server Error',
        text: 'Failed to communicate with registration backend.'
      });
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password) {
      return Swal.fire({
        icon: 'warning',
        title: 'Incomplete Fields',
        text: 'Please enter both email and password.'
      });
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        setToken(data.token);
        setAdminUser(data.user);
        setView('dashboard');
        Swal.fire({
          icon: 'success',
          title: 'Login Berhasil!',
          text: `Selamat datang kembali, ${data.user?.nama || 'Admin'}!`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: data.message || 'Invalid email or password.'
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Server Error',
        text: 'Failed to connect to authentication server.'
      });
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Keluar dari Admin Panel?',
      text: 'Anda akan diarahkan kembali ke halaman login.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00ffcc',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      background: '#191b24',
      color: '#ffffff'
    });

    if (!result.isConfirmed) return;

    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setAdminUser(null);
    setView('login');

    Swal.fire({
      icon: 'success',
      title: 'Berhasil Keluar',
      text: 'Sampai jumpa lagi!',
      timer: 1500,
      showConfirmButton: false,
      background: '#191b24',
      color: '#ffffff'
    });
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    
    // Validate empty fields and highlight them
    const errors = {};
    if (!eventForm.nama_game) errors.nama_game = true;
    if (!eventForm.nama_event.trim()) errors.nama_event = true;
    if (!eventForm.kategori) errors.kategori = true;
    if (!eventForm.tanggal_mulai) errors.tanggal_mulai = true;
    if (!eventForm.tanggal_berakhir) errors.tanggal_berakhir = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return Swal.fire({
        icon: 'error',
        title: 'Incomplete Form',
        text: 'Please fill out all required fields marked with *.'
      });
    }

    // Format ISO Dates
    const payload = {
      ...eventForm,
      tanggal_mulai: new Date(eventForm.tanggal_mulai).toISOString(),
      tanggal_berakhir: new Date(eventForm.tanggal_berakhir).toISOString()
    };

    try {
      const url = isEditing 
        ? `${API_URL}/api/games/${eventForm.id}` 
        : `${API_URL}/api/games`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: isEditing ? 'Game event updated!' : 'Game event created!',
          timer: 1500,
          showConfirmButton: false
        });
        resetEventForm();
        fetchEvents();
      } else {
        let errorMessage = 'Operation could not be completed.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseErr) {
          const text = await response.text().catch(() => '');
          errorMessage = text || `Server error (${response.status})`;
        }
        Swal.fire({
          icon: 'error',
          title: `Action Failed (${response.status})`,
          text: errorMessage
        });
      }
    } catch (err) {
      console.error('Event submit error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to communicate event data to the server.'
      });
    }
  };

  const handleEditClick = (event) => {
    setIsEditing(true);
    setFormErrors({});

    // Convert ISO string back to local datetime picker format (YYYY-MM-DDThh:mm)
    const formatLocalDatetime = (isoString) => {
      if (!isoString) return '';
      const d = new Date(isoString);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setEventForm({
      id: event.id,
      nama_game: event.nama_game,
      nama_event: event.nama_event,
      kategori: event.kategori,
      tanggal_mulai: formatLocalDatetime(event.tanggal_mulai),
      tanggal_berakhir: formatLocalDatetime(event.tanggal_berakhir),
      gambar: event.gambar || '',
      status: event.status || 'active'
    });
  };

  const handleDeleteClick = async (eventId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff4d4d',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/games/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Your event has been deleted.',
          timer: 1500,
          showConfirmButton: false
        });
        fetchEvents();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Unable to delete event from database.'
        });
      }
    } catch (err) {
      console.error('Delete error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to communicate delete command to server.'
      });
    }
  };

  const resetEventForm = () => {
    setEventForm({
      id: null,
      nama_game: '',
      nama_event: '',
      kategori: '',
      tanggal_mulai: '',
      tanggal_berakhir: '',
      gambar: '',
      status: 'active'
    });
    setFormErrors({});
    setIsEditing(false);
    
    // Clear file inputs
    const fileInput = document.getElementById('image-upload-input');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="admin-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {toastMessage && (
        <div className="toast">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="header" style={{ padding: '0 40px' }}>
        <div className="header-left">
          <a href="/" className="logo" style={{ pointerEvents: 'none' }}>
            Mas<span>Comunity.</span> <span style={{ fontSize: '12px', background: 'rgba(0, 255, 204, 0.1)', color: '#00ffcc', padding: '4px 8px', borderRadius: '4px', marginLeft: '10px' }}>ADMIN PANEL</span>
          </a>
        </div>
        {token && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="user-profile-badge">
              <Shield size={14} style={{ color: '#00ffcc' }} />
              <span>{adminUser?.nama || 'Admin'}</span>
            </div>
            <button className="logout-icon-btn" onClick={handleLogout} title="Log Out">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </header>

      {/* MAIN BODY */}
      <main className="page-body" style={{ padding: '40px' }}>
        
        {/* LOGIN VIEW */}
        {view === 'login' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="admin-card">
              <h2 className="admin-card-title">Sign In</h2>
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    className="form-input" 
                    placeholder="admin@mascomunity.com" 
                    value={authForm.email}
                    onChange={handleAuthChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={authForm.password}
                    onChange={handleAuthChange}
                  />
                </div>
                <button type="submit" className="submit-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <LogIn size={16} /> Sign In
                </button>
              </form>
              <div className="auth-footer-link">
                Don't have an admin account? <a href="#" onClick={(e) => { e.preventDefault(); setView('register'); }}>Register here</a>
              </div>
            </div>
          </div>
        )}

        {/* REGISTER VIEW */}
        {view === 'register' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="admin-card">
              <h2 className="admin-card-title">Create Admin</h2>
              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    name="nama" 
                    className="form-input" 
                    placeholder="Admin Name" 
                    value={authForm.nama}
                    onChange={handleAuthChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    className="form-input" 
                    placeholder="admin@mascomunity.com" 
                    value={authForm.email}
                    onChange={handleAuthChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={authForm.password}
                    onChange={handleAuthChange}
                  />
                </div>
                <button type="submit" className="submit-btn">Create Account</button>
              </form>
              <div className="auth-footer-link">
                Already have an admin account? <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); }}>Sign In</a>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="admin-panel">
            {/* EVENT CONTROLS FORM */}
            <div className="admin-card" style={{ maxWidth: 'none', margin: '0' }}>
              <h2 className="event-list-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isEditing ? <Edit2 size={18} style={{ color: '#00ffcc' }} /> : <Plus size={20} style={{ color: '#00ffcc' }} />}
                {isEditing ? 'Edit Game Countdown' : 'Create Game Countdown'}
              </h2>
              
              <form onSubmit={handleEventSubmit}>
                <div className="form-group">
                  <label className="form-label">Game Name <span style={{ color: '#ff4d4d' }}>*</span></label>
                  <select 
                    name="nama_game" 
                    className="form-select"
                    style={formErrors.nama_game ? { borderColor: '#ff4d4d', boxShadow: '0 0 5px rgba(255, 77, 77, 0.3)' } : {}}
                    value={eventForm.nama_game}
                    onChange={handleEventChange}
                  >
                    <option value="" disabled>Select Game</option>
                    {gamesList.map(game => (
                      <option key={game} value={game}>{game}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Event Name <span style={{ color: '#ff4d4d' }}>*</span></label>
                  <input 
                    type="text" 
                    name="nama_event" 
                    className={`form-input ${formErrors.nama_event ? 'input-error' : ''}`}
                    style={formErrors.nama_event ? { borderColor: '#ff4d4d', boxShadow: '0 0 5px rgba(255, 77, 77, 0.3)' } : {}}
                    placeholder="e.g. Spiral Abyss"
                    value={eventForm.nama_event}
                    onChange={handleEventChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category <span style={{ color: '#ff4d4d' }}>*</span></label>
                  <select 
                    name="kategori" 
                    className="form-select"
                    style={formErrors.kategori ? { borderColor: '#ff4d4d', boxShadow: '0 0 5px rgba(255, 77, 77, 0.3)' } : {}}
                    value={eventForm.kategori}
                    onChange={handleEventChange}
                  >
                    <option value="" disabled>Select Category</option>
                    <option value="endgame">End Game</option>
                    <option value="event">Event</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Start Date & Time <span style={{ color: '#ff4d4d' }}>*</span></label>
                  <input 
                    type="datetime-local" 
                    name="tanggal_mulai" 
                    className={`form-input ${formErrors.tanggal_mulai ? 'input-error' : ''}`}
                    style={formErrors.tanggal_mulai ? { borderColor: '#ff4d4d', boxShadow: '0 0 5px rgba(255, 77, 77, 0.3)' } : {}}
                    value={eventForm.tanggal_mulai}
                    onChange={handleEventChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date & Time <span style={{ color: '#ff4d4d' }}>*</span></label>
                  <input 
                    type="datetime-local" 
                    name="tanggal_berakhir" 
                    className={`form-input ${formErrors.tanggal_berakhir ? 'input-error' : ''}`}
                    style={formErrors.tanggal_berakhir ? { borderColor: '#ff4d4d', boxShadow: '0 0 5px rgba(255, 77, 77, 0.3)' } : {}}
                    value={eventForm.tanggal_berakhir}
                    onChange={handleEventChange}
                  />
                </div>



                <div className="form-group">
                  <label className="form-label">Upload Banner Image (Format: JPG, PNG, WebP | Max: 5MB)</label>
                  <input 
                    id="image-upload-input"
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg, image/webp" 
                    className="form-input" 
                    onChange={handleImageUpload}
                  />
                  {eventForm.gambar && (
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#00ffcc' }}>✓ Image loaded (WebP compressed format)</span>
                      <div 
                        style={{ 
                          width: '100%', 
                          height: '100px', 
                          borderRadius: '6px', 
                          marginTop: '6px', 
                          backgroundSize: 'cover', 
                          backgroundPosition: 'center',
                          backgroundImage: `url(${eventForm.gambar})` 
                        }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button type="submit" className="submit-btn" style={{ flex: 1 }}>
                    {isEditing ? 'Update Event' : 'Create Event'}
                  </button>
                  {isEditing && (
                    <button type="button" className="form-input" style={{ flex: 1, cursor: 'pointer' }} onClick={resetEventForm}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* EVENT VIEW LIST */}
            <div className="event-list">
              <h2 className="event-list-title">All Countdowns ({events.length})</h2>
              
              {events.length === 0 ? (
                <div className="no-data-msg">No active game events found in the database.</div>
              ) : (
                <div className="event-table-wrapper">
                  <table className="event-table">
                    <thead>
                      <tr>
                        <th>Game</th>
                        <th>Event</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>End Time</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.id}>
                          <td style={{ fontWeight: '600' }}>{event.nama_game}</td>
                          <td>{event.nama_event}</td>
                          <td>
                            <span className={`badge ${event.kategori.toLowerCase() === 'endgame' || event.kategori.toLowerCase() === 'end game' ? 'badge-endgame' : 'badge-event'}`}>
                              {event.kategori === 'endgame' ? 'End Game' : 'Event'}
                            </span>
                          </td>
                          <td>
                            <span 
                              className="badge" 
                              style={{ 
                                backgroundColor: (event.status || 'active') === 'active' ? 'rgba(0, 255, 204, 0.1)' : 'rgba(255, 77, 77, 0.1)', 
                                color: (event.status || 'active') === 'active' ? '#00ffcc' : '#ff4d4d',
                                border: (event.status || 'active') === 'active' ? '1px solid rgba(0, 255, 204, 0.2)' : '1px solid rgba(255, 77, 77, 0.2)'
                              }}
                            >
                              {(event.status || 'active') === 'active' ? 'Active' : 'Expired'}
                            </span>
                          </td>
                          <td style={{ color: '#9095a9' }}>
                            {new Date(event.tanggal_berakhir).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button className="edit-btn" onClick={() => handleEditClick(event)} title="Edit Event">
                                <Edit2 size={15} />
                              </button>
                              <button className="delete-btn" onClick={() => handleDeleteClick(event.id)} title="Delete Event">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="footer" style={{ marginTop: 'auto' }}>
        Copyright © {new Date().getFullYear()} MasComunity.
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button className="scroll-to-top-btn" onClick={scrollToTop} title="Back to top">
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
