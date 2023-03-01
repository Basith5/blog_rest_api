const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');

const app = express();

// Create connection to MySQL database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'projects'
});

// Parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// POST route to add data to MySQL database
app.post('/addData', (req, res) => {
  const data = req.body;

  // Validate required fields
  if (!data.blogTitle || !data.shortDescription || !data.blogCategory || !data.richText) {
    res.status(400).send('All fields are required');
    return;
  }

  // Validate shortDescription length
  if (data.shortDescription.length > 40) {
    res.status(400).send('shortDescription must be 40 characters or less');
    return;
  }

  // Sanitize richText
  const sanitizedRichText = sanitizeHtml(data.richText);

  const query = `INSERT INTO blog (blogTitle, shortDescription, blogCategory, richText) VALUES (?, ?, ?, ?)`;
  const values = [data.blogTitle, data.shortDescription, data.blogCategory, sanitizedRichText];

  connection.query(query, values, (err, result) => {
    if (err) throw err;
    res.send(`Data added to MySQL database with ID: ${result.insertId}`);
  });
});


// GET data from MySQL database
app.get('/getData', (req, res) => {
    const query = `SELECT * FROM blog`;
  
    connection.query(query, (err, result) => {
      if (err) throw err;
      res.send(result);
    });
  });

// GET data from MySQL database by ID
app.get('/getData/:id', (req, res) => {
    const id = req.params.id;
  
    const query = `SELECT * FROM blog WHERE id = ?`;
  
    connection.query(query, id, (err, result) => {
      if (err) throw err;
  
      // Check if result is empty
      if (result.length === 0) {
        res.status(404).send('Data not found');
        return;
      }
  
      res.send(result[0]);
    });
  });



// PUT route to update data in MySQL database
app.put('/updateData/:id', (req, res) => {
    const id = req.params.id;
    const data = req.body;
  
    const query = `UPDATE blog SET blogTitle = ?, shortDescription = ?, blogCategory = ?, richText = ? WHERE id = ?`;
    const values = [data.blogTitle, data.shortDescription, data.blogCategory, data.richText, id];
  
    connection.query(query, values, (err, result) => {
      if (err) throw err;
      res.send(`Data updated in MySQL database with ID: ${id}`);
    });
  });


// DELETE route to delete data from MySQL database
app.delete('/deleteData/:id', (req, res) => {
    const id = req.params.id;
  
    const query = `DELETE FROM blog WHERE id = ?`;
  
    connection.query(query, id, (err, result) => {
      if (err) throw err;
      res.send(`Data deleted from MySQL database with ID: ${id}`);
    });
  });

// Start the server
app.listen(5000, () => {
  console.log('Server started on port 5000');
});
