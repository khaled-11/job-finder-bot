// Function to check if a Messenger user exists //
const _ = require("lodash");
const AWS = require("aws-sdk");
AWS.config.update({region: 'us-east-1'});


var ddb = new AWS.DynamoDB();
module.exports = async (sender_psid, check) => {
    const params = {
        TableName: 'ROBIN_USERS',
        Key: {
          'PSID': {S: sender_psid}
        },
        ProjectionExpression: `${check}`,
      };
  
    const request = ddb.getItem(params);
        const data = await request.promise();
            if(!data.Item)
            exists = false;
            else
            exists = true;
            return exists;
          };