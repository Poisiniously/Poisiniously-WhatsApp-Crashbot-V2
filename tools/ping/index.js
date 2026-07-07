module.exports = {
    name: 'ping',
    description: 'Responds with pong!',
    async execute(sock, msg, args) {
        const remoteJid = msg.key.remoteJid;
        await sock.sendMessage(remoteJid, { text: '🏓 Pong!' });
    }
};
