const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();
 module.exports = async (sender_psid,limit) => {
    const params = {
        TableName: 'ROBIN_USERS',
        Key: {
        "PSID" : sender_psid,
        },
        UpdateExpression: `set review_till = :ss`,
        ExpressionAttributeValues:{
            ":ss":limit
        },
    };
     const request = docClient.update(params);
         const result = await request.promise();
         return result;
};