var Kazoo = require('./kazoo-rest.js');
var json2csv = require('json2csv');
var fs = require('fs');
var prompt = require('prompt');
// Set schema for date format
var schema = {
    properties: {
        From: {
        pattern: /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.](19|20)\d\d$/,
        message: 'The Date must be in the following format: MM/DD/YYYY',
        required: true
        },
        To: {
        pattern: /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.](19|20)\d\d$/,
        message: 'The Date must be in the following format: MM/DD/YYYY',
        required: true
        }
    }
};
prompt.start();
prompt.get(schema, function (err, result) {
    console.log("Generating CDR..")
    console.log("from=",result.From," To=",result.To);
    //convert to timestamp
    var from = (new Date(result.From).getTime() / 1000) + 62167219200;
    var to = (new Date(result.To).getTime() / 1000) + 62167219200;
    // Get auth token from kazoo
    Kazoo.getAuth(function(authData){
        //Divide timestamp to generate CDR based on single date
        var fm = from;
        function loop(){
            t = fm + (24*60*60);
            getCDR(fm, t, authData, function(){
                fm = t;
                if(fm != to){
                    loop();
                }
            });
        }
        loop();
    });
    
});

function getCDR(from, to, authData, callback){
    var date = Kazoo.parseDate(from);
    // Get cdrs from kazoo
    Kazoo.getCDRs(authData, from, to, function(response){
        if(response.status == "success"){
            //Convert json to csv
            if(response.data.length>0){
               json2csv({ data: response.data}, function(err, csv) {
                    if (err) console.log(err);
                    //Generate CSV file.
                    fs.appendFile('csv/'+date+'.csv', csv, function(err) {
                        if (err) throw err;
                        console.log('file saved for date: ',date);
                        callback();
                    });
                }); 
           }else{
                console.log('No Data for Date: ',date);
                callback();
           }
        }else{
            console.log("Error Fetching CDRs from kazoo");
            console.log("response=",response);
        }
    })
}