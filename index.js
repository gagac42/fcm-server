const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.get("/", (req, res) => {
  res.send("OK");
});
app.use(cors());
app.use(bodyParser.json());

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.post('/sendNotification', async (req, res) => {
  const { token, messageText } = req.body;

  if (!token || !messageText) {
    return res.status(400).json({ error: 'Missing token or messageText' });
  }

  const message = {
    token: token,
    notification: {
      title: 'Nová správa!',
      body: messageText
    },
    android: {
      priority: "high"
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notifikácia odoslaná:', response);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('Chyba pri odoslaní:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server beží na porte ${PORT}`);
});
