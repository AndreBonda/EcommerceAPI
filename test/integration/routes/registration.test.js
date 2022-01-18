const request = require('supertest');
const User = require('../../../models/user');

describe('/api/users', () => {
    let server;
    let email;
    let password;
    let name;
    let isAdmin;

    const exec = async () => {
        return await request(server)
            .post('/api/users')
            .send({
                email: email,
                password: password,
                name: name,
                surname: surname,
                isAdmin: isAdmin
            });
    }

    beforeEach(async () => {
        server = require('../../../index');
        email = 'text@text.com';
        password = 'Prova1*';
        name = "Abc";
        surname = "Def";
        isAdmin = false;
    });

    afterEach(async () => {
        await User.deleteMany({});
        await server.close();
    });

    it('should return 400 if email not passed', async () => {
        email = '';
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 400 if password not passed', async () => {
        password = '';
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 400 if invalid email is passed', async () => {
        email = '1';
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 400 if invalid password is passed', async () => {
        password = '1';
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 400 if email is duplicate', async () => {
        const user = new User({
            email: email,
            password: password,
            name: name,
            surname: surname,
            insert: new Date()
        });
        await user.save();
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 200 if registration is valid', async () => {
        const res = await exec();
        expect(res.status).toBe(200);
    });

    it('should save user to db if request is valid', async () => {
        await exec();
        const dbUser = await User.findOne({ email: email });
        expect(dbUser).not.toBeNull();
        expect(dbUser.email).toEqual(email);
    });

    it('should return an auth token if request is valid', async () => {
        const res = await exec();
        const token = res.header['x-auth-token'];
        expect(token).toBeTruthy();
    });
});