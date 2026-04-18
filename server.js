const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Home page -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Check-in/out form
app.get('/giris', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// QR Code endpoint
const QRCode = require('qrcode');
app.get('/api/qrcode', async (req, res) => {
  try {
    const formUrl = (process.env.BASE_URL || `http://localhost:${env.PORT}`) + '/giris';
    const dataUrl = await QRCode.toDataURL(formUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
    res.json({ qr: dataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/check-in', require('./routes/checkin'));
app.use('/api/active', require('./routes/active'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/students', require('./routes/students'));
app.use('/api/export', require('./routes/export'));
app.use('/api/stats', require('./routes/stats'));

// Error handler
app.use(require('./middleware/errorHandler'));

// Socket.IO
const io = require('./config/socket')(server);
app.set('io', io);

server.listen(env.PORT, () => {
  console.log(`Server: http://localhost:${env.PORT}`);
});
