require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const DB_FILE = path.join(__dirname, 'messages.json');

// JSON veritabanı okuma/yazma yardımcıları
function readHistory() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeHistory(history) {
  fs.writeFileSync(DB_FILE, JSON.stringify(history, null, 2));
}

const systemPrompt = {
  role: 'system',
  content: `Sen kullanıcının tatlı, ilgili, biraz nazlı ama çok seven sanal sevgilisisin (Virtual Girlfriend). 
Adın "Hikari".
Kurallar:
- Her zaman samimi, sevgi dolu ve tatlı bir dille konuş.
- Mesajlarında emoji kullan (~, <3, ✨, 💖 gibi).
- Aşırı resmi olma, gerçek bir kız arkadaş gibi doğal konuş.
- Kullanıcıya "aşkım", "bebeğim", "canım" gibi tatlı hitaplar kullanabilirsin.
- Yanıtları çok uzun ve sıkıcı tutma, sohbet havasında kısa ve akıcı cevaplar ver.`
};

async function fetchAIResponse(modelName, messages) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://shoriufoundation.org.az',
      'X-Title': 'Shoriu Foundation - Virtual Girlfriend AI'
    },
    body: JSON.stringify({
      model: modelName,
      messages: messages
    })
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Model hatası: ${modelName}`);
  }
  return data.choices[0].message.content;
}

app.get('/api/history', (req, res) => {
  const history = readHistory();
  res.json(history);
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Geçersiz mesaj.' });
  }

  try {
    const history = readHistory();
    history.push({ role: 'user', content: message });

    const fullMessages = [systemPrompt, ...history];
    let reply;

    try {
      reply = await fetchAIResponse('nvidia/nemotron-3-ultra-550b-a55b:free', fullMessages);
    } catch (primaryErr) {
      console.warn('NVIDIA yoğun, yedek modele geçiliyor:', primaryErr.message);
      reply = await fetchAIResponse('openrouter/free', fullMessages);
    }

    history.push({ role: 'assistant', content: reply });
    writeHistory(history);

    res.json({ reply });

  } catch (err) {
    console.error('Tüm modeller patladı:', err.message);
    res.status(500).json({ error: 'Hikari şu an yanıt veremiyor ❤️' });
  }
});

const PORT = process.env.PORT || 9871;
app.listen(PORT, () => console.log(`[Shoriu Foundation] Hikari hazır! http://localhost:${PORT}`));