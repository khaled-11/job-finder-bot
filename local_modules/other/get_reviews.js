const rp = require('request-promise'),
fs = require("fs"),
unirest = require("unirest");

module.exports = async (name, sender_psid) => {
    try {
        console.log("here")
        var req = unirest("GET", encodeURI(`https://wextractor.com/api/v1/reviews/indeed?id=${name}&auth_token=${process.env.WEX_KEY}&offset=50&country=us`));    
        await req.end(async function (res) {
            if (res.error) {
                console.log(res.error);
            } else {
                console.log("break.............")
                if (res.body && res.body.reviews){
                    fs.writeFile(`./data/${sender_psid}/reviews_${name}.json`, JSON.stringify(res.body.reviews), function(err) {
                        if (err) {
                            console.log(err)
                        }
                        console.log("The file was saved!")
                    })

                    fs.writeFile(`./global/reviews_${name}.json`, JSON.stringify(res.body.reviews), function(err) {
                        if (err) {
                            console.log(err)
                        }
                        console.log("The file was saved!")
                    }) 
                } else{
                    fs.writeFile(`./data/${sender_psid}/reviews_${name}.json`, "null", function(err) {
                        if (err) {
                            console.log(err)
                        }
                        console.log("The file was saved!")
                    })

                    fs.writeFile(`./global/reviews_${name}.json`, "null", function(err) {
                        if (err) {
                            console.log(err)
                        }
                        console.log("The file was saved!")
                    }) 
                }
            }
        });
    } catch (e){
        console.log(e);
    }
    return;
};