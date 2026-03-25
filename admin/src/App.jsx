import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import AdminLogin from './pages/AdminLogin';
import Users from './pages/Users';
import Draws from './pages/Draws';
import AdminCharities from './pages/AdminCharities';
import Winners from './pages/Winners';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';

function AdminRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return <div className="loader-full"><div className="spinner" /></div>;
  return admin ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="/dashboard" element={<AdminRoute><Layout><Analytics /></Layout></AdminRoute>} />
          <Route path="/users" element={<AdminRoute><Layout><Users /></Layout></AdminRoute>} />
          <Route path="/draws" element={<AdminRoute><Layout><Draws /></Layout></AdminRoute>} />
          <Route path="/charities" element={<AdminRoute><Layout><AdminCharities /></Layout></AdminRoute>} />
          <Route path="/winners" element={<AdminRoute><Layout><Winners /></Layout></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}

export default App;
