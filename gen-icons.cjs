const sharp = require('sharp')
const path = require('path')

const pub = path.join(__dirname, 'public')
const BG = { r: 26, g: 26, b: 46, alpha: 1 }

// Remove grey background by replacing it with transparency,
// then composite onto the app's dark background
async function makeIcon(size, dest) {
  // Step 1: get raw image with alpha, flatten grey (#a3a3a3±30) → transparent
  const raw = await sharp(path.join(__dirname, '..', 'icon.png'))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { data, info } = raw
  const { width, height, channels } = info

  // Replace near-grey pixels (background) with transparent
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i+1], b = data[i+2]
    const isGrey = Math.abs(r - 163) < 28 && Math.abs(g - 163) < 28 && Math.abs(b - 163) < 28
    if (isGrey) data[i+3] = 0
  }

  // Step 2: build dark background and composite icon on top
  const padding = Math.round(size * 0.1)
  const iconSize = size - padding * 2

  const iconBuf = await sharp(data, { raw: { width, height, channels } })
    .resize(iconSize, iconSize, { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } })
    .png()
    .toBuffer()

  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: iconBuf, gravity: 'centre' }])
    .png()
    .toFile(dest)
}

Promise.all([
  makeIcon(512, path.join(pub, 'icon-512.png')),
  makeIcon(192, path.join(pub, 'icon-192.png')),
  makeIcon(180, path.join(pub, 'apple-touch-icon.png')),
  makeIcon(48,  path.join(pub, 'favicon.png')),
]).then(() => console.log('done')).catch(e => console.error(e))
