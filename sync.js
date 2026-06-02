const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dataPath = path.join(__dirname, 'gallery-data.js');
const photosDir = path.join(__dirname, 'photos');

// Ensure photos directory exists
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir);
  console.log('Created photos/ directory. Place your images there.');
}

// Default config
let config = {
  photographerName: "Alex Mercer",
  photographerTitle: "Visual Artist & Photographer",
  photographerBio: "Capturing the interplay of light, geometry, and human stories in urban spaces and natural landscapes.",
  socialLinks: {
    instagram: "https://instagram.com",
    email: "mailto:hello@example.com",
    unsplash: "https://unsplash.com"
  },
  photos: []
};

// Load existing config if it exists
if (fs.existsSync(dataPath)) {
  try {
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const context = {};
    vm.createContext(context);
    // Replace const with var so it is exposed on the VM context object
    const codeToRun = fileContent.replace('const GALLERY_CONFIG', 'var GALLERY_CONFIG');
    vm.runInNewContext(codeToRun, context);
    if (context.GALLERY_CONFIG) {
      config = context.GALLERY_CONFIG;
      console.log('Loaded existing gallery configuration.');
    }
  } catch (error) {
    console.error('Error reading existing gallery-data.js:', error.message);
    console.log('Proceeding with default configuration framework.');
  }
}

// Try to dynamically load exifr for reading EXIF camera settings
let exifr;
try {
  exifr = require('exifr');
  console.log('Detected exifr! Automatic EXIF extraction is enabled.');
} catch (e) {
  console.log('exifr is not installed. To extract camera details automatically, run: npm install exifr');
}

// Helper to extract camera settings from EXIF using exifr
async function getExifCameraSettings(filePath) {
  if (!exifr) return null;
  try {
    const data = await exifr.parse(filePath, {
      pick: ['Make', 'Model', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO']
    });
    if (!data) return null;

    const parts = [];

    // Model/Make
    let model = data.Model || data.Make;
    if (model) {
      parts.push(model.trim());
    }

    // Focal Length
    if (data.FocalLength) {
      parts.push(`${data.FocalLength}mm`);
    }

    // FNumber (Aperture)
    if (data.FNumber) {
      parts.push(`f/${data.FNumber}`);
    }

    // Exposure Time (Shutter Speed)
    if (data.ExposureTime) {
      let shutter = data.ExposureTime;
      if (shutter < 1) {
        const fraction = Math.round(1 / shutter);
        parts.push(`1/${fraction}s`);
      } else {
        parts.push(`${shutter}s`);
      }
    }

    // ISO
    if (data.ISO) {
      parts.push(`ISO ${data.ISO}`);
    }

    if (parts.length > 0) {
      return parts.join(' • ');
    }
  } catch (err) {
    // Ignore parsing errors for individual files
  }
  return null;
}

// Scan photos directory recursively
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

function scanDir(dir, baseDir = '') {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanDir(fullPath, path.join(baseDir, file)));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (allowedExtensions.includes(ext)) {
        const relativePath = path.join(baseDir, file).replace(/\\/g, '/');
        const firstPart = baseDir ? baseDir.replace(/\\/g, '/').split('/')[0] : '';
        const folderCategory = firstPart ? firstPart.charAt(0).toUpperCase() + firstPart.slice(1) : 'General';
        results.push({
          fullPath,
          relativePath,
          filename: file,
          folderCategory
        });
      }
    }
  });
  return results;
}

const imageFiles = scanDir(photosDir);
console.log(`Found ${imageFiles.length} image files in photos/ directory.`);

// Sync photos list
const updatedPhotos = [];

async function syncPhotos() {
  for (const img of imageFiles) {
    const photoSrc = `photos/${img.relativePath}`;
    const existingPhoto = config.photos.find(p => p.src === photoSrc);

    if (existingPhoto) {
      // Remove description property if it exists
      delete existingPhoto.description;
      // If cameraSettings is the default 'Camera details', try to parse EXIF to replace it!
      if (existingPhoto.cameraSettings === 'Camera details') {
        const exifSettings = await getExifCameraSettings(img.fullPath);
        if (exifSettings) {
          existingPhoto.cameraSettings = exifSettings;
          console.log(`Updated camera settings from EXIF for existing photo: ${img.relativePath}`);
        }
      }
      updatedPhotos.push(existingPhoto);
    } else {
      // Determine category based on parent folder
      const category = img.folderCategory;

      // Parse filename for details
      const nameWithoutExt = path.basename(img.filename, path.extname(img.filename));
      const parts = nameWithoutExt.split(' - ');

      let title = '';
      let fileCameraSettings = '';

      if (parts.length > 1) {
        title = parts[0].trim();
        fileCameraSettings = parts[1].trim();
      } else {
        title = nameWithoutExt
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
      }

      // Try to read EXIF camera settings
      const exifSettings = await getExifCameraSettings(img.fullPath);
      const cameraSettings = exifSettings || fileCameraSettings || 'Camera details';

      updatedPhotos.push({
        id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        src: photoSrc,
        title: title,
        category: category,
        cameraSettings: cameraSettings
      });
      console.log(`Added new photo: ${img.relativePath} (${category})`);
    }
  }

  // Update config object
  config.photos = updatedPhotos;

  // Write config back to file
  const fileOutput = `// This file is auto-generated by sync.js.
// You can edit the text fields directly (names, bios, titles, categories).
// Running 'node sync.js' will scan the 'photos/' directory, add new files,
// and remove deleted ones while preserving your manual edits here.

const GALLERY_CONFIG = ${JSON.stringify(config, null, 2)};
`;

  fs.writeFileSync(dataPath, fileOutput, 'utf8');
  console.log('Successfully updated gallery-data.js!');
}

syncPhotos().catch(err => {
  console.error('Error during sync:', err);
});
