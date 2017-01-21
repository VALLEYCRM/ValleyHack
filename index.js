var express = require("express"),
  stormpath = require("express-stormpath"),
  bodyParser = require("body-parser"),
  MongoClient = require('mongodb').MongoClient,
  mongoose = require("mongoose");
app = express();
require('dotenv').config();
nodemailer = require('nodemailer');
const transportString = `smtps://${process.env.MAIL_ADDRESS}%40gmail.com:${process.env.MAIL_PASS}@smtp.gmail.com`;
const transporter = nodemailer.createTransport(transportString);
console.log(transportString);

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

console.log("HERE I AM!!!", process.env.STORMPATH_API_KEY_ID)
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
  postLogoutRedirectUrl: '/'

}));

var organizationSchema = new mongoose.Schema({
  orgName: String,
  givenName: String,
  surname: String,
  website: String,
});

var Organization = mongoose.model("Organization", organizationSchema);

var customerSchema = new mongoose.Schema({
  custFirstName: String,
  custLastName: String,
  custAddress: String,
  cusEmail: String,
  organization: String,
  clicks: Array,
  lastEmailed: Number,
  nextScheduled:Number,
});

const organizationalDataAlreadyGiven = (req, res, next) => {
  console.log('running middleware!');
  Organization.findOne({
    givenName: req.user.givenName,
    surname: req.user.surname
  }, function(err, Organization) {
    console.log("Organization", Organization);
    if (Organization) {
      res.redirect('/customer' + Organization.orgName)
    } else {
      next();
    }
  })
};



var Customer = mongoose.model("Customer", customerSchema);


app.get("/", function(req, res) {
  res.render("landing");
});

app.post("/getCustomerInfo", stormpath.loginRequired, function(req, res) {
  Organization.findOne({
    givenName: req.user.givenName,
    surname: req.user.surname
  }, function(err, Organization) {
    Customer.find({
      organization: Organization.orgName
    }, function(err, people) {
      res.send(people);
    })
  })
});

app.get("/customer:id", stormpath.loginRequired, function(req, res) {
  res.render("customer", {
    organization: req.params.orgName
  });
});

app.get("/newOrganization", stormpath.loginRequired, organizationalDataAlreadyGiven,function(req, res) {
  res.render("newOrganization");
});

app.post("/newOrganization", stormpath.loginRequired, function(req, res) {
  console.log("MY BODY!!!", req.body);
  var orgName = req.body.orgName;
  var givenName = req.body.givenName;
  var surname = req.body.surname;
  var website = req.body.website;

  var newOrganization = {
    orgName,
    givenName,
    surname,
    website,
  };

  Organization.create(newOrganization, function(err, newlyCreated) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/customer" + orgName);
    }
  });
});

app.post('/logout', (req, res) => {
  console.log('logigin out')
  res.redirect('/');
})

app.post("/newCustomer", stormpath.loginRequired, function(req, res) {
  console.log('JOHNBULLISWRONG!', req.body);
  var custFirstName = req.body.cusFirstName;
  var custLastName = req.body.cusLastName;
  var custAddress = req.body.cusAddress;
  var cusEmail = req.body.cusEmail;
  Organization.findOne({
    givenName: req.user.givenName,
    surname: req.user.surname
  }, function(err, organization) {
    console.log("here is ORG!", organization);
    var newCustomer = {
      custFirstName,
      custLastName,
      custAddress,
      cusEmail,
      organization: organization.orgName
    };
    if (err) {
      console.log(err);
    } else {
      Customer.create(newCustomer, function(err, newlyCreated) {
        if (err) {
          console.log(err);
        } else {
          //res.redirect("/customer" + orgName);
        }
      });

    };

  })
})

app.get("/newEmail", stormpath.loginRequired, function(req, res) {
  Organization.findOne({
    givenName: req.user.givenName,
    surname: req.user.surname
  }, function(err, organization) {
    res.render(("newEmail"), {
      organization,
    })
  })
});

app.post("/newEmail", stormpath.loginRequired, function(req, res) {

  const message = req.body.message;
  const header = req.body.header;
  const people = req.body.people;
  const website = req.body.website;
  console.log(message, header, people);

  for (let i = 0; i < people.length; i++) {

    //check if click are preasent in customer DB
    Customer.find({
      cusEmail: people[i][3]
    }, function(err, person) {
      var clickArray = person[0].clicks;
      var lastEmailed = person[0].lastEmailed;
      var nextScheduled = person[0].nextScheduled;
      var currentMill = (new Date()).getTime();
      var dontEmail = (currentMill - lastEmailed) < 604800000;
      if (!!clickArray.length) {

        var latestTime = clickArray[clickArray.length - 1];
        var milliseconds = latestTime.getTime();

        while (milliseconds < currentMill) {
          milliseconds += 604800000;
        };
        var nextEmail = (new Date(milliseconds));
        // if (nextScheduled-currentMill<604800000){
        //   return;
        // }
        Customer.update({cusEmail: people[i][3]}, {nextScheduled:milliseconds},function(err, response){
          console.log(err,response);
        });

        console.log(latestTime, "<Letest time", nextEmail, "This the next week", people[i][3]);
        var CronJob = require('cron').CronJob;


        var job = new CronJob(nextEmail, function() {


          var mailOptions = {
            from: '"Krishan Arya :busts_in_silhouette:" <dummyacct101390@gmail.com>', // sender address
            to: people[i][3], // list of receivers
            subject: header, // Subject line
            text: `Dear ${people[i][0]}\n` + message, // plaintext body
            html: `Dear ${people[i][0]},<br>` + message + "<br><a href='https://mighty-mountain-31348.herokuapp.com/redirect/" + people[i][3] + "'" + ">Interested</a>", // html body
          };

          transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
              return console.log(error);
            }
            console.log('Message sent: ' + info.response);
            Customer.update({cusEmail: people[i][3]}, {lastEmailed:nextEmail},  function(err,affected) {
              console.log('affected rows %d', affected);
            })
          });
        }, function() {

          console.log("Done");
        }, true)
      } else if(!dontEmail) {

          var mailOptions = {
            from: '"Krishan Arya :busts_in_silhouette:" <dummyacct101390@gmail.com>', // sender address
            to: people[i][3], // list of receivers
            subject: header, // Subject line
            text: `Dear ${people[i][0]}\n` + message, // plaintext body
            html: `Dear ${people[i][0]},<br>` + message + "<br><a href='https://mighty-mountain-31348.herokuapp.com/redirect/" +""+ website +"/"+ people[i][3] + "'" + ">Interested</a>", // html body
          };

          transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
              return console.log(error);
            }
            console.log('Message sent: ' + info.response);
            Customer.update({cusEmail: people[i][3]}, {lastEmailed:currentMill},  function(err,affected) {
              console.log('affected rows %d', affected);
            })
          });
      }
    });

  }

});



app.get('/redirect/*', function(req, res) {
      console.log("visited2");
      var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      var email =  fullUrl.slice(fullUrl.lastIndexOf('/')+1);
      console.log("EMAIL", email,"fu",fullUrl,"website", website);
      time = new Date();
      Customer.update({cusEmail: email}, {$push: {clicks: time}}, function(err, model) {
        console.log(err);
      });
      res.redirect("google.com");
    });

    app.get('*', (req, res) => {
      res.redirect("http://google.com");
      console.log('caught a case!')
      var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
console.log(fullUrl);
      res.redirect('/');
    });

    app.listen(process.env.PORT || 3000, function() {
      console.log("The CRM Server is running");
    });
