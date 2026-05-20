import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import User from '../models/User';
import Product from '../models/Product';
import connectDB from '../config/db';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seed() {
  try {
    await connectDB();
    console.log('Connected to DB for E2E seeding...');

    // 1. Seed Admin User
    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      console.log('Seeding admin user...');
      const admin = new User({
        name: 'Admin User',
        email: adminEmail,
        password: 'admin123', // Will be hashed by pre-save middleware
        role: 'admin',
      });
      await admin.save();
      console.log('Admin user seeded.');
    } else {
      console.log('Admin user already exists.');
    }

    // 2. Seed some products if database is empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('Seeding dummy products...');
      await Product.insertMany([
        {
          name: 'Test Product',
          price: 999,
          category: 'Electronics',
          stock: 50,
          description: {
            short: 'A test product for E2E validation.',
            long: 'This is a long description for the test product used in our E2E test suite.'
          },
          features: ['Feature 1', 'Feature 2'],
          seoKeywords: ['test', 'e2e', 'product']
        },
        {
          name: 'Premium Leather Wallet',
          price: 1500,
          category: 'Accessories',
          stock: 15,
          description: {
            short: 'Genuine leather wallet.',
            long: 'A premium genuine leather wallet with multiple card slots and coin pocket.'
          },
          features: ['Genuine Leather', 'RFID Protection'],
          seoKeywords: ['wallet', 'leather', 'premium']
        },
        {
          name: 'Wireless Noise Cancelling Headphones',
          price: 12999,
          category: 'Electronics',
          stock: 8,
          description: {
            short: 'Over-ear headphones.',
            long: 'High quality over-ear wireless headphones with active noise cancellation.'
          },
          features: ['Active Noise Cancellation', '40h Battery Life'],
          seoKeywords: ['headphones', 'wireless', 'anc']
        }
      ]);
      console.log('Dummy products seeded.');
    } else {
      console.log(`Found ${productCount} products in database, skipping product seed.`);
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

seed();
