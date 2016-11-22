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
        var finalTotal = {};
        function loop(){
            t = fm + (24*60*60);
            getCDR1(fm, t, authData, function(totalMin){
                fm = t;
                for(var key in totalMin){
                    var min = Math.floor(totalMin[key] / 60);
                    if(!finalTotal[key]){
                        finalTotal[key] = min;
                    }else{
                        finalTotal[key] = finalTotal[key]+ min;
                    }
                }
                if(fm != to){
                    loop();
                }else{
                    console.log("==============================================");
                    console.log("Total Minutes from: ",result.From," to: ",result.To);
                    for(var key in finalTotal){
                        console.log("Prefix: ", key,"Minutes: ",finalTotal[key]);
                    }
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

function getCDR1(from, to, authData, callback){
    var date = Kazoo.parseDate(from);
    // Get cdrs from kazoo
    var totalMin = {};
    Kazoo.getCDRs(authData, from, to, function(response){
        if(response.status == "success"){
            if(response.data.length>0){
                for(i=0;i<response.data.length;i++){
                    billing_seconds = parseInt(response.data[i].billing_seconds);
                    if(response.data[i].direction == "outbound" && billing_seconds>0){
                        var prefix = response.data[i].callee_id_number.substring(0, 2);
                        if(!totalMin[prefix]){
                            totalMin[prefix] = billing_seconds;
                        }else{
                            totalMin[prefix] = totalMin[prefix]+billing_seconds;
                        }
                    }
                    if(i == response.data.length-1){
                        console.log("Total Minutes for Date:",date);
                        for(var key in totalMin){
                            var min = Math.floor(totalMin[key] / 60);
                            console.log("Prefix: ", key,"Minutes: ",min);
                        }
                        json2csv({ data: response.data}, function(err, csv) {
                            if (err) console.log(err);
                            //Generate CSV file.
                            fs.appendFile('csv/'+date+'.csv', csv, function(err) {
                                if (err) throw err;
                                console.log('file saved for date: ',date);
                                callback(totalMin);
                            });
                        });
                    }                
                }
            }else{
                console.log('No Data for Date: ',date);
                callback(totalMin);
            }    
        }else{
            console.log("Error Fetching CDRs from kazoo");
            console.log("response=",response);
        }
    })
}