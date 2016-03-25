/**
 * Created by matthew on 3/22/2016.
 */
var express = require('express');
var fs = require('fs');
var path = require('path');
var da = require('./data-access');
var odp = require('odata-parser');
var json = require('body-parser').json({type:() => true});

var router = express.Router();

router.param('file', (req,res,next,file)=>{
    req.dbFileName = file + '.sqlite';
    next();
});

router.get('/:file.sqlite', showTables);
router.get('/:file.sqlite/:table', tableData);
router.post('/:file.sqlite/:table',json, insertTable);
router.get('/:file.sqlite/:table/:id', rowById);


function insertTable(req,res){
    tableExists(req,res,(fileName,tableName) =>{
        if(!req.body){
            res.status(400).send('missing body')
        }

        return da.getTable(fileName,tableName).then(table => {

            var data = [];
            var resData = {};
            return da.getNextId(fileName,tableName).then(id =>{

                table.columns.forEach(c => {
                    if(c.pk){
                        data.push({col:c.name, val:id.newId});
                        resData[c.name] = id.newId;
                    }
                    else if(req.body.hasOwnProperty(c.name)){
                        data.push({col:c.name, val:req.body[c.name]});
                        resData[c.name] = req.body[c.name];
                    }
                });

                return da.insertRow(fileName,tableName,data).then(result =>{
                    res.send(resData)
                })
            })
        })
    })
}

function rowById(req,res){
    tableExists(req,res,(fileName, tableName) =>{
        return da.getById(fileName,tableName,req.params.id)
            .then(r =>{
                if(r){
                    res.send(r)
                }else{
                    res.sendStatus(404)
                }
            })
    })  
}

function showTables(req,res){
    fileExists(req,res,(file) =>{
        var data = {
            fileName: req.dbFileName
        };
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
    
    
    var fileName = path.join(__dirname, req.dbFileName);
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
            var table = f.find(t => t.name == tableName);
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
            console.dir(er);
            res.status(500).send(er.toString());
        })
        
    })
}

function tableData(req,res){
    
    tableExists(req,res,(fileName,tableName) =>{
        var odata = {};
        if(req.url.indexOf('?') >= 0){
            var query = decodeURI(req.url.substr(req.url.indexOf('?') + 1));
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


