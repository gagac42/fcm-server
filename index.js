const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();

// 1) Health‑check
app.get('/', (req, res) => {
  res.send('OK');
});

// 2) Načítame JSON telo
app.use(express.json());

// 3) CORS (aby Postman mohol volať)
app.use(cors());

// Init Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 4) Debug wrapper pred validáciou
app.post('/sendNotification', (req, res) => {
  console.log('🔥 REQ.BODY:', req.body);

  const { token, messageText } = req.body;
  if (!token || !messageText) {
    console.error('❌ Missing token or messageText:', req.body);
    return res.status(400).json({ error: 'Missing token or messageText' });
  }

  // pôvodná logika
  const message = { token, notification: { title: 'Nová správa!', body: messageText }, android: { priority: 'high' } };
  admin.messaging().send(message)
    .then(response => {
      console.log('✅ FCM sent:', response);
      res.json({ success: true, response });
    })
    .catch(err => {
      console.error('❌ FCM error:', err);
      res.status(500).json({ error: err.message });
    });
});

// 5) Štart servera
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server beží na porte ${PORT}`);
});
