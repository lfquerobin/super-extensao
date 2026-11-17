/* Raster assets are derived from the single tightly cropped vector source. */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
async function buildIcons() {
  const source = path.join(root, 'icons/super-icon.svg');
  const svg = fs.readFileSync(source);
  // Square browser assets retain the symbol's proportions. A flat dark tile
  // keeps the white symbol legible in both light and dark browser toolbars.
  const sizes = [16,19,24,32,38,48,64,72,96,128,256,360,512];
  for (const size of sizes) {
    const png = await sharp(svg, { density: 384 }).resize(size, size, {
      fit: 'contain', background: '#121015'
    }).flatten({ background: '#121015' }).png().toBuffer();
    if ([16,32,48,128].includes(size)) fs.writeFileSync(path.join(root, `icons/icon${size}.png`), png);
    for (const directory of ['vpn/img', 'vendor/proton-source/source/img'])
      fs.writeFileSync(path.join(root, directory, `icon-${size}.png`), png);
  }
  for (const directory of ['vpn/img', 'vendor/proton-source/source/img'])
    fs.writeFileSync(path.join(root, directory, 'vpn-logo.svg'), svg);
  console.log('Brand SVG and browser/VPN icon assets synchronized.');
}
if (require.main === module) buildIcons().catch(error => {console.error(error);process.exitCode=1;});
module.exports = { buildIcons };
