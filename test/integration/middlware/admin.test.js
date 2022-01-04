const request = require('supertest');
const User = require('../../../models/user');
const Category = require('../../../models/category');

describe('admin middleware', () => {
    let token;

    const exec = async () => {
        return await request(server)
            .post('/api/categories')
            .set('x-auth-token', token)
            .send({ name: "Category1" });
    };

    beforeEach(async () => {
        server = require('../../../index');
        token = new User().generateAuthToken();
    });

    afterEach(async () => {
        await Category.deleteMany({});
        await server.close();
    });

    it('should return 403 if user is not an admin', async () => {
        const res = await exec();
        expect(res.status).toBe(403);
    });

    it('should return 200 if user is an admin', async () => {
        token = new User({ isAdmin: true }).generateAuthToken();
        const res = await exec();
        expect(res.status).toBe(200);
    });
});