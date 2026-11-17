import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CMSAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';

export default function ProductsPage() {
  const { products, refreshStore } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cmsPage, setCmsPage] = useState(null);

  const loadCms = useCallback(async () => {
    try {
      const res = await CMSAPI.getPage('products');
      if (res.success && res.page) {
        setCmsPage(res.page);
      }
    } catch (e) {
      // Graceful fallback to default banner
    }
  }, []);

  // Re-fetch latest backend products and CMS when mounting catalog
  useEffect(() => {
    refreshStore();
    loadCms();

    const handleSync = () => {
      refreshStore();
      loadCms();
    };
    const handleStorage = (e) => {
      if (e.key === 'oxybott_cms_sync' || e.key === 'oxybott_settings_sync') {
        refreshStore();
        loadCms();
      }
    };

    window.addEventListener('oxybott_cms_updated', handleSync);
    window.addEventListener('oxybott_settings_updated', handleSync);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('oxybott_cms_updated', handleSync);
      window.removeEventListener('oxybott_settings_updated', handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshStore, loadCms]);

  // Filters state
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedAges, setSelectedAges] = useState([]);
  const [sortOption, setSortOption] = useState('featured');

  // Sync with URL query params
  useEffect(() => {
    const s = searchParams.get('series');
    if (s) setSelectedSeries([s]);
    const c = searchParams.get('category');
    if (c) setSelectedCategories([c]);
  }, [searchParams]);

  const toggleFilter = (setter, val) => {
    setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const handleReset = () => {
    setSelectedSeries([]);
    setSelectedCategories([]);
    setSelectedAges([]);
    setSortOption('featured');
    setSearchParams({});
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      if (selectedSeries.length > 0 && !selectedSeries.includes(p.series)) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
      if (selectedAges.length > 0 && !selectedAges.some(age => p.age && p.age.includes(age))) return false;
      return true;
    });

    if (sortOption === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return result;
  }, [products, selectedSeries, selectedCategories, selectedAges, sortOption]);

  return (
    <>
      {/* Page Banner */}
      <section style={{ background: 'linear-gradient(135deg, #071526 0%, #0c2340 100%)', color: 'var(--oxy-white)', padding: '4rem 0', textAlign: 'center' }}>
        <div className="container">
          <span className="section-tag" style={{ background: 'rgba(0, 153, 255, 0.2)', color: '#7dd3fc' }}>
            {cmsPage?.sections?.hero?.tag || 'Complete Catalog'}
          </span>
          <h1 style={{ color: 'var(--oxy-white)', marginBottom: '0.75rem' }}>
            {cmsPage?.sections?.hero?.title || 'Oxybott STEM Robotics & Coding Kits'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto' }}>
            {cmsPage?.sections?.hero?.subtitle || 'From starter electronics to 4-axis robotic arms and full smart classroom simulators. Find the perfect educational kit for your students or personal lab.'}
          </p>
          {cmsPage?.sections?.hero?.description && (
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: '650px', margin: '0.5rem auto 0' }}>
              {cmsPage.sections.hero.description}
            </p>
          )}
        </div>
      </section>

      {/* Main Catalog Content */}
      <main className="container catalog-layout">
        {/* Sidebar Filters */}
        <aside className="catalog-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--oxy-navy)', margin: 0 }}>Filters</h3>
            <button
              type="button"
              id="resetFiltersBtn"
              style={{ fontSize: '0.8rem', color: 'var(--oxy-primary)', fontWeight: 600, cursor: 'pointer', background: 'transparent', border: 'none' }}
              onClick={handleReset}
            >
              Reset All
            </button>
          </div>

          {/* Series Filter */}
          <div className="sidebar-section">
            <h4 className="sidebar-title">Series</h4>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                name="seriesFilter"
                value="Explorer Series"
                checked={selectedSeries.includes('Explorer Series')}
                onChange={() => toggleFilter(setSelectedSeries, 'Explorer Series')}
              />{' '}
              Explorer Series (8+)
            </label>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                name="seriesFilter"
                value="Education Series"
                checked={selectedSeries.includes('Education Series')}
                onChange={() => toggleFilter(setSelectedSeries, 'Education Series')}
              />{' '}
              Education Series (Classrooms)
            </label>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                name="seriesFilter"
                value="Inventor Series"
                checked={selectedSeries.includes('Inventor Series')}
                onChange={() => toggleFilter(setSelectedSeries, 'Inventor Series')}
              />{' '}
              Inventor Series (12+)
            </label>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                name="seriesFilter"
                value="Maker Series"
                checked={selectedSeries.includes('Maker Series')}
                onChange={() => toggleFilter(setSelectedSeries, 'Maker Series')}
              />{' '}
              Maker Series (Labs)
            </label>
          </div>

          {/* Category Filter */}
          <div className="sidebar-section">
            <h4 className="sidebar-title">Category</h4>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                name="categoryFilter"
                value="Robotics"
                checked={selectedCategories.includes('Robotics')}
                onChange={() => toggleFilter(setSelectedCategories, 'Robotics')}
              />{' '}
              Robotics
            </label>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                name="categoryFilter"
                value="Smart IoT"
                checked={selectedCategories.includes('Smart IoT')}
                onChange={() => toggleFilter(setSelectedCategories, 'Smart IoT')}
              />{' '}
              Smart IoT
            </label>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                name="categoryFilter"
                value="Classroom Sets"
                checked={selectedCategories.includes('Classroom Sets')}
                onChange={() => toggleFilter(setSelectedCategories, 'Classroom Sets')}
              />{' '}
              Classroom Sets
            </label>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                name="categoryFilter"
                value="Electronics"
                checked={selectedCategories.includes('Electronics')}
                onChange={() => toggleFilter(setSelectedCategories, 'Electronics')}
              />{' '}
              Maker Electronics
            </label>
          </div>

          {/* Age Filter */}
          <div className="sidebar-section">
            <h4 className="sidebar-title">Target Age</h4>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                name="ageFilter"
                value="8+"
                checked={selectedAges.includes('8+')}
                onChange={() => toggleFilter(setSelectedAges, '8+')}
              />{' '}
              Ages 8+ (Elementary)
            </label>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                name="ageFilter"
                value="10+"
                checked={selectedAges.includes('10+')}
                onChange={() => toggleFilter(setSelectedAges, '10+')}
              />{' '}
              Ages 10+ (Middle School)
            </label>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                name="ageFilter"
                value="12+"
                checked={selectedAges.includes('12+')}
                onChange={() => toggleFilter(setSelectedAges, '12+')}
              />{' '}
              Ages 12+ (High School)
            </label>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                name="ageFilter"
                value="14+"
                checked={selectedAges.includes('14+')}
                onChange={() => toggleFilter(setSelectedAges, '14+')}
              />{' '}
              Ages 14+ (Makers &amp; Industry)
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <section>
          {/* Toolbar */}
          <div className="catalog-toolbar">
            <div className="catalog-results-count" id="catalogResultsCount">
              Showing {filteredProducts.length} kits
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label htmlFor="catalogSortSelect" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--oxy-gray-600)' }}>
                Sort By:
              </label>
              <select
                className="catalog-sort-select"
                id="catalogSortSelect"
                aria-label="Sort products by"
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Dynamic Grid */}
          <div className="product-grid" id="catalogGrid">
            {filteredProducts.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
