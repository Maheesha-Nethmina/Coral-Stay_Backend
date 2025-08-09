const Package = require('../models/packageModel');
const SeatBooking = require('../models/sheetBookingModel');
const PackageBooking = require('../models/PackageBooking');
const Booking = require('../models/Booking');

// Get all packages
const getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find();
    if (!packages || packages.length === 0) {
      return res.status(404).json({ message: "No packages found" });
    }
    return res.status(200).json({ packages });
  } catch (err) {
    console.error("Get all packages error:", err);
    return res.status(500).json({ message: "Server error fetching packages" });
  }
};

// Add a new package
const addPackage = async (req, res) => {
  console.log("BODY RECEIVED:", req.body);
  console.log("FILE RECEIVED:", req.file);

  let { title, description, includes, price, days, offers, type, roomtype, seatNumber } = req.body;
  const imageUrl = req.file?.path || '';

  // Required fields validation
  if (!title || !description || !includes || !price || !days || !type) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Convert seatNumber and numeric fields properly
  price = Number(price);
  days = Number(days);
  seatNumber = seatNumber !== undefined ? Number(seatNumber) : undefined;

  // Business logic validation
  if (type === 'hotel' && (!roomtype || roomtype === '')) {
    return res.status(400).json({ message: "Hotel room type is required" });
  }

  if (type === 'boatTour' && (seatNumber === undefined || seatNumber === null || isNaN(seatNumber))) {
    return res.status(400).json({ message: "Seat number is required for boat tour" });
  }

  if (type === 'Both' && ((!roomtype || roomtype === '') || (seatNumber === undefined || seatNumber === null || isNaN(seatNumber)))) {
    return res.status(400).json({ message: "Both room type and seat number are required for combined packages" });
  }

  // Remove roomtype if empty string to avoid Mongoose enum error
  if (!roomtype || roomtype === '') {
    roomtype = undefined;
  }

  try {
    const packageData = new Package({
      title,
      description,
      includes,
      price,
      days,
      offers: offers || '',
      type,
      roomtype,
      seatNumber: seatNumber || 0,
      imageUrl
    });

    await packageData.save();
    return res.status(201).json({ package: packageData });
  } catch (err) {
    console.error("SAVE ERROR:", err);
    return res.status(500).json({ message: "Failed to save package", error: err.message });
  }
};

// Get package by ID
const getById = async (req, res) => {
  const id = req.params.id;
  try {
    const packageData = await Package.findById(id);
    if (!packageData) {
      return res.status(404).json({ message: "No package found" });
    }
    return res.status(200).json({ package: packageData });
  } catch (err) {
    console.error("Get package by ID error:", err);
    return res.status(500).json({ message: "Server error fetching package" });
  }
};

// Update package by ID
const updatePackage = async (req, res) => {
  const id = req.params.id;
  let { title, description, includes, price, days, offers, type, roomtype, seatNumber } = req.body;
  const imageUrl = req.file?.path;

  // Convert numbers
  price = Number(price);
  days = Number(days);
  seatNumber = seatNumber !== undefined ? Number(seatNumber) : undefined;

  // Business logic validation
  if (!title || !description || !includes || !price || !days || !type) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (type === 'hotel' && (!roomtype || roomtype === '')) {
    return res.status(400).json({ message: "Hotel room type is required" });
  }

  if (type === 'boatTour' && (seatNumber === undefined || seatNumber === null || isNaN(seatNumber))) {
    return res.status(400).json({ message: "Seat number is required for boat tour" });
  }

  if (type === 'Both' && ((!roomtype || roomtype === '') || (seatNumber === undefined || seatNumber === null || isNaN(seatNumber)))) {
    return res.status(400).json({ message: "Both room type and seat number are required for combined packages" });
  }

  // Clean empty roomtype
  if (!roomtype || roomtype === '') {
    roomtype = undefined;
  }

  try {
    const packageData = await Package.findById(id);
    if (!packageData) return res.status(404).json({ message: "Package not found" });

    packageData.title = title;
    packageData.description = description;
    packageData.includes = includes;
    packageData.price = price;
    packageData.days = days;
    packageData.offers = offers || '';
    packageData.type = type;
    packageData.roomtype = roomtype;
    packageData.seatNumber = seatNumber || 0;
    if (imageUrl) packageData.imageUrl = imageUrl;

    await packageData.save();
    return res.status(200).json({ package: packageData });
  } catch (err) {
    console.error("Update error:", err);
    return res.status(500).json({ message: "Update failed", error: err.message });
  }
};

// Delete package by ID
const deletePackage = async (req, res) => {
  const id = req.params.id;
  try {
    const packageData = await Package.findByIdAndDelete(id);
    if (!packageData) {
      return res.status(404).json({ message: "Unable to delete package" });
    }
    return res.status(200).json({ package: packageData });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ message: "Server error deleting package" });
  }
};

//check availability of package_NEMA
const TOTAL_SEATS = 24;

const checkAvailability = async (req, res) => {
  const { date, seatNumber } = req.body;
  const timeSlot = '9:00-10:00';

  try {
    const bookings = await SeatBooking.find({ date, timeSlot });
    const bookedSeats = bookings.flatMap(b => b.seats);

    const availableSeats = [];
    for (let i = 1; i <= TOTAL_SEATS; i++) {
      if (!bookedSeats.includes(i)) availableSeats.push(i);
    }

    let hasContinuousBlock = false;
    for (let i = 0; i <= availableSeats.length - seatNumber; i++) {
      const block = availableSeats.slice(i, i + seatNumber);
      const isSequential = block.every((n, idx, arr) =>
        idx === 0 || n === arr[idx - 1] + 1
      );
      if (isSequential) {
        hasContinuousBlock = true;
        break;
      }
    }

    const isAvailable = availableSeats.length >= seatNumber;

    res.json({
      available: isAvailable,
      continuousBlock: hasContinuousBlock,
      availableSeats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error checking availability' });
  }
};

//package booking

const bookPackage = async (req, res) => {
  try {
    const {
      userId,
      googleId,
      user,
      packageType,
      bookedDate,
      checkOutDate,
      totalAmount,
      packageDetails,
      roomBooking,
      seatBooking
    } = req.body;

    // Validate required fields for main package
    if (!user || !packageType || !bookedDate || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields for package booking' });
    }

    // Save PackageBooking
    const newPackageBooking = new PackageBooking({
      userId: userId || undefined,
      googleId: googleId || undefined,
      user,
      packageType: packageType.toLowerCase(),
      bookedDate: new Date(bookedDate),
      checkOutDate: checkOutDate ? new Date(checkOutDate) : undefined,
      totalAmount,
      packageDetails
    });

    await newPackageBooking.save();

    // If roomBooking exists (for hotel/both), insert into Booking
    let hotelBooking = null;
    if (roomBooking) {
      const newHotelBooking = new Booking({
        roomId: Number(roomBooking.roomId), 
        roomTitle: roomBooking.roomTitle,
        packageType: roomBooking.packageType,
        checkIn: new Date(roomBooking.checkIn),
        checkOut: new Date(roomBooking.checkOut),
        quantity: roomBooking.quantity,
        guestName: roomBooking.guestName,
        guestEmail: roomBooking.guestEmail,
        nicNumber: roomBooking.nicNumber,
        contactNumber: roomBooking.contactNumber,
        totalAmount: roomBooking.totalAmount
      });

      hotelBooking = await newHotelBooking.save();
    }

    // If seatBooking exists (for boat/both), insert into SeatBooking
    let seatBookingResult = null;
    if (seatBooking) {
      const newSeatBooking = new SeatBooking({
        userId: userId || undefined,
        googleId: googleId || undefined,
        date: seatBooking.date,
        timeSlot: seatBooking.timeSlot,
        seats: seatBooking.seats,
        user: seatBooking.user,
        totalAmount: seatBooking.totalAmount
      });

      seatBookingResult = await newSeatBooking.save();
    }

    res.status(201).json({
      message: 'Package booking successful',
      packageBookingId: newPackageBooking._id,
      hotelBookingId: hotelBooking?._id,
      seatBookingId: seatBookingResult?._id
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error during package booking' });
  }
};

// GET all booked packages (always return array; empty when none)
const getBookedPackages = async (req, res) => {
  try {
    const bookings = await PackageBooking.find()
      .sort({ createdAt: -1 })
      .lean();

    // Always return 200 with an array (could be empty)
    return res.status(200).json({ bookings });
  } catch (err) {
    console.error("Get booked packages error:", err);
    res.status(500).json({ message: "Server error fetching booked packages" });
  }
};







module.exports = {
  getAllPackages,
  addPackage,
  getById,
  updatePackage,
  deletePackage,
  checkAvailability,
  bookPackage,
  getBookedPackages

};
