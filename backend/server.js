const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.endsWith('vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// DB Connection
console.log("Connecting to MongoDB...");
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000 // 5 seconds timeout
})
  .then(() => console.log('MongoDB Connected successfully.'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    console.error('Make sure your MongoDB URI is correct and your IP is whitelisted in Atlas.');
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/campaigns', require('./routes/campaigns'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
