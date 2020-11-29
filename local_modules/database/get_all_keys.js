// Function to get all users IDs from the database.
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async () => {
  try {
    params = {
      TableName: 'ROBIN_USERS',
      ProjectionExpression: 'PSID'
    };  
    request = ddb.scan(params);
    data = await request.promise();
  } catch (e) {
    throw e
  }  
  return data.Items;
};
