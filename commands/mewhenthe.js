const { AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');

module.exports = {
    name: 'mewhenthe',
    category: 'dumb fun',
    sDesc: 'random color "me when the"',
    lDesc: 'Generates a random color with the text "Me when the"',
    args: [
        {
            type: 'string',
            name: 'text',
            desc: 'Text to display (separate top/bottom with |)',
            required: true
        }
    ],

    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const args = message.arguments;
        const text = args['text'] || 'Me when the | Me when the';
        const [topText, bottomText] = text.split('|').map(t => t.trim());

        // generate random color
        const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}`;

        const canvas = Canvas.createCanvas(600, 600);
        const ctx = canvas.getContext('2d');

        // background
        ctx.fillStyle = randomColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 50px Sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // top text
        ctx.fillText(topText, canvas.width / 2, 20);

        // bottom text
        ctx.textBaseline = 'bottom';
        ctx.fillText(bottomText, canvas.width / 2, canvas.height - 20);

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'mewhenthe.png' });

        await message.channel.send({
            content: `me when the ${randomColor}`,
            files: [attachment]
        });
    },
};
