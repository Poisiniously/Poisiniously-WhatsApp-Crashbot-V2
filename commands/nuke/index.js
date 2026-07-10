module.exports = {
    name: 'nuke',
    description: 'Deautorisiert alle Admins und eliminiert anschließend restlos alle Mitglieder aus der Gruppe.',
    async execute(sock, msg, args) {
        const from = msg.key.remoteJid;

        // 1. Prüfen, ob es sich um eine Gruppe handelt
        if (!from.endsWith('@g.us')) {
            await sock.sendMessage(from, { text: '🚨 *ZUGRIFF VERWEIGERT:* Dieser taktische Befehl kann nur innerhalb eines Gruppen-Sektors ausgeführt werden!' }, { quoted: msg });
            return;
        }

        try {
            // 2. Gruppenmetadaten abrufen
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;

            // Die JID des Bots ermitteln, damit er sich nicht selbst degradiert oder kickt
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

            // 3. Alle Admins finden (außer dem Bot selbst)
            const admins = participants
                .filter(p => (p.admin === 'admin' || p.admin === 'superadmin') && p.id !== botJid)
                .map(p => p.id);

            // 4. Taktische Warnung senden
            await sock.sendMessage(from, { text: '☢️ *WARNUNG: NUKLEARER ERSTSCHLAG EINGELEITET!* ☢️\n\nAlle Kommandostrukturen werden aufgelöst, die Befehlskette wird unterbrochen und der gesamte Sektor wird restlos bereinigt...' });

            // 5. SCHRITT 1: Alle Admins demoten (Befehlskette brechen / degradieren)
            if (admins.length > 0) {
                try {
                    await sock.groupParticipantsUpdate(from, admins, 'demote');
                    // Kurze Pause, damit WhatsApp die Rechte-Änderung im Netzwerk verarbeitet
                    await new Promise(resolve => setTimeout(resolve, 1500));
                } catch (demoteError) {
                    console.log('Einige Offiziere (evtl. der Sektor-Ersteller) konnten nicht degradiert werden.');
                }
            }

            // 6. SCHRITT 2: Aktuelle Teilnehmerliste nach dem Demote neu laden und alle Truppen kicken
            const updatedMetadata = await sock.groupMetadata(from);
            const targets = updatedMetadata.participants
                .map(p => p.id)
                .filter(id => id !== botJid);

            if (targets.length > 0) {
                // Alle verbleibenden Kontingente restlos eliminieren
                await sock.groupParticipantsUpdate(from, targets, 'remove');
            }

            // 7. Abschlussmeldung senden und den Sektor als Bot selbst verlassen
            await sock.sendMessage(from, { text: '💥 *SEKTOR BEREINIGT.* Mission erfolgreich abgeschlossen. Basis wird evakuiert. Out.' });
            await sock.groupLeave(from);

        } catch (error) {
            console.error(error);
            await sock.sendMessage(from, { text: '❌ *FEHLER BEIM ABSCHUSS:* Startsequenz abgebrochen. Überprüfe, ob meine Admin-Rechte ausreichen oder ob der Sektor-Gründer das Signal blockiert.' }, { quoted: msg });
        }
    }
};
