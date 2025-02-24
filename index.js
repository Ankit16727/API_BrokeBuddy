// Cyclic url - https://shy-rose-kit.cyclic.app
const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const userService = require("./user-service.js");
const jwt = require('jsonwebtoken');
const passport = require("passport");
const passportJWT = require("passport-jwt");

const HTTP_PORT = process.env.PORT || 3000;


const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');


const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': "678cd49a4e07440022e67b48",
      'PLAID-SECRET': "a05da13dff7b18efef3013e94fc72d",
    },
  },
});

const plaidClient = new PlaidApi(configuration)





// JSON Web Token Setup
let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;

// Configure its options
let jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
  secretOrKey: process.env.JWT_SECRET,
};

// IMPORTANT - this secret should be a long, unguessable string
// (ideally stored in a "protected storage" area on the web server).
// We suggest that you generate a random 50-character string
// using the following online tool:
// https://lastpass.com/generatepassword.php

let strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    console.log('payload received', jwt_payload);

    if (jwt_payload) {
        // The following will ensure that all routes using 
        // passport.authenticate have a req.user._id, req.user.userName, req.user.fullName & req.user.role values 
        // that matches the request payload data
        next(null, { _id: jwt_payload._id, 
            userName: jwt_payload.userName, 
             }); 
    } else {
        next(null, false);
    }
});

// tell passport to use our "strategy"
passport.use(strategy);

// add passport as application-level middleware
app.use(passport.initialize());





app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.json({ msg: "Hello" });
});


app.post("/api/user/register", (req, res) => {
    userService.registerUser(req.body)
    .then((msg) => {
        res.json({ "message": msg });
    }).catch((msg) => {
        res.status(422).json({ "message": msg });
    });
});

app.post("/api/user/login", (req, res) => {
    userService.checkUser(req.body)
    .then((user) => {
        let payload = { 
            _id: user._id,
            userName: user.email_phone
        };
        
        let token = jwt.sign(payload, process.env.JWT_SECRET);
        res.json({ "message": "login successful", "token" : token});
    }).catch(msg => {
        res.status(422).json({ "message": msg });
    });
});


// Creating the token
app.post('/api/user/create_link_token', async function (request, response) {
    // Get the client_user_id by searching for the current user
    const clientUserId = user.id;
    const plaidRequest = {
      user: {
        // This should correspond to a unique id for the current user.
        client_user_id: 'user',
      },
      client_name: 'Plaid Test App',
      products: ['auth'],
      language: 'en',
      redirect_uri: 'https://localhost:3000/',
      country_codes: ['US'],
    };
    try {
      const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
      response.json(createTokenResponse.data);
    } catch (error) {
      // handle error
      response.status(500).send("Failure")
    }

  });


userService.connect()
.then(() => {
    app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
})
.catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
});