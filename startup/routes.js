const express = require('express');
const users = require('../routes/users');
const categories = require('../routes/categories');
const products = require('../routes/products');
const orders = require('../routes/orders');

module.exports = function (app) {
    app.use(express.json());
    app.use('/api/users', users);
    app.use('/api/categories', categories);
    app.use('/api/products', products);
    app.use('/api/orders', orders);
}