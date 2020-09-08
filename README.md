![Open Source](https://badges.frapsoft.com/os/v2/open-source.svg?v=103)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

# Robin | Job Finder Assistant

Facebook Messenger chatbot that help perople find jobs, and provide some help with relevant resources.

# What it does & how we built it

Robin uses the Messenger API with Wit.ai to build on going interactive conversation that help perople find Jobs in the USA. The user's data is stored in AWS DynamoDB, and the matching results was implemented using Google Cutom Search API. We used the user's data to custom search (indeed, youtube, glassdor, and other websites), and the API returns the results in JSON format. We also used other APIs to get Indeed reviews, and companies details. Moreover, the app find and matches mentors based on the user job preference. The recommendation can be based only the job role or with combination of job role and company preference. The function will check the data and decide what to implement. On the other hand, the NLP interaction was built using Wit.ai. We created the intents and entities then trained the App with some possible utterances like :(I need to set reminder for interview on December 1, 2020 | I need review for CVS). The App sends an error message to the user if it detect an intent with out the required entity like: (I need reviews | I have job interview). Some intents are generic and can work with 1,2 or 3 entities like: (I need software engineer job | I need software engineer job in Florida | I need part time software engineer job). It will work with only the job role or with combinations by handling each case in a different way. Finally, we used Messenger One Time Notification to send reminders if the user set a reminder for an interview. The function refresh periodicaly, and it will first check if the user is subscribed or not. If the user is subscribed, it will check the reminders dates. If the date is one day before the current day, it will send Notification with some helpful resources.

# Installation


> **requirement**: Node.js preferred version 13.9.0, AWS Credentials, Google Mail Credentials, and Facebook Page.

We made the wit.ai key & Google Custom search key available for public use, and it is included in the source code.

You can clone the Repo and run it on your local machine using Local Tunnels like Ngrok.

```
git clone https://github.com/khaled-11/robin
cd open-source-edu-bot
npm install -g ngrok
ngrok http 3370
```

## Setup the Envirenment Data:

Next, you need to rename .sample.env file to .env and fill the credentials. These can be found in your developer account after you create Facebook Messenger App. The URL is the your local tunnel domain. The email & pass is setup for Google mail server. Finally, you will need to set up the AWS credentials to use DynamoDB using the command: aws configure


## Install and run the App:

You can install and run the app now.

```
npm install
node index.js
```

## Install and run the App:

This code snippet save the API use by saving review to the local server.

[![API Save](https://techolopia.com/wp-content/uploads/2020/09/code_snippet.jpg)](https://m.me/118754656624049)


## The flow and live link:

You can test the App live using this link: https://m.me/118754656624049

[![API Save](https://techolopia.com/wp-content/uploads/2020/09/flow-1.jpg)](https://m.me/118754656624049)


