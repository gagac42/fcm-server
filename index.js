const express = require('express');
const bodyParser = require('body-parser');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Názov FCM scope pre HTTP v1
const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];
// Tvoje FCM projektové ID (z Firebase console)
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

// Funkcia na získanie access tokenu z service account JSON
async function getAccessToken() {
  const auth = new GoogleAuth({
    scopes: SCOPES,
    credentials: {
      type: process.env.FIREBASE_TYPE,
      project_id: PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID
    }
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

// 🔔 Zjednotený endpoint pre Cloud Script aj Postman test
app.post('/send', async (req, res) => {
  try {
    const { fcmToken, title, body, data } = req.body;
    const accessToken = await getAccessToken();

    const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
    const message = {
      message: {
        token: fcmToken,
        notification: { title, body },
        data: data || {}
      }
    };

    await axios.post(url, message, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      }
    });

    res.status(200).json({ result: 'ok' });
  } catch (err) {
    console.error("❌ Send error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
