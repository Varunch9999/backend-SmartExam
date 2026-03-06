const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/SOES";

main().then(() => {
  console.log("connected to DB");
}).catch((err) => {
  console.log(err);
});

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.use(cors({ 
    origin: ["https://frontend-smart-exam.vercel.app", "http://localhost:5173"],
    credentials: true 
}));
app.use(express.json());

// simple root
app.get('/', (req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/attempts', require('./routes/attempts'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/uploads', express.static(path.join(__dirname,'uploads')));
app.use('/api/leaderboard', require('./routes/leaderboard'));

// New routes
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/notifications', require('./routes/notifications'));

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("server listening on", port);
});
