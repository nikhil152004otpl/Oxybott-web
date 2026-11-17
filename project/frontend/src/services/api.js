/**
 * Oxybott Frontend API Client
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Anti-CSRF protection
    ...options.headers
  };

  // If body is FormData (e.g. image uploads), delete Content-Type so browser sets boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const token = localStorage.getItem('oxybott_admin_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: options.credentials || 'include'
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const StoreAPI = {
  getSettings: () => apiRequest('/settings'),
  getCategories: () => apiRequest('/categories'),
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/products${qs ? '?' + qs : ''}`);
  },
  getProduct: (idOrSlug) => apiRequest(`/products/${encodeURIComponent(idOrSlug)}`),
  getDocuments: (productId) => apiRequest(`/products/${encodeURIComponent(productId)}/documents`),
  getTutorials: () => apiRequest('/tutorials'),
  getTutorial: (id) => apiRequest(`/tutorials/${encodeURIComponent(id)}`),
  getBanners: () => apiRequest('/banners'),
  submitInquiry: (payload) => apiRequest('/inquiries', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
};

export const AdminAPI = {
  login: (username, password) => apiRequest('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  getMe: () => apiRequest('/admin/auth/me'),
  logout: () => apiRequest('/admin/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword, newPassword) => apiRequest('/admin/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  }),
  getStats: () => apiRequest('/admin/stats'),
  getAuditLogs: (limit = 50) => apiRequest(`/admin/audit-logs?limit=${limit}`),
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/products${qs ? '?' + qs : ''}`);
  },
  getProductById: (id) => apiRequest(`/admin/products/${encodeURIComponent(id)}`),
  createProduct: (productData) => apiRequest('/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  }),
  updateProduct: (id, productData) => apiRequest(`/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  }),
  togglePublish: (id, is_published) => apiRequest(`/admin/products/${encodeURIComponent(id)}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ is_published })
  }),
  duplicateProduct: (id) => apiRequest(`/admin/products/${encodeURIComponent(id)}/duplicate`, {
    method: 'POST'
  }),
  deleteProduct: (id) => apiRequest(`/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }),
  uploadImages: (id, formData) => apiRequest(`/admin/products/${encodeURIComponent(id)}/images`, {
    method: 'POST',
    body: formData
  }),
  setMainImage: (id, imageId) => apiRequest(`/admin/products/${encodeURIComponent(id)}/images/${imageId}/main`, {
    method: 'PATCH'
  }),
  deleteImage: (id, imageId) => apiRequest(`/admin/products/${encodeURIComponent(id)}/images/${imageId}`, {
    method: 'DELETE'
  }),
  getDocuments: (productId) => apiRequest(`/admin/products/${encodeURIComponent(productId)}/documents`),
  uploadDocument: (productId, dataOrFormData) => apiRequest(`/admin/products/${encodeURIComponent(productId)}/documents`, {
    method: 'POST',
    body: dataOrFormData instanceof FormData ? dataOrFormData : JSON.stringify(dataOrFormData)
  }),
  replaceDocument: (documentId, dataOrFormData) => apiRequest(`/admin/documents/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body: dataOrFormData instanceof FormData ? dataOrFormData : JSON.stringify(dataOrFormData)
  }),
  deleteDocument: (documentId) => apiRequest(`/admin/documents/${encodeURIComponent(documentId)}`, {
    method: 'DELETE'
  }),
  getCategories: () => apiRequest('/admin/categories'),
  createCategory: (catData) => apiRequest('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(catData)
  }),
  updateCategory: (id, catData) => apiRequest(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(catData)
  }),
  deleteCategory: (id) => apiRequest(`/admin/categories/${id}`, {
    method: 'DELETE'
  }),
  getBanners: () => apiRequest('/admin/banners'),
  createBanner: (bannerData) => apiRequest('/admin/banners', {
    method: 'POST',
    body: JSON.stringify(bannerData)
  }),
  updateBanner: (id, bannerData) => apiRequest(`/admin/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(bannerData)
  }),
  deleteBanner: (id) => apiRequest(`/admin/banners/${id}`, {
    method: 'DELETE'
  }),
  getSettings: () => apiRequest('/admin/settings'),
  updateSettings: (settings) => apiRequest('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings })
  }),
  getInquiries: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/inquiries${qs ? '?' + qs : ''}`);
  },
  updateInquiryStatus: (id, status) => apiRequest(`/admin/inquiries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  deleteInquiry: (id) => apiRequest(`/admin/inquiries/${id}`, {
    method: 'DELETE'
  }),
  getTutorials: () => apiRequest('/admin/tutorials'),
  getProductTutorialData: (productId) => apiRequest(`/admin/tutorials/fetch-product/${encodeURIComponent(productId)}`),
  createTutorial: (payloadOrFormData) => apiRequest('/admin/tutorials', {
    method: 'POST',
    body: payloadOrFormData instanceof FormData ? payloadOrFormData : JSON.stringify(payloadOrFormData)
  }),
  updateTutorial: (id, payloadOrFormData) => apiRequest(`/admin/tutorials/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payloadOrFormData instanceof FormData ? payloadOrFormData : JSON.stringify(payloadOrFormData)
  }),
  deleteTutorial: (id) => apiRequest(`/admin/tutorials/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
};

export const CMSAPI = {
  getPage: (slug) => apiRequest(`/cms/pages/${encodeURIComponent(slug)}`),
  getNavigation: (menuKey) => apiRequest(`/cms/navigation/${encodeURIComponent(menuKey)}`),
  getFaqs: (category = '') => apiRequest(`/cms/faqs${category ? '?category=' + encodeURIComponent(category) : ''}`),
  adminGetPages: () => apiRequest('/admin/cms/pages'),
  adminUpdatePage: (id, pageData) => apiRequest(`/admin/cms/pages/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(pageData)
  }),
  adminUpdateSection: (id, sectionData) => apiRequest(`/admin/cms/sections/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(sectionData)
  }),
  adminReorderSections: (orders) => apiRequest('/admin/cms/sections-reorder', {
    method: 'PUT',
    body: JSON.stringify({ orders })
  }),
  adminGetNavigation: () => apiRequest('/admin/cms/navigation'),
  adminCreateNavItem: (navData) => apiRequest('/admin/cms/navigation', {
    method: 'POST',
    body: JSON.stringify(navData)
  }),
  adminUpdateNavItem: (id, navData) => apiRequest(`/admin/cms/navigation/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(navData)
  }),
  adminDeleteNavItem: (id) => apiRequest(`/admin/cms/navigation/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }),
  adminGetFaqs: () => apiRequest('/admin/cms/faqs'),
  adminCreateFaq: (faqData) => apiRequest('/admin/cms/faqs', {
    method: 'POST',
    body: JSON.stringify(faqData)
  }),
  adminUpdateFaq: (id, faqData) => apiRequest(`/admin/cms/faqs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(faqData)
  }),
  adminDeleteFaq: (id) => apiRequest(`/admin/cms/faqs/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
};

export const SoftwareAPI = {
  getCatalog: () => apiRequest('/software'),
  getDownloadUrl: (releaseId) => `/api/software/download/${encodeURIComponent(releaseId)}`,
  adminGetAll: () => apiRequest('/admin/software'),
  adminCreate: (data) => apiRequest('/admin/software', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  adminUpdate: (id, data) => apiRequest(`/admin/software/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  adminDelete: (id) => apiRequest(`/admin/software/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }),
  adminAddRelease: (id, payloadOrFormData) => apiRequest(`/admin/software/${encodeURIComponent(id)}/releases`, {
    method: 'POST',
    body: payloadOrFormData instanceof FormData ? payloadOrFormData : JSON.stringify(payloadOrFormData)
  }),
  adminDeleteRelease: (releaseId) => apiRequest(`/admin/software/releases/${encodeURIComponent(releaseId)}`, {
    method: 'DELETE'
  })
};

export const MediaAPI = {
  adminGetAssets: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/media${qs ? '?' + qs : ''}`);
  },
  adminUpload: (formData) => apiRequest('/admin/media/upload', {
    method: 'POST',
    body: formData
  }),
  adminDelete: (id) => apiRequest(`/admin/media/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
};

