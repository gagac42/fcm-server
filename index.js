const express = require('express');
const bodyParser = require('body-parser');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

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

app.post('/sendNotification', async (req, res) => {
  try {
    const { fcmToken, title, body, data } = req.body;
    const accessToken = await getAccessToken();

    const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

   const collapseKey = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;

const message = {
  message: {
    token: fcmToken,
    notification: {
      title: title,
      body: body
    },
    android: {
      collapseKey: collapseKey,  // sem to patrí
      priority: "high",
      ttl: "86400s",
      notification: {
        icon: "notification_icon",
        defaultSound: true
      }
    },
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
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
