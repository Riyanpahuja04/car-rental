// Simple Express backend for car rental system
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Use db.js for all data operations
const db = require('./db');
const fs = require('fs');
const usersFile = './data/users.json';

// --- Cars ---
app.get('/api/cars', (req, res) => {
  res.json(db.getAllCars());
});

app.get('/api/cars/:vin', (req, res) => {
  const car = db.getCarByVIN(req.params.vin);
  if (!car) return res.status(404).json({ error: 'Car not found' });
  res.json(car);
});

// --- Orders ---
app.get('/api/orders', (req, res) => {
  res.json(db.getAllOrders());
});

app.post('/api/orders', (req, res) => {
  const cars = db.getAllCars();
  const { vin, user, name, phone, license, start, days } = req.body;
  const car = cars.find(c => c.vin === vin);
  if (!car || !car.available) return res.status(400).json({ error: 'Car unavailable' });
  const orders = db.getAllOrders();
  const order = {
    orderId: orders.length + 1,
    vin, user, name, phone, license, start, days,
    status: 'pending',
    timestamp: new Date().toISOString()
  };
  db.addOrder(order);
  car.available = false;
  db.saveAllCars(cars);
  res.json(order);
});

// --- Users ---
app.get('/api/users', (req, res) => {
  res.json(db.getAllUsers());
});

app.post('/api/users', (req, res) => {
  const users = db.getAllUsers();
  const { email, password, name, license, phone } = req.body;
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'User exists' });
  const user = { email, password, name, license, phone, registered: new Date().toISOString() };
  users.push(user);
  db.saveAllUsers(users);
  res.json(user);
});

// --- Activity ---
app.post('/api/activity', (req, res) => {
  const activity = { ...req.body, activityId: db.getAllActivity().length + 1, timestamp: new Date().toISOString() };
  db.addActivity(activity);
  res.json(activity);
});

// --- Login ---
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', email, password);
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const user = users.find(u => u.email === email && u.password === password);
  console.log('User found:', user.email, user.password);
  if (user) {
    res.json({ success: true, user: { email: user.email, name: user.name } });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

app.listen(PORT, () => {
  console.log(`Car rental backend running on http://localhost:${PORT}`);
});
