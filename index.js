// Creëer Express applicatie
var express = require('express');
var app = express();
const path = require('path');

// Initialiseer de database
const dbFile = path.join('./sqlite.db');
const fs = require('fs');
//fs.unlinkSync(dbFile); // uncomment deze lijn tijdelijk als je de database wilt verwijderen
const exists = fs.existsSync(dbFile);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbFile);

// Creëer de database tabellen
// Goede bron voor SQLite naslag: https://www.sqlitetutorial.net/
db.serialize(() => {
  if (!exists) {
    db.run('CREATE TABLE Users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);');
    db.run(
      'CREATE TABLE Notes (id INTEGER PRIMARY KEY AUTOINCREMENT, category INTEGER, content TEXT, userId INTEGER, FOREIGN KEY(userId) REFERENCES Users(id));'
    );
  }
});

// Nodig om de json data van o.a. POST requests te processen
// De json data van een request is de vinden in het veld req.body
app.use(express.json());

// Sta externe communicatie toe
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*'); // heeft te maken met HTTP headers (indien geïnteresseerd kan je dit nalezen op https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers)
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

// Voorbeeld van een html response met Express (ter illustratie)
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

// Antwoord met een lijst van alle gebruikers
app.get('/users', (req, res) => {
  db.all('SELECT * from Users', (err, rows) => {
    if (err) {
      res.send({ error: err });
      return;
    }
    res.send(JSON.stringify(rows));
  });
});

// Voeg een gebruiker toe aan de database

app.post('/users', (req, res) => {
  // /users url in plaats van /add (1 URL kan meerdere methodes beantwoorden)
  // controleer of de name parameter is meegegeven
  let name = req.body.name; // POST data zit in de HTTP body (en dus niet in de url parameters)
  if (!name) {
    res.send({ error: 'No name argument found' });
    return;
  }

  db.all(`SELECT name from Users WHERE name Like (?)`, name, (err, rows) => {
    // return eventuele errors
    if (err) {
      res.send({ error: err });
      return;
    }
    if (rows.length > 0) {
      res.send({ error: 'User already exists' });
      return;
    }

    db.run(`INSERT INTO Users (name) VALUES (?)`, name, (error) => {
      if (error) {
        res.send({ error: error });
        return;
      }
      res.send({ success: `Successfully added ${name}` });
    });
  });
});

// Voeg een notitie toe
app.post('/notes', (req, res) => {
  // controleer of de parameters meegegeven zijn
  let userId = req.body.userId; // POST data zit in de HTTP body (en dus niet in de url parameters)
  let content = req.body.content;
  let category = req.body.category;

  if (!userId || !content) {
    res.send({ error: 'Parameters userId and content are required' });
    return;
  }

  // haal alle notities van de gebruiker op
  db.run(`INSERT INTO Notes(content, userId, category) VALUES(?, ?, ?)`, [content, userId, category], (err) => {
    if (err) {
      res.send({ error: err });
      return;
    }
    res.send({ success: 'Inserted note' });
  });
});

// Verwijder een notitie
app.delete('/notes', (req, res) => {
  let userId = req.query.userId;
  let noteId = req.query.noteId;
  if (!userId || !noteId) {
    res.send({ error: 'Parameters are required' });
    return;
  }
  db.run(`DELETE FROM Notes WHERE userId=(?) AND id=(?)`, [userId, noteId], (err) => {
    if (err) {
      res.send({ error: err });
      return;
    }
    res.send({ success: 'Note deleted' });
  });
});

// Bewerk een notitie
app.put('/notes', (req, res) => {
  let userId = req.body.userId;
  let noteId = req.body.noteId;
  let content = req.body.content;

  if (!userId || !noteId || !content) {
    res.send({ error: 'Parameters are required' });
    return;
  }
  db.run(`UPDATE Notes SET content=(?) WHERE userId=(?) AND id=(?)`, [content, userId, noteId], (err) => {
    if (err) {
      res.send({ error: err });
      return;
    }
    res.send({ success: 'Note deleted' });
  });
});

// Antwoord met een lijst van alle notities van een gebruiker
app.get('/notes', (req, res) => {
  // controleer of de naam parameter is meegegeven
  let name = req.query.name;
  if (!name) {
    res.send({ error: 'No name argument found' });
    return;
  }

  // haal de userId van de gebruiker op
  db.get(`SELECT id from Users WHERE name LIKE (?)`, name, (err, row) => {
    // return bij eventuele error
    if (err) {
      res.send({ error: err });
      return;
    }
    // controleer of een gebruiker met de naam bestaat
    if (!row) {
      res.send({ error: `No user named ${name}` });
      return;
    }

    // haal alle notities van de gebruiker op
    let userId = row.id;
    db.all('SELECT * from Notes WHERE userId = ?', userId, (err, rows) => {
      if (err) {
        res.send({ error: err });
        return;
      }
      res.send(JSON.stringify(rows));
    });
  });
});

// Verwijdert gebruiker met diens notities
app.delete('/users', (req, res) => {
  // controleer of de naam parameter is meegegeven
  let userId = req.query.userId;
  if (!userId) {
    res.send({ error: 'No userId argument found' });
    return;
  }
  // verwijder notities van de gebruiker
  db.run(`DELETE FROM Notes WHERE userId = (?)`, [userId], (err) => {
    if (err) {
      res.send({ error: err });
      return;
    }
  });
  // verwijder de gebruiker
  db.run(`DELETE FROM Users WHERE id = (?)`, [userId], (err) => {
    if (err) {
      res.send({ error: err });
      return;
    }
    res.send({ success: 'Deleted successfully' });
  });
});

var server = app.listen(8081, function () {
  var port = server.address().port;
  console.log('Example app listening on port %s', port);
});
