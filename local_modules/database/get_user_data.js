/// Function to get user data from the Database ///
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async sender_psid => {
  var data;
  try{
    const params = {
      TableName: 'ROBIN_USERS',
      Key: {
        'PSID': {S: sender_psid}
      },
      ProjectionExpression: 'PSID, profile_pic_url ,first_name, last_name, general_state, email, job_place, job_role, job_type, companies, review_till, matched_jobs, Mentors, N_token, reminder_info, reminder_date'
    };
  
  const request = ddb.getItem(params);
  data = await request.promise();

  } catch(e){
throw(e);
  }
    // in case no blocks are found return undefined
    return data;
  };
