/**
 * Created by matthew on 3/22/2016.
 */
var express = require('express')
var fs = require('fs')
var path = require('path')
var da = require('./data-access')
var odp = require('odata-parser')

var router = express.Router();

router.param('file', (req,res,next,file)=>{
    req.dbFileName = file + '.sqlite';
    next();
});

router.get('/:file.sqlite', showTables)
router.get('/:file.sqlite/:table', tableData)

function showTables(req,res){
    var file = path.join(__dirname, req.dbFileName)
    fs.exists(file,(exists) =>{

        if(exists){
            var data = {
                filename: req.dbFileName
            }

            da.getTables(file).then(tables =>{
                data.tables = tables;

                if(req.accepts('html')){
                    res.render('sqlite', data);
                }else{
                    res.send(data)
                }

            })


        }else{
            res.sendStatus(404);
        }

    })

}

function tableData(req,res){
    var odata = {};
    if(req.url.indexOf('?') >= 0){

        var query = decodeURI(req.url.substr(req.url.indexOf('?') + 1))
        odata = odp.parse(query);
        if(odata.error){
            throw odata.error
        }

    }
    da.queryTable(req.dbFileName, req.params.table,odata).then(data =>{
        res.send(data);
    }, er =>{
        console.dir(er);
        res.sendStatus(500);
    })
}




module.exports = router;