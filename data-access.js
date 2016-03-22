/**
 * Created by matthew on 3/22/2016.
 */


var sqlite = require('q-sqlite3')


var getTables_cache = {};

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
                console.dir(data)
                return data;
            })
        });
    })
}

module.exports.getTables = getTables

module.exports.queryTable = function(file, table, odata){
    var dbParams = {}
    var where = getWhere(file,table,odata)
    var order = getOrder(file,table,odata)
    var query = `select * from ${table} ${where} ${order} limit ${odata.$top} offset ${odata.$skip}`;
    console.log(query)
    return sqlite.createDatabase(file).then(db =>{
        return db.all(query, dbParams)
    })
}

function getWhere(file,table,odata){
    return ''
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
