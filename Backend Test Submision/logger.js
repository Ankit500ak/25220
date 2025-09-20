const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'service.log');

function safeStringify(obj) {
  try { return JSON.stringify(obj); } catch (e) { return String(obj); }
}

function writeLog(entry) {
  const line = safeStringify(entry) + '\n';
  fs.appendFile(logFile, line, (err) => {});
}

function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url, headers } = req;
  const body = req.body;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const entry = {
      timestamp: new Date().toISOString(),
      method,
      url,
      statusCode: res.statusCode,
      durationMs: duration,
      body: body || null,
      ip: req.ip || (req.connection && req.connection.remoteAddress) || null,
      userAgent: headers['user-agent'] || null
    };
    writeLog(entry);
  });

  next();
}

module.exports = { requestLogger, logFile };
