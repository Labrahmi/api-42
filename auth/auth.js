/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ylabrahm <ylabrahm@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/03/28 21:30:34 by ylabrahm          #+#    #+#             */
/*   Updated: 2023/03/30 19:19:22 by ylabrahm         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const server = require('express');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2')
const path = require('path');
const oauth = require('simple-oauth2');
const session = require('express-session');
const axios = require('axios');
var url = require('url');

const app = server();

app.listen(3000, () => {
    console.log("Server is runing");
})

app.get('/', (req, res) => {
    const va = path.join(__dirname, 'index.html');
    res.sendFile(va);
});

app.get('/dash', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    var q = url.parse(req.url, true).query;
    var txt = q.my_token;
    // -
    const headers = {
        Authorization: `Bearer ${txt}`,
    };
    async function myfunc(params) {
        const response = await axios.get('https://api.intra.42.fr/v2/accreditations/2', { headers });
        console.log(response.data);
    }
    myfunc();
    // -
    res.end();
});

const UID = 'u-s4t2ud-73654fe2b860ec16aec83c32f324d0d3b6783f0b94ed7849c0ab557b0fb2b111';
const SECRET = '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';
const redURI = 'http://localhost:3000/api';
let my_token = '';

passport.use(new OAuth2Strategy({
    authorizationURL: 'https://api.intra.42.fr',
    tokenURL: 'https://api.intra.42.fr/oauth/token',
    clientID: UID,
    clientSecret: SECRET,
    callbackURL: redURI
},
    function (accessToken, refreshToken, profile, cb) {
        my_token = accessToken;
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
    passport.authenticate('oauth2', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/dash/?my_token=' + my_token);
    });