const express = require('express');
const _ = require('lodash');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const errorHandler = require('../middleware/errorHandler');
const idValidator = require('../middleware/objectIdValidator');
const Product = require('../models/product');
const { Category } = require('../models/category');


const router = express.Router();

router.get('/:id', idValidator, errorHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).select('-createdBy');
    if (!product) return res.status(404).send('Product not found.');
    res.send(product);
}));

router.get('/', errorHandler(async (req, res) => {
    let products;

    if (!_.isEmpty(req.query)) {
        const filter = {};

        if (req.query.name)
            filter.name = { $regex: req.query.name, $options: 'i' }

        if (req.query.description)
            filter.description = { $regex: req.query.description, $options: 'i' }

        if (req.query.minPrice || req.query.maxPrice) {
            const minPrice = req.query.minPrice || 0;
            const maxPrice = req.query.maxPrice || Number.MAX_SAFE_INTEGER;
            filter.discountPrice = {
                $gte: minPrice,
                $lte: maxPrice
            }
        }

        if (req.query.categoryId)
            filter.categoryId = req.query.categoryId

        products = await Product.find(filter)
            .sort('name')
            .select('-createdBy');
    } else {
        products = await Product.find().sort('name').select('-createdBy');
    }

    res.send(products);
}));

router.post('/', [auth, admin], errorHandler(async (req, res) => {
    const validation = Product.validate(req.body);

    if (!validation.result) return res.status(400).send(validation.message);

    let product = await Product.findOne({ name: req.body.name });
    if (product) return res.status(400).send('Product name is already used.');

    let category = await Category.findById(req.body.categoryId);
    if (!category) return res.status(400).send('Category not found.');

    // prices are rounded in mongoose Product model

    product = new Product({
        name: req.body.name,
        description: req.body.description,
        basePrice: req.body.basePrice,
        discountPrice: req.body.discountPrice,
        discountPercentage: req.body.discountPercentage,
        insert: new Date(),
        createdBy: req.user._id,
        category: req.body.categoryId
    });

    if (product.discountPercentage) {
        // discount price calculation
        let discountPrice = (product.basePrice * (100 - product.discountPercentage) / 100);

        if (discountPrice >= 0.01) {
            // rounding discount price with 2 decimal
            product.discountPrice = Math.round((discountPrice + Number.EPSILON) * 1e2) / 1e2;
        }
        else {
            product.discountPrice = 0.01;
        }
    } else if (!product.discountPrice) {
        product.discountPrice = product.basePrice;
    }

    product = await product.save();
    res.send(_.pick(product, ['_id', 'name', 'description', 'basePrice', 'discountPrice', 'discountPercentage', 'insert']));
}));


router.patch('/applyDiscount/:id', [auth, admin, idValidator], errorHandler(async (req, res) => {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send('Product not found.');

    const params = {
        basePrice: product.basePrice,
        discountPrice: req.body.discountPrice,
        discountPercentage: req.body.discountPercentage
    };

    const validation = Product.validateApplyDiscount(params);
    if (!validation.result) return res.status(400).send(validation.message);

    if (params.discountPrice) {
        product.discountPrice = params.discountPrice;
        product.discountPercentage = null;
    } else {
        product.discountPercentage = params.discountPercentage;
        params.discountPrice = (product.basePrice * (100 - params.discountPercentage) / 100);

        if (params.discountPrice >= 0.01) {
            // rounding discount price with 2 decimal
            product.discountPrice = Math.round((params.discountPrice + Number.EPSILON) * 1e2) / 1e2;
        }
        else {
            product.discountPrice = 0.01;
        }
    }

    product = await product.save();
    res.send(product);
}));

router.delete('/:id', [auth, admin, idValidator], errorHandler(async (req, res) => {
    const product = await Product.findByIdAndRemove(req.params.id).select('-createdBy');
    if (!product) return res.status(404).send('Product not found');
    res.send(product);
}));

module.exports = router;