import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = [
    { to: '/charities', label: 'Charities' },
    { to: '/pricing', label: 'Pricing' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner container">
        <Link to="/" className="nav-logo">
          <img src="/icon.png" alt="GolfGive" className="logo-img" />
          <span className="logo-text">GolfGive</span>
        </Link>

        <div className="nav-links">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-outline btn-sm">Dashboard</Link>
              <button onClick={handleLogout} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join Now</Link>
            </>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div className="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {navLinks.map(l => <Link key={l.to} to={l.to} className="mobile-link">{l.label}</Link>)}
            {user ? (
              <>
                <Link to="/dashboard" className="mobile-link">Dashboard</Link>
                <button onClick={handleLogout} className="mobile-link" style={{ textAlign: 'left', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-link">Login</Link>
                <Link to="/register" className="mobile-link" style={{ color: 'var(--emerald)' }}>Join Now</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: all 0.3s ease; padding: 20px 0;
        }
        .navbar.scrolled {
          background: rgba(8,8,16,0.9); backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border); padding: 12px 0;
        }
        .nav-inner { display: flex; align-items: center; gap: 32px; }
        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-img { width: 34px; height: 34px; object-fit: contain; }
        .logo-text { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 800; background: linear-gradient(135deg, var(--emerald), var(--gold)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .nav-links { display: flex; gap: 8px; margin-left: auto; }
        .nav-link { color: var(--text-muted); text-decoration: none; padding: 8px 16px; border-radius: 8px; font-size: 15px; transition: var(--transition); }
        .nav-link:hover, .nav-link.active { color: var(--text); background: var(--surface); }
        .nav-actions { display: flex; gap: 8px; align-items: center; }
        .hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; }
        .hamburger span { width: 22px; height: 2px; background: var(--text); border-radius: 2px; display: block; }
        .mobile-menu { background: var(--bg2); border-top: 1px solid var(--border); padding: 16px 24px; display: flex; flex-direction: column; gap: 4px; }
        .mobile-link { padding: 12px 0; color: var(--text); text-decoration: none; font-size: 16px; border-bottom: 1px solid var(--border); display: block; }
        @media (max-width: 768px) {
          .nav-links, .nav-actions { display: none; }
          .hamburger { display: flex; margin-left: auto; }
        }
      `}</style>
    </nav>
  );
}
