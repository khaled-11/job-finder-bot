![Open Source](https://badges.frapsoft.com/os/v2/open-source.svg?v=103)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Job Finder Bot

<div align ="center">
<img width="200" height="200" src="https://techolopia.com/wp-content/uploads/2020/10/profile-1.jpg">
<br>
</div>
<br>

Every organization can offer their services through a smart chatbot Application. This will increase the productivity and provide a better support for their customers. Users won't need to download a special App to use these services or to access their accounts. For example, a restaurant can offer a delivery service from a Messenger App. The user can see the menu, and complete the order. Also, the App can encrypt and store the order history, the payment method, and other details. Last month, I built an App that help people find job on Messenger. This App help users with job recommendations, and connect users with mentors. Moreover, it can provide practice resources or send interview notifications. Finally, it can find reviews or information about a specific company. The user can add these companies to the job search preference data to focus only on these companies. In this tutorial, I will explain how I built this App and how developers can build similar experience.

## What it does & How I built it

This App help people find jobs in the USA and connect them with Mentors on Messenger. The App uses Wit.ai to understand the user intent and capture the job preference. It stores the users data in AWS DynamoDB table, so it is scalable. To find job recommendations, the App uses Google Custom Search API. This API can search websites, and return the results in JSON format. Also, this App uses other APIs to get Indeed reviews and the company details. Moreover, the app find and matches users with mentors based on the user job preference data. It can recommend mentors based on the job position only or job position and a company name. The App will check the user data and match based on what it finds. For Wit.ai App, I created intents and entities then I trained the App with some possible utterances. Some of the utterances are like: (I need to set reminder for interview on {December 1, 2020} | I need review for {CVS}). Most of the intents requires entities ("CVS" is entity for "review" intent). The App sends an error message to the user if it detect an intent with out the required entity like: (I need reviews). Some intents can work with 1,2 or 3 entities. Examples can be like: (I need software engineer job | I need software engineer job in Florida). It will work with only the job role or with combinations by handling each case in a different way. Finally, This App uses Messenger One Time Notification to send reminders to users. Also, it will notify the user over email as well. The user can set a reminder for a job interview, and the App will remind the user with some helpful review topics. This function refresh everyday, and it will first check if the user asked for notification or not. If the user asked for one, it will check the reminders dates. If the date is one day before the current day, it will send Notification with some helpful resources. 

# Installation


> **requirement**: Node.js preferred version 13.9.0, AWS Credentials, Google Mail Credentials, and Facebook Page.

We made the wit.ai key & Google Custom search key available for public use, and it is included in the source code.

You can clone the Repo and run it on your local machine using Local Tunnels like Ngrok.

```
git clone https://github.com/khaled-11/robin
cd robin
npm install -g ngrok
ngrok http 3370
```

## Setup the Envirenment Data:

Next, you need to rename .sample.env file to .env and fill the credentials. These can be found in your developer account after you create Facebook Messenger App. The URL is the your local tunnel domain. The email & pass for Google mail server, you can change the mailing server if preferred. Finally, you will need to set up the AWS credentials to use DynamoDB with the command: aws configure


## Install and run the App:

You can install and run the app now.

```
npm install
node index.js
```

## Save the API:

This code snippet limit the API usage by saving new companies reviews to the local server. It will check if we have the reviews in the the global data folder first. If not, it will request from the API and save it for the next time.

[![API Save](https://techolopia.com/wp-content/uploads/2020/09/code_snippet.jpg)](https://m.me/118754656624049)


## Live link:

You can test the App live using this link: https://m.me/118754656624049


