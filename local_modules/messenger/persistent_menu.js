// Function to set the Messenger Persistent Menu
const rp = require('request-promise');

module.exports = async () => {
  var state;
  // Construct the message body
  request_body = {
    "persistent_menu": [
      {
          "locale": "default",
          "composer_input_disabled": false,
          "call_to_actions": [
                {
                  "type": "postback",
                  "title": "Opportunity Matchmaking",
                  "payload": "MATCH_MAKING"
                }, {
                  "type": "postback",
                  "title": "Find Mentor/Counselor",
                  "payload": "MENTOR"
                }, {
                  "type": "postback",
                  "title": "Reminders & Insights",
                  "payload": "REMINDERS"
                }, {
                  "type": "postback",
                  "title": "Analyze Job Description",
                  "payload": "ANALYZE"
                }, {
                  "type": "postback",
                  "title": "Get Relevant Information",
                  "payload": "INFO"
                }, {
                  "type": "postback",
                  "title": "Main Menu",
                  "payload": "MENU"
                }
          ]
      }
    ]
  }
  // Try the request after setting up the request_body.
  try{
    var options = {
      method: 'POST',
      uri: `https://graph.facebook.com/v9.0//me/messenger_profile?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
      body: request_body,
      json: true
    };
  state = await rp(options);
  console.log("Persistent Menu: ", state);
  }
  catch (e){
    console.log("Persistent menu has error")
    throw e
  }
   return state;
}