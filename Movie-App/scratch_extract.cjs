const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');
const match = content.match(/const styles = `([\s\S]*?)`;/);
if (match) {
  fs.writeFileSync('src/App.css', match[1].trim());
  console.log('Extracted CSS successfully');
} else {
  console.log('CSS not found');
}
