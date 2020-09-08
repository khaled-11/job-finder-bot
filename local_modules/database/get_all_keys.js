const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async () => {
    const params = {
        TableName: 'ROBIN_USERS',
        ProjectionExpression: 'PSID'
      };
      
    const request = ddb.scan(params);
        const data = await request.promise();
        
            // in case no blocks are found return undefined
            return data.Items;
          };
