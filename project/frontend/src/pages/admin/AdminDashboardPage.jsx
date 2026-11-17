import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { AdminAPI } from '../../services/api';
import CmsManager from '../../components/admin/CmsManager';
import SoftwareManager from '../../components/admin/SoftwareManager';
import MediaLibrary from '../../components/admin/MediaLibrary';
import '../../styles/admin.css';
import {
  IconChart,
  IconGlobe,
  IconLaptop,
  IconFolder,
  IconPackage,
  IconTag,
  IconGraduationCap,
  IconImage,
  IconSettings,
  IconFileText,
  IconMail,
  IconExternalLink,
  IconArrowRight,
  IconCheck,
  IconTrash,
  IconPlus,
  IconSearch,
  IconEdit,
  IconLightning,
  IconYouTube,
  IconVideo,
  IconInfo,
  IconClock
} from '../../components/common/Icons';

const formatImgSrc = (url) => {
  if (!url) return '/assets/images/oxybott_logo.webp';
  if (typeof url !== 'string') return '/assets/images/oxybott_logo.webp';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url;
  if (url.startsWith('/')) return url;
  return `/${url}`;
};

export default function AdminDashboardPage() {
  const { user, isAuthenticated, loading: authLoading, logout, changePassword } = useAuth();
  const { refreshStore } = useStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const [activeSection, setActiveSection] = useState('sectionDashboard');

  // Stats State
  const [stats, setStats] = useState({
    totalProducts: 0,
    publishedProducts: 0,
    draftProducts: 0,
    lowStockProducts: 0,
    totalCategories: 0,
    recentUpdates: [],
    recentAuditLogs: []
  });

  // Products State
  const [products, setProducts] = useState([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [productSeries, setProductSeries] = useState('');
  const [productStatus, setProductStatus] = useState('');
  const [productSort, setProductSort] = useState('newest');
  const [productPage, setProductPage] = useState(1);

  // Product Editor Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodForm, setProdForm] = useState({
    id: '',
    name: '',
    short_name: '',
    sku: '',
    series: 'Explorer Series',
    price: '',
    sale_price: '',
    stock_quantity: 100,
    badge: 'Popular',
    tagline: '',
    description: '',
    osemi_url: '',
    is_published: true,
    specs: [{ key: '', value: '' }],
    highlights: [''],
    boxContents: [''],
    categoryIds: []
  });
  const [productImages, setProductImages] = useState([]);
  const [productDocuments, setProductDocuments] = useState([]);
  const [docMode, setDocMode] = useState('pdf'); // 'pdf' | 'video_url' | 'video_file'
  const [docForm, setDocForm] = useState({ title: '', type: 'tutorial', video_url: '' });
  const [docFile, setDocFile] = useState(null);
  const [docUploading, setDocUploading] = useState(false);

  // Categories State
  const [categories, setCategories] = useState([]);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', sort_order: 0, is_published: true });

  // Banners State
  const [banners, setBanners] = useState([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', image_url: '', cta_text: '', cta_link: '', is_active: true, sort_order: 0 });

  // Tutorials & Guides State
  const [tutorials, setTutorials] = useState([]);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState(null);
  const [tutorialTab, setTutorialTab] = useState('manual'); // 'manual' | 'fetch'
  const [fetchProductId, setFetchProductId] = useState('');
  const [fetchedProductInfo, setFetchedProductInfo] = useState(null);
  const [fetchingProductData, setFetchingProductData] = useState(false);
  const [tutForm, setTutForm] = useState({
    title: '',
    lesson_tag: 'Lesson 01 • 15 Mins',
    description: '',
    product_id: '',
    thumbnail_url: '',
    video_url: '',
    video_file_path: '',
    pdf_file_path: '',
    sort_order: 0,
    is_published: true
  });
  const [tutFile, setTutFile] = useState(null);
  const [tutSaving, setTutSaving] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({});
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);

  // Inquiries State
  const [inquiries, setInquiries] = useState([]);
  const [inquiryType, setInquiryType] = useState('');
  const [inquiryStatus, setInquiryStatus] = useState('');
  const [inquirySearch, setInquirySearch] = useState('');

  // Fetch Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await AdminAPI.getStats();
      if (res.success && res.stats) setStats(res.stats);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Products
  const loadProducts = useCallback(async () => {
    try {
      const res = await AdminAPI.getProducts({
        search: productSearch,
        series: productSeries,
        status: productStatus,
        sort: productSort,
        page: productPage,
        limit: 20
      });
      if (res.success) {
        setProducts(res.products);
        setProductsTotal(res.total);
      }
    } catch (e) {
      console.error(e);
    }
  }, [productSearch, productSeries, productStatus, productSort, productPage]);

  // Fetch Categories
  const loadCategories = useCallback(async () => {
    try {
      const res = await AdminAPI.getCategories();
      if (res.success) setCategories(res.categories);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Banners
  const loadBanners = useCallback(async () => {
    try {
      const res = await AdminAPI.getBanners();
      if (res.success) setBanners(res.banners);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Tutorials
  const loadTutorials = useCallback(async () => {
    try {
      const res = await AdminAPI.getTutorials();
      if (res.success) setTutorials(res.tutorials);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Settings
  const loadSettings = useCallback(async () => {
    try {
      const res = await AdminAPI.getSettings();
      if (res.success) setSettings(res.settings);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Audit Logs
  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await AdminAPI.getAuditLogs(50);
      if (res.success) setAuditLogs(res.logs);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Inquiries
  const loadInquiries = useCallback(async () => {
    try {
      const res = await AdminAPI.getInquiries({
        type: inquiryType,
        status: inquiryStatus,
        search: inquirySearch
      });
      if (res.success) setInquiries(res.inquiries);
    } catch (e) {
      console.error(e);
    }
  }, [inquiryType, inquiryStatus, inquirySearch]);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
      loadProducts();
      loadCategories();
      loadBanners();
      loadTutorials();
      loadSettings();
      loadAuditLogs();
      loadInquiries();
    }
  }, [isAuthenticated, loadStats, loadProducts, loadCategories, loadBanners, loadTutorials, loadSettings, loadAuditLogs, loadInquiries]);

  if (authLoading || !isAuthenticated) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Authenticating admin session...</div>;
  }

  // Cross-tab and live website synchronization
  const notifyLiveSync = () => {
    window.dispatchEvent(new Event('oxybott_settings_updated'));
    window.dispatchEvent(new Event('oxybott_cms_updated'));
    localStorage.setItem('oxybott_settings_sync', Date.now().toString());
    localStorage.setItem('oxybott_cms_sync', Date.now().toString());
  };

  // --- Product Handlers ---
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductImages([]);
    setProductDocuments([]);
    setDocForm({ title: '', type: 'tutorial' });
    setDocFile(null);
    setProdForm({
      id: '',
      name: '',
      short_name: '',
      sku: '',
      series: 'Explorer Series',
      price: '',
      sale_price: '',
      stock_quantity: 100,
      badge: 'Popular',
      tagline: '',
      description: '',
      osemi_url: '',
      is_published: true,
      specs: [{ key: 'Microcontroller', value: 'ESP32 (240MHz Dual-Core)' }],
      highlights: [''],
      boxContents: [''],
      categoryIds: []
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = async (prod) => {
    try {
      const res = await AdminAPI.getProductById(prod.id);
      if (res.success && res.product) {
        const p = res.product;
        setEditingProduct(p);
        setProductImages(p.images || []);
        setProductDocuments(p.documents || []);
        setDocForm({ title: '', type: 'tutorial' });
        setDocFile(null);
        setProdForm({
          id: p.id,
          name: p.name,
          short_name: p.short_name,
          sku: p.sku,
          series: p.series || 'Explorer Series',
          price: p.price,
          sale_price: p.sale_price || '',
          stock_quantity: p.stock_quantity,
          badge: p.badge || '',
          tagline: p.tagline || '',
          description: p.description || '',
          osemi_url: p.osemi_url || '',
          is_published: !!p.is_published,
          specs: p.specs && p.specs.length > 0 ? p.specs.map(s => ({ key: s.spec_key, value: s.spec_value })) : [{ key: '', value: '' }],
          highlights: p.highlights && p.highlights.length > 0 ? p.highlights.map(h => h.highlight_text) : [''],
          boxContents: p.boxContents && p.boxContents.length > 0 ? p.boxContents.map(b => b.item_text) : [''],
          categoryIds: p.categoryIds || []
        });
        setIsProductModalOpen(true);
      }
    } catch (e) {
      showToast('Failed to load product details.', true);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (prodForm.osemi_url && prodForm.osemi_url.trim()) {
        const u = prodForm.osemi_url.trim();
        if (!u.startsWith('https://')) {
          showToast('OSEMI Product URL must start with https://', true);
          return;
        }
      }

      const payload = {
        ...prodForm,
        osemi_url: prodForm.osemi_url ? prodForm.osemi_url.trim() : null,
        specs: prodForm.specs.filter(s => s.key && s.value),
        highlights: prodForm.highlights.filter(h => h.trim()),
        boxContents: prodForm.boxContents.filter(b => b.trim())
      };

      if (editingProduct) {
        await AdminAPI.updateProduct(editingProduct.id, payload);
        showToast('Product updated successfully.');
      } else {
        await AdminAPI.createProduct(payload);
        showToast('Product created successfully.');
      }

      setIsProductModalOpen(false);
      loadProducts();
      loadStats();
      refreshStore();
      notifyLiveSync();
    } catch (err) {
      showToast(err.message || 'Error saving product.', true);
    }
  };

  const handleTogglePublish = async (id, currentVal) => {
    try {
      await AdminAPI.togglePublish(id, !currentVal);
      showToast(`Product ${!currentVal ? 'published' : 'moved to draft'}.`);
      loadProducts();
      loadStats();
      refreshStore();
      notifyLiveSync();
    } catch (e) {
      showToast('Failed to update publication status.', true);
    }
  };

  const handleDuplicateProduct = async (id) => {
    try {
      await AdminAPI.duplicateProduct(id);
      showToast('Product duplicated successfully.');
      loadProducts();
      loadStats();
      refreshStore();
      notifyLiveSync();
    } catch (e) {
      showToast('Failed to duplicate product.', true);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"? This action cannot be undone.`)) return;
    try {
      await AdminAPI.deleteProduct(id);
      showToast('Product deleted.');
      loadProducts();
      loadStats();
      refreshStore();
      notifyLiveSync();
    } catch (e) {
      showToast('Failed to delete product.', true);
    }
  };

  // Image upload
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProduct) return;

    const fd = new FormData();
    for (let i = 0; i < files.length; i++) {
      fd.append('images', files[i]);
    }

    try {
      await AdminAPI.uploadImages(editingProduct.id, fd);
      showToast('Images uploaded successfully.');
      // Refresh product images
      const res = await AdminAPI.getProductById(editingProduct.id);
      if (res.success) setProductImages(res.product.images || []);
      loadProducts();
      refreshStore();
    } catch (err) {
      showToast(err.message || 'Image upload failed.', true);
    }
  };

  const handleSetMainImage = async (imageId) => {
    if (!editingProduct) return;
    try {
      await AdminAPI.setMainImage(editingProduct.id, imageId);
      showToast('Main image updated.');
      const res = await AdminAPI.getProductById(editingProduct.id);
      if (res.success) setProductImages(res.product.images || []);
      loadProducts();
      refreshStore();
    } catch (e) {
      showToast('Failed to set main image.', true);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!editingProduct) return;
    try {
      await AdminAPI.deleteImage(editingProduct.id, imageId);
      showToast('Image deleted.');
      const res = await AdminAPI.getProductById(editingProduct.id);
      if (res.success) setProductImages(res.product.images || []);
      loadProducts();
      refreshStore();
    } catch (e) {
      showToast('Failed to delete image.', true);
    }
  };

  // --- Product Resource Handlers (PDFs, Videos, YouTube Links) ---
  const handleUploadDocument = async () => {
    if (!editingProduct) return;

    if (!docForm.title.trim()) {
      showToast('Please provide a title for this tutorial/document.', true);
      return;
    }

    if (docMode === 'video_url') {
      if (!docForm.video_url.trim()) {
        showToast('Please enter a YouTube or video URL.', true);
        return;
      }
      setDocUploading(true);
      try {
        const res = await AdminAPI.uploadDocument(editingProduct.id, {
          document_title: docForm.title.trim(),
          document_type: docForm.type || 'video_tutorial',
          video_url: docForm.video_url.trim()
        });
        if (res.success && res.document) {
          showToast(`Added video link "${res.document.document_title}".`);
          setProductDocuments(prev => [...prev, res.document]);
          setDocForm({ title: '', type: 'tutorial', video_url: '' });
          refreshStore?.();
          notifyLiveSync();
        }
      } catch (err) {
        showToast(err.message || 'Failed to save video link.', true);
      } finally {
        setDocUploading(false);
      }
      return;
    }

    // Physical file upload (PDF or Video)
    if (!docFile) {
      showToast(docMode === 'video_file' ? 'Please select a video file (.mp4, .webm).' : 'Please select a PDF document (.pdf).', true);
      return;
    }

    const fd = new FormData();
    fd.append('file', docFile);
    fd.append('document_title', docForm.title.trim());
    fd.append('document_type', docForm.type || (docMode === 'video_file' ? 'video_tutorial' : 'tutorial'));

    setDocUploading(true);
    try {
      const res = await AdminAPI.uploadDocument(editingProduct.id, fd);
      if (res.success && res.document) {
        showToast(`Uploaded "${res.document.document_title}".`);
        setProductDocuments(prev => [...prev, res.document]);
        setDocForm({ title: '', type: 'tutorial', video_url: '' });
        setDocFile(null);
        const fileInput = document.getElementById('adminDocFileInput');
        if (fileInput) fileInput.value = '';
        refreshStore?.();
        notifyLiveSync();
      }
    } catch (err) {
      showToast(err.message || 'Failed to upload file.', true);
    } finally {
      setDocUploading(false);
    }
  };

  const handleReplaceDocument = async (docId, file, title, type) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    if (title) fd.append('document_title', title);
    if (type) fd.append('document_type', type);

    try {
      const res = await AdminAPI.replaceDocument(docId, fd);
      if (res.success && res.document) {
        showToast('Document replaced successfully.');
        setProductDocuments(prev => prev.map(d => d.id === docId ? res.document : d));
        refreshStore?.();
        notifyLiveSync();
      }
    } catch (err) {
      showToast(err.message || 'Failed to replace document.', true);
    }
  };

  const handleDeleteDocument = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to delete document "${title}"? This cannot be undone.`)) return;
    try {
      await AdminAPI.deleteDocument(docId);
      showToast('Document deleted.');
      setProductDocuments(prev => prev.filter(d => d.id !== docId));
      refreshStore?.();
      notifyLiveSync();
    } catch (err) {
      showToast(err.message || 'Failed to delete document.', true);
    }
  };

  // --- Category Handlers ---
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await AdminAPI.updateCategory(editingCategory.id, catForm);
        showToast('Category updated.');
      } else {
        await AdminAPI.createCategory(catForm);
        showToast('Category created.');
      }
      setIsCatModalOpen(false);
      loadCategories();
      refreshStore?.();
      notifyLiveSync();
    } catch (err) {
      showToast(err.message || 'Error saving category.', true);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await AdminAPI.deleteCategory(id);
      showToast('Category deleted.');
      loadCategories();
      refreshStore?.();
      notifyLiveSync();
    } catch (e) {
      showToast('Error deleting category.', true);
    }
  };

  // --- Banner Handlers ---
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await AdminAPI.updateBanner(editingBanner.id, bannerForm);
        showToast('Banner updated.');
      } else {
        await AdminAPI.createBanner(bannerForm);
        showToast('Banner created.');
      }
      setIsBannerModalOpen(false);
      loadBanners();
      refreshStore?.();
      notifyLiveSync();
    } catch (err) {
      showToast(err.message || 'Error saving banner.', true);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await AdminAPI.deleteBanner(id);
      showToast('Banner deleted.');
      loadBanners();
      refreshStore?.();
      notifyLiveSync();
    } catch (e) {
      showToast('Error deleting banner.', true);
    }
  };

  // --- Tutorial Handlers ---
  const handleOpenAddTutorial = () => {
    setEditingTutorial(null);
    setTutorialTab('manual');
    setFetchProductId('');
    setFetchedProductInfo(null);
    setTutFile(null);
    const nextLessonNum = (tutorials.length + 1).toString().padStart(2, '0');
    setTutForm({
      title: '',
      lesson_tag: `Lesson ${nextLessonNum} • 20 Mins`,
      description: '',
      product_id: '',
      thumbnail_url: '',
      video_url: '',
      video_file_path: '',
      pdf_file_path: '',
      sort_order: tutorials.length + 1,
      is_published: true
    });
    setIsTutorialModalOpen(true);
  };

  const handleOpenEditTutorial = (tut) => {
    setEditingTutorial(tut);
    setTutorialTab('manual');
    setFetchProductId(tut.product_id || '');
    setFetchedProductInfo(null);
    setTutFile(null);
    setTutForm({
      title: tut.title || '',
      lesson_tag: tut.lesson_tag || '',
      description: tut.description || '',
      product_id: tut.product_id || '',
      thumbnail_url: tut.thumbnail_url || '',
      video_url: tut.video_url || '',
      video_file_path: tut.video_file_path || '',
      pdf_file_path: tut.pdf_file_path || '',
      sort_order: tut.sort_order || 0,
      is_published: tut.is_published !== undefined ? tut.is_published : true
    });
    setIsTutorialModalOpen(true);
  };

  const handleSelectFetchProduct = async (productId) => {
    setFetchProductId(productId);
    if (!productId) {
      setFetchedProductInfo(null);
      return;
    }
    setFetchingProductData(true);
    try {
      const res = await AdminAPI.getProductTutorialData(productId);
      if (res.success && res.data) {
        setFetchedProductInfo(res.data);
        const nextLessonNum = (tutorials.length + 1).toString().padStart(2, '0');
        const firstVideo = res.data.video_docs?.length > 0 ? res.data.video_docs[0] : null;
        const firstPdf = res.data.pdf_docs?.length > 0 ? res.data.pdf_docs[0] : null;

        setTutForm(prev => ({
          ...prev,
          title: res.data.suggested_title,
          lesson_tag: prev.lesson_tag || `Lesson ${nextLessonNum} • 20 Mins`,
          description: res.data.product.description || prev.description,
          product_id: res.data.product.id,
          thumbnail_url: res.data.suggested_thumbnail,
          video_url: firstVideo?.video_url || '',
          video_file_path: firstVideo && !firstVideo.video_url ? firstVideo.file_path : '',
          pdf_file_path: firstPdf ? firstPdf.file_path : ''
        }));
        showToast(`Fetched details for "${res.data.product.name}"`);
      }
    } catch (err) {
      showToast(err.message || 'Error fetching product tutorial info.', true);
    } finally {
      setFetchingProductData(false);
    }
  };

  const handleSaveTutorial = async (e) => {
    e.preventDefault();
    if (!tutForm.title.trim()) {
      showToast('Please provide a tutorial title.', true);
      return;
    }
    setTutSaving(true);
    try {
      let payload;
      if (tutFile) {
        const formData = new FormData();
        Object.entries(tutForm).forEach(([k, v]) => {
          if (v !== undefined && v !== null) formData.append(k, v);
        });
        formData.append('file', tutFile);
        payload = formData;
      } else {
        payload = tutForm;
      }

      if (editingTutorial) {
        await AdminAPI.updateTutorial(editingTutorial.id, payload);
        showToast('Tutorial updated successfully.');
      } else {
        await AdminAPI.createTutorial(payload);
        showToast('Tutorial created successfully.');
      }
      setIsTutorialModalOpen(false);
      loadTutorials();
      refreshStore?.();
      notifyLiveSync();
    } catch (err) {
      showToast(err.message || 'Error saving tutorial.', true);
    } finally {
      setTutSaving(false);
    }
  };

  const handleDeleteTutorial = async (id, title) => {
    if (!window.confirm(`Delete tutorial "${title}"?`)) return;
    try {
      await AdminAPI.deleteTutorial(id);
      showToast('Tutorial deleted.');
      loadTutorials();
      refreshStore?.();
      notifyLiveSync();
    } catch (err) {
      showToast(err.message || 'Error deleting tutorial.', true);
    }
  };

  const handleTogglePublishTutorial = async (tut) => {
    try {
      await AdminAPI.updateTutorial(tut.id, { is_published: !tut.is_published });
      showToast(`Tutorial ${!tut.is_published ? 'published' : 'hidden'}.`);
      loadTutorials();
      refreshStore?.();
      notifyLiveSync();
    } catch (err) {
      showToast('Failed to toggle tutorial status.', true);
    }
  };

  // --- Settings Handlers ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await AdminAPI.updateSettings(settings);
      await loadSettings();
      // Instantly notify this tab and all other open tabs
      window.dispatchEvent(new Event('oxybott_settings_updated'));
      window.dispatchEvent(new Event('oxybott_cms_updated'));
      localStorage.setItem('oxybott_settings_sync', Date.now().toString());
      localStorage.setItem('oxybott_cms_sync', Date.now().toString());
      refreshStore?.();
      showToast('Site settings saved & updated across the website!');
    } catch (err) {
      showToast(err.message || 'Error saving settings.', true);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const res = await changePassword(currPassword, newPassword);
    if (res.success) {
      setCurrPassword('');
      setNewPassword('');
    }
  };

  // --- Inquiry Handlers ---
  const handleUpdateInquiryStatus = async (id, newStatus) => {
    try {
      await AdminAPI.updateInquiryStatus(id, newStatus);
      showToast(`Inquiry status updated to ${newStatus}.`);
      loadInquiries();
    } catch (e) {
      showToast('Failed to update inquiry status.', true);
    }
  };

  const handleDeleteInquiry = async (id) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      await AdminAPI.deleteInquiry(id);
      showToast('Inquiry deleted.');
      loadInquiries();
    } catch (e) {
      showToast('Failed to delete inquiry.', true);
    }
  };

  return (
    <div className="admin-shell" id="adminShell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--admin-bg)' }}>
      {/* SIDEBAR */}
      <aside className="admin-sidebar" style={{ width: '260px', background: 'var(--admin-navy)', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div className="sidebar-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <img src="/assets/images/oxybott_logo.webp" alt="Oxybott" className="sidebar-logo" style={{ maxHeight: '36px' }} />
        </div>

        <nav className="sidebar-nav" style={{ padding: '1rem 0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'sectionDashboard', label: 'Dashboard', icon: IconChart },
            { id: 'sectionCms', label: 'Website Content', icon: IconGlobe },
            { id: 'sectionSoftware', label: 'Software & Downloads', icon: IconLaptop },
            { id: 'sectionMedia', label: 'Media Library', icon: IconFolder },
            { id: 'sectionProducts', label: 'Products', icon: IconPackage },
            { id: 'sectionCategories', label: 'Categories', icon: IconTag },
            { id: 'sectionTutorials', label: 'Tutorials & Guides', icon: IconGraduationCap },
            { id: 'sectionBanners', label: 'Banners', icon: IconImage },
            { id: 'sectionSettings', label: 'Site Settings', icon: IconSettings },
            { id: 'sectionAudit', label: 'Audit Logs', icon: IconFileText },
            { id: 'sectionInquiries', label: 'Inquiries & Leads', icon: IconMail }
          ].map(item => {
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeSection === item.id ? 'var(--admin-primary)' : 'transparent',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onClick={() => setActiveSection(item.id)}
              >
                <IconComp size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.5rem' }}>
          <Link
            to="/"
            target="_blank"
            className="btn btn-outline btn-sm"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <IconExternalLink size={14} />
            <span>View Store</span>
          </Link>
          <button
            type="button"
            id="logoutBtn"
            className="btn btn-danger btn-sm"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <header className="admin-header" style={{ height: '64px', background: '#fff', borderBottom: '1px solid var(--admin-gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
          <div style={{ fontWeight: 600, color: 'var(--admin-gray-600)', fontSize: '0.9rem' }} id="headerWelcome">
            Logged in as <strong>{user?.username || 'admin'}</strong> ({user?.role || 'admin'})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="badge badge-orange">Currency: {settings.currency_code || 'INR'} ({settings.currency_symbol || '₹'})</span>
          </div>
        </header>

        <div className="admin-content" style={{ padding: '2rem', flex: 1 }}>
          {/* 1. DASHBOARD OVERVIEW */}
          {activeSection === 'sectionDashboard' && (
            <section className="admin-section active" id="sectionDashboard">
              <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 className="page-title" style={{ margin: 0, color: 'var(--admin-navy)', fontSize: '1.5rem' }}>Overview Dashboard</h2>
                  <p style={{ color: 'var(--admin-gray-500)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                    Store inventory, product publication status, and recent activity.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-orange"
                  id="quickAddProductBtn"
                  onClick={handleOpenAddProduct}
                >
                  + New Product
                </button>
              </div>

              {/* KPI Metrics */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Total Products</div>
                  <div className="metric-val" id="metricTotalProducts">{stats.totalProducts}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Published</div>
                  <div className="metric-val green" id="metricPublished">{stats.publishedProducts}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Drafts</div>
                  <div className="metric-val" id="metricDrafts">{stats.draftProducts}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Low Stock</div>
                  <div className="metric-val red" id="metricLowStock">{stats.lowStockProducts}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Categories</div>
                  <div className="metric-val orange" id="metricCategories">{stats.totalCategories}</div>
                </div>
              </div>

              {/* Recent Product Updates */}
              <div className="data-card" style={{ marginBottom: '2rem' }}>
                <div className="data-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-gray-200)' }}>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--admin-navy)', margin: 0 }}>Recently Updated Products</h3>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setActiveSection('sectionProducts')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <span>View All Products</span>
                    <IconArrowRight size={13} />
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentUpdates?.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.sku}</td>
                          <td><strong>{p.name}</strong></td>
                          <td>₹{Number(p.price).toLocaleString('en-IN')}</td>
                          <td>{p.stock_quantity}</td>
                          <td>
                            <span className={`badge ${p.is_published ? 'badge-green' : 'badge-gray'}`}>
                              {p.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--admin-gray-500)' }}>
                            {new Date(p.updated_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* WEBSITE CONTENT CMS */}
          {activeSection === 'sectionCms' && (
            <section className="admin-section active" id="sectionCms">
              <div className="section-header-row" style={{ marginBottom: '1.5rem' }}>
                <h2 className="page-title" style={{ margin: 0, color: 'var(--admin-navy)', fontSize: '1.5rem' }}>Website Content Management</h2>
                <p style={{ color: 'var(--admin-gray-500)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                  Edit public website page sections, homepage highlights, navigation menus, and FAQs dynamically.
                </p>
              </div>
              <CmsManager />
            </section>
          )}

          {/* SOFTWARE & DOWNLOADS CMS */}
          {activeSection === 'sectionSoftware' && (
            <section className="admin-section active" id="sectionSoftware">
              <SoftwareManager />
            </section>
          )}

          {/* MEDIA LIBRARY */}
          {activeSection === 'sectionMedia' && (
            <section className="admin-section active" id="sectionMedia">
              <MediaLibrary />
            </section>
          )}

          {/* 2. PRODUCTS MANAGEMENT */}
          {activeSection === 'sectionProducts' && (
            <section className="admin-section active" id="sectionProducts">
              <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 className="page-title" style={{ margin: 0, color: 'var(--admin-navy)', fontSize: '1.5rem' }}>Products Management</h2>
                  <p style={{ color: 'var(--admin-gray-500)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                    Create, edit, duplicate, and configure inventory &amp; specifications.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-orange"
                  id="openAddProductModalBtn"
                  onClick={handleOpenAddProduct}
                >
                  + Add Product
                </button>
              </div>

              {/* Filters Toolbar */}
              <div className="data-toolbar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid var(--admin-gray-200)' }}>
                <input
                  type="text"
                  placeholder="Search name, SKU..."
                  className="form-input"
                  style={{ minWidth: '220px', flex: 1 }}
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
                <select
                  className="form-select"
                  value={productSeries}
                  onChange={e => setProductSeries(e.target.value)}
                >
                  <option value="">All Series</option>
                  <option value="Explorer Series">Explorer Series</option>
                  <option value="Education Series">Education Series</option>
                  <option value="Inventor Series">Inventor Series</option>
                  <option value="Maker Series">Maker Series</option>
                </select>
                <select
                  className="form-select"
                  value={productStatus}
                  onChange={e => setProductStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="low_stock">Low Stock</option>
                </select>
                <select
                  className="form-select"
                  value={productSort}
                  onChange={e => setProductSort(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="stock-asc">Stock: Low to High</option>
                </select>
              </div>

              {/* Products Table */}
              <div className="data-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>SKU</th>
                        <th>Name</th>
                        <th>Series</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>OSEMI Link</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td>
                            <img
                              src={formatImgSrc(p.main_image)}
                              alt=""
                              style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', background: '#f8fafc' }}
                            />
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.sku}</td>
                          <td>
                            <strong>{p.name}</strong>
                          </td>
                          <td><span className="product-series-tag">{p.series}</span></td>
                          <td>₹{Number(p.price).toLocaleString('en-IN')}</td>
                          <td>
                            <span style={{ fontWeight: 600, color: p.stock_quantity <= p.low_stock_threshold ? 'var(--oxy-orange)' : 'inherit' }}>
                              {p.stock_quantity}
                            </span>
                          </td>
                          <td>
                            {p.osemi_url ? (
                              <a
                                href={p.osemi_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="badge badge-green"
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                title={p.osemi_url}
                              >
                                <IconExternalLink size={12} />
                                <span>Configured</span>
                              </a>
                            ) : (
                              <span className="badge badge-gray" style={{ color: '#d97706', background: '#fef3c7' }} title="Purchase link missing">
                                Missing
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${p.is_published ? 'badge-green' : 'badge-gray'}`}>
                              {p.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => handleOpenEditProduct(p)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => handleTogglePublish(p.id, p.is_published)}
                              >
                                {p.is_published ? 'Unpublish' : 'Publish'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => handleDuplicateProduct(p.id)}
                              >
                                Duplicate
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteProduct(p.id, p.name)}
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
            </section>
          )}

          {/* 3. CATEGORIES MANAGEMENT */}
          {activeSection === 'sectionCategories' && (
            <section className="admin-section active" id="sectionCategories">
              <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 className="page-title" style={{ margin: 0, color: 'var(--admin-navy)', fontSize: '1.5rem' }}>Categories Management</h2>
                  <p style={{ color: 'var(--admin-gray-500)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                    Organize your store catalog into searchable hardware series and types.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-orange"
                  onClick={() => {
                    setEditingCategory(null);
                    setCatForm({ name: '', slug: '', description: '', sort_order: 0, is_published: true });
                    setIsCatModalOpen(true);
                  }}
                >
                  + Add Category
                </button>
              </div>

              <div className="data-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Description</th>
                        <th>Products</th>
                        <th>Order</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(c => (
                        <tr key={c.id}>
                          <td>{c.id}</td>
                          <td><strong>{c.name}</strong></td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{c.slug}</td>
                          <td style={{ maxWidth: '300px' }}>{c.description}</td>
                          <td><span className="badge badge-orange">{c.products_count || 0}</span></td>
                          <td>{c.sort_order}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                  setEditingCategory(c);
                                  setCatForm({ name: c.name, slug: c.slug, description: c.description || '', sort_order: c.sort_order, is_published: !!c.is_published });
                                  setIsCatModalOpen(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteCategory(c.id)}
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
            </section>
          )}

          {/* TUTORIALS & GUIDES MANAGEMENT */}
          {activeSection === 'sectionTutorials' && (
            <section className="admin-section active" id="sectionTutorials">
              <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className="page-title" style={{ margin: 0, color: 'var(--admin-navy)', fontSize: '1.5rem' }}>Tutorials &amp; Assembly Guides</h2>
                  <p style={{ color: 'var(--admin-gray-500)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                    Manage step-by-step video tutorials and build guides displayed on the website Tutorials page.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOpenAddTutorial}
                >
                  + Add New Tutorial
                </button>
              </div>

              <div className="data-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Thumbnail</th>
                        <th>Title &amp; Lesson</th>
                        <th>Linked Product</th>
                        <th>Video Source</th>
                        <th>Order</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tutorials.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-gray-500)' }}>
                            No tutorials created yet. Click &quot;+ Add New Tutorial&quot; to upload your first tutorial.
                          </td>
                        </tr>
                      ) : (
                        tutorials.map(tut => {
                          const hasYt = Boolean(tut.video_url);
                          const hasFile = Boolean(tut.video_file_path);

                          return (
                            <tr key={tut.id}>
                              <td>
                                <img
                                  src={formatImgSrc(tut.thumbnail_url)}
                                  alt=""
                                  style={{ width: '60px', height: '45px', objectFit: 'contain', background: '#0c2340', borderRadius: '4px', padding: '2px' }}
                                />
                              </td>
                              <td style={{ maxWidth: '320px' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-primary)', fontWeight: 700 }}>
                                  {tut.lesson_tag}
                                </div>
                                <strong style={{ color: 'var(--admin-navy)', fontSize: '0.9rem' }}>{tut.title}</strong>
                                {tut.description && (
                                  <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--admin-gray-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {tut.description}
                                  </p>
                                )}
                              </td>
                              <td>
                                {tut.product_name ? (
                                  <div>
                                    <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                                      {tut.product_sku || tut.product_id}
                                    </span>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-gray-600)', marginTop: '2px' }}>
                                      {tut.product_name}
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--admin-gray-400)', fontSize: '0.8rem' }}>Standalone</span>
                                )}
                              </td>
                              <td>
                                {hasYt ? (
                                  <a
                                    href={tut.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                  >
                                    <IconVideo size={13} />
                                    <span>YouTube</span>
                                  </a>
                                ) : hasFile ? (
                                  <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <IconVideo size={13} />
                                    <span>Video File</span>
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-gray-400)' }}>None</span>
                                )}
                              </td>
                              <td>{tut.sort_order}</td>
                              <td>
                                <span className={`badge ${tut.is_published ? 'badge-green' : 'badge-gray'}`}>
                                  {tut.is_published ? 'Published' : 'Hidden'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleOpenEditTutorial(tut)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleTogglePublishTutorial(tut)}
                                  >
                                    {tut.is_published ? 'Hide' : 'Publish'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteTutorial(tut.id, tut.title)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* 4. BANNERS MANAGEMENT */}
          {activeSection === 'sectionBanners' && (
            <section className="admin-section active" id="sectionBanners">
              <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 className="page-title" style={{ margin: 0, color: 'var(--admin-navy)', fontSize: '1.5rem' }}>Hero Banners &amp; Promotions</h2>
                  <p style={{ color: 'var(--admin-gray-500)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                    Configure dynamic homepage hero slides and announcements.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-orange"
                  onClick={() => {
                    setEditingBanner(null);
                    setBannerForm({ title: '', subtitle: '', image_url: '', cta_text: 'Explore Kits', cta_link: '/products', is_active: true, sort_order: 0 });
                    setIsBannerModalOpen(true);
                  }}
                >
                  + Add Banner
                </button>
              </div>

              <div className="data-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Subtitle</th>
                        <th>CTA Link</th>
                        <th>Status</th>
                        <th>Order</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {banners.map(b => (
                        <tr key={b.id}>
                          <td><strong>{b.title}</strong></td>
                          <td style={{ maxWidth: '300px' }}>{b.subtitle}</td>
                          <td><code>{b.cta_link}</code></td>
                          <td>
                            <span className={`badge ${b.is_active ? 'badge-green' : 'badge-gray'}`}>
                              {b.is_active ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td>{b.sort_order}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                  setEditingBanner(b);
                                  setBannerForm({ title: b.title, subtitle: b.subtitle || '', image_url: b.image_url || '', cta_text: b.cta_text || '', cta_link: b.cta_link || '', is_active: !!b.is_active, sort_order: b.sort_order });
                                  setIsBannerModalOpen(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteBanner(b.id)}
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
            </section>
          )}

          {/* 5. SITE SETTINGS & PASSWORD CHANGE */}
          {activeSection === 'sectionSettings' && (
            <section className="admin-section active" id="sectionSettings">
              <div className="section-header-row" style={{ marginBottom: '1.5rem' }}>
                <h2 className="page-title" style={{ margin: 0, color: 'var(--admin-navy)', fontSize: '1.5rem' }}>Site Settings &amp; Security</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem' }}>
                {/* Store Config */}
                <div className="data-card" style={{ padding: '2rem' }}>
                  <h3 style={{ color: 'var(--admin-navy)', margin: '0 0 1.5rem 0' }}>Storefront Configuration</h3>
                  <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Store Brand Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Oxybott STEM Robotics"
                        value={settings.store_name || ''}
                        onChange={e => setSettings({ ...settings, store_name: e.target.value })}
                      />
                      <small style={{ color: 'var(--admin-gray-500)', fontSize: '0.75rem', marginTop: '3px', display: 'block' }}>
                        Displayed in header brand tags, footer copyright, and site notices.
                      </small>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Top Announcement Bar Text</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Free STEM Teacher Sample Kits available for schools!"
                        value={settings.announcement || ''}
                        onChange={e => setSettings({ ...settings, announcement: e.target.value })}
                      />
                      <small style={{ color: 'var(--admin-gray-500)', fontSize: '0.75rem', marginTop: '3px', display: 'block' }}>
                        Banner at the very top of all pages. <strong>Leave blank to hide</strong> the announcement bar.
                      </small>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Currency Code</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settings.currency_code || 'INR'}
                          onChange={e => setSettings({ ...settings, currency_code: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Currency Symbol</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settings.currency_symbol || '₹'}
                          onChange={e => setSettings({ ...settings, currency_symbol: e.target.value })}
                        />
                        <small style={{ color: 'var(--admin-gray-500)', fontSize: '0.72rem', marginTop: '2px', display: 'block' }}>
                          Used across all product price displays.
                        </small>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Education Email (School Orders)</label>
                        <input
                          type="email"
                          className="form-input"
                          value={settings.contact_email || ''}
                          onChange={e => setSettings({ ...settings, contact_email: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Support Email (Technical)</label>
                        <input
                          type="email"
                          className="form-input"
                          value={settings.support_email || ''}
                          onChange={e => setSettings({ ...settings, support_email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Contact Phone</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settings.phone || ''}
                          placeholder="+91 98765 43210"
                          onChange={e => setSettings({ ...settings, phone: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Custom Logo Image URL</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settings.logo_url || ''}
                          placeholder="/assets/images/oxybott_logo.webp"
                          onChange={e => setSettings({ ...settings, logo_url: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Storefront Tagline / Footer About Text</label>
                      <textarea
                        className="form-input"
                        rows="2"
                        value={settings.store_tagline || ''}
                        placeholder="Oxybott is an international leader in ESP32-powered STEM kits..."
                        onChange={e => setSettings({ ...settings, store_tagline: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Physical Campus / Office Address</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settings.address || ''}
                        placeholder="Tech City, Bengaluru, Karnataka 560100, India"
                        onChange={e => setSettings({ ...settings, address: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">YouTube URL</label>
                        <input
                          type="url"
                          className="form-input"
                          value={settings.youtube_url || ''}
                          placeholder="https://youtube.com/..."
                          onChange={e => setSettings({ ...settings, youtube_url: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">GitHub URL</label>
                        <input
                          type="url"
                          className="form-input"
                          value={settings.github_url || ''}
                          placeholder="https://github.com/..."
                          onChange={e => setSettings({ ...settings, github_url: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Twitter / X URL</label>
                        <input
                          type="url"
                          className="form-input"
                          value={settings.twitter_url || ''}
                          placeholder="https://twitter.com/..."
                          onChange={e => setSettings({ ...settings, twitter_url: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">LinkedIn URL</label>
                        <input
                          type="url"
                          className="form-input"
                          value={settings.linkedin_url || ''}
                          placeholder="https://linkedin.com/..."
                          onChange={e => setSettings({ ...settings, linkedin_url: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Favicon Image URL</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settings.favicon_url || ''}
                        placeholder="/assets/images/favicon.ico"
                        onChange={e => setSettings({ ...settings, favicon_url: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">SEO Browser Tab Title</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settings.seo_title || ''}
                          placeholder="Oxybott: Leading Brand for STEM & Robotics Kits"
                          onChange={e => setSettings({ ...settings, seo_title: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">SEO Meta Description</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settings.seo_description || ''}
                          placeholder="Oxybott is a trusted premier global brand for STEM education..."
                          onChange={e => setSettings({ ...settings, seo_description: e.target.value })}
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                      Save Settings
                    </button>
                  </form>
                </div>

                {/* Password Change */}
                <div className="data-card" style={{ padding: '2rem' }}>
                  <h3 style={{ color: 'var(--admin-navy)', margin: '0 0 1.5rem 0' }}>Change Administrator Password</h3>
                  <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input
                        type="password"
                        className="form-input"
                        required
                        value={currPassword}
                        onChange={e => setCurrPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">New Password (min 8 chars)</label>
                      <input
                        type="password"
                        className="form-input"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-orange" style={{ alignSelf: 'flex-start' }}>
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* 6. AUDIT LOGS */}
          {activeSection === 'sectionAudit' && (
            <section className="admin-section active" id="sectionAudit">
              <div className="section-header-row" style={{ marginBottom: '1.5rem' }}>
                <h2 className="page-title" style={{ margin: 0, color: 'var(--admin-navy)', fontSize: '1.5rem' }}>Administrative Audit Logs</h2>
                <p style={{ color: 'var(--admin-gray-500)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                  Immutable audit trail recording all product mutations, status toggles, and logins.
                </p>
              </div>

              <div className="data-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Entity</th>
                        <th>Details</th>
                        <th>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '0.85rem', color: 'var(--admin-gray-500)' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td><strong>{log.username || 'system'}</strong></td>
                          <td><span className="badge badge-orange">{log.action}</span></td>
                          <td>{log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}</td>
                          <td style={{ maxWidth: '300px' }}>{log.details}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{log.ip_address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* 7. INQUIRIES & LEADS MANAGEMENT */}
          {activeSection === 'sectionInquiries' && (
            <section className="admin-section active" id="sectionInquiries">
              <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 className="page-title" style={{ margin: 0, color: 'var(--admin-navy)', fontSize: '1.5rem' }}>Inquiries &amp; School Leads</h2>
                  <p style={{ color: 'var(--admin-gray-500)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                    Track, filter, and transition incoming quotations, teacher trials, and contact messages.
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="data-toolbar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid var(--admin-gray-200)' }}>
                <input
                  type="text"
                  placeholder="Search name, email, school..."
                  className="form-input"
                  style={{ minWidth: '220px', flex: 1 }}
                  value={inquirySearch}
                  onChange={e => setInquirySearch(e.target.value)}
                />
                <select
                  className="form-select"
                  value={inquiryType}
                  onChange={e => setInquiryType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="quote">School Quotations</option>
                  <option value="trial">Teacher Trial Kits</option>
                  <option value="contact">Contact Inquiries</option>
                  <option value="newsletter">Newsletters</option>
                </select>
                <select
                  className="form-select"
                  value={inquiryStatus}
                  onChange={e => setInquiryStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="data-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Contact</th>
                        <th>School / Org</th>
                        <th>Subject / Message</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.map(inq => (
                        <tr key={inq.id}>
                          <td style={{ fontSize: '0.85rem', color: 'var(--admin-gray-500)' }}>
                            {new Date(inq.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <span className={`badge ${inq.type === 'quote' ? 'badge-orange' : inq.type === 'trial' ? 'badge-green' : 'badge-gray'}`}>
                              {inq.type}
                            </span>
                          </td>
                          <td>
                            <strong>{inq.name || 'Anonymous'}</strong><br />
                            <a href={`mailto:${inq.email}`} style={{ fontSize: '0.85rem', color: 'var(--admin-primary)' }}>{inq.email}</a>
                          </td>
                          <td>{inq.organization || '—'}</td>
                          <td style={{ maxWidth: '280px' }}>
                            <strong>{inq.subject}</strong>
                            <div style={{ fontSize: '0.85rem', color: 'var(--admin-gray-600)', marginTop: '2px' }}>{inq.message}</div>
                          </td>
                          <td>
                            <select
                              className="form-select"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                              value={inq.status}
                              onChange={e => handleUpdateInquiryStatus(inq.id, e.target.value)}
                            >
                              <option value="new">New</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="archived">Archived</option>
                            </select>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteInquiry(inq.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* PRODUCT EDITOR MODAL */}
      {isProductModalOpen && (
        <div className="admin-modal-overlay open" style={{ display: 'flex' }} onClick={() => setIsProductModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--admin-navy)' }}>
                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product'}
              </h3>
              <button type="button" className="cart-close-btn" onClick={() => setIsProductModalOpen(false)} aria-label="Close modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    id="editProdName"
                    className="form-input"
                    required
                    value={prodForm.name}
                    onChange={e => setProdForm({ ...prodForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input
                    type="text"
                    id="editProdSku"
                    className="form-input"
                    required
                    value={prodForm.sku}
                    onChange={e => setProdForm({ ...prodForm, sku: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Short Name</label>
                  <input
                    type="text"
                    id="editProdShortName"
                    className="form-input"
                    value={prodForm.short_name}
                    onChange={e => setProdForm({ ...prodForm, short_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Series</label>
                  <select
                    id="editProdSeries"
                    className="form-select"
                    value={prodForm.series}
                    onChange={e => setProdForm({ ...prodForm, series: e.target.value })}
                  >
                    <option value="Explorer Series">Explorer Series</option>
                    <option value="Education Series">Education Series</option>
                    <option value="Inventor Series">Inventor Series</option>
                    <option value="Maker Series">Maker Series</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Badge</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Bestseller, Popular..."
                    value={prodForm.badge}
                    onChange={e => setProdForm({ ...prodForm, badge: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price (INR ₹) *</label>
                  <input
                    type="number"
                    id="editProdPrice"
                    className="form-input"
                    required
                    value={prodForm.price}
                    onChange={e => setProdForm({ ...prodForm, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Original / Sale Price</label>
                  <input
                    type="number"
                    className="form-input"
                    value={prodForm.sale_price}
                    onChange={e => setProdForm({ ...prodForm, sale_price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={prodForm.stock_quantity}
                    onChange={e => setProdForm({ ...prodForm, stock_quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>OSEMI Product URL (Purchasing Link)</span>
                  <span style={{ fontSize: '0.75rem', color: prodForm.osemi_url ? '#16a34a' : 'var(--admin-gray-400)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    {prodForm.osemi_url && <IconCheck size={12} />}
                    <span>{prodForm.osemi_url ? 'Link Configured' : 'Optional (Must start with https://)'}</span>
                  </span>
                </label>
                <input
                  type="url"
                  id="editProdOsemiUrl"
                  className="form-input"
                  placeholder="https://osemi.in/product/oxybott-robot-arm"
                  value={prodForm.osemi_url}
                  onChange={e => setProdForm({ ...prodForm, osemi_url: e.target.value })}
                />
                <small style={{ color: 'var(--admin-gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Visitors clicking &quot;Buy on OSEMI&quot; on the website will be redirected to this link.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Tagline</label>
                <input
                  type="text"
                  className="form-input"
                  value={prodForm.tagline}
                  onChange={e => setProdForm({ ...prodForm, tagline: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={prodForm.description}
                  onChange={e => setProdForm({ ...prodForm, description: e.target.value })}
                ></textarea>
              </div>

              {/* IMAGES GALLERY MANAGEMENT (if editing) */}
              {editingProduct && (
                <div style={{ border: '1px solid var(--admin-gray-200)', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Product Images Gallery</label>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
                    {productImages.map(img => (
                      <div key={img.id} style={{ position: 'relative', border: img.is_main ? '2px solid var(--admin-primary)' : '1px solid #cbd5e1', borderRadius: '8px', padding: '4px', background: '#fff' }}>
                        <img src={img.image_url} alt="" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                          {!img.is_main && (
                            <button
                              type="button"
                              style={{ fontSize: '0.7rem', padding: '2px 4px', cursor: 'pointer' }}
                              onClick={() => handleSetMainImage(img.id)}
                            >
                              Set Main
                            </button>
                          )}
                          <button
                            type="button"
                            style={{ fontSize: '0.7rem', padding: '2px 4px', color: 'var(--admin-red)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                            onClick={() => handleDeleteImage(img.id)}
                            title="Delete Photo"
                          >
                            <IconTrash size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Upload New Photos:</label>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'block', marginTop: '4px' }} />
                  </div>
                </div>
              )}

              {/* PRODUCT DOCUMENTS, VIDEOS & TUTORIALS MANAGEMENT */}
              {editingProduct && (
                <div style={{ border: '1px solid var(--admin-gray-200)', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Product Tutorials, Videos &amp; PDF Guides</label>
                    <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      {productDocuments.length} Attached
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--admin-gray-500)', marginBottom: '0.75rem' }}>
                    Attach PDF assembly guides, YouTube video tutorial links, or upload direct video files (.mp4/.webm).
                  </p>

                  {/* Mode switcher tabs */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => { setDocMode('pdf'); setDocFile(null); setDocForm({ ...docForm, type: 'tutorial' }); }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: docMode === 'pdf' ? '1px solid var(--admin-primary)' : '1px solid #cbd5e1',
                        background: docMode === 'pdf' ? 'var(--admin-primary)' : '#fff',
                        color: docMode === 'pdf' ? '#fff' : '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <IconFileText size={14} />
                      <span>Upload PDF Guide</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDocMode('video_url'); setDocFile(null); setDocForm({ ...docForm, type: 'video_tutorial' }); }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: docMode === 'video_url' ? '1px solid #dc2626' : '1px solid #cbd5e1',
                        background: docMode === 'video_url' ? '#dc2626' : '#fff',
                        color: docMode === 'video_url' ? '#fff' : '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <IconVideo size={14} />
                      <span>YouTube / Video Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDocMode('video_file'); setDocFile(null); setDocForm({ ...docForm, type: 'video_tutorial' }); }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: docMode === 'video_file' ? '1px solid #7c3aed' : '1px solid #cbd5e1',
                        background: docMode === 'video_file' ? '#7c3aed' : '#fff',
                        color: docMode === 'video_file' ? '#fff' : '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <IconVideo size={14} />
                      <span>Upload Video File (MP4/WebM)</span>
                    </button>
                  </div>

                  {/* Add Resource Form Box */}
                  <div style={{ background: '#fff', border: '1px dashed var(--admin-primary)', borderRadius: '6px', padding: '0.85rem', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-primary)', marginBottom: '0.5rem' }}>
                      {docMode === 'pdf' && '+ Upload New PDF Manual / Guide:'}
                      {docMode === 'video_url' && '+ Add YouTube / External Video Tutorial Link:'}
                      {docMode === 'video_file' && '+ Upload Video File (.mp4, .webm, max 150MB):'}
                    </div>

                    {/* Mode 1: PDF Document Upload */}
                    {docMode === 'pdf' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr auto', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Document Title *</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            placeholder="e.g. 4-DOF Assembly Guide v2.0"
                            value={docForm.title}
                            onChange={e => setDocForm({ ...docForm, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Document Type *</label>
                          <select
                            className="form-select"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            value={docForm.type}
                            onChange={e => setDocForm({ ...docForm, type: e.target.value })}
                          >
                            <option value="tutorial">Tutorial</option>
                            <option value="assembly_guide">Assembly Guide</option>
                            <option value="curriculum">Curriculum</option>
                            <option value="datasheet">Datasheet</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>PDF File (.pdf) *</label>
                          <input
                            type="file"
                            id="adminDocFileInput"
                            accept=".pdf,application/pdf"
                            style={{ fontSize: '0.75rem', width: '100%' }}
                            onChange={e => setDocFile(e.target.files[0] || null)}
                          />
                        </div>
                        <div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                            onClick={handleUploadDocument}
                            disabled={docUploading || !docFile || !docForm.title.trim()}
                          >
                            {docUploading ? 'Uploading...' : 'Upload PDF'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mode 2: YouTube / Video URL Link */}
                    {docMode === 'video_url' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 3fr auto', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Video Tutorial Title *</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            placeholder="e.g. Robot Arm Wiring & Calibration Video"
                            value={docForm.title}
                            onChange={e => setDocForm({ ...docForm, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Tutorial Type *</label>
                          <select
                            className="form-select"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            value={docForm.type}
                            onChange={e => setDocForm({ ...docForm, type: e.target.value })}
                          >
                            <option value="video_tutorial">Video Tutorial</option>
                            <option value="assembly_guide">Assembly Video</option>
                            <option value="curriculum">Classroom Lesson</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>YouTube or Video URL *</label>
                          <input
                            type="url"
                            className="form-input"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                            value={docForm.video_url || ''}
                            onChange={e => setDocForm({ ...docForm, video_url: e.target.value })}
                          />
                        </div>
                        <div>
                          <button
                            type="button"
                            className="btn btn-orange"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                            onClick={handleUploadDocument}
                            disabled={docUploading || !(docForm.video_url || '').trim() || !docForm.title.trim()}
                          >
                            {docUploading ? 'Saving...' : 'Save Video Link'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mode 3: Direct Video File Upload */}
                    {docMode === 'video_file' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr auto', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Video Title *</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            placeholder="e.g. Servo Testing & Gait Demo"
                            value={docForm.title}
                            onChange={e => setDocForm({ ...docForm, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Video Type *</label>
                          <select
                            className="form-select"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            value={docForm.type}
                            onChange={e => setDocForm({ ...docForm, type: e.target.value })}
                          >
                            <option value="video_tutorial">Video Tutorial</option>
                            <option value="assembly_guide">Assembly Walkthrough</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Video File (.mp4, .webm) *</label>
                          <input
                            type="file"
                            id="adminDocFileInput"
                            accept=".mp4,.webm,.mov,video/*"
                            style={{ fontSize: '0.75rem', width: '100%' }}
                            onChange={e => setDocFile(e.target.files[0] || null)}
                          />
                        </div>
                        <div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap', background: '#7c3aed', borderColor: '#7c3aed' }}
                            onClick={handleUploadDocument}
                            disabled={docUploading || !docFile || !docForm.title.trim()}
                          >
                            {docUploading ? 'Uploading Video...' : 'Upload Video File'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Existing documents & videos list */}
                  {productDocuments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '0.75rem', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', color: 'var(--admin-gray-400)', fontSize: '0.8rem' }}>
                      No tutorials, videos, or documents uploaded yet for this product.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {productDocuments.map(doc => {
                        const isVideoLink = !!doc.video_url && !doc.file_path;
                        const isVideoFile = !!doc.file_path && (doc.mime_type?.startsWith('video/') || doc.file_path.includes('/videos/'));
                        const isPdf = !isVideoLink && !isVideoFile;

                        return (
                          <div
                            key={doc.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#fff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '0.5rem 0.75rem'
                            }}
                          >
                            <div style={{ flex: 1, marginRight: '0.75rem' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--admin-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: isVideoLink ? '#dc2626' : isVideoFile ? '#7c3aed' : 'var(--admin-primary)', display: 'flex', alignItems: 'center' }}>
                                  {isVideoLink || isVideoFile ? <IconVideo size={16} /> : <IconFileText size={16} />}
                                </span>
                                <span>{doc.document_title}</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--admin-gray-500)', display: 'flex', gap: '0.5rem', marginTop: '2px', flexWrap: 'wrap' }}>
                                <span style={{
                                  background: isVideoLink ? '#fee2e2' : isVideoFile ? '#ede9fe' : (doc.document_type === 'assembly_guide' ? '#dbeafe' : '#fef3c7'),
                                  color: isVideoLink ? '#b91c1c' : isVideoFile ? '#6d28d9' : (doc.document_type === 'assembly_guide' ? '#1e40af' : '#92400e'),
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  textTransform: 'capitalize'
                                }}>
                                  {isVideoLink ? 'YouTube Link' : isVideoFile ? 'Video File' : (doc.document_type || 'PDF Guide').replace('_', ' ')}
                                </span>
                                {doc.file_size > 0 && <span>• {(doc.file_size / (1024 * 1024)).toFixed(2)} MB</span>}
                                {isVideoLink && <span style={{ color: '#2563eb', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>• {doc.video_url}</span>}
                                <span>• {new Date(doc.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                              {isVideoLink ? (
                                <a
                                  href={doc.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-outline"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', textDecoration: 'none', color: '#dc2626', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <span>Watch Video</span>
                                  <IconExternalLink size={11} />
                                </a>
                              ) : isVideoFile ? (
                                <>
                                  <a
                                    href={doc.file_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', textDecoration: 'none', color: '#7c3aed', borderColor: '#c4b5fd', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <span>Play Video</span>
                                    <IconPlay size={10} />
                                  </a>
                                  <label
                                    className="btn btn-outline"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', margin: 0 }}
                                  >
                                    Replace
                                    <input
                                      type="file"
                                      accept=".mp4,.webm,.mov,video/*"
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                          handleReplaceDocument(doc.id, e.target.files[0], doc.document_title, doc.document_type);
                                        }
                                      }}
                                    />
                                  </label>
                                </>
                              ) : (
                                <>
                                  <a
                                    href={doc.file_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <span>View PDF</span>
                                    <IconExternalLink size={11} />
                                  </a>
                                  <label
                                    className="btn btn-outline"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', margin: 0 }}
                                  >
                                    Replace
                                    <input
                                      type="file"
                                      accept=".pdf,application/pdf"
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                          handleReplaceDocument(doc.id, e.target.files[0], doc.document_title, doc.document_type);
                                        }
                                      }}
                                    />
                                  </label>
                                </>
                              )}
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', color: '#dc2626', borderColor: '#fca5a5' }}
                                onClick={() => handleDeleteDocument(doc.id, doc.document_title)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsProductModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCatModalOpen && (
        <div className="admin-modal-overlay open" style={{ display: 'flex' }} onClick={() => setIsCatModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingCategory ? 'Edit Category' : 'New Category'}</h3>
              <button type="button" className="cart-close-btn" onClick={() => setIsCatModalOpen(false)} aria-label="Close modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={catForm.name}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Slug</label>
                <input
                  type="text"
                  className="form-input"
                  value={catForm.slug}
                  onChange={e => setCatForm({ ...catForm, slug: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={catForm.description}
                  onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                ></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsCatModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANNER MODAL */}
      {isBannerModalOpen && (
        <div className="admin-modal-overlay open" style={{ display: 'flex' }} onClick={() => setIsBannerModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingBanner ? 'Edit Banner' : 'New Banner'}</h3>
              <button type="button" className="cart-close-btn" onClick={() => setIsBannerModalOpen(false)} aria-label="Close modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveBanner} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Banner Headline *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={bannerForm.title}
                  onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitle</label>
                <input
                  type="text"
                  className="form-input"
                  value={bannerForm.subtitle}
                  onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">CTA Link</label>
                <input
                  type="text"
                  className="form-input"
                  value={bannerForm.cta_link}
                  onChange={e => setBannerForm({ ...bannerForm, cta_link: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsBannerModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Banner</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TUTORIAL MODAL (Option 1: Manual Upload, Option 2: Fetch from Product) */}
      {isTutorialModalOpen && (
        <div className="admin-modal-overlay open" style={{ display: 'flex' }} onClick={() => setIsTutorialModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
              <div>
                <h3 style={{ margin: 0 }}>{editingTutorial ? 'Edit Tutorial' : 'Add New Tutorial'}</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--admin-gray-500)' }}>
                  {editingTutorial ? 'Update tutorial details, video link, or product connection' : 'Choose to upload manually or fetch details automatically from an existing product'}
                </p>
              </div>
              <button type="button" className="cart-close-btn" onClick={() => setIsTutorialModalOpen(false)} aria-label="Close modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconX size={18} />
              </button>
            </div>

            {/* Mode Switcher Tabs for Creating New Tutorial */}
            {!editingTutorial && (
              <div style={{ display: 'flex', borderBottom: '1px solid var(--admin-gray-200)', background: '#f8fafc', padding: '0.5rem 1.5rem 0' }}>
                <button
                  type="button"
                  onClick={() => setTutorialTab('manual')}
                  style={{
                    padding: '0.65rem 1.25rem',
                    border: 'none',
                    borderBottom: tutorialTab === 'manual' ? '2px solid var(--admin-primary)' : '2px solid transparent',
                    background: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: tutorialTab === 'manual' ? 'var(--admin-primary)' : 'var(--admin-gray-500)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Option 1: Manual Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTutorialTab('fetch')}
                  style={{
                    padding: '0.65rem 1.25rem',
                    border: 'none',
                    borderBottom: tutorialTab === 'fetch' ? '2px solid var(--admin-primary)' : '2px solid transparent',
                    background: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: tutorialTab === 'fetch' ? 'var(--admin-primary)' : 'var(--admin-gray-500)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <IconLightning size={14} />
                  <span>Option 2: Fetch from Product</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSaveTutorial} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Option 2 Special Block: Fetch from Product */}
              {tutorialTab === 'fetch' && !editingTutorial && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconLightning size={15} />
                    <span>Quick Import from Product Catalog</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#15803d', margin: '0 0 0.75rem 0' }}>
                    Select a product to automatically extract its name, thumbnail, kit link, and attached video/documents.
                  </p>

                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Select Product to Fetch From *</label>
                    <select
                      className="form-select"
                      value={fetchProductId}
                      onChange={e => handleSelectFetchProduct(e.target.value)}
                    >
                      <option value="">-- Choose a Robotics Kit / Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {fetchingProductData && (
                    <div style={{ fontSize: '0.8rem', color: '#166534', padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IconClock size={14} />
                      <span>Fetching product documents and videos...</span>
                    </div>
                  )}

                  {fetchedProductInfo && (
                    <div style={{ marginTop: '0.75rem', background: '#fff', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <img
                          src={formatImgSrc(fetchedProductInfo.suggested_thumbnail)}
                          alt=""
                          style={{ width: '50px', height: '50px', objectFit: 'contain', background: '#0c2340', borderRadius: '4px', padding: '2px' }}
                        />
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--admin-navy)' }}>{fetchedProductInfo.product.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--admin-gray-500)' }}>
                            SKU: {fetchedProductInfo.product.sku} • Linked to product page
                          </div>
                        </div>
                      </div>

                      {/* Video attachments found */}
                      {fetchedProductInfo.video_docs?.length > 0 ? (
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f0fdf4' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                            Attached Videos Found on Product:
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                            {fetchedProductInfo.video_docs.map(vd => (
                              <div
                                key={vd.id}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', fontSize: '0.78rem' }}
                              >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '350px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  {vd.video_url ? <IconYouTube size={14} style={{ color: '#ef4444' }} /> : <IconVideo size={14} style={{ color: '#0284c7' }} />}
                                  <span>{vd.video_url ? 'YouTube: ' : 'File: '} {vd.document_title}</span>
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                                  onClick={() => {
                                    setTutForm(prev => ({
                                      ...prev,
                                      video_url: vd.video_url || '',
                                      video_file_path: vd.file_path || ''
                                    }));
                                    showToast('Applied video to tutorial form!');
                                  }}
                                >
                                  Use This Video
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#854d0e', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconInfo size={14} />
                          <span>No videos were previously attached to this product in admin. You can enter a YouTube link or upload a video file below.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Form Fields (Works for both Manual and Fetched) */}
              <div className="form-group">
                <label className="form-label">Tutorial Title *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Oxybott QD022 4-DOF Robot Arm Mechanical Assembly & Servo Zeroing"
                  value={tutForm.title}
                  onChange={e => setTutForm({ ...tutForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Lesson Tag / Duration *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Lesson 01 • 24 Mins"
                    value={tutForm.lesson_tag}
                    onChange={e => setTutForm({ ...tutForm, lesson_tag: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Associated Product (Kit Details Link)</label>
                  <select
                    className="form-select"
                    value={tutForm.product_id || ''}
                    onChange={e => {
                      const prodId = e.target.value;
                      const selected = products.find(p => p.id === prodId);
                      setTutForm({
                        ...tutForm,
                        product_id: prodId,
                        thumbnail_url: !tutForm.thumbnail_url && selected?.main_image ? selected.main_image : tutForm.thumbnail_url
                      });
                    }}
                  >
                    <option value="">-- Standalone (No Product Link) --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Lesson Overview</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Brief summary of what students and makers will build and learn in this video tutorial..."
                  value={tutForm.description}
                  onChange={e => setTutForm({ ...tutForm, description: e.target.value })}
                ></textarea>
              </div>

              {/* Video Source Configuration */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--admin-gray-200)', borderRadius: '8px', padding: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconVideo size={16} />
                  <span>Video Source (YouTube Link or Direct Video File)</span>
                </label>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    YouTube or External Video URL:
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={tutForm.video_url || ''}
                    onChange={e => setTutForm({ ...tutForm, video_url: e.target.value })}
                  />
                  <small style={{ color: 'var(--admin-gray-500)', fontSize: '0.72rem', marginTop: '2px', display: 'block' }}>
                    Plays in an embedded YouTube player without taking up your server storage.
                  </small>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Or Upload Direct Video File (.mp4, .webm, max 150MB):
                  </label>
                  <input
                    type="file"
                    accept=".mp4,.webm,.mov,video/*"
                    style={{ fontSize: '0.8rem' }}
                    onChange={e => setTutFile(e.target.files?.[0] || null)}
                  />
                  {tutForm.video_file_path && !tutFile && (
                    <div style={{ fontSize: '0.75rem', color: '#7c3aed', marginTop: '4px' }}>
                      Current uploaded video: <code>{tutForm.video_file_path}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnail Configuration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div className="form-group">
                  <label className="form-label">Thumbnail Image URL</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="/assets/images/qd022-robot-arm.png"
                    value={tutForm.thumbnail_url || ''}
                    onChange={e => setTutForm({ ...tutForm, thumbnail_url: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={tutForm.sort_order}
                    onChange={e => setTutForm({ ...tutForm, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="tutIsPublished"
                  checked={!!tutForm.is_published}
                  onChange={e => setTutForm({ ...tutForm, is_published: e.target.checked })}
                />
                <label htmlFor="tutIsPublished" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-navy)', cursor: 'pointer' }}>
                  Publish tutorial immediately on website Tutorials page
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--admin-gray-200)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsTutorialModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={tutSaving}>
                  {tutSaving ? 'Saving Tutorial...' : editingTutorial ? 'Update Tutorial' : 'Save Tutorial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

