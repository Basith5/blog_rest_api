import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mysql, { OkPacket } from 'mysql2/promise';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/' }); // Set the destination folder for uploaded files

// Parse request body as JSON
app.use(bodyParser.json());

//MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'projects',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
////////////////////////////////////////
//schema for the update body using zod
const Schema = z.object({
  blogId: z.number(),
  blogTitle: z.string().optional(),
  shortDescription: z.string().max(40).optional(),
  blogCategory: z.string().optional(),
  richText: z.string().optional(),
  img_micro: z.string().optional(),
});
////////////////////////////////////////
//schema for the request body using Zod
const blogSchema = z.object({
  blogTitle: z.string().min(1),
  shortDescription: z.string().max(40),
  blogCategory: z.string().min(1),
  richText: z.string().min(1),
  img_micro: z.string().optional(),
});
//////////////////////////////////////////////////////////////////////////////
app.post('/addblog', upload.single('img_micro'), async (req: Request, res: Response) => {
  try {
    // Validate request body using the schema
    const { blogTitle, shortDescription, blogCategory, richText } = blogSchema.parse(req.body);

    // Sanitize richText field
    const sanitizedRichText = sanitizeHtml(richText);

    // Get the filename of the uploaded image and save to database
    const img_micro = req.file ? req.file.filename : '';

    app.post('/addblog', upload.single('img_micro'), async (req: Request, res: Response) => {
      try {
        // Validate request body using the schema
        const { blogTitle, shortDescription, blogCategory, richText } = blogSchema.parse(req.body);
    
        // Sanitize richText field
        const sanitizedRichText = sanitizeHtml(richText);
    
        // Get the filename of the uploaded image and save to database
        const img_micro = req.file ? req.file.filename : '';
    
    
    
        // Insert data into MySQL database
        const [result] = await pool.query(
          'INSERT INTO blog (blogTitle, shortDescription, blogCategory, richText, img_micro) VALUES (?, ?, ?, ?, ?)',
          [blogTitle, shortDescription, blogCategory, sanitizedRichText, img_micro]
        );
    
        res.status(201).json({ id: (result as OkPacket).insertId, message: 'Blog post created successfully' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
      }
    });
    // Insert data into MySQL database
    const [result] = await pool.query(
      'INSERT INTO blog (blogTitle, shortDescription, blogCategory, richText, img_micro) VALUES (?, ?, ?, ?, ?)',
      [blogTitle, shortDescription, blogCategory, sanitizedRichText, img_micro]
    );

    res.status(201).json({ id: (result as OkPacket).insertId, message: 'Blog post created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

///////////////////////////////////////////////////////////////////////////
// //adding data to the blog table
// app.post('/addblog', async (req: Request, res: Response) => {
//   try {
//     // Validate request body using the schema
//     const { blogTitle, shortDescription, blogCategory, richText } = blogSchema.parse(req.body);

//     // Sanitize richText field
//     const sanitizedRichText = sanitizeHtml(richText);

//     // Insert data into MySQL database
//     const [result] = await pool.query(
//       'INSERT INTO blog (blogTitle, shortDescription, blogCategory, richText) VALUES (?, ?, ?, ?)',
//       [blogTitle, shortDescription, blogCategory, sanitizedRichText]
//     );

//     res.status(201).json({ id: (result as mysql.OkPacket).insertId, message: 'Blog post created successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Something went wrong' });
//   }
// });
////////////////////////////////////////////////////////////////////////
//getting data from the blog table
app.get('/readBlog', async (req: Request, res: Response) => {
  try {
    // Get data from MySQL database
    const [rows] = await pool.query('SELECT * FROM blog');

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
///////////////////////////////////////////////////////////////////////////
//single blog post by ID from the database
app.get('/readBlog/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.execute('SELECT * FROM blog WHERE id = ?', [id]);
    if (Array.isArray(rows) && rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).send('Blog post not found');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error retrieving blog post');
  }
});
///////////////////////////////////////////////////////////////////////////
// //updating data in the blog table
// app.put('/updateBlog/:id', async (req: Request, res: Response) => {
//   try {
//     // Validate request body
//     blogSchema.parse(req.body);

//     const { blogTitle, shortDescription, blogCategory, richText } = req.body;
//     const { id } = req.params;

//     // Sanitize richText
//     const sanitizedText = sanitizeHtml(richText);

//     // Update data in MySQL database
//     const [result] = await pool.query(
//       'UPDATE blog SET blogTitle = ?, shortDescription = ?, blogCategory = ?, richText = ? WHERE id = ?',
//       [blogTitle, shortDescription, blogCategory, sanitizedText, id]
//     );

//     res.status(200).json({ msg: 'success' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Something went wrong' });
//   }
// });
///////////////////////////////////////////////////////////////////////////
app.patch('/editBlog/:id', async (req: Request, res: Response) => {
  try {
    let columnToUpdate;
    if (req.body.blogTitle) {
      columnToUpdate = 'blogTitle';
    } else if (req.body.shortDescription) {
      columnToUpdate = 'shortDescription';
    } else if (req.body.blogCategory) {
      columnToUpdate = 'blogCategory';
    } else if (req.body.richText) {
      columnToUpdate = 'richText';
    } else {
      res.status(400).json({ error: 'No valid column found to update' });
      return;
    }

    const valueToUpdate = req.body[columnToUpdate];

    // Update data in MySQL database
    const [result] = await pool.query(
      `UPDATE blog SET ${columnToUpdate}=? WHERE id=?`,
      [valueToUpdate, req.params.id]
    );

    if ((result as OkPacket).affectedRows === 0) {
      res.status(404).json({ error: 'Data not found' });
    } else {
      res.status(200).json({ msg: 'success' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

///////////////////////////////////////////////////////////////////////////
// app.patch('/editBlog/:id', upload.single('img_micro'), async (req: Request, res: Response) => {
//   try {
//     const { blogTitle, shortDescription, blogCategory, richText } = Schema.pick({
//       blogTitle: true,
//       shortDescription: true,
//       blogCategory: true,
//       richText: true,
//     }).parse(req.body);

//     // Get the filename of the uploaded image and save to database
//     const img_micro = req.file ? req.file.filename : '';

//     // Update data in MySQL database
//     const [result] = await pool.query(
//       'UPDATE blog SET blogTitle=?, shortDescription=?, blogCategory=?, richText=?, img_micro=? WHERE id=?',
//       [blogTitle, shortDescription, blogCategory, richText, img_micro, req.params.id]
//     );

//     if ((result as OkPacket).affectedRows === 0) {
//       res.status(404).json({ error: 'Data not found' });
//     } else {
//       res.status(200).json({ msg: 'success' });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Something went wrong' });
//   }
// });

///////////////////////////////////////////////////////////////////////////
// //updating data in the blog table
// app.patch('/editBlog/:id', async (req: Request, res: Response) => {
//   try {
//     const { blogTitle, shortDescription, blogCategory, richText } = Schema.pick({
//       blogTitle: true,
//       shortDescription: true,
//       blogCategory: true,
//       richText: true,
//     }).parse(req.body);

//     // // Sanitize richText before updating database
//     // const sanitizedRichText = sanitizeHtml(richText);

//     const [result] = await pool.query(
//       'UPDATE blog SET blogTitle=?, shortDescription=?, blogCategory=?, richText=? WHERE id=?',
//       [blogTitle, shortDescription, blogCategory, richText, req.params.id]
//     );

//     if ((result as OkPacket).affectedRows === 0) {
//       res.status(404).json({ error: 'Data not found' });
//     } else {
//       res.status(200).json({ msg: 'success' });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Something went wrong' });
//   }
// });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//delete a blog post from the database
app.delete('/deleteBlog/:id', async (req: Request, res: Response) => {
  const postId = req.params.id;
  try {
    const [result] = await pool.execute(
      'DELETE FROM blog WHERE id = ?',
      [postId]
    );
    if ((result as mysql.ResultSetHeader).affectedRows === 0) {
      res.status(404).send('Blog post not found');
    } else {
      res.send(`Blog post with ID ${postId} deleted successfully`);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error deleting blog post');
  }
});

///////////////////////////////////////////////////////////////////////////////

// Start the server
app.listen(5000, () => {
  console.log('Server started on port 5000');
});
