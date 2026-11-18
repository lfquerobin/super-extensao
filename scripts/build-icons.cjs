/* Raster assets are derived from the single tightly cropped vector source. */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
async function buildIcons() {
  const source = path.join(root, 'icons/super-icon.svg');
  const svg = fs.readFileSync(source);
  // Square browser assets preserve the symbol's proportions and transparent canvas.
  const sizes = [16,19,24,32,38,48,64,72,96,128,256,360,512];
  for (const size of sizes) {
    const png = await sharp(svg, { density: 384 }).resize(size, size, {
      fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }
    }).png().toBuffer();
    if ([16,32,48,128].includes(size)) fs.writeFileSync(path.join(root, `icons/icon${size}.png`), png);
    fs.writeFileSync(path.join(root, 'vpn/img', `icon-${size}.png`), png);
  }
  fs.writeFileSync(path.join(root, 'vpn/img/vpn-logo.svg'), svg);
  console.log('Brand SVG and browser/VPN icon assets synchronized.');
}
if (require.main === module) buildIcons().catch(error => {console.error(error);process.exitCode=1;});
module.exports = { buildIcons };
