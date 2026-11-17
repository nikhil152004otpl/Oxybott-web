/**
 * Oxybott Authentic Product Dataset (Fallback & Store Catalog)
 */

export const OXYBOTT_PRODUCTS = [
  {
    id: "qd022",
    osemi_url: "https://osemi.in/product/oxybott-qd022-robot-arm",
    sku: "OXY-QD022",
    name: "Oxybott QD022 4-DOF Programmable Robot Arm Kit",
    shortName: "Programmable Robot Arm Kit",
    series: "Inventor Series",
    category: "Robotics",
    age: "12+ & Makers",
    grade: "Grade 6-12",
    price: 7469,
    originalPrice: 9129,
    rating: 4.9,
    reviewsCount: 142,
    badge: "Bestseller",
    image: "/assets/images/qd022-robot-arm.png",
    inStock: true,
    tagline: "4-DOF ESP32 Dual-Core Robotic Arm with Wireless Bluetooth & Wi-Fi Control",
    description: "The Oxybott QD022 4-DOF Programmable Robot Arm Kit is engineered for high school STEM education, maker spaces, and robotics enthusiasts. Powered by the high-performance ESP32 microcontroller, it supports block-based OxyCode, Arduino C++, and MicroPython programming. Features 4 durable metal-gear servos, dual joystick controllers, an OLED status display, and smartphone wireless app control.",
    highlights: [
      "ESP32 dual-core 240MHz controller board with onboard Wi-Fi and Bluetooth",
      "4 metal-gear high-torque precision servos for smooth 4-axis robotic articulation",
      "Tri-lingual programming: OxyCode (Scratch block), Arduino IDE (C++), and MicroPython",
      "Dual joystick manual control module + Mobile app Bluetooth remote control",
      "OLED display showing real-time angles, coordinates, and operating modes",
      "Includes 20+ comprehensive curriculum lessons and step-by-step video tutorials"
    ],
    specs: {
      "Microcontroller": "ESP32-WROOM-32 (240MHz Dual Core)",
      "Degrees of Freedom": "4-DOF (Base Rotation, Shoulder, Elbow, Gripper)",
      "Operating Voltage": "6V - 9V DC (Dual 18650 Battery Holder included)",
      "Servos": "4x MG90S Metal-Gear High-Torque Servos",
      "Communication": "Wi-Fi 802.11 b/g/n, Bluetooth 4.2 BLE",
      "Input Modules": "Dual Analog Joystick Module, 0.96 inch I2C OLED Display",
      "Programming Environments": "OxyCode (Blockly), Arduino IDE, Thonny (MicroPython)",
      "Dimensions": "260 x 160 x 300 mm (assembled)",
      "Weight": "680g"
    },
    boxContents: [
      "1x Oxybott ESP32 Main Robotics Controller Board",
      "4x High-Precision Metal-Gear MG90S Servos",
      "1x Laser-cut High-durability Acrylic Robotic Arm Chassis set",
      "1x Dual Joystick Controller expansion board",
      "1x 0.96-inch OLED I2C Display module",
      "1x Dual 18650 Battery Case with power switch",
      "1x Micro-USB High-Speed Data Cable",
      "1x Precision Screwdriver & Hardware fastener pack",
      "1x Printed Quick-Start Guide & Curriculum Access Card"
    ]
  },
  {
    id: "qd001",
    osemi_url: "https://osemi.in/product/oxybott-qd001-omni-wheel-car",
    sku: "OXY-QD001",
    name: "Oxybott QD001 Smart Robot Car Kit for ESP32",
    shortName: "Smart Robot Car Kit",
    series: "Explorer Series",
    category: "Robotics",
    age: "8-14 Years",
    grade: "Grade 3-8",
    price: 4979,
    originalPrice: 6224,
    rating: 4.8,
    reviewsCount: 218,
    badge: "Popular",
    image: "/assets/images/qd001-robot-car.png",
    inStock: true,
    tagline: "Multi-functional Obstacle-Avoidance, Ultrasonic & Line-Tracking Smart Vehicle",
    description: "The Oxybott QD001 Smart Robot Car Kit is the definitive introductory robotics platform for elementary and middle school classrooms. Packed with high-accuracy ultrasonic distance sensing, infrared line-tracking sensors, and high-speed DC gearmotors, young learners can program their car to navigate labyrinths, follow complex race tracks, or respond to IR and smartphone Bluetooth commands.",
    highlights: [
      "Integrated ultrasonic sensor with servo panning mount for 180° spatial mapping",
      "3-channel infrared line follower module for automated closed-loop path tracking",
      "Dual TT gear motors with optical encoder feedback slots",
      "OxyCode drag-and-drop programming with real-time C++ transpilation view",
      "IR remote control + iOS/Android Bluetooth app control included",
      "Includes 16 curriculum-aligned STEM classroom lessons"
    ],
    specs: {
      "Microcontroller": "ESP32 Core Board (Wi-Fi + BLE)",
      "Drive System": "2WD Dual TT Gear Motors (1:48 gear ratio)",
      "Sensors": "HC-SR04 Ultrasonic Sensor, 3-Channel TCRT5000 IR Line Sensor",
      "Power Source": "7.4V (2x 3.7V 18650 rechargeable batteries)",
      "Chassis Material": "High-impact laser-cut anodized aluminum alloy",
      "Speed": "0.4 m/s maximum",
      "Weight": "450g"
    },
    boxContents: [
      "1x Oxybott ESP32 Robot Driver Mainboard",
      "1x Ultrasonic Distance Sensor & Servo Pan Bracket",
      "1x 3-Channel Line Tracking Sensor Bar",
      "2x TT High-Torque Gear Motors & Rubber Wheels",
      "1x Front Omnidirectional Castor Wheel",
      "1x Infrared Remote Controller",
      "1x Line-Tracking Test Track Map",
      "1x Assembly Hardware Pack & Phillips Screwdriver"
    ]
  },
  {
    id: "qd020",
    osemi_url: "https://osemi.in/product/oxybott-qd020-spider-robot",
    sku: "OXY-QD020",
    name: "Oxybott QD020 8-Servo Bionic Spider Robot Kit",
    shortName: "Bionic Spider Robot",
    series: "Inventor Series",
    category: "Robotics",
    age: "12+ & High School",
    grade: "Grade 7-12",
    price: 8299,
    originalPrice: 10374,
    rating: 4.9,
    reviewsCount: 96,
    badge: "Educator Choice",
    image: "/assets/images/qd020-spider-robot.png",
    inStock: true,
    tagline: "Bio-inspired 8-DOF Quadruped Walking Robot with Forward Kinematics",
    description: "Explore biological locomotion and multi-servo coordination with the Oxybott QD020 Bionic Spider Robot. Driven by 8 independent metal-gear servos, this quadruped robot demonstrates realistic crawling, creeping, dancing, and balance compensation routines on uneven terrain. Program custom gaits in OxyCode, C++, or Python.",
    highlights: [
      "8 high-torque metal-gear micro servos for dynamic 8-axis bio-locomotion",
      "Custom gait generation engine supporting crawl, trot, creep, and turn algorithms",
      "Autonomous obstacle avoidance with ultrasonic distance scanner head",
      "Smartphone gyro-tilt control via Oxybott BLE companion app",
      "Modular snap-and-screw assembly designed for repeated educational lab builds"
    ],
    specs: {
      "Microcontroller": "ESP32 dual-core IoT robotics controller",
      "Degrees of Freedom": "8-DOF (2 servos per leg x 4 legs)",
      "Servos": "8x MG90S 9g Micro Servos with Metal Gears",
      "Sensor": "Ultrasonic Range Finder Module",
      "Power": "7.4V 2S Li-Po / 18650 Battery Pack",
      "Control": "Wi-Fi Web Server, Bluetooth BLE App, IR Remote"
    },
    boxContents: [
      "1x Oxybott ESP32 16-Channel Servo Shield",
      "8x Metal Gear MG90S Precision Servos",
      "1x Structural Spider Chassis & Leg Assembly Parts",
      "1x Ultrasonic Sensor with Cable",
      "1x Calibration Gauge & Screwdriver",
      "1x Complete Gait Programming Curriculum Guide"
    ]
  },
  {
    id: "qe001",
    osemi_url: "https://osemi.in/product/oxybott-qe001-smart-home-iot",
    sku: "OXY-QE001",
    name: "Oxybott QE001 Smart Home IoT Starter Kit",
    shortName: "Smart Home IoT Kit",
    series: "Education Series",
    category: "Smart IoT",
    age: "10-16 Years",
    grade: "Grade 5-10",
    price: 6639,
    originalPrice: 7884,
    rating: 5.0,
    reviewsCount: 175,
    badge: "Bestseller",
    image: "/assets/images/qe001-smart-home.png",
    inStock: true,
    tagline: "Turnkey ESP32 Classroom Home Automation with RFID, Gas & Rain Sensors",
    description: "The Oxybott QE001 Smart Home IoT Starter Kit introduces students to modern Internet of Things (IoT) engineering. Featuring a detailed architectural wooden smart house model, learners assemble and code 14 interactive electronic modules including RFID access control, automatic servo windows, gas/smoke leak detectors, temperature/humidity LCD monitors, and automatic rain-sensing clotheslines.",
    highlights: [
      "Interactive 2-story laser-cut birchwood educational house structure",
      "14 plug-and-play Grove-compatible sensor and actuator modules",
      "RFID smart door unlocking system with keycards and key fobs included",
      "Gas leak alarm with buzzer sirens and automated servo window ventilation",
      "Real-time sensor telemetry dashboard on local Wi-Fi web page"
    ],
    specs: {
      "Microcontroller": "Oxybott ESP32 Smart Home Controller with Grove headers",
      "Sensors": "DHT11 Temp/Humidity, Gas/Smoke, Rain/Moisture, PIR Motion, Light (LDR), RFID RC522",
      "Actuators": "1602 I2C LCD, RGB LED, Micro Servo (Door/Window), Piezo Buzzer, Relay Switch",
      "Connectivity": "Wi-Fi 802.11 b/g/n, MQTT, HTTP Web Server",
      "Dimensions": "320 x 240 x 280 mm (assembled house model)"
    },
    boxContents: [
      "1x Laser-cut Eco-friendly Smart Home Model Structural Pack",
      "1x Oxybott ESP32 IoT Hub Board",
      "1x RC522 RFID Reader Module & 2x Key Cards",
      "1x 1602 I2C Backlit LCD Screen",
      "6x Analog & Digital Environmental Sensors",
      "2x Micro Servos & 1x Relay Module",
      "1x Ribbon Wire & Grove Cable Bundle",
      "1x 12-Chapter Step-by-Step Project Booklet"
    ]
  },
  {
    id: "qe002",
    osemi_url: "https://osemi.in/product/oxybott-qe002-smart-agriculture",
    sku: "OXY-QE002",
    name: "Oxybott QE002 Smart Agriculture & Greenhouse IoT Kit",
    shortName: "Smart Agriculture IoT Kit",
    series: "Education Series",
    category: "Smart IoT",
    age: "10-16 Years",
    grade: "Grade 5-11",
    price: 6224,
    originalPrice: 7469,
    rating: 4.8,
    reviewsCount: 88,
    badge: "New",
    image: "/assets/images/qe002-smart-farm.png",
    inStock: true,
    tagline: "Automated Greenhouse with Soil Moisture Irrigation & Sunlight Tracking",
    description: "Combine environmental biology and computer science with the Oxybott QE002 Smart Agriculture Kit. Students build a functional miniature greenhouse complete with automated soil-moisture-triggered water pumps, servo ventilation louvers, plant growth LED arrays, and cloud IoT telemetry tracking.",
    highlights: [
      "Automated closed-loop irrigation system with submersible mini pump",
      "Capacitive corrosion-resistant soil moisture sensor probe",
      "Full spectrum LED grow light module with automated sunlight tracking",
      "Dual OLED telemetry display for ambient humidity and soil hydration data",
      "Cloud data logging to IoT dashboards (ThingsBoard, Adafruit IO, Blynk)"
    ],
    specs: {
      "Microcontroller": "ESP32 IoT Agri-Board",
      "Pumping System": "5V Submersible Water Pump with Silicon Tubing",
      "Sensors": "Capacitive Soil Moisture, Waterproof DS18B20 Temp, Light Sensor, Rain Sensor",
      "Displays": "0.96 inch I2C OLED",
      "Power": "USB-C 5V 2A / DC Jack"
    },
    boxContents: [
      "1x Transparent Acrylic Greenhouse Chassis Kit",
      "1x Oxybott ESP32 Agri-Controller",
      "1x Capacitive Soil Moisture Sensor",
      "1x Submersible DC Water Pump & 1m Silicon Tube",
      "1x Full Spectrum Grow Light PCB",
      "1x 0.96-inch OLED Screen",
      "1x Curriculum Workbook with 10 Guided Experiments"
    ]
  },
  {
    id: "qe011",
    osemi_url: "https://osemi.in/product/oxybott-qe011-weather-station",
    sku: "OXY-QE011",
    name: "Oxybott QE011 IoT Environmental Weather Station",
    shortName: "IoT Weather Station",
    series: "Education Series",
    category: "Smart IoT",
    age: "10-16 Years",
    grade: "Grade 4-9",
    price: 5394,
    originalPrice: 6639,
    rating: 4.9,
    reviewsCount: 114,
    badge: "Popular",
    image: "/assets/images/qe011-weather-station.png",
    inStock: true,
    tagline: "Solar-Ready Barometric, Humidity & UV Wireless Climate Monitor",
    description: "Empower students to become meteorologists with the Oxybott QE011 IoT Weather Station. Collects barometric pressure, UV index, ambient humidity, temperature, and rainfall data, broadcasting live measurements to classroom dashboards and public weather maps.",
    highlights: [
      "Measures Temperature, Humidity, Barometric Pressure (BMP280), and UV Index",
      "Integrated solar charging circuit with rechargeable Li-Ion battery holder",
      "Onboard ESP32 Wi-Fi server serves live interactive HTML5 weather gauges",
      "Export historical weather logs to CSV or Google Sheets API for science labs"
    ],
    specs: {
      "Microcontroller": "ESP32 Weather Node",
      "Sensors": "BME280 Barometric Pressure/Temp/Humidity, GUVA-S12SD UV Sensor, Rain Gauge",
      "Connectivity": "Wi-Fi (HTTP, MQTT, WebSockets)",
      "Display": "1.3-inch White OLED Matrix Display"
    },
    boxContents: [
      "1x Weatherproof Station Enclosure & Mounting Post",
      "1x Oxybott ESP32 Weather Mainboard",
      "1x High-Accuracy BME280 Sensor",
      "1x UV Index Sensor",
      "1x Solar Panel 5V 200mA with Bracket",
      "1x 10-Lesson Meteorological Science Guide"
    ]
  },
  {
    id: "qe200",
    osemi_url: "https://osemi.in/product/oxybott-qe200-starter-kit",
    sku: "OXY-QE200",
    name: "Oxybott QE200 ESP32 Ultimate STEM Starter Kit",
    shortName: "ESP32 Ultimate Starter Kit",
    series: "Maker Series",
    category: "Electronics",
    age: "10+ to Adult",
    grade: "Grade 5-Higher Ed",
    price: 4564,
    originalPrice: 5809,
    rating: 5.0,
    reviewsCount: 340,
    badge: "Bestseller",
    image: "/assets/images/qe200-starter-kit.jpg",
    inStock: true,
    tagline: "Comprehensive 50+ Component Prototyping Lab with 45 Structured Tutorials",
    description: "The Oxybott QE200 is the ultimate electronics and microcontroller lab for schools, colleges, and makers. Centered around the dual-core ESP32 board, it includes over 50 individual components: sensors, motors, displays, RFID, relay, and breadboard prototyping supplies with 45 illustrated projects.",
    highlights: [
      "ESP32 development board with breadboard-friendly pinout and USB-C port",
      "Over 50 components including LCD, 8x8 Matrix, Servos, Stepper Motor, and Sound Sensor",
      "Comprehensive 120-page full-color tutorial manual with code in OxyCode, C++, and Python",
      "Reusable heavy-duty compartmentalized plastic organizer tackle box"
    ],
    specs: {
      "Microcontroller": "ESP32-WROOM-32 (30-Pin NodeMCU layout)",
      "Total Components": "55 distinct items / 180+ individual parts",
      "Breadboard": "830-tie point solderless breadboard + 65 jumper wires",
      "Packaging": "Dual-tier locking component case"
    },
    boxContents: [
      "1x ESP32 NodeMCU Board",
      "1x 830-point Breadboard & Power Supply Module",
      "1x LCD1602 with I2C Backpack",
      "1x SG90 Micro Servo & 1x 28BYJ-48 Stepper Motor + ULN2003 Driver",
      "1x Ultrasonic Sensor, PIR Motion Sensor, Sound Sensor, Joystick Module",
      "Resistor Pack (100x), Capacitors, Transistors, LEDs (5 colors), Potentiometers",
      "1x Full-Color 120-page Project Book"
    ]
  },
  {
    id: "qe202",
    osemi_url: "https://osemi.in/product/oxybott-qe202-sensor-kit",
    sku: "OXY-QE202",
    name: "Oxybott QE202 37-in-1 Sensor Modules Kit",
    shortName: "37-in-1 Sensor Modules Kit",
    series: "Maker Series",
    category: "Electronics",
    age: "12+ & Makers",
    grade: "Grade 6-Higher Ed",
    price: 3319,
    originalPrice: 4149,
    rating: 4.8,
    reviewsCount: 162,
    badge: "Popular",
    image: "/assets/images/qe202-sensor-kit.jpg",
    inStock: true,
    tagline: "37 Authentic Educational Sensors for Robotics, Automation & Science Experiments",
    description: "The Oxybott QE202 packs 37 individual, high-grade sensor modules for exploring the physical world. Includes temperature, vibration, flame, sound, magnetic, optical, tilt, and touch sensors with verified pinout diagrams and sample code for ESP32, Arduino, and Raspberry Pi.",
    highlights: [
      "37 pre-assembled sensor and output modules on standardized PCBs",
      "Includes flame detector, heart-rate pulse, temperature, magnetic Hall, and rotary encoder",
      "Clear silk-screened pin markings (+, -, S) prevents wiring mistakes in labs",
      "Accompanied by searchable digital pinout and code library"
    ],
    specs: {
      "Compatibility": "ESP32, ESP8266, Arduino Uno/Mega, Raspberry Pi, Micro:bit",
      "Operating Voltage": "3.3V - 5V DC",
      "Connector Type": "Standard 2.54mm pitch DuPont pin headers",
      "Packaging": "Individual slot organizer box"
    },
    boxContents: [
      "37x Individually packaged sensor modules",
      "1x 40-pin Female-to-Female DuPont Ribbon Cable",
      "1x 40-pin Male-to-Female DuPont Ribbon Cable",
      "1x Visual Sensor Reference Chart"
    ]
  }
];

