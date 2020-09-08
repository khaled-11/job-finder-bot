// Function to check whether to add or get the information //
const exists = require("./check_data"),
putUserData = require("./put_user_data"),
getUserData = (require("./get_user_data")),
requestData = require("../messenger/req_data");

///////////////////////////////////////////////////////////////////////
// Asynchronous Function to check if the user exists in the Database //
//     If the user exists it will return his personal information    //
//  If not, it will create a new entry fot the user in the database  //
///////////////////////////////////////////////////////////////////////
module.exports = async (sender_psid) => {
    var data;
    // Check if the user is already in the database.
    // Both cases will end up by reading the data again.
    const check = await exists(sender_psid,"PSID");
    // If exists, read the data.
    if (check === true)
    {
        data = await getUserData(sender_psid);
    // If this is the first visit, request personal Data from Facebook.
    // Then add the data to the DynamoDB table for users.  
    } else {
        userData = await requestData(sender_psid);
        state = await putUserData(userData);
        data = await getUserData(sender_psid);
      }
    return data;
}