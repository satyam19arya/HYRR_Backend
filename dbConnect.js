const mongoose = require('mongoose');

module.exports = async () => {
    const mongoUri = process.env.DATABASE;
    try{
        mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true }, () => {
            console.log('mongodb connection established')
        });
    }catch(e){
        console.log(e);
        process.exit(1);
    }
};