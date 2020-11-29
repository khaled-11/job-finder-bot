// Function to get user data from the Database
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async sender_psid => {
  var data;
  try{
    params = {
      TableName: 'ROBIN_USERS',
      Key: {
        'PSID': {S: sender_psid}
      },
      // The data fields
      ProjectionExpression: 'PSID, review_till, profile_pic_url, first_name, last_name, general_state, email, job_place, job_role, job_type, companies, N_token, reminder_info, reminder_date, user_type, connection_state, connected_with'
    };
    request = ddb.getItem(params);
    data = await request.promise();
  } catch(e){
    throw(e);
  }
  return data;
};
