// Function to handle the Postbacks //
const fs = require("fs"),
rp = require("request-promise"),
unirest = require("unirest"),
sendMail = require("../other/mailServer"),
callSendAPI = require("./callSendAPI"),
exists = require("../database/check_data"),
updateCheck = require("../database/updateCheck"),
updateState = require("../database/update_state"),
updateLimit = require("../database/update_limit"),
updateData = require("../database/update_data"),
deleteData = require("../database/delete_data"),
persistent_menu = require("./persistent_menu");

module.exports = async (sender_psid, event) => {
  // Sending Mark Seen and Typing On Actions.
  state = await senderEffect(sender_psid, app, "mark_seen");
  state = await senderEffect(sender_psid, app, "typing_on");

  // Check if the Postback is Quick Reply or Regular Postback
  if (event.postback){
    payload = event.postback.payload;
    console.log(payload + " Postback Received!!");
  } else if (event.message){
    payload = event.message.quick_reply.payload;
    console.log(payload + " Quick_Reply Postback Received!!");
  } else{
    console.log(event + " Internal call Received!!");
  }

  //Handling Payloads with if-else statement
  //If the payload is user start.
  if (payload === 'GET_STARTED') {
    isNew = await exists(sender_psid);
    if (isNew === true){
      data = await updateCheck(sender_psid);
      response = { "text":`Hi ${data.Item.first_name.S} 👋,\nWelcome back! We did not delete your data, and job preference. If you want us to delete your data to start again, please type "Delete my data"`};
      action = null;
      await callSendAPI(sender_psid, response, action);
    } else {
      if (!fs.existsSync(`./data/${sender_psid}`)){
        fs.mkdirSync(`./data/${sender_psid}`);
      }
      data = await updateCheck(sender_psid);
      persistent_menu(sender_psid);
      response = { "text":`Hi ${data.Item.first_name.S} 👋 my name is Robin, it is nice to meet you! \nI can assist you during your job search 🔍. Through the chat, you can find job opportunities that fit with your background and interests, analyze job descriptions, spot keywords, set interview reminders, request key insights and find a mentor or career counselor 👀.`};
      action = null;
      await callSendAPI(sender_psid, response, action);
      response = { "text":`In order to find your perfect job, can you tell me what are your job preferences?\nEx: I am looking for a full time sales manager role in California.`};
      action = null;
      await callSendAPI(sender_psid, response, action);
  }} 

  else if (payload.includes("job_preference_yes")){
    var job_detail = payload.split("_");
    updateData(sender_psid,"job_role",job_detail[3])
    updateData(sender_psid,"job_type",job_detail[4])
    updateData(sender_psid,"job_type",job_detail[5])
    response = { "text":`Nice, your job preference has been set, now I can assist you during your process.\nLets get that job!`};
    action = null;
    await callSendAPI(sender_psid, response, action);
    userMenu(sender_psid);
  }

  else if (payload === "job_preference_no"){
    response = { "text":`No worries, please try again!\nEx: I need a full time sales manager job in California.`};
    action = null;
    await callSendAPI(sender_psid, response, action);
  }

  else if (payload === "delete_data_yes"){
    deleteData(sender_psid);
    fs.rmdirSync(`./data/${sender_psid}`, { recursive: true });
    response = { "text":`Ok, we deleted all of your data and information!\nYou can now start over or exit the conversation.`,
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Start Over",
        "payload":"GET_STARTED"
      }, {
        "content_type":"text",
        "title":"Exit ❌",
        "payload":"EXIT"
      }
    ]};
    action = null;
    state = await callSendAPI(sender_psid, response, action);
  }

  else if (payload === "delete_data_no"){
    response = { "text":`No worries, we did not delete your data!`};
    action = null;
    await callSendAPI(sender_psid, response, action);
    userMenu(sender_psid);
  }

  else if (payload === "EXIT"){
    response = { "text":`Thank you! We wish you the best of luck.\nYou may exit the conversation now.`};
    action = null;
    await callSendAPI(sender_psid, response, action);
  }

  else if (payload.includes("NEXT")){
    var name = payload.substring(5);
    const data = await updateCheck(sender_psid);
    var current = data.Item.review_till.N;
    let jsonData = require(`../../global/reviews_${name}.json`);
    let rate = "";
    for (n = 0 ; n < jsonData[0].rating ; n++){
      rate += "⭐";
    }
    response = { "text":`*Data:* ${jsonData[current].datetime} *Rating:* ${rate} \n*Current/Formal Employee:* ${jsonData[current].reviewer_employee_type}\n*Reviewer Role:* ${jsonData[current].reviewer}\n*Location:* ${jsonData[current].location}\n*Review Text:* ${jsonData[current].text}\n*Link:* ${jsonData[current].url}`,
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
    updateLimit(sender_psid,++current)
  }

  else if (payload.includes("ADD")){
    var name = payload.substring(4);
    var data = await updateCheck(sender_psid);
    var boo = false;
    for(i = 1 ; i < data.Item.companies.L.length ; i++){
      if (data.Item.companies.L[i].S === name)
      boo = true;
    }
    if (boo === true){
      response = { "text":`You already have ${name} in the companies list.`};    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    } else{
      response = { "text":`I added ${name} to the companies list.`};    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
      updateData(sender_psid,"companies",name);
    }
    userMenu(sender_psid);
  }

  else if (payload === "MATCH_MAKING"){
    data = await updateCheck(sender_psid);
    if (data.Item.job_role.L.length == 1){
      response = { "text":"I don't have any job roles right now! You can add by telling me things like:\n'I need full time software engineer job in Florida.'",      
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Main Menu",
          "payload":"MENU"
        }
      ]
      };    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    } else {
      response = { "text":"I found the following results based on your job preference and companies interest:"};    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    }


    if (data.Item.companies.L.length > 3){
      count_1 = 3;
    } else{
      count_1 = data.Item.companies.L.length;
    }

    if (data.Item.job_role.L.length > 3){
      count_2 = 3;
    } else{
      count_2 = data.Item.job_role.L.length;
    }

    if (count_1 != 1){
    for ( i = 1 ; i < count_1 ; i++){
      for ( n = 1 ; n < count_2 ; n++){
        var options = {
          method: 'GET',
          uri: `https://www.googleapis.com/customsearch/v1?key=AIzaSyD6UQ_AMNNAe6C4x0rEbhnS1a8f3psE4S0&cx=afcb88e766228200f&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_type.L[n].S} for ${data.Item.companies.L[i].S}`,
          json: true
        };
        gData = await rp(options);
        response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
        action = null;
        state = await callSendAPI(sender_psid, response, action);
        
        await sleep (200);

        var options = {
          method: 'GET',
          uri: `https://www.googleapis.com/customsearch/v1?key=AIzaSyD6UQ_AMNNAe6C4x0rEbhnS1a8f3psE4S0&cx=eed7a94624d8a8b04&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_type.L[n].S} for ${data.Item.companies.L[i].S}`,
          json: true
        };
        gData = await rp(options);
        response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
        action = null;
        state = await callSendAPI(sender_psid, response, action);

        await sleep (200);

        var options = {
          method: 'GET',
          uri: `https://www.googleapis.com/customsearch/v1?key=AIzaSyD6UQ_AMNNAe6C4x0rEbhnS1a8f3psE4S0&cx=9a6b1ccdd196ef132&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_type.L[n].S} for ${data.Item.companies.L[i].S}`,
          json: true
        };
        gData = await rp(options);
        response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
        action = null;
        state = await callSendAPI(sender_psid, response, action);

        await sleep (200);

        var options = {
          method: 'GET',
          uri: `https://www.googleapis.com/customsearch/v1?key=AIzaSyD6UQ_AMNNAe6C4x0rEbhnS1a8f3psE4S0&cx=abf71f7204207fa66&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_type.L[n].S} for ${data.Item.companies.L[i].S}`,
          json: true
        };
        gData = await rp(options);
        response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
        action = null;
        state = await callSendAPI(sender_psid, response, action);
      }
    }} else{
        for ( n = 1 ; n < count_2 ; n++){
          var options = {
            method: 'GET',
            uri: `https://www.googleapis.com/customsearch/v1?key=AIzaSyD6UQ_AMNNAe6C4x0rEbhnS1a8f3psE4S0&cx=afcb88e766228200f&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_type.L[n].S}`,
            json: true
          };
          gData = await rp(options);
          response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
          action = null;
          state = await callSendAPI(sender_psid, response, action);
          
          await sleep (200);
  
          var options = {
            method: 'GET',
            uri: `https://www.googleapis.com/customsearch/v1?key=AIzaSyD6UQ_AMNNAe6C4x0rEbhnS1a8f3psE4S0&cx=eed7a94624d8a8b04&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_type.L[n].S}`,
            json: true
          };
          gData = await rp(options);
          response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
          action = null;
          state = await callSendAPI(sender_psid, response, action);
  
          await sleep (200);
  
          var options = {
            method: 'GET',
            uri: `https://www.googleapis.com/customsearch/v1?key=AIzaSyD6UQ_AMNNAe6C4x0rEbhnS1a8f3psE4S0&cx=9a6b1ccdd196ef132&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_type.L[n].S}`,
            json: true
          };
          gData = await rp(options);
          response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
          action = null;
          state = await callSendAPI(sender_psid, response, action);
  
          await sleep (200);
  
          var options = {
            method: 'GET',
            uri: `https://www.googleapis.com/customsearch/v1?key=AIzaSyD6UQ_AMNNAe6C4x0rEbhnS1a8f3psE4S0&cx=abf71f7204207fa66&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_type.L[n].S}`,
            json: true
          };
          gData = await rp(options);
          response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
          action = null;
          state = await callSendAPI(sender_psid, response, action);
        }
    }
    if (data.Item.job_role.L.length != 1){
    response = { "text":"That is all what I got for now and based on your job interests.",      
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Main Menu",
        "payload":"MENU"
      }
    ]
    };    
    action = null;
    state = await callSendAPI(sender_psid, response, action);
  }
  }

  else if (payload === "DELETE"){
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

  else if (payload.includes("@")){
    sendMail.sendNotification(`${payload.split(" ")[0]}`, "Email From Robin", "This is just a confirmation!"); 
    updateState (sender_psid, "email" ,`${payload.split(" ")[0]}`)
    response = {"attachment": {
      "type":"template",
      "payload": {
      "template_type":"one_time_notif_req",
      "title":"Keep Me Updated!",
      "payload":"APPROVED"
      }
    }}
    action = null;
    state = await callSendAPI(sender_psid, response, action);
    response = {
      "text": "Thanks for adding your email!\nPlease click Notify Me to receive Notifications on Messenger as well.", 
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Main Menu",
          "payload":"MENU"
        }
      ]
    };
    action = null;
    state = await callSendAPI(sender_psid, response, action);
  }

  else if (payload.includes("CONFIONE")){
    response = {"attachment": {
      "type":"template",
      "payload": {
      "template_type":"one_time_notif_req",
      "title":"Keep Me Updated!",
      "payload":"APPROVED"
      }
    }}
    action = null;
    state = await callSendAPI(sender_psid, response, action);
    date = payload.substring(9);
    updateData(sender_psid,"reminder_date",date)
    updateData(sender_psid,"reminder_info","general")
    response = {"text": `I scheduled a reminder the day before ${date}. Click Notify Me to Receive Notification on Messenger.`,
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

  else if (payload.includes("CONFITWO")){
    response = {"attachment": {
      "type":"template",
      "payload": {
      "template_type":"one_time_notif_req",
      "title":"Keep Me Updated!",
      "payload":"APPROVED"
      }
    }}
    action = null;
    state = await callSendAPI(sender_psid, response, action);
    name = payload.split("_");
    updateData(sender_psid,"reminder_date",name[1])
    updateData(sender_psid,"reminder_info",)
    response = {"text": `I scheduled a reminder the day before ${name[1]} for ${name[2]}. Click Notify Me to Receive Notification on Messenger.`,
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

  else if (payload.includes("confirm2")){
    name = payload.substring(9);
    response = {"text": `I scheduled a reminder the day before ${name}.`,
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

  else if (payload === "REMINDERS"){
    data = await updateCheck(sender_psid);
    if (data.Item.email.S === ""){
      response = {"text": "I don't have your email! Please click on your email to use. Then, you can tell me things like 'I have project manager interview on December 1, 2020', and I will send you reminders and some helpful insights!\nPlease just write the day without 'st', 'rd'. EX: November 1, 2020",
      "quick_replies":[
        {
        "content_type":"text",
        "title":"Main Menu",
        "payload":"MENU"
        }, {
          "content_type":"text",
          "title":"Practice Videos",
          "payload":"PRACTICE"
        }, {
        "content_type":"user_email"
        }
      ]
    };
    action = null;
    await callSendAPI(sender_psid, response, action)
    }else{
    response = {"text": "I can send reminders for your interviews, and helpful Insights. You can tell me things like 'I have project manager interview on December 1st, 2020', and I will send you reminders and some helpful insights!",
      "quick_replies":[
        {
        "content_type":"text",
        "title":"Main Menu",
        "payload":"MENU"
        }, {
          "content_type":"text",
          "title":"Practice Videos",
          "payload":"PRACTICE"
        }
      ]
    };
    action = null;
    await callSendAPI(sender_psid, response, action)
  }
  }

  else if (payload === "INFO"){
    response = {
      "text": "You can ask me things like:\n- Do you have info about 'CVS'?\n- Can you send me reviews for 'UPS'?\n*Also, you can an option below to look for the companies in your list:*",
      "quick_replies":[
          {
            "content_type":"text",
            "title":"Company Info",
            "payload":"COMPANIES"
          }, {
            "content_type":"text",
            "title":"Company Review",
            "payload":"COMPANIES_REVIEW"
          }, {
            "content_type":"text",
            "title":"Main Menu",
            "payload":"MENU"
          }
      ]
    };
    action = null;
    callSendAPI(sender_psid, response, action)
  }

  else if (payload.includes("COMDAT")){
    var name = payload.substring(7);
    console.log(name);
    var req = unirest("GET", "https://crunchbase-crunchbase-v1.p.rapidapi.com/odm-organizations");
    req.query({
      "name": name
    });
    req.headers({
      "x-rapidapi-host": "crunchbase-crunchbase-v1.p.rapidapi.com",
      "x-rapidapi-key": "34b544622amshdab6d00fa033033p1c799djsn5d98203fa191",
      "useQueryString": true
    });
    req.end(async function (res) {
      if (res.error) throw new Error(res.error)
      response = {
        "attachment":{
          "type":"image", 
          "payload":{
            "url":`${res.body.data.items[0].properties.profile_image_url}`, 
            "is_reusable":false
          }
        }
      }
      action = null;
      await callSendAPI(sender_psid, response, action);
      response = {"text": `These are the Data I found for ${name}.\n${res.body.data.items[0].properties.short_description}\n*Location* ${res.body.data.items[0].properties.city_name}, ${res.body.data.items[0].properties.region_name}, ${res.body.data.items[0].properties.country_code}\n*Domain* ${res.body.data.items[0].properties.homepage_url}\n*linkedin* ${res.body.data.items[0].properties.linkedin_url}`,
        "quick_replies":[
          {
          "content_type":"text",
          "title":"Main Menu",
          "payload":"MENU"
          }, {
            "content_type":"text",
            "title":"Add Company",
            "payload":`ADD_${name}`
          }
        ]
      };
      action = null;
      await callSendAPI(sender_psid, response, action)
    });
  }


  else if (payload.includes("COMREV")){
    var name = payload.substring(7);
    if (!fs.existsSync(`./global/reviews_${name}.json`)){
      await get_reviews(name, sender_psid);
      await sleep(3000);
      var jsonData = require(`../../data/${sender_psid}/reviews_${name}.json`);
    } else{
      var jsonData = require(`../../global/reviews_${name}.json`);
    }
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
          "title":"Next Review ⏭️",
          "payload":`NEXT_${name}`
        }
    ]}
    action = null;
    state = await callSendAPI(sender_psid, response, action);
    current = data.Item.review_till.N;
    updateLimit(sender_psid,1)
  }

  else if (payload === "COMPANIES"){
    var data = await updateCheck(sender_psid);
    quick_replies =[];
    if (data.Item.companies.L.length == 1){
      response = {"text": "I don't have any companies in your list right now. When you ask for reviews or information, you can add the company to your list.\n",
      "quick_replies": [{
        "content_type":"text",
        "title":`Main Menu`,
        "payload":"MENU"
      }]
    };
      action = null;
      await callSendAPI(sender_psid, response, action)
    } else{
    for (i = 1 ; i < data.Item.companies.L.length ;i++ ){
      quick_replies[quick_replies.length] = {"content_type":"text","title":`${data.Item.companies.L[i].S}`,"payload":`COMDAT_${data.Item.companies.L[i].S}`,"content_type":"text"};
    }
    quick_replies[quick_replies.length] = {"content_type":"text","title":`Main Menu`,"payload":"MENU"};
    response = {"text": "Please select a company name from your list below.",
    "quick_replies": quick_replies
    };
    action = null;
    await callSendAPI(sender_psid, response, action)
  }}

  else if (payload === "ANALYZE"){
    data = await updateCheck(sender_psid);
    if (data.Item.email.S === ""){
      response = {"text": "I don't have your email! Please click on your email below to use, then you can send me a link to analyze. EX: I need to analyze this job https://yourlink.com",
      "quick_replies":[
        {
        "content_type":"text",
        "title":"Main Menu",
        "payload":"MENU"
        }, {
        "content_type":"user_email"
        }
      ]
    };
    action = null;
    await callSendAPI(sender_psid, response, action)
    }else{
      response = {"text": "You can send me a job description link, and I will email you the analysis and some helpful tips! EX: I need to analyze this job https://yourlink.com",
      "quick_replies":[
        {
        "content_type":"text",
        "title":"Main Menu",
        "payload":"MENU"
        }
      ]
    };
    action = null;
    await callSendAPI(sender_psid, response, action)
  }}







  else if (payload === "MENTOR"){
    data = await updateCheck(sender_psid);
    if (data.Item.job_role.L.length == 1){
      response = { "text":"I don't have any job roles right now! You can add by telling me things like:\n'I need full time software engineer job in Florida.'",      
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Main Menu",
          "payload":"MENU"
        }
      ]
      };    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    } else {
    elements = [];
    response = {"text": "Based on your job search preference, those are mentors with experience in your job interest."};
    action = null;
    await callSendAPI(sender_psid, response, action);
    
    var data = await updateCheck(sender_psid);

    if (data.Item.companies.L.length > 3){
      count_1 = 3;
    } else{
      count_1 = data.Item.companies.L.length;
    }

    if (data.Item.job_role.L.length > 3){
      count_2 = 3;
    } else{
      count_2 = data.Item.job_role.L.length;
    }


    if (data.Item.companies.L.length == 1){
      for ( n = 1 ; n < count_2 ; n++){
   
          elements[elements.length]={"title": "Diego" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/4.png", "subtitle":`Counselor: Great for ${data.Item.job_role.L[n].S} Interviews.`, "default_action": {"type": "web_url","url": `https://youtube.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":"https://youtube.com","title":"Contact"}, {"type":"web_url","url":"https://youtube.com","title":"Profile"}]}
          elements[elements.length]={"title": "Emma" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/3.png", "subtitle":`Counselor: Great for ${data.Item.job_role.L[n].S} Interviews.`, "default_action": {"type": "web_url","url": `https://youtube.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":"https://youtube.com","title":"Contact"}, {"type":"web_url","url":"https://youtube.com","title":"Profile"}]}
        
          elements[elements.length]={"title": "James" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/1.png", "subtitle":`Mentor: Great for ${data.Item.job_role.L[n].S} Interviews.`, "default_action": {"type": "web_url","url": `https://youtube.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":"https://youtube.com","title":"Contact"}, {"type":"web_url","url":"https://youtube.com","title":"Profile"}]}
          elements[elements.length]={"title": "Michelle" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/0.png", "subtitle":`Mentor: Great for ${data.Item.job_role.L[n].S} Interviews.`, "default_action": {"type": "web_url","url": `https://youtube.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":"https://youtube.com","title":"Contact"}, {"type":"web_url","url":"https://youtube.com","title":"Profile"}]}
    }} else {
    for ( i = 1 ; i < count_1 ; i++){
      for ( n = 1 ; n < count_2 ; n++){
        
          elements[elements.length]={"title": "Diego" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/4.png", "subtitle":`Counselor: Great for ${data.Item.job_role.L[n].S} Interviews with ${data.Item.companies.L[i].S}`, "default_action": {"type": "web_url","url": `https://youtube.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":"https://youtube.com","title":"Contact"}, {"type":"web_url","url":"https://youtube.com","title":"Profile"}]}
          elements[elements.length]={"title": "Emma" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/3.png", "subtitle":`Counselor: Great for ${data.Item.job_role.L[n].S} Interviews with ${data.Item.companies.L[i].S}`, "default_action": {"type": "web_url","url": `https://youtube.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":"https://youtube.com","title":"Contact"}, {"type":"web_url","url":"https://youtube.com","title":"Profile"}]}

          elements[elements.length]={"title": "James" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/1.png", "subtitle":`Mentor: Great for ${data.Item.job_role.L[n].S} Interviews with ${data.Item.companies.L[i].S}`, "default_action": {"type": "web_url","url": `https://youtube.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":"https://youtube.com","title":"Contact"}, {"type":"web_url","url":"https://youtube.com","title":"Profile"}]}
          elements[elements.length]={"title": "Michelle" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/0.png", "subtitle":`Mentor: Great for ${data.Item.job_role.L[n].S} Interviews with ${data.Item.companies.L[i].S}`, "default_action": {"type": "web_url","url": `https://youtube.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":"https://youtube.com","title":"Contact"}, {"type":"web_url","url":"https://youtube.com","title":"Profile"}]}
    }}}

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

      response = { "text":"That is all what I got for now and based on your job interests.'",      
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Main Menu",
          "payload":"MENU"
        }
      ]
      };    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    
  }
  }



  else if (payload === "COMPANIES_REVIEW"){
    var data = await updateCheck(sender_psid);
    quick_replies =[];
    if (data.Item.companies.L.length == 1){
      response = {"text": "I don't have any companies in your list right now. When you ask for reviews or information, you can add the company to your list.\n",
      "quick_replies": [{
        "content_type":"text",
        "title":`Main Menu`,
        "payload":"MENU"
      }]
    };
      action = null;
      await callSendAPI(sender_psid, response, action)
    } else{
    for (i = 1 ; i < data.Item.companies.L.length ;i++ ){
      quick_replies[quick_replies.length] = {"content_type":"text","title":`${data.Item.companies.L[i].S}`,"payload":`COMREV_${data.Item.companies.L[i].S}`,"content_type":"text"};
    }
    quick_replies[quick_replies.length] = {"content_type":"text","title":`Main Menu`,"payload":"MENU"};
    response = {"text": "Please select a company name from your list below.",
    "quick_replies": quick_replies
    };
    action = null;
    await callSendAPI(sender_psid, response, action)
    }
  }



  else if (payload.includes("PRACTICE")){
    categories = payload.split("_");
    data = await updateCheck(sender_psid);
    if (data.Item.job_role.L.length == 1){
      response = { "text":"I don't have any job roles right now! You can add by telling me things like:\n'I need full time software engineer job in Florida.'",      
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Main Menu",
          "payload":"MENU"
        }
      ]
      };    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    } else {
    elements = [];
    response = {"text": "These are the resources I found relevant to your job search."};
    action = null;
    await callSendAPI(sender_psid, response, action);
    
    var data = await updateCheck(sender_psid);

    if (data.Item.companies.L.length > 3){
      count_1 = 3;
    } else{
      count_1 = data.Item.companies.L.length;
    }

    if (data.Item.job_role.L.length > 3){
      count_2 = 3;
    } else{
      count_2 = data.Item.job_role.L.length;
    }

    if (data.Item.companies.L.length == 1){
      for ( n = 1 ; n < count_2 ; n++){
        var req = unirest("GET", `https://www.googleapis.com/customsearch/v1?key=AIzaSyD6UQ_AMNNAe6C4x0rEbhnS1a8f3psE4S0&cx=62ab1f4c93443a29d&q=Interview Tips for ${data.Item.job_role.L[n].S} job`);    
        req.end(async function (res) {
        if (res.error) console.log(res.error);
          elements[elements.length]={"title": res.body.items[0].title ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/video.png", "subtitle":res.body.items[0].snippet, "default_action": {"type": "web_url","url": `${res.body.items[0].link}`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":res.body.items[0].link,"title":"Watch on Youtube"}]}
          elements[elements.length]={"title": res.body.items[1].title ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/video.png", "subtitle":res.body.items[1].snippet, "default_action": {"type": "web_url","url": `${res.body.items[1].link}`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":res.body.items[1].link,"title":"Watch on Youtube"}]}
      });
    }} else {
      for ( i = 1 ; i < count_1 ; i++){
        for ( n = 1 ; n < count_2 ; n++){
          var req = unirest("GET", `https://www.googleapis.com/customsearch/v1?key=AIzaSyD6UQ_AMNNAe6C4x0rEbhnS1a8f3psE4S0&cx=62ab1f4c93443a29d&q=Interview Tips for ${data.Item.job_role.L[n].S} job in ${data.Item.companies.L[i].S}`);    
          req.end(async function (res) {
          if (res.error) console.log(res.error);
            elements[elements.length]={"title": res.body.items[0].title ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/video.png", "subtitle":res.body.items[0].snippet, "default_action": {"type": "web_url","url": `${res.body.items[0].link}`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":res.body.items[0].link,"title":"Watch on Youtube"}]}
            elements[elements.length]={"title": res.body.items[1].title ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/video.png", "subtitle":res.body.items[1].snippet, "default_action": {"type": "web_url","url": `${res.body.items[1].link}`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":res.body.items[1].link,"title":"Watch on Youtube"}]}
        });
    }}}
    await sleep(2000)
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
    response = { "text":"That is all what I got for now and based on your job interests.'",      
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Main Menu",
          "payload":"MENU"
        }
      ]
      };    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
  }

    }



  else if (payload === "MENU"){
    elements = [];

    elements[elements.length]={"title": "Opportunity Matchmaking" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/match.png", "subtitle":"Here you find matches with your career preference and companies of interest.", "buttons":[{"type":"postback","payload":"MATCH_MAKING","title":"Let's Go"}]}
    elements[elements.length]={"title": "Find a Mentor" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/Mentor.png", "subtitle":"Need a Metor or Counselor? I will suggest some with related experience.", "buttons":[{"type":"postback","payload":"MENTOR","title":"Let's Go"}]}
    elements[elements.length]={"title": "Reminders & Insights" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/remind.png", "subtitle":"I can remind you, and send offer Insights with practice videos for Interviews.", "buttons":[{"type":"postback","payload":"REMINDERS","title":"Let's Go"}]}
    elements[elements.length]={"title": "Analyze Job Description" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/analyze.png", "subtitle":"Job description is confusing? Send it to me, and I will follow up.", "buttons":[{"type":"postback","payload":"ANALYZE","title":"Let's Go"}]}
    elements[elements.length]={"title": "Get Relevant Information" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/info.png", "subtitle":"Need information or Reviews about a company. I am here to help!", "buttons":[{"type":"postback","payload":"INFO","title":"Let's Go"}]}

      response = {
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"generic",
          "elements": elements
        }
      }
    };
    action = null;
    state = await callSendAPI(sender_psid, response, action);
  }


  // MENU FUNCTION
  async function userMenu(sender_psid) {
    elements = [];

    elements[elements.length]={"title": "Opportunity Matchmaking" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/match.png", "subtitle":"Here you find matches with your career preference and companies of interest.", "buttons":[{"type":"postback","payload":"MATCH_MAKING","title":"Let's Go"}]}
    elements[elements.length]={"title": "Find a Mentor" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/Mentor.png", "subtitle":"Need a Metor or Counselor? I will suggest some with related experience.", "buttons":[{"type":"postback","payload":"MENTOR","title":"Let's Go"}]}
    elements[elements.length]={"title": "Reminders & Insights" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/remind.png", "subtitle":"I can remind you, and send offer Insights with practice videos for Interviews.", "buttons":[{"type":"postback","payload":"REMINDERS","title":"Let's Go"}]}
    elements[elements.length]={"title": "Analyze Job Description" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/analyze.png", "subtitle":"Job description is confusing? Send it to me, and I will follow up.", "buttons":[{"type":"postback","payload":"ANALYZE","title":"Let's Go"}]}
    elements[elements.length]={"title": "Get Relevant Information" ,"image_url":"https://techolopia.com/wp-content/uploads/2020/09/info.png", "subtitle":"Need information or Reviews about a company. I am here to help!", "buttons":[{"type":"postback","payload":"INFO","title":"Let's Go"}]}

      response = {
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"generic",
          "elements": elements
        }
      }
    };
    action = null;
    state = await callSendAPI(sender_psid, response, action);
  }

  // Function to send Sender Effects //
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

  // Sleep Funtion to put the App to wait before replying //
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
