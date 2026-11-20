/**
 * Analytics Dashboard Section – rendered inside AdminDashboardPage
 * Shows: overview metrics, time-series chart, visitor table, real-time panel
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../../services/api';
import {
  IconUsers, IconEye, IconActivity, IconChart, IconTrendingUp,
  IconRefreshCw, IconDownload, IconSearch, IconChevronRight
} from '../common/Icons';

const API = (path, opts) => apiRequest(path, opts);

function MetricCard({ icon: Icon, label, value, sub, color = 'var(--admin-primary)' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '1.25rem',
      border: '1px solid var(--admin-gray-200)',
      display: 'flex', alignItems: 'flex-start', gap: '1rem'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: color + '15', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color, flexShrink: 0
      }}>
        <Icon size={18} />
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--admin-navy)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--admin-gray-500)', marginTop: '0.25rem', fontWeight: 500 }}>
          {label}
        </div>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--admin-gray-400)', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

// Minimal inline SVG bar chart
function SimpleBarChart({ data = [], xKey, yKey, label, color = '#2563eb' }) {
  if (!data.length) return <div style={{ textAlign: 'center', color: 'var(--admin-gray-400)', padding: '2rem', fontSize: '0.85rem' }}>No data yet</div>;

  const max = Math.max(...data.map(d => d[yKey] || 0), 1);
  const W = 600, H = 160, PAD = 30;
  const barW = Math.max(2, (W - PAD * 2) / data.length - 2);

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: '100%', height: 'auto' }}>
      {/* Y axis gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={PAD} y1={H - t * H + PAD * 0.3} x2={W - PAD} y2={H - t * H + PAD * 0.3}
          stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {/* Bars */}
      {data.map((d, i) => {
        const h = Math.max(2, ((d[yKey] || 0) / max) * (H - 10));
        const x = PAD + i * ((W - PAD * 2) / data.length);
        const y = H - h + PAD * 0.3;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} fill={color} rx="2" opacity="0.85" />
            {data.length <= 14 && (
              <text x={x + barW / 2} y={H + PAD * 0.3 + 14} textAnchor="middle"
                fontSize="8" fill="#94a3b8">
                {String(d[xKey] || '').slice(-5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function formatDuration(secs) {
  if (!secs) return '0s';
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export default function AnalyticsSection() {
  const [range, setRange] = useState(7);
  const [overview, setOverview] = useState(null);
  const [chart, setChart] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [visitorTotal, setVisitorTotal] = useState(0);
  const [visitorPage, setVisitorPage] = useState(1);
  const [realtime, setRealtime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const [chartMetric, setChartMetric] = useState('sessions');
  const realtimeRef = useRef(null);

  const loadOverview = useCallback(async () => {
    try {
      const res = await API(`/analytics/overview?range=${range}`);
      if (res.success) setOverview(res.overview);
    } catch {}
  }, [range]);

  const loadChart = useCallback(async () => {
    try {
      const res = await API(`/analytics/chart?range=${range}`);
      if (res.success) setChart(res.chart);
    } catch {}
  }, [range]);

  const loadVisitors = useCallback(async (page = 1) => {
    try {
      const res = await API(`/analytics/visitors?page=${page}&limit=20`);
      if (res.success) { setVisitors(res.visitors); setVisitorTotal(res.total); setVisitorPage(page); }
    } catch {}
  }, []);

  const loadRealtime = useCallback(async () => {
    setRealtimeLoading(true);
    try {
      const res = await API('/analytics/realtime');
      if (res.success) setRealtime(res.activeVisitors);
    } catch {} finally { setRealtimeLoading(false); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadOverview(), loadChart(), loadVisitors(1), loadRealtime()])
      .finally(() => setLoading(false));
  }, [range]);

  // Auto-refresh realtime every 30s
  useEffect(() => {
    realtimeRef.current = setInterval(loadRealtime, 30000);
    return () => clearInterval(realtimeRef.current);
  }, [loadRealtime]);

  const exportCSV = () => {
    window.open(`/api/analytics/export?range=${range}`, '_blank');
  };

  const chartData = chart
    ? (chartMetric === 'sessions' ? chart.sessions : chart.pageViews)
    : [];
  const chartYKey = chartMetric === 'sessions' ? 'sessions' : 'page_views';

  return (
    <section className="admin-section active" id="sectionAnalytics">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="page-title" style={{ margin: 0, color: 'var(--admin-navy)', fontSize: '1.5rem' }}>
            Visitor Analytics
          </h2>
          <p style={{ color: 'var(--admin-gray-500)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            First-party analytics — no third-party trackers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setRange(d)}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600,
                border: range === d ? '1px solid var(--admin-primary)' : '1px solid var(--admin-gray-200)',
                background: range === d ? 'var(--admin-primary)' : '#fff',
                color: range === d ? '#fff' : 'var(--admin-gray-600)', cursor: 'pointer'
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
            <IconDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--admin-gray-400)' }}>Loading analytics...</div>
      ) : (
        <>
          {/* Overview Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <MetricCard icon={IconUsers} label="Total Sessions" value={overview?.totalSessions?.toLocaleString() || '0'} color="var(--admin-primary)" />
            <MetricCard icon={IconEye} label="Unique Visitors" value={overview?.uniqueVisitors?.toLocaleString() || '0'} color="#7c3aed" />
            <MetricCard icon={IconChart} label="Page Views" value={overview?.totalPageViews?.toLocaleString() || '0'} color="#059669" />
            <MetricCard icon={IconTrendingUp} label="Bounce Rate" value={`${overview?.bounceRate || 0}%`} sub="Single-page sessions" color="#f59e0b" />
            <MetricCard icon={IconActivity} label="Avg Session" value={formatDuration(overview?.avgSessionDuration)} color="#0891b2" />
            <MetricCard icon={IconUsers} label="Real-Time Active" value={overview?.realTimeActive || 0} sub="Last 5 minutes" color="#dc2626" />
          </div>

          {/* Chart + Sources row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Bar Chart */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                  Traffic Over Time
                </h3>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {['sessions', 'pageViews'].map(m => (
                    <button key={m} onClick={() => setChartMetric(m)}
                      style={{
                        padding: '0.25rem 0.65rem', borderRadius: '5px', fontSize: '0.75rem', fontWeight: 600,
                        border: chartMetric === m ? '1px solid var(--admin-primary)' : '1px solid #e2e8f0',
                        background: chartMetric === m ? 'var(--admin-primary)' : '#fff',
                        color: chartMetric === m ? '#fff' : '#64748b', cursor: 'pointer'
                      }}>
                      {m === 'sessions' ? 'Sessions' : 'Page Views'}
                    </button>
                  ))}
                </div>
              </div>
              <SimpleBarChart data={chartData} xKey="day" yKey={chartYKey}
                color={chartMetric === 'sessions' ? '#2563eb' : '#7c3aed'} />
            </div>

            {/* Traffic Sources */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                Traffic Sources
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(overview?.trafficSources || []).slice(0, 7).map(s => {
                  const max = Math.max(...(overview?.trafficSources || []).map(x => x.cnt), 1);
                  const pct = Math.round((s.cnt / max) * 100);
                  return (
                    <div key={s.source}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '2px' }}>
                        <span style={{ color: 'var(--admin-gray-700)', fontWeight: 500 }}>{s.source}</span>
                        <span style={{ color: 'var(--admin-gray-500)', fontWeight: 600 }}>{s.cnt}</span>
                      </div>
                      <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--admin-primary)', borderRadius: '3px', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  );
                })}
                {!overview?.trafficSources?.length && (
                  <div style={{ color: 'var(--admin-gray-400)', fontSize: '0.82rem', textAlign: 'center', paddingTop: '1rem' }}>
                    No data yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Pages + Device Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Top Pages */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-navy)' }}>Top Pages</h3>
              {(overview?.topPages || []).length === 0 ? (
                <div style={{ color: 'var(--admin-gray-400)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>No data yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {(overview?.topPages || []).slice(0, 8).map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', borderRadius: '6px', background: i % 2 === 0 ? '#f8fafc' : 'transparent' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--admin-gray-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                        {p.page_path}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--admin-primary)', flexShrink: 0 }}>{p.views}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Device Distribution */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-navy)' }}>Device Distribution</h3>
              {(overview?.deviceDistribution || []).length === 0 ? (
                <div style={{ color: 'var(--admin-gray-400)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>No data yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(overview?.deviceDistribution || []).map(d => {
                    const total = (overview?.deviceDistribution || []).reduce((s, x) => s + x.cnt, 0) || 1;
                    const pct = Math.round((d.cnt / total) * 100);
                    const colors = { Desktop: '#2563eb', Mobile: '#7c3aed', Tablet: '#0891b2' };
                    const col = colors[d.device] || '#64748b';
                    return (
                      <div key={d.device}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 500, color: 'var(--admin-gray-700)' }}>{d.device}</span>
                          <span style={{ color: 'var(--admin-gray-500)' }}>{d.cnt} ({pct}%)</span>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Real-Time Active Visitors */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                Real-Time Active Visitors
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
              </h3>
              <button onClick={loadRealtime} disabled={realtimeLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem',
                  border: '1px solid var(--admin-gray-200)', background: '#fff', cursor: 'pointer',
                  color: 'var(--admin-gray-600)'
                }}>
                <IconRefreshCw size={12} /> Refresh
              </button>
            </div>
            {realtime.length === 0 ? (
              <div style={{ color: 'var(--admin-gray-400)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>
                No active visitors in the last 5 minutes
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Visitor</th>
                      <th>Current Page</th>
                      <th>Device</th>
                      <th>Browser</th>
                      <th>Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {realtime.map((v, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--admin-gray-500)' }}>
                          {v.anonymous_id?.substring(0, 8)}…
                        </td>
                        <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                          {v.page_path || '—'}
                        </td>
                        <td style={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>{v.device_type || 'desktop'}</td>
                        <td style={{ fontSize: '0.82rem' }}>{v.browser || '—'}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--admin-gray-500)' }}>
                          {v.last_page_time ? new Date(v.last_page_time).toLocaleTimeString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Visitor Sessions Table */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                Visitor Sessions ({visitorTotal.toLocaleString()} total)
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Visitor ID</th>
                    <th>Date & Time</th>
                    <th>IP (Masked)</th>
                    <th>Device</th>
                    <th>Browser</th>
                    <th>OS</th>
                    <th>Landing Page</th>
                    <th>Pages</th>
                    <th>Duration</th>
                    <th>Type</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.length === 0 ? (
                    <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--admin-gray-400)', padding: '2rem', fontSize: '0.85rem' }}>No visitor sessions recorded yet</td></tr>
                  ) : visitors.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--admin-gray-500)' }}>{v.anonymous_id?.substring(0, 8)}…</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--admin-gray-500)', whiteSpace: 'nowrap' }}>
                        {new Date(v.session_start).toLocaleDateString()}<br />
                        <span style={{ fontSize: '0.72rem' }}>{new Date(v.session_start).toLocaleTimeString()}</span>
                      </td>
                      <td style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{v.ip_masked || '—'}</td>
                      <td style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}>{v.device_type || 'desktop'}</td>
                      <td style={{ fontSize: '0.82rem' }}>{v.browser || '—'}</td>
                      <td style={{ fontSize: '0.82rem' }}>{v.os || '—'}</td>
                      <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>{v.landing_page || '/'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{v.page_count || 1}</td>
                      <td style={{ fontSize: '0.78rem' }}>{formatDuration(v.duration_seconds)}</td>
                      <td>
                        <span style={{
                          fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 600,
                          background: v.is_new_visitor ? '#dbeafe' : '#f0fdf4',
                          color: v.is_new_visitor ? '#1d4ed8' : '#15803d'
                        }}>
                          {v.is_new_visitor ? 'New' : 'Return'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--admin-gray-500)' }}>
                        {v.utm_source || (v.referrer ? 'Referral' : 'Direct')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {visitorTotal > 20 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <button onClick={() => loadVisitors(visitorPage - 1)} disabled={visitorPage <= 1}
                  style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid var(--admin-gray-200)', background: '#fff', cursor: 'pointer', fontSize: '0.82rem' }}>
                  ← Prev
                </button>
                <span style={{ padding: '0.3rem 0.75rem', fontSize: '0.82rem', color: 'var(--admin-gray-500)' }}>
                  Page {visitorPage} of {Math.ceil(visitorTotal / 20)}
                </span>
                <button onClick={() => loadVisitors(visitorPage + 1)} disabled={visitorPage >= Math.ceil(visitorTotal / 20)}
                  style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid var(--admin-gray-200)', background: '#fff', cursor: 'pointer', fontSize: '0.82rem' }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
