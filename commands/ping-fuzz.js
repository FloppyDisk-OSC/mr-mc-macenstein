let lastPing = 0;
module.exports = {
    name: 'ping-electricfuzzball',
    category: 'dumb fun',
    sDesc: 'Pings electricfuzzball',
    lDesc: 'Pings <@1203782668928421949> five times in a row',
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if ((Date.now() - lastPing) < 2 * 60 * 1000) return;
        lastPing = Date.now();
        message.channel.send('<@1203782668928421949>');
        message.channel.send('<@1203782668928421949>');
        message.channel.send('<@1203782668928421949>');
        message.channel.send('<@1203782668928421949>');
        message.channel.send('<@1203782668928421949>');
    },
};
