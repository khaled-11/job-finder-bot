// Function to handle the Messages
const fs = require("fs"),
callSendAPI = require("./callSendAPI"),
wit = require("./wit"),
updateCheck = require("../database/updateCheck"),
updateLimit = require("../database/update_limit"),
updateUserData = require("../database/update_user_data"),
get_reviews = require("../other/get_reviews");

module.exports = async (sender_psid, webhook_event) => {
  // Get the user data
  data = await updateCheck(sender_psid);

  // If this is an agree for OTN request.
  if (webhook_event === "AGREED"){
    // Send sender effects for all messages
    await senderEffect(sender_psid, app, "mark_seen");
    await senderEffect(sender_psid, app, "typing_on");
    response = { "text":`Thanks, we will send you Reminders & Insights for your scheduled Interviews in Messenger.`,
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Main Menu",
        "payload":"MENU"
      }
    ]};
    action = null;
    state = await callSendAPI(sender_psid, response, action);
  } 
  // If this is the dummy mentor we create
  else if (sender_psid === process.env.MIKE_FB_ID){
    if (webhook_event.message.text === "/exit"){
      // Send reply to confirm and update the database status
      response = { "text":`Ok, now we updated your status. See you again shortly!`};
      action = null;
      state = await callSendAPI(sender_psid, response, action);
      updateUserData (sender_psid, "connection_state" ,`not available`)
    } else if (webhook_event.message.text === "/end"){
      // End the conversation and update the database here
      response = { "text":`Ok, now the conversation is ended! We will notify you when other users request to contact you.`};
      action = null;
      state = await callSendAPI(sender_psid, response, action);
      updateUserData (sender_psid, "connected_with" ,``)
      updateUserData (sender_psid, "connection_state" ,`available`)
      updateUserData (data.Item.connected_with.S, "connected_with" ,``)
      response = { "text":`Mike end the conversation. Now you can communicate with the bot.`};
      action = null;
      state = await callSendAPI(data.Item.connected_with.S, response, action);

    } else if (webhook_event.message.text === "/available") {
      // Send reply to confirm and update the database
      response = { "text":`Welcome back, we will notify you when users request to contact you.`};
      action = null;
      state = await callSendAPI(sender_psid, response, action);
      updateUserData (sender_psid, "connection_state" ,`available`)
    } else {
      // Iif the mentor is connected with a user.
      if (data.Item.connected_with.S !== ""){
        await senderEffect(sender_psid, app, "mark_seen");
        response = { "text":webhook_event.message.text};
        action = null;
        state = await callSendAPI(data.Item.connected_with.S, response, action, null, `${process.env.MIKE_ID}`);
      } else {
        // If no connection and the mentor send message
        response = { "text":`There is not much to do. We will notify you when users ask to connect with you.`};
        action = null;
        state = await callSendAPI(sender_psid, response, action);
      }
    }
  }
  else if (data.Item.connected_with.S !== ""){
    await senderEffect(sender_psid, app, "mark_seen");
    response = { "text":webhook_event.message.text};
    action = null;
    state = await callSendAPI(data.Item.connected_with.S, response, action);
  }
  // If it is a regular message
  else {
    // Send sender effects for all messages
    await senderEffect(sender_psid, app, "mark_seen");
    await senderEffect(sender_psid, app, "typing_on");
    // Get the message from the event and process using Wit.ai
    let received_message = webhook_event.message;
    var nlp = await wit(received_message.text);
    // If the App identify intent
    if ( nlp.intents[0]){
      // Get the intent name to check
      var intent = nlp.intents[0].name;
      // If the intent was user asking for reviews
      if (intent === "reviews"){
        // If there is a company name entity found
        if (nlp.entities['company_name:company_name']){
          name = nlp.entities['company_name:company_name'][0].body;
          // If there is no reviews for this company in the App data
          if (!fs.existsSync(`./global/reviews_${nlp.entities['company_name:company_name'][0].body}.json`)){
            await get_reviews(nlp.entities['company_name:company_name'][0].body, sender_psid);
            await sleep(3000);
            var jsonData = require(`../../data/${sender_psid}/reviews_${name}.json`);
          // If there is data for this company, load it instead of requesting again.
          } else {
            var jsonData = require(`../../global/reviews_${name}.json`);
          }
          // If there is data for this company, send the first entry.
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
          // If there is no data found for this company. 
          else {
            response = { "text":`We can't find data for this company name. Please try a different name.`,
            "quick_replies":[
              {
                "content_type":"text",
                "title":"Main Menu",
                "payload":"MENU"
              }
            ]};
            action = null;
            state = await callSendAPI(sender_psid, response, action);
          }
        }
        // If the intent is reviews, but without the needed entity
        else {
          response = { "text":`Seems you are looking for review. What is the company name?`,
          "quick_replies":[
            {
              "content_type":"text",
              "title":"Main Menu",
              "payload":"MENU"
            }
          ]};
          action = null;
          state = await callSendAPI(sender_psid, response, action);
        }
      }
      // If this is the intent for deleting the data or start over.
      else if (intent === "delete_data"){
        response = { "text":`Are you sure you want to delete all of your data and information?`,
        "quick_replies":[
          {
            "content_type":"text",
            "title":"Yes ✅",
            "payload":"delete_data_yes"
          }, {
            "content_type":"text",
            "title":"No ❌",
            "payload":"delete_data_no"
          }
        ]
      }    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
      }
      // If this is an intent trained to identify the user welcome our App.
      else if (intent === "welcome"){
        data = await updateCheck(sender_psid);
        response = { "text":`Welcome ${data.Item.first_name.S}!\nThis is our main menu.`};  
      action = null;
      state = await callSendAPI(sender_psid, response, action);
      userMenu(sender_psid);
      }
      // This is an intent used to recognize the user want to thank the App.
      else if (intent === "thanks"){
        data = await updateCheck(sender_psid);
        response = { "text":`You are welcome any time ${data.Item.first_name.S}.`,
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
      // If the intent is reminder request fromt the user
      else if (intent === "reminders"){
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
          var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          var new_date = `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()} ,${date.getFullYear()}`;
          response = { "text":`I got the interview date on ${new_date}, is that correct?`,
          "quick_replies":[
            {
              "content_type":"text",
              "title":"Correct ✅",
              "payload":`CONFIONE_${new_date}`
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
      // If the user request information about specific company
      else if (intent === "info"){
        response = { "text":`Do you need information about ${nlp.entities['company_name:company_name'][0].body}`,
        "quick_replies":[
          {
            "content_type":"text",
            "title":"Correct ✅",
            "payload":`COMDAT_${nlp.entities['company_name:company_name'][0].body}`
          }, {
            "content_type":"text",
            "title":"No ❌",
            "payload":"MENU"
          }
        ]
      }    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
      }
      // If the user as for resources related to a job role and company
      else if (intent === "resources"){
        // If there are job role and company name
        if (nlp.entities['job_role:job_role'] && nlp.entities['company_name:company_name']){
          response = { "text":`You need resources about ${nlp.entities['job_role:job_role'][0].body} at ${nlp.entities['company_name:company_name'][0].body}?`,
          "quick_replies":[
            {
              "content_type":"text",
              "title":"Correct ✅",
              "payload":`PRACTICE_${nlp.entities['job_role:job_role'][0].body}_${nlp.entities['company_name:company_name'][0].body}`
            }, {
              "content_type":"text",
              "title":"No ❌",
              "payload":"MENU"
            }
          ]
        }    
        action = null;
        state = await callSendAPI(sender_psid, response, action);

      } 
      // If it is only job role
      else if (nlp.entities['job_role:job_role']){
        response = { "text":`You need resources about ${nlp.entities['job_role:job_role'][0].body}?`,
        "quick_replies":[
          {
            "content_type":"text",
            "title":"Correct ✅",
            "payload":`PRACTICE_${nlp.entities['job_role:job_role'][0].body}`
          }, {
            "content_type":"text",
            "title":"No ❌",
            "payload":"MENU"
          }
        ]
      }    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
      } 
      // If no entities found for this intent
      else {
        response = { "text":`I think you need resources, but I missed the job role.\nEX: I need resources for Graphic Designer Job.`,
        "quick_replies":[
          {
            "content_type":"text",
            "title":"Main Menu",
            "payload":"MENU"
          }
        ]}; 
        action = null;
        state = await callSendAPI(sender_psid, response, action);
      }
    }
    // If the user ask to analyze a job description
    else if (intent === "analyze"){
      data = await updateCheck(sender_psid);
      // If we have the email, will follow up over email
      if (data.Item.email.S === ""){
        response = {"text": "I don't have your email! Please click on your email below to use, then you can ask me again to analyze a job description.",
        "quick_replies":[
          {
          "content_type":"text",
          "title":"Main Menu",
          "payload":"MENU"
          }, {
          "content_type":"user_email"
          }
        ]};
        action = null;
        await callSendAPI(sender_psid, response, action)
      } 
      // If we don't have the email, request the user to add it
      else {
      response = {"text": `I have your email! We will follow up via email shortly!\n'${data.Item.email.S}'`,
        "quick_replies":[
          {
          "content_type":"text",
          "title":"Main Menu",
          "payload":"MENU"
          }
        ]};
        action = null;
        await callSendAPI(sender_psid, response, action)
      }
    } 

    // If the user ask if the bot still remeber the data.
    else if (intent === "remember"){
      var data = await updateCheck(sender_psid);
      var jobs = "";
      for ( i = 1 ; i < data.Item.job_role.L.length ; i++ ){
        jobs += `\n- ${data.Item.job_type.L[i].S} ${data.Item.job_role.L[i].S} in ${data.Item.companies.L[i].S} `
      }
      // IF there is no data
      if (data.Item.job_role.L.length == 1){
        response = { "text":`I don't have any job roles for you as of now!`,
        "quick_replies":[
          {
            "content_type":"text",
            "title":"Main Menu",
            "payload":"MENU"
          }
        ]}    
        action = null;
        state = await callSendAPI(sender_psid, response, action);
      } 
      // If there are data for the user
      else {
        response = { "text":`Of course, I do remember. You were looking for:${jobs}`,
        "quick_replies":[
          {
            "content_type":"text",
            "title":"Main Menu",
            "payload":"MENU"
          },{
            "content_type":"text",
            "title":"Delete Data ❌",
            "payload":"delete_data_yes"
          }
        ]}    
        action = null;
        state = await callSendAPI(sender_psid, response, action);
      }
    }
    // This is the main intent when the user identify the job preferenece
    else if (intent === "job_preference"){
      // If there are location, role, and job type
      if (nlp.entities['state:state'] && nlp.entities['job_role:job_role'] && nlp.entities['job_type:job_type']){
        response = {
          "text": `You are looking for a ${nlp.entities['job_type:job_type'][0].body, nlp.entities['job_role:job_role'][0].body} job in ${nlp.entities['state:state'][0].body} State.\nIs that correct?`, 
          "quick_replies":[
            {
              "content_type":"text",
              "title":"Yes ✅",
              "payload":`job_preference_yes_${nlp.entities['job_role:job_role'][0].body}_${nlp.entities['job_type:job_type'][0].body}_${nlp.entities['state:state'][0].body}`
            }, {
              "content_type":"text",
              "title":"No ❌",
              "payload":"job_preference_no"
            }
          ]
        }    
        action = null;
        state = await callSendAPI(sender_psid, response, action);
      } 
      // If only state and job role
      else if(nlp.entities['state:state'] && nlp.entities['job_role:job_role']){
        response = {
          "text": `You are looking for any type ${nlp.entities['job_role:job_role'][0].body} job in ${nlp.entities['state:state'][0].body} State.\nIs that correct?`, 
          "quick_replies":[
            {
              "content_type":"text",
              "title":"Yes ✅",
              "payload":`job_preference_yes_${nlp.entities['job_role:job_role'][0].body}_all_${nlp.entities['state:state'][0].body}`
            }, {
              "content_type":"text",
              "title":"No ❌",
              "payload":"job_preference_no"
            }
          ]
        }
        action = null;
        state = await callSendAPI(sender_psid, response, action);  
      } 
      // If job role and type only
      else if(nlp.entities['job_role:job_role'] && nlp.entities['job_type:job_type']){
        response = {
          "text": `You are looking for ${nlp.entities['job_type:job_type'][0].body, nlp.entities['job_role:job_role'][0].body} job in the USA.\nIs that correct?`, 
          "quick_replies":[
            {
              "content_type":"text",
              "title":"Yes ✅",
              "payload":`job_preference_yes_${nlp.entities['job_role:job_role'][0].body}_${nlp.entities['job_type:job_type'][0].body}_USA`
            }, {
              "content_type":"text",
              "title":"No ❌",
              "payload":"job_preference_no"
            }
          ]
        }
      } 
      // If job role only.
      else if(nlp.entities['job_role:job_role'] ){
        response = {
          "text": `You are looking for any type ${nlp.entities['job_role:job_role'][0].body} job in the USA.\nIs that correct?`, 
          "quick_replies":[
            {
              "content_type":"text",
              "title":"Yes ✅",
              "payload":`job_preference_yes_${nlp.entities['job_role:job_role'][0].body}_all_USA`
            }, {
              "content_type":"text",
              "title":"No ❌",
              "payload":"job_preference_no"
            }
          ]
        }       
        action = null;
        state = await callSendAPI(sender_psid, response, action);
      } 
      // If no job role
      else {
        response = { "text":`I am sorry, I did not get the Job Role. Please try again!`};
        action = null;
        state = await callSendAPI(sender_psid, response, action);
      }
    }
    // If out of scope intent
    } else {
      response = { "text":`I am sorry, I didn't get that!\nPlease try again.`};
      action = null;
      state = await callSendAPI(sender_psid, response, action);
      userMenu(sender_psid);
    }
  }

  // Funtion for the user Menu
  async function userMenu(sender_psid) {
    elements = [];
    elements[elements.length]={"title": "Opportunity Matchmaking", "subtitle":"Here you find matches with your career preference and companies of interest.", "buttons":[{"type":"postback","payload":"MATCH_MAKING","title":"Let's Go"}]}
    elements[elements.length]={"title": "Find a Mentor", "subtitle":"Need a Metor or Counselor? I will suggest some with related experience.", "buttons":[{"type":"postback","payload":"MENTOR","title":"Let's Go"}]}
    elements[elements.length]={"title": "Reminders & Insights", "subtitle":"I can remind you, and send offer Insights with practice videos for Interviews.", "buttons":[{"type":"postback","payload":"REMINDERS","title":"Let's Go"}]}
    elements[elements.length]={"title": "Analyze Job Description", "subtitle":"Job description is confusing? Send it to me, and I will follow up.", "buttons":[{"type":"postback","payload":"ANALYZE","title":"Let's Go"}]}
    elements[elements.length]={"title": "Get Relevant Information", "subtitle":"Need information or Reviews about a company. I am here to help!", "buttons":[{"type":"postback","payload":"INFO","title":"Let's Go"}]}
    response = {
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"generic",
          "elements": elements
        }
      }};
      action = null;
      state = await callSendAPI(sender_psid, response, action);
  }
    
  // Sleep Funtion to put the App to wait before replying
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // Function to send Sender Effects
  async function senderEffect(sender_psid, app, action_needed){
    try{
      response = null;
      action = action_needed;
      state = await callSendAPI(sender_psid, response, action, app);   
    }
    catch(e){
      throw (e);
    }
    return state;
  }
}