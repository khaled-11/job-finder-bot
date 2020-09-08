/// Function to set the Messenger Persistent Menu ///
const rp = require('request-promise');

module.exports = async (sender_psid, type) => {
token = process.env.PAGE_ACCESS_TOKEN;
// Construct the message body
var request_body;
// Create a request Body.
request_body = {
  "psid": sender_psid,
  "persistent_menu": [
    {
        "locale": "default",
        "composer_input_disabled": false,
        "call_to_actions": [
          {
            "type": "nested",
            "title": "Services",
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
              }
            ]
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
      uri: `https://graph.facebook.com/v7.0/me/custom_user_settings?access_token=${token}`,
      body: request_body,
      json: true
    };
  state = await rp(options);
  console.log("Persistent Menu for User", sender_psid, ": " , state);
  }
  catch (e){
    console.log(e)
    console.log("User ", sender_psid, "Persistent menu has error")
  }
   return state;
}