/**
 * Advanced Visitor Intelligence & Privacy-Friendly Analytics Dashboard
 * 
 * Features:
 * - Grouped Navigation (Overview, Content, Products, Audience, Settings)
 * - Zero-filled interactive SVG chart (Bar & Line modes, Sessions & Page Views toggle, IST timezone)
 * - KPI Cards with Prior-Period % change deltas and info tooltips
 * - Engagement Rate & active duration metrics
 * - Traffic Sources normalization & drill-down modal
 * - Top 5 Geo, Top 5 Searches, Top 5 Pages
 * - Bot traffic transparency & IP exclusion / browser opt-out controls
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../../services/api';
import { isTrackingOptedOut, setTrackingOptOut } from '../../utils/analytics';
import {
  IconUsers, IconEye, IconActivity, IconChart, IconTrendingUp,
  IconRefreshCw, IconDownload, IconSearch, IconChevronRight,
  IconPackage, IconVideo, IconBookOpen, IconExternalLink, IconClock,
  IconAlertTriangle, IconFileText, IconCheck, IconTrash
} from '../common/Icons';

const API = (path, opts) => apiRequest(path, opts);

function formatDuration(secs) {
  if (!secs || isNaN(secs)) return '0s';
  const s = parseInt(secs, 10);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

// ─── Metric Card with Info Tooltip & Prior-Period Delta ───────────────────────
function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  delta,
  inverseDelta = false,
  tooltip,
  color = 'var(--admin-primary)'
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  let deltaColor = '#64748b';
  let isPositive = false;
  if (delta && delta !== '0%') {
    isPositive = delta.startsWith('+');
    // If inverseDelta is true (e.g. for bounce rate), positive increase is bad (amber/red)
    if (inverseDelta) {
      deltaColor = isPositive ? '#f59e0b' : '#16a34a';
    } else {
      deltaColor = isPositive ? '#16a34a' : '#dc2626';
    }
  }

  return (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '1.15rem',
      border: '1px solid var(--admin-gray-200)',
      display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
      position: 'relative'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: color + '15', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color, flexShrink: 0
      }}>
        <Icon size={18} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--admin-gray-500)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{label}</span>
            {tooltip && (
              <span
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                style={{
                  cursor: 'help', color: '#94a3b8', fontSize: '0.72rem', display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px',
                  borderRadius: '50%', border: '1px solid #cbd5e1'
                }}
              >
                i
              </span>
            )}
          </div>

          {delta && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, padding: '1px 6px',
              borderRadius: '10px', background: deltaColor + '15', color: deltaColor,
              whiteSpace: 'nowrap'
            }}>
              {delta}
            </span>
          )}
        </div>

        <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--admin-navy)', lineHeight: 1.2, marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </div>

        {sub && (
          <div style={{ fontSize: '0.72rem', color: 'var(--admin-gray-400)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sub}
          </div>
        )}
      </div>

      {/* Hover Info Tooltip */}
      {showTooltip && tooltip && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', color: '#f8fafc', padding: '0.45rem 0.75rem',
          borderRadius: '6px', fontSize: '0.72rem', width: 'max-content', maxWidth: '240px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 100, pointerEvents: 'none',
          marginBottom: '6px', lineHeight: 1.4
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

// ─── Upgraded Interactive SVG Chart (Bar & Line with Hour/Day Zero-Fill) ──────
function InteractiveChart({ data = [], xKey = 'day', yKey = 'sessions', label = 'Traffic', color = '#2563eb', isHourly = false }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line'

  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--admin-gray-400)', padding: '3.5rem 1rem', fontSize: '0.85rem' }}>
        No traffic events recorded for this time range.
      </div>
    );
  }

  const values = data.map(d => parseInt(d[yKey], 10) || 0);
  const maxVal = Math.max(...values, 5);

  const W = 760;
  const H = 200;
  const PAD_L = 40;
  const PAD_R = 20;
  const PAD_T = 20;
  const PAD_B = 35;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const step = plotW / Math.max(data.length, 1);
  const maxBarWidth = Math.min(28, Math.max(4, step - 4));

  // Y-axis grid ticks
  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];

  // Line chart path points
  const points = data.map((d, i) => {
    const x = PAD_L + i * step + step / 2;
    const val = parseInt(d[yKey], 10) || 0;
    const y = PAD_T + plotH - (val / maxVal) * plotH;
    return { x, y, val, label: d[xKey] };
  });

  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${PAD_T + plotH} L ${points[0].x} ${PAD_T + plotH} Z`
    : '';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Chart Mode Controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginBottom: '8px' }}>
        <button
          onClick={() => setChartType('bar')}
          style={{
            padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600,
            border: chartType === 'bar' ? '1px solid var(--admin-primary)' : '1px solid #cbd5e1',
            background: chartType === 'bar' ? '#eff6ff' : '#fff',
            color: chartType === 'bar' ? 'var(--admin-primary)' : '#64748b', cursor: 'pointer'
          }}
        >
          Bar
        </button>
        <button
          onClick={() => setChartType('line')}
          style={{
            padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600,
            border: chartType === 'line' ? '1px solid var(--admin-primary)' : '1px solid #cbd5e1',
            background: chartType === 'line' ? '#eff6ff' : '#fff',
            color: chartType === 'line' ? 'var(--admin-primary)' : '#64748b', cursor: 'pointer'
          }}
        >
          Line
        </button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        {/* Horizontal gridlines & Y labels */}
        {yTicks.map((t, idx) => {
          const yPos = PAD_T + plotH - (t / maxVal) * plotH;
          return (
            <g key={idx}>
              <line x1={PAD_L} y1={yPos} x2={W - PAD_R} y2={yPos} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
              <text x={PAD_L - 8} y={yPos + 4} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">
                {t}
              </text>
            </g>
          );
        })}

        {/* Line Chart Render */}
        {chartType === 'line' && (
          <>
            <path d={areaD} fill={color} opacity="0.12" />
            <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={hoverIndex === i ? 5 : (data.length <= 31 ? 3 : 1.5)}
                fill={hoverIndex === i ? '#fff' : color}
                stroke={color}
                strokeWidth={hoverIndex === i ? 2.5 : 1}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </>
        )}

        {/* Bar Chart Render */}
        {chartType === 'bar' && data.map((d, i) => {
          const val = parseInt(d[yKey], 10) || 0;
          const barH = Math.max(val > 0 ? 3 : 0, (val / maxVal) * plotH);
          const xCenter = PAD_L + i * step + step / 2;
          const x = xCenter - maxBarWidth / 2;
          const y = PAD_T + plotH - barH;
          const isHovered = hoverIndex === i;

          return (
            <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)} style={{ cursor: 'pointer' }}>
              <rect
                x={x}
                y={val > 0 ? y : PAD_T + plotH - 1}
                width={maxBarWidth}
                height={val > 0 ? barH : 1}
                fill={color}
                opacity={isHovered ? 1 : 0.8}
                rx="3"
              />
            </g>
          );
        })}

        {/* X-Axis Tick Labels (Optimized for density) */}
        {data.map((d, i) => {
          const shouldShowLabel = isHourly
            ? i % 3 === 0
            : (data.length <= 14 || (data.length <= 31 && i % 4 === 0) || i % 10 === 0 || i === data.length - 1);

          if (!shouldShowLabel) return null;
          const x = PAD_L + i * step + step / 2;
          const rawLabel = String(d[xKey] || '');
          const displayLabel = isHourly ? rawLabel : rawLabel.slice(-5);

          return (
            <text key={i} x={x} y={H - 10} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="sans-serif">
              {displayLabel}
            </text>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoverIndex !== null && data[hoverIndex] && (
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: '#0f172a', color: '#f8fafc', padding: '0.4rem 0.75rem',
          borderRadius: '6px', fontSize: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span style={{ color: '#94a3b8' }}>{data[hoverIndex][xKey]}</span>
          <span style={{ fontWeight: 700, color: '#38bdf8' }}>
            {data[hoverIndex][yKey]} {label}
          </span>
          {data[hoverIndex].unique_visitors !== undefined && (
            <span style={{ fontSize: '0.7rem', color: '#a78bfa' }}>
              ({data[hoverIndex].unique_visitors} uniques)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AnalyticsSection() {
  const [activeGroup, setActiveGroup] = useState('overview'); // 'overview' | 'content' | 'products' | 'audience' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');
  const [range, setRange] = useState('7');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);

  // Overview & Chart State
  const [overview, setOverview] = useState(null);
  const [chart, setChart] = useState(null);
  const [chartMetric, setChartMetric] = useState('sessions'); // 'sessions' | 'pageViews'
  const [visitors, setVisitors] = useState([]);
  const [visitorTotal, setVisitorTotal] = useState(0);
  const [visitorPage, setVisitorPage] = useState(1);
  const [realtime, setRealtime] = useState([]);

  // Sub-sections
  const [topPages, setTopPages] = useState([]);
  const [pageTypeFilter, setPageTypeFilter] = useState('all');
  const [productsData, setProductsData] = useState([]);
  const [productSort, setProductSort] = useState('views');
  const [productSearch, setProductSearch] = useState('');
  const [externalClicks, setExternalClicks] = useState([]);
  const [videosData, setVideosData] = useState([]);
  const [tutorialsData, setTutorialsData] = useState({ tutorials: [], downloads: [] });
  const [searchData, setSearchData] = useState({ topSearches: [], failedSearches: [] });
  const [journeys, setJourneys] = useState([]);
  const [liveFeed, setLiveFeed] = useState([]);

  // Settings & Excluded IPs
  const [excludedIps, setExcludedIps] = useState([]);
  const [newIpPattern, setNewIpPattern] = useState('');
  const [newIpNote, setNewIpNote] = useState('');
  const [isOptedOutState, setIsOptedOutState] = useState(isTrackingOptedOut());
  const [sourceDrilldown, setSourceDrilldown] = useState(null); // channel string or null
  const [drilldownData, setDrilldownData] = useState([]);

  const [loading, setLoading] = useState(true);
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

  // Load Realtime Active Visitors (independent 30s polling)
  const loadRealtime = useCallback(async () => {
    try {
      const res = await API('/analytics/realtime');
      if (res.success) setRealtime(res.activeVisitors);
    } catch {}
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
      if (res.success) setExternalClicks(res.clicks);
    } catch {}
  }, [getQueryString]);

  // Load Videos
  const loadVideos = useCallback(async () => {
    try {
      const res = await API(`/analytics/videos?${getQueryString()}`);
      if (res.success) setVideosData(res.videos);
    } catch {}
  }, [getQueryString]);

  // Load Tutorials
  const loadTutorials = useCallback(async () => {
    try {
      const res = await API(`/analytics/tutorials?${getQueryString()}`);
      if (res.success) setTutorialsData({ tutorials: res.tutorials, downloads: res.downloads });
    } catch {}
  }, [getQueryString]);

  // Load Searches
  const loadSearches = useCallback(async () => {
    try {
      const res = await API(`/analytics/searches?${getQueryString()}`);
      if (res.success) setSearchData({ topSearches: res.topSearches, failedSearches: res.failedSearches });
    } catch {}
  }, [getQueryString]);

  // Load Journeys
  const loadJourneys = useCallback(async () => {
    try {
      const res = await API(`/analytics/journeys?${getQueryString({ limit: 25 })}`);
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

  // Load Excluded IPs
  const loadExcludedIps = useCallback(async () => {
    try {
      const res = await API('/analytics/excluded-ips');
      if (res.success) setExcludedIps(res.excludedIps);
    } catch {}
  }, []);

  // Source Drill-Down
  const openSourceDrilldown = async (channel) => {
    setSourceDrilldown(channel);
    try {
      const res = await API(`/analytics/traffic-sources/drilldown?${getQueryString({ channel })}`);
      if (res.success) setDrilldownData(res.details);
    } catch {}
  };

  // Add Excluded IP Pattern
  const handleAddExcludedIp = async (e) => {
    e.preventDefault();
    if (!newIpPattern.trim()) return;
    try {
      const res = await API('/analytics/excluded-ips', {
        method: 'POST',
        body: JSON.stringify({ ipPattern: newIpPattern.trim(), note: newIpNote.trim() })
      });
      if (res.success) {
        setNewIpPattern('');
        setNewIpNote('');
        loadExcludedIps();
      }
    } catch {}
  };

  const handleDeleteExcludedIp = async (id) => {
    try {
      const res = await API(`/analytics/excluded-ips/${id}`, { method: 'DELETE' });
      if (res.success) loadExcludedIps();
    } catch {}
  };

  // Toggle Browser Opt-Out
  const handleToggleOptOut = () => {
    const nextVal = !isOptedOutState;
    setTrackingOptOut(nextVal);
    setIsOptedOutState(nextVal);
  };

  // Orchestrate Initial and Tab Switching Data Loading
  useEffect(() => {
    setLoading(true);
    const promises = [];

    if (activeTab === 'overview') {
      promises.push(loadOverview(), loadVisitors(1), loadRealtime());
    } else if (activeTab === 'top-pages') {
      promises.push(loadTopPages());
    } else if (activeTab === 'products') {
      promises.push(loadProducts());
    } else if (activeTab === 'external-clicks') {
      promises.push(loadExternalClicks());
    } else if (activeTab === 'videos') {
      promises.push(loadVideos());
    } else if (activeTab === 'tutorials') {
      promises.push(loadTutorials());
    } else if (activeTab === 'searches') {
      promises.push(loadSearches());
    } else if (activeTab === 'journeys') {
      promises.push(loadJourneys());
    } else if (activeTab === 'live-feed') {
      promises.push(loadLiveFeed());
    } else if (activeTab === 'settings') {
      promises.push(loadExcludedIps());
    }

    Promise.all(promises).finally(() => setLoading(false));
  }, [
    activeTab, range, customStart, customEnd, pageTypeFilter,
    loadOverview, loadVisitors, loadRealtime, loadTopPages,
    loadProducts, loadExternalClicks, loadVideos, loadTutorials,
    loadSearches, loadJourneys, loadLiveFeed, loadExcludedIps
  ]);

  // Polling for Real-Time & Live Feed (Auto-refresh every 30s)
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

  // Chart data resolution
  const isHourly = (range === 'today' || range === 'yesterday');
  const chartData = chart
    ? (chartMetric === 'sessions' ? chart.sessions : chart.pageViews)
    : [];
  const chartYKey = chartMetric === 'sessions' ? 'sessions' : 'page_views';

  // Navigation Group Definitions
  const NAV_GROUPS = [
    { id: 'overview', label: 'Overview', subTabs: [{ id: 'overview', label: 'Dashboard & Traffic' }] },
    {
      id: 'content', label: 'Content',
      subTabs: [
        { id: 'top-pages', label: 'Top Pages' },
        { id: 'tutorials', label: 'Tutorials & Guides' },
        { id: 'videos', label: 'Video Engagement' }
      ]
    },
    {
      id: 'products', label: 'Products',
      subTabs: [
        { id: 'products', label: 'Product Interest & CTR' },
        { id: 'external-clicks', label: 'Buy Now Clicks' }
      ]
    },
    {
      id: 'audience', label: 'Audience',
      subTabs: [
        { id: 'journeys', label: 'Visitor Journeys' },
        { id: 'searches', label: 'Search Analytics' },
        { id: 'live-feed', label: 'Live Activity Stream' }
      ]
    },
    {
      id: 'settings', label: 'Settings',
      subTabs: [{ id: 'settings', label: 'IP & Privacy Controls' }]
    }
  ];

  const handleGroupSelect = (grp) => {
    setActiveGroup(grp.id);
    setActiveTab(grp.subTabs[0].id);
  };

  return (
    <section className="admin-section active" id="sectionAnalytics" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* SECTION HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="page-title" style={{ margin: 0, color: 'var(--admin-navy)', fontSize: '1.5rem' }}>
              Visitor Intelligence &amp; Analytics
            </h2>
            <span style={{
              fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px',
              background: '#e0e7ff', color: '#4338ca'
            }}>
              IST (Asia/Kolkata • UTC+5:30)
            </span>
          </div>
          <p style={{ color: 'var(--admin-gray-500)', fontSize: '0.82rem', margin: '0.25rem 0 0 0' }}>
            First-party, privacy-preserving tracking &bull; Active time duration &bull; Zero third-party ad pixels
          </p>
        </div>

        {/* Global Controls & Filters */}
        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                padding: '0.38rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
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
              padding: '0.38rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
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
              padding: '0.38rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
              border: '1px solid var(--admin-gray-200)', background: '#fff', color: 'var(--admin-navy)', cursor: 'pointer'
            }}
          >
            <IconFileText size={13} /> Report
          </button>

          <button
            onClick={exportCSV}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '0.38rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
              border: '1px solid var(--admin-gray-200)', background: '#fff', color: 'var(--admin-navy)', cursor: 'pointer'
            }}
          >
            <IconDownload size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Bar */}
      {showCustomRange && (
        <div style={{
          background: '#fff', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
          border: '1px solid var(--admin-gray-200)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-navy)' }}>Custom Range:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--admin-gray-600)' }}>From:</label>
            <input
              type="date"
              className="form-input"
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--admin-gray-600)' }}>To:</label>
            <input
              type="date"
              className="form-input"
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setRange('custom'); }}
            className="btn btn-primary btn-sm"
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
          >
            Apply Range
          </button>
        </div>
      )}

      {/* GROUPED NAVIGATION TABS (No horizontal overflow) */}
      <div style={{ marginBottom: '1.25rem' }}>
        {/* Level 1: Primary Groups */}
        <div style={{
          display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--admin-gray-200)',
          paddingBottom: '0.5rem', flexWrap: 'wrap'
        }}>
          {NAV_GROUPS.map(grp => {
            const isActive = activeGroup === grp.id;
            return (
              <button
                key={grp.id}
                onClick={() => handleGroupSelect(grp)}
                style={{
                  padding: '0.45rem 1.1rem', borderRadius: '8px', border: 'none',
                  background: isActive ? 'var(--admin-navy)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--admin-gray-600)',
                  fontWeight: isActive ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {grp.label}
              </button>
            );
          })}
        </div>

        {/* Level 2: Sub-tabs within group (if more than 1) */}
        {NAV_GROUPS.find(g => g.id === activeGroup)?.subTabs.length > 1 && (
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            {NAV_GROUPS.find(g => g.id === activeGroup).subTabs.map(sub => {
              const isSubActive = activeTab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveTab(sub.id)}
                  style={{
                    padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem',
                    border: isSubActive ? '1px solid var(--admin-primary)' : '1px solid #e2e8f0',
                    background: isSubActive ? '#eff6ff' : '#fff',
                    color: isSubActive ? 'var(--admin-primary)' : '#64748b',
                    fontWeight: isSubActive ? 700 : 500, cursor: 'pointer'
                  }}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--admin-gray-400)', fontSize: '0.9rem' }}>
          Loading analytics intelligence...
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 1: OVERVIEW & TRAFFIC
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div>
              {/* Top 10 Upgraded Metric Cards with Deltas & Tooltips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <MetricCard
                  icon={IconUsers}
                  label="Total Sessions"
                  value={overview?.totalSessions?.toLocaleString() || '0'}
                  delta={overview?.sessionsDelta}
                  tooltip="Total visits initiated. Session ends after 30 minutes of inactivity."
                  color="var(--admin-primary)"
                />
                <MetricCard
                  icon={IconEye}
                  label="Unique Visitors"
                  value={overview?.uniqueVisitors?.toLocaleString() || '0'}
                  delta={overview?.visitorsDelta}
                  tooltip="Distinct anonymous users identified via non-PII first-party identifiers."
                  color="#7c3aed"
                />
                <MetricCard
                  icon={IconChart}
                  label="Page Views"
                  value={overview?.totalPageViews?.toLocaleString() || '0'}
                  delta={overview?.pageViewsDelta}
                  tooltip="Total screens and routes rendered across all active sessions."
                  color="#059669"
                />
                <MetricCard
                  icon={IconTrendingUp}
                  label="Engagement Rate"
                  value={`${overview?.engagementRate || 0}%`}
                  sub={`Bounce Rate: ${overview?.bounceRate || 0}%`}
                  delta={overview?.engagementRateDelta}
                  tooltip="Engaged sessions: lasted 10+ seconds of active time, viewed 2+ pages, or triggered Buy Now / Search / Download."
                  color="#16a34a"
                />
                <MetricCard
                  icon={IconClock}
                  label="Avg Active Duration"
                  value={formatDuration(overview?.avgSessionDuration)}
                  delta={overview?.durationDelta}
                  tooltip="True active time spent interacting (mouse, scroll, typing). Pauses when tab is hidden or idle > 30s."
                  color="#0891b2"
                />
                <MetricCard
                  icon={IconActivity}
                  label="Real-Time Active"
                  value={overview?.realTimeActive || 0}
                  sub="Heartbeat in last 120s"
                  tooltip="Visitors currently navigating or actively viewing Oxybott right now. Refreshes every 30s."
                  color="#dc2626"
                />
                <MetricCard
                  icon={IconExternalLink}
                  label="Buy Now Clicks"
                  value={overview?.buyNowClicks?.toLocaleString() || '0'}
                  delta={overview?.buyNowClicksDelta}
                  tooltip="Clicks to purchase on external store (OSEMI). Intent-to-purchase signal."
                  color="#ea580c"
                />
                <MetricCard
                  icon={IconPackage}
                  label="Buy Now CTR"
                  value={`${overview?.buyNowCtr || 0}%`}
                  sub="Unique clickers / product visitors"
                  tooltip="Conversion percentage of unique product page readers clicking Buy Now."
                  color="#d97706"
                />
                <MetricCard
                  icon={IconPackage}
                  label="Top Product"
                  value={overview?.topProduct || '—'}
                  sub="Highest reader interest"
                  tooltip="Product page with the highest visitor volume in this time period."
                  color="#4338ca"
                />
                <MetricCard
                  icon={IconChevronRight}
                  label="Top Traffic Source"
                  value={overview?.topSource || 'Direct'}
                  sub="Leading marketing channel"
                  tooltip="Channel delivering the greatest volume of visitor sessions."
                  color="#0284c7"
                />
              </div>

              {/* Traffic Over Time Chart Section */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                      Traffic Over Time
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--admin-gray-500)' }}>
                      {isHourly ? '24 Hourly buckets across the selected day (IST)' : 'Daily breakdown across the selected period (IST)'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button
                      onClick={() => setChartMetric('sessions')}
                      style={{
                        padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                        border: chartMetric === 'sessions' ? '1px solid var(--admin-primary)' : '1px solid #cbd5e1',
                        background: chartMetric === 'sessions' ? 'var(--admin-primary)' : '#fff',
                        color: chartMetric === 'sessions' ? '#fff' : '#64748b', cursor: 'pointer'
                      }}
                    >
                      Sessions
                    </button>
                    <button
                      onClick={() => setChartMetric('pageViews')}
                      style={{
                        padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                        border: chartMetric === 'pageViews' ? '1px solid #059669' : '1px solid #cbd5e1',
                        background: chartMetric === 'pageViews' ? '#059669' : '#fff',
                        color: chartMetric === 'pageViews' ? '#fff' : '#64748b', cursor: 'pointer'
                      }}
                    >
                      Page Views
                    </button>
                  </div>
                </div>

                <InteractiveChart
                  data={chartData}
                  xKey="day"
                  yKey={chartYKey}
                  label={chartMetric === 'sessions' ? 'Sessions' : 'Page Views'}
                  color={chartMetric === 'sessions' ? '#2563eb' : '#059669'}
                  isHourly={isHourly}
                />
              </div>

              {/* 3-Column Distribution Grid: Sources, Devices, Top Geo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {/* Traffic Channels with Drill-Down */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                      Traffic Sources &amp; Channels
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Click to drill down</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {overview?.trafficSources?.length === 0 ? (
                      <div style={{ color: 'var(--admin-gray-400)', fontSize: '0.8rem', padding: '1rem 0', textAlign: 'center' }}>No sources recorded</div>
                    ) : overview?.trafficSources?.map((s, i) => {
                      const totalS = overview.totalSessions || 1;
                      const pct = Math.round((s.cnt / totalS) * 100);
                      return (
                        <div
                          key={i}
                          onClick={() => openSourceDrilldown(s.source)}
                          style={{
                            padding: '0.45rem 0.6rem', borderRadius: '6px', cursor: 'pointer',
                            background: '#f8fafc', border: '1px solid #f1f5f9', transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                          onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--admin-navy)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>{s.source}</span>
                              <span style={{ color: '#3b82f6', fontSize: '0.7rem' }}>&rarr;</span>
                            </span>
                            <span style={{ color: 'var(--admin-gray-600)', fontWeight: 600 }}>{s.cnt} ({pct}%)</span>
                          </div>
                          <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#3b82f6', borderRadius: '3px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Device Breakdown */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.15rem' }}>
                  <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                    Device Distribution
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {overview?.deviceDistribution?.length === 0 ? (
                      <div style={{ color: 'var(--admin-gray-400)', fontSize: '0.8rem', padding: '1rem 0', textAlign: 'center' }}>No devices recorded</div>
                    ) : overview?.deviceDistribution?.map((d, i) => {
                      const totalS = overview.totalSessions || 1;
                      const pct = Math.round((d.cnt / totalS) * 100);
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--admin-navy)' }}>{d.device}</span>
                            <span style={{ color: 'var(--admin-gray-600)', fontWeight: 600 }}>{d.cnt} ({pct}%)</span>
                          </div>
                          <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: d.device === 'Mobile' ? '#f59e0b' : d.device === 'Tablet' ? '#0891b2' : '#2563eb', borderRadius: '3px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bot Traffic Transparency Banner */}
                  <div style={{ marginTop: '1.25rem', padding: '0.65rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      <strong>Filtered Bot Hits:</strong> {overview?.filteredBotHits || 0}
                    </div>
                    <button
                      onClick={() => { setActiveGroup('audience'); setActiveTab('live-feed'); }}
                      style={{ border: 'none', background: 'transparent', color: 'var(--admin-primary)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      View Stream &rarr;
                    </button>
                  </div>
                </div>

                {/* Top Geographic Locations */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.15rem' }}>
                  <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                    Top Geographic Regions
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {overview?.topGeo?.length === 0 ? (
                      <div style={{ color: 'var(--admin-gray-400)', fontSize: '0.8rem', padding: '1rem 0', textAlign: 'center' }}>No location data yet</div>
                    ) : overview?.topGeo?.map((g, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', background: '#f8fafc', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-navy)' }}>
                          {g.city ? `${g.city}, ` : ''}{g.country}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0891b2' }}>
                          {g.cnt} visits
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2-Column Section: Top 5 Pages & Top 5 Searches */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {/* Top 5 Pages */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.15rem' }}>
                  <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                    Top Viewed Pages
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {overview?.topPages?.length === 0 ? (
                      <div style={{ color: 'var(--admin-gray-400)', fontSize: '0.8rem', padding: '1rem 0', textAlign: 'center' }}>No page views recorded</div>
                    ) : overview?.topPages?.slice(0, 5).map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', background: '#f8fafc', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-primary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                          {p.page_path}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                          {p.views} views
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 5 Searches */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.15rem' }}>
                  <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                    Top Internal Searches
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {overview?.topSearches?.length === 0 ? (
                      <div style={{ color: 'var(--admin-gray-400)', fontSize: '0.8rem', padding: '1rem 0', textAlign: 'center' }}>No search queries recorded</div>
                    ) : overview?.topSearches?.slice(0, 5).map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', background: '#f8fafc', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-navy)' }}>
                          &ldquo;{s.query_text}&rdquo;
                          {s.result_count === 0 && <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#dc2626', fontWeight: 700 }}>(0 results)</span>}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--admin-primary)' }}>
                          {s.search_count} searches
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sessions Activity Table */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                    Recent Visitor Sessions ({visitorTotal})
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-gray-500)' }}>
                    Active time measured &bull; IPs securely masked
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Visitor ID</th>
                        <th>Session Start (IST)</th>
                        <th>Device</th>
                        <th>Channel</th>
                        <th>Pages</th>
                        <th>Active Time</th>
                        <th>Engaged</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-gray-400)' }}>No visitor sessions found</td></tr>
                      ) : visitors.map((v, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--admin-gray-600)' }}>
                            {v.anonymous_id?.substring(0, 10)}…
                          </td>
                          <td style={{ fontSize: '0.78rem' }}>
                            {new Date(v.session_start).toLocaleDateString()}{' '}
                            <span style={{ color: '#94a3b8' }}>{new Date(v.session_start).toLocaleTimeString()}</span>
                          </td>
                          <td style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}>
                            {v.device_type} &bull; {v.browser}
                          </td>
                          <td>
                            <span style={{
                              padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600,
                              background: v.channel === 'Organic Search' ? '#dcfce7' : v.channel === 'Social' ? '#f3e8ff' : '#f1f5f9',
                              color: v.channel === 'Organic Search' ? '#15803d' : v.channel === 'Social' ? '#7e22ce' : '#475569'
                            }}>
                              {v.channel || 'Direct'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{v.page_count}</td>
                          <td style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0891b2' }}>
                            {formatDuration(v.active_seconds || v.duration_seconds)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {v.is_engaged ? (
                              <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.75rem' }}>✓ Yes</span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {visitorTotal > 20 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      disabled={visitorPage <= 1}
                      onClick={() => loadVisitors(visitorPage - 1)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    >
                      &larr; Prev
                    </button>
                    <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: '#64748b' }}>
                      Page {visitorPage} of {Math.ceil(visitorTotal / 20)}
                    </span>
                    <button
                      disabled={visitorPage >= Math.ceil(visitorTotal / 20)}
                      onClick={() => loadVisitors(visitorPage + 1)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 2: CONTENT (TOP PAGES, TUTORIALS, VIDEOS)
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'top-pages' && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                    Top Pages &amp; Engagement Breakdown
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--admin-gray-500)' }}>
                    Views, unique visitors, active read time, and landing/exit frequency
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {['all', 'products', 'tutorials', 'software', 'education'].map(type => (
                    <button
                      key={type}
                      onClick={() => setPageTypeFilter(type)}
                      style={{
                        padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                        border: pageTypeFilter === type ? '1px solid var(--admin-primary)' : '1px solid var(--admin-gray-200)',
                        background: pageTypeFilter === type ? '#eff6ff' : '#fff',
                        color: pageTypeFilter === type ? 'var(--admin-primary)' : 'var(--admin-gray-600)',
                        cursor: 'pointer', textTransform: 'capitalize'
                      }}
                    >
                      {type}
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
                      <th>Views</th>
                      <th>Unique Visitors</th>
                      <th>Avg Active Time</th>
                      <th>Landing Sessions</th>
                      <th>Exit Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-gray-400)' }}>No page visits recorded for this filter</td></tr>
                    ) : topPages.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--admin-primary)' }}>
                          {p.page_path}
                        </td>
                        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                          {p.page_title || '—'}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.views}</td>
                        <td style={{ textAlign: 'center' }}>{p.unique_visitors}</td>
                        <td style={{ textAlign: 'center', fontSize: '0.8rem', color: '#0891b2' }}>{formatDuration(p.avg_seconds)}</td>
                        <td style={{ textAlign: 'center', color: '#16a34a' }}>{p.landing_count}</td>
                        <td style={{ textAlign: 'center', color: '#dc2626' }}>{p.exit_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tutorials' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                  Tutorials &amp; Assembly Guide Engagement
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tutorial Title</th>
                        <th>Views</th>
                        <th>Unique Readers</th>
                        <th>Avg Active Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tutorialsData.tutorials.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-gray-400)' }}>No tutorial views recorded</td></tr>
                      ) : tutorialsData.tutorials.map((t, i) => (
                        <tr key={i}>
                          <td><strong>{t.title || t.page_path}</strong></td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{t.views}</td>
                          <td style={{ textAlign: 'center' }}>{t.unique_readers}</td>
                          <td style={{ fontSize: '0.8rem', color: '#0891b2' }}>{formatDuration(t.avg_seconds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PDF Downloads */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                  PDF Guide Downloads
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {tutorialsData.downloads.length === 0 ? (
                    <div style={{ color: 'var(--admin-gray-400)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>No downloads recorded</div>
                  ) : tutorialsData.downloads.map((d, i) => (
                    <div key={i} style={{ padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
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

          {activeTab === 'videos' && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                Video Plays &amp; Completion Funnel
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
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-gray-400)' }}>No video plays tracked</td></tr>
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
                            padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem',
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

          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 3: PRODUCTS (INTEREST & BUY NOW CLICKS)
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'products' && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                    Product Interest &amp; External Buy Now CTR
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--admin-gray-500)' }}>
                    Click-Through Rate = (Unique Buy Clickers / Unique Product Visitors) &times; 100
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Search product..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="form-input"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', width: '160px' }}
                  />
                  <select
                    value={productSort}
                    onChange={e => setProductSort(e.target.value)}
                    className="form-input"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                  >
                    <option value="views">Sort by Views</option>
                    <option value="clicks">Sort by Buy Clicks</option>
                    <option value="ctr">Sort by CTR %</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Views</th>
                      <th>Unique Visitors</th>
                      <th>Buy Now Clicks</th>
                      <th>Unique Clickers</th>
                      <th>Buy Now CTR</th>
                      <th>Datasheets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsData
                      .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
                      .sort((a, b) => {
                        if (productSort === 'clicks') return b.buy_now_clicks - a.buy_now_clicks;
                        if (productSort === 'ctr') return b.ctr - a.ctr;
                        return b.views - a.views;
                      })
                      .map((p, i) => (
                        <tr key={i}>
                          <td>
                            <strong>{p.name}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--admin-gray-400)' }}>SKU: {p.sku}</div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.views}</td>
                          <td style={{ textAlign: 'center' }}>{p.unique_visitors}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--admin-primary)' }}>{p.buy_now_clicks}</td>
                          <td style={{ textAlign: 'center' }}>{p.unique_buy_clickers}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem',
                              background: p.ctr > 20 ? '#dcfce7' : p.ctr > 5 ? '#fef3c7' : '#f1f5f9',
                              color: p.ctr > 20 ? '#15803d' : p.ctr > 5 ? '#b45309' : '#64748b'
                            }}>
                              {p.ctr}%
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', color: '#0891b2' }}>{p.datasheet_downloads}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'external-clicks' && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                External Purchase Clicks Log (Outbound to OSEMI)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time (IST)</th>
                      <th>Product</th>
                      <th>Source Page</th>
                      <th>Traffic Channel</th>
                      <th>Referrer</th>
                      <th>Device</th>
                      <th>Visitor ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {externalClicks.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-gray-400)' }}>No purchase clicks recorded in this period</td></tr>
                    ) : externalClicks.map((c, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {new Date(c.created_at).toLocaleDateString()}<br />
                          <span style={{ color: '#94a3b8' }}>{new Date(c.created_at).toLocaleTimeString()}</span>
                        </td>
                        <td><strong>{c.product_name || c.product_id}</strong></td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--admin-primary)', fontFamily: 'monospace' }}>{c.source_page || '/products'}</td>
                        <td>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', background: '#f1f5f9', fontWeight: 600 }}>
                            {c.channel || 'Direct'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem' }}>{c.referrer || 'Direct'}</td>
                        <td style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}>{c.device_type}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#94a3b8' }}>{c.anonymous_id?.substring(0, 10)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 4: AUDIENCE (JOURNEYS, SEARCHES, LIVE FEED)
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'journeys' && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                Visitor Journey Sequences
              </h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--admin-gray-500)' }}>
                Step-by-step navigation trails per session
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {journeys.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-gray-400)' }}>No journeys recorded</div>
                ) : journeys.map((j, i) => (
                  <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--admin-gray-600)' }}>
                        <strong>Session:</strong> <span style={{ fontFamily: 'monospace' }}>{j.anonymous_id?.substring(0, 10)}…</span> &bull; {j.device_type} &bull; {new Date(j.session_start).toLocaleTimeString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-gray-500)' }}>
                        Steps: {j.steps.length} &bull; Active time: {formatDuration(j.active_seconds || j.duration_seconds)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {j.steps.map((st, sIdx) => {
                        const isBuy = st.type === 'buy_now_click';
                        return (
                          <React.Fragment key={sIdx}>
                            <span style={{
                              padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600,
                              background: isBuy ? '#ea580c' : '#fff', color: isBuy ? '#fff' : 'var(--admin-navy)',
                              border: isBuy ? 'none' : '1px solid #cbd5e1'
                            }}>
                              {isBuy ? '🛒 Buy Click' : (st.path || '/')}
                            </span>
                            {sIdx < j.steps.length - 1 && <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>&rarr;</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'searches' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                  Top Search Keywords
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Query</th>
                        <th>Searches</th>
                        <th>Avg Results</th>
                        <th>Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchData.topSearches.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-gray-400)' }}>No search activity tracked</td></tr>
                      ) : searchData.topSearches.map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>&ldquo;{s.query_text}&rdquo;</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{s.search_count}</td>
                          <td style={{ textAlign: 'center' }}>{s.avg_results}</td>
                          <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{s.clicks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: '#dc2626' }}>
                  Failed Searches (0 Results)
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: 'var(--admin-gray-500)' }}>
                  Visitors searched for these terms but nothing matched. Great catalog insights!
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Keyword</th>
                        <th>Attempts</th>
                        <th>Last Searched</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchData.failedSearches.length === 0 ? (
                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#16a34a' }}>No zero-result searches found!</td></tr>
                      ) : searchData.failedSearches.map((f, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: '#dc2626' }}>&ldquo;{f.query_text}&rdquo;</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{f.attempt_count}</td>
                          <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{new Date(f.last_attempted).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'live-feed' && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  Live Activity Stream (Auto-refreshes every 15s)
                </h3>
                <button onClick={loadLiveFeed} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
                  <IconRefreshCw size={12} /> Refresh
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Event</th>
                      <th>Target</th>
                      <th>Path</th>
                      <th>Device</th>
                      <th>Visitor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveFeed.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-gray-400)' }}>No recent activity</td></tr>
                    ) : liveFeed.map((ev, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(ev.created_at).toLocaleTimeString()}
                        </td>
                        <td>
                          <span style={{
                            padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                            background: ev.event_type === 'buy_now_click' ? '#fed7aa' : '#e0e7ff',
                            color: ev.event_type === 'buy_now_click' ? '#c2410c' : '#3730a3'
                          }}>
                            {ev.event_type?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>{ev.entity_title || ev.entity_id || '—'}</td>
                        <td style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--admin-primary)' }}>{ev.page_path || '—'}</td>
                        <td style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}>{ev.device_type}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#94a3b8' }}>{ev.anonymous_id?.substring(0, 10)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 5: SETTINGS & PRIVACY (EXCLUDED IPS & BROWSER OPT-OUT)
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {/* Browser Opt-Out Toggle */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                  Internal Testing &amp; Browser Opt-Out
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--admin-gray-500)', lineHeight: 1.5 }}>
                  Prevent your testing and storefront browsing from polluting customer analytics.
                </p>

                <div style={{ padding: '1rem', borderRadius: '8px', background: isOptedOutState ? '#fef3c7' : '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--admin-navy)' }}>
                      Don't track this browser
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Status: {isOptedOutState ? <strong style={{ color: '#b45309' }}>Opted Out (Tracking Disabled)</strong> : <strong style={{ color: '#16a34a' }}>Active Tracking</strong>}
                    </div>
                  </div>

                  <button
                    onClick={handleToggleOptOut}
                    style={{
                      padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      border: isOptedOutState ? '1px solid #d97706' : '1px solid var(--admin-primary)',
                      background: isOptedOutState ? '#f59e0b' : 'var(--admin-primary)', color: '#fff'
                    }}
                  >
                    {isOptedOutState ? 'Re-enable Tracking' : 'Disable for This Browser'}
                  </button>
                </div>
              </div>

              {/* Excluded IP Patterns */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-navy)' }}>
                  Excluded IP Patterns
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--admin-gray-500)' }}>
                  Filter office, VPN, or developer IPs (e.g. <code>192.168.*</code> or <code>103.45.67.*</code>)
                </p>

                <form onSubmit={handleAddExcludedIp} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.*"
                    value={newIpPattern}
                    onChange={e => setNewIpPattern(e.target.value)}
                    className="form-input"
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', flex: 1 }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Note (e.g. Office VPN)"
                    value={newIpNote}
                    onChange={e => setNewIpNote(e.target.value)}
                    className="form-input"
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', width: '130px' }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}>
                    Add
                  </button>
                </form>

                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>IP Pattern</th>
                        <th>Note</th>
                        <th style={{ width: '40px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excludedIps.length === 0 ? (
                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--admin-gray-400)' }}>No excluded IP patterns configured</td></tr>
                      ) : excludedIps.map((p, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem' }}>{p.ip_pattern}</td>
                          <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{p.note || '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteExcludedIp(p.id)}
                              style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', padding: '2px' }}
                              title="Delete pattern"
                            >
                              <IconTrash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Traffic Source Drill-Down Modal ───────────────────────────────── */}
      {sourceDrilldown && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '780px',
            maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--admin-navy)' }}>
                  Source Drill-Down: {sourceDrilldown}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--admin-gray-500)' }}>
                  Detailed referring URLs, UTM campaign parameters, and landing pages
                </p>
              </div>
              <button
                onClick={() => setSourceDrilldown(null)}
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}
              >
                &times;
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Referrer Host</th>
                    <th>UTM Source / Medium / Campaign</th>
                    <th>Landing Page</th>
                    <th>Sessions</th>
                    <th>Visitors</th>
                  </tr>
                </thead>
                <tbody>
                  {drilldownData.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-gray-400)' }}>No detailed logs for this channel</td></tr>
                  ) : drilldownData.map((d, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '0.78rem', fontWeight: 600 }}>{d.referrer}</td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {d.utm_source !== 'none' ? `${d.utm_source} / ${d.utm_medium} (${d.utm_campaign})` : '—'}
                      </td>
                      <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--admin-primary)' }}>{d.landing_page}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{d.sessions}</td>
                      <td style={{ textAlign: 'center' }}>{d.visitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
