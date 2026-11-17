const { query, transaction } = require('../config/db');

async function seedCMS() {
  console.log('--- Starting CMS Architecture Seeding ---');

  // 1. Seed Pages
  const pages = [
    {
      id: 'page_home',
      slug: 'home',
      title: 'Home',
      meta_title: 'Oxybott: Leading Brand for STEM Kits, ESP32 Robotics & Coding Kits',
      meta_description: 'Oxybott is a premier global brand for ESP32 STEM Kits, Smart Robotics Kits, and Classroom Education Solutions. Inspiring hands-on learning for students, schools, and makers.'
    },
    {
      id: 'page_software',
      slug: 'software',
      title: 'Software & Robotics Ecosystem',
      meta_title: 'Software & Robotics Ecosystem | Oxybott',
      meta_description: 'Download OxyCode Studio, OxyBlock Mobile, and access open-source libraries for ESP32 robotics programming.'
    },
    {
      id: 'page_education',
      slug: 'education',
      title: 'STEM Education & School Lab Solutions',
      meta_title: 'Classroom STEM Education Solutions | Oxybott',
      meta_description: 'Turnkey robotics curriculum, trainer kits, and school lab setups powered by ESP32.'
    },
    {
      id: 'page_about',
      slug: 'about',
      title: 'About Oxybott',
      meta_title: 'About Oxybott | Pioneering STEM Robotics & ESP32 Learning',
      meta_description: 'Learn about Oxybott mission, engineering excellence, and hands-on robotics philosophy.'
    },
    {
      id: 'page_contact',
      slug: 'contact',
      title: 'Contact & Help Center',
      meta_title: 'Contact Us & Support Center | Oxybott',
      meta_description: 'Get in touch with Oxybott technical support, school lab sales, and order inquiries.'
    },
    {
      id: 'page_products',
      slug: 'products',
      title: 'Products Catalog',
      meta_title: 'STEM Robotics & Coding Kits Catalog | Oxybott',
      meta_description: 'Explore the full range of Oxybott ESP32 robotics kits, smart cars, robotic arms, and classroom bundles.'
    },
    {
      id: 'page_tutorials',
      slug: 'tutorials',
      title: 'Video Tutorials & Guides',
      meta_title: 'Oxybott Video Tutorials, Assembly Guides & Documentation',
      meta_description: 'Step-by-step video assembly walkthroughs, pinouts, and programming tutorials for Oxybott kits.'
    }
  ];

  for (const p of pages) {
    await query(`
      INSERT INTO pages (id, slug, title, meta_title, meta_description, is_published, updated_at)
      VALUES ($1, $2, $3, $4, $5, TRUE, CURRENT_TIMESTAMP)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        meta_title = EXCLUDED.meta_title,
        meta_description = EXCLUDED.meta_description,
        updated_at = CURRENT_TIMESTAMP
    `, [p.id, p.slug, p.title, p.meta_title, p.meta_description]);
  }
  console.log(`✅ Seeded ${pages.length} CMS pages.`);

  // 2. Seed Page Sections
  const sections = [
    // --- HOME SECTIONS ---
    {
      id: 'sec_home_hero',
      page_id: 'page_home',
      section_key: 'hero',
      section_type: 'hero',
      tag: 'NEXT-GEN ROBOTICS & STEM',
      title: 'Inspire the Next Generation of Makers & Roboticists',
      subtitle: 'Industrial-grade ESP32 microcontroller kits with drag-and-drop block coding, Arduino C++, and Python support.',
      description: 'Built for schools, hobbyists, and future engineers.',
      content_data: JSON.stringify({
        primaryBtn: { text: 'Explore STEM Kits', url: '/products' },
        secondaryBtn: { text: 'School Lab Solutions', url: '/education' },
        stats: [
          { value: '50,000+', label: 'Students Reached' },
          { value: '350+', label: 'Schools & Labs' },
          { value: '15+', label: 'Robotics Kits' },
          { value: '100%', label: 'Open Source' }
        ]
      }),
      sort_order: 1
    },
    {
      id: 'sec_home_features',
      page_id: 'page_home',
      section_key: 'features',
      section_type: 'features',
      tag: 'WHY CHOOSE OXYBOTT',
      title: 'Engineered for Practical Hands-On Learning',
      subtitle: 'Built from the ground up for real classroom innovation.',
      description: 'Explore the key pillars that set Oxybott apart from ordinary toy robotics.',
      content_data: JSON.stringify({
        items: [
          {
            icon: 'Cpu',
            title: 'ESP32 Dual-Core Power',
            desc: 'Equipped with authentic 240MHz dual-core microcontrollers, onboard Wi-Fi & Bluetooth BLE.'
          },
          {
            icon: 'Code',
            title: 'Tri-Lingual Code Progression',
            desc: 'Seamless transition from Scratch visual blocks to Arduino C++ and MicroPython.'
          },
          {
            icon: 'BookOpen',
            title: 'Turnkey Curriculum & Guides',
            desc: 'Every kit includes 20+ step-by-step curriculum lessons and interactive assembly videos.'
          },
          {
            icon: 'ShieldCheck',
            title: 'Classroom Tested & Safe',
            desc: 'Non-toxic, laser-precision components with reverse-polarity protection for student safety.'
          }
        ]
      }),
      sort_order: 2
    },
    {
      id: 'sec_home_software_spotlight',
      page_id: 'page_home',
      section_key: 'software_spotlight',
      section_type: 'software_spotlight',
      tag: 'CONNECTED TOOLCHAIN',
      title: 'OxyCode Studio: The Modern Robotics IDE',
      subtitle: 'Visual block logic meets professional C++ code generation in a single unified editor.',
      description: 'Zero driver installation required on Web Serial supported browsers.',
      content_data: JSON.stringify({
        codeTabs: [
          {
            lang: 'OxyCode Blocks',
            code: 'when start:\n  init_servos(4)\n  connect_wifi("Oxybott_Lab")\n  repeat forever:\n    telemetry.publish(arm.angles)'
          },
          {
            lang: 'Arduino C++',
            code: '#include <OxyArm.h>\nOxyArm robot(4);\nvoid setup() {\n  robot.begin();\n}\nvoid loop() {\n  robot.trackAngles();\n}'
          },
          {
            lang: 'MicroPython',
            code: 'import oxybott\narm = oxybott.RobotArm()\nwhile True:\n  arm.reach(x=120, y=85, z=50)'
          }
        ],
        primaryBtn: { text: 'Download OxyCode Free', url: '/software' }
      }),
      sort_order: 3
    },
    {
      id: 'sec_home_cta',
      page_id: 'page_home',
      section_key: 'cta',
      section_type: 'cta',
      tag: 'INSTITUTIONAL PARTNERSHIPS',
      title: 'Equip Your School or Makerspace with Oxybott',
      subtitle: 'Get special bulk discounts, customized school curricula, and dedicated teacher training sessions.',
      description: 'Contact our educational specialists for personalized lab planning.',
      content_data: JSON.stringify({
        primaryBtn: { text: 'Request Institutional Quote', action: 'open_quote_modal' },
        secondaryBtn: { text: 'Explore School Solutions', url: '/education' }
      }),
      sort_order: 4
    },

    // --- SOFTWARE SECTIONS ---
    {
      id: 'sec_soft_hero',
      page_id: 'page_software',
      section_key: 'hero',
      section_type: 'hero',
      tag: 'INTEGRATED SOFTWARE SUITE',
      title: 'Oxybott Code Studio & Robotics Toolchain',
      subtitle: 'Empowering learners to write block code, simulate sensors, and flash ESP32 firmware directly from the browser, desktop, or tablet.',
      description: 'Download official installers, mobile companion apps, and flash tools.',
      content_data: JSON.stringify({
        primaryBtn: { text: 'Launch Web Studio', url: 'https://studio.oxybott.com' },
        secondaryBtn: { text: 'View GitHub Repos', url: 'https://github.com/oxybott-robotics' }
      }),
      sort_order: 1
    },
    {
      id: 'sec_soft_features',
      page_id: 'page_software',
      section_key: 'features',
      section_type: 'features',
      tag: 'CAPABILITIES',
      title: 'A Complete Multi-Paradigm Development Environment',
      subtitle: 'Designed for students taking their first steps and university engineers building autonomous robots.',
      description: 'All software is 100% free, telemetry-enabled, and open-source.',
      content_data: JSON.stringify({
        items: [
          {
            title: 'Block-to-C++ Live Preview',
            desc: 'Watch clean Arduino C++ generate in real-time as you snap OxyCode visual blocks together.'
          },
          {
            title: '1-Click Web Serial Flashing',
            desc: 'Flash your ESP32 boards directly from Google Chrome or Edge via WebUSB without driver headaches.'
          },
          {
            title: 'Real-time Telemetry Graphing',
            desc: 'Plot sensor readings, ultrasonic distances, and servo kinematics on live 60fps dashboards.'
          },
          {
            title: 'Cross-Platform Ecosystem',
            desc: 'Native installers for Windows, macOS, Linux, and dedicated Android companion apps for Bluetooth remote control.'
          }
        ]
      }),
      sort_order: 2
    },

    // --- EDUCATION SECTIONS ---
    {
      id: 'sec_edu_hero',
      page_id: 'page_education',
      section_key: 'hero',
      section_type: 'hero',
      tag: 'STEM & AI SCHOOL SOLUTIONS',
      title: 'Future-Proof Your STEM Classroom with ESP32 Robotics',
      subtitle: 'Turnkey robotics labs, mapped curriculum from Grade 6 to 12, and comprehensive professional teacher development.',
      description: 'Aligned with NEP 2020 experiential learning standards.',
      content_data: JSON.stringify({
        primaryBtn: { text: 'Request School Quote', action: 'open_quote_modal' },
        secondaryBtn: { text: 'Download Curriculum Map (PDF)', url: '/uploads/documents/oxybott_curriculum.pdf' }
      }),
      sort_order: 1
    },
    {
      id: 'sec_edu_stages',
      page_id: 'page_education',
      section_key: 'stages',
      section_type: 'stages',
      tag: 'LEARNING PATHWAYS',
      title: 'Grade-Wise Robotics Progression',
      subtitle: 'Designed to build cognitive thinking, computational logic, and mechanical intuition year over year.',
      description: 'Structured from beginner visual coding through industrial embedded IoT.',
      content_data: JSON.stringify({
        stages: [
          {
            level: 'Stage 1 (Grades 6-8)',
            title: 'Foundational Mechatronics',
            desc: 'Hands-on assembly of smart cars and sensor arrays with visual drag-and-drop block coding.'
          },
          {
            level: 'Stage 2 (Grades 9-10)',
            title: 'IoT & Environmental Sensing',
            desc: 'Cloud data logging, weather station telemetry, and smart home automation using Arduino C++.'
          },
          {
            level: 'Stage 3 (Grades 11-12 & Makers)',
            title: 'Advanced Kinematics & Bio-Robotics',
            desc: 'Inverse kinematics for 4-DOF robot arms, 8-servo quadruped spiders, and MicroPython firmware.'
          }
        ]
      }),
      sort_order: 2
    },
    {
      id: 'sec_edu_labs',
      page_id: 'page_education',
      section_key: 'labs',
      section_type: 'labs',
      tag: 'CLASSROOM PACKS',
      title: 'Turnkey Lab Bundles',
      subtitle: 'Everything needed to outfit a classroom of 20 to 50 students with zero hassle.',
      description: 'Includes teacher training, replacement spares, and curriculum access.',
      content_data: JSON.stringify({
        bundles: [
          {
            name: 'Starter STEM Lab (10 Kits)',
            students: '20 Students',
            desc: 'Includes 10x QD001 Smart Cars, 10x Battery Packs, Teacher Guide, and 12-Month Support.'
          },
          {
            name: 'Advanced Robotics Lab (20 Kits)',
            students: '40 Students',
            desc: 'Mix of 4-DOF Robot Arms, Spider Bots, Weather Stations, and full curriculum lesson plans.'
          },
          {
            name: 'District Innovation Hub (50 Kits)',
            students: '100+ Students',
            desc: 'Complete ecosystem with professional teacher workshops, spare parts kits, and competition arena.'
          }
        ]
      }),
      sort_order: 3
    },

    // --- ABOUT SECTIONS ---
    {
      id: 'sec_about_hero',
      page_id: 'page_about',
      section_key: 'hero',
      section_type: 'hero',
      tag: 'OUR MISSION',
      title: 'Democratizing Cutting-Edge Robotics Education',
      subtitle: 'We bridge the gap between toy hobby kits and industrial robotics by putting real dual-core ESP32 microcontrollers in the hands of young makers.',
      description: 'Hands-on hardware engineered for the next wave of innovators.',
      content_data: JSON.stringify({
        stats: [
          { number: '2021', label: 'Founded' },
          { number: '15+', label: 'STEM Robotic Kits' },
          { number: '350+', label: 'Partner Schools' },
          { number: '100%', label: 'Open Hardware Philosophy' }
        ]
      }),
      sort_order: 1
    },
    {
      id: 'sec_about_story',
      page_id: 'page_about',
      section_key: 'story',
      section_type: 'story',
      tag: 'OUR STORY',
      title: 'From a Maker Garage to Global Classrooms',
      subtitle: 'Why we chose ESP32 and open-source over proprietary walled gardens.',
      description: 'Our journey building robust STEM educational kits.',
      content_data: JSON.stringify({
        paragraphs: [
          'Oxybott began with a single observation: school robotics was either overly simplistic plastic blocks that students outgrew in weeks, or impossibly cryptic industrial breadboards that frustrated beginners.',
          'We chose the ESP32 microcontroller as our foundation because of its raw processing speed, built-in Wi-Fi and Bluetooth BLE, and massive global developer community. By wrapping this powerful chip in safe, durable hardware and multi-level coding environments, students learn real engineering skills from day one.'
        ]
      }),
      sort_order: 2
    },
    {
      id: 'sec_about_values',
      page_id: 'page_about',
      section_key: 'values',
      section_type: 'values',
      tag: 'CORE PRINCIPLES',
      title: 'Engineering Values That Guide Us',
      subtitle: 'Our commitment to students, teachers, and makers.',
      description: 'Integrity, durability, and open collaboration.',
      content_data: JSON.stringify({
        values: [
          {
            title: 'Authentic Engineering',
            desc: 'No fake sensors or proprietary connectors. Students wire real I2C, SPI, and PWM modules.'
          },
          {
            title: 'Open Source Spirit',
            desc: 'Every schematic, firmware library, and 3D enclosure CAD is freely accessible to all.'
          },
          {
            title: 'Teacher-First Support',
            desc: 'We provide complete lesson plans, slide decks, and troubleshooting guides so teachers never feel stranded.'
          }
        ]
      }),
      sort_order: 3
    },

    // --- CONTACT SECTIONS ---
    {
      id: 'sec_contact_info',
      page_id: 'page_contact',
      section_key: 'info',
      section_type: 'contact_info',
      tag: 'GET IN TOUCH',
      title: 'We Are Here to Support Your Robotics Journey',
      subtitle: 'Reach out to our engineering support team or institutional school consulting specialists.',
      description: 'Our team responds within 24 business hours.',
      content_data: JSON.stringify({
        supportEmail: 'info@oxybott.com',
        educationEmail: 'education@oxybott.com',
        phone: '+91 98765 43210',
        address: 'Oxybott Robotics Innovation Hub, Tech City, Bengaluru, Karnataka 560100, India',
        hours: 'Monday - Friday: 9:00 AM - 6:00 PM IST'
      }),
      sort_order: 1
    }
  ];

  for (const s of sections) {
    await query(`
      INSERT INTO page_sections (id, page_id, section_key, section_type, tag, title, subtitle, description, content_data, is_visible, sort_order, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, $10, CURRENT_TIMESTAMP)
      ON CONFLICT (page_id, section_key) DO UPDATE SET
        tag = EXCLUDED.tag,
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        description = EXCLUDED.description,
        content_data = EXCLUDED.content_data,
        sort_order = EXCLUDED.sort_order,
        updated_at = CURRENT_TIMESTAMP
    `, [s.id, s.page_id, s.section_key, s.section_type, s.tag, s.title, s.subtitle, s.description, s.content_data, s.sort_order]);
  }
  console.log(`✅ Seeded ${sections.length} CMS page sections.`);

  // 3. Seed Navigation Menus & Items
  const menus = [
    { id: 'menu_header', menu_key: 'header_main', title: 'Main Header Navigation' },
    { id: 'menu_footer_quick', menu_key: 'footer_quick_links', title: 'Footer Quick Links' },
    { id: 'menu_footer_products', menu_key: 'footer_products', title: 'Footer Featured Products' },
    { id: 'menu_footer_support', menu_key: 'footer_support', title: 'Footer Support & Legal' }
  ];

  for (const m of menus) {
    await query(`
      INSERT INTO navigation_menus (id, menu_key, title)
      VALUES ($1, $2, $3)
      ON CONFLICT (menu_key) DO UPDATE SET title = EXCLUDED.title
    `, [m.id, m.menu_key, m.title]);
  }

  const navItems = [
    // Header Items
    { id: 'nav_h_prods', menu_id: 'menu_header', label: 'Products', url: '/products', badge: '', sort_order: 1 },
    { id: 'nav_h_edu', menu_id: 'menu_header', label: 'Education Solutions', url: '/education', badge: 'Schools', sort_order: 2 },
    { id: 'nav_h_soft', menu_id: 'menu_header', label: 'Software', url: '/software', badge: '', sort_order: 3 },
    { id: 'nav_h_tut', menu_id: 'menu_header', label: 'Tutorials', url: '/tutorials', badge: 'Videos', sort_order: 4 },
    { id: 'nav_h_abt', menu_id: 'menu_header', label: 'About Us', url: '/about', badge: '', sort_order: 5 },
    { id: 'nav_h_cnt', menu_id: 'menu_header', label: 'Contact', url: '/contact', badge: '', sort_order: 6 },

    // Footer Quick Links
    { id: 'nav_fq_prods', menu_id: 'menu_footer_quick', label: 'Robotics Catalog', url: '/products', sort_order: 1 },
    { id: 'nav_fq_edu', menu_id: 'menu_footer_quick', label: 'School Curriculum', url: '/education', sort_order: 2 },
    { id: 'nav_fq_soft', menu_id: 'menu_footer_quick', label: 'OxyCode IDE', url: '/software', sort_order: 3 },
    { id: 'nav_fq_tut', menu_id: 'menu_footer_quick', label: 'Video Tutorials', url: '/tutorials', sort_order: 4 },
    { id: 'nav_fq_abt', menu_id: 'menu_footer_quick', label: 'About Our Story', url: '/about', sort_order: 5 },
    { id: 'nav_fq_quote', menu_id: 'menu_footer_quick', label: 'Institutional Quote', url: '/education', sort_order: 6 },

    // Footer Products
    { id: 'nav_fp_1', menu_id: 'menu_footer_products', label: 'QD022 4-DOF Robot Arm', url: '/products/qd022', sort_order: 1 },
    { id: 'nav_fp_2', menu_id: 'menu_footer_products', label: 'QD001 Mecanum Smart Car', url: '/products/qd001', sort_order: 2 },
    { id: 'nav_fp_3', menu_id: 'menu_footer_products', label: 'QE011 IoT Weather Station', url: '/products/qe011', sort_order: 3 },
    { id: 'nav_fp_4', menu_id: 'menu_footer_products', label: 'QD020 Quadruped Spider', url: '/products/qd020', sort_order: 4 },
    { id: 'nav_fp_5', menu_id: 'menu_footer_products', label: 'QE001 Smart Home IoT Kit', url: '/products/qe001', sort_order: 5 },
    { id: 'nav_fp_6', menu_id: 'menu_footer_products', label: 'QE200 Ultimate Maker Starter', url: '/products/qe200', sort_order: 6 },

    // Footer Support
    { id: 'nav_fs_faq', menu_id: 'menu_footer_support', label: 'Help Center & FAQ', url: '/contact', sort_order: 1 },
    { id: 'nav_fs_manuals', menu_id: 'menu_footer_support', label: 'Assembly Manuals (PDF)', url: '/tutorials', sort_order: 2 },
    { id: 'nav_fs_usb', menu_id: 'menu_footer_support', label: 'USB Driver Setup', url: '/software', sort_order: 3 },
    { id: 'nav_fs_osemi', menu_id: 'menu_footer_support', label: 'Order On OSEMI', url: 'https://osemi.in', sort_order: 4 },
    { id: 'nav_fs_privacy', menu_id: 'menu_footer_support', label: 'Privacy Policy', url: '/contact', sort_order: 5 },
    { id: 'nav_fs_terms', menu_id: 'menu_footer_support', label: 'Terms of Service', url: '/contact', sort_order: 6 }
  ];

  for (const n of navItems) {
    await query(`
      INSERT INTO navigation_items (id, menu_id, label, url, badge, sort_order, is_visible, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label,
        url = EXCLUDED.url,
        badge = EXCLUDED.badge,
        sort_order = EXCLUDED.sort_order,
        updated_at = CURRENT_TIMESTAMP
    `, [n.id, n.menu_id, n.label, n.url, n.badge || null, n.sort_order]);
  }
  console.log(`✅ Seeded ${navItems.length} navigation items.`);

  // 4. Seed Software Products & Multi-Platform Releases
  const softwareItems = [
    {
      id: 'soft_oxycode',
      name: 'OxyCode Studio Desktop',
      slug: 'oxycode-studio',
      icon: 'Code',
      short_desc: 'Desktop IDE with dual-pane Scratch block coding and live Arduino C++ generation.',
      description: 'The flagship programming environment for Oxybott robotics. Write visual blocks or switch to text mode seamlessly.',
      supported_os: JSON.stringify(['Windows 10/11 (x64)', 'macOS (Apple Silicon & Intel)', 'Linux (AppImage)']),
      primary_btn_text: 'Download v2.4.0 (Windows)',
      primary_btn_action: '/api/software/download/rel_oxycode_win',
      secondary_btn_text: 'macOS & Linux Releases',
      secondary_btn_action: '#releases-oxycode',
      sort_order: 1
    },
    {
      id: 'soft_oxyblock_apk',
      name: 'OxyBlock Mobile Bluetooth Controller',
      slug: 'oxyblock-mobile',
      icon: 'Smartphone',
      short_desc: 'Android companion app for Bluetooth BLE remote control, virtual joystick, and wireless block logic.',
      description: 'Wirelessly pilot your robot cars and arms directly from your Android tablet or smartphone.',
      supported_os: JSON.stringify(['Android 8.0+ (APK)', 'Google Play Store']),
      primary_btn_text: 'Download Android APK (Direct)',
      primary_btn_action: '/api/software/download/rel_oxyblock_apk',
      secondary_btn_text: 'Google Play Store',
      secondary_btn_action: 'https://play.google.com/store/apps/details?id=com.oxybott.oxyblock',
      sort_order: 2
    },
    {
      id: 'soft_esp32_flasher',
      name: 'ESP32 Firmware Flash & Recovery Tool',
      slug: 'esp32-flash-tool',
      icon: 'Terminal',
      short_desc: '1-Click emergency factory reset & firmware flashing utility for all Oxybott ESP32 robot kits.',
      description: 'Easily recover corrupted microcontrollers or burn fresh factory demos without installing Python esptool.',
      supported_os: JSON.stringify(['Windows 10/11 (Portable)', 'Web Serial (Chrome)']),
      primary_btn_text: 'Download Flasher (Windows ZIP)',
      primary_btn_action: '/api/software/download/rel_flasher_zip',
      secondary_btn_text: 'Launch Web Flasher',
      secondary_btn_action: 'https://flash.oxybott.com',
      sort_order: 3
    },
    {
      id: 'soft_arduino_lib',
      name: 'Oxybott Arduino C++ Core Library',
      slug: 'oxybott-arduino-library',
      icon: 'Cpu',
      short_desc: 'Official Arduino IDE library for ESP32 servos, ultrasonic sensors, mecanum kinematics, and OLED displays.',
      description: 'Comprehensive, optimized drivers for all Oxybott hardware shields and sensors.',
      supported_os: JSON.stringify(['Arduino IDE 1.8+ / 2.0+', 'PlatformIO']),
      primary_btn_text: 'Download Library ZIP',
      primary_btn_action: '/api/software/download/rel_lib_zip',
      secondary_btn_text: 'GitHub Source Code',
      secondary_btn_action: 'https://github.com/oxybott-robotics/oxybott-arduino-core',
      sort_order: 4
    }
  ];

  for (const s of softwareItems) {
    await query(`
      INSERT INTO software_items (id, name, slug, icon, short_desc, description, supported_os, primary_btn_text, primary_btn_action, secondary_btn_text, secondary_btn_action, sort_order, is_published, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE, CURRENT_TIMESTAMP)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        icon = EXCLUDED.icon,
        short_desc = EXCLUDED.short_desc,
        description = EXCLUDED.description,
        supported_os = EXCLUDED.supported_os,
        primary_btn_text = EXCLUDED.primary_btn_text,
        primary_btn_action = EXCLUDED.primary_btn_action,
        secondary_btn_text = EXCLUDED.secondary_btn_text,
        secondary_btn_action = EXCLUDED.secondary_btn_action,
        sort_order = EXCLUDED.sort_order,
        updated_at = CURRENT_TIMESTAMP
    `, [s.id, s.name, s.slug, s.icon, s.short_desc, s.description, s.supported_os, s.primary_btn_text, s.primary_btn_action, s.secondary_btn_text, s.secondary_btn_action, s.sort_order]);
  }

  const releases = [
    {
      id: 'rel_oxycode_win',
      software_id: 'soft_oxycode',
      version: '2.4.0',
      platform: 'windows',
      architecture: 'x64',
      file_name: 'OxyCode_Studio_Setup_v2.4.0.exe',
      file_type: '.exe',
      file_size: 78643200,
      sha256_checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      release_notes: 'Includes ESP32-WROOM-32 compiler support, live kinematics viewer, and serial monitor enhancements.'
    },
    {
      id: 'rel_oxycode_mac',
      software_id: 'soft_oxycode',
      version: '2.4.0',
      platform: 'macos',
      architecture: 'universal',
      file_name: 'OxyCode_Studio_v2.4.0.dmg',
      file_type: '.dmg',
      file_size: 83886080,
      sha256_checksum: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
      release_notes: 'Native Apple Silicon M1/M2/M3 and Intel binary.'
    },
    {
      id: 'rel_oxycode_linux',
      software_id: 'soft_oxycode',
      version: '2.4.0',
      platform: 'linux',
      architecture: 'x64',
      file_name: 'OxyCode_Studio_v2.4.0.AppImage',
      file_type: '.AppImage',
      file_size: 75497472,
      sha256_checksum: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
      release_notes: 'Universal AppImage for Ubuntu 20.04+, Debian, and Fedora.'
    },
    {
      id: 'rel_oxyblock_apk',
      software_id: 'soft_oxyblock_apk',
      version: '1.8.2',
      platform: 'android',
      architecture: 'universal',
      file_name: 'OxyBlock_Controller_v1.8.2.apk',
      file_type: '.apk',
      file_size: 33554432,
      sha256_checksum: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
      release_notes: 'Gamepad controller mode, dynamic telemetric sensor HUD, and low-latency BLE reconnect.'
    },
    {
      id: 'rel_flasher_zip',
      software_id: 'soft_esp32_flasher',
      version: '3.1.0',
      platform: 'windows',
      architecture: 'portable',
      file_name: 'Oxybott_ESP32_Flash_Utility_v3.1.0.zip',
      file_type: '.zip',
      file_size: 15728640,
      sha256_checksum: '5f4dcc3b5aa765d61d8327deb882cf99',
      release_notes: 'Stand-alone flasher with preloaded QD001, QD022, and QE011 production firmwares.'
    },
    {
      id: 'rel_lib_zip',
      software_id: 'soft_arduino_lib',
      version: '2.1.4',
      platform: 'library',
      architecture: 'source',
      file_name: 'Oxybott_Arduino_Core_v2.1.4.zip',
      file_type: '.zip',
      file_size: 4194304,
      sha256_checksum: '7d83b165c6e1386b103768f61a3f8f45',
      release_notes: 'Updated servo angle damping and expanded ESP-NOW peer-to-peer examples.'
    }
  ];

  for (const r of releases) {
    await query(`
      INSERT INTO software_releases (id, software_id, version, platform, architecture, file_name, file_type, file_size, sha256_checksum, release_notes, is_latest, is_published, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, TRUE, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        version = EXCLUDED.version,
        platform = EXCLUDED.platform,
        architecture = EXCLUDED.architecture,
        file_name = EXCLUDED.file_name,
        file_type = EXCLUDED.file_type,
        file_size = EXCLUDED.file_size,
        sha256_checksum = EXCLUDED.sha256_checksum,
        release_notes = EXCLUDED.release_notes,
        updated_at = CURRENT_TIMESTAMP
    `, [r.id, r.software_id, r.version, r.platform, r.architecture, r.file_name, r.file_type, r.file_size, r.sha256_checksum, r.release_notes]);
  }
  console.log(`✅ Seeded ${softwareItems.length} software items and ${releases.length} releases.`);

  // 5. Seed FAQ Items
  const faqs = [
    {
      id: 'faq_1',
      category: 'Products & Safety',
      question: 'Do Oxybott kits require soldering or specialized workshop tools?',
      answer: 'No! All Oxybott kits are 100% solder-free. They use plug-and-play color-coded PH2.0 cables, screw terminals, and pre-soldered pin headers designed specifically for student safety.',
      sort_order: 1
    },
    {
      id: 'faq_2',
      category: 'Software & Code',
      question: 'Can students transition from visual Scratch blocks to real C++ code?',
      answer: 'Yes! OxyCode Studio provides a dual-pane editor. As students snap visual blocks together, authentic Arduino C++ is generated in real-time, allowing them to learn text-based syntax naturally.',
      sort_order: 2
    },
    {
      id: 'faq_3',
      category: 'Schools & Curriculum',
      question: 'Are bulk educator discounts available for schools and universities?',
      answer: 'Yes! We provide tailored institutional pricing, turnkey classroom 10/20/50 kit bundles, and complimentary curriculum teacher guidebooks. Click "School Quote" to request a formal quotation.',
      sort_order: 3
    },
    {
      id: 'faq_4',
      category: 'Orders & Fulfillment',
      question: 'How are purchases fulfilled and what currency is supported?',
      answer: 'All consumer and retail purchases are fulfilled through our verified partner store OSEMI with express nationwide shipping across India, transparent pricing in Indian Rupee (₹), and official warranty support.',
      sort_order: 4
    },
    {
      id: 'faq_5',
      category: 'Compatibility',
      question: 'What operating systems are supported by OxyCode Studio?',
      answer: 'OxyCode Studio runs natively on Windows 10/11 (64-bit), macOS (both Apple Silicon M1/M2/M3 and Intel), and Linux. We also offer OxyBlock for Android tablets and smartphones.',
      sort_order: 5
    }
  ];

  for (const f of faqs) {
    await query(`
      INSERT INTO faq_items (id, category, question, answer, sort_order, is_published, updated_at)
      VALUES ($1, $2, $3, $4, $5, TRUE, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        question = EXCLUDED.question,
        answer = EXCLUDED.answer,
        sort_order = EXCLUDED.sort_order,
        updated_at = CURRENT_TIMESTAMP
    `, [f.id, f.category, f.question, f.answer, f.sort_order]);
  }
  console.log(`✅ Seeded ${faqs.length} FAQ items.`);

  console.log('--- CMS Architecture Seeding Completed Successfully ---');
}

if (require.main === module) {
  seedCMS()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('CMS Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedCMS };

