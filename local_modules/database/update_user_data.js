// Function to update the user Data
const _ = require("lodash");
const AWS = require("aws-sdk");

var docClient = new AWS.DynamoDB.DocumentClient();
module.exports = async (sender_psid, field, data) => {
    try {
        params = {
            TableName: 'ROBIN_USERS',
            Key: {
            "PSID" : sender_psid,
            },
            UpdateExpression: `set ${field} = :ss`,
            ExpressionAttributeValues:{
                ":ss":`${data}`
            }};
            request = docClient.update(params);
            result = await request.promise();
    } catch (e){
        throw e
    }
    return result;
};