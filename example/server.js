/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: macbook <macbook@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/03/29 21:17:55 by macbook           #+#    #+#             */
/*   Updated: 2023/03/30 03:09:48 by macbook          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const username = encodeURIComponent("ylabrahm");
const password = encodeURIComponent("jKno5!!#Y85JK7cB");

const app = express();
app.set("view engine", "ejs");

const uri =
  "mongodb+srv://" +
  username +
  ":" +
  password +
  "@cluster0.5xrlhqb.mongodb.net/";
const client = new MongoClient(uri);

app.use(express.urlencoded());

app.get("/", (req, res) => {
  async function get_data() {
    try {
      const database = client.db("db_data");
      const collection = database.collection("coll_users");
      const data = await collection.find().toArray();
      res.render("index", { data: data });
    } catch {
      res.render("error", { error: "can't connect to db server" });
    }
  }
  get_data();
});

app.post("/post/add", (req, res) => {
  async function send_data() {
    try {
      const database = client.db("db_data");
      const collection = database.collection("coll_users");
      const data = await collection.insertOne(req.body);
      res.redirect('/');
    } catch {
      res.render("error", { error: "can't connect to db server" });
    }
  }
  send_data();
})

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
