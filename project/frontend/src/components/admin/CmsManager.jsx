import React, { useState, useEffect } from 'react';
import { CMSAPI, StoreAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { IconFileText, IconMenu, IconInfo, IconEdit, IconX, IconImage, IconSettings } from '../common/Icons';

export default function CmsManager() {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState('sections'); // 'sections', 'navigation', 'faqs'
  const [loading, setLoading] = useState(true);
  const [productsList, setProductsList] = useState([]);

  // Pages & Sections state
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({
    tag: '',
    title: '',
    subtitle: '',
    description: '',
    is_visible: true,
    content_json: '',
    primary_btn_text: '',
    primary_btn_url: '',
    secondary_btn_text: '',
    secondary_btn_url: '',
    tertiary_btn_text: '',
    hero_image: '',
    product_id: '',
    image_url: '',
    card_title: '',
    card_desc: ''
  });

  // Navigation state
  const [menus, setMenus] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [editingNavItem, setEditingNavItem] = useState(null);
  const [navForm, setNavForm] = useState({
    label: '',
    url: '',
    badge: '',
    target: '_self',
    sort_order: 0,
    is_visible: true
  });
  const [showAddNav, setShowAddNav] = useState(false);

  // FAQ state
  const [faqs, setFaqs] = useState([]);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({
    category: 'General',
    question: '',
    answer: '',
    sort_order: 0,
    is_published: true
  });
  const [showAddFaq, setShowAddFaq] = useState(false);

  // Load all CMS data
  const loadCmsData = async () => {
    setLoading(true);
    try {
      const [pagesRes, navRes, faqRes, prodsRes] = await Promise.allSettled([
        CMSAPI.adminGetPages(),
        CMSAPI.adminGetNavigation(),
        CMSAPI.adminGetFaqs(),
        StoreAPI.getProducts()
      ]);

      if (pagesRes.status === 'fulfilled' && pagesRes.value?.pages) {
        setPages(pagesRes.value.pages);
        if (!selectedPageId && pagesRes.value.pages.length > 0) {
          setSelectedPageId(pagesRes.value.pages[0].id);
        }
      }

      if (navRes.status === 'fulfilled' && navRes.value?.menus) {
        setMenus(navRes.value.menus);
        if (!selectedMenuId && navRes.value.menus.length > 0) {
          setSelectedMenuId(navRes.value.menus[0].id);
        }
      }

      if (faqRes.status === 'fulfilled' && faqRes.value?.faqs) {
        setFaqs(faqRes.value.faqs);
      }

      if (prodsRes.status === 'fulfilled' && prodsRes.value?.products) {
        setProductsList(prodsRes.value.products);
      }
    } catch (e) {
      console.error('Error loading CMS data:', e);
      showToast('Error loading CMS content.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCmsData();
  }, []);

  const triggerLiveSync = () => {
    window.dispatchEvent(new Event('oxybott_cms_updated'));
    window.dispatchEvent(new Event('oxybott_settings_updated'));
    localStorage.setItem('oxybott_cms_sync', Date.now().toString());
  };

  // --- Page Sections Handlers ---
  const handleSelectSectionToEdit = (sec) => {
    setEditingSection(sec);
    const content = sec.content || {};
    setSectionForm({
      tag: sec.tag || '',
      title: sec.title || '',
      subtitle: sec.subtitle || '',
      description: sec.description || '',
      is_visible: Boolean(sec.is_visible),
      content_json: JSON.stringify(content, null, 2),
      primary_btn_text: content.primaryBtn?.text || '',
      primary_btn_url: content.primaryBtn?.url || '',
      secondary_btn_text: content.secondaryBtn?.text || '',
      secondary_btn_url: content.secondaryBtn?.url || '',
      tertiary_btn_text: content.tertiaryBtn?.text || content.quoteBtn?.text || '',
      hero_image: content.hero_image || '',
      product_id: content.product_id || '',
      image_url: content.image_url || content.hero_image || '',
      card_title: content.card_title || '',
      card_desc: content.card_desc || ''
    });
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!editingSection) return;

    let parsedContent = {};
    try {
      parsedContent = JSON.parse(sectionForm.content_json || '{}');
    } catch (err) {
      showToast('Invalid JSON in custom content data: ' + err.message, true);
      return;
    }

    // Merge dedicated button fields into content object
    if (sectionForm.primary_btn_text?.trim() || sectionForm.primary_btn_url?.trim()) {
      parsedContent.primaryBtn = {
        ...(parsedContent.primaryBtn || {}),
        text: sectionForm.primary_btn_text.trim(),
        url: sectionForm.primary_btn_url?.trim() || parsedContent.primaryBtn?.url || ''
      };
    }
    if (sectionForm.secondary_btn_text?.trim() || sectionForm.secondary_btn_url?.trim()) {
      parsedContent.secondaryBtn = {
        ...(parsedContent.secondaryBtn || {}),
        text: sectionForm.secondary_btn_text.trim(),
        url: sectionForm.secondary_btn_url?.trim() || parsedContent.secondaryBtn?.url || ''
      };
    }
    if (sectionForm.tertiary_btn_text?.trim()) {
      parsedContent.tertiaryBtn = {
        ...(parsedContent.tertiaryBtn || {}),
        text: sectionForm.tertiary_btn_text.trim()
      };
    }

    // Section showcase image and card details
    if (sectionForm.image_url !== undefined) {
      parsedContent.image_url = sectionForm.image_url.trim();
      if (editingSection.section_key === 'hero') {
        parsedContent.hero_image = sectionForm.image_url.trim();
      }
    }
    if (sectionForm.card_title !== undefined) {
      parsedContent.card_title = sectionForm.card_title.trim();
    }
    if (sectionForm.card_desc !== undefined) {
      parsedContent.card_desc = sectionForm.card_desc.trim();
    }

    // Hero section featured product & image
    if (editingSection.section_key === 'hero') {
      if (sectionForm.hero_image !== undefined) {
        parsedContent.hero_image = sectionForm.hero_image.trim();
      }
      if (sectionForm.product_id !== undefined) {
        parsedContent.product_id = sectionForm.product_id.trim();
      }
    }

    try {
      await CMSAPI.adminUpdateSection(editingSection.id, {
        tag: sectionForm.tag,
        title: sectionForm.title,
        subtitle: sectionForm.subtitle,
        description: sectionForm.description,
        is_visible: sectionForm.is_visible,
        content_data: parsedContent
      });

      showToast(`Section "${sectionForm.title || editingSection.section_key}" updated successfully!`);
      setEditingSection(null);
      await loadCmsData();
      triggerLiveSync();
    } catch (err) {
      showToast(err.message || 'Error updating section.', true);
    }
  };

  // --- Navigation Handlers ---
  const handleSaveNavItem = async (e) => {
    e.preventDefault();
    if (!navForm.label || !navForm.url) {
      showToast('Label and URL are required.', true);
      return;
    }

    try {
      if (editingNavItem) {
        await CMSAPI.adminUpdateNavItem(editingNavItem.id, navForm);
        showToast('Navigation link updated.');
      } else {
        await CMSAPI.adminCreateNavItem({
          ...navForm,
          menu_id: selectedMenuId
        });
        showToast('Navigation link added.');
      }

      setEditingNavItem(null);
      setShowAddNav(false);
      setNavForm({ label: '', url: '', badge: '', target: '_self', sort_order: 0, is_visible: true });
      await loadCmsData();
      triggerLiveSync();
    } catch (err) {
      showToast(err.message || 'Error saving navigation link.', true);
    }
  };

  const handleDeleteNavItem = async (id) => {
    if (!window.confirm('Are you sure you want to remove this navigation link?')) return;
    try {
      await CMSAPI.adminDeleteNavItem(id);
      showToast('Navigation link removed.');
      await loadCmsData();
      triggerLiveSync();
    } catch (err) {
      showToast(err.message || 'Error deleting link.', true);
    }
  };

  // --- FAQ Handlers ---
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    if (!faqForm.question || !faqForm.answer) {
      showToast('Question and Answer are required.', true);
      return;
    }

    try {
      if (editingFaq) {
        await CMSAPI.adminUpdateFaq(editingFaq.id, faqForm);
        showToast('FAQ updated successfully.');
      } else {
        await CMSAPI.adminCreateFaq(faqForm);
        showToast('FAQ created successfully.');
      }

      setEditingFaq(null);
      setShowAddFaq(false);
      setFaqForm({ category: 'General', question: '', answer: '', sort_order: 0, is_published: true });
      await loadCmsData();
      triggerLiveSync();
    } catch (err) {
      showToast(err.message || 'Error saving FAQ.', true);
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await CMSAPI.adminDeleteFaq(id);
      showToast('FAQ deleted.');
      await loadCmsData();
      triggerLiveSync();
    } catch (err) {
      showToast(err.message || 'Error deleting FAQ.', true);
    }
  };

  const selectedPage = pages.find(p => p.id === selectedPageId);
  const selectedMenu = menus.find(m => m.id === selectedMenuId);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-gray-500)' }}>Loading CMS Content...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Subtabs Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--admin-gray-200)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => { setSubTab('sections'); setEditingSection(null); }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: subTab === 'sections' ? 'var(--admin-primary)' : '#f1f5f9',
            color: subTab === 'sections' ? '#fff' : 'var(--admin-gray-700)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <IconFileText size={16} />
          <span>Pages &amp; Sections Content</span>
        </button>
        <button
          type="button"
          onClick={() => { setSubTab('navigation'); setEditingNavItem(null); }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: subTab === 'navigation' ? 'var(--admin-primary)' : '#f1f5f9',
            color: subTab === 'navigation' ? '#fff' : 'var(--admin-gray-700)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <IconMenu size={16} />
          <span>Header &amp; Footer Menus</span>
        </button>
        <button
          type="button"
          onClick={() => { setSubTab('faqs'); setEditingFaq(null); }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: subTab === 'faqs' ? 'var(--admin-primary)' : '#f1f5f9',
            color: subTab === 'faqs' ? '#fff' : 'var(--admin-gray-700)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <IconInfo size={16} />
          <span>Frequently Asked Questions</span>
        </button>
      </div>

      {/* --- TAB 1: PAGES & SECTIONS --- */}
      {subTab === 'sections' && (
        <div style={{ display: 'grid', gridTemplateColumns: editingSection ? '1fr 1.2fr' : '1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Select Page:</label>
                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
                  value={selectedPageId}
                  onChange={(e) => { setSelectedPageId(e.target.value); setEditingSection(null); }}
                >
                  {pages.map(p => (
                    <option key={p.id} value={p.id}>{p.title} (/{p.slug})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-responsive" style={{ background: '#fff', borderRadius: '8px', border: '1px solid var(--admin-gray-200)', overflow: 'hidden' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Section Key</th>
                    <th>Heading / Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPage?.sections?.map(sec => (
                    <tr key={sec.id} style={{ background: editingSection?.id === sec.id ? '#eff6ff' : 'transparent' }}>
                      <td>
                        <strong style={{ color: 'var(--admin-navy)', fontFamily: 'monospace' }}>{sec.section_key}</strong>
                        {sec.tag && <div style={{ fontSize: '0.75rem', color: 'var(--admin-gray-500)' }}>{sec.tag}</div>}
                      </td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sec.title || <em style={{ color: '#94a3b8' }}>(No title)</em>}
                      </td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{sec.section_type}</span>
                      </td>
                      <td>
                        {sec.is_visible ? (
                          <span className="badge badge-green">Visible</span>
                        ) : (
                          <span className="badge badge-orange">Hidden</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSelectSectionToEdit(sec)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <IconEdit size={14} />
                          <span>Edit Content</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Edit Form */}
          {editingSection && (
            <div className="data-card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '8px', border: '1px solid var(--admin-gray-300)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--admin-gray-200)', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, color: 'var(--admin-navy)' }}>
                  Editing: <span style={{ fontFamily: 'monospace', color: 'var(--admin-primary)' }}>{editingSection.section_key}</span>
                </h3>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
                  onClick={() => setEditingSection(null)}
                  aria-label="Close form"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveSection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Section Tag / Category Badge</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. NEXT-GEN ROBOTICS & STEM"
                    value={sectionForm.tag}
                    onChange={e => setSectionForm({ ...sectionForm, tag: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Main Heading / Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Section title"
                    value={sectionForm.title}
                    onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subtitle / Lead Text</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Section subtitle..."
                    value={sectionForm.subtitle}
                    onChange={e => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Extra Paragraph</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Additional context or notes..."
                    value={sectionForm.description}
                    onChange={e => setSectionForm({ ...sectionForm, description: e.target.value })}
                  />
                </div>

                {/* Hero Showcase Image & Product Settings (When editing hero section) */}
                {editingSection.section_key === 'hero' && (
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--admin-navy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconImage size={16} style={{ color: 'var(--admin-primary)' }} />
                      <span>Hero Showcase Photo &amp; Featured Kit</span>
                      <small style={{ color: 'var(--admin-gray-500)', fontWeight: 'normal' }}>(Right-side product card on homepage)</small>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Custom Hero Photo / Image URL</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. /assets/images/my-robot.png or /uploads/products/image.webp"
                        value={sectionForm.hero_image || ''}
                        onChange={e => setSectionForm({ ...sectionForm, hero_image: e.target.value })}
                      />
                      <small style={{ color: 'var(--admin-gray-500)', fontSize: '0.72rem', display: 'block', marginTop: '2px' }}>
                        Enter a photo URL here to override the hero card image, or leave blank to automatically use the selected product&apos;s photo from the Catalog.
                      </small>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Featured Product Kit</label>
                      <select
                        className="form-input"
                        value={sectionForm.product_id || 'qd022'}
                        onChange={e => {
                          const selectedId = e.target.value;
                          setSectionForm(prev => ({
                            ...prev,
                            product_id: selectedId,
                            // If they change product and haven't set a custom image, clear custom image so new product's image is used
                            hero_image: ''
                          }));
                        }}
                      >
                        {productsList.length > 0 ? (
                          productsList.map(prod => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} ({prod.id.toUpperCase()}) - ₹{Number(prod.price).toLocaleString('en-IN')}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="qd022">Oxybott QD022 4-DOF Programmable Robot Arm Kit</option>
                            <option value="qd001">Oxybott QD001 Mecanum Wheel Robot Car Kit</option>
                            <option value="qe011">Oxybott QE011 STEM Weather Station Kit</option>
                            <option value="qe001">Oxybott QE001 Smart Home IoT Kit</option>
                            <option value="qd020">Oxybott QD020 Quadruped Spider Robot Kit</option>
                            <option value="qd021">Oxybott QD021 Biped Walking Robot Kit</option>
                            <option value="qe023">Oxybott QE023 Smart Home Classroom Kit</option>
                            <option value="qe200">Oxybott QE200 ESP32 Starter Kit</option>
                          </>
                        )}
                      </select>
                      <small style={{ color: 'var(--admin-gray-500)', fontSize: '0.72rem', display: 'block', marginTop: '4px' }}>
                        Choose any robot kit from the list. Its photo, title, specs, price, and Buy on OSEMI link will instantly appear on the Hero section!
                      </small>
                    </div>
                  </div>
                )}

                {/* Education Solutions Showcase Image & Card (When editing edu_solutions section) */}
                {editingSection.section_key === 'edu_solutions' && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--admin-navy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconImage size={16} style={{ color: '#16a34a' }} />
                      <span>Classroom Showcase Photo &amp; Card Details</span>
                      <small style={{ color: 'var(--admin-gray-500)', fontWeight: 'normal' }}>(Right-side photo card)</small>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Showcase Photo / Image URL</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. /assets/images/qe023-smart-home-edu.png or /uploads/products/..."
                        value={sectionForm.image_url || ''}
                        onChange={e => setSectionForm({ ...sectionForm, image_url: e.target.value })}
                      />
                      <small style={{ color: 'var(--admin-gray-500)', fontSize: '0.72rem', display: 'block', marginTop: '2px' }}>
                        Paste any image URL or uploaded file path to instantly replace the right-side classroom photo.
                      </small>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Card Heading</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Modular Magnetic Teaching System"
                          value={sectionForm.card_title || ''}
                          onChange={e => setSectionForm({ ...sectionForm, card_title: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Card Caption / Subtitle</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Clean tabletop display boxes..."
                          value={sectionForm.card_desc || ''}
                          onChange={e => setSectionForm({ ...sectionForm, card_desc: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* About Story Showcase Image */}
                {editingSection.section_key === 'story' && (
                  <div style={{ background: '#f8fafc', border: '1px solid var(--admin-gray-300)', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Story Section Image URL</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. /assets/images/hardware-ecosystem.webp or /uploads/..."
                        value={sectionForm.image_url || ''}
                        onChange={e => setSectionForm({ ...sectionForm, image_url: e.target.value })}
                      />
                      <small style={{ color: 'var(--admin-gray-500)', fontSize: '0.72rem', display: 'block', marginTop: '2px' }}>
                        Overrides the side photo shown alongside the founder/mission story on About Us page.
                      </small>
                    </div>
                  </div>
                )}

                {/* Direct Button Name & URL Controls */}
                <div style={{ background: '#f8fafc', border: '1px solid var(--admin-gray-200)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--admin-navy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconSettings size={16} style={{ color: 'var(--admin-gray-600)' }} />
                    <span>Call-to-Action Buttons</span>
                    <small style={{ color: 'var(--admin-gray-500)', fontWeight: 'normal' }}>(Edit button names &amp; links easily)</small>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Primary Button Name / Label</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Explore All Kits →"
                        value={sectionForm.primary_btn_text}
                        onChange={e => setSectionForm({ ...sectionForm, primary_btn_text: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Primary Button Link (URL)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. /products"
                        value={sectionForm.primary_btn_url}
                        onChange={e => setSectionForm({ ...sectionForm, primary_btn_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Secondary Button Name / Label</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Education Solutions"
                        value={sectionForm.secondary_btn_text}
                        onChange={e => setSectionForm({ ...sectionForm, secondary_btn_text: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Secondary Button Link (URL)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. /education"
                        value={sectionForm.secondary_btn_url}
                        onChange={e => setSectionForm({ ...sectionForm, secondary_btn_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Tertiary / Action Button Name (Opens Modal / Action)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Apply for School Trial"
                      value={sectionForm.tertiary_btn_text}
                      onChange={e => setSectionForm({ ...sectionForm, tertiary_btn_text: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Dynamic Elements Data (Buttons, Stats, Cards JSON)</span>
                    <small style={{ color: 'var(--admin-gray-500)' }}>Schema validated</small>
                  </label>
                  <textarea
                    className="form-input"
                    rows="6"
                    style={{ fontFamily: 'monospace', fontSize: '0.82rem', background: '#f8fafc' }}
                    value={sectionForm.content_json}
                    onChange={e => setSectionForm({ ...sectionForm, content_json: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="secVisibleCheck"
                    checked={sectionForm.is_visible}
                    onChange={e => setSectionForm({ ...sectionForm, is_visible: e.target.checked })}
                  />
                  <label htmlFor="secVisibleCheck" style={{ margin: 0, fontSize: '0.9rem', cursor: 'pointer' }}>
                    Section Visible on Public Website
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Save Section Changes
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setEditingSection(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: NAVIGATION MENUS --- */}
      {subTab === 'navigation' && (
        <div style={{ display: 'grid', gridTemplateColumns: (showAddNav || editingNavItem) ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Select Navigation Menu:</label>
                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
                  value={selectedMenuId}
                  onChange={(e) => { setSelectedMenuId(e.target.value); setEditingNavItem(null); setShowAddNav(false); }}
                >
                  {menus.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.menu_key})</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingNavItem(null);
                  setNavForm({ label: '', url: '', badge: '', target: '_self', sort_order: (selectedMenu?.items?.length || 0) + 1, is_visible: true });
                  setShowAddNav(true);
                }}
              >
                + Add Navigation Link
              </button>
            </div>

            <div className="table-responsive" style={{ background: '#fff', borderRadius: '8px', border: '1px solid var(--admin-gray-200)', overflow: 'hidden' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Link Label</th>
                    <th>Destination URL</th>
                    <th>Badge</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMenu?.items?.map((item, idx) => (
                    <tr key={item.id}>
                      <td><strong>#{item.sort_order || idx + 1}</strong></td>
                      <td>
                        <strong>{item.label}</strong>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--admin-gray-600)' }}>
                        {item.url}
                      </td>
                      <td>
                        {item.badge ? <span className="badge badge-orange">{item.badge}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                            onClick={() => {
                              setEditingNavItem(item);
                              setShowAddNav(false);
                              setNavForm({
                                label: item.label,
                                url: item.url,
                                badge: item.badge || '',
                                target: item.target || '_self',
                                sort_order: item.sort_order || 0,
                                is_visible: Boolean(item.is_visible)
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleDeleteNavItem(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Nav Item Add/Edit Form */}
          {(showAddNav || editingNavItem) && (
            <div className="data-card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '8px', border: '1px solid var(--admin-gray-300)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--admin-gray-200)', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, color: 'var(--admin-navy)' }}>
                  {editingNavItem ? 'Edit Navigation Link' : 'Add New Navigation Link'}
                </h3>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
                  onClick={() => { setEditingNavItem(null); setShowAddNav(false); }}
                  aria-label="Close"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveNavItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Link Label *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Education Solutions"
                    required
                    value={navForm.label}
                    onChange={e => setNavForm({ ...navForm, label: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Destination URL *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. /education or https://..."
                    required
                    value={navForm.url}
                    onChange={e => setNavForm({ ...navForm, url: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Badge Tag (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Schools / New"
                      value={navForm.badge}
                      onChange={e => setNavForm({ ...navForm, badge: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sort Order</label>
                    <input
                      type="number"
                      className="form-input"
                      value={navForm.sort_order}
                      onChange={e => setNavForm({ ...navForm, sort_order: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {editingNavItem ? 'Save Link Changes' : 'Create Link'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => { setEditingNavItem(null); setShowAddNav(false); }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: FAQ ITEMS --- */}
      {subTab === 'faqs' && (
        <div style={{ display: 'grid', gridTemplateColumns: (showAddFaq || editingFaq) ? '1fr 1.1fr' : '1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--admin-navy)' }}>Public FAQs ({faqs.length})</h3>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingFaq(null);
                  setFaqForm({ category: 'General', question: '', answer: '', sort_order: faqs.length + 1, is_published: true });
                  setShowAddFaq(true);
                }}
              >
                + Add FAQ Item
              </button>
            </div>

            <div className="table-responsive" style={{ background: '#fff', borderRadius: '8px', border: '1px solid var(--admin-gray-200)', overflow: 'hidden' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Question</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map(faq => (
                    <tr key={faq.id}>
                      <td><span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{faq.category}</span></td>
                      <td>
                        <strong>{faq.question}</strong>
                      </td>
                      <td>
                        {faq.is_published ? (
                          <span className="badge badge-green">Published</span>
                        ) : (
                          <span className="badge badge-orange">Draft</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                            onClick={() => {
                              setEditingFaq(faq);
                              setShowAddFaq(false);
                              setFaqForm({
                                category: faq.category || 'General',
                                question: faq.question,
                                answer: faq.answer,
                                sort_order: faq.sort_order || 0,
                                is_published: Boolean(faq.is_published)
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleDeleteFaq(faq.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Add/Edit Form */}
          {(showAddFaq || editingFaq) && (
            <div className="data-card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '8px', border: '1px solid var(--admin-gray-300)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--admin-gray-200)', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, color: 'var(--admin-navy)' }}>
                  {editingFaq ? 'Edit FAQ Item' : 'Create New FAQ'}
                </h3>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
                  onClick={() => { setEditingFaq(null); setShowAddFaq(false); }}
                  aria-label="Close"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveFaq} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Products, Software, Curriculum, Orders"
                    value={faqForm.category}
                    onChange={e => setFaqForm({ ...faqForm, category: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Question *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Do Oxybott kits require soldering?"
                    required
                    value={faqForm.question}
                    onChange={e => setFaqForm({ ...faqForm, question: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Answer *</label>
                  <textarea
                    className="form-input"
                    rows="4"
                    placeholder="Detailed explanation..."
                    required
                    value={faqForm.answer}
                    onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="faqPublishCheck"
                    checked={faqForm.is_published}
                    onChange={e => setFaqForm({ ...faqForm, is_published: e.target.checked })}
                  />
                  <label htmlFor="faqPublishCheck" style={{ margin: 0, fontSize: '0.9rem', cursor: 'pointer' }}>
                    Publish this FAQ on Contact &amp; Help page
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {editingFaq ? 'Save FAQ Changes' : 'Create FAQ'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => { setEditingFaq(null); setShowAddFaq(false); }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

