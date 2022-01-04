const request = require('supertest');
const mongoose = require('mongoose');
const Category = require('../../../models/category');

describe('objectIdvalidator middleware', () => {
    let objectId;

    const exec = async () => {
        return await request(server)
            .get(`/api/categories/${objectId}`);
    };

    beforeEach(async () => {
        server = require('../../../index');
        objectId = mongoose.Types.ObjectId();
    });

    afterEach(async () => {
        await Category.deleteMany({});
        await server.close();
    });

    it('should return 400 if no valid id is passed', async () => {
        objectId = '12345';
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 200 if valid id is passed', async () => {
        let category = new Category({
            name: 'Category1',
            insert: new Date(),
            createdBy: mongoose.Types.ObjectId()
        });
        category = await category.save();
        objectId = category._id;
        const res = await exec();
        expect(res.status).toBe(200);
    });
});