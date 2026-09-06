const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('c:\\Users\\HP\\OneDrive\\Desktop\\unlimited tokens\\lint_results.txt', 'utf8');
fs.writeFileSync('C:\\Users\\HP\\.gemini\\antigravity\\brain\\fcca9f37-c390-4f3d-b7c3-ed13d4249aab\\lint_output.txt', content, 'utf8');
