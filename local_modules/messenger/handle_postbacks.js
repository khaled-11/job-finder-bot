// Function to handle the Postbacks //
const fs = require("fs"),
rp = require("request-promise"),
unirest = require("unirest"),
sendMail = require("../other/mailServer"),
callSendAPI = require("./callSendAPI"),
exists = require("../database/check_data"),
updateCheck = require("../database/updateCheck"),
updateLimit = require("../database/update_limit"),
updateUserData = require("../database/update_user_data"),
updateJobData = require("../database/update_job_data"),
deleteData = require("../database/delete_data");

module.exports = async (sender_psid, event) => {
  // Sending Mark Seen and Typing On Actions.
  state = await senderEffect(sender_psid, app, "mark_seen");
  state = await senderEffect(sender_psid, app, "typing_on");

  // Check if the Postback is Quick Reply or Regular Postback
  if (event.postback){
    payload = event.postback.payload;
  } else if (event.message){
    payload = event.message.quick_reply.payload;
  } else {
    payload = "GET_STARTED"
  }

  // If the payload the user click get started
  if (payload === 'GET_STARTED') {
    // Check if the user exists
    isOld = await exists(sender_psid);
    // If the user deleted the conversation
    if (isOld === true){
      data = await updateCheck(sender_psid);
      response = { "text":`Hi ${data.Item.first_name.S} 👋,\nWelcome back! We did not delete your data. If you want us to delete your data and start again, please type "Delete my data"`};
      action = null;
      await callSendAPI(sender_psid, response, action);
    } 
    // If it is first entry or after deleting the data
    else {
      if (!fs.existsSync(`./data/${sender_psid}`)){
        fs.mkdirSync(`./data/${sender_psid}`);
      }
      data = await updateCheck(sender_psid);
      response = { "text":`Hi ${data.Item.first_name.S} 👋 I am a job finder bot! I can assist you to find jobs in the USA 🔍. I can also send reminders for job interviews and connect you with mentors 👀.\nIn the menu, you can find other things I can do!`};
      action = null;
      await callSendAPI(sender_psid, response, action);
      response = { "text":`To start, please add a job preference. Can you please tell me what job type are you looking for?\nEx: I am looking for a full time project manager role in California.`};
      action = null;
      await callSendAPI(sender_psid, response, action);
    }
  } 

  // If the user confirm the job preference, update the data
  else if (payload.includes("job_preference_yes")){
    var job_detail = payload.split("_");
    updateJobData(sender_psid,"job_role",job_detail[3])
    updateJobData(sender_psid,"job_type",job_detail[4])
    updateJobData(sender_psid,"job_place",job_detail[5])
    response = { "text":`Nice, your job preference has been set, now I can assist you during your process.\nLets get that job!`};
    action = null;
    await callSendAPI(sender_psid, response, action);
    userMenu(sender_psid);
  }

  // If the user cancel the job preference setup.
  else if (payload === "job_preference_no"){
    response = { "text":`No worries, please try again!\nEx: I need a full time sales manager job in California.`};
    action = null;
    await callSendAPI(sender_psid, response, action);
  }

  // If the user confirm deleting the data
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

  // If the user cancel deleting the data
  else if (payload === "delete_data_no"){
    response = { "text":`No worries, we did not delete your data!`};
    action = null;
    await callSendAPI(sender_psid, response, action);
    userMenu(sender_psid);
  }

  // If the user click exit after deleting the data to avoid requesting the data again.
  else if (payload === "EXIT"){
    response = { "text":`Thank you! We wish you the best of luck.\nYou may exit the conversation now.`};
    action = null;
    await callSendAPI(sender_psid, response, action);
  }

  // If the user click next to see the next review
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
    if (current > 10){
      updateLimit(sender_psid,1)
    } else {
      updateLimit(sender_psid,++current)
    }
  }

  // If the user click add company to the list
  else if (payload.includes("ADD")){
    var name = payload.substring(4);
    var data = await updateCheck(sender_psid);
    var boo = false;
    for(i = 1 ; i < data.Item.companies.L.length ; i++){
      if (data.Item.companies.L[i].S === name)
      boo = true;
    }
    // If the user have the company in the list
    if (boo === true){
      response = { "text":`You already have ${name} in the companies list.`};    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    } 
    // If not, save the company in the list
    else {
      response = { "text":`I added ${name} to the companies list.`};    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
      updateJobData(sender_psid,"companies",name);
    }
    userMenu(sender_psid);
  }

  // If the user want to get the matching jobs
  else if (payload === "MATCH_MAKING"){
    data = await updateCheck(sender_psid);
    // If no job roles.
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
    } 
    // If there is job roles data
    else {
      response = { "text":"I found the following results based on your job preference and companies interest:"};    
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    }
    // Limit the count
    if (data.Item.companies.L.length > 5){
      count_1 = 6;
    } else{
      count_1 = data.Item.companies.L.length;
    }
    if (data.Item.job_role.L.length > 3){
      count_2 = 3;
    } else {
      count_2 = data.Item.job_role.L.length;
    }
    // If no companies, search using google custom search API for roles
    if (data.Item.companies.L.length == 1){
      for ( n = 1 ; n < count_2 ; n++){
        var options = {
          method: 'GET',
          uri: `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_KEY}&cx=afcb88e766228200f&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_place.L[n].S}`,
          json: true
        };
        gData = await rp(options);
        response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
        action = null;
        state = await callSendAPI(sender_psid, response, action);
        await sleep (200);
        var options = {
          method: 'GET',
          uri: `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_KEY}&cx=eed7a94624d8a8b04&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_place.L[n].S}`,
          json: true
        };
        gData = await rp(options);
        response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
        action = null;
        state = await callSendAPI(sender_psid, response, action);
        await sleep (200);
        var options = {
          method: 'GET',
          uri: `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_KEY}&cx=9a6b1ccdd196ef132&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_place.L[n].S}`,
          json: true
        };
        gData = await rp(options);
        response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
        action = null;
        state = await callSendAPI(sender_psid, response, action);
        await sleep (200);
        var options = {
          method: 'GET',
          uri: `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_KEY}&cx=abf71f7204207fa66&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_place.L[n].S}`,
          json: true
        };
        gData = await rp(options);
        response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
        action = null;
        state = await callSendAPI(sender_psid, response, action);
      }
    } 
    // If there are companies in the data
    else {        
      for ( i = 1 ; i < count_1 ; i++){
        for ( n = 1 ; n < count_2 ; n++){  
          var options = {
            method: 'GET',
            uri: `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_KEY}&cx=afcb88e766228200f&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_place.L[n].S} for ${data.Item.companies.L[i].S}`,
            json: true
          };
          gData = await rp(options);
          response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
          action = null;
          state = await callSendAPI(sender_psid, response, action);  
          await sleep (200);
          var options = {
            method: 'GET',
            uri: `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_KEY}&cx=eed7a94624d8a8b04&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_place.L[n].S} for ${data.Item.companies.L[i].S}`,
            json: true
          };
          gData = await rp(options);
          response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
          action = null;
          state = await callSendAPI(sender_psid, response, action);
          await sleep (200);
          var options = {
            method: 'GET',
            uri: `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_KEY}&cx=9a6b1ccdd196ef132&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_place.L[n].S} for ${data.Item.companies.L[i].S}`,
            json: true
          };
          gData = await rp(options);
          response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
          action = null;
          state = await callSendAPI(sender_psid, response, action);
          await sleep (200);
          var options = {
            method: 'GET',
            uri: `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_KEY}&cx=abf71f7204207fa66&q=${data.Item.job_type.L[n].S} ${data.Item.job_role.L[n].S} jobs in ${data.Item.job_place.L[n].S} for ${data.Item.companies.L[i].S}`,
            json: true
          };
          gData = await rp(options);
          response = { "text":`${gData.items[0].title}\nLink: ${gData.items[0].link}`};    
          action = null;
          state = await callSendAPI(sender_psid, response, action);
        }
      }
    }

    // If there are data, send ending message.
    if (data.Item.job_role.L.length != 1){
      response = { "text":"That is all what I got for now and based on your job interests.",      
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

  // If the user add the email address using quick replies
  else if (payload.includes("@")){
    sendMail.sendNotification(`${payload.split(" ")[0]}`, "Email From Job Finder Bot", "This is just a confirmation!"); 
    updateUserData (sender_psid, "email" ,`${payload.split(" ")[0]}`)
    // Send OTN request as well.
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

  // If the user add reminder with date only
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
    updateUserData(sender_psid,"reminder_date",date)
    updateUserData(sender_psid,"reminder_info","general")
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

  // If the user add reminder with date and job role
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
    updateUserData(sender_psid,"reminder_date",name[1])
    updateUserData(sender_psid,"reminder_info", name[2])
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

  // If the user click reminder from the menu
  else if (payload === "REMINDERS"){
    data = await updateCheck(sender_psid);
    // If we don't have the email, will request it.
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
    }
    // If we have the email, replace the options and remove the email field
    else {
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

  // If the user click relevant information from the menu
  else if (payload === "INFO"){
    response = {
      "text": "You can ask me things like:\n- I need information about 'CVS'\n- Can you send me reviews for 'UPS'?\nAlso, you can add any of the companies you asked for to your favorites. This will focus on these companies in the job opportunities search and provide relative mentors.",
      "quick_replies":[
        {
        "content_type":"text",
        "title":"Main Menu",
        "payload":"MENU"
        }
      ]
    };
    action = null;
    callSendAPI(sender_psid, response, action)
  }

  // If the user ask for information about a company and confirm the name
  else if (payload.includes("COMDAT")){
    var name = payload.substring(7);
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
      if (res.body.data && res.body.data.Item && res.body.data.Item[0]){
      // Send the company data to the user
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
      } 
      // If no results
      else {
        response = {"text": "Sorry, we didn't find any matches."}
        action = null;
        await callSendAPI(sender_psid, response, action);
      }
    });
  }

  // If the user click analyze job description for the menu
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

  // If the user click Mentor from the menu.
  else if (payload === "MENTOR"){
    data = await updateCheck(sender_psid);
    // If no job roles in the data
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
    } 
    // If there are job roles data
    else {
      elements = [];
      response = {"text": "Based on your job search preference, those are mentors with experience in your job interest."};
      action = null;
      await callSendAPI(sender_psid, response, action);
      var data = await updateCheck(sender_psid);
      // Limit the loop
      if (data.Item.companies.L.length > 8){
        count_1 = 8;
      } else{
        count_1 = data.Item.companies.L.length;
      }

      if (data.Item.job_role.L.length > 4){
        count_2 = 4;
      } else {
        count_2 = data.Item.job_role.L.length;
      }
      // If there is no companies
      if (data.Item.companies.L.length == 1){
        for ( n = 1 ; n < count_2 ; n++){
            elements[elements.length]={"title": "Mike" ,"image_url":"https://mynameuuy.com/MMM1.png", "subtitle":`Counselor: Great for ${data.Item.job_role.L[n].S} Interviews.`, "default_action": {"type": "web_url","url": `https://techolopia.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"postback","payload":"CONTACT_MIKE","title":"Contact"}, {"type":"web_url","url":"https://techolopia.com","title":"Profile"}]}
            elements[elements.length]={"title": "Lenda" ,"image_url":"https://mynameuuy.com/MMM2.png", "subtitle":`Counselor: Great for ${data.Item.job_role.L[n].S} Interviews.`, "default_action": {"type": "web_url","url": `https://techolopia.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"postback","payload":"CONTACT_LENDA","title":"Contact"}, {"type":"web_url","url":"https://techolopia.com","title":"Profile"}]}
            elements[elements.length]={"title": "Keith" ,"image_url":"https://mynameuuy.com/MMM3.png", "subtitle":`Mentor: Great for ${data.Item.job_role.L[n].S} Interviews.`, "default_action": {"type": "web_url","url": `https://techolopia.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"postback","payload":"CONTACT_JENIFER","title":"Contact"}, {"type":"web_url","url":"https://techolopia.com","title":"Profile"}]}
            elements[elements.length]={"title": "Jenifer" ,"image_url":"https://mynameuuy.com/MMM4.png", "subtitle":`Mentor: Great for ${data.Item.job_role.L[n].S} Interviews.`, "default_action": {"type": "web_url","url": `https://techolopia.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"postback","payload":"CONTACT_KEITH","title":"Contact"}, {"type":"web_url","url":"https://techolopia.com","title":"Profile"}]}
        }
      }
      // If there are companies in the data
      else {
        // If it is only two companies
        if (data.Item.companies.L.length == 2) {
          for ( i = 1 ; i < count_1 ; i++){
            for ( n = 1 ; n < count_2 ; n++){     
                elements[elements.length]={"title": "Mike" ,"image_url":"https://mynameuuy.com/MMM1.png", "subtitle":`Counselor: Great for ${data.Item.job_role.L[n].S} Interviews with ${data.Item.companies.L[i].S}`, "default_action": {"type": "web_url","url": `https://techolopia.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"postback","payload":"CONTACT_MIKE","title":"Contact"}, {"type":"web_url","url":"https://techolopia.com","title":"Profile"}]}
                elements[elements.length]={"title": "Lenda" ,"image_url":"https://mynameuuy.com/MMM2.png", "subtitle":`Counselor: Great for ${data.Item.job_role.L[n].S} Interviews with ${data.Item.companies.L[i].S}`, "default_action": {"type": "web_url","url": `https://techolopia.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"postback","payload":"CONTACT_LENDA","title":"Contact"}, {"type":"web_url","url":"https://techolopia.com","title":"Profile"}]}
                elements[elements.length]={"title": "Keith" , "image_url":"https://mynameuuy.com/MMM3.png", "subtitle":`Counselor: Great for ${data.Item.job_role.L[n].S} Interviews with ${data.Item.companies.L[i].S}`, "default_action": {"type": "web_url","url": `https://techolopia.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"postback","payload":"CONTACT_JENIFER","title":"Contact"}, {"type":"web_url","url":"https://techolopia.com","title":"Profile"}]}
                elements[elements.length]={"title": "Jenifer" ,"image_url":"https://mynameuuy.com/MMM4.png", "subtitle":`Counselor: Great for ${data.Item.job_role.L[n].S} Interviews with ${data.Item.companies.L[i].S}`, "default_action": {"type": "web_url","url": `https://techolopia.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"postback","payload":"CONTACT_KEITH","title":"Contact"}, {"type":"web_url","url":"https://techolopia.com","title":"Profile"}]}
            }
          }
        } 
        // If more than two companies
        else {
          for ( i = 1 ; i < count_1 ; i++){
            for ( n = 1 ; n < count_2 ; n++){     
                elements[elements.length]={"title": "Mike" ,"image_url":"https://mynameuuy.com/MMM1.png", "subtitle":`Counselor: Great for ${data.Item.job_role.L[n].S} Interviews with ${data.Item.companies.L[i].S}`, "default_action": {"type": "web_url","url": `https://techolopia.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"postback","payload":"CONTACT_MIKE","title":"Contact"}, {"type":"web_url","url":"https://techolopia.com","title":"Profile"}]}
                elements[elements.length]={"title": "Lenda" , "image_url":"https://mynameuuy.com/MMM2.png", "subtitle":`Counselor: Great for ${data.Item.job_role.L[n].S} Interviews with ${data.Item.companies.L[i].S}`, "default_action": {"type": "web_url","url": `https://techolopia.com`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"postback","payload":"CONTACT_LENDA","title":"Contact"}, {"type":"web_url","url":"https://techolopia.com","title":"Profile"}]}
            }
          }
        }
      }

      // Shuffle if the list is long.
      newElements = [];
      if (elements.length > 10){
        no = elements.length
        newElements[0] = elements[Math.floor(Math.random() * no)]
        newElements[1] = elements[Math.floor(Math.random() * no)]
        newElements[2] = elements[Math.floor(Math.random() * no)]
        newElements[3] = elements[Math.floor(Math.random() * no)]
        newElements[4] = elements[Math.floor(Math.random() * no)]
        newElements[5] = elements[Math.floor(Math.random() * no)]
        newElements[6] = elements[Math.floor(Math.random() * no)]
        newElements[7] = elements[Math.floor(Math.random() * no)]
        newElements[8] = elements[Math.floor(Math.random() * no)]
        newElements[9] = elements[Math.floor(Math.random() * no)]
      } 
      else {
          newElements = elements
      }
      // Send the response
      response = { 
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"generic",
            "elements": newElements
          }
        }
      }
      action = null;
      state = await callSendAPI(sender_psid, response, action);
      // Send ending message
      response = { "text":"That is all what I got for now and based on your job interests.'",      
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

  // If the user cllick practice resouces
  else if (payload.includes("PRACTICE")){
    categories = payload.split("_");
    data = await updateCheck(sender_psid);
    // If the user need practice resouces with job role and company name
    if (categories[1] && categories[2]){
      var elements = []
      var options = {
        method: 'GET',
        uri: `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_KEY}&cx=62ab1f4c93443a29d&q=Interview Tips for ${categories[1]} job in ${categories[2]}`,
        json: true
      };
      gData = await rp(options);
      for ( p = 0 ; p < gData.items.length ; p++){
        elements[elements.length]={"title": gData.items[p].title ,"image_url":"https://mynameuuy.com/youtube.png", "subtitle":gData.items[p].snippet, "default_action": {"type": "web_url","url": `${gData.items[p].link}`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":gData.items[p].link,"title":"Watch on Youtube"}]}
      }
      await sleep(200)
      if (elements.length > 9){
        elements.length = 9
      }
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
      response = { "text":`That is all what I got for ${categories[1]} in ${categories[2]}`,      
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
    // If the user ask for job role only
    else if (categories[1]) {
      var elements = []
      var options = {
        method: 'GET',
        uri: `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_KEY}&cx=62ab1f4c93443a29d&q=Interview Tips for ${categories[1]}`,
        json: true
      };
      gData = await rp(options);
      for ( p = 0 ; p < gData.items.length ; p++){
        elements[elements.length]={"title": gData.items[p].title ,"image_url":"https://mynameuuy.com/youtube.png", "subtitle":gData.items[p].snippet, "default_action": {"type": "web_url","url": `${gData.items[p].link}`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":gData.items[p].link,"title":"Watch on Youtube"}]}
      }
      await sleep(200)
      if (elements.length > 9){
        elements.length = 9
      }
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
      response = { "text":`That is all what I got for ${categories[1]}`,      
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
    // If the user need only resources or it is from the menu.
    else {
      // If no job roles found in the data
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
      } 
      // If job data were found
      else {
        elements = [];
        response = {"text": "These are the resources I found relevant to your job search."};
        action = null;
        await callSendAPI(sender_psid, response, action);
        await senderEffect(sender_psid, app, "typing_on");
        // Limit the loop
        if (data.Item.companies.L.length > 5){
          count_1 = 5;
        } else {
          count_1 = data.Item.companies.L.length;
        }

        if (data.Item.job_role.L.length > 4){
          count_2 = 4;
        } else {
          count_2 = data.Item.job_role.L.length;
        }
        // If there is no companies
        if (data.Item.companies.L.length == 1){
          for ( n = 1 ; n < count_2 ; n++){
            var options = {
              method: 'GET',
              uri: `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_KEY}&cx=62ab1f4c93443a29d&q=Interview Tips for ${data.Item.job_role.L[n].S} job`,
              json: true
            };
            gData = await rp(options);
            for ( p = 0 ; p < gData.items.length ; p++){
              elements[elements.length]={"title": gData.items[p].title ,"image_url":"https://mynameuuy.com/youtube.png", "subtitle":gData.items[p].snippet, "default_action": {"type": "web_url","url": `${gData.items[p].link}`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":gData.items[p].link,"title":"Watch on Youtube"}]}
            }
          }
          await sleep(200)
        }
        // If there are companies in the data
        else {
          // If it is only two companies
          for ( i = 1 ; i < count_1 ; i++){
            for ( n = 1 ; n < count_2 ; n++){     
              var elements = []
              var options = {
                method: 'GET',
                uri: `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_KEY}&cx=62ab1f4c93443a29d&q=Interview Tips for ${data.Item.job_role.L[n].S} job in ${data.Item.companies.L[i].S}`,
                json: true
              };
              gData = await rp(options);
              for ( p = 0 ; p < gData.items.length ; p++){
                elements[elements.length]={"title": gData.items[p].title ,"image_url":"https://mynameuuy.com/youtube.png", "subtitle":gData.items[p].snippet, "default_action": {"type": "web_url","url": `${gData.items[p].link}`,"messenger_extensions": "true","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":gData.items[p].link,"title":"Watch on Youtube"}]}
              }
            }
          }
          await sleep(200) 
        }
        // Shuffle if the list is long.
        newElements = [];
        if (elements.length > 10){
          no = elements.length
          newElements[0] = elements[Math.floor(Math.random() * no)]
          newElements[1] = elements[Math.floor(Math.random() * no)]
          newElements[2] = elements[Math.floor(Math.random() * no)]
          newElements[3] = elements[Math.floor(Math.random() * no)]
          newElements[4] = elements[Math.floor(Math.random() * no)]
          newElements[5] = elements[Math.floor(Math.random() * no)]
          newElements[6] = elements[Math.floor(Math.random() * no)]
          newElements[7] = elements[Math.floor(Math.random() * no)]
          newElements[8] = elements[Math.floor(Math.random() * no)]
          newElements[9] = elements[Math.floor(Math.random() * no)]
        } 
        else {
            newElements = elements
        }
        // Send the response
        response = { 
          "attachment":{
            "type":"template",
            "payload":{
              "template_type":"generic",
              "elements": newElements
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
  }

  // If the payload in menu  
  else if (payload === "MENU"){
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
      }
    };
    action = null;
    state = await callSendAPI(sender_psid, response, action);
  }    
  
  // If the payload is user asking to connect 
  else if (payload.includes("CONTACT")){
    mentorName = payload.split("_")[1]
    if (mentorName === "MIKE"){
      data = await updateCheck(process.env.MIKE_FB_ID);
      userData = await updateCheck(sender_psid);
      if (data.Item.connected_with.S === ""){
        response = {
          "text":"We send Mike a request. Please wait for a reply."
        };
        action = null;
        state = await callSendAPI(sender_psid, response, action);
        state = await senderEffect(sender_psid, app, "typing_on");
        response = {
          "text":`Mike, ${userData.Item.first_name.S} want to connect.`,
          "quick_replies":[
            {
              "content_type":"text",
              "title":"Connect",
              "payload":`MCON_MIKE_${sender_psid}`
            }, {
              "content_type":"text",
              "title":"Cancel",
              "payload":`CANCON_${sender_psid}`
            }
          ]
        };
        action = null;
        state = await callSendAPI(process.env.MIKE_FB_ID, response, action);
      } else {
        response = {
          "text":"This mentor is not available now. Please try back later."
        };
        action = null;
        state = await callSendAPI(sender_psid, response, action);
      }
    } else {
      response = {
        "text":"This mentor is not available now. Please try back later."
      };
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    }
  }

  // If the Mentor approve the request
  else if (payload.includes("MCON")){
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

  // If the Mentor cancel the request
  else if (payload.includes("CANCON")){
    userID = payload.split("_")[1]
    userData = await updateCheck(userID);     
    response = {
      "text":`${userData.Item.first_name.S}, sorry, Mike isn't available now.`
    };
    action = null;
    state = await callSendAPI(userID, response, action);
    response = {
      "text":`Ok, we canceled the request.`
    };
    action = null;
    state = await callSendAPI(sender_psid, response, action);
  }

  // MENU FUNCTION
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