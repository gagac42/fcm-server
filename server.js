import express from 'express';
import fetch from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// DEBUG ROUTE – over, že premenná je OK
app.get('/debug', (req, res) => {
  if (!process.env.GOOGLE_CREDENTIALS) {
    return res.status(500).json({ error: 'GOOGLE_CREDENTIALS is undefined' });
  }
  try {
    const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    return res.json({ loaded: true, keys: Object.keys(creds) });
  } catch (e) {
    return res
      .status(500)
      .json({ error: `"${process.env.GOOGLE_CREDENTIALS}" is not valid JSON` });
  }
});

app.post('/send', async (req, res) => {
  const { token, title, body } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  // Načítame service account
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  } catch (e) {
    return res.status(500).json({ error: 'Invalid GOOGLE_CREDENTIALS JSON' });
  }

  // Pripravíme FCM správu
  const message = {
    message: {
      token,
      notification: {
        title: title || 'Nová správa',
        body: body || 'Niečo prišlo!'
      }
    }
  };

  try {
    // Získame OAuth2 token
    const auth = new GoogleAuth({
      credentials: {
        client_email: serviceAccount.client_email,
        // TU sme pridali .replace na prekonvertovanie "\n" na reálne nové riadky:
        private_key: serviceAccount.private_key.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/firebase.messaging']
    });
    const accessToken = await auth.getAccessToken();
    console.log('✅ Got access token');

    // POŠLIŤ NA FCM HTTP v1 API
    const fcmRes = await fetch(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      }
    );

    const data = await fcmRes.json();
    console.log('✅ FCM response status:', fcmRes.status, data);
    return res.status(fcmRes.status).json(data);

  } catch (err) {
    console.error('🔥 Chyba pri odosielaní FCM:', err.stack || err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server beží na porte ${PORT}`);
});
