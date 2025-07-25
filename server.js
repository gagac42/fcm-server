import express from 'express';
import fetch from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

// ---------------------- DEBUG ROUTE ----------------------
app.get('/debug', (req, res) => {
  if (!process.env.GOOGLE_CREDENTIALS) {
    return res
      .status(500)
      .json({ error: 'GOOGLE_CREDENTIALS is undefined in process.env' });
  }
  try {
    const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    return res.json({
      loaded: true,
      keys: Object.keys(creds)
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: `"${process.env.GOOGLE_CREDENTIALS}" is not valid JSON` });
  }
});
// ---------------------------------------------------------

const PORT = process.env.PORT || 3000;

app.post('/send', async (req, res) => {
  const { token, title, body } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const auth = new GoogleAuth({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });

  try {
    const accessToken = await auth.getAccessToken();
    const response = await fetch(
      `https://fcm-server-2.onrender.com/send`,
      {
        method: 'POST',
      }
    );
    // ...
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server beží na porte ${PORT}`);
});
