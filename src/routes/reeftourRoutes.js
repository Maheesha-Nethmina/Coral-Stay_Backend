const express = require('express');
const router = express.Router();
const reeftourController = require('../controllers/reeftourController');

router.post('/block',reeftourController.blockSeats);
router.get('/blocked',reeftourController.getBlockedSeats);
router.post('/unblock', reeftourController.unblockSeats);
router.post('/bookSeats', reeftourController.bookSeats);
router.get('/displayBookedSeats', reeftourController.displayBookedSeats);
router.get('/displayBookingDetails/:bookingId', reeftourController.displayBookingDetails);
router.post('/updatePriceSetting', reeftourController.updatePriceSetting);
router.get('/getPriceSetting', reeftourController.getPriceSetting);
router.get('/getAllReefTourBookings', reeftourController.getAllReefTourBookings);
router.delete('/deleteSheetBooking/:bookingId', reeftourController.deleteSheetBooking);
router.get('/displayUserBookings/:userId', reeftourController.displayUserBookings);



module.exports = router;