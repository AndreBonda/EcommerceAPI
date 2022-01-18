const request = require('supertest');
const mongoose = require('mongoose');
const Product = require('../../../models/product');
const User = require('../../../models/user');
const { Category } = require('../../../models/category');

describe('/api/products', () => {
    let server;

    beforeEach(async () => {
        server = require('../../../index');
    });

    afterEach(async () => {
        await Product.deleteMany({});
        await Category.deleteMany({});
        await server.close();
    });

    describe('GET /id', () => {
        let id;

        beforeEach(async () => {
            let product = await Product({
                name: 'Product1',
                basePrice: 10,
                discountPrice: 10,
                insert: new Date(),
                createdBy: mongoose.Types.ObjectId(),
                category: mongoose.Types.ObjectId()
            });

            product = await product.save();
            id = product._id;
        });

        const httpGet = async () => {
            return await request(server)
                .get(`/api/products/${id}`);
        }

        it('should return 404 if product does not exist', async () => {
            id = mongoose.Types.ObjectId();
            const res = await httpGet();
            expect(res.status).toBe(404);
        });

        it('should return 200 if product exists', async () => {
            const res = await httpGet();
            expect(res.status).toBe(200);
        });
    });

    describe('GET /', () => {
        beforeEach(async () => {
            await Product.collection.insertMany([
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
        });

        it('should return all products', async () => {
            const res = await request(server).get('/api/products');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3);
            expect(res.body.some(x => x.name === 'product1'));
            expect(res.body[0]).not.toHaveProperty('createdBy');
        });

        it('should filter by name', async () => {
            const name = 'product1';
            const res = await request(server).get(`/api/products?name=${name}`);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toEqual(name);
        });

        it('should filter by name (like)', async () => {
            const name = 'product';
            const res = await request(server).get(`/api/products?name=${name}`);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3);
        });

        it('should filter by description', async () => {
            const description = 'description1';
            const res = await request(server).get(`/api/products?description=${description}`);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].description).toEqual(description);
        });

        it('should filter by description (like)', async () => {
            const description = 'description';
            const res = await request(server).get(`/api/products?description=${description}`);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3);
        });

        it('should filter by price (lower bound)', async () => {
            const minPrice = 15;
            const res = await request(server).get(`/api/products?minPrice=${minPrice}`);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0].name).toEqual('product2');
            expect(res.body[1].name).toEqual('product3');
        });

        it('should filter by price (upper bound)', async () => {
            const maxPrice = 25;
            const res = await request(server).get(`/api/products?maxPrice=${maxPrice}`);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0].name).toEqual('product1');
            expect(res.body[1].name).toEqual('product2');
        });

        it('should filter by price (range)', async () => {
            const minPrice = 15;
            const maxPrice = 25;
            const res = await request(server).get(`/api/products?minPrice=${minPrice}&maxPrice=${maxPrice}`);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toEqual('product2');
        });
    });

    describe('POST /', () => {
        let token;
        let name;
        let description;
        let basePrice;
        let discountPrice;
        let discountPercentage;
        let categoryId;

        beforeEach(async () => {
            token = new User({ isAdmin: true }).generateAuthToken();
            name = 'Product1';
            description = 'Description1';
            basePrice = 100;
            discountPrice = 50;

            let category = new Category({
                name: "Category1",
                createdBy: mongoose.Types.ObjectId(),
                insert: new Date()
            });
            category = await category.save();
            categoryId = category._id;
            basePrice = 100;
            discountPrice = 50;
            discountPercentage = undefined;
        });

        const httpPost = async () => {
            return await request(server)
                .post('/api/products')
                .set('x-auth-token', token)
                .send({
                    name: name,
                    description: description,
                    basePrice: basePrice,
                    discountPrice: discountPrice,
                    discountPercentage: discountPercentage,
                    categoryId: categoryId
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

        it('should return 400 if product name is already used', async () => {
            let product = new Product({
                name: name,
                description: description,
                basePrice: basePrice,
                discountPrice: discountPrice,
                insert: new Date(),
                createdBy: mongoose.Types.ObjectId(),
                category: categoryId
            });
            await product.save();

            // product inserted with name Product1 and sending POST with the same name
            const res = await httpPost();
            expect(res.status).toBe(400);
        });

        it('should return 400 if category not found', async () => {
            let product = new Product({
                name: name,
                description: description,
                basePrice: basePrice,
                discountPrice: discountPrice,
                insert: new Date(),
                createdBy: mongoose.Types.ObjectId(),
                category: categoryId
            });
            await product.save();

            // sending POST with non-existent category
            name = 'New name';
            categoryId = mongoose.Types.ObjectId();

            const res = await httpPost();
            expect(res.status).toBe(400);
        });

        it('should return 400 discountPrice and discountPecentage are present at the same time', async () => {
            discountPercentage = 10;
            discountPrice = 10;

            const res = await httpPost();
            expect(res.status).toBe(400);
        });

        it('should return 400 if discountPrice is grater than basePrice', async () => {
            basePrice = 10;
            discountPrice = 15;

            const res = await httpPost();
            expect(res.status).toBe(400);
        });

        it('should return 200 if request is valid', async () => {
            const res = await httpPost();
            expect(res.status).toBe(200);
        });

        it('should calculate discountPrice if discountPercentage is passed', async () => {
            basePrice = 100;
            discountPrice = undefined;
            discountPercentage = 40;
            const res = await httpPost();
            expect(res.body.discountPrice).toBeCloseTo(60);
        });
    });

    describe('PATCH /applyDiscount/id', () => {
        let token;
        let id;
        let discountPrice;
        let discountPercentage;

        beforeEach(async () => {
            token = new User({ isAdmin: true }).generateAuthToken();

            let product = new Product({
                name: 'Product1',
                basePrice: 10,
                discountPrice: 10,
                insert: new Date(),
                createdBy: mongoose.Types.ObjectId(),
                category: mongoose.Types.ObjectId()
            });

            product = await product.save();
            id = product._id;
        });

        const httpPatch = async () => {
            return await request(server)
                .patch(`/api/products/applyDiscount/${id}`)
                .set('x-auth-token', token)
                .send({
                    discountPrice: discountPrice,
                    discountPercentage: discountPercentage,
                });
        }

        it('should return 400 if discountPrice and discountPercentage are both valued', async () => {
            discountPrice = 1;
            discountPercentage = 1;
            const res = await httpPatch();
            expect(res.status).toBe(400);
        });

        it('should return 400 if discountPrice and discountPercentage are not valued', async () => {
            discountPrice = undefined;
            discountPercentage = undefined;
            const res = await httpPatch();
            expect(res.status).toBe(400);
        });

        it('should return 400 if discountPrice is greater than basePrice', async () => {
            discountPrice = 15;
            discountPercentage = undefined;
            const res = await httpPatch();
            expect(res.status).toBe(400);
        });

        it('should return 200 if discountPrice is correct', async () => {
            discountPrice = 5;
            discountPercentage = undefined;
            const res = await httpPatch();
            expect(res.status).toBe(200);
        });

        it('should return 200 if discountPercentage is correct', async () => {
            discountPercentage = 60;
            discountPrice = undefined;
            const res = await httpPatch();
            expect(res.status).toBe(200);
            expect(res.body.discountPrice).toBeCloseTo(4, 2);
        });

        it('should calculate multi discount application', async () => {
            discountPercentage = 60;
            discountPrice = undefined;
            let res = await httpPatch();
            expect(res.status).toBe(200);
            expect(res.body.discountPrice).toBeCloseTo(4, 2);

            discountPercentage = undefined;
            discountPrice = 3;
            res = await httpPatch();
            expect(res.status).toBe(200);
            expect(res.body.discountPrice).toBeCloseTo(3, 2);
            expect(res.status).not.toHaveProperty('discountPercentage');
        });
    });

    describe('DELETE /id', () => {
        let token;
        let id;

        beforeEach(async () => {
            token = new User({ isAdmin: true }).generateAuthToken();

            let product = await Product({
                name: 'Product1',
                basePrice: 10,
                discountPrice: 10,
                insert: new Date(),
                createdBy: mongoose.Types.ObjectId(),
                category: mongoose.Types.ObjectId()
            });

            product = await product.save();
            id = product._id;
        });

        const httpDelete = async () => {
            return await request(server)
                .delete(`/api/products/${id}`)
                .set('x-auth-token', token);
        }

        it('should return 404 if product does not exist', async () => {
            id = mongoose.Types.ObjectId();
            const res = await httpDelete();
            expect(res.status).toBe(404);
        });

        it('should return 200 if product is deleted', async () => {
            const res = await httpDelete();
            expect(res.status).toBe(200);
            const product = await Product.findById(id);
            expect(product).toBeFalsy();
        });
    })
});