const express = require('express');
const path = require('path');
const { connectToMongoDB } = require('./connect');
const urlRoutes = require('./routes/url');
const Url = require('./models/url'); // Added missing Url model import

const app = express();
const port = 8001;

connectToMongoDB("mongodb://localhost:27017/url_shortner")
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());
app.use("/url", urlRoutes);

// Serve the built React interface in production. During development, Vite
// serves the UI and proxies API requests to this Express server.
app.use(express.static(path.resolve(__dirname, 'dist')));
app.get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'dist/index.html')));

// Dynamic shortId redirect
app.get('/:shortId', async (req, res) => {
  const shortId = req.params.shortId;
  const entry = await Url.findOneAndUpdate(
    { shortId },
    {
      $push: {
        visitHistory: {
          timestamp: Date.now(),
        },
      },
    }
  );

  if (!entry) {
    return res.status(404).send("URL not found");
  }

  return res.redirect(entry.redirectUrl);
}); // Added missing closing bracket

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
