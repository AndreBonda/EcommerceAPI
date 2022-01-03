const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const errorHandler = require('../middleware/errorHandler');
const Category = require('../models/category');

const router = express.Router();

router.get('/', errorHandler(async (req, res) => {
    const categories = await Category.find().sort('name').select('-createdBy');
    res.send(categories);
}));

router.post('/', [auth, admin], errorHandler(async (req, res) => {

    const validation = Category.validate(req.body);

    if (!validation.result) return res.status(400).send(validation.message);

    let category = await Category.findOne({ name: req.body.name });
    if (category) return res.status(400).send('Category name is already used.');

    category = new Category({
        name: req.body.name,
        insert: new Date(),
        createdBy: req.user._id
    });

    category = await category.save();

    res.send({
        _id: category._id,
        name: category.name
    });
}));

module.exports = router;