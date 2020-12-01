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

This chat-bot App uses Wit.ai to understand the user intent and capture some details. Then, the App store the users data in AWS DynamoDB table, so it is scalable. To find matching results and reviews, the App calls Google custom search API and other APIs. Moreover, this App uses Messenger One Time Notification to send reminders to users. I used OTN because these reminders can be outside of the 24 hours frame. Moreover, users can connect and chat with Mentors in the same conversation. The App uses Messenger Personas with messages from mentors to a user. Finally, this App provides a way for users to delete their data or start over.


### Capture details using Wit.ai

We need to capture information like job preference and company name. Also, the dates in the remiders intent to schedule the reminder. This App uses Wit.ai to capture entities in the user inputs and save it in a database. We defined intents and entities then we trained the App with some possible utterances. Some of the utterances like: (I need to set reminder for interview on {December 1, 2020} | I need review for {CVS}). Most of the intents requires entities ("CVS" is entity for "review" intent). The App sends an error message to the user when it detect an intent with out the required entity like: (I need reviews). Some intents can work with 1,2 or 3 entities. Examples can be like: (I need software engineer job | I need software engineer job in Florida). It will work with only the job role or with combinations by handling each case in a different way.

<div align ="center">
  <img width="800" src="https://media.giphy.com/media/824sB4Whn1BDHuiB6Z/giphy.gif">
</div>


### APIs for reviews and search results

After we capture the information, we need to get the required data. This App uses Wextractor API to get Indeed reviews and Crunchbase for the company details. Also, it uses Google cutom search API to cutom search indeed, glassdoor and other websites for job posting. We use the data for this user from the database to cutom search these websites to find matching opportunities. The API send JSON response, then the App format the results and send the response to the user.

<div align ="center">
  <img width="800" src="https://media.giphy.com/media/iUR2ga5rhwJWPM618J/giphy.gif">
</div>


### Messenger One Time Notification for reminders

This App uses Messenger One Time Notification to send reminders to users. After the App capture the date and save it in the database, it check the data and dates every interval. The function will first check if the user asked for notification or not. If the user asked for one, it will check the reminders dates. If the date is one day before the current day, it will send Notification with some helpful resources. This response will use the OTN token we saved in the database. This OTN allow the page to send one message to users in the future outside the 24 hours window frame

<div align ="center">
  <img width="800" src="https://media.giphy.com/media/3YmcLsZbhij5NQVTjN/giphy.gif">
</div>


### Connect users with Mentors in the same conversation

This App uses Messenger personas to connect users with live mentors. We created Messenger persona for mentors with their names and profile pictures. When a user try to connect with a mentor, the App will check the mentor status in the database. If the mentor is available, the App will send the mentor a request to accept the conversation or refuse. If the mentor accept the conversation, the App will notify the user and update the database. Then the app will forward messages between both parties. When the mentor send a message to the user, the App will use the persona ID we created to send the message to the user. The mentor can end the conversation using a special command, or exit the App. When the mentor end the conversation, this will reset the database and make the mentor available.

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

