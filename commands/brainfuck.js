
function lexInput(string) {
    const out = [];
    let layer = 0;
    for (let i = 0; i < string.length; i++) {
        switch (string[i]) {
        case '<': out.push({ op: 'back-byte' }); break;
        case '>': out.push({ op: 'fore-byte' }); break;
        case '+': out.push({ op: 'incr-byte' }); break;
        case '-': out.push({ op: 'decr-byte' }); break;
        case ',': out.push({ op: 'inpt-byte' }); break;
        case '.': out.push({ op: 'outp-byte' }); break;
        case '[':
            out.push({ op: 'if', layer });
            layer++;
            break;
        case ']':
            layer--;
            const target = out.findIndex(lex => lex.layer === layer);
            out[target].target = i;
            out.push({ op: 'loop', target });
            break;
        }
    }
    return out;
}
module.exports = {
    name: 'brainfuck',
    category: 'dumb fun',
    sDesc: 'Runs any brainfuck code',
    lDesc: 'Simply runs brainfuck code. Can optionally include data to be given as input, added to the end of this command',
    args: [
        {
            type: 'any',
            name: 'code',
            required: true
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const inputs = message.args.split(' ').slice(1).join(' ');
        const memory = {}
        let dataPointer = 0;
        let instruction = 0;
        const instructions = lexInput(message.arguments.code);
        let inPointer = 0;
        const output = [];
        const running = Date.now();
        function end() {
            message.reply({
                content: `Finished with: ${output} (${output.map(String.fromCharCode).join('')})`,
                allowedMentions: {
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
            clearInterval(inter);
        }
        const inter = setInterval(() => {
            if (Date.now() - running > 10000) return end();
            let i = 0;
            execLoop: while (i < 10000) {
                const operation = instructions[instruction++];
                if (!operation) return end();
                switch (operation.op) {
                case 'back-byte': dataPointer++; break;
                case 'fore-byte': dataPointer--; if (dataPointer < 0) dataPointer = 0; break;
                case 'incr-byte':
                    if (!memory[dataPointer]) memory[dataPointer] = 0;
                    memory[dataPointer]++;
                    if (memory[dataPointer] > 255) memory[dataPointer] = 0;
                    break;
                case 'decr-byte':
                    if (!memory[dataPointer]) memory[dataPointer] = 0;
                    memory[dataPointer]--;
                    if (memory[dataPointer] < 0) memory[dataPointer] = 255;
                    break;
                case 'inpt-byte': memory[dataPointer] = inputs[inPointer++]; break;
                case 'outp-byte': output.push(memory[dataPointer]); break;
                case 'if': if (!memory[dataPointer]) instruction = operation.target; break;
                case 'loop': if (memory[dataPointer]) instruction = operation.target; break;
                default: 
                    end();
                    break execLoop;
                }
                i++;
            }
        }, 1000 / 30);
    },
};
