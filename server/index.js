require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const contactsRouter = require('./routes/contacts');
const touchpointsRouter = require('./routes/touchpoints');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/contacts', authMiddleware, contactsRouter);
app.use('/api/contacts/:contactId/touchpoints', authMiddleware, touchpointsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
