var express = require("express"),
    stormpath = require("express-stormpath"),
    bodyParser = require("body-parser"),
    MongoClient = require('mongodb').MongoClient,
    mongoose = require("mongoose");
    app = express();

    mongoose.Promise = require('bluebird');

    let URL = "mongodb://heroku_j1647s3l:tkmie8pbencj50ljm1d688h87e@ds117919.mlab.com:17919/heroku_j1647s3l";



    MongoClient.connect(URL, function(err, db) {
     if (err) {
       URL = 'mongodb://localhost:27017/mydatabase';
     } else {
       URL = process.env.URL;
     }
     db.close();
    });
    mongoose.connect(URL);

console.log("HERE I AM!!!",process.env.STORMPATH_API_KEY_ID)
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));
app.use(stormpath.init(app, {
  apiKeyFile: '/.stormpath/apiKey.properties',
  apiKeyId: process.env.STORMPATH_API_KEY_ID || "key",
  apiKeySecret: process.env.STORMPATH_API_KEY_SECRET || 'secret',
  secretKey: process.env.STORMPATH_SECRET_KEY || "key",
  application: process.env.STORMPATH_URL || "url",
}));

var organizationSchema = new mongoose.Schema({
  orgName : String,
  givenName : String,
  surname : String,
});

var Organization = mongoose.model("Organization", organizationSchema);

var customerSchema = new mongoose.Schema({
  custFirstName : String,
  custLastName : String,
  custAddress : String,
  cusEmail : String,
});

const organizationalDataAlreadyGiven =(req,res,next)=>{

  Organization.findOne({givenName:req.user.givenName,surname:req.user.surname}, function(err, Organization) {

    if (Organization) {
        res.redirect('/customer'+Organization.orgName)
    } else {
      next();
    }
})
};



var Customer = mongoose.model("Customer", customerSchema);


app.get("/", function(req, res) {
  res.render("landing");
});

app.get("/customer:id", stormpath.loginRequired, function(req, res) {
    res.render("customer", {organization: req.params.orgName});
});

app.get("/newOrganization",stormpath.loginRequired, function(req, res) {
  res.render("newOrganization");
});

app.post("/newOrganization", stormpath.loginRequired, organizationalDataAlreadyGiven, function(req, res) {
  console.log("MY BODY!!!", req.body);
  var orgName = req.body.orgName;
  var givenName = req.body.givenName;
  var surname = req.body.surname;
  var newOrganization = {orgName: orgName, givenName: givenName, surname: surname};

  Organization.create(newOrganization, function(err, newlyCreated) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/customer" + orgName);
    }
  });
});


app.post("/newCustomer", stormpath.loginRequired, function(req, res) {
  console.log('JOHNBULLISWRONG!', req.user);
  var custFirstName = req.body.custFirstName;
  var custLastName = req.body.custLastName;
  var custAddress = req.body.custAddress;
  var cusEmail = req.body.cusEmail;
  Organization.findOne({givenName:req.user.givenName,surname:req.user.surname}, function(err, Organization) {
    console.log("here is ORG!", Organization);
    var newCustomer = {custFirstName, custLastName, custAddress, cusEmail,};
    if (err) {
      console.log(err);
    } else {
      Customer.create(newCustomer, function(err, newlyCreated) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/customer" + orgName);
        }
      });

  };

})
})

app.listen(process.env.PORT || 3000, function() {
  console.log("The CRM Server is running");
});
