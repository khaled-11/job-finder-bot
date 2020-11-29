// Function to request the user data from Facebook
const rp = require('request-promise');

module.exports = async sender_psid => {
    var result;
    try{
      var options = {
        uri: `https://graph.facebook.com/v9.0/${sender_psid}?fields=first_name,last_name,profile_pic`,
        qs: {
            access_token: process.env.PAGE_ACCESS_TOKEN
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true
    };
    result = await(rp(options));
    console.log(result);
    }
    catch (e){
    console.log(e);
    throw e;
    }
    return result;  
};