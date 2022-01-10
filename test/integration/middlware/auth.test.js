const request = require('supertest');
const User = require('../../../models/user');
const { Category } = require('../../../models/category');

describe('auth middleware', () => {
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

    it('should return 401 if no token is provided', async () => {
        token = '';
        const res = await exec();
        expect(res.status).toBe(401);
    });

    it('should return 400 if invalid token is provided', async () => {
        token = '1234';
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 200 if a valid token is provided', async () => {
        token = new User({ isAdmin: true }).generateAuthToken();
        const res = await exec();
        expect(res.status).toBe(200);
    });
});