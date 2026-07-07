const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { loadCommands, handleMessage } = require('./commandHandler');

async function startBot() {
    // 1. Load your commands
    loadCommands();

    // 2. Set up multi-file authentication session storage
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    // 3. Initialize WhatsApp Socket connection
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Displays QR code in your terminal
        logger: pino({ level: 'silent' }) // Keeps terminal cleaner
    });

    // 4. Track Connection Updates (QR Code, logged in, disconnected)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting: ', shouldReconnect);
            // Reconnect if not logged out
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('🚀 WhatsApp Bot is successfully connected and online!');
        }
    });

    // 5. Save Credentials whenever updated
    sock.ev.on('creds.update', saveCreds);

    // 6. Listen for incoming messages
    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                // Ignore outgoing messages sent by the bot itself
                if (msg.key.fromMe) continue;
                
                // Pass the message to our custom handler
                await handleMessage(sock, msg);
            }
        }
    });
}

// Fire up the engine!
startBot();
