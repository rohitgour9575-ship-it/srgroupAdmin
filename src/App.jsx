import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Target, 
  Users, 
  Settings as SettingsIcon, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Clock, 
  Share2, 
  PhoneCall, 
  Database,
  ExternalLink
} from 'lucide-react';

const getInitialApiBase = () => {
  return localStorage.getItem('sr_custom_api_url') || 
         import.meta.env.VITE_API_BASE || 
         (window.location.hostname === 'localhost' ? '/api' : 'https://mean-schools-scream.loca.lt/api');
};

export default function App() {
  const [apiBase, setApiBase] = useState(getInitialApiBase());
  const [customApiInput, setCustomApiInput] = useState(getInitialApiBase());
  const [token, setToken] = useState(localStorage.getItem('sr_admin_token') || '');
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState({ mongoConnected: false, dbMode: 'Connecting...' });

  // Helper for all API calls
  const apiFetch = (endpoint, options = {}) => {
    const targetUrl = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint}`;
    return fetch(targetUrl, {
      ...options,
      headers: {
        'bypass-tunnel-reminder': 'true',
        ...(options.headers || {})
      }
    });
  };

  // Auth form state
  const [loginCreds, setLoginCreds] = useState({ username: 'admin', password: 'admin123' });
  const [authError, setAuthError] = useState('');

  // Data states
  const [updates, setUpdates] = useState([]);
  const [calls, setCalls] = useState([]);
  const [leads, setLeads] = useState([]);
  const [settings, setSettings] = useState({
    phone: '+91 95898 38223',
    whatsapp: '+91 95898 38223',
    dematLink: 'https://jmfs.ltd/JMFINS/7pO73D9613D',
    noticeMarquee: '📈 Welcome to SR Enterprises! Open your Free Demat & Trading account with JM Financial.'
  });

  // Modals state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Forms
  const [updateForm, setUpdateForm] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    category: 'Nifty Outlook',
    sentiment: 'Bullish',
    summary: '',
    content: '',
    niftySupport: '24,800',
    niftyResistance: '25,100',
    bankNiftySupport: '51,200',
    bankNiftyResistance: '52,000',
    tags: 'NIFTY50, INTRADAY'
  });

  const [callForm, setCallForm] = useState({
    date: new Date().toISOString().split('T')[0],
    stockName: '',
    callType: 'BUY',
    segment: 'Cash',
    entryPrice: '',
    targetPrice: '',
    stopLoss: '',
    status: 'Active',
    notes: ''
  });

  // Check health & fetch data
  useEffect(() => {
    fetchHealth();
    if (token) {
      fetchAllData();
    }
  }, [token, apiBase]);

  const fetchHealth = async () => {
    try {
      const res = await apiFetch('/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (e) {
      setHealth({ mongoConnected: false, dbMode: 'Local Offline' });
    }
  };

  const fetchAllData = async () => {
    try {
      const authHeaders = { Authorization: `Bearer ${token}` };
      const [updRes, callRes, leadRes, setRes] = await Promise.all([
        apiFetch('/updates').then(r => r.json()).catch(() => null),
        apiFetch('/calls').then(r => r.json()).catch(() => null),
        apiFetch('/leads', { headers: authHeaders }).then(r => r.ok ? r.json() : { data: [] }).catch(() => null),
        apiFetch('/settings').then(r => r.json()).catch(() => null)
      ]);

      if (updRes?.data) setUpdates(updRes.data);
      if (callRes?.data) setCalls(callRes.data);
      if (leadRes?.data) setLeads(leadRes.data);
      if (setRes?.data) setSettings(setRes.data);
    } catch (err) {
      console.log('Error loading data:', err);
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginCreds)
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('sr_admin_token', data.token);
        setToken(data.token);
      } else {
        setAuthError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      if (loginCreds.username === 'admin' && loginCreds.password === 'admin123') {
        const mockToken = 'mock_admin_token_2026';
        localStorage.setItem('sr_admin_token', mockToken);
        setToken(mockToken);
      } else {
        setAuthError('Cannot connect to server at ' + apiBase);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sr_admin_token');
    setToken('');
  };

  // Change / Save Custom API
  const handleSaveApiUrl = () => {
    if (!customApiInput.trim()) return;
    const cleanUrl = customApiInput.trim().replace(/\/$/, '');
    localStorage.setItem('sr_custom_api_url', cleanUrl);
    setApiBase(cleanUrl);
    alert('API URL updated to: ' + cleanUrl);
  };

  // Submit Daily Update
  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    const payload = {
      date: updateForm.date,
      title: updateForm.title,
      category: updateForm.category,
      sentiment: updateForm.sentiment,
      summary: updateForm.summary,
      content: updateForm.content,
      keyLevels: {
        niftySupport: updateForm.niftySupport,
        niftyResistance: updateForm.niftyResistance,
        bankNiftySupport: updateForm.bankNiftySupport,
        bankNiftyResistance: updateForm.bankNiftyResistance
      },
      tags: updateForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    const method = editingItem ? 'PUT' : 'POST';
    const endpoint = editingItem ? `/updates/${editingItem._id || editingItem.id}` : '/updates';

    try {
      const res = await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowUpdateModal(false);
        setEditingItem(null);
        fetchAllData();
      }
    } catch (err) {
      alert('Error saving update');
    }
  };

  const handleDeleteUpdate = async (id) => {
    if (!window.confirm('Delete this market update?')) return;
    try {
      await apiFetch(`/updates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  // Submit Stock Call
  const handleSaveCall = async (e) => {
    e.preventDefault();
    const method = editingItem ? 'PUT' : 'POST';
    const endpoint = editingItem ? `/calls/${editingItem._id || editingItem.id}` : '/calls';

    try {
      const res = await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(callForm)
      });
      if (res.ok) {
        setShowCallModal(false);
        setEditingItem(null);
        fetchAllData();
      }
    } catch (err) {
      alert('Error saving call');
    }
  };

  const handleUpdateCallStatus = async (callId, newStatus) => {
    try {
      await apiFetch(`/calls/${callId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCall = async (id) => {
    if (!window.confirm('Delete this stock call?')) return;
    try {
      await apiFetch(`/calls/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
    } catch (err) {
      alert('Failed to delete call');
    }
  };

  // Update Lead Status
  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      await apiFetch(`/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      await apiFetch(`/leads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
    } catch (err) {
      alert('Failed to delete lead');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert('Settings updated successfully!');
      }
    } catch (err) {
      alert('Failed to save settings');
    }
  };

  // If not logged in, render Login Screen
  if (!token) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="brand-crest" style={{ margin: '0 auto 14px', width: '48px', height: '48px' }}>
              <svg viewBox="0 0 40 40" width="34" height="34" fill="none">
                <text x="20" y="26" textAnchor="middle" fontFamily="'Outfit', sans-serif" fontSize="17" fontWeight="900" letterSpacing="-1.5" fill="#E4C17B">SR</text>
                <path d="M8 30h24" stroke="#E4C17B" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--navy)', fontSize: '22px' }}>
              SR Enterprises
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Admin Control Desk
            </span>
          </div>

          {authError && (
            <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={loginCreds.username}
                onChange={(e) => setLoginCreds({ ...loginCreds, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={loginCreds.password}
                onChange={(e) => setLoginCreds({ ...loginCreds, password: e.target.value })}
                required
              />
            </div>

            <div style={{ fontSize: '11px', color: 'var(--muted)', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
              💡 Default credentials: <strong>admin</strong> / <strong>admin123</strong>
            </div>

            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '12px', marginTop: '6px' }}>
              Sign In to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-crest">
            <svg viewBox="0 0 40 40" width="28" height="28" fill="none">
              <text x="20" y="26" textAnchor="middle" fontFamily="'Outfit', sans-serif" fontSize="17" fontWeight="900" letterSpacing="-1.5" fill="#E4C17B">SR</text>
              <path d="M8 30h24" stroke="#E4C17B" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
            </svg>
          </div>
          <div className="brand-text">
            <h2>SR ENTERPRISES</h2>
            <span>ADMIN DESK</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'updates' ? 'active' : ''}`}
            onClick={() => setActiveTab('updates')}
          >
            <TrendingUp size={18} /> Daily Market Outlook
          </button>
          <button 
            className={`nav-item ${activeTab === 'calls' ? 'active' : ''}`}
            onClick={() => setActiveTab('calls')}
          >
            <Target size={18} /> Stock Calls
          </button>
          <button 
            className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            <Users size={18} /> Leads & Enquiries ({leads.length})
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={18} /> Site Settings & Ticker
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item" style={{ color: '#ef4444' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-wrapper">
        <header className="admin-header">
          <div className="header-title">
            <h1>
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'updates' && 'Day-Wise Market Commentary'}
              {activeTab === 'calls' && 'Day-Wise Stock Calls'}
              {activeTab === 'leads' && 'Customer Inquiries & Leads'}
              {activeTab === 'settings' && 'Website Settings & Marquee'}
            </h1>
          </div>

          <div className="header-status">
            <span className={`status-chip ${health.mongoConnected ? 'live' : 'warn'}`}>
              <Database size={13} />
              {health.mongoConnected ? 'MongoDB Connected' : 'Auto Storage Active'}
            </span>
            <a 
              href="https://illustrious-tarsier-700c6f.netlify.app" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-sm btn-gold"
            >
              View Live Website <ExternalLink size={13} />
            </a>
          </div>
        </header>

        <div className="content-container">
          {/* ================= OVERVIEW TAB ================= */}
          {activeTab === 'overview' && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <div className="stat-val">{updates.length}</div>
                    <div className="stat-label">Market Updates</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fdf8ee', color: '#d9b56d' }}>
                    <Target size={24} />
                  </div>
                  <div>
                    <div className="stat-val">{calls.length}</div>
                    <div className="stat-label">Active Stock Calls</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="stat-val">{leads.length}</div>
                    <div className="stat-label">Total Leads Logged</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <div className="stat-val">{new Date().toISOString().split('T')[0]}</div>
                    <div className="stat-label">Today's Date</div>
                  </div>
                </div>
              </div>

              {/* Recent Leads Preview */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Recent Inquiries Received</h3>
                  <button onClick={() => setActiveTab('leads')} className="btn btn-sm btn-primary">
                    View All Leads
                  </button>
                </div>

                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Interest</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 5).map(l => (
                      <tr key={l._id || l.id}>
                        <td><strong>{l.name}</strong></td>
                        <td>{l.phone}</td>
                        <td>{l.interest}</td>
                        <td>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: l.status === 'New' ? '#ecfdf5' : '#f1f5f9',
                            color: l.status === 'New' ? '#047857' : '#475569'
                          }}>
                            {l.status}
                          </span>
                        </td>
                        <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                          No leads submitted yet. Leads from website form will show here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= DAILY UPDATES TAB ================= */}
          {activeTab === 'updates' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Day-Wise Market Outlook Posts</h3>
                  <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Add daily pre-market insights, technical levels, and Nifty/BankNifty analysis.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setEditingItem(null);
                    setUpdateForm({
                      date: new Date().toISOString().split('T')[0],
                      title: '',
                      category: 'Nifty Outlook',
                      sentiment: 'Bullish',
                      summary: '',
                      content: '',
                      niftySupport: '24,800',
                      niftyResistance: '25,100',
                      bankNiftySupport: '51,200',
                      bankNiftyResistance: '52,000',
                      tags: 'NIFTY50, INTRADAY'
                    });
                    setShowUpdateModal(true);
                  }}
                  className="btn btn-primary"
                >
                  <Plus size={16} /> Post New Day-Wise Outlook
                </button>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Sentiment</th>
                    <th>Levels</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {updates.map(u => (
                    <tr key={u._id || u.id}>
                      <td><span style={{ fontWeight: '700', color: 'var(--navy)' }}>{u.date}</span></td>
                      <td>
                        <strong>{u.title}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                          {u.summary?.substring(0, 60)}...
                        </div>
                      </td>
                      <td>{u.category}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '800',
                          background: u.sentiment === 'Bullish' ? '#ecfdf5' : u.sentiment === 'Bearish' ? '#fef2f2' : '#f8fafc',
                          color: u.sentiment === 'Bullish' ? '#047857' : u.sentiment === 'Bearish' ? '#b91c1c' : '#475569'
                        }}>
                          ● {u.sentiment}
                        </span>
                      </td>
                      <td>
                        <small style={{ color: 'var(--muted)' }}>
                          Nifty: {u.keyLevels?.niftySupport || '-'} / {u.keyLevels?.niftyResistance || '-'}
                        </small>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteUpdate(u._id || u.id)}
                          className="btn btn-sm btn-danger"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {updates.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                        No updates posted yet. Click "+ Post New Day-Wise Outlook" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ================= STOCK CALLS TAB ================= */}
          {activeTab === 'calls' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Day-Wise Stock Calls</h3>
                  <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Share buy/sell recommendations with entry, target, and stop-loss targets.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setCallForm({
                      date: new Date().toISOString().split('T')[0],
                      stockName: '',
                      callType: 'BUY',
                      segment: 'Cash',
                      entryPrice: '',
                      targetPrice: '',
                      stopLoss: '',
                      status: 'Active',
                      notes: ''
                    });
                    setShowCallModal(true);
                  }}
                  className="btn btn-primary"
                >
                  <Plus size={16} /> Add Stock Call
                </button>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Stock</th>
                    <th>Type</th>
                    <th>Segment</th>
                    <th>Levels (Entry / Target / SL)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map(c => (
                    <tr key={c._id || c.id}>
                      <td>{c.date}</td>
                      <td><strong>{c.stockName}</strong></td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '800',
                          fontSize: '11px',
                          background: c.callType === 'BUY' ? '#10b981' : '#ef4444',
                          color: '#fff'
                        }}>
                          {c.callType}
                        </span>
                      </td>
                      <td>{c.segment}</td>
                      <td>
                        ₹{c.entryPrice} ➔ <strong style={{ color: '#059669' }}>₹{c.targetPrice}</strong> (SL: ₹{c.stopLoss})
                      </td>
                      <td>
                        <select
                          value={c.status}
                          onChange={(e) => handleUpdateCallStatus(c._id || c.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}
                        >
                          <option>Active</option>
                          <option>Target Hit</option>
                          <option>Stoploss Hit</option>
                          <option>Closed</option>
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteCall(c._id || c.id)}
                          className="btn btn-sm btn-danger"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {calls.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                        No stock calls posted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ================= LEADS TAB ================= */}
          {activeTab === 'leads' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Client Leads & Demat Inquiries</h3>
                  <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Track all inquiries submitted via the website and initiate WhatsApp chats directly.
                  </p>
                </div>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Client Name</th>
                    <th>Mobile</th>
                    <th>Interest</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l._id || l.id}>
                      <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                      <td><strong>{l.name}</strong></td>
                      <td>
                        <a href={`tel:${l.phone}`} style={{ color: 'var(--navy)', fontWeight: '600' }}>
                          {l.phone}
                        </a>
                      </td>
                      <td>{l.interest}</td>
                      <td><small>{l.message || '-'}</small></td>
                      <td>
                        <select
                          value={l.status}
                          onChange={(e) => handleUpdateLeadStatus(l._id || l.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}
                        >
                          <option>New</option>
                          <option>Contacted</option>
                          <option>Converted</option>
                          <option>Closed</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a
                            href={`https://wa.me/${l.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${l.name}, thank you for contacting SR Enterprises regarding ${l.interest}. How may we assist you today?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-gold"
                            title="Chat on WhatsApp"
                          >
                            <Share2 size={13} /> WhatsApp
                          </a>
                          <button
                            onClick={() => handleDeleteLead(l._id || l.id)}
                            className="btn btn-sm btn-danger"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                        No leads found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ================= SETTINGS TAB ================= */}
          {activeTab === 'settings' && (
            <div>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Manage Website Information & Marquee</h3>
                </div>

                <form onSubmit={handleSaveSettings} className="form-grid">
                  <div className="form-group">
                    <label>Support Phone Number</label>
                    <input
                      type="text"
                      value={settings.phone || ''}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>WhatsApp Number</label>
                    <input
                      type="text"
                      value={settings.whatsapp || ''}
                      onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                    />
                  </div>

                  <div className="form-group full">
                    <label>JM Financial Demat Affiliate Link</label>
                    <input
                      type="text"
                      value={settings.dematLink || ''}
                      onChange={(e) => setSettings({ ...settings, dematLink: e.target.value })}
                    />
                  </div>

                  <div className="form-group full">
                    <label>Top Notice Marquee Ticker Text (Announcements)</label>
                    <textarea
                      rows="3"
                      value={settings.noticeMarquee || ''}
                      onChange={(e) => setSettings({ ...settings, noticeMarquee: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="form-group full">
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                      Save All Settings
                    </button>
                  </div>
                </form>
              </div>

              {/* API Connection Card */}
              <div className="card" style={{ marginTop: '24px' }}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title">🌐 Live API Server & Cloud Backend Connection</h3>
                    <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      Connect this Admin Panel and your Live Client Website to your backend server or tunnel.
                    </p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group full">
                    <label>Active Backend API URL</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        value={customApiInput} 
                        onChange={(e) => setCustomApiInput(e.target.value)} 
                        placeholder="e.g. https://mean-schools-scream.loca.lt/api or https://your-server.onrender.com/api"
                      />
                      <button 
                        type="button" 
                        onClick={handleSaveApiUrl} 
                        className="btn btn-primary"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Save & Switch API
                      </button>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span>Active URL: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{apiBase}</code></span>
                      <span className={`status-chip ${health.status === 'ok' ? 'live' : 'warn'}`}>
                        {health.status === 'ok' ? '🟢 Live Backend Reachable' : '🔴 Server Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: ADD DAILY UPDATE ================= */}
      {showUpdateModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--navy)', marginBottom: '18px', fontSize: '20px' }}>
              Create Day-Wise Market Outlook
            </h3>

            <form onSubmit={handleSaveUpdate} className="form-grid">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={updateForm.date}
                  onChange={(e) => setUpdateForm({ ...updateForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={updateForm.category}
                  onChange={(e) => setUpdateForm({ ...updateForm, category: e.target.value })}
                >
                  <option>Nifty Outlook</option>
                  <option>BankNifty</option>
                  <option>Market News</option>
                  <option>Stock Ideas</option>
                  <option>General</option>
                </select>
              </div>

              <div className="form-group full">
                <label>Update Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Nifty Outlook: Crucial Support at 24,800"
                  value={updateForm.title}
                  onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Market Sentiment</label>
                <select
                  value={updateForm.sentiment}
                  onChange={(e) => setUpdateForm({ ...updateForm, sentiment: e.target.value })}
                >
                  <option>Bullish</option>
                  <option>Bearish</option>
                  <option>Neutral</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tags (Comma separated)</label>
                <input
                  type="text"
                  placeholder="NIFTY50, INTRADAY, AUTO"
                  value={updateForm.tags}
                  onChange={(e) => setUpdateForm({ ...updateForm, tags: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Nifty Support Level</label>
                <input
                  type="text"
                  placeholder="e.g. 24,800 - 24,850"
                  value={updateForm.niftySupport}
                  onChange={(e) => setUpdateForm({ ...updateForm, niftySupport: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Nifty Resistance Level</label>
                <input
                  type="text"
                  placeholder="e.g. 25,100 - 25,200"
                  value={updateForm.niftyResistance}
                  onChange={(e) => setUpdateForm({ ...updateForm, niftyResistance: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Bank Nifty Support</label>
                <input
                  type="text"
                  placeholder="e.g. 51,200"
                  value={updateForm.bankNiftySupport}
                  onChange={(e) => setUpdateForm({ ...updateForm, bankNiftySupport: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Bank Nifty Resistance</label>
                <input
                  type="text"
                  placeholder="e.g. 52,000"
                  value={updateForm.bankNiftyResistance}
                  onChange={(e) => setUpdateForm({ ...updateForm, bankNiftyResistance: e.target.value })}
                />
              </div>

              <div className="form-group full">
                <label>Short Summary *</label>
                <textarea
                  rows="2"
                  placeholder="Brief preview sentence for the card..."
                  value={updateForm.summary}
                  onChange={(e) => setUpdateForm({ ...updateForm, summary: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="form-group full">
                <label>Detailed Content / Trade Plan *</label>
                <textarea
                  rows="4"
                  placeholder="Detailed commentary, reasoning, sectors in focus..."
                  value={updateForm.content}
                  onChange={(e) => setUpdateForm({ ...updateForm, content: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="form-group full" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="btn btn-sm"
                  style={{ background: '#f1f5f9' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Publish Day's Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD STOCK CALL ================= */}
      {showCallModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--navy)', marginBottom: '18px', fontSize: '20px' }}>
              Add Day's Stock Call
            </h3>

            <form onSubmit={handleSaveCall} className="form-grid">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={callForm.date}
                  onChange={(e) => setCallForm({ ...callForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Stock Symbol *</label>
                <input
                  type="text"
                  placeholder="e.g. RELIANCE, SBIN"
                  value={callForm.stockName}
                  onChange={(e) => setCallForm({ ...callForm, stockName: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Call Action</label>
                <select
                  value={callForm.callType}
                  onChange={(e) => setCallForm({ ...callForm, callType: e.target.value })}
                >
                  <option>BUY</option>
                  <option>SELL</option>
                </select>
              </div>

              <div className="form-group">
                <label>Segment</label>
                <select
                  value={callForm.segment}
                  onChange={(e) => setCallForm({ ...callForm, segment: e.target.value })}
                >
                  <option>Cash</option>
                  <option>Intraday / Futures</option>
                  <option>Options</option>
                  <option>Delivery</option>
                </select>
              </div>

              <div className="form-group">
                <label>Entry Price (₹) *</label>
                <input
                  type="text"
                  placeholder="e.g. 2980"
                  value={callForm.entryPrice}
                  onChange={(e) => setCallForm({ ...callForm, entryPrice: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Target Price (₹) *</label>
                <input
                  type="text"
                  placeholder="e.g. 3060"
                  value={callForm.targetPrice}
                  onChange={(e) => setCallForm({ ...callForm, targetPrice: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Stop Loss (₹) *</label>
                <input
                  type="text"
                  placeholder="e.g. 2930"
                  value={callForm.stopLoss}
                  onChange={(e) => setCallForm({ ...callForm, stopLoss: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Initial Status</label>
                <select
                  value={callForm.status}
                  onChange={(e) => setCallForm({ ...callForm, status: e.target.value })}
                >
                  <option>Active</option>
                  <option>Target Hit</option>
                  <option>Stoploss Hit</option>
                  <option>Closed</option>
                </select>
              </div>

              <div className="form-group full">
                <label>Technical Rationale / Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Daily trendline breakout with above-average volume."
                  value={callForm.notes}
                  onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="form-group full" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCallModal(false)}
                  className="btn btn-sm"
                  style={{ background: '#f1f5f9' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Save Stock Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
