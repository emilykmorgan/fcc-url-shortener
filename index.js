require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const dns = require('dns');
const urlParser = require('url');
const { url } = require('inspector');

const client = new MongoClient(process.env.CONN_STR);
const db = client.db("fccurlshortenerdb");
const urls = db.collection("urls");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// POST method to post the URL to the Mongo DB
// 'short' URL is the autoincremented primary key of the URL in the database
app.post('/api/shorturl', function(req, res) {
  const urlParam = req.body.url;

  // Check if URL is empty
  if (typeof urlParam == 'undefined') {
    res.json({error: 'invalid url'});
  } else {
    dns.lookup(urlParser.parse(urlParam).hostname, async (err, address) => {
      // Check if URL is valid
      if (!address) {
        res.json({error: 'invalid url'});
      } else {
        const urlCount = await urls.countDocuments({});

        const urlDoc = {
          url: urlParam,
          short_url: urlCount
        };

        const result = await urls.insertOne(urlDoc);

        res.json({ original_url: urlParam, short_url: urlCount });
      }
    });
  }
});

app.get("/api/shorturl/:shortUrl", async function (req, res) {
  const shortUrlParam = req.params.shortUrl;

  const urlDoc = await urls.findOne({short_url: parseInt(shortUrlParam)});

  if (urlDoc.url != null) { 
    res.redirect(urlDoc.url);
  } else {
    res.json({error: 'invalid url'});
  }

});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
