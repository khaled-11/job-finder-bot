// Function to update the Current reached limit for a specific Fundraising //
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();
 module.exports = async (sender_psid, type, data) => {
    const params = {
        TableName: 'ROBIN_USERS',
        Key: {
        "PSID" : sender_psid,
        },
        ExpressionAttributeNames : {
            "#current": `${type}`
        },
        UpdateExpression: "set #current[9999] = :attrValue",
        ExpressionAttributeValues: {
          ":attrValue": `${data}`
        }    
    };
    const request = docClient.update(params);
    const result = await request.promise();
    return result;
}; 