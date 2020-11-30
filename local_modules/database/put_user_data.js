// Function to put intial user data into the database
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async (data) => {
    var result;
    try{
        params = {
            TableName: 'ROBIN_USERS',
            Item: {
            'PSID' : {S: `${data.id}`},
            'profile_pic_url' : {S: `${data.profile_pic}`},
            'first_name' : {S: `${data.first_name}`},
            'last_name' : {S: `${data.last_name}`},
            'general_state' : {S: `new`},
            'email' : {S: ``},
            'job_place' : {L:  [{"S": "State/Online"}]},
            'job_role' : {L:  [{"S": "Job Role"}]},
            'job_type' : {L:  [{"S": "Job Type"}]},
            'companies' : {L:  [{"S": "Company Name"}]},
            'user_type' : {S: ""},
            'reminder_info' : {S: ``} ,
            'reminder_date' : {S: ``} ,
            'N_token' : {S: ``},
            'review_till' : {N: `0`},
            'connection_state' : {S: ``},
            'connected_with' : {S: ``} 
        }};
        request = ddb.putItem(params);
        result = await request.promise();
    } catch (e) {
        throw e
    }
    return result;
};

          