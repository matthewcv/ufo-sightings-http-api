var express = require('express');
var morgan = require('morgan');
var hbs = require('hbs');
var app = express();
var cors = require('cors')
app.set('view engine','hbs');
app.use(morgan("dev"));

app.use(cors());

app.use(require('./sqlite-middleware'));

app.use(function(req,res,next){

    res.render('index', {
        fileName:'uforeports.sqlite'
    })

})


app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});