const fs = require('fs');
const https = require('https');
const path = require('path');

const REPO = 'Piyush-031005/ADI';
const BRANCH = 'master';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

function findFiles(dir, ext, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, ext, fileList);
    } else if (filePath.endsWith(ext)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function run() {
  const modelsDir = path.join(__dirname, 'public', 'models');
  const musicDir = path.join(__dirname, 'public', 'music');
  
  const filesToFix = [
    ...findFiles(modelsDir, '.glb'),
    ...findFiles(musicDir, '.mp3')
  ];
  
  for (const file of filesToFix) {
    const stats = fs.statSync(file);
    // If file is less than 1KB, it's an LFS pointer, so download the real file!
    if (stats.size < 1024) {
      const relativePath = path.relative(__dirname, file).replace(/\\/g, '/');
      const url = `https://github.com/${REPO}/raw/${BRANCH}/${relativePath}`;
      console.log(`Downloading real LFS file for ${relativePath}...`);
      try {
        await downloadFile(url, file);
        console.log(`Successfully downloaded ${relativePath}`);
      } catch (e) {
        console.error(e);
      }
    }
  }
}

run();
