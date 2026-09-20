require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Asset = require('./models/Asset');
const IssueRequest = require('./models/IssueRequest');
const MaintenanceLog = require('./models/MaintenanceLog');

const seedData = async () => {
  try {
    const primaryUri = process.env.MONGO_URI;
    const localUri = 'mongodb://127.0.0.1:27017/lab_tracking_system';
    let connected = false;

    if (primaryUri) {
      try {
        console.log('[Seed] Trying primary MongoDB connection...');
        await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 3000 });
        connected = true;
      } catch (err) {
        console.warn(`[Seed Warning] Could not connect to Atlas MongoDB (${err.message}). Falling back to local MongoDB...`);
      }
    }

    if (!connected) {
      await mongoose.connect(localUri, { serverSelectionTimeoutMS: 5000 });
    }

    console.log('[Seed] Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Asset.deleteMany({});
    await IssueRequest.deleteMany({});
    await MaintenanceLog.deleteMany({});
    console.log('[Seed] Cleared old collection records.');

    // Create Hashed Passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const labPassword = await bcrypt.hash('lab123', salt);
    const studentPassword = await bcrypt.hash('student123', salt);

    // 1. Seed Users
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@lab.com',
      password: adminPassword,
      role: 'admin'
    });

    const labInchargePhysics = await User.create({
      name: 'Dr. Sarah Connor',
      email: 'lab1@lab.com',
      password: labPassword,
      role: 'lab_incharge',
      assignedLab: 'Physics Lab'
    });

    const labInchargeCS = await User.create({
      name: 'Prof. Alan Turing',
      email: 'lab2@lab.com',
      password: labPassword,
      role: 'lab_incharge',
      assignedLab: 'CS Lab'
    });

    const studentUser = await User.create({
      name: 'Alex Rivera (Student)',
      email: 'student@lab.com',
      password: studentPassword,
      role: 'requester'
    });

    console.log('[Seed] Created Users:');
    console.log('       - Admin: admin@lab.com / admin123');
    console.log('       - Lab In-charge (Physics Lab): lab1@lab.com / lab123');
    console.log('       - Lab In-charge (CS Lab): lab2@lab.com / lab123');
    console.log('       - Requester: student@lab.com / student123');

    // 2. Seed Assets
    const assets = await Asset.insertMany([
      {
        assetTag: 'LAB-PHY-001',
        name: 'Digital Storage Oscilloscope 100MHz',
        category: 'Electronics',
        labLocation: 'Physics Lab',
        totalQuantity: 5,
        availableQuantity: 3,
        condition: 'OK',
        description: '2-Channel 1GSa/s real-time sampling oscilloscope with TFT display.'
      },
      {
        assetTag: 'LAB-PHY-002',
        name: 'Function Generator 25MHz',
        category: 'Electronics',
        labLocation: 'Physics Lab',
        totalQuantity: 4,
        availableQuantity: 4,
        condition: 'OK',
        description: 'Dual-channel arbitrary waveform signal generator.'
      },
      {
        assetTag: 'LAB-PHY-003',
        name: 'Optical Laser Spectrometer',
        category: 'Optics',
        labLocation: 'Physics Lab',
        totalQuantity: 2,
        availableQuantity: 1,
        condition: 'OK',
        description: 'High-resolution UV-VIS spectrometer for wavelength measurement.'
      },
      {
        assetTag: 'LAB-CS-001',
        name: 'Raspberry Pi 4 Model B (8GB RAM)',
        category: 'Computing',
        labLocation: 'CS Lab',
        totalQuantity: 10,
        availableQuantity: 7,
        condition: 'OK',
        description: 'Single-board computer with micro-HDMI, USB 3.0, and Gigabit Ethernet.'
      },
      {
        assetTag: 'LAB-CS-002',
        name: 'Arduino Mega 2560 Starter Kit',
        category: 'Embedded Systems',
        labLocation: 'CS Lab',
        totalQuantity: 8,
        availableQuantity: 8,
        condition: 'OK',
        description: 'Microcontroller board based on ATmega2560 with sensor shield package.'
      },
      {
        assetTag: 'LAB-CS-003',
        name: 'USB Logic Analyzer 16-Channel',
        category: 'Electronics',
        labLocation: 'CS Lab',
        totalQuantity: 3,
        availableQuantity: 2,
        condition: 'OK',
        description: '100MHz USB logic analyzer with digital protocol decoding software.'
      }
    ]);

    console.log(`[Seed] Created ${assets.length} sample assets across Physics Lab & CS Lab.`);

    // 3. Seed Sample Issue Requests
    const now = new Date();

    // Request 1: Pending Request in Physics Lab
    await IssueRequest.create({
      requester: studentUser._id,
      asset: assets[0]._id, // Oscilloscope
      quantity: 1,
      purpose: 'PHY302 Advanced Physics Experiment on Wave Modulation',
      expectedReturnDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // in 4 days
      status: 'Pending',
      requestDate: new Date(now.getTime() - 2 * 60 * 60 * 1000)
    });

    // Request 2: Issued Request in CS Lab
    await IssueRequest.create({
      requester: studentUser._id,
      asset: assets[3]._id, // Raspberry Pi 4
      quantity: 2,
      purpose: 'CS401 IoT Capstone Project Prototype Build',
      expectedReturnDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: 'Issued',
      requestDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      approvedBy: labInchargeCS._id,
      issueDate: new Date(now.getTime() - 20 * 60 * 60 * 1000)
    });

    // Request 3: Overdue Request in Physics Lab (Return date was 3 days ago!)
    await IssueRequest.create({
      requester: studentUser._id,
      asset: assets[2]._id, // Spectrometer
      quantity: 1,
      purpose: 'Optics Lab Practical Assignment #2',
      expectedReturnDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: 'Overdue',
      requestDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      approvedBy: labInchargePhysics._id,
      issueDate: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000)
    });

    console.log('[Seed] Created sample Issue Requests (Pending, Issued, and Overdue).');

    // 4. Seed Sample Maintenance Log
    await MaintenanceLog.create({
      asset: assets[0]._id,
      serviceDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      cost: 150.00,
      notes: 'Calibrated channel 1 & 2 voltage sensitivity. Replaced damaged probe BNC cable.',
      nextServiceDue: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      loggedBy: adminUser._id
    });

    console.log('[Seed] Created sample Maintenance Log.');

    console.log('\n[Seed] SUCCESS! Database seeding completed smoothly.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error] Failed to seed database:', err);
    process.exit(1);
  }
};

seedData();
