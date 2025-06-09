const express= require('express');
const router=express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

//insert Model
const event=require('../models/eventsModel');
//insert Controler
const UserController=require('../controllers/eventController');

router.get('/',UserController.getAllEvents);
router.post('/',upload.single('image'),UserController.addEvent);
router.get('/:id',UserController.getById);
router.put('/:id',upload.single('image'),UserController.updateEvent);
router.delete('/:id',UserController.deleteEvent);

module.exports=router; 