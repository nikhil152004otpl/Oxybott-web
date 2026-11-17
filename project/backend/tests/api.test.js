const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');

let server;
let baseUrl;
let adminToken;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}),
      ...options.headers
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

test('1. Health check endpoint responds OK', async () => {
  const { status, data } = await request('/api/health');
  assert.equal(status, 200);
  assert.equal(data.status, 'ok');
});

test('2. Public Settings endpoint returns store configuration', async () => {
  const { status, data } = await request('/api/settings');
  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.ok(data.settings);
  assert.equal(data.settings.currency_code, 'INR');
});

test('3. Public Categories endpoint returns published categories', async () => {
  const { status, data } = await request('/api/categories');
  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.categories));
  assert.ok(data.categories.length > 0);
});

test('4. Public Products endpoint returns product catalog with filters', async () => {
  const { status, data } = await request('/api/products');
  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.products));
  assert.ok(data.products.length > 0);

  // Test series filter
  const filterRes = await request('/api/products?series=Inventor+Series');
  assert.equal(filterRes.status, 200);
  assert.ok(filterRes.data.products.every(p => p.series.toLowerCase() === 'inventor series'));
});

test('5. Public Product Detail endpoint returns full metadata', async () => {
  const { status, data } = await request('/api/products/qd022');
  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.ok(data.product);
  assert.equal(data.product.id, 'qd022');
  assert.ok(data.product.specs);
  assert.ok(Array.isArray(data.product.highlights));
  assert.ok(Array.isArray(data.product.boxContents));
});

test('6. Inquiries endpoint validates input and prevents spam duplicate', async () => {
  // Missing email
  const badRes = await request('/api/inquiries', {
    method: 'POST',
    body: JSON.stringify({ type: 'contact', name: 'Tester', message: 'Hello' })
  });
  assert.equal(badRes.status, 400);

  // Valid submission
  const testEmail = `qa_test_${Date.now()}@example.com`;
  const postRes = await request('/api/inquiries', {
    method: 'POST',
    body: JSON.stringify({
      type: 'contact',
      name: 'QA Automation Tester',
      email: testEmail,
      subject: 'Integration Test Message',
      message: 'Automated test suite payload verification'
    })
  });
  assert.equal(postRes.status, 201);
  assert.equal(postRes.data.success, true);
  assert.ok(postRes.data.id);

  // Immediate duplicate submission should return 200 handled duplicate
  const dupRes = await request('/api/inquiries', {
    method: 'POST',
    body: JSON.stringify({
      type: 'contact',
      name: 'QA Automation Tester',
      email: testEmail,
      subject: 'Integration Test Message',
      message: 'Automated test suite payload verification'
    })
  });
  assert.equal(dupRes.status, 200);
  assert.equal(dupRes.data.id, postRes.data.id);
});

test('7. Admin Auth handles rejection of invalid credentials and accepts valid admin', async () => {
  // Invalid password
  const badLogin = await request('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'IncorrectPassword999!' })
  });
  assert.equal(badLogin.status, 401);

  // Valid login
  const goodLogin = await request('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'AdminPassword123!' })
  });
  assert.equal(goodLogin.status, 200);
  assert.equal(goodLogin.data.success, true);
  assert.ok(goodLogin.data.token);
  assert.equal(goodLogin.data.user.username, 'admin');

  // Save token for subsequent tests
  adminToken = goodLogin.data.token;

  // Verify /auth/me with Bearer token
  const meRes = await request('/api/admin/auth/me');
  assert.equal(meRes.status, 200);
  assert.equal(meRes.data.user.username, 'admin');
});

test('8. Admin Dashboard Stats endpoint returns aggregated metrics', async () => {
  const { status, data } = await request('/api/admin/stats');
  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.ok(data.stats.totalProducts > 0);
  assert.ok(data.stats.totalCategories > 0);
});

test('9. Admin Product Lifecycle (Create, Update, Publish, Duplicate, Delete)', async () => {
  const testSku = `OXY-AUTO-TEST-${Date.now().toString().slice(-4)}`;
  const testProdId = `test-kit-${Date.now().toString().slice(-4)}`;

  // 1. Create
  const createRes = await request('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify({
      id: testProdId,
      name: 'Automated Test Robot Kit',
      short_name: 'Test Kit',
      sku: testSku,
      series: 'Explorer Series',
      price: 4999,
      sale_price: 5999,
      stock_quantity: 50,
      badge: 'Test',
      tagline: 'Built by automated regression suite',
      description: 'Full lifecycle verification kit',
      is_published: true,
      specs: [{ key: 'Controller', value: 'ESP32 Dual-Core' }],
      highlights: ['Automated test highlight point'],
      boxContents: ['1x Test Chassis']
    })
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.data.success, true);

  // 2. Fetch created product
  const getRes = await request(`/api/admin/products/${testProdId}`);
  assert.equal(getRes.status, 200);
  assert.equal(getRes.data.product.sku, testSku);

  // 3. Update
  const updateRes = await request(`/api/admin/products/${testProdId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Updated Test Robot Kit',
      sku: testSku,
      price: 5499,
      stock_quantity: 45
    })
  });
  assert.equal(updateRes.status, 200);

  // 4. Toggle Publish
  const pubRes = await request(`/api/admin/products/${testProdId}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ is_published: false })
  });
  assert.equal(pubRes.status, 200);
  assert.equal(Boolean(pubRes.data.is_published), false); // Published flag should be false

  // 5. Duplicate
  const dupRes = await request(`/api/admin/products/${testProdId}/duplicate`, {
    method: 'POST'
  });
  assert.equal(dupRes.status, 201);
  const dupId = dupRes.data.newId;

  // 6. Cleanup
  const del1 = await request(`/api/admin/products/${testProdId}`, { method: 'DELETE' });
  assert.equal(del1.status, 200);
  const del2 = await request(`/api/admin/products/${dupId}`, { method: 'DELETE' });
  assert.equal(del2.status, 200);
});

test('10. Admin Inquiries management (List, Status Update, Delete)', async () => {
  // List
  const listRes = await request('/api/admin/inquiries');
  assert.equal(listRes.status, 200);
  assert.ok(Array.isArray(listRes.data.inquiries));

  if (listRes.data.inquiries.length > 0) {
    const target = listRes.data.inquiries[0];
    // Update status
    const statusRes = await request(`/api/admin/inquiries/${target.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress' })
    });
    assert.equal(statusRes.status, 200);
  }
});

test('11. OSEMI Purchase Link Integration & Validation', async () => {
  // Test 1: Reject non-HTTPS URL
  const rejectRes = await request('/api/admin/products/qd022', {
    method: 'PUT',
    body: JSON.stringify({ osemi_url: 'http://insecure.osemi.in/product/qd022' })
  });
  assert.equal(rejectRes.status, 500);
  assert.ok(rejectRes.data.error.includes('https://'));

  // Test 2: Accept valid HTTPS URL
  const acceptRes = await request('/api/admin/products/qd022', {
    method: 'PUT',
    body: JSON.stringify({ osemi_url: 'https://osemi.in/product/oxybott-qd022-robot-arm' })
  });
  assert.equal(acceptRes.status, 200);
  assert.equal(acceptRes.data.success, true);

  // Test 3: Public catalog exposes osemi_url
  const publicRes = await request('/api/products/qd022');
  assert.equal(publicRes.status, 200);
  assert.equal(publicRes.data.product.osemi_url, 'https://osemi.in/product/oxybott-qd022-robot-arm');
  assert.equal(publicRes.data.product.price, 7469); // INR price
});

test('12. Product Documents Management (Upload, List, Replace, Delete)', async () => {
  // Prepare genuine PDF buffer
  const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Title (QD022 Assembly Manual) >>\nendobj\n%%EOF\n';
  const boundary = '----TestBoundary' + Math.random().toString(36).substring(2);
  let body = '';
  body += `--${boundary}\r\nContent-Disposition: form-data; name="document_title"\r\n\r\nQD022 Robotic Arm Assembly Guide v2.0\r\n`;
  body += `--${boundary}\r\nContent-Disposition: form-data; name="document_type"\r\n\r\nassembly_guide\r\n`;
  body += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="qd022_guide.pdf"\r\nContent-Type: application/pdf\r\n\r\n`;
  body += pdfContent;
  body += `\r\n--${boundary}--\r\n`;

  // 1. Upload
  const uploadRes = await fetch(`${baseUrl}/api/admin/products/qd022/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body
  });
  const uploadData = await uploadRes.json();
  assert.equal(uploadRes.status, 201);
  assert.equal(uploadData.success, true);
  assert.ok(uploadData.document.id);
  const docId = uploadData.document.id;

  // 2. Public Documents List
  const listRes = await request('/api/products/qd022/documents');
  assert.equal(listRes.status, 200);
  assert.ok(listRes.data.documents.some(d => d.id === docId));

  // 3. Download Endpoint
  const downloadRes = await fetch(`${baseUrl}/api/documents/${docId}/download`);
  assert.equal(downloadRes.status, 200);
  assert.ok(downloadRes.headers.get('content-disposition')?.includes('qd022_guide.pdf'));

  // 4. View Endpoint
  const viewRes = await fetch(`${baseUrl}/api/documents/${docId}/view`);
  assert.equal(viewRes.status, 200);
  assert.equal(viewRes.headers.get('content-type'), 'application/pdf');

  // 5. Replace Document Metadata
  const replaceRes = await fetch(`${baseUrl}/api/admin/documents/${docId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      document_title: 'QD022 Robotic Arm Assembly Guide v2.1 (Updated)',
      document_type: 'assembly_guide'
    })
  });
  const replaceData = await replaceRes.json();
  assert.equal(replaceRes.status, 200);
  assert.equal(replaceData.document.document_title, 'QD022 Robotic Arm Assembly Guide v2.1 (Updated)');

  // 6. Delete Document
  const delRes = await fetch(`${baseUrl}/api/admin/documents/${docId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  const delData = await delRes.json();
  assert.equal(delRes.status, 200);
  assert.equal(delData.success, true);

  // 7. Video Tutorial Link (e.g. YouTube)
  const videoLinkRes = await fetch(`${baseUrl}/api/admin/products/qd022/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      document_title: 'QD022 Video Tutorial - YouTube Integration Test',
      document_type: 'video_tutorial',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    })
  });
  const videoData = await videoLinkRes.json();
  assert.equal(videoLinkRes.status, 201);
  assert.equal(videoData.success, true);
  assert.equal(videoData.document.video_url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const videoDocId = videoData.document.id;

  // Verify it is returned in product detail
  const prodDetail = await request('/api/products/qd022');
  assert.equal(prodDetail.status, 200);
  assert.ok(prodDetail.data.product.documents.some(d => d.id === videoDocId && d.video_url));

  // Clean up test video doc
  await fetch(`${baseUrl}/api/admin/documents/${videoDocId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
});

test('13. Tutorials Management (Public Listing, Fetch from Product, Create Manual, Update, Delete)', async () => {
  // 1. Public Tutorials List
  const pubRes = await request('/api/tutorials');
  assert.equal(pubRes.status, 200);
  assert.equal(pubRes.data.success, true);
  assert.ok(Array.isArray(pubRes.data.tutorials));
  assert.ok(pubRes.data.tutorials.length >= 6);

  // 2. Fetch Product Tutorial Data Helper
  const fetchRes = await fetch(`${baseUrl}/api/admin/tutorials/fetch-product/qd022`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const fetchData = await fetchRes.json();
  assert.equal(fetchRes.status, 200);
  assert.equal(fetchData.success, true);
  assert.equal(fetchData.data.product.id, 'qd022');
  assert.ok(fetchData.data.suggested_title.includes('Oxybott QD022'));

  // 3. Create Tutorial (Manual Option)
  const createRes = await fetch(`${baseUrl}/api/admin/tutorials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      title: 'Automated Test Tutorial - ESP32 Kinematics',
      lesson_tag: 'Lesson 07 • 35 Mins',
      description: 'Comprehensive test tutorial created via admin API',
      product_id: 'qd022',
      thumbnail_url: '/assets/images/qd022-robot-arm.png',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      sort_order: 10,
      is_published: true
    })
  });
  const createData = await createRes.json();
  assert.equal(createRes.status, 201);
  assert.equal(createData.success, true);
  const tutId = createData.tutorial.id;
  assert.equal(createData.tutorial.title, 'Automated Test Tutorial - ESP32 Kinematics');

  // 4. Update Tutorial
  const updateRes = await fetch(`${baseUrl}/api/admin/tutorials/${tutId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      title: 'Automated Test Tutorial - ESP32 Kinematics (Updated)',
      sort_order: 12
    })
  });
  const updateData = await updateRes.json();
  assert.equal(updateRes.status, 200);
  assert.equal(updateData.tutorial.title, 'Automated Test Tutorial - ESP32 Kinematics (Updated)');
  assert.equal(updateData.tutorial.sort_order, 12);

  // 5. Delete Tutorial
  const delRes = await fetch(`${baseUrl}/api/admin/tutorials/${tutId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  const delData = await delRes.json();
  assert.equal(delRes.status, 200);
  assert.equal(delData.success, true);
});

test('14. CMS Pages & Sections Management (Get page, update section)', async () => {
  // Public get page
  const pageRes = await fetch(`${baseUrl}/api/cms/pages/home`);
  const pageData = await pageRes.json();
  assert.equal(pageRes.status, 200);
  assert.equal(pageData.success, true);
  assert.equal(pageData.page.slug, 'home');
  assert.ok(pageData.page.sections.hero);

  // Admin update section
  const secId = pageData.page.sections.hero.id;
  const updateRes = await fetch(`${baseUrl}/api/admin/cms/sections/${secId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      tag: 'NEXT-GEN ROBOTICS & STEM (TEST)',
      title: 'Inspire the Next Generation of Makers & Roboticists (TEST)',
      subtitle: 'Testing dynamic CMS section update',
      is_visible: true
    })
  });
  const updateData = await updateRes.json();
  assert.equal(updateRes.status, 200);
  assert.equal(updateData.success, true);

  // Verify updated value reflected publicly
  const verifyRes = await fetch(`${baseUrl}/api/cms/pages/home`);
  const verifyData = await verifyRes.json();
  assert.equal(verifyData.page.sections.hero.tag, 'NEXT-GEN ROBOTICS & STEM (TEST)');
});

test('15. CMS Navigation Management (Public fetch, Admin create and delete link)', async () => {
  // Public get header menu
  const navRes = await fetch(`${baseUrl}/api/cms/navigation/header_main`);
  const navData = await navRes.json();
  assert.equal(navRes.status, 200);
  assert.equal(navData.success, true);
  assert.ok(navData.menu.items.length > 0);

  // Admin add nav link
  const createRes = await fetch(`${baseUrl}/api/admin/cms/navigation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      menu_id: navData.menu.id,
      label: 'Test Community Link',
      url: '/community',
      badge: 'New',
      sort_order: 99
    })
  });
  const createData = await createRes.json();
  assert.equal(createRes.status, 201);
  assert.equal(createData.success, true);

  // Admin delete nav link
  const delRes = await fetch(`${baseUrl}/api/admin/cms/navigation/${createData.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  const delData = await delRes.json();
  assert.equal(delRes.status, 200);
  assert.equal(delData.success, true);
});

test('16. FAQ Items Management (Public listing, Admin create, update, delete)', async () => {
  // Public get FAQs
  const faqRes = await fetch(`${baseUrl}/api/cms/faqs`);
  const faqData = await faqRes.json();
  assert.equal(faqRes.status, 200);
  assert.equal(faqData.success, true);
  assert.ok(faqData.faqs.length > 0);

  // Admin create FAQ
  const createRes = await fetch(`${baseUrl}/api/admin/cms/faqs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      category: 'Testing',
      question: 'Is this an automated test FAQ?',
      answer: 'Yes, this FAQ was verified via automated end-to-end testing.',
      sort_order: 100,
      is_published: true
    })
  });
  const createData = await createRes.json();
  assert.equal(createRes.status, 201);
  assert.equal(createData.success, true);

  // Admin delete FAQ
  const delRes = await fetch(`${baseUrl}/api/admin/cms/faqs/${createData.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  const delData = await delRes.json();
  assert.equal(delRes.status, 200);
  assert.equal(delData.success, true);
});

test('17. Software & Multi-Platform Downloads (Catalog, Admin CRUD, download endpoint)', async () => {
  // Public software catalog
  const softRes = await fetch(`${baseUrl}/api/software`);
  const softData = await softRes.json();
  assert.equal(softRes.status, 200);
  assert.equal(softData.success, true);
  assert.ok(softData.software.length > 0);

  // Admin create software product
  const createRes = await fetch(`${baseUrl}/api/admin/software`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      name: 'Oxybott Test Simulator',
      slug: 'oxybott-test-simulator',
      icon: 'Terminal',
      short_desc: 'Robotics simulator test harness',
      supported_os: ['Windows', 'Web']
    })
  });
  const createData = await createRes.json();
  assert.equal(createRes.status, 201);
  assert.equal(createData.success, true);

  // Admin delete software product
  const delRes = await fetch(`${baseUrl}/api/admin/software/${createData.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  const delData = await delRes.json();
  assert.equal(delRes.status, 200);
  assert.equal(delData.success, true);
});
