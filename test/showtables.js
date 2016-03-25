
var rewire = require ('rewire');
var expect = require('expect');





describe("get the tables for the sqlite file", function(){

    
    

    it('sends 404 if file does not exist', function(){


        var sw = rewire('../sqlite-middleware');

        var showTables = sw.__get__('showTables');

        return showTables({dbFileName:"missingfile.sqlite"},{sendStatus:function(data){
            expect(data).toEqual(404)

        }}).catch(function(){})
        

    })


    it('will get the tables from the file', function(){


        var sw = rewire('../sqlite-middleware');

        var showTables = sw.__get__('showTables');

        return showTables({dbFileName:"uforeports.sqlite", accepts:function(){return false}},{send:function(data){
            expect(data).toExist()
            expect(data.fileName).toEqual('uforeports.sqlite')

        }})


    })



})