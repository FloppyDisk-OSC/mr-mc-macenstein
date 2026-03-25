const emojis = require('./emojis.json');
const { Canvas, loadImage } = require('skia-canvas');
const canvas = new Canvas(32, 32);
const ctx = canvas.getContext('2d');
const fs = require('fs');
ctx.textDrawingMode = "glyph";
ctx.font = '25.702px "Noto Color Emoji"';
ctx.fillStyle = 'white';
ctx.textBaseline = 'top';
fs.writeFileSync('./assets/images.json', JSON.stringify(Object.fromEntries(emojis.map(icon => {
    ctx.clearRect(0, 0, 32, 32);
    ctx.fillText(icon, 0, 0);
    return [icon, canvas.toDataURL()];
})), null, 4));
