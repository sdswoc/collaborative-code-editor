const express = require('express');
const app = express();


app.use(express.static('public'))

app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/public/page.html')
})


app.listen(8080)