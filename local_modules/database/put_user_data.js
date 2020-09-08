/// Function used to add the user data ///
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async (data) => {
    const params = {
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
        'review_till' : {N: `0`},
        'reminder_info' : {L:  [{"S": "Reminders"}]},
        'reminder_date' : {L:  [{"S": "Reminder Date"}]},
        'matched_jobs' : {L:  [{"S": "Matched Jobs"}]},
        'Mentors' : {L:  [{"S": "Mentor Name"}]},
        'N_token' : {S: ``}
    }};
    const request = ddb.putItem(params);
    const result = await request.promise();
    return result;
};

          