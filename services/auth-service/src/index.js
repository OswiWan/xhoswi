import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(cors());
app.use(express.json());

const users = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }
  if (users.has(email)) {
    return res.status(409).json({ error: 'user already exists' });
  }
  const hash = await bcrypt.hash(password, 10);
  users.set(email, { email, passwordHash: hash, createdAt: new Date() });
  res.status(201).json({ email });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email);
  if (!user) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

app.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing token' });
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET);
    res.json({ email: payload.email });
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
});

app.listen(PORT, () => {
  console.log(`auth-service listening on port ${PORT}`);
});
