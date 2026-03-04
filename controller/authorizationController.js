const UserService = require('../repo/userService')
require('dotenv').config();
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;


const verifyAdmin = async (req, res, next) => {
    try {
        const authHeader = req.get('Authorization');
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : authHeader;
        const decode = await jwt.verify(token, secret);
        const userEnt = await UserService.getUserById(decode._id);
        if (!userEnt.admin) {
            res.status(401).json({ message: 'Unauthorized access' });
            return;
        }
        req.params.user = userEnt;
        next();
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
}

const login = async (req, res, next) => {
    try {
        const { user, password } = req.body;
        const userEnt = await UserService.getUserByNameAndPassword(user, password);
        console.log(userEnt);
        if (!userEnt) {
            res.status(401).json({ message: 'Login fail' })
            return;

        }
        const token = jwt.sign({ _id: userEnt._id, name: userEnt.name, admin: userEnt.admin }, secret, { expiresIn: '1h' });
        res.status(201).json({ token: token, user: userEnt, admin: userEnt.admin });
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
}

const addUser = async (req, res, next) => {
    try {
        const userEnt = await UserService.createUser(req.body);
        res.status(200).json({ message: "User successfully create", userEnt });

    } catch (e) {
        res.status(500).json({ message: e.message })
    }
}

const verifyUser = async (req, res, next) => {
    try {
        const authHeader = req.get('Authorization');
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : authHeader;
        const decode = jwt.verify(token, secret);
        const userEnt = await UserService.getUserById(decode._id);
        req.params.user = userEnt;
        next();
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
}

const getAllUser = async (req, res, next) => {
    try {
        const userEnt = await UserService.getAllUser();
        res.status(200).json(userEnt);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
}

module.exports = {
    verifyAdmin,
    verifyUser,
    login,
    getAllUser,
    addUser
}