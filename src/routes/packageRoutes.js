const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

// Import Controller for packages
const PackageController = require('../controllers/packageController');

router.get('/booked-packages', PackageController.getBookedPackages);
router.post('/check-availability', PackageController.checkAvailability);
router.post('/book-package', PackageController.bookPackage);
router.delete('/booked-packages/:id',PackageController.deleteBooking);
router.get('/user-packages/:userId', PackageController.getPackageBookingsByUser);


router.get('/', PackageController.getAllPackages);
router.post('/', upload.single('image'), PackageController.addPackage);
router.get('/:id', PackageController.getById);
router.put('/:id', upload.single('image'), PackageController.updatePackage);
router.delete('/:id', PackageController.deletePackage);

module.exports = router;
