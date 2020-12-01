![Open Source](https://badges.frapsoft.com/os/v2/open-source.svg?v=103)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Job Finder Bot

<div align ="center">
<img width="200" height="200" src="https://techolopia.com/wp-content/uploads/2020/10/profile-1.jpg">
<br>
</div>
<br>

## Introduction

Every organization can offer their services through a smart chat-bot Application. This will increase the productivity and provide a better support for their customers. Users won't need to download a special App to use these services or to access their accounts. For example, a restaurant can offer a delivery service through Messenger chat-bot App. The user can see the menu, place orders, and track delivery status all in a Messenger conversation. Also, the App can encrypt and store the order history, payment methods, and other details. I built a Messenger chat-bot App that help people find jobs in the USA. This chat-bot App help users find job opportunities, and connect them with mentors. Moreover, it can provide practice resources for interviews and send reminders. Also, this App can find reviews and information about a specific company. The user can add the company to the job search data and get related opportunities. In this tutorial, I will explain how I built this App, how to use it, and how to build a similar experience.

## What this App does & How I built it

This chat-bot App uses Wit.ai to understand the user intent and capture some details. Then, the App store the users data in AWS DynamoDB table, so it is scalable. To find matching results and reviews, the App calls Google custom search API and other APIs. Moreover, this App uses Messenger One Time Notification to send reminders to users. I used OTN because these reminders can be outside of the 24 hours frame. Moreover, users can connect and chat with Mentors in the same conversation. The App uses Messenger Personas when it forward messages from mentors to users. Finally, this App provides a way for users to delete their data or start over.


### Capture details using Wit.ai

We need to capture information like job preference and company name. Also, the dates in the reminders intent to schedule the reminder. This App uses Wit.ai to capture entities in the user inputs and save it in a database. I defined intents, entities and trained the App with some possible utterances. Some of the utterances are like: (I need to set reminder for interview on {December 1, 2020} | I need review for {CVS}). Most of the intents requires entities => ("CVS" is entity for "review" intent). The App will request entities if it detect an intent without the required data like: (I need reviews). Some intents can work with 1,2 or 3 entities. Examples can be like: (I need software engineer job | I need software engineer job in Florida). It will work with only the job role or with combinations by handling each case in a different way. To do so, create an intent and add entities as needed while you train the Wit model. When the user send a message to the App, the Wit model will identify the intent, entities, and traits if any. In the App code, we need to match the intent name and check for entities. The following code example from this App used for the reminders intent. If the App identify the intent, it will check what entities we have in the Wit response. For each combination of entities there is a response. If the App identify the intent but didn't find entities, it will request the entity from the user. If the App captured the required data, it will ask the user to confirm the details. When the user confirm, this will send a post-back with the captured date. When the App receive the post-back, it will save the data from the payload into the database.

``` JAVASCRIPT
if (intent === "reminders"){
    // If we have the job details with the information date
    if (nlp.entities['job_role:job_role'] && nlp.entities['wit$datetime:datetime']){
      var date = new Date(`${nlp.entities['wit$datetime:datetime'][0].value}`);
      var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      var new_date = `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()} ,${date.getFullYear()}`;
      response = { "text":`I got the interview date on ${new_date} for ${nlp.entities['job_role:job_role'][0].body} role, is that correct?`,
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Correct ✅",
          "payload":`CONFITWO_${new_date}_${nlp.entities['job_role:job_role'][0].body}`
        }, {
          "content_type":"text",
          "title":"No ❌",
          "payload":"REMINDERS"
        }
      ]
    }    
    action = null;
    state = await callSendAPI(sender_psid, response, action);
    } 
    // If the reminder include only date without job details.
    else if (nlp.entities['wit$datetime:datetime'] && nlp.entities['wit$datetime:datetime'][0].value){
      var date = new Date(`${nlp.entities['wit$datetime:datetime'][0].value}`);
    } 
    // If there is no dates, but the intent is reminders
    else {
      response = { "text":`I believe you are trying to set reminders by I didn't get the date.`,
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Main Menu",
          "payload":`MENU`
        }
      ]};
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    }
}
```

<div align ="center">
  <img width="800" src="https://media.giphy.com/media/824sB4Whn1BDHuiB6Z/giphy.gif">
</div>


### APIs for reviews and search results

After we capture the information, we need to get the required data. This App uses Wextractor API to find reviews on indeed. Also it uses Crunchbase to find information about companies. Moreover, it uses Google custom search API to search for job postings. For the reviews, the API returns a .json response with many entries in an array. To display the reviews one by one to the user, I used an integer in the user data. When the user ask for reviews, the App will display the first element in the data array. The user can click next which which will send a post-back and increment the integer. In the code below, the App will read the first entry in the array and format the response. Then it will increment the integer incase the user click next review.

``` JAVASCRIPT
if (jsonData && jsonData[0] && jsonData[0].rating){
    let rate = "";
    for (n = 0 ; n < jsonData[0].rating ; n++){
      rate += "⭐";
    }
    response = { "text":`*Data:* ${jsonData[0].datetime} *Rating:* ${rate} \n*Current/Formal Employee:* ${jsonData[0].reviewer_employee_type}\n*Reviewer Role:* ${jsonData[0].reviewer}\n*Location:* ${jsonData[0].location}\n*Review Text:* ${jsonData[0].text}\n*Link:* ${jsonData[0].url}`,
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Main Menu",
          "payload":"MENU"
        }, {
          "content_type":"text",
          "title":"Add Company",
          "payload":`ADD_${name}`
        }, {
          "content_type":"text",
          "title":"Next Review ⏭️",
          "payload":`NEXT_${name}`
        }
    ]}
    action = null;
    state = await callSendAPI(sender_psid, response, action);
    // Update the current limit to use with the next button
    updateLimit(sender_psid,1)
}  

```
<div align ="center">
  <img width="800" src="https://media.giphy.com/media/iUR2ga5rhwJWPM618J/giphy.gif">
</div>


### Messenger One Time Notification for reminders

This App uses Messenger One Time Notification to send reminders to users. After the App capture the date and save it in the database, it check the data and dates every interval. In the function, the App will loop over all the users. If there is a dates in the reminders field, it will compare it with the date now. If this is the time to send a notification, the App will send a message to the user. This message could be outside the 24 hours window frame, so I used the OTN here. In the example code below, I cleared the OTN for the user after I send the message. This can avoid some errors in the future.


``` JAVASCRIPT
// Calling OTN function to check for and send reminders.
setInterval(function(){OTN()}, 800000);

// OTN Function
all_IDs = await getAll();
// Loop through all the App IDs
for (i = 0 ; i < all_IDs.length ; ++i){
  var date = false;
  sender_psid = all_IDs[i].PSID.S;
  // Get the user data from the database
  check = await updateCheck(sender_psid);
  // Check if the user have date in the database
  if (check.Item.reminder_date.S !== ""){
      // Check the date and compare it with the time now.
      var checkDate = new Date();
      date = true;
  }
  // If everything looks good and the user agree
  if(check.Item.N_token.S !== "" && date == true){  
      // Send the message to the user
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
      // Use the OTN token instead of user psid
      userToken = check.Item.N_token.S;
      action = null;
      PSID = null;
      await callSendAPI(PSID, response, action, userToken);
      // Clear the token after send the message
      update = await updateUserData(sender_psid, "N_token", "");
   }
}

```
<div align ="center">
  <img width="800" src="https://media.giphy.com/media/3YmcLsZbhij5NQVTjN/giphy.gif">
</div>


### Connect users with Mentors in the same conversation

This App uses Messenger personas when it connect users with live mentors. Every mentor can have a persona with the name and profile picture. When a user try to connect with a mentor, the App will check the mentor status in the database. If the mentor is available, the App  will send the mentor a request to accept the conversation or refuse. If  the mentor accept the conversation, the App will notify the user and update the database. Then the app will forward messages between both  parties. When the mentor send a message to the user, the App will use the mentor persona ID with this message to the user. The mentor  can end the conversation using a command. When the mentor end the conversation, the App will update the database. It will clear the connected_with field and update the mentor status to available. When the App clear the connected_with field, it will stop forward text message from this user. The code below is in the handle messages function. It will check if users connected with mentors when they send a message. If they are connected with mentors, the App will send this message to the mentor. This is before the App go to check for intents. If the user is not connected with any mentor, the App will continue the next step and do the NLP. The second part of the code is when the mentor accept the user request. It will update the connected with data field for the mentor and the user. Then it will send a confirmation to both parties.

``` JAVASCRIPT
// In the handle messages function to check before the App proceed
if (data.Item.connected_with.S !== ""){
    await senderEffect(sender_psid, app, "mark_seen");
    response = { "text":webhook_event.message.text};
    action = null;
    state = await callSendAPI(data.Item.connected_with.S, response, action);
}

// When the mentor accept the request
if (payload.includes("MCON")){
    mentorName = payload.split("_")[1]
    userID = payload.split("_")[2]
    data = await updateCheck(process.env.MIKE_FB_ID);
    userData = await updateCheck(sender_psid);
    updateUserData (sender_psid, "connected_with" , userID)
    updateUserData (userID, "connected_with" ,sender_psid)
    response = {
      "text":`Now you are connected with ${userData.Item.first_name.S}.`
    };
    action = null;
    state = await callSendAPI(process.env.MIKE_FB_ID, response, action);     
    response = {
      "text":"Mike approved the request and now you are both connected."
    };
    action = null;
    state = await callSendAPI(userID, response, action);
}
```

<div align ="center">
  <img width="800" src="https://media.giphy.com/media/qPhzsalIn6CkMNXbBW/giphy.gif">
</div>


### Provide a way to reset the App or delete the data

It is very helpful to provide a way for users to delete their data and start over. Some users might enter some sensetive data by mistake and need a way to delete these data. Also, users might want to delete their personal data and stop using the App. In this App we provide a way to delete the data and exit or start over. First, we defined and trained an intent for data deletion and start over. When the App identify this intent, it confirm with the user. If the user confirm, the App will delete the data from the database and provide options. The user can choose to start over which will request the data from Facebook again, or exit without requesting the data again. 

<div align ="center">
    <img width="800" src="https://media.giphy.com/media/VsBeJSUr8UXFwEHRMV/giphy.gif">
</div>


## How to install and use this App

### Requirements:

> **Facebook Page**: You need a Facebook page to use with this App. To create a new test Page, click [here](https://www.facebook.com/pages/create).

> **Facebook Developer Account**:  You need a Facebook Developer Account to use this  experience. If you don't have an account, create a new one from the [Facebook Developers website](https://developers.facebook.com/). Click "get started" on the top right of the page, and complete the steps.

> **Wit.ai Account**: You need a Wit.ai account to create a new Wit App and train it for the intents. To create one, go to [Wit.ai website](https://wit.ai/), and click "Continue with Facebook".

> **AWS Account**: You need AWS account to create the Database for the App. To create one, go to [AWS website](https://aws.amazon.com/), and sign up for a free tier account.

> **Google Cloud Account**: You need Google Cloud account to get the custom search API key. Also, to generate password for the email will use with nodemailer. If you don't have one, go to [Google cloud website](https://cloud.google.com) and signup for free trial.

> **Wextractor Account**: Signup for a free account at https://wextractor.com/. We need it to get the key for the Indeed reviews API.

> **Node.js & NPM**: Node.js preferred version "latest" & NPM preferred version "latest". If you don't have them on your machine, go to [Node.js website](https://nodejs.org/en/) to download Node.js & NPM. You can use [Glitch](https://glitch.com/) to run the App without installing Node.js on your machine.

> **Local Tunnel Service**: You can use [Ngrok](http://ngrok.com) to run the App on your local machine. This will gives you a link to use as a callback url. If you will use [Glitch](https://glitch.com/), you don't need a local tunnel service.

### Installation

You can download and run the App on your local machine, or upload it to [AWS Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/). If you run on your local machine, you will need to configure the AWS SDK to connect your account. This way the App can control the database while running on your machine. To install the SDK, read [this article](https://aws.amazon.com/cli/). Run the following commands to download the required packages:

```
git clone https://github.com/khaled-11/job-finder-bot.git
cd job-finder-bot
npm install
```

Now, we need to rename .sample.env to .env and fill the data. If you use Elastic beanstalk, update the environment variables in the  configuration. We will need APP_ID, APP_SECRET, PAGE_ID & PAGE_ACCESS_TOKEN. We will get these information from the Facebook developer account. The VERIFY_TOKEN is any random string you choose to verify the call back URL. We will get the WIT_KEY from the [Wit.ai](https://wit.ai/) website. The URL field is the ```https://``` link for the App server. If you use your local machine, enter the local tunnel link. For Elastic Beanstalk, enter the  ```https://``` link for the main domain. Enter WEX_KEY from the https://wextractor.com/ website for indeed reviews. [Generate App password](https://support.google.com/mail/answer/185833) for your Gmail account. Add this to the EMAIL & E_PASS variables in the file. Generate a key for [Google custom search API](https://developers.google.com/custom-search/). Refer to [this article](https://developers.google.com/custom-search/docs/tutorial/creatingcse) for more information about the API uses. If you can't get a key or setup the custom search, use this key "AIzaSyD6UQ_AMNNAe6C4x0rEbhnS1a8f3psE4S0". You can use this key for GOOGLE_KEY to test the API with limits.

#### Facebook Developer Account:

Create a new App from the account.  setup Messenger product, and go to the product settings. Scroll down and click "Add or Remove  Pages". Add the page you want to use. Now, "Generate Token", and copy the token. Add this token to the PAGE_ACCESS_TOKEN variable in the .env file. Go back to the same page and find PAGE_ID & APP ID. Go to settings and basic settings. Get the APP_SECRET and add it to the variables.

#### Wit.ai Account:

Go to [Wit.ai](http://wit.ai) website, and create new App. In the app dashboard, click setting and copy the "Server Access Token". Add it for the WIT_KEY field in the .env file.

### Run the App:

Now, we have completed the required environment variables and the App  is ready to run. If you use your local machine, open a new terminal and  navigate to the App main folder. Run the command ``` node index.js ``` to start the App server. If you use Elastic Beanstalk, the platform will refresh the server and add the variables. You may need to comment the ``` callbackSetup ```  import and invoke. This if Elastic Beanstalk gives you an error and can't start the server.  In this case, update the Callback URL in the Messenger App dashboard. Finally, add the persona ID from the printed logs and your PSID to the .env file.

#### Train the Wit App:

For this demo, you need to train the App with some intents and entities. There is an export from the current Wit App which you can use instead of training new App. Otherwise, go to the App Dashboard in [Wit.ai](https://wit.ai) console, and start the process. We will need the following intent:

<ol>
  <li>job_preference: The App uses this to capture the job preference  from the user input. You can train the app with utterances like: "I need  a {full time} {Software engineer} job in {California}". Define a  "job_role", "job_role" & "state" for this intent in the same order.  You can add utterances with one or two only, but you need to define all.</li> 
    <li>reminders: The App uses this to capture the date and the  interview information. You can train the app with utterances like. "I  have an interview for a {Software engineer} job with {Google} on  December 28, 2020". Define a "company_name" for this intent and choose  the job_role we created before. You can add utterances with the date  only.</li> 
    <li>resources & reviews: The App uses these intent to capture company name. This will get reviews and information about company. You can train the app with  utterances like: "I need review for {google}" , "I need information  about CVS". Use the company name entity we created before.</li> 
     <li>analyze: This intent will capture the URL for the link any user send. The utterances can be "I need to analyze https://..".</li> 
     <li>delete_data & remember: These two intent will identify if  the user want to delete the data. Also, it will identify if the user ask about the data. You can train  these intent with utterances like "Do you remember me" , "Delete my  data".</li> 
       <li>welcome & thanks: These two intent will identify if the user want to greet or thank. You can train these intent with utterances like "thank you" , "how are you".</li> 
    
</ol>

#### Request OTN:

You need to activate the one time notification for this page. Go to page settings then "Advanced Messaging". Scroll down and find "One-Time Notification" and request it. After you activate this features, the App can send the "Notify Me" template to the users. When a user click this button, the App will get a token for this user. You can use this token to send one message to a user after 24 hours.

#### Test on Messenger:

To test the App on Messenger, follw the link from the setup step. Open a conversation and test the bot for the intents. Go to Insights & Reminders and test the notifications. There is a function that will check if any users clicked notify me. If the function found OTN tokens, it will send a sample notification. You can get the token from the database or print it to the console. You can use it to send responses using the [Graph Explorer](https://developers.facebook.com/tools/explorer/) and test other things.

``` JAVASCRIPT
// Main file
setInterval(function(){OTN()}, 88000);

// OTN Function
for (i = 0 ; i < all.length ; ++i){
  if(check.Item.N_token && check.Item.N_token.S !== ""){            
    userToken = check.Item.N_token.S;
    PSID = null;
    var elements = [];
  } else {
  // User not opt-in
  }
```

#### Save the API:

This code snippet limit the API usage by saving new companies reviews to the local server. It will check if we have the reviews in the the global data folder first. If not, it will request from the API and save it for the next time.

[![API Save](https://techolopia.com/wp-content/uploads/2020/09/code_snippet.jpg)](https://m.me/118754656624049)


#### Live link:

You can test the App live using this link: https://m.me/100364215214464

## How to build a similar experience:

### Wit App for NLP

First, you need a way to understand the user intent easily. Create a Wit.ai App and start defining the intents you may need. Add entities and traits where applicable. Then, train the app with example utterances. Finally, write in your code the logic that will handle each intent and it's entities and traits if any.

### Database and schema

You may need Database or you can use internal Data structure to save the users Data. If you expect high trafic, you might consider a cloud based database. This App uses NoSQL DynamoDB to save the users data. See what data you might need to save about users and design your schema and write the required functions.

### APIs to connect resources

You may need to use APIs to find search results or get information from resources. You can capture the entities using Wit.ai, then send the details to a search API or query another database. Use Async/Await to wait for the promise, then format the response and send it to the user. 

### Messenger platform features

There are many features you can use on the Messenger platform like [account linking](https://developers.facebook.com/docs/messenger-platform/identity/account-linking), [private replies](https://developers.facebook.com/docs/messenger-platform/discovery/private-replies), and more. For example, if you need to sell, the [Messenger receipt template](https://developers.facebook.com/docs/messenger-platform/send-messages/template/receipt/) will be great choice.

### Deploy the experience

To scale your app and make it available for as many user, we may need to deploy the final experience to a cloud hosting service. This experinence is hosted by AWS Elastic beanstalk. Most of the services are similar, and will require just uploads and environment variables.


## License and contribution:

### License

Job Finder bot is [MIT Licensed](https://github.com/khaled-11/job-finder-bot/blob/master/LICENSE).


### How to contribute

This sample App is open for contributions. You can work on improvements for everyone, or customize the App for another use case. You can find more information [here](https://github.com/khaled-11/job-finder-bot/blob/master/CONTRIBUTING.md)

