const express = require('express');
const http = require('http');
const fs = require('fs');
const socketIo = require('socket.io');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const server = express();
const app = http.createServer(server);
const io = socketIo(app);

let riwayatChat = [];

server.use(express.static('public'));
server.use(express.urlencoded({ extended: true }));

io.on('connection', (socket) => {

  socket.emit('messageHistory', riwayatChat);

  socket.on('message', (message) => {
    riwayatChat.push(message);
    io.emit('message', message);
  });

  socket.on('disconnect',() => {});
});

server.use(session({
  secret: 'key-Sato_Yuki12',
  resave: false,
  saveUninitialized: true
}));

const users = [];

function cekLogin(req, res, next) {
  if (req.session && req.session.user) {
      next();
  } else {
      res.redirect('/login');
  }
}

function simpanDataUser() {
  const data = JSON.stringify(users, null, 2);
  fs.writeFileSync('./config/users.json', data);
}

function bacaDataUser() {
  try {
      const data = fs.readFileSync('./config/users.json', 'utf8');
      var dataJson = JSON.parse(data);
      users.push(...dataJson);
      console.log('Data users berhasil di sinkronkan');
  } catch (err) {
      console.error('Gagal membaca file users.json:', err);
      return [];
  }
}

server.get('/register', (req, res) => {
  var html = fs.readFileSync('./form/register.html');
  res.setHeader('content-type','text/html');
  res.send(html);
});

server.post('/register', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = { name, email, password: hashedPassword };
  users.push(user);
  req.session.user = user; // Setel sesi pengguna setelah pendaftaran
  simpanDataUser();
  res.send('Silahkan kembali ke halaman <a href="/login">login</a> dan login dengan akun yang berhasil kamu buat.')
});

server.get('/login', (req, res) => {
  var html = fs.readFileSync('./form/login.html','utf8');
  res.send(html);
});

server.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = users.find(user => user.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).send('Email tidak terdaftar!!');
  }

  req.session.user = user; // Setel sesi pengguna setelah login
  res.redirect('/chat');
});

server.get('/logout', (req, res) => {
  req.session.destroy(); // Menghapus sesi pengguna saat logout
  res.redirect('/login');
});

server.use(cekLogin);

server.get('/chat',(req,res) => {
  var name = req.session.user.name;
  var html = fs.readFileSync('./view/index.html','utf8');
      html = html.replace('[NAME]',name);
  res.send(html);
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  bacaDataUser();
});
