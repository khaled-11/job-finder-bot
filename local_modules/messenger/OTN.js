
// Function to check the OTN tokens and reminders dates.
const unirest = require("unirest"),
callSendAPI = require("./callSendAPI"),
getAll = require("../database//get_all_keys"),
updateCheck = require("../database/updateCheck"),
updateUserData = require("../database/update_user_data");

module.exports = async () => {
  // Get the day of today then format.
  var checkDate = new Date();
  var checkDay = checkDate.getDate();
  var checkMonth = checkDate.getMonth();
  var checkYear = checkDate.getFullYear();
  // Get all the users keys and loop
  all = await getAll();
  for (i = 0 ; i < all.length ; ++i){
    var date = true;
    sender_psid = all[i].PSID.S;
    check = await updateCheck(sender_psid);
    // Check the current date and compare
    // Date = check.Item.reminder_date.L[check.Item.reminder_date.L.length];
    // var Day = Date.getDate();
    // var Month = Date.getMonth();
    // var Year = Date.getFullYear();
    // Comapre Dates and in it is the day before, send Notification with related videos as below.
    if(check.Item.N_token.S !== "" && date == true){  
      await updateUserData(sender_psid, "general_state","SENDING OTN");          
      userToken = check.Item.N_token.S;
      action = null;
      PSID = null;
      response = {"text":"This is a test For the OTN notification message.\nThe function is scheduled every day to check if the user have remainders and send notification one day before.",
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Practice Resources",
          "payload":`PRACTICE`
        }, {
          "content_type":"text",
          "title":"Connect with Mentor",
          "payload":`MENTOR`
        }
      ]};
      await callSendAPI(PSID, response, action, userToken);
      // Clear the token after send the message
      update = await updateUserData(sender_psid, "N_token", "");
    }
  }
  // Sleep function to wait for results
  function sleep(ms) {
    return new Promise((resolve) => {
    setTimeout(resolve, ms);
    });     
  } 
}



