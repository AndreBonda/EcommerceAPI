const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const errorHandler = require('../middleware/errorHandler');
const idValidator = require('../middleware/objectIdValidator');
const Category = require('../models/category');

const router = express.Router();

router.get('/:id', idValidator, errorHandler(async (req, res) => {
    const category = await Category.findById(req.params.id).select('-createdBy');

    if (!category) return res.status(404).send('Category not found.');

    res.send(category);
}));

router.get('/', errorHandler(async (req, res) => {
    let categories;

    if (req.query.name)
        categories = await Category.find({ name: { $regex: req.query.name, $options: 'i' } }).sort('name').select('-createdBy');
    else
        categories = await Category.find().sort('name').select('-createdBy');

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

router.put('/:id', [auth, admin, idValidator], errorHandler(async (req, res) => {
    const validation = Category.validate(req.body);
    if (!validation.result) return res.status(400).send(validation.message);

    const category = await Category.findByIdAndUpdate(req.params.id,
        {
            name: req.body.name
        });

    if (!category) res.status(404).send('Category not found');

    res.send(category);
}));

router.delete('/:id', [auth, admin, idValidator], errorHandler(async (req, res) => {
    const category = await Category.findByIdAndRemove(req.params.id).select('-createdBy');
    if (!category) return res.status(404).send('Catgory not found');
    res.send(category);
}));

module.exports = router;