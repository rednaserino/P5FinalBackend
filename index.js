// Import and create the Express application
var express = require('express');
var app = express();

// Initialize sqlite database
const dbFile = "./sqlite.db";
const fs = require("fs");
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// If ./sqlite.db does not exist, create it
db.serialize(() => {
  if (!exists) {
    db.run(
      "CREATE TABLE Users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)"
    );
    console.log("Database was created");
  }
});

// Respond with "Hello World" on the homepage
app.get('/', function (req, res) {
    res.send("hello world")
})

// Respond with a list of all users in the database
app.get('/users', (req, res) => {
    db.all("SELECT * from Users", (err, rows) => {
        res.send(JSON.stringify(rows));
    });
})

// http://localhost:8081/add?name=Tom will add user with name Tom to the database
// Respond with result message
app.get('/add', (req, res) => {
    let name = req.query.name;
    if(name) {
        db.run(`INSERT INTO Users (name) VALUES (?)`, name, error => {
            if (error) {
              res.send({ message: "error!" });
            } else {
                res.send({ message: "added " + name });
            }
        });
    } else {
        res.send({ message: "No user was added, add a name parameter to the url like so: `http://.../add?name=Tom`" });
    }
})

var server = app.listen(8081, function () {
   var port = server.address().port
   
   console.log("Example app listening on port %s", port)
})
