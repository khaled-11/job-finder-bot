// Function to subscribe the page to webhook events
const rp = require('request-promise');
module.exports = async () => {
  var state;
  let fields =
  "messages, messaging_postbacks, messaging_referrals, messaging_optins, messaging_handovers";
  // Construct the message body
  request_body = {
        access_token: process.env.PAGE_ACCESS_TOKEN,
        subscribed_fields: fields
  }
  // Try the request after setting up the request_body.
  try{
    var state;
    var options = {
      method: 'POST',
      uri: `https://graph.facebook.com/v9.0/${process.env.PAGE_ID}/subscribed_apps`,
      body: request_body,
      json: true
    };
    state = await rp(options);
    console.log("Subscribed page to Events:" , state);
  }
  catch (e){
      console.log("Page Subscription has errors: ", e.message)
      throw e
  }
  return state;
};