const mongoose = require('mongoose');

async function connectToDatabase() {
    return mongoose.connect(url);
}

module.exports = {
    connectToMongoDB,
};