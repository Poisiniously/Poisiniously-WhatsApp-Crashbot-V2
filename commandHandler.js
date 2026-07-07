const fs = require('fs');
const path = require('path');

const commands = new Map();
const commandsDir = path.join(__dirname, 'commands');

// Load all commands dynamically
const loadCommands = () => {
    const folders = fs.readdirSync(commandsDir);

    for (const folder of folders) {
        const commandPath = path.join(commandsDir, folder, 'index.js');
        
        if (fs.existsSync(commandPath)) {
            const command = require(commandPath);
            if (command.name && typeof command.execute === 'file' || command.execute) {
                commands.set(command.name.toLowerCase(), command);
                console.log(`✅ Loaded command: [${command.name}]`);
            }
        }
    }
};

// Handle incoming messages
const handleMessage = async (sock, msg) => {
    // Ensure the message has text content
    const messageText = msg.message?.conversation || 
                        msg.message?.extendedTextMessage?.text || 
                        '';

    // Define your bot prefix (e.g., ! or /)
    const prefix = '!';
    if (!messageText.startsWith(prefix)) return;

    // Split text into command and arguments
    const args = messageText.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Check if command exists and execute it
    if (commands.has(commandName)) {
        try {
            const command = commands.get(commandName);
            await command.execute(sock, msg, args);
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ An error occurred while executing that command.' });
        }
    }
};

module.exports = { loadCommands, handleMessage };
