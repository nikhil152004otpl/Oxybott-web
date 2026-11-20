/**
 * Advanced Visitor Intelligence & Privacy-Friendly Analytics Dashboard
 * 
 * Sub-views:
 * 1. Overview (Preserves existing 6 cards, traffic bar chart, traffic sources, device distribution, realtime, sessions table)
 * 2. Top Pages (Filterable by Page Type: All, Products, Tutorials, Software, Education; views, uniques, avg time, landing/exit)
 * 3. Product Interest & Buy Now CTR (Views, uniques, Buy Now clicks, CTR %, datasheet downloads, sortable, CSV export)
 * 4. External Purchases (Detailed Buy Now click logs with product, UTM campaign, referrer, device, timestamps)
 * 5. Video & Tutorials (Video plays, completion milestones 25/50/75/100%, avg watch time, tutorial reads)
 * 6. Search Analytics (Top search queries, query frequency, failed zero-result searches)
 * 7. Visitor Journeys (Step-by-step navigation flows & milestone actions)
 * 8. Live Activity Feed (Real-time live stream of recent visitor actions across the site)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../../services/api';
import {
  IconUsers, IconEye, IconActivity, IconChart, IconTrendingUp,
  IconRefreshCw, IconDownload, IconSearch, IconChevronRight,
  IconPackage, IconVideo, IconBookOpen, IconExternalLink, IconClock,
  IconAlertTriangle, IconFileText
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
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={PAD} y1={H - t * H + PAD * 0.3} x2={W - PAD} y2={H - t * H + PAD * 0.3}
          stroke="#e2e8f0" strokeWidth="1" />
      ))}
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
  const [activeTab, setActiveTab] = useState('overview');
  const [range, setRange] = useState('7');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);

  // Overview state
  const [overview, setOverview] = useState(null);
  const [chart, setChart] = useState(null);
  const [chartMetric, setChartMetric] = useState('sessions');
  const [visitors, setVisitors] = useState([]);
  const [visitorTotal, setVisitorTotal] = useState(0);
  const [visitorPage, setVisitorPage] = useState(1);
  const [realtime, setRealtime] = useState([]);

  // Sub-sections state
  const [topPages, setTopPages] = useState([]);
  const [pageTypeFilter, setPageTypeFilter] = useState('all');
  const [productsData, setProductsData] = useState([]);
  const [productSort, setProductSort] = useState('views');
  const [productSearch, setProductSearch] = useState('');
  const [externalClicks, setExternalClicks] = useState([]);
  const [externalClicksTotal, setExternalClicksTotal] = useState(0);
  const [externalClickersTotal, setExternalClickersTotal] = useState(0);
  const [videosData, setVideosData] = useState([]);
  const [tutorialsData, setTutorialsData] = useState({ tutorials: [], downloads: [] });
  const [searchData, setSearchData] = useState({ topSearches: [], failedSearches: [] });
  const [journeys, setJourneys] = useState([]);
  const [liveFeed, setLiveFeed] = useState([]);

  const [loading, setLoading] = useState(true);
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const realtimeRef = useRef(null);
  const liveFeedRef = useRef(null);

  // Build query string helper
  const getQueryString = useCallback((extra = {}) => {
    const params = new URLSearchParams();
    if (range === 'custom') {
      if (customStart) params.set('startDate', customStart);
      if (customEnd) params.set('endDate', customEnd);
    } else {
      params.set('range', range);
    }
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, v);
    });
    return params.toString();
  }, [range, customStart, customEnd]);

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    try {
      const [ovRes, chRes] = await Promise.all([
        API(`/analytics/overview?${getQueryString()}`),
        API(`/analytics/chart?${getQueryString()}`)
      ]);
      if (ovRes.success) setOverview(ovRes.overview);
      if (chRes.success) setChart(chRes.chart);
    } catch {}
  }, [getQueryString]);

  // Load Visitors Table
  const loadVisitors = useCallback(async (pg = 1) => {
    try {
      const res = await API(`/analytics/visitors?${getQueryString({ page: pg, limit: 20 })}`);
      if (res.success) {
        setVisitors(res.visitors);
        setVisitorTotal(res.total);
        setVisitorPage(pg);
      }
    } catch {}
  }, [getQueryString]);

  // Load Realtime Active Visitors
  const loadRealtime = useCallback(async () => {
    setRealtimeLoading(true);
    try {
      const res = await API('/analytics/realtime');
      if (res.success) setRealtime(res.activeVisitors);
    } catch {} finally {
      setRealtimeLoading(false);
    }
  }, []);

  // Load Top Pages
  const loadTopPages = useCallback(async () => {
    try {
      const res = await API(`/analytics/top-pages?${getQueryString({ pageType: pageTypeFilter })}`);
      if (res.success) setTopPages(res.pages);
    } catch {}
  }, [getQueryString, pageTypeFilter]);

  // Load Products Interest
  const loadProducts = useCallback(async () => {
    try {
      const res = await API(`/analytics/products?${getQueryString()}`);
      if (res.success) setProductsData(res.products);
    } catch {}
  }, [getQueryString]);

  // Load External Clicks
  const loadExternalClicks = useCallback(async () => {
    try {
      const res = await API(`/analytics/external-clicks?${getQueryString()}`);
      if (res.success) {
        setExternalClicks(res.clicks);
        setExternalClicksTotal(res.totalClicks);
        setExternalClickersTotal(res.uniqueClickers);
      }
    } catch {}
  }, [getQueryString]);

  // Load Video Analytics
  const loadVideos = useCallback(async () => {
    try {
      const res = await API(`/analytics/videos?${getQueryString()}`);
      if (res.success) setVideosData(res.videos);
    } catch {}
  }, [getQueryString]);

  // Load Tutorial Analytics
  const loadTutorials = useCallback(async () => {
    try {
      const res = await API(`/analytics/tutorials?${getQueryString()}`);
      if (res.success) setTutorialsData(res);
    } catch {}
  }, [getQueryString]);

  // Load Search Analytics
  const loadSearches = useCallback(async () => {
    try {
      const res = await API(`/analytics/searches?${getQueryString()}`);
      if (res.success) setSearchData(res);
    } catch {}
  }, [getQueryString]);

  // Load Visitor Journeys
  const loadJourneys = useCallback(async () => {
    try {
      const res = await API(`/analytics/journeys?${getQueryString({ limit: 30 })}`);
      if (res.success) setJourneys(res.journeys);
    } catch {}
  }, [getQueryString]);

  // Load Live Feed
  const loadLiveFeed = useCallback(async () => {
    try {
      const res = await API('/analytics/live-feed');
      if (res.success) setLiveFeed(res.feed);
    } catch {}
  }, []);

  // Trigger loads based on active tab
  useEffect(() => {
    setLoading(true);
    let p = null;
    if (activeTab === 'overview') {
      p = Promise.all([loadOverview(), loadVisitors(1), loadRealtime()]);
    } else if (activeTab === 'top-pages') {
      p = loadTopPages();
    } else if (activeTab === 'products') {
      p = loadProducts();
    } else if (activeTab === 'external-clicks') {
      p = loadExternalClicks();
    } else if (activeTab === 'videos') {
      p = loadVideos();
    } else if (activeTab === 'tutorials') {
      p = loadTutorials();
    } else if (activeTab === 'searches') {
      p = loadSearches();
    } else if (activeTab === 'journeys') {
      p = loadJourneys();
    } else if (activeTab === 'live-feed') {
      p = loadLiveFeed();
    }
    if (p) p.finally(() => setLoading(false));
  }, [activeTab, range, customStart, customEnd, pageTypeFilter, loadOverview, loadVisitors, loadRealtime, loadTopPages, loadProducts, loadExternalClicks, loadVideos, loadTutorials, loadSearches, loadJourneys, loadLiveFeed]);

  // Polling for realtime & live feed
  useEffect(() => {
    if (activeTab === 'overview') {
      realtimeRef.current = setInterval(loadRealtime, 30000);
      return () => clearInterval(realtimeRef.current);
    } else if (activeTab === 'live-feed') {
      liveFeedRef.current = setInterval(loadLiveFeed, 15000);
      return () => clearInterval(liveFeedRef.current);
    }
  }, [activeTab, loadRealtime, loadLiveFeed]);

  const exportCSV = () => {
    window.open(`/api/analytics/export?${getQueryString()}`, '_blank');
  };

  const downloadDailyReport = () => {
    window.open(`/api/analytics/daily-report?${getQueryString({ format: 'csv' })}`, '_blank');
  };

  const chartData = chart
    ? (chartMetric === 'sessions' ? chart.sessions : chart.pageViews)
    : [];
  const chartYKey = chartMetric === 'sessions' ? 'sessions' : 'page_views';

  return (
    <section className="admin-section active" id="sectionAnalytics">
      {/* SECTION HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="page-title" style={{ margin: 0, color: 'var(--admin-navy)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Visitor Intelligence &amp; Analytics</span>
          </h2>
          <p style={{ color: 'var(--admin-gray-500)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            First-party, privacy-friendly analytics &bull; No third-party ad pixels &bull; Masked IP security
          </p>
        </div>

        {/* Global Controls & Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7', label: '7d' },
            { id: '30', label: '30d' },
            { id: '90', label: '90d' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => { setRange(btn.id); setShowCustomRange(false); }}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                border: range === btn.id && !showCustomRange ? '1px solid var(--admin-primary)' : '1px solid var(--admin-gray-200)',
                background: range === btn.id && !showCustomRange ? 'var(--admin-primary)' : '#fff',
                color: range === btn.id && !showCustomRange ? '#fff' : 'var(--admin-gray-600)', cursor: 'pointer'
              }}
            >
              {btn.label}
            </button>
          ))}

          <button
            onClick={() => setShowCustomRange(!showCustomRange)}
            style={{
              padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
              border: showCustomRange ? '1px solid var(--admin-primary)' : '1px solid var(--admin-gray-200)',
              background: showCustomRange ? '#eff6ff' : '#fff',
              color: showCustomRange ? 'var(--admin-primary)' : 'var(--admin-gray-600)', cursor: 'pointer'
            }}
          >
            Custom Range
          </button>

          <button
            onClick={downloadDailyReport}
            title="Download full analytics intelligence report"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
              border: '1px solid var(--admin-gray-200)', background: '#fff', color: 'var(--admin-navy)', cursor: 'pointer'
            }}
          >
            <IconFileText size={14} /> Report
          </button>

          <button
            onClick={exportCSV}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
              border: '1px solid var(--admin-gray-200)', background: '#fff', color: 'var(--admin-navy)', cursor: 'pointer'
            }}
          >
            <IconDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Bar */}
      {showCustomRange && (
        <div style={{
          background: '#fff', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
          border: '1px solid var(--admin-gray-200)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-navy)' }}>Date Range:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--admin-gray-600)' }}>From:</label>
            <input
              type="date"
              className="form-input"
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.82rem' }}
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--admin-gray-600)' }}>To:</label>
            <input
              type="date"
              className="form-input"
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.82rem' }}
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setRange('custom'); }}
            className="btn btn-primary btn-sm"
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
          >
            Apply Range
          </button>
        </div>
      )}

      {/* SUB-NAVIGATION TABS */}
      <div style={{
        display: 'flex', gap: '0.35rem', borderBottom: '2px solid var(--admin-gray-200)',
        marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '2px'
      }}>
        {[
          { id: 'overview', label: 'Overview & Traffic', icon: IconChart },
          { id: 'top-pages', label: 'Top Pages', icon: IconFileText },
          { id: 'products', label: 'Product Interest & CTR', icon: IconPackage },
          { id: 'external-clicks', label: 'Buy Now Clicks', icon: IconExternalLink },
          { id: 'videos', label: 'Video Engagement', icon: IconVideo },
          { id: 'tutorials', label: 'Tutorials & Guides', icon: IconBookOpen },
          { id: 'searches', label: 'Search Analytics', icon: IconSearch },
          { id: 'journeys', label: 'Visitor Journeys', icon: IconTrendingUp },
          { id: 'live-feed', label: 'Live Activity Feed', icon: IconActivity }
        ].map(tab => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '0.6rem 0.9rem', border: 'none', background: 'transparent',
                borderBottom: isActive ? '3px solid var(--admin-primary)' : '3px solid transparent',
                color: isActive ? 'var(--admin-primary)' : 'var(--admin-gray-600)',
                fontWeight: isActive ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'color 0.15s'
              }}
            >
              <IconComp size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--admin-gray-400)', fontSize: '0.9rem' }}>
          Loading intelligence data...
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW & TRAFFIC (PRESERVED EXISTING METRICS + EXTENSIONS) */}
          {activeTab === 'overview' && (
            <div>
              {/* 6 Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <MetricCard icon={IconUsers} label="Total Sessions" value={overview?.totalSessions?.toLocaleString() || '0'} color="var(--admin-primary)" />
                <MetricCard icon={IconEye} label="Unique Visitors" value={overview?.uniqueVisitors?.toLocaleString() || '0'} color="#7c3aed" />
                <MetricCard icon={IconChart} label="Page Views" value={overview?.totalPageViews?.toLocaleString() || '0'} color="#059669" />
                <MetricCard icon={IconTrendingUp} label="Bounce Rate" value={`${overview?.bounceRate || 0}%`} sub="Single-page sessions" color="#f59e0b" />
                <MetricCard icon={IconActivity} label="Avg Session" value={formatDuration(overview?.avgSessionDuration)} color="#0891b2" />
                <MetricCard icon={IconUsers} label="Real-Time Active" value={overview?.realTimeActive || 0} sub="Last 5 minutes" color="#dc2626" />
              </div>

              {/* Chart + Sources */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', marginBottom: '1.5rem' }}>
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
                  </div>
                </div>
              </div>

              {/* Real-time active panel */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    Real-Time Active Visitors ({realtime.length})
                  </h3>
                  <button onClick={loadRealtime} disabled={realtimeLoading} className="btn btn-outline btn-sm" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
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
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                  Visitor Sessions ({visitorTotal.toLocaleString()} total)
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Visitor ID</th>
                        <th>Date &amp; Time</th>
                        <th>IP (Masked)</th>
                        <th>Device</th>
                        <th>Browser</th>
                        <th>Landing Page</th>
                        <th>Pages</th>
                        <th>Duration</th>
                        <th>Type</th>
                        <th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.length === 0 ? (
                        <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--admin-gray-400)', padding: '2rem' }}>No sessions recorded yet</td></tr>
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
              </div>
            </div>
          )}

          {/* TAB 2: TOP PAGES ANALYTICS */}
          {activeTab === 'top-pages' && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                  Top Pages &amp; Engagement Time
                </h3>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[
                    { id: 'all', label: 'All Pages' },
                    { id: 'product', label: 'Products' },
                    { id: 'tutorial', label: 'Tutorials & Guides' },
                    { id: 'software', label: 'Software' },
                    { id: 'education', label: 'Education' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setPageTypeFilter(t.id)}
                      style={{
                        padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
                        border: pageTypeFilter === t.id ? '1px solid var(--admin-primary)' : '1px solid var(--admin-gray-200)',
                        background: pageTypeFilter === t.id ? 'var(--admin-primary)' : '#fff',
                        color: pageTypeFilter === t.id ? '#fff' : 'var(--admin-gray-600)', cursor: 'pointer'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Page Path</th>
                      <th>Title</th>
                      <th>Total Views</th>
                      <th>Unique Visitors</th>
                      <th>Avg Engagement</th>
                      <th>Landing Page Count</th>
                      <th>Exit Page Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-gray-400)' }}>No page visits recorded in this period</td></tr>
                    ) : topPages.map((p, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--admin-primary)', fontWeight: 600 }}>{p.page_path}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--admin-gray-700)' }}>{p.page_title || '—'}</td>
                        <td style={{ fontWeight: 700, textAlign: 'center' }}>{p.views.toLocaleString()}</td>
                        <td style={{ textAlign: 'center' }}>{p.unique_visitors.toLocaleString()}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--admin-gray-600)' }}>{formatDuration(p.avg_seconds)}</td>
                        <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{p.landing_count}</td>
                        <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>{p.exit_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCT INTEREST & BUY NOW CTR */}
          {activeTab === 'products' && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                    Product Interest &amp; Buy Now Conversion CTR
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--admin-gray-500)' }}>
                    Purchase CTR = Unique Buy Now Clickers &divide; Unique Product Visitors &times; 100
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search product or SKU..."
                    className="form-input"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem', width: '200px' }}
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                  <select
                    className="form-select"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
                    value={productSort}
                    onChange={e => setProductSort(e.target.value)}
                  >
                    <option value="views">Sort by Views</option>
                    <option value="clicks">Sort by Buy Now Clicks</option>
                    <option value="ctr">Sort by CTR %</option>
                    <option value="downloads">Sort by Datasheet Downloads</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU / Series</th>
                      <th>Views</th>
                      <th>Unique Visitors</th>
                      <th>Buy Now Clicks</th>
                      <th>Unique Clickers</th>
                      <th>Purchase CTR</th>
                      <th>Datasheet Downloads</th>
                      <th>Gallery Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsData
                      .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                      .sort((a, b) => {
                        if (productSort === 'clicks') return b.buy_now_clicks - a.buy_now_clicks;
                        if (productSort === 'ctr') return b.ctr - a.ctr;
                        if (productSort === 'downloads') return b.datasheet_downloads - a.datasheet_downloads;
                        return b.views - a.views;
                      })
                      .map(p => (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.name}</strong>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--admin-gray-500)' }}>
                            <span style={{ fontFamily: 'monospace' }}>{p.sku}</span><br />
                            <small>{p.series || '—'}</small>
                          </td>
                          <td style={{ fontWeight: 600, textAlign: 'center' }}>{p.views.toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>{p.unique_visitors.toLocaleString()}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#ea580c' }}>{p.buy_now_clicks}</td>
                          <td style={{ textAlign: 'center' }}>{p.unique_buy_clickers}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.78rem',
                              background: p.ctr > 20 ? '#dcfce7' : p.ctr > 5 ? '#fef3c7' : '#f1f5f9',
                              color: p.ctr > 20 ? '#15803d' : p.ctr > 5 ? '#b45309' : '#64748b'
                            }}>
                              {p.ctr}%
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>{p.datasheet_downloads}</td>
                          <td style={{ textAlign: 'center', color: 'var(--admin-gray-500)' }}>{p.gallery_interactions}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: EXTERNAL PURCHASE CLICKS DASHBOARD */}
          {activeTab === 'external-clicks' && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                    External Purchase Clicks Log
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--admin-gray-500)' }}>
                    All &quot;Buy on OSEMI&quot; outbound conversions with source attribution
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    Total Clicks: <strong style={{ color: '#ea580c' }}>{externalClicksTotal}</strong> &bull; Unique Clickers: <strong>{externalClickersTotal}</strong>
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Product</th>
                      <th>Source Page</th>
                      <th>Traffic Source</th>
                      <th>UTM Campaign</th>
                      <th>Device</th>
                      <th>Visitor ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {externalClicks.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-gray-400)' }}>No external purchase clicks recorded in this period</td></tr>
                    ) : externalClicks.map((c, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: '0.78rem', color: 'var(--admin-gray-500)', whiteSpace: 'nowrap' }}>
                          {new Date(c.created_at).toLocaleDateString()}<br />
                          <span style={{ fontSize: '0.72rem' }}>{new Date(c.created_at).toLocaleTimeString()}</span>
                        </td>
                        <td>
                          <strong>{c.product_name || c.product_id}</strong>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--admin-primary)', fontFamily: 'monospace' }}>
                          {c.source_page || '/products'}
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{c.referrer || 'Direct'}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--admin-gray-600)' }}>
                          {c.utm_campaign ? `${c.utm_source || ''} / ${c.utm_campaign}` : '—'}
                        </td>
                        <td style={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>{c.device_type || 'desktop'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--admin-gray-400)' }}>
                          {c.anonymous_id?.substring(0, 8)}…
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: VIDEO ENGAGEMENT */}
          {activeTab === 'videos' && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                Video Engagement &amp; Completion Funnel
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Video Title</th>
                      <th>Plays</th>
                      <th>Unique Viewers</th>
                      <th>25% Progress</th>
                      <th>50% Progress</th>
                      <th>75% Progress</th>
                      <th>100% Complete</th>
                      <th>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videosData.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-gray-400)' }}>No video plays tracked in this period</td></tr>
                    ) : videosData.map((v, i) => (
                      <tr key={i}>
                        <td><strong>{v.entity_title || v.entity_id}</strong></td>
                        <td style={{ fontWeight: 700, textAlign: 'center', color: 'var(--admin-primary)' }}>{v.plays}</td>
                        <td style={{ textAlign: 'center' }}>{v.unique_viewers}</td>
                        <td style={{ textAlign: 'center', color: '#64748b' }}>{v.progress_25}</td>
                        <td style={{ textAlign: 'center', color: '#0891b2' }}>{v.progress_50}</td>
                        <td style={{ textAlign: 'center', color: '#7c3aed' }}>{v.progress_75}</td>
                        <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>{v.complete_100}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.78rem',
                            background: v.completionRate > 50 ? '#dcfce7' : '#f1f5f9',
                            color: v.completionRate > 50 ? '#15803d' : '#64748b'
                          }}>
                            {v.completionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: TUTORIALS & GUIDES */}
          {activeTab === 'tutorials' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem' }}>
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                  Top Tutorials &amp; Lesson Views
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tutorial</th>
                        <th>Views</th>
                        <th>Unique Readers</th>
                        <th>Avg Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tutorialsData.tutorials.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-gray-400)' }}>No tutorial views recorded</td></tr>
                      ) : tutorialsData.tutorials.map((t, i) => (
                        <tr key={i}>
                          <td><strong>{t.title || t.page_path}</strong></td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{t.views}</td>
                          <td style={{ textAlign: 'center' }}>{t.unique_readers}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--admin-gray-600)' }}>{formatDuration(t.avg_seconds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PDF Assembly Guide Downloads */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                  PDF Downloads
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {tutorialsData.downloads.length === 0 ? (
                    <div style={{ color: 'var(--admin-gray-400)', fontSize: '0.82rem', textAlign: 'center', padding: '2rem 0' }}>No downloads recorded</div>
                  ) : tutorialsData.downloads.map((d, i) => (
                    <div key={i} style={{ padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                        {d.entity_title || d.entity_id}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-primary)' }}>
                        {d.downloads} dl
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SEARCH ANALYTICS & FAILED SEARCHES */}
          {activeTab === 'searches' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Top Searches */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                  Most Searched Keywords
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Keyword</th>
                        <th>Search Count</th>
                        <th>Avg Results</th>
                        <th>Product Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchData.topSearches.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-gray-400)' }}>No search activity tracked</td></tr>
                      ) : searchData.topSearches.map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>&ldquo;{s.query_text}&rdquo;</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{s.search_count}</td>
                          <td style={{ textAlign: 'center', color: s.avg_results === 0 ? '#dc2626' : 'var(--admin-gray-600)' }}>{s.avg_results}</td>
                          <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{s.clicks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Failed Searches (0 results) */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <IconAlertTriangle size={18} style={{ color: '#dc2626' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#991b1b' }}>
                    Failed Searches (Zero Results)
                  </h3>
                </div>
                <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--admin-gray-500)' }}>
                  Keywords your visitors searched for but could not find. Use this to expand your catalog or tags!
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Query Term</th>
                        <th>Attempts</th>
                        <th>Last Searched</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchData.failedSearches.length === 0 ? (
                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#16a34a' }}>No failed searches recorded! All search terms returned results.</td></tr>
                      ) : searchData.failedSearches.map((f, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: '#dc2626' }}>&ldquo;{f.query_text}&rdquo;</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{f.attempt_count}</td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--admin-gray-500)' }}>
                            {new Date(f.last_attempted).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: VISITOR JOURNEY FLOWS */}
          {activeTab === 'journeys' && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                Visitor Journey Sequences
              </h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.82rem', color: 'var(--admin-gray-500)' }}>
                Anonymous step-by-step navigation path through the website per session.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {journeys.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-gray-400)' }}>No journeys recorded yet</div>
                ) : journeys.map((j, i) => (
                  <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--admin-gray-600)' }}>
                        <strong>Session:</strong> <span style={{ fontFamily: 'monospace' }}>{j.anonymous_id?.substring(0, 8)}…</span> &bull; {j.device_type} &bull; {new Date(j.session_start).toLocaleTimeString()}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--admin-gray-500)' }}>
                        Total steps: {j.steps.length} &bull; Duration: {formatDuration(j.duration_seconds)}
                      </div>
                    </div>

                    {/* Step Flow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {j.steps.map((st, sIdx) => {
                        const isBuy = st.type === 'buy_now_click';
                        const isDownload = st.type === 'document_download';
                        const isVideo = st.type?.startsWith('video_');
                        const isSearch = st.type === 'search_result_click';

                        return (
                          <React.Fragment key={sIdx}>
                            <span style={{
                              padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                              background: isBuy ? '#ea580c' : isDownload ? '#0891b2' : isVideo ? '#7c3aed' : isSearch ? '#d97706' : '#fff',
                              color: (isBuy || isDownload || isVideo || isSearch) ? '#fff' : 'var(--admin-navy)',
                              border: (isBuy || isDownload || isVideo || isSearch) ? 'none' : '1px solid #cbd5e1',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                            }}>
                              {isBuy ? '🛒 Buy on OSEMI' : isDownload ? '📄 Download' : isVideo ? '▶ Video' : isSearch ? '🔍 Search' : (st.path || '/')}
                            </span>
                            {sIdx < j.steps.length - 1 && (
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>&rarr;</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: REAL-TIME LIVE ACTIVITY FEED */}
          {activeTab === 'live-feed' && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    Live Activity Stream
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--admin-gray-500)' }}>
                    Streaming user interactions in real time &bull; Auto-refreshes every 15s
                  </p>
                </div>
                <button onClick={loadLiveFeed} className="btn btn-outline btn-sm">
                  <IconRefreshCw size={13} /> Refresh Stream
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Event</th>
                      <th>Subject / Target</th>
                      <th>Page Path</th>
                      <th>Device</th>
                      <th>Visitor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveFeed.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-gray-400)' }}>No recent activity recorded</td></tr>
                    ) : liveFeed.map((ev, i) => {
                      const isBuy = ev.event_type === 'buy_now_click';
                      return (
                        <tr key={i}>
                          <td style={{ fontSize: '0.78rem', color: 'var(--admin-gray-500)', whiteSpace: 'nowrap' }}>
                            {new Date(ev.created_at).toLocaleTimeString()}
                          </td>
                          <td>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                              background: isBuy ? '#fed7aa' : '#e0e7ff',
                              color: isBuy ? '#c2410c' : '#3730a3'
                            }}>
                              {ev.event_type?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                            {ev.entity_title || ev.entity_id || '—'}
                          </td>
                          <td style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--admin-primary)' }}>
                            {ev.page_path || '—'}
                          </td>
                          <td style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>
                            {ev.device_type || 'desktop'}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--admin-gray-400)' }}>
                            {ev.anonymous_id?.substring(0, 8)}…
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
