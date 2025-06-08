const express= require('express');
const router=express.Router();
//insert Model
const event=require('../models/eventsModel');
//insert Controler
const UserController=require('../controllers/eventController');

router.get('/',UserController.getAllEvents);
router.post('/',UserController.addEvent);
router.get('/:id',UserController.getById);
router.put('/:id',UserController.updateEvent);
router.delete('/:id',UserController.deleteEvent);

module.exports=router; 