var request = require('request');
var kazooConfig = require('./config.json');
module.exports = {
	// Rest client to create device in kazoo
	getCDRs : function (autData, from, to, callback){
		request({
		     url: kazooConfig.kazooUrl + '/v1/accounts/'+autData.data.account_id+'/cdrs?created_from='+from+'&created_to='+to, 
		     method: 'GET',
		     headers: {
		         'Content-Type': 'application/json',
		         'X-Auth-Token': autData.auth_token
		     }
 		}, function(error, response, body){
			if(error) {
				callback(error);
			} else {
				callback(JSON.parse(body));
			}
		});
    },
    getAuth : function (callback){
        var body = {"data":{"api_key" : kazooConfig.apiKey }}; 
        request({
            url: kazooConfig.kazooUrl + '/v1/api_auth', 
            method: 'PUT',
            headers: {
               'Content-Type': 'application/json'
            },
            json: body //Set the body as a string
        }, function(error, response, body){
            if(error) {
              callback(error);
            } else {
               callback(body);
            }
        });
    },
    parseDate : function (timestamp) {
        var parsed_date = '-';

        if (timestamp) {
            var date = new Date((timestamp - 62167219200) * 1000),
                month = date.getMonth() + 1,
                year = date.getFullYear(),
                day = date.getDate(),
                humanDate = month + '-' + day + '-' + year,
                humanTime = date.toLocaleTimeString();

            parsed_date = humanDate;
        }

        return parsed_date;
    }
};