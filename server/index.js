require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const authRouter = require('./routes/auth');
const contactsRouter = require('./routes/contacts');
const touchpointsRouter = require('./routes/touchpoints');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/contacts', authMiddleware, contactsRouter);
app.use('/api/contacts/:contactId/touchpoints', authMiddleware, touchpointsRouter);

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
