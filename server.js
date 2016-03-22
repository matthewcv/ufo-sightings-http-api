var express = require('express');
var morgan = require('morgan');
var hbs = require('hbs');
var app = express();
app.set('view engine','hbs');
app.use(morgan("dev"));

app.use(require('./sqlite-middleware'));

app.use(function(req,res,next){

    res.render('index', {
        filename:'uforeports.sqlite'
    })

})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});