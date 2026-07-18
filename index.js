const express = require('express');
const { connectToMongoDB } = require('./connect');
const urlRoutes = require('./routes/url');
const app = express();
const port = 8001;


connectToMongoDB("mongodb://localhost:27017/url_shortner")
.then(() => {
    console.log('Connected to MongoDB');
})

app.use(express.json());

app.use("/url", urlRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 

