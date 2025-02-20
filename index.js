const os = require('os'); const express = require('express'); const WebSocket = require('ws'); const TelegramBot = require('node-telegram-bot-api');

const app = express(); const basePort = 3000; let usedPorts = new Set(); const servers = {};

function getLocalIPv4() { const interfaces = os.networkInterfaces(); for (const iface of Object.values(interfaces)) { for (const info of iface) { if (info.family === 'IPv4' && !info.internal) { return info.address; } } } return '127.0.0.1'; }

function getRandomPort() { let port; do { port = Math.floor(Math.random() * (5000 - 3001) + 3001); } while (usedPorts.has(port)); usedPorts.add(port); return port; }

app.get('/start', (req, res) => { const token = req.query.token; const chatId = req.query.chatId; const adminUser = req.query.adminUser;

if (!token || !chatId || !adminUser) {
    return res.send("❌ خطأ: تأكد من إدخال Token و Chat ID و adminUser");
}

const localIP = getLocalIPv4();
const port = getRandomPort();
const bot = new TelegramBot(token, { polling: true });
const wss = new WebSocket.Server({ port });

servers[chatId] = { bot, wss, adminUser };

wss.on('connection', socket => {
    console.log(`🟢 متصل بالسيرفر على البورت ${port}`);

    bot.onText(/^\/cmd (.+)/, (msg, match) => {
        if (msg.chat.id.toString() !== chatId || msg.from.username !== adminUser) {
            return bot.sendMessage(msg.chat.id, '⚠️ ليس لديك الصلاحية لاستخدام هذا الأمر');
        }
        const command = match[1];
        const payload = {
            "header": {
                "version": 1,
                "requestId": require('uuid').v4(),
                "messagePurpose": "commandRequest",
                "messageType": "commandRequest"
            },
            "body": {
                "version": 1,
                "commandLine": command,
                "origin": { "type": "player" }
            }
        };
        socket.send(JSON.stringify(payload));
        bot.sendMessage(chatId, `✅ تم إرسال الأمر: ${command}`);
    });
});

const htmlResponse = `
    <!DOCTYPE html>
    <html lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تفاصيل السيرفر</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            h1 { color: green; }
            p { font-size: 18px; }
            code { background: #f4f4f4; padding: 5px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <h1>🎮 تم إنشاء السيرفر بنجاح!</h1>
        <p>اتصل بالسيرفر عبر Minecraft:</p>
        <code>/connect ${localIP}:${port}</code>
    </body>
    </html>
`;

res.send(htmlResponse);

});

app.listen(basePort, () => { console.log(🔗 افتح الرابط لإنشاء السيرفر: https://yourwebsite.com/start?token=YourToken&chatId=YourChatId&adminUser=YourAdmin); });

