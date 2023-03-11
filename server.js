const express = require('express');
const app = express();
const {v4:uuid} = require('uuid');
const bodyParser = require('body-parser');
const User = require('./models/user');
app.use(express.urlencoded({extended:true}));
const mongoose = require('mongoose');
mongoose.set('strictQuery',false);

const url ='mongodb+srv://arpanmahanty01:585401@cluster0.c1v9dlc.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(url,{useNewUrlParser:true, useUnifiedTopology: true})
    .then(()=>{
        console.log('MONGO CONNECTION OPEN')
    })
    .catch(err=>{
        console.log('MONGO ERROR',err)
    })

app.use(express.static('public'))
app.use(express.urlencoded({extended:true}))
app.use(bodyParser.json());

app.set('view engine','ejs');

app.get('/TeleCode',(req,res)=>{
    res.render('startpage')
})

app.get('/TeleCode/newRoom',(req,res)=>{
    const roomID = {roomID:uuid()};
    res.render('newRoom',{roomID})
})

app.post('/TeleCode/room/:roomID',(req,res)=>{
    const roomID= req.params.roomID;
    const data = {
        roomID:roomID,
        users:[req.body.username],
        language:req.body.language
    }
    User.insertMany(data)
        .then(res=>{
            console.log(res)
        })
        .catch(e=>{
            console.log(e)
        })
    res.render('room',{data})
})

app.post('/getData',async(req,res)=>{
    console.log(req.body)
    const findRoomByID = req.body.roomID;
    console.log('roomID:',findRoomByID)
    const foundRoom = await User.findOne({roomID:findRoomByID});
    console.log(foundRoom);
    res.send(foundRoom)
})

app.post('/joinRoom',async(req,res)=>{
    console.log(req.body)
    const roomID = req.body.roomId;
    const username = req.body.username;
    res.redirect(`/TeleCode/join/${roomID}`);
    await User.updateOne({roomID:roomID},{$push:{users:username}})
})

app.get('/TeleCode/join/:roomID',async(req,res)=>{
    const roomID = req.params.roomID;
    const data = await User.findOne({roomID:roomID});
    res.render('room',{data});
})

app.post('/peerJs',async(req,res)=>{
    const roomID = req.body.roomId;
    const peerID = req.body.clientId;
    const founduser = await User.findOne({roomID:roomID});
    const clients = founduser.peerIds.length;
    console.log('CLIENTS_',clients)
    if(clients == 0){
        await User.updateOne({roomID:roomID},{$push:{peerIds:peerID}});
    }
    if(clients == 1){
        console.log(founduser.peerIds[0])
        res.send(founduser.peerIds[0])
    }
    
})


app.listen(8080,()=>{
    console.log('SERVER RUNNING')
})