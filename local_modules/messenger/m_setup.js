// Function to setup the App callback URL
const rp = require('request-promise');

module.exports = async () => {
  // Construct the request body
  var request_body;
  request_body = {
    access_token: `${process.env.APP_ID}|${process.env.APP_SECRET}`,
    object: "page",
    callback_url: `${process.env.URL}/webhook`,
    verify_token: process.env.VERIFY_TOKEN,
    include_values: "true"
  }
    // Try the request after setting up the request_body.
    try{
      var state;
      var options = {
        method: 'POST',
        uri: `https://graph.facebook.com/v9.0/${process.env.APP_ID}/subscriptions`,
        body: request_body,
        json: true
      };
    state = await rp(options);
    console.log("Callback URL:" , state);
    console.log(`You can now test your App using this link: https://m.me/${process.env.PAGE_ID}`);
    }
    catch (e){
        console.log("Callback URL has error: ", e.message)
        throw e
    }
     return state;
};