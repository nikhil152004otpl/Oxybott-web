const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/db');

// Core products data definition
const DEFAULT_CATEGORIES = [
  { name: 'Explorer Series', slug: 'explorer-series', description: 'For beginners & kids ages 8-12. Drag-and-drop block coding.', sort_order: 1 },
  { name: 'Education Series', slug: 'education-series', description: 'Classroom curriculum kits, magnetic display systems & teacher slides.', sort_order: 2 },
  { name: 'Inventor Series', slug: 'inventor-series', description: 'Advanced 4-DOF arms, biped walkers, and 8-servo spider robots.', sort_order: 3 },
  { name: 'Maker Series', slug: 'maker-series', description: 'ESP32 development boards, 37-in-1 sensor kits & electronics prototyping.', sort_order: 4 },
  { name: 'Robotics', slug: 'robotics', description: 'Mecanum coding cars, programmable arms, and bio-inspired robotics.', sort_order: 5 },
  { name: 'Smart IoT', slug: 'smart-iot', description: 'Weather stations, RFID home security, and greenhouse IoT systems.', sort_order: 6 },
  { name: 'Classroom Sets', slug: 'classroom-sets', description: 'Complete turnkey classroom solutions for schools and districts.', sort_order: 7 },
  { name: 'Electronics', slug: 'electronics', description: 'Microcontrollers, sensors, actuators, and breadboard labs.', sort_order: 8 }
];

const DEFAULT_SETTINGS = [
  { key: 'currency_code', value: 'INR' },
  { key: 'currency_symbol', value: '₹' },
  { key: 'store_name', value: 'Oxybott STEM Robotics' },
  { key: 'announcement', value: 'ESP32 EDUCATION SOLUTIONS INNOVATOR • Focus on Smart Robotics & Coding Kits!' },
  { key: 'contact_email', value: 'education@oxybott.com' },
  { key: 'support_email', value: 'support@oxybott.com' },
  { key: 'phone', value: '+1 (800) 555-OXYBOTT' },
  { key: 'free_shipping_threshold', value: '2999' },
  { key: 'seo_title', value: 'Oxybott: Leading Brand for STEM Kits, ESP32 Kits & Robot Kits' },
  { key: 'seo_description', value: 'Oxybott is a trusted brand for STEAM Kits, ESP32 Kits, and Robot Kits, designed to inspire hands-on learning in STEM education.' }
];

async function seedDatabase() {
  console.log('=== Initializing PostgreSQL Database Seed ===');

  await transaction(async (client) => {
    // 1. Admin User
    const adminRes = await client.query('SELECT id FROM admin_users WHERE username = $1', ['admin']);
    if (adminRes.rowCount === 0) {
      const hash = await bcrypt.hash('AdminPassword123!', 10);
      await client.query(`
        INSERT INTO admin_users (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
      `, ['admin', 'admin@oxybott.com', hash, 'admin']);
      console.log('✅ Created default admin account: admin / AdminPassword123!');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }

    // 2. Default Categories
    for (const c of DEFAULT_CATEGORIES) {
      await client.query(`
        INSERT INTO categories (name, slug, description, sort_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          sort_order = EXCLUDED.sort_order
      `, [c.name, c.slug, c.description, c.sort_order]);
    }
    console.log(`✅ Verified ${DEFAULT_CATEGORIES.length} default categories.`);

    // 3. Default Site Settings
    for (const s of DEFAULT_SETTINGS) {
      await client.query(`
        INSERT INTO site_settings (setting_key, setting_value)
        VALUES ($1, $2)
        ON CONFLICT (setting_key) DO UPDATE SET
          setting_value = EXCLUDED.setting_value
      `, [s.key, s.value]);
    }
    console.log('✅ Verified default site settings.');

    // 4. Default Hero Banner
    const bannerRes = await client.query('SELECT id FROM banners LIMIT 1');
    if (bannerRes.rowCount === 0) {
      await client.query(`
        INSERT INTO banners (title, subtitle, image_url, cta_text, cta_link, is_active, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'Build, Code & Innovate with Oxybott STEM Kits',
        'Ignite creativity in classrooms, maker labs, and at home with open-source ESP32 kits and OxyCode block programming.',
        'assets/images/qd022-robot-arm.png',
        'Explore All Kits',
        '/products',
        true,
        1
      ]);
      console.log('✅ Created default homepage hero banner.');
    }
  });

  console.log('=== Database Seeding Complete ===');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;

