// Function to reply to users using Facebook Graph API
const rp = require('request-promise'),
fs = require("fs");
require('dotenv').config();

module.exports = async (sender_psid, response, action, userToken, personaID) => {
    // Decalre some variables for the request.
    if (personaID){
        persona_id = personaID
    } else {
        persona_id = null
    }
    var state;
    var token = process.env.PAGE_ACCESS_TOKEN;
    // Check if the request body is an action, OTN or a regular response.
    // The first case if it is OTN.
    if (!sender_psid){
        request_body = {
        "recipient": {
        "one_time_notif_token": userToken
        },
        "message": response
        }
    }
    // This case is a regular response including templates and quick replies.
    else if (!action){
        request_body = {
        "recipient": {
        "id": sender_psid
        },
        "message": response,
        "persona_id":persona_id
        }
    } 
    // Last option is if the response is an action (Read / Sender Effect)
    else {
        request_body = {
        "recipient": {
        "id": sender_psid
        },
        "sender_action":action,
        "persona_id":persona_id
        }
    }
    // Try the request after setting up the request_body.
    try{
        var options = {
        method: 'POST',
        uri: `https://graph.facebook.com/v9.0/me/messages?access_token=${token}`,
        body: request_body,
        json: true
    };
    state = await rp(options);
    }
    catch (e){
        throw e
    }
    return state;
}