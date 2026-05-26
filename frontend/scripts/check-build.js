const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist');

function searchForLocalhost(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      searchForLocalhost(filePath);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.html')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('localhost:3000')) {
        console.error(`\x1b[31m[ERROR] Found localhost inside build output: ${filePath}\x1b[0m`);
        console.error('\x1b[31mProduction build should not have localhost! Failing build.\x1b[0m');
        process.exit(1);
      }
    }
  }
}

console.log('Checking build output for development URLs...');
if (fs.existsSync(distPath)) {
  searchForLocalhost(distPath);
  console.log('\x1b[32mBuild check passed! No localhost URLs found.\x1b[0m');
} else {
  console.log('Dist folder not found, skipping check.');
}
