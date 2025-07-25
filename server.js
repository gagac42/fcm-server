import express from 'express';
import fetch from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/send', async (req, res) => {
  const { token, title, body } = req.body;

  if (!token) return res.status(400).json({ error: 'Missing token' });

  const message = {
    message: {
      token,
      notification: {
        title: title || "Nová správa",
        body: body || "Niečo prišlo!"
      }
    }
  };

  try {
    // ✅ Načítame celý JSON objekt z environment variable
    const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new GoogleAuth({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key
      },
      scopes: ['https://www.googleapis.com/auth/firebase.messaging']
    });

    const accessToken = await auth.getAccessToken();
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Chyba pri odosielaní:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server beží na porte ${PORT}`);
});
