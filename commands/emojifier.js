const urls = require('../assets/images.json');
const { Canvas, loadImage } = require('skia-canvas');
const sharp = require('sharp');
const { AttachmentBuilder } = require('discord.js');
const { rgbToHsv, hsvToRgb } = require('../statics/color');

let ready = false;
let width;
let height;
let pixels;
let emojis;
let images;
(async () => {
    emojis = Object.keys(urls);
    pixels = [];
    console.log('Loading emoji graphics...');
    images = await Promise.all(Object.values(urls).map(url => loadImage(url)));
    width = 32;
    height = width;
    const canvas = new Canvas(1,1);
    const ctx = canvas.getContext('2d');
    console.log('Extracting emoji pixels...');
    for (const idx in images) {
        ctx.clearRect(0,0,width,height);
        ctx.drawImage(images[idx], 0,0, canvas.width,canvas.height);
        const data = ctx.getImageData(0,0, width,height).data;
        const colors = rgbToHsv(data);
        pixels.push([emojis[idx], colors]);
        images[idx] = [emojis[idx], images[idx]];
    }
    images = Object.fromEntries(images);
    console.log('Emoji command ready!')
    ready = true;
})()
async function startDraw(message, file) {
    const rootMsg = await message.reply('Loading target image...');
    const req = await fetch(message.attachments.at(file).proxyURL);
    let image = Buffer.from(await req.bytes());
    if (['image/webp', 'image/gif', 'image/avif'].includes(req.headers.get('content-type')))
        image = sharp(image);
    const toTransform = await loadImage(image).catch(() => {});
    if (!toTransform) return rootMsg.edit('The image is in an unsupported format (supports png,jpeg,svg,webp,gif,avif,pdf ONLY)');
    let tilesWide = Math.round(toTransform.width / width);
    let tilesHigh = Math.round(toTransform.height / height);
    const scale = Math.min(24 / tilesWide, 24 / tilesHigh) * (message.arguments.scale || 1);
    tilesWide *= scale;
    tilesHigh *= scale;
    tilesWide = Math.round(tilesWide);
    tilesHigh = Math.round(tilesHigh);
    const canvas = new Canvas(tilesWide, tilesHigh);
    const ctx = canvas.getContext('2d');
    await rootMsg.edit('Extracting image squares...');
    ctx.drawImage(toTransform, 0,0, canvas.width, canvas.height);
    const segments = [];
    for (let y = 0; y < canvas.height; y++)
        for (let x = 0; x < canvas.width; x++) {
            const data = ctx.getImageData(x,y, 1,1).data;
            const colors = rgbToHsv(data);
            segments.push(colors);
        }
    if (segments.length > 16000) return rootMsg.edit('Image or image scale is to big.');
    // if (segments.length > 256) return rootMsg.edit('Your image must not produce any more then 256 emojis.');
    await rootMsg.edit('Weighting emojis...');
    let idx = 0;
    let emoji = 0;
    let lastTime = Date.now();
    const possible = [];
    const inter = setInterval(async () => {
        const start = Date.now();
        const t = () => (Date.now() - start) < 4000;
        for (; idx < segments.length && t(); idx++) {
            possible[idx] ??= [];
            if (emoji >= emojis.length) emoji = 0;
            for (; emoji < emojis.length && t(); emoji++) {
                possible[idx][emoji] = {
                    emoji: pixels[emoji][0],
                    weight: Math.abs(segments[idx].h - pixels[emoji][1].h) +
                        Math.abs(segments[idx].s - pixels[emoji][1].s) +
                        Math.abs(segments[idx].v - pixels[emoji][1].v) +
                        Math.abs(segments[idx].r - pixels[emoji][1].r) +
                        Math.abs(segments[idx].g - pixels[emoji][1].g) +
                        Math.abs(segments[idx].b - pixels[emoji][1].b) +
                        Math.abs(segments[idx].a - pixels[emoji][1].a) +
                        Math.abs(segments[idx].a - pixels[emoji][1].a)
                }
            }
        }
        if (idx >= segments.length) {
            clearInterval(inter);
            await rootMsg.edit('Finding best suited emojis...');
            possible.forEach(list => list.sort((a,b) => a.weight - b.weight));
            rootMsg.delete();
            canvas.width *= width;
            canvas.height *= height;
            ctx.clearRect(0,0, canvas.width, canvas.height);
            for (let i = 0; i < possible.length; i++) {
                const x = (i % tilesWide) * width;
                const y = Math.floor(i / tilesWide) * height;
                ctx.drawImage(images[possible[i][0].emoji], x,y, width, height);
            }
            message.reply({
                content: 'Finished;',
                files: [new AttachmentBuilder(await canvas.toBuffer(), { name: 'converted.png' })]
            });
            return;
        }
        const dt = Date.now() - lastTime;
        lastTime = Date.now();
        rootMsg.edit(`Weighting emojis... ${Math.round((idx / segments.length) * 100)}% ETA <t:${Math.floor((Date.now() + (dt * (segments.length - idx))) / 1000)}:R>`);
    }, 4100);
}

module.exports = {
    name: 'emojify',
    category: 'dumb fun',
    sDesc: 'Converts an image to emojis',
    lDesc: 'Converts any one image into a set of discord emojis',
    args: [
        {
            type: 'number',
            name: 'scale',
            desc: 'The scale to use for the image',
            min: 0,
            max: 10,
            required: false
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (!ready) return message.reply('Command not ready for use.');
        if (message.args === 'dump') {
            const sqaureSize = Math.ceil(Math.sqrt(pixels.length)); 
            const canvas = new Canvas(sqaureSize * (width +10), sqaureSize * height);
            const ctx = canvas.getContext('2d');
            let i = 0;
            for (let y = 0; y < canvas.height; y += height) {
                for (let x = 0; x < canvas.width; x += width +10) {
                    ctx.drawImage(images[pixels[i][0]], x,y, width, height);
                    const color = '#' + hsvToRgb(pixels[i][1]).slice(0, 3).map(v => Math.round((v / 255) * 100).toString(16).padStart(2, '0')).join('');
                    ctx.fillStyle = color;
                    ctx.fillRect(x + width, y, 10, height);
                    i++;
                    if (i >= pixels.length) break;
                }
            }
            message.reply({
                files: [new AttachmentBuilder(await canvas.toBuffer(), { name: 'debug.png' })]
            });
            return;
        }
        if (message.attachments.size < 1) return message.reply('Must have atleast one attached image.');
        startDraw(message, 0);
    },
};
