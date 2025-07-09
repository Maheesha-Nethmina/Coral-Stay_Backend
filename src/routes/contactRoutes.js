const express = require('express');
const router = express.Router();

const { contactFormHandler } = require('../controllers/contactController');

router.post('/', contactFormHandler);

module.exports = router;
