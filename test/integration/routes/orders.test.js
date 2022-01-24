const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');
const Order = require('../../../models/order');
const Product = require('../../../models/product');
const User = require('../../../models/user');

describe('/api/orders', () => {
    let server;

    beforeEach(async () => {
        server = require('../../../index');
    });

    afterEach(async () => {
        await Order.deleteMany({});
        await Product.deleteMany({});
        await server.close();
    });

    describe('GET', () => {
        let token;
        let orderId;

        beforeEach(async () => {
            token = new User({}).generateAuthToken();
            let userId = jwt.verify(token, config.get('jwtSecretKey'))._id;

            const order = await new Order({
                address: 'Address1',
                totalPrice: 20,
                status: 'booked',
                insert: new Date(),
                user: userId,
                products: [{
                    name: 'product1',
                    description: 'description1',
                    price: 10,
                    quantity: 2
                }]
            }).save();

            orderId = order._id;

            await new Order({
                address: 'Address2',
                totalPrice: 10,
                status: 'booked',
                insert: new Date(),
                user: mongoose.Types.ObjectId(),
                products: [{
                    name: 'product2',
                    description: 'description2',
                    price: 10,
                    quantity: 1
                }]
            }).save();
        });

        const httpGet = async () => {
            return await request(server)
                .get('/api/orders')
                .set('x-auth-token', token);
        }

        const httpGetById = async () => {
            return await request(server)
                .get(`/api/orders/${orderId}`)
                .set('x-auth-token', token);
        }

        it('should return 401 if no token is provided', async () => {
            token = '';
            const res = await httpGet();

            expect(res.status).toBe(401);
        });

        it('should return 400 if invalid token is provided', async () => {
            token = '1234';
            const res = await httpGet();

            expect(res.status).toBe(400);
        });

        it('should return his orders if a standard user is logged in', async () => {
            const res = await httpGet();

            expect(res.status).toBe(200);
            expect(res.body[0].address).toBe('Address1');
            expect(res.body.length).toBe(1);
            expect(Object.keys(res.body[0]))
                .toEqual(expect.arrayContaining(
                    ['_id', 'address', 'totalPrice', 'status', 'products', 'insert']
                ));
        });

        it('should return all orders if an admin user is logged in', async () => {
            token = new User({ isAdmin: true }).generateAuthToken();

            const res = await httpGet();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });

        it('should return 403 if standard user must not have access to this order', async () => {
            token = new User({ isAdmin: false }).generateAuthToken();

            const res = await httpGetById();
            expect(res.status).toBe(403);
        });

        it('should return 200', async () => {
            const res = await httpGetById();
            expect(res.status).toBe(200);
            expect(res.body.address).toBe('Address1');
            expect(Object.keys(res.body))
                .toEqual(expect.arrayContaining(
                    ['_id', 'address', 'totalPrice', 'status', 'products', 'insert']
                ));
        });
    });

    describe('POST', () => {
        let token;
        let address;
        let status;
        let products = [];

        beforeEach(async () => {
            token = new User({}).generateAuthToken();
            address = '200 Hollywood Avenue';
            status = 'booked';

            const dbProducts = await Product.collection.insertMany([
                {
                    name: 'product1',
                    description: 'description1',
                    basePrice: 10,
                    discountPrice: 10,
                    insert: new Date(),
                    createdBy: mongoose.Types.ObjectId(),
                    category: mongoose.Types.ObjectId()
                },
                {
                    name: 'product2',
                    description: 'description2',
                    basePrice: 20,
                    discountPrice: 20,
                    insert: new Date(),
                    createdBy: mongoose.Types.ObjectId(),
                    category: mongoose.Types.ObjectId()
                },
                {
                    name: 'product3',
                    description: 'description3',
                    basePrice: 30,
                    discountPrice: 30,
                    insert: new Date(),
                    createdBy: mongoose.Types.ObjectId(),
                    category: mongoose.Types.ObjectId()
                }
            ]);

            // dbProducts.insertedIds is not an array
            products.push({
                id: dbProducts.insertedIds['0'].toString(),
                quantity: 1
            });

            products.push({
                id: dbProducts.insertedIds['1'].toString(),
                quantity: 2
            });

            products.push({
                id: dbProducts.insertedIds['2'].toString(),
                quantity: 3
            });
        });

        afterEach(() => { products = [] });

        const httpPost = async () => {
            return await request(server)
                .post('/api/orders')
                .set('x-auth-token', token)
                .send({
                    address: address,
                    status: status,
                    products: products
                });
        }

        it('should return 401 if no token is provided', async () => {
            token = '';
            const res = await httpPost();
            expect(res.status).toBe(401);
        });

        it('should return 400 if invalid token is provided', async () => {
            token = '1234';
            const res = await httpPost();
            expect(res.status).toBe(400);
        });

        it('should return 400 if product id is invalid', async () => {
            products.push({ id: '123', quantity: 1 });
            const res = await httpPost();
            expect(res.status).toBe(400);
        });

        it('should return 404 if product does not exist', async () => {
            products.push({ id: mongoose.Types.ObjectId(), quantity: 1 });
            const res = await httpPost();
            expect(res.status).toBe(404);
        });

        it('should return 400 if the status is not valid', async () => {
            status = '123';
            const res = await httpPost();
            expect(res.status).toBe(400);
        });

        it('should return 200 if order is valid', async () => {
            const res = await httpPost();
            expect(res.status).toBe(200);
            expect(Object.keys(res.body))
                .toEqual(expect.arrayContaining(
                    ['_id', 'address', 'totalPrice', 'status', 'products', 'insert']
                ));
            expect(res.body.address).toEqual('200 Hollywood Avenue');
            expect(res.body.totalPrice).toBeCloseTo(140);
            expect(res.body.status).toBe('booked');
        });
    });
});