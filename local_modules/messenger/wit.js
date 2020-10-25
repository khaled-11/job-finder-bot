const {Wit, log} = require('node-wit');

module.exports = async (text) => {

try{
    const client = new Wit({
    accessToken: `${process.env.WIT_KEY}`,
    });
    result = await client.message(text);
}
catch(e){
    console.log(e);
}
return result;
};


