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
    fileExists(req,res,(file) =>{
        var data = {
            fileName: req.dbFileName
        }

        da.getTables(file).then(tables =>{
            data.tables = tables;

            if(req.accepts('html')){
                res.render('sqlite', data);
            }else{
                res.send(data)
            }

        })
    })
}

function fileExists(req,res, doesExist){
    
    var fileName = path.join(__dirname, req.dbFileName)
    fs.exists(fileName,(exists) =>{
        if(exists){
            doesExist(fileName)
        }else{
            res.sendStatus(404);
        }
    })
}

function tableExists(req,res, doesExist){
    fileExists(req,res,(fileName) =>{
        da.getTables(fileName).then(f =>{
            var tableName = req.params.table;
            var table = f.find(t => t.name == tableName)
            if(table){
                return doesExist(fileName,tableName)
            }else{
                res.sendStatus(404);
            }
        }).catch(er => {
            if(er instanceof da.CriteriaError ||
                er.name == "SyntaxError" && er.message){
                res.status(400).send(new da.CriteriaError(er.message))
            }
            res.status(500).send(er);
        })
        
    })
}

function tableData(req,res){
    
    tableExists(req,res,(fileName,tableName) =>{
        var odata = {};
        if(req.url.indexOf('?') >= 0){
            var query = decodeURI(req.url.substr(req.url.indexOf('?') + 1))
            odata = odp.parse(query);
            if(odata.error){
                throw new da.CriteriaError(odata.error)
            }
        }

        return da.queryTable(fileName, tableName,odata).then(data =>{
            res.send(data);
        })
    })
}




module.exports = router;