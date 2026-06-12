const { Jimp } = require('jimp');

/**
 * Analyzes a PNG image (school logo) to find the most prominent primary color.
 * Filters out transparency and neutral background colors (white, black, grey).
 * 
 * @param {string} filePath - Path to the png image file.
 * @returns {Promise<string>} - Hex color string like "#1A2B3C".
 */
async function getLogoPrimaryColor(filePath) {
  try {
    const image = await Jimp.read(filePath);
    
    // Resize to a small thumbnail to speed up processing without losing color intent
    image.resize({ w: 64 });

    const counts = new Map();
    const { data } = image.bitmap;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // 1. Skip transparent or semi-transparent pixels (common in logo borders)
      if (a < 128) continue;

      // 2. Skip neutral background/outline colors (shades of grey/white/black)
      // We check saturation: if channels are nearly identical, it's a neutral shade.
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      if (saturation < 30) {
        // Filter out extreme white backgrounds or extreme black outlines
        if (r > 220 || r < 35) continue;
      }

      const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
      counts.set(hex, (counts.get(hex) || 0) + 1);
    }

    let prominentHex = '333333'; // Default to dark grey if no color found
    let maxCount = 0;

    for (const [hex, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        prominentHex = hex;
      }
    }

    return `#${prominentHex}`;
  } catch (error) {
    console.error(`Color extraction error for ${filePath}:`, error.message);
    return '#333333';
  }
}

module.exports = { getLogoPrimaryColor };