const express = require('express'),
bodyParser = require('body-parser'),
createUsersTable = require("./local_modules/database/create_users_table"),
updateState = require("./local_modules/database/update_state"),
OTN = require ("./local_modules/messenger/OTN"),
callbackSetup = require("./local_modules/messenger/m_setUp"),
subscribePage = require("./local_modules/messenger/page_subscribe"),
whiteList = require("./local_modules/messenger/white_list"),
getStarted = require("./local_modules/messenger/get_started"),
persistentMenu = require("./local_modules/messenger/persistent_menu"),
firstMessages = require("./local_modules/messenger/first_handle_messages"),
firstPostbacks = require("./local_modules/messenger/first_handle_postbacks");

// Calling ASYNC function to Setup the App in order.
appStart();
async function appStart(){
  // Table for Messenger Users.
  await createUsersTable();
  // Setting up the Messenger App.
  await whiteList(); 
  await subscribePage();
  await getStarted();
  await persistentMenu();
  await callbackSetup();
}

// Creating the App object in express.
app = express();

// Using body parser to read the Requst Body from the webhook.
app.use(bodyParser.json());

// Calling OTN Function to check for and send Reminders periodically.
setInterval(function(){OTN()}, 8000);

///////////////////////////////////////////////////////
/// Webhook Endpoint For the Facebook Messenger App ///
///////////////////////////////////////////////////////
app.post('/webhook', (req, res) => {  
    let body = req.body;
    if (body.object === 'page') {
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
      // Gets the body of the webhook event
      if(entry.messaging){
        webhook_event = entry.messaging[0];
        // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        
        // If OTN Approval, will update variables in the DB and trigger handleMessages function to confirm.
        if (webhook_event.optin){
          payload = webhook_event.optin.payload;
          PSID = webhook_event.sender.id;
          userToken =  webhook_event.optin.one_time_notif_token;
          update = updateState(PSID, "N_token", `${userToken}`);
          firstMessages(sender_psid, "AGREED");
        }
        // Can be used for logging Conversation
        if(webhook_event.message && webhook_event.message.is_echo == true && webhook_event.message.text){
         // botLog(webhook_event.recipient.id , webhook_event.message.text, "bot", "Message")
        }
        // Pass the event to handlePostBack function if Quick Reply or Postback.
        // Otherwise, pass the event to handleMessage function.
        if (sender_psid != process.env.PAGE_ID && webhook_event.message && !webhook_event.message.quick_reply) {
          firstMessages(sender_psid, webhook_event);  
        } else if (sender_psid != process.env.PAGE_ID && (webhook_event.postback || (webhook_event.message && webhook_event.message.quick_reply))) {
          firstPostbacks(sender_psid, webhook_event,app);
        }
      }});

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  });
  
  // Adds support for GET requests to our webhook
  app.get('/webhook', (req, res) => {    
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {   
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);  
      } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
      }
    }
  });

  // listen for webhook events //
  app.listen(process.env.PORT || 3370, () => console.log('webhook is listening'));
