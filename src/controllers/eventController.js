const Event=require('../models/eventsModel');

//get all events
 const getAllEvents=async(req,res)=>{
    let events;
    try {
        events=await Event.find();
    } catch (err) {
     
        console.log(err);
    }
    //not found
    if(!events){
        return res.status(404).json({message:"No events found"});
    }

    //Display all users
    return res.status(200).json({events});
 }

const addEvent = async (req, res) => {
    console.log("BODY RECEIVED:", req.body);  // 🟨 Debug line

    const { image, title, description, date,mapUrl } = req.body;
    if (!image || !title || !description || !date || !mapUrl) {
        return res.status(400).json({ message: "Missing fields in request body" });
    }

    try {
        const events = new Event({ image, title, description, date,mapUrl });
        await events.save();
        return res.status(201).json({ events });
    } catch (err) {
        console.log("SAVE ERROR:", err);
        return res.status(500).json({ message: "Failed to save events", error: err });
    }
};


//get by id
const getById=async(req,res,next)=>{
    const id=req.params.id;
    let event; 
    try {
        event=await Event.findById(id);
    } catch (err) {
        console.log(err);
    }  
    //not found
    if(!event){
        return res.status(404).json({message:"No event found"});
    }
    return res.status(200).json({event});
}

const updateEvent=async(req,res,next)=>{
    const id=req.params.id;
    const {image, title, description, date,mapUrl}=req.body;
    let event;
    try {
        event=await Event.findByIdAndUpdate(id,{
           image, 
           title,
           description,
           date,
           mapUrl
        },{ new: true }); 
        event=await event.save();
    }
    catch (err) {
        console.log(err);
    }
    //not found
    if(!event){
        return res.status(404).json({message:"Unable to update event"});
    }
    return res.status(200).json({event});
}

//Delete user
const deleteEvent=async(req,res,next)=>{
    const id=req.params.id;
    let event;   
    try {
        event=await Event.findByIdAndDelete(id);
    }
    catch (err) {
        console.log(err);
    }
    //not found
    if(!event){
        return res.status(404).json({message:"Unable to delete user"});
    }
    return res.status(200).json({event});
}
 exports.getAllEvents=getAllEvents;
 exports.addEvent=addEvent;
 exports.getById=getById;
 exports.updateEvent=updateEvent;
 exports.deleteEvent=deleteEvent;