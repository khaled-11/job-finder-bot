 /// Function to Add Get Started Button for a Page ///
const rp = require('request-promise');
module.exports = async (token) => {
  var results;
  try{
    var options = {
      method: 'POST',
      uri: `https://graph.facebook.com/v8.0/me/messenger_profile?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
      body: {"get_started":{"payload":"GET_STARTED"
      }},
      json: true
  };
  results = await rp(options);
  }
  catch (e){
  console.log(e.message);
  }
  console.log("Get Started: ", results)
  return results;  
};
