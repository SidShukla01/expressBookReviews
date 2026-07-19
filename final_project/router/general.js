const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
const public_users = express.Router();
const axios = require('axios');

public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({message: "Username and password are required"});
  }

  if (isValid(username)) {
    return res.status(404).json({message: "User already exists!"});
  }

  require("./auth_users.js").users.push({"username": username, "password": password});
  return res.status(200).json({message: "User successfully registered. Now you can login"});
});

// Get the book list available in the shop (async/await + Axios)
public_users.get('/', async (req, res) => {
  try {
    const response = await axios.get(`http://localhost:5000/booklist`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    // fallback if the internal endpoint isn't hit directly
    return res.status(200).send(JSON.stringify(books, null, 4));
  }
});

// Helper endpoint used internally to simulate a "remote" data source
public_users.get('/booklist', (req, res) => {
  return res.status(200).json(books);
});

// Get book details based on ISBN (async/await + Axios)
public_users.get('/isbn/:isbn', async (req, res) => {
  const isbn = req.params.isbn;
  try {
    const response = await axios.get(`http://localhost:5000/booklist`);
    const allBooks = response.data;
    if (allBooks[isbn]) {
      return res.status(200).json(allBooks[isbn]);
    } else {
      return res.status(404).json({message: "Book not found"});
    }
  } catch (error) {
    return res.status(500).json({message: "Error retrieving book"});
  }
});

// Get book details based on author (async/await + Axios)
public_users.get('/author/:author', async (req, res) => {
  const author = req.params.author;
  try {
    const response = await axios.get(`http://localhost:5000/booklist`);
    const allBooks = response.data;
    let result = [];
    Object.keys(allBooks).forEach((key) => {
      if (allBooks[key].author.toLowerCase() === author.toLowerCase()) {
        result.push({isbn: key, ...allBooks[key]});
      }
    });
    if (result.length > 0) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json({message: "No books found for this author"});
    }
  } catch (error) {
    return res.status(500).json({message: "Error retrieving books"});
  }
});

// Get book details based on title (Promise callbacks version, as alternative)
public_users.get('/title/:title', (req, res) => {
  const title = req.params.title;
  axios.get(`http://localhost:5000/booklist`)
    .then((response) => {
      const allBooks = response.data;
      let result = [];
      Object.keys(allBooks).forEach((key) => {
        if (allBooks[key].title.toLowerCase() === title.toLowerCase()) {
          result.push({isbn: key, ...allBooks[key]});
        }
      });
      if (result.length > 0) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json({message: "No books found with this title"});
      }
    })
    .catch((error) => {
      return res.status(500).json({message: "Error retrieving books"});
    });
});

// Get book review
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).json(books[isbn].reviews);
  } else {
    return res.status(404).json({message: "Book not found"});
  }
});

module.exports.general = public_users;