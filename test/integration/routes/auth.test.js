const request = require('supertest');
const bcrypt = require('bcrypt');
const User = require('../../../models/user');

describe('/api/users/authentication', () => {
    let server;
    let email;
    let password;

    beforeEach(async () => {
        server = require('../../../index');
        email = 'email@email.com';
        password = 'Ab4c498d3efg1*';
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        await new User({
            email: email,
            password: hashPassword,
            name: 'Lucas',
            surname: 'Green',
            isAdmin: false,
            insert: new Date()
        }).save();
    });

    afterEach(async () => {
        await User.deleteMany({});
        await server.close();
    });

    const httpPost = async () => {
        return await request(server)
            .post('/api/users/authentication')
            .send({
                email: email,
                password: password
            });
    }

    it('should return 400 is email is not provided', async () => {
        email = '';
        const res = await httpPost();
        expect(res.status).toBe(400);
    });

    it('should return 400 is password is not provided', async () => {
        password = '';
        const res = await httpPost();
        expect(res.status).toBe(400);
    });

    it('should return 400 if invalid email is provided', async () => {
        email = 'a@mail.com';
        const res = await httpPost();
        expect(res.status).toBe(400);
    });

    it('should return 400 if invalid password is provided', async () => {
        password = 'a123A*';
        const res = await httpPost();
        expect(res.status).toBe(400);
    });

    it('should return 200 is log in is valid', async () => {
        const res = await httpPost();
        expect(res.status).toBe(200);
    });


});