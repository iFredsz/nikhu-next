// convert-to-webp.js
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const publicDir = path.join(process.cwd(), 'public')

async function convertImages(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      await convertImages(filePath)
    } else if (/\.(png|jpg|jpeg)$/i.test(file)) {
      const outputFilePath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp')

      try {
        // Skip jika WebP sudah ada
        if (fs.existsSync(outputFilePath)) {
          console.log(`⚡ Skipped (already exists): ${outputFilePath}`)
          continue
        }

        // Konversi ke WebP
        await sharp(filePath)
          .webp({ quality: 85 })
          .toFile(outputFilePath)

        console.log(`✅ Converted: ${filePath} → ${outputFilePath}`)

        // Hapus file lama setelah sukses
        fs.unlinkSync(filePath)
        console.log(`🗑️ Deleted original: ${filePath}`)
      } catch (err) {
        console.error(`❌ Error converting ${filePath}:`, err)
      }
    }
  }
}

convertImages(publicDir).then(() => {
  console.log('\n🎉 Done converting all images to WebP and cleaned originals!')
})
