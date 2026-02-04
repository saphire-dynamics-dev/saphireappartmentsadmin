import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import { hashPassword } from '../lib/password.js';

function loadEnvFile(filename) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith('#')) {
      continue;
    }
    const index = line.indexOf('=');
    if (index === -1) {
      continue;
    }
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (!key || key in process.env) {
      continue;
    }
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function run() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required');
  }

  const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD is required');
  }

  const name = process.env.ADMIN_NAME || 'Administrator';
  const email = process.env.ADMIN_EMAIL || 'admin@saphireapartments.com';
  const allowReset = String(process.env.ADMIN_SEED_RESET).toLowerCase() === 'true';

  await mongoose.connect(mongoUri, { bufferCommands: false });

  const existing = await Admin.findOne({ username }).select('_id');
  if (existing && !allowReset) {
    console.log(`Admin "${username}" already exists. Set ADMIN_SEED_RESET=true to reset.`);
    await mongoose.disconnect();
    return;
  }

  const { hash, salt } = hashPassword(password);

  if (existing) {
    await Admin.updateOne(
      { _id: existing._id },
      {
        passwordHash: hash,
        passwordSalt: salt,
        name,
        email,
        isActive: true
      }
    );
    console.log(`Admin "${username}" updated.`);
  } else {
    await Admin.create({
      username,
      passwordHash: hash,
      passwordSalt: salt,
      name,
      email,
      role: 'admin',
      isActive: true
    });
    console.log(`Admin "${username}" created.`);
  }

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
