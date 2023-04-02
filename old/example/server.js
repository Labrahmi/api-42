/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ylabrahm <ylabrahm@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/03/29 21:17:55 by macbook           #+#    #+#             */
/*   Updated: 2023/04/02 02:40:46 by ylabrahm         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
// 
const { MongoClient, ServerApiVersion } = require("mongodb");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
var url = require("url");
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");
const path = require("path");
const oauth = require("simple-oauth2");
const session = require("express-session");
const axios = require("axios");

// -
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});

app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(__dirname + '/node_modules/socket.io/client-dist/socket.io.js');
});

// Set up view engine
app.use(express.static(__dirname + '/public'));

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

io.on('connection', (socket) => {
  console.log('a user connected');
});

// -

// -
const username = encodeURIComponent("ylabrahm");
const password = encodeURIComponent("jKno5!!#Y85JK7cB");
function generateRandomString(length) {
  return crypto.randomBytes(length).toString("hex");
}
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

let _anonyme_login_colors = [
  "text-red-300",
  "text-blue-300",
  "text-gray-300",
  "text-yello-300",
  "text-slate-300",
  "text-lime-300",
];

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

const UID =
  "u-s4t2ud-73654fe2b860ec16aec83c32f324d0d3b6783f0b94ed7849c0ab557b0fb2b111";
const SECRET =
  "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";
const redURI = "http://localhost:3000/api";
let token = "";

passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: "https://api.intra.42.fr",
      tokenURL: "https://api.intra.42.fr/oauth/token",
      clientID: UID,
      clientSecret: SECRET,
      callbackURL: redURI,
    },
    function (accessToken, refreshToken, profile, cb) {
      token = accessToken;
      return cb(null, profile);
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.use(
  session({
    secret: SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.get(
  "/api",
  passport.authenticate("oauth2", {
    failureRedirect: "/login",
    failureMessage: true,
  }),
  function (req, res) {
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    async function get_me_auth() {
      const response = await axios.get("https://api.intra.42.fr/v2/me", {
        headers,
      });
      let _rdm = generateRandomString(16);
      res.cookie("loggin_state", true);
      res.cookie("_rdm", _rdm);
      async function set_data() {
        try {
          const database = client.db("db_data");
          const collection = database.collection("coll_users");
          const data = await collection.insertOne({
            _rdm: _rdm,
            _name: response.data.displayname,
            _login: response.data.login,
            _login_color: _anonyme_login_colors[getRandomInt(6)],
            _login_id: response.data.id,
            _image_link: response.data.image.link,
            _anonyme_login: "User_" + generateRandomString(4),
            _anonyme_login_color: _anonyme_login_colors[getRandomInt(6)],
            _campus: response.data.campus[0].name,
          });
        } catch {
          res.render("error", { error: "Error wlah ma n3rf" });
        }
      }
      set_data();
      res.redirect("/dashboard");
    }
    get_me_auth();
  }
);

app.get("/login", (req, res) => {
  if (req.cookies._rdm != null) {
    async function get_data() {
      try {
        const database = client.db("db_data");
        const collection = database.collection("coll_users");
        const user_ = await collection
          .find({ _rdm: req.cookies._rdm })
          .toArray();
        if (user_.length == 0) {
          res.render("index", {
            loggin_state: req.cookies.loggin_state,
            _rdm: req.cookies._rdm,
          });
        } else {
          res.redirect("/dashboard");
        }
      } catch {
        res.redirect("/");
      }
    }
    get_data();
  } else {
    res.render("index");
  }
});

app.get("/", (req, res) => {
  if (req.cookies._rmd == null) {
    res.redirect("/login");
  } else {
    res.redirect("/dashboard");
  }
});

app.get("/login/auth", (req, res) => {
  async function get_data() {
    try {
      const database = client.db("db_data");
      const collection = database.collection("coll_users");
      const user_ = await collection.find({ _rdm: req.cookies._rdm }).toArray();
      if (user_.length == 0) {
        let redURI_login =
          "https://api.intra.42.fr/oauth/authorize?client_id=" +
          UID +
          "&redirect_uri=" +
          redURI +
          "&response_type=code";
        res.redirect(redURI_login);
      } else {
        console.log("else");
        res.redirect("/");
      }
    } catch {
      console.log("catch");
      res.redirect("/");
    }
  }
  get_data();
});

app.get("/dashboard", (req, res) => {
  res.redirect("/dashboard/general");
});

app.post("/dashboard/send_message", (req, res) => {
  let prev_url = "";
  prev_url = String(req.headers.referer);
  let sender_display = "";
  let sender_display_color = "";
  let channel = "";

  // -
  async function set_data() {
    try {
      const database = client.db("db_data");
      const coll_messages = database.collection("coll_messages");
      const send_message = await coll_messages.insertOne({
        _message: req.body._message,
        _sender_display: sender_display,
        _sender_display_color: sender_display_color,
        _channel: channel,
        _likes: 0,
        _dislikes: 0,
      });
      res.redirect("back");
    } catch {
      res.render("error", { error: "Error wlah ma n3rf" });
    }
  }
  // -
  async function get_data() {
    try {
      const database = client.db("db_data");
      const collection = database.collection("coll_users");
      const user_ = await collection.find({ _rdm: req.cookies._rdm }).toArray();
      if (user_.length == 0) {
        res.redirect("/");
      } else {
        console.log(user_[0]._login);
        if (prev_url.includes("dashboard/general")) {
          sender_display = user_[0]._login;
          sender_display_color = user_[0]._login_color;
          channel = "/dashboard/general";
        }
        if (prev_url.includes("dashboard/announcement")) {
          sender_display = user_[0]._login;
          sender_display_color = user_[0]._login_color;
          channel = "/dashboard/announcement";
        }
        if (prev_url.includes("dashboard/random")) {
          sender_display = user_[0]._anonyme_login;
          sender_display_color = user_[0]._anonyme_login_color;
          channel = "/dashboard/random";
        }
        set_data();
      }
    } catch {
      console.log("catch");
      res.redirect("/");
    }
  }
  get_data();
  // -
});

app.get("/dashboard/random", (req, res) => {
  async function get_data() {
    try {
      const database = client.db("db_data");
      const coll_users = database.collection("coll_users");
      const coll_messages = database.collection("coll_messages");
      const user_ = await coll_users.find({ _rdm: req.cookies._rdm }).toArray();
      const messages_ = await coll_messages
        .find({ _channel: "/dashboard/random" })
        .toArray();
      if (user_.length == 0) {
        res.redirect("/");
      } else {
        res.render("dashboard", {
          data: messages_,
          user: user_,
          current_page: "random",
        });
      }
    } catch {
      res.redirect("/");
    }
  }
  get_data();
});

app.get("/dashboard/announcement", (req, res) => {
  async function get_data() {
    try {
      const database = client.db("db_data");
      const coll_users = database.collection("coll_users");
      const coll_messages = database.collection("coll_messages");
      const user_ = await coll_users.find({ _rdm: req.cookies._rdm }).toArray();
      const messages_ = await coll_messages
        .find({ _channel: "/dashboard/announcement" })
        .toArray();
      if (user_.length == 0) {
        res.redirect("/");
      } else {
        res.render("dashboard", {
          data: messages_,
          user: user_,
          current_page: "announcement",
        });
      }
    } catch {
      res.redirect("/");
    }
  }
  get_data();
});

app.get("/dashboard/general", (req, res) => {
  async function get_data() {
    try {
      const database = client.db("db_data");
      const coll_users = database.collection("coll_users");
      const coll_messages = database.collection("coll_messages");
      const user_ = await coll_users.find({ _rdm: req.cookies._rdm }).toArray();
      const messages_ = await coll_messages
        .find({ _channel: "/dashboard/general" })
        .toArray();
      if (user_.length == 0) {
        res.redirect("/");
      } else {
        res.render("dashboard", {
          data: messages_,
          user: user_,
          current_page: "general",
        });
      }
    } catch {
      res.redirect("/");
    }
  }
  get_data();
});
