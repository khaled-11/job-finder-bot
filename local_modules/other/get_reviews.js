const rp = require('request-promise'),
fs = require("fs"),
unirest = require("unirest");


module.exports = async (name, sender_psid) => {
    try {
        var req = unirest("GET", "https://wextractor.com/api/v1/reviews/indeed?id=Google&auth_token=ab344233af3d6a707f3c00ff64e22404f5ec0d31&offset=50&country=us");    
        await req.end(async function (res) {
            if (res.error) console.log(res.error);
            await fs.writeFile(`./data/${sender_psid}/reviews_${name}.json`, JSON.stringify(res.body.reviews), function(err) {
                if (err) {
                    return console.log(err)
                }
                console.log("The file was saved!")
            })
            await fs.writeFile(`./global/reviews_${name}.json`, JSON.stringify(res.body.reviews), function(err) {
                if (err) {
                return console.log(err)
                }
                console.log("The file was saved!")
                return;
            })  
        });
    } catch (e){
        console.log(e);
    }
};