const express = require('express');
const app = express();
const {v4:uuid} = require('uuid');
const bodyParser = require('body-parser');
const User = require('./models/user');
const axios = require('axios');
const jwt = require ('jsonwebtoken');

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

app.get('/',(req,res)=>{
    res.render('introPage')
})

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

function getGoogleAuthURL(){
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
        redirect_uri:'http://localhost:8080/TeleCode',
        client_id:'533826739878-4kao3g422kdc72rhqkfft6lbausu78lp.apps.googleusercontent.com',
        access_type:'offline',
        response_type:'code',
        prompt:'consent',
        scope:[
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ].join(' '),
    };
    const qs = new URLSearchParams(options);

    return `${rootUrl}?${qs.toString(options)}`
}

app.get("/TeleCode/SignIn",(req,res)=>{
    res.redirect(getGoogleAuthURL())
});


function getTokens(code,clientId,clientSecret,redirectUri){
const url = 'https://oauth2.googleapis.com/token';
const values = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
};
    const qs = new URLSearchParams(values);
return axios.post(url,qs.toString(values),{
    headers:{
        'Content-Type':'application/x-www-form-urlencoded',
    },
})
.then((res)=>res.data)
.catch((error)=>{
    console.error('failed to fetch auth tokens');
});
}
    


app.get('/api/sessions/oauth/google',async(req,res)=>{
    const code = req.query.code;

    const {id_token,access_token} = await getTokens({
        code,
        clientId:'533826739878-4kao3g422kdc72rhqkfft6lbausu78lp.apps.googleusercontent.com',
        clientSecret:'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',
        redirectUri:'http://localhost:8080/TeleCode'
    });

    const  googleUser = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
        {
            headers: {
              Authorization: `Bearer ${id_token}`,
            },
          }
    )
    .then((res)=> res.data)
    .catch((error)=>{
        console.error('Failed to fetch user');
        throw new Error(error.message);
    });


})

app.listen(8080,()=>{
    console.log('SERVER RUNNING')
})