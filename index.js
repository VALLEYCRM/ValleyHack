var express = require("express"),
    stormpath = require("express-stormpath"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose");
    app = express();

console.log("HERE I AM!!!",process.env.STORMPATH_API_KEY_ID)
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(stormpath.init(app, {
  apiKeyFile: '/.stormpath/apiKey.properties',
  apiKeyId: process.env.STORMPATH_API_KEY_ID || "key",
  apiKeySecret: process.env.STORMPATH_API_KEY_SECRET || 'secret',
  secretKey: process.env.STORMPATH_SECRET_KEY || "key",
  application: process.env.STORMPATH_URL || "url",
}));



app.get("/", function(req, res) {
  res.render("landing");
});

app.get("/newOrganization", function(req, res) {
  res.render("newOrganization");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("The CRM Server is running");
})
