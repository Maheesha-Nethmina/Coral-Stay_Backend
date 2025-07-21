const Package = require('../models/packageModel');

// Get all packages
const getAllPackages = async (req, res) => {
  let packages;
  try {
    packages = await Package.find();
  } catch (err) {
    console.log(err);
  }

  if (!packages || packages.length === 0) {
    return res.status(404).json({ message: "No packages found" });
  }

  return res.status(200).json({ packages });
};

// Add a new package
const addPackage = async (req, res) => {
  console.log("BODY RECEIVED:", req.body);

  const { title, description,includes, price, days, offers, type } = req.body;
  const imageUrl = req.file?.path || '';

  if (!title || !description ||!includes || !price || !days || !type ) {
    return res.status(400).json({ message: "Missing fields in request body" });
  }

  try {
    const packageData = new Package({ title, description, includes, price, days, offers, type, imageUrl });
    await packageData.save();
    return res.status(201).json({ package: packageData });
  } catch (err) {
    console.log("SAVE ERROR:", err);
    return res.status(500).json({ message: "Failed to save package", error: err });
  }
};

// Get package by ID
const getById = async (req, res, next) => {
  const id = req.params.id;
  let packageData;
  try {
    packageData = await Package.findById(id);
  } catch (err) {
    console.log(err);
  }
  if (!packageData) {
    return res.status(404).json({ message: "No package found" });
  }
  return res.status(200).json({ package: packageData });
};

// Update package by ID
const updatePackage = async (req, res, next) => {
  const id = req.params.id;
  const { title, description,includes, price, days, offers, type } = req.body;
  const imageUrl = req.file?.path;

  try {
    let packageData = await Package.findById(id);
    if (!packageData) return res.status(404).json({ message: "Package not found" });

    packageData.title = title;
    packageData.description = description;
    packageData.includes=includes,
    packageData.price = price;
    packageData.days = days;
    packageData.offers = offers;
    packageData.type = type;
    if (imageUrl) packageData.imageUrl = imageUrl;

    await packageData.save();
    return res.status(200).json({ package: packageData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Update failed" });
  }
};

// Delete package by ID
const deletePackage = async (req, res, next) => {
  const id = req.params.id;
  let packageData;
  try {
    packageData = await Package.findByIdAndDelete(id);
  } catch (err) {
    console.log(err);
  }
  if (!packageData) {
    return res.status(404).json({ message: "Unable to delete package" });
  }
  return res.status(200).json({ package: packageData });
};

exports.getAllPackages = getAllPackages;
exports.addPackage = addPackage;
exports.getById = getById;
exports.updatePackage = updatePackage;
exports.deletePackage = deletePackage;
