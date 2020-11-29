// Function to delete the user data from the Database
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
      }
    };
  request = ddb.deleteItem(params);
  data = await request.promise();
  } catch(e){
    throw (e);
  }
    return data;
  };
