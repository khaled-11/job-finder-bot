// Function to handle the Messages //
const fs = require("fs"),
callSendAPI = require("./callSendAPI"),
wit = require("./wit"),
updateCheck = require("../database/updateCheck"),
get_reviews = require("../other/get_reviews");

module.exports = async (sender_psid, webhook_event) => {
  
  data = await updateCheck(sender_psid);
  await senderEffect(sender_psid, app, "mark_seen");
  await senderEffect(sender_psid, app, "typing_on");

  if (webhook_event === "AGREED"){
    response = { "text":`Thanks, we will send you Reminders & Insights for your scheduled Interviews in Messenger.`};
    action = null;
    state = await callSendAPI(sender_psid, response, action);
    //userMenu(sender_psid);
  }else{
  let received_message = webhook_event.message;

  var nlp = await wit(received_message.text);
  console.log(nlp);
  if ( nlp.intents[0]){
  var intent = nlp.intents[0].name;

  if (intent === "reviews"){
    if (nlp.entities['company_name:company_name']){
      name = nlp.entities['company_name:company_name'][0].body;
      if (!fs.existsSync(`./global/reviews_${nlp.entities['company_name:company_name'][0].body}.json`)){
        await get_reviews(nlp.entities['company_name:company_name'][0].body, sender_psid);
       
        await sleep(3000);
        var jsonData = require(`../../data/${sender_psid}/reviews_${name}.json`);
      } else{
        var jsonData = require(`../../global/reviews_${name}.json`);
      }
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
      } else {
        response = { "text":`We can't find data for this company name.`};
        action = null;
        state = await callSendAPI(sender_psid, response, action);
      }

    } else{
      response = { "text":`Seems you are looking for review. What is the company name?`};
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    }
  }

  // Delete Data Intent
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

    // Delete Data Intent
    else if (intent === "welcome"){
      data = await updateCheck(sender_psid);
      response = { "text":`Welcome ${data.Item.first_name.S}!\nThis is our main menu.`};  
    action = null;
    state = await callSendAPI(sender_psid, response, action);
    userMenu(sender_psid);
    }


    // Delete Data Intent
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


    // Delete Data Intent
    else if (intent === "reminders"){
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
    } else if (nlp.entities['wit$datetime:datetime']){
      console.log(nlp.entities['wit$datetime:datetime'][0])
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
    } else{
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
    }}

  // Delete Data Intent
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

  // Delete Data Intent
  else if (intent === "resources"){
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
  } else if (nlp.entities['job_role:job_role']){
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
  } else{
    response = { "text":`I think you need resources, but I missed the job role.\nEX: I need resources for Graphic Designer Job.`};  
  action = null;
  state = await callSendAPI(sender_psid, response, action);
  }
}

  // Analyze Description Intent
  else if (intent === "analyze"){
    data = await updateCheck(sender_psid);
    if (data.Item.email.S === ""){
      response = {"text": "I don't have your email! Please click on your email below to use, then you can ask me again to analyze a job description.",
      "quick_replies":[
        {
        "content_type":"text",
        "title":"Main Menu",
        "payload":"MENU"
        }, {
        "content_type":"user_email",
        "payload":"HJJ"
        }
      ]
    };
    action = null;
    await callSendAPI(sender_psid, response, action)
    }else{
    response = {"text": `I have your email! We will follow up via email shortly!\n'${data.Item.email.S}'`,
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
  }
}

  // Recall Data
  else if (intent === "remember"){
    var data = await updateCheck(sender_psid);
    var jobs = "";
    for ( i = 1 ; i < data.Item.job_role.L.length ; i++ ){
      jobs += `\n- ${data.Item.job_type.L[i].S} ${data.Item.job_role.L[i].S} in ${data.Item.companies.L[i].S} `
    }
    if(data.Item.job_role.L.length == 1){
      response = { "text":`I don't have any job roles for you as of now!`,
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Main Menu",
          "payload":"MENU"
        }
      ]
    }    
    action = null;
    state = await callSendAPI(sender_psid, response, action);
    } else {
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
    ]
  }    
  action = null;
  state = await callSendAPI(sender_psid, response, action);
  }}


  // Job Preference Intent
  else if (intent === "job_preference"){
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
    } else if(nlp.entities['state:state'] && nlp.entities['job_role:job_role']){
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
    } else if(nlp.entities['job_role:job_role'] && nlp.entities['job_type:job_type']){
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
    } else if(nlp.entities['state:state'] && nlp.entities['job_type:job_type']){
      response = { "text":`I am sorry, I did not get the Job Role. Please try again!`};
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    } else if(nlp.entities['job_role:job_role'] ){
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
    } else if(nlp.entities['job_type:job_type']){
      response = { "text":`I am sorry, I did not get the Job Role. Please try again!`};
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    } else if(nlp.entities['state:state']){
      response = { "text":`I am sorry, I did not get the Job Role. Please try again!`};
      action = null;
      state = await callSendAPI(sender_psid, response, action);
    }
  }
  // Undefined
  } else{
    response = { "text":`I am sorry, I didn't get that!\nPlease try again.`};
    action = null;
    state = await callSendAPI(sender_psid, response, action);
    userMenu(sender_psid);
  }
}





  // Funtion for the user Menu //
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
    
  // Sleep Funtion to put the App to wait before replying //
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
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

}