var express = require('express');
var morgan = require('morgan');
var app = express();

app.use(morgan("dev"));

app.use(function(req,res,next){
    res.sendFile(__dirname + "/index.html")

})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});