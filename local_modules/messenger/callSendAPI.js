/////////////////////////////////////////////////////////////
//   Asynchronous function to send responses to the user   //
//      It will keep the order of the replies if many.     //
/////////////////////////////////////////////////////////////
const rp = require('request-promise'),
fs = require("fs");
require('dotenv').config();

module.exports = async (sender_psid, response, action, userToken) => {
    // Decalre some variables for the request.
    var request_body;
    var state;
    var token = process.env.PAGE_ACCESS_TOKEN;
    var persona_id = null;
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
    // Here is if it is a regular Response including templates and quick replies.
    else if (!action){
        request_body = {
        "recipient": {
        "id": sender_psid
        },
        "message": response
        }
    } 
    // Last option is if the response is action (Read / Sender Effect)
    else {
        request_body = {
        "recipient": {
        "id": sender_psid
        },
        "sender_action":action
        }
    }

    // Try the request after setting up the request_body.
    try{
        // If it is a regular Response or OTN
            var options = {
                method: 'POST',
                uri: `https://graph.facebook.com/v7.0/me/messages?access_token=${token}`,
                body: request_body,
                json: true
            };
            state = await rp(options);
    }
    catch (e){
        console.log(e);
    }
    return state;
}