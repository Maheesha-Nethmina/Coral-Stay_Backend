const Package = require('../models/packageModel');

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

module.exports = {
  getAllPackages,
  addPackage,
  getById,
  updatePackage,
  deletePackage
};
