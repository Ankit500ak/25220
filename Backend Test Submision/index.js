const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sharedLoggerPath = path.join(__dirname, '..', 'Logging Middleware', 'logger.js');
const { requestLogger } = require(sharedLoggerPath);
const validUrl = require('valid-url');
const { customAlphabet } = require('nanoid');

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(requestLogger);
const store = new Map();

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

function isValidShortcode(code) {
  return /^[0-9A-Za-z_-]{4,20}$/.test(code);
}

app.post('/shorturls', (req, res) => {
  const { url, validity, shortcode } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing "url" field' });
  }

  if (!validUrl.isWebUri(url)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  let minutes = 30;
  if (validity !== undefined) {
    if (!Number.isInteger(validity) || validity <= 0) {
      return res.status(400).json({ error: 'Invalid "validity"; must be positive integer minutes' });
    }
    minutes = validity;
  }

  let code = shortcode;
  if (code) {
    if (typeof code !== 'string' || !isValidShortcode(code)) {
      return res.status(400).json({ error: 'Provided shortcode is invalid. Use 4-20 alphanumeric characters' });
    }
    if (store.has(code)) {
      return res.status(409).json({ error: 'Shortcode already in use (collision)' });
    }
  } else {
    let attempts = 0;
    do {
      code = nano();
      attempts += 1;
      if (attempts > 5) break;
    } while (store.has(code));
    while (store.has(code)) {
      code = nano();
    }
  }

  const expiry = new Date(Date.now() + minutes * 60 * 1000);
  store.set(code, { url, expiry });

  const host = req.get('host') || `localhost:${port}`;
  const protocol = req.protocol || 'http';

  res.status(201).json({ shortLink: `${protocol}://${host}/${code}`, expiry: expiry.toISOString() });
});

app.get('/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  if (!shortcode) return res.status(400).json({ error: 'Missing shortcode' });

  const record = store.get(shortcode);
  if (!record) return res.status(404).json({ error: 'Shortcode not found' });

  if (new Date() > record.expiry) {
    store.delete(shortcode);
    return res.status(410).json({ error: 'Shortcode expired' });
  }
  res.redirect(record.url);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  
});
