const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();

// Health-check endpoint
app.get('/', (req, res) => {
  res.send('OK');
});

// 1) Parsovanie JSON tela
app.use(express.json());

// 2) CORS pred každým requestom
app.use(cors());

// Debug parsovania service account (iba na chvíľu)
console.log("🛠️ Starting debug for service account...");
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log("✅ Service account parsed, project_id:", serviceAccount.project_id);
} catch (e) {
  console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", e.message);
}

// Inicializuj Firebase Admin SDK iba ak je serviceAccount validný
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.error("⚠️ No valid serviceAccount – Firebase Admin SDK NOT initialized.");
}

// Push-notification endpoint
app.post('/sendNotification', async (req, res) => {
  console.log('🔥 REQ.BODY:', req.body);

  const { token, messageText } = req.body;
  if (!token || !messageText) {
    console.error('❌ Missing token or messageText:', req.body);
    return res.status(400).json({ error: 'Missing token or messageText' });
  }

  const message = {
    token,
    notification: { title: 'Nová správa!', body: messageText },
    android: { priority: 'high' }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ FCM sent:', response);
    return res.json({ success: true, response });
  } catch (err) {
    console.error('❌ FCM error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Štart servera na porte z env alebo 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server beží na porte ${PORT}`);
});
