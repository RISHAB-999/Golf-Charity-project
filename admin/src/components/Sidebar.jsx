import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import logoIcon from '../assets/icon.png';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Analytics' },
  { to: '/users', icon: '👥', label: 'Users' },
  { to: '/draws', icon: '🎯', label: 'Draws' },
  { to: '/charities', icon: '❤️', label: 'Charities' },
  { to: '/winners', icon: '🏆', label: 'Winners' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };
  
  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <img src={logoIcon} alt="GolfGive" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
        <div>
          <div style={{ fontFamily: 'Outfit', fontWeight: '800', fontSize: '16px', background: 'linear-gradient(135deg, #10b981, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GolfGive</div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1 }}>Admin Panel</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} onClick={handleNavClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
          Logged in as <strong>{admin?.name}</strong>
        </div>
        <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
          Logout
        </button>
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-w); height: 100vh; position: fixed; top: 0; left: 0;
          background: var(--bg2); border-right: 1px solid var(--border);
          display: flex; flex-direction: column; z-index: 50; padding: 0;
          transition: transform 0.3s ease;
        }
        @media (max-width: 768px) {
          .sidebar {
            width: 260px;
            transform: translateX(-100%);
            height: 100vh;
            box-shadow: 2px 0 16px rgba(0, 0, 0, 0.5);
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
        }
        .sidebar-logo { display: flex; align-items: center; gap: 12px; padding: 20px 20px 16px; border-bottom: 1px solid var(--border); }
        .sidebar-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
        .sidebar-link {
          display: flex; align-items: center; gap: 12px; padding: 10px 14px;
          border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;
          color: var(--text-muted); transition: var(--transition);
        }
        .sidebar-link:hover { background: var(--surface); color: var(--text); }
        .sidebar-link.active { background: rgba(16,185,129,0.12); color: var(--emerald); }
        .sidebar-footer { padding: 16px; border-top: 1px solid var(--border); }
      `}</style>
    </aside>
  );
}
