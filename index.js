const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('config');

const logger = require('./startup/logger');
const Category = require('./models/category');

const app = express();

app.use(express.json());

require("./startup/routes")(app);

app.get('/api/categories', async (req, res) => {
    const categories = await Category.find().sort('name').select('-createdBy');
    res.send(categories);
});

app.post('/api/category', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) res.status(401).send('No token provided');

    let userId;
    let isAdmin;
    try {
        const decodedPayload = jwt.verify(token, config.get('jwtSecretKey'));
        userId = decodedPayload._id;
        isAdmin = decodedPayload.isAdmin;
    } catch {
        return res.status(400).send('Invalid token');
    }

    if (!isAdmin) res.status(403).send('Access denied.');

    const validation = Category.validate(req.body);

    if (!validation.result) return res.status(400).send(validation.message);

    let category = await Category.findOne({ name: req.body.name });
    if (category) return res.status(400).send('Category name is already used.');

    category = new Category({
        name: req.body.name,
        insert: new Date(),
        createdBy: userId
    });

    category = await category.save();

    res.send({
        _id: category._id,
        name: category.name
    });
});



// db connection
require('./startup/db')();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => logger.info(`Listening on port ${port}...`));

module.exports = server;