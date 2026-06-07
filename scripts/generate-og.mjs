import sharp from 'sharp'
import { readFileSync } from 'fs'

const svg = readFileSync('./public/og-default.svg')

await sharp(Buffer.from(svg))
  .resize(1200, 630)
  .png({ quality: 100 })
  .toFile('./public/og-default.png')

console.log('✓ public/og-default.png 생성 완료')