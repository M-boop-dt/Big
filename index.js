// index.js - WhatsApp Bot na Amri 300 zenye Emoji na React
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, makeInMemoryStore, DisconnectReason, proto } from '@whiskeysockets/baileys';
import P from 'pino';
import dotenv from 'dotenv';
dotenv.config();

const PREFIX = process.env.PREFIX || '!';
const ownerNumber = process.env.OWNER_NUMBER || '';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        logger: P({ level: 'info' }),
        printQRInTerminal: true,
        auth: state,
        version,
        browser: ['BenWhittaker-Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot();
            else console.log('Umejiondoa. Futa "auth_info" kujiunga tena.');
        }
    });

    const store = makeInMemoryStore({ logger: P({ level: 'fatal' }) });
    store.bind(sock.ev);

    const commands = {};

    const emojis = ['🔥','⚡','🌟','🚀','🎯','🧠','📦','🛠️','🌀','🎮','🔍','💡','📚','💬','🧪','📸','🧱','🧰','📈','🎵'];
    const names = [
        'info','help','about','ping','uptime','owner','menu','status','quote','fact',
        'time','date','weather','joke','meme','anime','ai','image','pdf','sticker'
    ];

    for (let i = 0; i < 300; i++) {
        const name = names[i % names.length] + (i >= names.length ? i : '');
        const emoji = emojis[i % emojis.length];
        commands[name] = async ({ sock, jid, args }) => {
            await sock.sendMessage(jid, {
                text: `${emoji} *Amri ${name}* imetekelezwa!\nArgs: ${args.join(' ')}`
            }, { react: { text: emoji, key: { remoteJid: jid, fromMe: true } } });
        };
    }

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (!text || !text.startsWith(PREFIX)) return;

        const [_, command, ...args] = text.trim().split(/\s+/);
        const name = command.toLowerCase().slice(PREFIX.length);
        if (commands[name]) {
            try {
                await commands[name]({ sock, jid: from, args });
            } catch (err) {
                console.error(err);
                await sock.sendMessage(from, { text: '⚠️ Hitilafu imetokea!' });
            }
        }
    });

    console.log(`✅ Bot imeanzishwa na amri ${Object.keys(commands).length}`);
}
startBot();
