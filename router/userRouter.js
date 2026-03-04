const express = require('express');
const authorizationController = require('../controller/authorizationController')
const router = express.Router();

router.get('/', authorizationController.verifyAdmin, authorizationController.getAllUser);

router.post('/', authorizationController.login);

router.post('/create', authorizationController.addUser);


module.exports = router;