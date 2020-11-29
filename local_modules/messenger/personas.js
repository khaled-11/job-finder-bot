 /// Function to add personas to the Messenger profile
 const rp = require('request-promise');
 module.exports = async () => {
   var results;
   try{
     var options = {
       method: 'POST',
       uri: `https://graph.facebook.com/v9.0/me/personas?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
       // In this App we will set only one persona for Demo purposes.
       body: {	"name": "Mike",
       "profile_picture_url": "https://mynameuuy.com/mike.png"
       },
       json: true
   };
   results = await rp(options);
   }
   catch (e){
   console.log(e.message);
   throw e;
   }
   console.log("Please add the following Persona Id for Mike : ", results)
   return results;  
 };
 