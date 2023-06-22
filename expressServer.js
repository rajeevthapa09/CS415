var express = require('express');
var app = express();
var sql = require('./mySqlConnection');
// var mongo = require('./mongodb');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/users", function (req, res) {

   let query = "select * from user";
   sql.selectQuery(query, [], function (err, result) {
      if (err) {
         res.json(err);
      }
      // console.log(res);
      res.json(result);
   })
})

// app.post("/users/add", function (req, res) {
//    const { name, dob, email, address, memberType, balance, phonenumber } = req.body;
//    let query = `insert into user(name, dob, email, address, memberType, balance, phonenumber) values(?,?,?,?,?,?,?)`;
//    sql.selectQuery(query, [name, dob, email, address, memberType, balance, phonenumber], function (err, result) {
//       if (err) {
//          res.json(err);
//       } 
//       // res.json(result);
//        res.json("success");
//       //res.flash("success","data addedd successfully")
//    })
// })


//add users to the database
app.post('/users/add', (req, res) => {

   const { name, dob, email, address, memberType, balance, phonenumber } = req.body;
   console.log("test", address.includes("Fairfield"));
   if (address.includes('Fairfield')) {
      const query = `INSERT INTO user (name, dob, email, address, memberType, balance, phonenumber) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      sql.selectQuery(query, [name, dob, email, address, memberType, balance, phonenumber], (err, result) => {
         if (err) {
            console.error('Error executing SQL selectQuery:', err);
            res.status(500).json({ error: 'An error occurred while processing the request' });
         } else {
            res.json({ message: 'User added successfully' });
         }
      });
   } else {
      res.status(400).json({ error: 'Only the resident of Fairfield can become a member' });
   }

});

//update user name
app.post("/users/update", function (req, res) {

   const { userId, name } = req.body;
   // Use parameterized selectQuery to prevent SQL injection
   let selectQuery = 'UPDATE User SET name = ? WHERE userId = ?';
   let values = [name, userId];

   sql.selectQuery(selectQuery, values, function (err, result) {
      if (err) {
         res.json(err);
      } else {
         res.json("name Updated");
      }
   });
});

//delete users from database
app.post("/users/delete/", function (req, res) {

   const { userId } = req.body;
   let query = "delete from user where userId=?";
   sql.selectQuery(query, [userId], function (err, result) {
      if (err) {
         res.json(err);
      } 
       res.json("success");
   })
})

//search User by Name
app.get("/search/user/:name", function (req, res) {

      const { name } = req.params;
      let query = "SELECT * FROM User WHERE name LIKE ?";
      sql.selectQuery(query, [`%${name}%`], function (err, result) {
         if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'An error occurred while searching for users' });
         } else {
            res.json(result);
         }
      });
})

//search user by phone
app.get("/search/phone/:phone", function (req, res) {

   const { phone } = req.params;
   let query = "SELECT * FROM User WHERE phoneNumber = ?";

   sql.selectQuery(query,[phone], function (err, result) {
      if (err) {
         res.json(err);
      }
      // console.log(res);
      res.json(result);
   })
})


//add books to the database
app.post("/books/add", function (req, res) {

   const { isbn, author,title, publisher, branchName, description,category } = req.body;
   let query = "insert into books(isbn, author, title, publisherId, location, description, category)" + 
   "values( '"+ isbn +"','" + author + "','" + title + "'," + "(select publisherId from publisher where name='" + publisher + "')," + 
   "(select branchID from branch where branchName='" + branchName + "'),'" + description +"','" + category +"')";

   sql.selectQuery(query, [], function (err, result) {
      console.log("Here")
      if (err) {
         res.json(err);
      } 
      // res.json(result);
       res.json("success");
      //res.flash("success","data addedd successfully")
   })
})


// search books by author:
app.get("/books/author/:author", function (req, res) {

   const { author } = req.params;
   let query = "SELECT * FROM books WHERE author = ?" ;
   sql.selectQuery(query, [author], function (err, result) {
      if (err) {
         res.json(err);
      }
      // console.log(res);
      res.json(result);
   })
})

//search books by category
app.get("/books/category/:category", function (req, res) {

   const { category } = req.params;
   let query = "SELECT * FROM books WHERE category = ?";

   sql.selectQuery(query,[category], function (err, result) {
      if (err) {
         res.json(err);
      }
      // console.log(res);
      res.json(result);
   })
})

//search books by title
app.get("/books/title/:title", function (req, res) {

   const { title } = req.params;
   let query = "SELECT * FROM books WHERE title = ?";

   sql.selectQuery(query,[title], function (err, result) {
      if (err) {
         res.json(err);
      }
      // console.log(res);
      res.json(result);
   })
})

//sort books
app.get("/sort/:param", function (req, res) {

   const { param } = req.params;
   let query = "select * from books order by " + param + " asc";

   sql.selectQuery(query,[], function (err, result) {
      if (err) {
         res.json(err);
      }
      console.log();
      // console.log(res);
      res.json(result);
   })
})



//books checkingout process
app.post('/users/checkout', (req, res) => {

   const { userId, bookId } = req.body;
   // Check if book is available and user is not overdue
   const subQuery = `SELECT 1
                     FROM checkInCheckOut
                     WHERE (bookId = ? AND checkInDate IS NULL)
                       OR (userId = ? AND checkInDate IS NULL AND TIMESTAMPDIFF(DAY, checkOutDate, NOW()) > 21)`;
   const query = `INSERT INTO checkInCheckOut (userId, bookId, checkOutDate)
               SELECT ?, ?, NOW()
                  FROM DUAL
                  WHERE NOT EXISTS (${subQuery})`;
   const params = [userId, bookId, bookId, userId];
   sql.selectQuery(query, params, (err, result) => {
      if (err) {
         console.error('Error executing SQL query:', err);
         res.status(500).json({ error: 'An error occurred while processing the request' });
      } else if (result.affectedRows === 0) {
         res.json({ message: 'Book is not available or user has overdue books' });
      } else {
         console.log('Record inserted successfully');
         res.json({ message: 'Record inserted successfully' });
      }
   });
});

// Check out




// app.post('/users/checkout', function (req, res) {

//    const { userId, bookId } = req.body;
//    // Check if the user's balance is more than 10

//    let balanceQuery = 'SELECT balance FROM User WHERE userId = ?';
//    sql.selectQuery(balanceQuery, [userId], function (err, result) {
//       if (err) {
//          res.json(err);
//       } else {
//          const userBalance = result[0].balance;
//          if (userBalance > 10) {
//             res.json("Cannot check out book. User has balance more than 10.");
//          } else {
//             // Check if the book is already checked out and not checked in yet
//             let checkoutQuery = 'SELECT * FROM checkInCheckOut WHERE bookId = ? AND checkInDate IS NULL';
//             sql.selectQuery(checkoutQuery, [bookId], function (err, result) {
//                if (err) {
//                   res.json(err);
//                } else if (result.length > 0) {
//                   res.json("Cannot check out book. Book is already checked out and not checked in yet.");
//                } else {
//                   // Perform the book checkout
//                   let insertQuery = 'INSERT INTO checkInCheckOut (userId, bookId, checkOutDate) VALUES (?, ?, NOW())';
//                   sql.selectQuery(insertQuery, [userId, bookId], function (err, result) {
//                      if (err) {
//                         res.json(err);
//                      } else {
//                         res.json("Book checked out successfully");
//                      }
//                   });
//                }
//             });
//          }
//       }
//    });

//books checkin process
app.put('/users/checkIn', function (req, res) {

   var { userId, bookId } = req.body;
   // Start the transaction
   sql.selectQuery('START TRANSACTION', function (err) {
      if (err) {
         console.error('Error starting transaction:', err);
         return sql.rollback(function () {
            res.status(500).json({ error: 'An error occurred while processing the request' });
         });
      }

      // First selectQuery
      sql.selectQuery(`
       UPDATE library.User
       JOIN library.CheckInCheckOut ON library.User.userId = library.CheckInCheckOut.userId
       SET balance = balance + (CASE
           WHEN User.memberType = 'staff' AND DATEDIFF(NOW(), CheckInCheckOut.checkOutDate) > 21
             THEN (0.1 * (DATEDIFF(NOW(), CheckInCheckOut.checkOutDate) - 21))
           WHEN TIMESTAMPDIFF(YEAR, User.DOB, CURDATE()) >= 70 AND DATEDIFF(NOW(), CheckInCheckOut.checkOutDate) > 45
             THEN (0.05 * (DATEDIFF(NOW(), CheckInCheckOut.checkOutDate) - 45))
           WHEN TIMESTAMPDIFF(YEAR, User.DOB, CURDATE()) < 70 AND DATEDIFF(NOW(), CheckInCheckOut.checkOutDate) > 25
             THEN (0.25 * (DATEDIFF(NOW(), CheckInCheckOut.checkOutDate) - 25))
           ELSE 0
         END),
         checkInDate = NOW()
       WHERE CheckInCheckOut.bookId = ?
     `, [bookId], function (err, result) {
         if (err) {
            console.error('Error executing first selectQuery:', err);
            return sql.rollback(function () {
               res.status(500).json({ error: 'An error occurred while processing the request' });
            });
         }

         // Second selectQuery
         sql.selectQuery(`
         UPDATE checkInCheckOut
         SET checkInDate = NOW()
         WHERE userId = ?
         AND bookId = ?
         AND checkInDate IS NULL;
       `, [userId, bookId], function (err, result) {
            if (err) {
               console.error('Error executing second selectQuery:', err);
               return sql.rollback(function () {
                  res.status(500).json({ error: 'An error occurred while processing the request' });
               });
            }

            // Commit the transaction
            sql.selectQuery('COMMIT', function (err) {
               if (err) {
                  console.error('Error committing transaction:', err);
                  return sql.rollback(function () {
                     res.status(500).json({ error: 'An error occurred while processing the request' });
                  });
               }
               console.log('Transaction committed successfully');
               res.json({ message: 'Transaction completed successfully' });
            });
         });
      });
   });
});


//display all books checked out and the books title
app.get("/books/checkout/", function (req, res) {

   let query = "select b.title as checkedOutBooks, b.bookId from books b inner join checkincheckout c on b.bookId= c.bookId where c.checkInDate IS null;";

   sql.selectQuery(query,[], function (err, result) {
      if (err) {
         res.json(err);
      }
      // console.log(res);
      res.json(result);
   })
})


//display the list of books checkout by members
app.get("/books/checkout/:member", function (req, res) {

   const { member } = req.params;
   let query = "select b.title as checkedOutBooks, c.userid, b.bookId from books b inner join checkincheckout c on b.bookId= c.bookId where c.checkInDate IS null and c.userID=?;";

   sql.selectQuery(query,[member], function (err, result) {
      if (err) {
         res.json(err);
      }
      // console.log(res);
      res.json(result);
   })
})

//display members who has books overdue
app.get("/overdue/member", function (req, res) {
   
   let query = "SELECT u.name, b.title FROM  user u inner join checkInCheckOut c on c.checkInDate IS NULL AND TIMESTAMPDIFF(DAY, checkOutDate, NOW()) > 21 and c.userId=u.userId inner join books b where b.bookId=c.bookId";
   sql.selectQuery(query,[], function (err, result) {
      if (err) {
         res.json(err);
      }
      // console.log(res);
      res.json(result);
   })
})

//display all the users who have dues to owe to library
app.get('/users/usersWithDue', (req, res) => {

   const query = `SELECT userId, name, balance FROM user WHERE balance IS NOT NULL AND balance != 0`;
   sql.selectQuery(query, [], (err, result) => {
      if (err) {
         console.error('Error executing SQL selectQuery:', err);
         res.status(500).json({ error: 'An error occurred while processing the request' });
      } else {
         res.json(result);
      }
   });
});

var server = app.listen(8080, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})