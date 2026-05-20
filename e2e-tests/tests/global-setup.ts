import { execSync } from 'child_process';
import path from 'path';

async function globalSetup() {
  console.log('Running database seeding script in backend...');
  const backendPath = path.resolve(__dirname, '../../e-commerce-backend');
  try {
    // Run seed-e2e.ts using the ts-node installed in the backend
    execSync('npx ts-node scripts/seed-e2e.ts', {
      cwd: backendPath,
      stdio: 'inherit',
    });
    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}

export default globalSetup;
