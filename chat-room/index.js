/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   index.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ylabrahm <ylabrahm@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/04/01 23:11:38 by ylabrahm          #+#    #+#             */
/*   Updated: 2023/04/02 09:18:44 by ylabrahm         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// imports
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// down (Data Fetching),   up (Web Sockets)
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
require('dotenv').config();

// Atlas db details:
const username = encodeURIComponent("ylabrahm");
const password = encodeURIComponent("jKno5!!#Y85JK7cB");
const uri = "mongodb+srv://" + username + ":" + password + "@cluster0.5xrlhqb.mongodb.net/";
const client = new MongoClient(uri);

// app settings, enable url encode and a static dir to import media, also cookie setting
app.use(express.urlencoded());
app.use(express.static("public"));
app.use(cookieParser());

// 42 api details:
const UID = process.env._42_UID;
const SECRET = process.env._42_SECRET
const redURI = process.env._42_redURI
let token = "";

// init the PassportJs Strategy
passport.use(
    new OAuth2Strategy(
        {
            authorizationURL: process.env._42_authorizationURL,
            tokenURL: process.env._42_tokenURL,
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

// some necessary config for passport js to work
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

// generateRandomString && getRandomInt
function generateRandomString(length) {
    return crypto.randomBytes(length).toString("hex");
}
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

// anonyme login colors
let _login_colors = [
    "text-red-300",
    "text-blue-300",
    "text-gray-300",
    "text-yello-300",
    "text-slate-300",
    "text-lime-300",
];

// set engine to ejs, so the app can render ejs files to the end-user interface.
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');



// get a _rdm value from a given id
async function get_user_data(id, req, res) {
    try {
        const database = client.db("db_data");
        const collection = database.collection("coll_users");
        const user_ = await collection
            .find({ _login_id: id })
            .toArray();
        if (user_.length != 0) {
            return (user_[0]);
        } else {
            return (null);
        }
    } catch {
        res.redirect("/error");
    }
}

// get a user data from a given _rdm
async function get_user_data_2(_rdm, req, res) {
    try {
        const database = client.db("db_data");
        const collection = database.collection("coll_users");
        const user_ = await collection
            .find({ _rdm: _rdm })
            .toArray();
        if (user_.length != 0) {
            return (user_[0]);
        } else {
            return (null);
        }
    } catch {
        res.redirect("/error");
    }
}

// check the user authentification
async function check_auth(req, res) {
    try {
        const database = client.db("db_data");
        const collection = database.collection("coll_users");
        const user_ = await collection
            .find({ _rdm: req.cookies._rdm })
            .toArray();
        if (user_.length == 0) {
            return (false);
        } else {
            return (true);
        }
    } catch {
        res.redirect("/error");
    }
}

// the first redirect
app.get('/', async (req, res) => {
    res.redirect("/login");
});

// get method on the root directory
app.get('/login', (req, res) => {
    if (req.cookies._rdm == null)
        res.render("login", { api_url: process.env._42_token_auth });
    else {
        check_auth(req, res).then((ret_value) => {
            if (ret_value) {
                res.redirect("/dashboard");
            } else {
                res.render("login", { api_url: process.env._42_token_auth });
            }
        });
    }
});

app.get('/api',
    passport.authenticate("oauth2", {
        failureRedirect: "/error",
        failureMessage: true,
    }),
    function (req, res) {
        const headers = {
            Authorization: `Bearer ${token}`,
        };
        async function _42_auth_function() {
            const _42_response = await axios.get("https://api.intra.42.fr/v2/me", {
                headers,
            });
            get_user_data(_42_response.data.id, req, res).then((ret_value) => {
                if (ret_value != null) {
                    res.cookie("_rdm", ret_value._rdm);
                    res.redirect("/dashboard");
                }
                else {
                    let _rdm = generateRandomString(16);
                    let _name = _42_response.data.displayname;
                    let _login = _42_response.data.login;
                    let _login_color = _login_colors[getRandomInt(5)];
                    let _login_id = _42_response.data.id;
                    let _image_link = _42_response.data.image.link;
                    let _anonyme_login = generateRandomString(4);
                    let _anonyme_login_color = _login_colors[getRandomInt(5)];
                    let _campus = _42_response.data.campus[0].name;
                    let _campus_id = _42_response.data.campus[0].id;
                    res.cookie("_rdm", _rdm);
                    let new_user_data = {
                        _rdm: _rdm,
                        _name: _name,
                        _login: _login,
                        _login_color: _login_color,
                        _login_id: _login_id,
                        _image_link: _image_link,
                        _anonyme_login: _anonyme_login,
                        _anonyme_login_color: _anonyme_login_color,
                        _campus: _campus,
                        _campus_id: _campus_id,
                    }
                    async function set_data(req, res) {
                        try {
                            const database = client.db("db_data");
                            const coll_users = database.collection("coll_users");
                            const add_user = await coll_users.insertOne(new_user_data);
                            return (true);
                        } catch {
                            res.redirect("/error");
                        }
                    }
                    set_data().then(() => {
                        res.redirect("/dashboard");
                    });
                }
            });
        }
        _42_auth_function();
    }
);

app.get("/dashboard", (req, res) => {
    if (req.cookies._rdm == null)
        res.redirect('/login');
    else {
        check_auth(req, res).then((ret_value) => {
            if (ret_value) {
                res.redirect("/dashboard/general");
            } else {
                res.redirect("/login");
            }
        });
    }
});

app.get("/dashboard/general", (req, res) => {
    if (req.cookies._rdm == null)
        res.redirect('/login');
    else {
        check_auth(req, res).then((ret_value) => {
            if (ret_value) {
                async function get_data() {
                    try {
                        const database = client.db("db_data");
                        const coll_messages = database.collection("coll_messages");
                        const get_messages = await coll_messages.find({
                            _channel: "/dashboard/general"
                        }).toArray();
                        return (get_messages);
                    } catch {
                        console.log('catchy');
                    }
                }
                let _old_messages = {};
                get_data().then((msgs_ret_value) => {
                    if (msgs_ret_value) {
                        console.log(msgs_ret_value);
                        res.render("dashboard", {
                            _displayname: "ylabrahm",
                            _campus: "Tetouan",
                            _rdm: req.cookies._rdm,
                            _current_ch: "general",
                            _old_messages: msgs_ret_value,
                        });
                    }
                    else {
                        res.render("dashboard", {
                            _displayname: "ylabrahm",
                            _campus: "Tetouan",
                            _rdm: req.cookies._rdm,
                            _current_ch: "general",
                            _old_messages: _old_messages,
                        });
                    }
                });
            } else {
                res.redirect("/login");
            }
        });
    }
});

app.get("/dashboard/announcement", (req, res) => {
    if (req.cookies._rdm == null)
        res.redirect('/login');
    else {
        check_auth(req, res).then((ret_value) => {
            if (ret_value) {
                res.render("dashboard", {
                    _displayname: "ylabrahm",
                    _campus: "Tetouan",
                    _rdm: req.cookies._rdm,
                    _current_ch: "announcement"
                });
            } else {
                res.redirect("/login");
            }
        });
    }
});

app.get("/dashboard/random", (req, res) => {
    if (req.cookies._rdm == null)
        res.redirect('/login');
    else {
        check_auth(req, res).then((ret_value) => {
            if (ret_value) {
                res.render("dashboard", {
                    _displayname: "ylabrahm",
                    _campus: "Tetouan",
                    _rdm: req.cookies._rdm,
                    _current_ch: "random"
                });
            } else {
                res.redirect("/login");
            }
        });
    }
});

app.get("/error", (req, res) => {
    res.send("Server Error");
});

io.on('connection', (socket) => {
    // console.log('new user connected');
    socket.on("client/dashboard/general", (msg) => {
        try {
            console.log(msg);
            if (msg._message.length <= 1000) {
                let _rdm = msg._rdm;
                get_user_data_2(_rdm).then((ret_value) => {
                    if (ret_value != null) {
                        // console.log(ret_value);
                        let message_obj = {
                            _message: msg._message,
                            _sender_display: ret_value._login,
                            _sender_display_color: ret_value._login_color,
                            _channel: msg._channel,
                            _likes: 0,
                            _dislikes: 0,
                            _time: msg._time,
                            _rdm: msg._rdm,
                        }
                        async function set_data() {
                            try {
                                const database = client.db("db_data");
                                const coll_messages = database.collection("coll_messages");
                                const add_messages = await coll_messages.insertOne(message_obj);
                                return (true);
                            } catch {
                                console.log('catchy');
                            }
                        }
                        set_data().then((s_ret_value) => {
                            if (s_ret_value) {
                                io.emit('server/dashboard/general', message_obj);
                            }
                        });
                    }
                })
            }
        } catch {
            console.log("fuck off");
        }
    });
    socket.on("client/dashboard/announcement", (msg) => {
        console.log(msg);
        io.emit('server/dashboard/announcement', msg);
    });
    socket.on("client/dashboard/random", (msg) => {
        console.log(msg);
        io.emit('server/dashboard/random', msg);
    });
});


server.listen(3000, () => {
    console.log('listening on http://10.12.6.6:3000/');
});
