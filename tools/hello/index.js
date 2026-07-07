module.exports = {
    name: 'hello',
    description: 'Greets the user',
    async execute(sock, msg, args) {
        const remoteJid = msg.key.remoteJid;
        await sock.sendMessage(remoteJid, { text: '👋 Hello there! How can I help you today?' });
    }
};
