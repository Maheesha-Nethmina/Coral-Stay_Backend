const express = require('express');
const router = express.Router();
const reeftourController = require('../controllers/reeftourController');

router.post('/block',reeftourController.blockSeats);
router.get('/blocked',reeftourController.getBlockedSeats);
router.post('/unblock', reeftourController.unblockSeats);


module.exports = router;