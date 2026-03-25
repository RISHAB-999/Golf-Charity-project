import { useState, useEffect } from 'react';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/analytics').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader-full" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  if (!data) return null;

  const statCards = [
    { label: 'Total Users', value: data.totalUsers, icon: '👥', color: '#10b981' },
    { label: 'Active Subscribers', value: data.activeSubscribers, icon: '💳', color: '#f59e0b' },
    { label: 'Total Prize Pool', value: `£${data.totalPrizePool}`, icon: '🎯', color: '#8b5cf6' },
    { label: 'Charity Contributed', value: `£${data.totalCharityContrib}`, icon: '❤️', color: '#ef4444' },
    { label: 'Total Paid Out', value: `£${data.totalPaidOut}`, icon: '🏆', color: '#10b981' },
    { label: 'Total Draws', value: data.totalDraws, icon: '🎲', color: '#f59e0b' },
  ];

  const pieData = [
    { name: 'Prize Pool', value: parseFloat(data.totalPrizePool) },
    { name: 'Charity', value: parseFloat(data.totalCharityContrib) },
    { name: 'Paid Out', value: parseFloat(data.totalPaidOut) },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>
        <span className="gradient-text">Analytics</span> Overview
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>Platform health at a glance.</p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {statCards.map((s, i) => (
          <div key={i} className="glass" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'Outfit', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
              </div>
              <div style={{ fontSize: '28px' }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>📊 Financial Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pieData}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#0f0f1a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }} />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>💰 Fund Allocation</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f0f1a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '8px' }}>
            {pieData.map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i] }} />
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
