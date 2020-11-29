 // Function to add Get Started button for a page
const rp = require('request-promise');
module.exports = async () => {
  var results;
  try{
    var options = {
      method: 'POST',
      uri: `https://graph.facebook.com/v9.0/me/messenger_profile?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
      body: {"get_started":{"payload":"GET_STARTED"
      }},
      json: true
  };
  results = await rp(options);
  }
  catch (e){
  console.log(e.message);
  throw e;
  }
  console.log("Get Started: ", results)
  return results;  
};
