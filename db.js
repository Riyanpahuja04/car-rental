// db.js
const fs = require('fs');
const path = require('path');
const carsFile = path.join(__dirname, 'data/cars.json');
const usersFile = path.join(__dirname, 'data/users.json');
const ordersFile = path.join(__dirname, 'data/orders.json');
const activityFile = path.join(__dirname, 'data/user_activity.json');

function read(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function write(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Cars
exports.getAllCars = () => read(carsFile);
exports.getCarByVIN = vin => exports.getAllCars().find(c => c.vin === vin);
exports.saveAllCars = cars => write(carsFile, cars);

// Users
exports.getAllUsers = () => read(usersFile);
exports.getUserByEmail = email => exports.getAllUsers().find(u => u.email === email);
exports.saveAllUsers = users => write(usersFile, users);

// Orders
exports.getAllOrders = () => read(ordersFile);
exports.addOrder = order => {
  const orders = exports.getAllOrders();
  orders.push(order);
  write(ordersFile, orders);
};

// Activity
exports.getAllActivity = () => read(activityFile);
exports.addActivity = activity => {
  const activities = exports.getAllActivity();
  activities.push(activity);
  write(activityFile, activities);
};
