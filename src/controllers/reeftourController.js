const ReefTour = require('../models/reeftourModel');
const sheetBooking = require('../models/sheetBookingModel');
const PriceSetting = require('../models/priceSettingModel');
const mongoose = require('mongoose');


// Get blocked seats for a specific date and time slot
const getBlockedSeats = async (req, res) => {
  try {
    const { date, timeSlot } = req.query;
    if (!date || !timeSlot) {
      return res.status(400).json({ message: 'Missing required query parameters' });
    }

    const entry = await ReefTour.findOne({ date, timeSlot });
    const seats = entry ? entry.blockedSeats : [];

    res.status(200).json({ blockedSeats: seats });
  } catch (error) {
    console.error('Error fetching blocked seats:', error);
    res.status(500).json({ message: 'Server error while fetching blocked seats' });
  }
};

// Block seats for a specific date and time slot
const blockSeats = async (req, res) => {
  try {
    const { date, timeSlot, seats } = req.body;
    if (!date || !timeSlot || !seats || seats.length === 0) {
      return res.status(400).json({ message: 'Date, time slot, and seats are required.' });
    }

    const updated = await ReefTour.findOneAndUpdate(
      { date, timeSlot },
      { $addToSet: { blockedSeats: { $each: seats } } },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Seats blocked successfully', updated });
  } catch (error) {
    console.error('Error blocking seats:', error);
    res.status(500).json({ message: 'Server error while blocking seats' });
  }
};

// Unblock seats for a specific date and time slot
const unblockSeats = async (req, res) => {
  try {
    const { date, timeSlot, seats } = req.body;
    if (!date || !timeSlot || !seats || seats.length === 0) {
      return res.status(400).json({ message: 'Date, time slot, and seats are required.' });
    }

    // Remove the selected seats from the blockedSeats array
    const updated = await ReefTour.findOneAndUpdate(
      { date, timeSlot },
      { $pull: { blockedSeats: { $in: seats } } },
      { new: true }
    );

    res.status(200).json({ message: 'Seats unblocked successfully', updated });
  } catch (error) {
    console.error('Error unblocking seats:', error);
    res.status(500).json({ message: 'Server error while unblocking seats' });
  }
};

//sheet booking for reeftour
const bookSeats = async (req, res) => {
  try {
    const {userId,googleId,date,timeSlot,seats,user,totalAmount,} = req.body;

    if (!date || !timeSlot || !seats || !Array.isArray(seats) || seats.length === 0 || !user) {
      return res.status(400).json({ message: 'Missing required booking data.' });
    }

    const newBooking = new sheetBooking({userId,googleId,date,timeSlot,seats,user,totalAmount,});

    await newBooking.save();

    res.status(201).json({ message: 'Seat booking successful', booking: newBooking });
  } catch (error) {
    console.error('Error booking seats:', error);
    res.status(500).json({ message: 'Server error while booking seats' });
  }
};

//display booked seats
const displayBookedSeats = async (req, res) => {
  try {
    const { date, timeSlot } = req.query;

    if (!date || !timeSlot) {
      return res.status(400).json({ message: 'Missing required query parameters' });
    }

    // Ensure both date and timeSlot are matched exactly
    const bookings = await sheetBooking.find({ date, timeSlot }).select('seats -_id');

    // Extract just the seat numbers
    const bookedSeats = bookings.flatMap(booking => booking.seats);

    res.status(200).json({ bookedSeats });
  } catch (error) {
    console.error('Error fetching booked seats:', error);
    res.status(500).json({ message: 'Server error while fetching booked seats' });
  }
};


// Display booking details
const displayBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required.' });
    }

    const booking = await sheetBooking.findById(bookingId).select(
      'date timeSlot seats user.fullName user.email user.contactNumber'
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.status(200).json({ booking });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ message: 'Server error while fetching booking details' });
  }
};
//getAllBookings
const getAllReefTourBookings = async (req, res) => {
  try {
    const bookings = await sheetBooking.find().sort({ date: 1, timeSlot: 1 });

    const grouped = {};

    bookings.forEach((booking) => {
      const key = `${booking.date}-${booking.timeSlot}`;
      if (!grouped[key]) {
        grouped[key] = {
          date: booking.date,
          timeSlot: booking.timeSlot,
          bookings: [],
        };
      }

      grouped[key].bookings.push({
        _id: booking._id,
        userId: booking.userId,
        fullName: booking.user.fullName,
        email: booking.user.email,
        contactNumber: booking.user.contactNumber,
        seats: booking.seats,
      });
    });

    res.status(200).json(Object.values(grouped));
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// delete booking
const deleteSheetBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required.' });
    }

    const deletedBooking = await sheetBooking.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.status(200).json({ message: 'Booking deleted successfully', booking: deletedBooking });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Server error while deleting booking' });
  }
};

//update price setting
const updatePriceSetting = async (req, res) => {
  try {
    const { pricePerSeat, serviceFee, discount } = req.body;
    if (pricePerSeat == null || serviceFee == null) {
      return res.status(400).json({ message: 'Price per seat and service fee are required.' });
    }
    const priceSetting = await PriceSetting.findOneAndUpdate(
      {},
      { pricePerSeat, serviceFee, discount },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Price setting updated successfully', priceSetting });
  } catch (error) {
    console.error('Error updating price setting:', error);
    res.status(500).json({ message: 'Server error while updating price setting' });
  }
};

// Get current price settings
const getPriceSetting = async (req, res) => {
  try {
    const priceSetting = await PriceSetting.findOne({});
    if (!priceSetting) {
      return res.status(404).json({ message: 'Price setting not found' });
    }
    res.status(200).json(priceSetting);
  } catch (error) {
    console.error('Error getting price setting:', error);
    res.status(500).json({ message: 'Server error while fetching price setting' });
  }
};

// Display bookings for a specific user
const displayUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    // console.log('Requested bookings for userId:', userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const bookings = await sheetBooking.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .select('date timeSlot seats createdAt totalAmount')
      .sort({ date: -1 })
      .lean();

    // console.log('Found bookings:', bookings.length);
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error while fetching user bookings' });
  }
};




module.exports = {
    blockSeats,
    getBlockedSeats,
    unblockSeats,
    bookSeats,
    displayBookedSeats,
    displayBookingDetails,
    getAllReefTourBookings,
    updatePriceSetting,
    getPriceSetting,
    deleteSheetBooking,
    displayUserBookings
};

