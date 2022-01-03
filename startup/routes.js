const express = require('express');
const users = require('../routes/users');
const categories = require('../routes/categories');

module.exports = function (app) {
    app.use(express.json());
    app.use('/api/users', users);
    app.use('/api/categories', categories);
}