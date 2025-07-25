import express from 'express';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Načítaj serviceAccount.json
const serviceAccount = JSON.parse(
  fs.readFileSync('serviceAccount.json', 'utf8')
);

// Inicializuj Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.post('/send', async (req, res) => {
  const { token, title, body } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  try {
    const message = {
      token,
      notification: {
        title: title || 'Nová správa',
        body: body || 'Niečo prišlo!'
      }
    };
    const response = await admin.messaging().send(message);
    return res.json({ success: true, messageId: response });
  } catch (err) {
    console.error('Chyba FCM:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/debug', (req, res) => res.send('FCM server OK'));

app.listen(PORT, () => {
  console.log(`🚀 Server beží na porte ${PORT}`);
});
