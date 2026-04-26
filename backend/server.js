const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' })); // Augmenter la limite pour les images

const users = [
  {
    id: 'u1',
    firstName: 'Mahmoud',
    lastName: 'Kchaou',
    fullName: 'Mahmoud Kchaou',
    username: 'EtoileLibre42',
    email: 'etoile42@iit.tn',
    phone: '+21620000000',
    password: 'whisper123',
    avatar: 'E',
    role: 'Administrateur',
  },
  {
    id: 'u2',
    firstName: 'Sarra',
    lastName: 'Ben Ali',
    fullName: 'Sarra Ben Ali',
    username: 'ModSarra',
    email: 'modo@iit.tn',
    phone: '+21621000000',
    password: 'whisper123',
    avatar: 'S',
    role: 'Moderateur',
  },
  {
    id: 'u3',
    firstName: 'Yassine',
    lastName: 'Trabelsi',
    fullName: 'Yassine Trabelsi',
    username: 'UserYassine',
    email: 'user@iit.tn',
    phone: '+21622000000',
    password: 'whisper123',
    avatar: 'Y',
    role: 'Membre',
  },
];

// Stockage en mémoire pour les posts et notifications
const posts = [];
const notifications = [];

const sessions = new Map();

function normalizePhone(value = '') {
  return String(value).replace(/\s+/g, '').trim();
}

function sanitizeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
  };
}

function getTokenFromRequest(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice('Bearer '.length).trim();
}

function authMiddleware(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
  const userId = sessions.get(token);
  const user = users.find((u) => u.id === userId);
  if (!user) {
    sessions.delete(token);
    return res.status(401).json({ ok: false, message: 'Session expired' });
  }
  req.user = user;
  req.token = token;
  next();
}

app.post('/api/auth/register', (req, res) => {
  const {
    firstName = '',
    lastName = '',
    username = '',
    email = '',
    phone = '',
    password = '',
    avatar = 'U',
  } = req.body || {};

  const fn = String(firstName).trim();
  const ln = String(lastName).trim();
  const un = String(username).trim();
  const em = String(email).trim().toLowerCase();
  const ph = normalizePhone(phone);
  const pw = String(password);

  if (!fn || !ln || !un || !em || !pw) {
    return res.status(400).json({ ok: false, message: 'Required fields are missing' });
  }
  if (pw.length < 8) {
    return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters' });
  }

  const exists = users.some(
    (u) => u.email.toLowerCase() === em || u.username.toLowerCase() === un.toLowerCase() || (ph && normalizePhone(u.phone) === ph),
  );
  if (exists) {
    return res.status(409).json({ ok: false, message: 'User already exists (email/username/phone)' });
  }

  const user = {
    id: `u_${Date.now()}`,
    firstName: fn,
    lastName: ln,
    fullName: `${fn} ${ln}`,
    username: un,
    email: em,
    phone: ph,
    password: pw,
    avatar: String(avatar || 'U').charAt(0).toUpperCase(),
    role: 'Membre',
  };

  users.push(user);
  const token = crypto.randomUUID();
  sessions.set(token, user.id);

  return res.status(201).json({
    ok: true,
    token,
    user: sanitizeUser(user),
  });
});

app.post('/api/auth/login', (req, res) => {
  const { identifier = '', password = '' } = req.body || {};
  const id = String(identifier).trim().toLowerCase();
  const pw = String(password);

  if (!id || !pw) {
    return res.status(400).json({ ok: false, message: 'Identifier and password are required' });
  }

  const user = users.find(
    (u) =>
      u.email.toLowerCase() === id ||
      u.username.toLowerCase() === id ||
      normalizePhone(u.phone).toLowerCase() === id,
  );

  if (!user || user.password !== pw) {
    return res.status(401).json({ ok: false, message: 'Invalid credentials' });
  }

  const token = crypto.randomUUID();
  sessions.set(token, user.id);

  return res.json({
    ok: true,
    token,
    user: sanitizeUser(user),
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ ok: true, user: sanitizeUser(req.user) });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  sessions.delete(req.token);
  res.json({ ok: true });
});

// === ENDPOINTS POSTS ===

// Créer un nouveau post
app.post('/api/posts', authMiddleware, (req, res) => {
  const { title = '', content = '', image = null, topic = '' } = req.body || {};
  
  if (!content.trim() && !image) {
    return res.status(400).json({ ok: false, message: 'Content or image is required' });
  }
  
  if (!topic.trim()) {
    return res.status(400).json({ ok: false, message: 'Topic is required' });
  }
  
  const post = {
    id: `post_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    title: title.trim(),
    content: content.trim(),
    image: image,
    topic: topic.trim(),
    authorId: req.user.id,
    author: req.user.username,
    authorAvatar: req.user.avatar,
    status: 'pending',
    createdAt: new Date().toISOString(),
    likes: 0,
    dislikes: 0,
    comments: []
  };
  
  posts.push(post);
  
  res.status(201).json({
    ok: true,
    post: post
  });
});

// Obtenir les posts en attente (modérateurs/admins seulement)
app.get('/api/posts/pending', authMiddleware, (req, res) => {
  if (!['Moderateur', 'Administrateur'].includes(req.user.role)) {
    return res.status(403).json({ ok: false, message: 'Access denied' });
  }
  
  const pendingPosts = posts.filter(p => p.status === 'pending');
  res.json({ ok: true, posts: pendingPosts });
});

// Obtenir les posts approuvés
app.get('/api/posts/approved', authMiddleware, (req, res) => {
  const approvedPosts = posts
    .filter(p => p.status === 'approved')
    .sort((a, b) => new Date(b.approvedAt || b.createdAt) - new Date(a.approvedAt || a.createdAt));
  res.json({ ok: true, posts: approvedPosts });
});

// Obtenir les posts d'un utilisateur (pending + approved)
app.get('/api/posts/mine', authMiddleware, (req, res) => {
  const myPosts = posts
    .filter(p => p.authorId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ ok: true, posts: myPosts });
});

// Approuver un post (modérateurs/admins seulement)
app.post('/api/posts/:postId/approve', authMiddleware, (req, res) => {
  if (!['Moderateur', 'Administrateur'].includes(req.user.role)) {
    return res.status(403).json({ ok: false, message: 'Access denied' });
  }
  
  const post = posts.find(p => p.id === req.params.postId);
  if (!post) {
    return res.status(404).json({ ok: false, message: 'Post not found' });
  }
  
  post.status = 'approved';
  post.approvedAt = new Date().toISOString();
  post.approvedBy = req.user.id;
  
  // Créer une notification pour l'auteur
  const notification = {
    id: `notif_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    userId: post.authorId,
    type: 'post_approved',
    title: 'Publication approuvée',
    message: `Votre publication "${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}" a été approuvée et est maintenant visible.`,
    postId: post.id,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  notifications.push(notification);
  
  res.json({ ok: true, post: post });
});

// Rejeter un post (modérateurs/admins seulement)
app.post('/api/posts/:postId/reject', authMiddleware, (req, res) => {
  if (!['Moderateur', 'Administrateur'].includes(req.user.role)) {
    return res.status(403).json({ ok: false, message: 'Access denied' });
  }
  
  const postIndex = posts.findIndex(p => p.id === req.params.postId);
  if (postIndex === -1) {
    return res.status(404).json({ ok: false, message: 'Post not found' });
  }
  
  const post = posts[postIndex];
  
  // Créer une notification pour l'auteur
  const notification = {
    id: `notif_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    userId: post.authorId,
    type: 'post_rejected',
    title: 'Publication rejetée',
    message: `Votre publication "${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}" n'a pas été approuvée. Veuillez respecter les règles de la communauté.`,
    postId: post.id,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  notifications.push(notification);
  
  // Supprimer le post
  posts.splice(postIndex, 1);
  
  res.json({ ok: true, message: 'Post rejected and deleted' });
});

// === ENDPOINTS NOTIFICATIONS ===

// Obtenir les notifications de l'utilisateur
app.get('/api/notifications', authMiddleware, (req, res) => {
  const userNotifications = notifications
    .filter(n => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50); // Limiter à 50 notifications
  
  res.json({ ok: true, notifications: userNotifications });
});

// Marquer une notification comme lue
app.post('/api/notifications/:notifId/read', authMiddleware, (req, res) => {
  const notification = notifications.find(n => n.id === req.params.notifId && n.userId === req.user.id);
  if (!notification) {
    return res.status(404).json({ ok: false, message: 'Notification not found' });
  }
  
  notification.read = true;
  res.json({ ok: true, notification: notification });
});

// Marquer toutes les notifications comme lues
app.post('/api/notifications/read-all', authMiddleware, (req, res) => {
  const userNotifications = notifications.filter(n => n.userId === req.user.id);
  userNotifications.forEach(n => n.read = true);
  
  res.json({ ok: true, message: 'All notifications marked as read' });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'whisper-backend',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
