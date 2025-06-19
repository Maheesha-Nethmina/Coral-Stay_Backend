const ReefTour = require('../models/reeftourModel');

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


module.exports = {
    blockSeats,
    getBlockedSeats,
    unblockSeats
};