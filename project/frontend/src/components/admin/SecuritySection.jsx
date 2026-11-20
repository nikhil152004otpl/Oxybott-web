/**
 * Security Monitoring Section – rendered inside AdminDashboardPage
 */
import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../services/api';
import { IconAlertTriangle, IconShield, IconDownload, IconActivity } from '../common/Icons';

const API = (path, opts) => apiRequest(path, opts);

const SEVERITY_COLORS = {
  critical: { bg: '#fee2e2', text: '#b91c1c' },
  high:     { bg: '#fed7aa', text: '#c2410c' },
  medium:   { bg: '#fef3c7', text: '#92400e' },
  low:      { bg: '#d1fae5', text: '#065f46' },
  info:     { bg: '#dbeafe', text: '#1e40af' }
};

export default function SecuritySection() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [topIps, setTopIps] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: pg, limit: 50, days, severity: severityFilter, type: typeFilter }).toString();
      const [evRes, ipRes] = await Promise.all([
        API(`/security/events?${qs}`),
        API(`/security/top-ips?days=${days}`)
      ]);
      if (evRes.success) {
        setEvents(evRes.events);
        setStats(evRes.stats);
        setTotal(evRes.total);
        setPage(pg);
      }
      if (ipRes.success) setTopIps(ipRes.topIps);
    } catch {} finally { setLoading(false); }
  }, [days, severityFilter, typeFilter]);

  useEffect(() => { load(1); }, [days, severityFilter, typeFilter]);

  const exportCSV = () => window.open(`/api/security/export?days=${days}`, '_blank');

  return (
    <section className="admin-section active" id="sectionSecurity">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="page-title" style={{ margin: 0, color: 'var(--admin-navy)', fontSize: '1.5rem' }}>
            Security Monitoring
          </h2>
          <p style={{ color: 'var(--admin-gray-500)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Login attempts, rate limits, and security event log.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600,
                border: days === d ? '1px solid var(--admin-primary)' : '1px solid var(--admin-gray-200)',
                background: days === d ? 'var(--admin-primary)' : '#fff',
                color: days === d ? '#fff' : 'var(--admin-gray-600)', cursor: 'pointer'
              }}>
              {d}d
            </button>
          ))}
          <button onClick={exportCSV}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '0.4rem 0.9rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600,
              border: '1px solid var(--admin-gray-200)', background: '#fff', color: 'var(--admin-navy)', cursor: 'pointer'
            }}>
            <IconDownload size={14} /> Export
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Events', value: stats.total || 0, color: '#64748b' },
            { label: 'Critical', value: stats.critical || 0, color: '#dc2626' },
            { label: 'High Severity', value: stats.high || 0, color: '#ea580c' },
            { label: 'Failed Logins', value: stats.failed_logins || 0, color: '#d97706' },
            { label: 'IP Blocks', value: stats.blocked_ips || 0, color: '#7c3aed' }
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: '10px', padding: '1rem',
              border: '1px solid var(--admin-gray-200)', textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-gray-500)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem', marginBottom: '1.5rem', alignItems: 'start' }}>
        {/* Event Log */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="form-select" style={{ fontSize: '0.82rem' }}>
              <option value="">All Severities</option>
              {['critical', 'high', 'medium', 'low', 'info'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="form-select" style={{ fontSize: '0.82rem' }}>
              <option value="">All Event Types</option>
              <option value="failed_login">Failed Login</option>
              <option value="rate_limit_exceeded">Rate Limit</option>
              <option value="ip_blocked">IP Blocked</option>
              <option value="suspicious_activity">Suspicious</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-gray-400)', fontSize: '0.85rem' }}>Loading...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event Type</th>
                    <th>IP Address</th>
                    <th>Username</th>
                    <th>Severity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--admin-gray-400)', padding: '2.5rem', fontSize: '0.85rem' }}>
                        No security events recorded — your site is clean! 🛡️
                      </td>
                    </tr>
                  ) : events.map(ev => {
                    const sc = SEVERITY_COLORS[ev.severity] || SEVERITY_COLORS.info;
                    return (
                      <tr key={ev.id}>
                        <td style={{ fontSize: '0.75rem', color: 'var(--admin-gray-500)', whiteSpace: 'nowrap' }}>
                          {new Date(ev.created_at).toLocaleDateString()}<br />
                          <span style={{ fontSize: '0.7rem' }}>{new Date(ev.created_at).toLocaleTimeString()}</span>
                        </td>
                        <td style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                          {ev.event_type?.replace(/_/g, ' ')}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{ev.ip_address || '—'}</td>
                        <td style={{ fontSize: '0.82rem' }}>{ev.username || '—'}</td>
                        <td>
                          <span style={{
                            fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 700,
                            background: sc.bg, color: sc.text, textTransform: 'uppercase'
                          }}>
                            {ev.severity || 'info'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--admin-gray-500)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ev.details || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {total > 50 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={() => load(page - 1)} disabled={page <= 1}
                style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid var(--admin-gray-200)', background: '#fff', cursor: 'pointer', fontSize: '0.82rem' }}>
                ← Prev
              </button>
              <span style={{ padding: '0.3rem 0.75rem', fontSize: '0.82rem', color: 'var(--admin-gray-500)' }}>
                Page {page} of {Math.ceil(total / 50)}
              </span>
              <button onClick={() => load(page + 1)} disabled={page >= Math.ceil(total / 50)}
                style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid var(--admin-gray-200)', background: '#fff', cursor: 'pointer', fontSize: '0.82rem' }}>
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Top Flagged IPs */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
            Most Active IPs
          </h3>
          {topIps.length === 0 ? (
            <div style={{ color: 'var(--admin-gray-400)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No flagged IPs
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topIps.slice(0, 10).map((ip, i) => (
                <div key={i} style={{
                  padding: '0.5rem 0.6rem', borderRadius: '7px', border: '1px solid #e2e8f0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>
                      {ip.ip_address}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--admin-gray-500)', marginTop: '1px' }}>
                      {ip.failed_logins || 0} failed logins
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '1px 7px', borderRadius: '12px',
                    background: ip.event_count > 10 ? '#fee2e2' : '#fef3c7',
                    color: ip.event_count > 10 ? '#b91c1c' : '#92400e'
                  }}>
                    {ip.event_count} events
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
