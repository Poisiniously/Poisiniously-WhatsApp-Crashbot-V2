module.exports = {
    name: 'geh',
    description: 'Entfernt einen Nutzer aus der Gruppe.',
    async execute(sock, msg, args) {
        const from = msg.key.remoteJid;

        // Prüfen, ob es sich um eine Gruppe handelt
        if (!from.endsWith('@g.us')) {
            await sock.sendMessage(from, { text: '❌ Funktioniert nur in Gruppen!' }, { quoted: msg });
            return;
        }

        let targetJid = null;

        // 1. Option: Auf eine Nachricht antworten
        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = msg.message.extendedTextMessage.contextInfo.participant;
        } 
        // 2. Option: Nutzer wurde im Text markiert (erwähnt)
        else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        if (!targetJid) {
            await sock.sendMessage(from, { text: '❌ Fehlgeschlagen:* Du musst auf eine Nachricht antworten oder jemanden markieren!' }, { quoted: msg });
            return;
        }

        try {
            // Nutzer aus der Gruppe entfernen
            await sock.groupParticipantsUpdate(from, [targetJid], 'remove');
            
            // Kreative Bestätigung senden
            await sock.sendMessage(from, { 
                text: `Und tschüss! @${targetJid.split('@')[0]} ist freiwillig gegangen!`,
                mentions: [targetJid]
            });
        } catch (error) {
            console.error(error);
            await sock.sendMessage(from, { text: '❌ *Fehler:* Entweder bin ich kein Admin, oder der Zauber war gegen diesen Nutzer wirkungslos.' }, { quoted: msg });
        }
    }
};
