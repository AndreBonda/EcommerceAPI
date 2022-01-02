const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');

const router = express.Router();

router.post('/', async (req, res) => {
    const validation = User.validate(req.body);

    if (!validation.result) return res.status(400).send(validation.message);

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send("Email is already used.");

    user = new User({
        email: req.body.email,
        name: req.body.name,
        surname: req.body.surname,
        address: req.body.address,
        birthday: req.body.birthday,
        isAdmin: req.body.isAdmin,
        insert: new Date()
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    user.password = hashedPassword;

    await user.save();

    const token = user.generateAuthToken();
    res.header('x-auth-token', token)
        .send({
            id: user._id,
            email: user.email
        });
});

module.exports = router;