const express = require('express');
const _ = require('lodash');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const errorHandler = require('../middleware/errorHandler');
const idValidator = require('../middleware/objectIdValidator');
const Order = require('../models/order');
const Product = require('../models/product');

const router = express.Router();

router.get('/', [auth], errorHandler(async (req, res) => {
    let orders;

    if (req.user.isAdmin)
        orders = await Order.find().select('-modify -user');
    else
        orders = await Order.find({ user: req.user._id }).select('-modify -user');

    res.send(orders);
}));

router.get('/:id', [idValidator, auth], errorHandler(async (req, res) => {
    let order = await Order.findById(req.params.id).select('-modify');;

    if (!order) return res.status(404).send('Order not found.');

    if (req.user.isAdmin)
        order = await Order.findById(req.params.id);
    else {
        if (!order.user.equals(req.user._id))
            return res.status(403).send('You do not have permission to access this resource');
    }

    res.send(_.pick(order, ['_id', 'address', 'totalPrice', 'status', 'products', 'insert', 'modify']));
}));

router.post('/', [auth], errorHandler(async (req, res) => {
    const validation = Order.validatePostOrder(req.body);

    if (!validation.result) return res.status(400).send(validation.message);

    let totalPrice = 0;
    let dbProduct;
    let products = [];

    for (let i in req.body.products) {
        let productOrdered = req.body.products[i];
        dbProduct = await Product.findById(productOrdered.id);
        if (!dbProduct) return res.status(404).send(`Product with id ${productOrdered.id} does not exist`);

        products.push({
            price: dbProduct.discountPrice,
            name: dbProduct.name,
            description: dbProduct.description,
            quantity: productOrdered.quantity
        });

        totalPrice += dbProduct.discountPrice * productOrdered.quantity;
    }

    const order = await new Order({
        address: req.body.address,
        totalPrice: totalPrice,
        status: req.body.status,
        products: products,
        insert: new Date(),
        user: req.user._id
    }).save();

    res.send(_.pick(order, ['_id', 'address', 'totalPrice', 'status', 'products', 'insert', 'modify']));
}));

module.exports = router;