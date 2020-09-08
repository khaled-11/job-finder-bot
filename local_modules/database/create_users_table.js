//////////////////////////////////////////////////////////////
////             Create Messenger Users Table             ////
////             This is keyed on sender PSID             ////
//////////////////////////////////////////////////////////////
const AWS = require("aws-sdk");
// Update the AWS Region.
AWS.config.update({region: 'us-east-1'});

module.exports = async () => {
  try {
  var ddb = new AWS.DynamoDB();
  var params = {
    AttributeDefinitions: [
      {
        AttributeName: 'PSID',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'PSID',
        KeyType: 'HASH'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    },
    TableName: 'ROBIN_USERS',
    StreamSpecification: {
      StreamEnabled: false
    }
  };
  // Call DynamoDB to create the table if doesn't exist.
  const request = ddb.createTable(params);
  result = await request.promise();
  console.log("Table Created!");
  } catch (e){
    console.log("Table Exists!");
  }
  return;
};