/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ylabrahm <ylabrahm@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/03/29 21:17:55 by macbook           #+#    #+#             */
/*   Updated: 2023/03/31 01:29:18 by ylabrahm         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
var url = require('url');
// -
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2')
const path = require('path');
const oauth = require('simple-oauth2');
const session = require('express-session');
const axios = require('axios');
// -
const app = express();
app.set("view engine", "ejs");
// -
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
// -
const username = encodeURIComponent("ylabrahm");
const password = encodeURIComponent("jKno5!!#Y85JK7cB");

function generateRandomString(length) {
  return crypto.randomBytes(length).toString("hex");
}

const uri =
  "mongodb+srv://" +
  username +
  ":" +
  password +
  "@cluster0.5xrlhqb.mongodb.net/";
const client = new MongoClient(uri);

app.use(express.urlencoded());
app.use(express.static("public"));
app.use(cookieParser());

const UID = 'u-s4t2ud-73654fe2b860ec16aec83c32f324d0d3b6783f0b94ed7849c0ab557b0fb2b111';
const SECRET = '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';
const redURI = 'http://10.12.6.6:3000/api';
let token = '';

passport.use(new OAuth2Strategy({
  authorizationURL: 'https://api.intra.42.fr',
  tokenURL: 'https://api.intra.42.fr/oauth/token',
  clientID: UID,
  clientSecret: SECRET,
  callbackURL: redURI
},
  function (accessToken, refreshToken, profile, cb) {
    token = accessToken;
    return cb(null, profile);
  }
));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.use(session({
  secret: SECRET,
  resave: false,
  saveUninitialized: false
}));

app.get('/api',
  passport.authenticate('oauth2', { failureRedirect: '/login', failureMessage: true }),
  function (req, res) {
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    async function get_me_auth() {
      const response = await axios.get('https://api.intra.42.fr/v2/me', { headers });
      let _rdm = generateRandomString(16);
      res.cookie("loggin_state", true);
      res.cookie("_rdm", _rdm);
      // -
      async function set_data() {
        try {
          const database = client.db("db_data");
          const collection = database.collection("coll_users");
          const data = await collection.insertOne({
            _rdm: _rdm,
            _name: response.data.displayname,
            _login: response.data.login,
            _login_id: response.data.id,
            _image_link: response.data.image.link,
          });
        } catch {
          res.render("error", { error: "Error wlah ma n3rf" });
        }
      }
      set_data();
      // -
      res.redirect('./');
    }
    get_me_auth();
    // res.redirect('/dash/?token=' + token);
  });

// app.get('/api', (req, res) => {
// var q = url.parse(req.url, true).query;
// var code = q.code;
//   res.render("index", { data: code });
// passport.authenticate('oauth2', { failureRedirect: '/login' }),
// function (req, res) {
//     res.redirect('/api/verify?token=' + token);
// }

// res.cookie("mycookie", "Hello World");
// res.send("Cookie has been set");
// const mycookie = req.cookies.mycookie;
// const x = generateRandomString(16);
// res.render("dashboard", { data: code });
// });

app.get("/", (req, res) => {
  // async function get_data() {
  //   try {
  //     const database = client.db("db_data");
  //     const collection = database.collection("coll_users");
  //     const data = await collection.find().toArray();
  //     res.render("index", { data: data });
  //   } catch {
  //     res.render("error", { error: "can't connect to db server" });
  //   }
  // }
  // get_data();
  if (req.cookies._rdm != null) {
    async function get_data() {
      try {
        const database = client.db("db_data");
        const collection = database.collection("coll_users");
        const user_ = await collection.find({ _rdm: req.cookies._rdm }).toArray();
        res.render("index", {
          loggin_state: req.cookies.loggin_state,
          _rdm: req.cookies._rdm
        });
      } catch {
        res.redirect("./");
      }
    }
    get_data();
  }
  else {
    res.render("index");
  }
});

app.get('/login', (req, res) => {
  async function get_data() {
    try {
      const database = client.db("db_data");
      const collection = database.collection("coll_users");
      const user_ = await collection.find({ _rdm: req.cookies._rdm }).toArray();
      if (user_.length == 0) {
        let redURI_login = 'https://api.intra.42.fr/oauth/authorize?client_id=' + UID + '&redirect_uri=' + redURI + '&response_type=code';
        res.redirect(redURI_login);
      }
      else {
        res.redirect('./');
      }
    } catch {
      res.redirect('./');
    }
  }
  get_data();
  // 
});

// app.post("/post/add", (req, res) => {
//   async function send_data() {
//     try {
//       const database = client.db("db_data");
//       const collection = database.collection("coll_users");
//       const data = await collection.insertOne(req.body);
//       res.redirect('/');
//     } catch {
//       res.render("error", { error: "can't connect to db server" });
//     }
//   }
//   send_data();
// })



