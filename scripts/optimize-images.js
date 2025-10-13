/**
 * Script untuk mengoptimasi semua gambar di folder public
 * Mengkonversi ke WebP dan AVIF untuk performa maksimal
 * 
 * Install dependencies:
 * npm install sharp --save-dev
 * 
 * Usage:
 * node scripts/optimize-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Konfigurasi
const CONFIG = {
  inputDir: path.join(__dirname, '../public'),
  outputDir: path.join(__dirname, '../public/optimized'),
  formats: ['webp', 'avif'],
  quality: {
    jpeg: 80,
    png: 90,
    webp: 80,
    avif: 75,
  },
  sizes: {
    hero: { width: 600, height: 611 },
    portfolio: { width: 800, height: 1000 },
    thumbnail: { width: 400, height: 500 },
    testimonial: { width: 128, height: 128 },
  }
};

// Buat folder output jika belum ada
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Fungsi untuk mendapatkan semua file gambar
 */
function getImageFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && item !== 'optimized' && item !== 'node_modules') {
      files.push(...getImageFiles(fullPath));
    } else if (stat.isFile() && /\.(jpg|jpeg|png)$/i.test(item)) {
      files.push(fullPath);
    }
  });

  return files;
}

/**
 * Optimasi gambar individual
 */
async function optimizeImage(inputPath, outputDir) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const relativePath = path.relative(CONFIG.inputDir, path.dirname(inputPath));
  const targetDir = path.join(outputDir, relativePath);

  // Buat directory jika belum ada
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`\n📸 Processing: ${path.relative(CONFIG.inputDir, inputPath)}`);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Original optimized
    const ext = path.extname(inputPath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
      await image
        .jpeg({ quality: CONFIG.quality.jpeg, progressive: true, mozjpeg: true })
        .toFile(path.join(targetDir, `${filename}.jpg`));
      console.log(`  ✓ Optimized JPEG`);
    } else if (ext === '.png') {
      await image
        .png({ quality: CONFIG.quality.png, compressionLevel: 9 })
        .toFile(path.join(targetDir, `${filename}.png`));
      console.log(`  ✓ Optimized PNG`);
    }

    // WebP conversion
    await sharp(inputPath)
      .webp({ quality: CONFIG.quality.webp, effort: 6 })
      .toFile(path.join(targetDir, `${filename}.webp`));
    console.log(`  ✓ Created WebP`);

    // AVIF conversion (best compression)
    await sharp(inputPath)
      .avif({ quality: CONFIG.quality.avif, effort: 9 })
      .toFile(path.join(targetDir, `${filename}.avif`));
    console.log(`  ✓ Created AVIF`);

    // Create responsive sizes untuk gambar besar
    if (metadata.width > 600) {
      // Thumbnail
      await sharp(inputPath)
        .resize(400, null, { withoutEnlargement: true })
        .webp({ quality: CONFIG.quality.webp })
        .toFile(path.join(targetDir, `${filename}-thumb.webp`));
      console.log(`  ✓ Created thumbnail`);

      // Medium size
      await sharp(inputPath)
        .resize(800, null, { withoutEnlargement: true })
        .webp({ quality: CONFIG.quality.webp })
        .toFile(path.join(targetDir, `${filename}-medium.webp`));
      console.log(`  ✓ Created medium size`);
    }

    // Get file sizes
    const originalSize = fs.statSync(inputPath).size;
    const webpSize = fs.statSync(path.join(targetDir, `${filename}.webp`)).size;
    const avifSize = fs.statSync(path.join(targetDir, `${filename}.avif`)).size;
    
    const webpSavings = ((1 - webpSize / originalSize) * 100).toFixed(1);
    const avifSavings = ((1 - avifSize / originalSize) * 100).toFixed(1);

    console.log(`  💾 Original: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`  💾 WebP: ${(webpSize / 1024).toFixed(1)} KB (${webpSavings}% smaller)`);
    console.log(`  💾 AVIF: ${(avifSize / 1024).toFixed(1)} KB (${avifSavings}% smaller)`);

  } catch (error) {
    console.error(`  ❌ Error processing ${inputPath}:`, error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting image optimization...\n');
  console.log(`Input directory: ${CONFIG.inputDir}`);
  console.log(`Output directory: ${CONFIG.outputDir}\n`);

  const imageFiles = getImageFiles(CONFIG.inputDir);
  
  if (imageFiles.length === 0) {
    console.log('❌ No images found to optimize');
    return;
  }

  console.log(`Found ${imageFiles.length} images to optimize\n`);

  let processed = 0;
  let failed = 0;

  for (const file of imageFiles) {
    try {
      await optimizeImage(file, CONFIG.outputDir);
      processed++;
    } catch (error) {
      console.error(`Failed to process ${file}:`, error);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Optimization complete!');
  console.log(`   Processed: ${processed}`);
  if (failed > 0) {
    console.log(`   Failed: ${failed}`);
  }
  console.log('='.repeat(50));
  console.log('\n💡 Tips:');
  console.log('   1. Replace images in /public with optimized versions');
  console.log('   2. Use WebP with JPEG fallback in your components');
  console.log('   3. Use AVIF for even better compression (check browser support)');
  console.log('\nExample usage in Next.js Image component:');
  console.log('   <Image src="/image.webp" alt="..." ... />');
}

// Run
main().catch(console.error);