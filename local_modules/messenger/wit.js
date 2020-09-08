const {Wit, log} = require('node-wit');

module.exports = async (text) => {

try{
    const client = new Wit({
    accessToken: "VWRCIEKP5RH3OD7FEU2GREK5X2NG46AY",
    });
    result = await client.message(text);
}
catch(e){
    console.log(e);
}
return result;
};


