///////////////////////////////////////////
/// Sending OTN from Messenger Function ///
///////////////////////////////////////////
const callSendAPI = require("./callSendAPI"),
updateState = require("../database/update_state"),
getAll = require("../database//get_all_keys"),
unirest = require("unirest"),
updateCheck = require("../database/updateCheck");

module.exports = async () => {
    var checkDate = new Date();
    var checkDay = checkDate.getDate();
    var checkMonth = checkDate.getMonth();
    var checkYear = checkDate.getFullYear();
    all = await getAll();
    for (i = 0 ; i < all.length ; ++i){
        sender_psid = all[i].PSID.S;
        check = await updateCheck(sender_psid, "SENDING OTN");
        // Date = check.Item.reminder_date.L[check.Item.reminder_date.L.length];
        // var Day = Date.getDate();
        // var Month = Date.getMonth();
        // var Year = Date.getFullYear();
        // Comapre Dates and in it is the day before, send Notification with related videos as below.
        if(check.Item.N_token && check.Item.N_token.S !== ""){            
        userToken = check.Item.N_token.S;
        action = null;
        PSID = null;
        var elements = [];
        var req = unirest("GET", `https://www.googleapis.com/customsearch/v1?key=AIzaSyD6UQ_AMNNAe6C4x0rEbhnS1a8f3psE4S0&cx=62ab1f4c93443a29d&q=Interview Tips`);    
        req.end(async function (res) {
        elements[elements.length]={"title": res.body.items[0].title ,"image_url":"https://techolopia.com/wp-content/uploads/2020/10/YouTube-Banner-Size-and-Dimensions-Guide.png", "subtitle":res.body.items[0].snippet, "default_action": {"type": "web_url","url": `${res.body.items[0].link}`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":res.body.items[0].link,"title":"Watch on Youtube"}]}
        elements[elements.length]={"title": res.body.items[1].title ,"image_url":"https://techolopia.com/wp-content/uploads/2020/10/YouTube-Banner-Size-and-Dimensions-Guide.png", "subtitle":res.body.items[1].snippet, "default_action": {"type": "web_url","url": `${res.body.items[1].link}`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":res.body.items[1].link,"title":"Watch on Youtube"}]}
        });
        await sleep (3000);
        response = { 
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"generic",
                "elements": elements
              }
            }
        }
        action = null;
        state = await callSendAPI(sender_psid, response, action);
        response = {"text":"This is a Test For Notification Message.\nScheduled every day to check if the user have Remainders and send Notification One Day Before.\nIt will have some resources and Insights."};
        console.log("fdfd");
        await callSendAPI(PSID, response, action, userToken);
        const update = await updateState(sender_psid, "N_token", "");
        } else{
            console.log("not approved");
        }
    }
    function sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
      } 
}



