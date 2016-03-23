/**
 * Created by matthew on 3/22/2016.
 */


var sqlite = require('q-sqlite3')


var getTables_cache = {};

function CriteriaError(msg){
    this.message = msg
}

module.exports.CriteriaError = CriteriaError;

function getTables(file){
    if(getTables_cache[file]){
        return Promise.resolve(getTables_cache[file]);
    }
    return sqlite.createDatabase(file).then(db =>{
        return db.all(`SELECT name FROM sqlite_master where type='table'`).then(tableNames =>{
            var promises = [];
            tableNames.forEach(tn => {
                promises.push(db.all(`pragma table_info(${tn.name})`).then(columns =>{
                    tn.columns = columns;
                    return tn;
                }))
            })
            return Promise.all(promises).then(data =>{
                getTables_cache[file] = data;
                return data;
            })
        });
    })
}

module.exports.getTables = getTables
/**
 * query from a table
 * @param {string} file the name of the sqlite file
 * @param {string} table the name of the table to query from
 * @param {object} odata an object representing an odata query criteria for paging, sorting and filtering. A small subset is supported
 */
module.exports.queryTable = function(file, table, odata){
    return validateOdata(file,table,odata).then(() =>{
        
    
        var dbParams = []
        var limit = odata.$top || 10
        var offset = odata.$skip || 0
        var where = getWhere(file,table,odata, dbParams)
        var order = getOrder(file,table,odata)
        var query = `select * from ${table} ${where} ${order} limit ${limit} offset ${offset}`;
        console.log(query)
        return sqlite.createDatabase(file).then(db =>{
            return db.all(query, dbParams)
        })
    
    });
}

var ops = "=,>,>=,<,<=,<>".split(',')

function getWhere(file,table,filter,dbParams){
    console.dir(filter,{depth:null,colors:true})
    
    if(filter){
    
        var propOrLit = function(thing){
            if(thing.type == 'property'){
                return thing.name
            }
            if(thing.type == 'literal'){
                dbParams.push(thing.value)
                return '?'
            }
        }
        
        if(filter.left && filter.right){
            return 'where ' + propOrLit(filter.left) + " " 
                + ops[supportedFilterTypes.indexOf(filter.type)] + " "
                + propOrLit(filter.right)
        }
        if(filter.args && filter.args.length == 0){
            
        }
        
    }
    return ''
}

var supportedFilterTypes = 'eq,gt,ge,lt,le,ne,substringof'.split(',')

function validateOdata(fileName,tableName,odata){
    //console.dir(odata,{depth:null,colors:true})
    return getTables(fileName).then(f =>{
        var table =f.find(t => t.name == tableName)
        
        var colExists = function(name){
            if(!table.columns.find(c => c.name == name)){
                throw new CriteriaError('invalid column name ' + name)
            }
        }
        
        var colExistsIfIsProperty = function(thing){
            if(thing && thing.type && thing.type == 'property'){
                colExists(thing.name)
            }
        }
        
        if(odata.$orderby){
            odata.$orderby.forEach(ob =>{
                for(p in ob){
                    colExists(p)
                }
            })
        }
        
        if(odata.$filter){
            if(supportedFilterTypes.indexOf(odata.$filter.func || odata.$filter.type) == -1){
                throw new CriteriaError('do not support filter type ' + odata.$filter.type)
            }
            colExistsIfIsProperty(odata.$filter.left)
            colExistsIfIsProperty(odata.$filter.left)
            if(odata.$filter.args && odata.$filter.args.length){
                odata.$filter.args.forEach(colExistsIfIsProperty)
            }
        }
        
    })
    
}

function getOrder(file,table,odata){

    var orderBy = odata.$orderby;
    if(orderBy) {
        var obStmt = 'order by '
        obStmt += orderBy.map(ob => {
            for(col in ob){
                return col + ' ' + ob[col]
            }
        }).join(', ')
        return obStmt
    }
    return ''
}
