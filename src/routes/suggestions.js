const express = require("express");
const { getPackingSuggestions } = require("../controllers/suggestionsController");

const router = express.Router();

router.get("/:bookingId", getPackingSuggestions);

module.exports = router;
