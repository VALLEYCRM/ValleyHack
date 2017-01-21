var express = require("express"),
    stormpath = require("express-stormpath"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose");
    app = express();

var url = "https://api.stormpath.com/v1/applications/3mHE3ZqUCoWAux0gLe4zAT"

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.stormpath(stormpath.init(app, {
  apiKeyFile: '/.stormpath/apiKey.properties',
  apiKeyId: process.env.STORMPATH_API_KEY_D || "key",
  apiKeySecret: process.env.STORMPATH_API_KEY_SECRET || 'secret',
  secretKey: process.env.STORMPATH_SECRET_KEY || "key",
  application: process.env.STORMPATH_URL || "url",
}));

app.listen(process.env.PORT || 3000, function() {
  console.log("The CRM Server is running");
})
