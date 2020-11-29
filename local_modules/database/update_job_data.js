// Function to update the user data
const _ = require("lodash");
const AWS = require("aws-sdk");

var docClient = new AWS.DynamoDB.DocumentClient();
module.exports = async (sender_psid, type, data) => {
    var result
    try{
        params = {
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
        request = docClient.update(params);
        result = await request.promise();
    } catch (e){
        throw e
    }
    return result;
}; 