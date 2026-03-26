import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile menu button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="mobile-menu-btn"
        style={{
          display: 'none',
          position: 'fixed',
          top: '16px', left: '16px',
          zIndex: 100,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          padding: '10px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '20px',
        }}
      >
        ☰
      </button>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <main style={{ 
        marginLeft: 'var(--sidebar-w)', 
        flex: 1, 
        padding: '32px', 
        overflowY: 'auto', 
        minHeight: '100vh'
      }}>
        <style>{`
          @media (max-width: 768px) {
            .mobile-menu-btn {
              display: block !important;
            }
            main {
              margin-left: 0 !important;
              padding: 80px 16px 32px !important;
            }
          }
        `}</style>
        {children}
      </main>
    </div>
  );
}
