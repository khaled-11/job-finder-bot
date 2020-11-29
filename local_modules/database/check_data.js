// Function to check if this Messenger user exists
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async (sender_psid, check) => {
  var exists;
  try {
    params = {
      TableName: 'ROBIN_USERS',
      Key: {
        'PSID': {S: sender_psid}
      },
      ProjectionExpression: `${check}`,
    };
    var request = ddb.getItem(params);
    // Return true or false if exists
    var data = await request.promise();
    if(!data.Item)
      exists = false;
    else
      exists = true;
  } catch (e) {
    throw e
  }
  return exists;
};