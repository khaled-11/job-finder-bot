// Function to Whitelist the domain name
const rp = require('request-promise');

module.exports = async () => {
  var state;
  token = process.env.PAGE_ACCESS_TOKEN;
  // Construct the message body
  var request_body;
  request_body = {
    "whitelisted_domains": [`${process.env.URL}`,"https://www.youtube.com","https://techolopia.com"]
  }
  // Try the request after setting up the request_body.
  try{
    var state;
    var options = {
      method: 'POST',
      uri: `https://graph.facebook.com/v9.0/me/messenger_profile?access_token=${token}`,
      body: request_body,
      json: true
    };
  state = await rp(options);
  console.log("WhiteList Domains:" , state);
  }
  catch (e){
      console.log("whitelist domains has error: ", e)
      throw e;
  }
   return state;
}