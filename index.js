import express, { query } from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";


const app = express();
const port = 3000;


app.use(bodyParser.urlencoded({ extended: true }));
app.use("/dist",express.static("./node_modules/bootstrap/dist"));
app.use(express.static("public"));
app.use(bodyParser.json());

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "myLibrary",
  password: "1122",
  port: 5432,
});
db.connect();




let data = [];

let post = [
  {
 title: 'ssss', author: 'sssss', rating: '4', book_review: 'ssss'
}
];


let sort = "review_id";

app.get("/", async (req, res)=> {
      
 
    try {


        const result = await db.query('SELECT * FROM books join book_reviews ON book_reviews.book_id = books.book_id order by '+ sort + ' ASC ');
        const data = result.rows;
     

        if (!data || data.length === 0) {
      

  
        res.render("index.ejs", { posts: post });


      } else { 
     
        res.render("index.ejs", { posts: data });
    } 
        
       
      } catch (error) {
        res.status(500).json({ message: "Error fetching posts" });
      }
    });

  


app.use("/addbook",(req,res)=>{
  res.render("addbook.ejs");
})

app.post("/addnewbook", async (req,res)=> {



try {
  
     const response = await axios.get('https://openlibrary.org/search.json?q=' + req.body.isbn + '&limit=1');
    
     const authorNew = response.data.docs[0].author_name[0];
     const titleNew = response.data.docs[0].title;
     const cover_id = response.data.docs[0].cover_i;
     const isbn = req.body.isbn;

    

     const  result = await db.query("INSERT INTO books (title, author, cover_id, isbn) VALUES ($1, $2, $3, $4) RETURNING book_id;", [titleNew, authorNew, cover_id, isbn]);
      
     const b_id = result.rows[0].book_id;

     await db.query("INSERT INTO book_reviews (book_id, book_review, rating) VALUES ($1, $2, $3); ", [b_id, req.body.book_review, req.body.rating]); 
      



  res.redirect("/");

} catch (error) {
  
  res.status(500).json({ message: "Error fetching posts" });
}


});





app.get("/edit/:id", (req,res)=> {

res.render("edit.ejs", {

  book_id : parseInt(req.params.id),
    title : req.query.title, 
    author: req.query.author, 
    cover_id : req.query.cover_id,
    book_review : req.query.text_review,
    isbn : req.query.isbn

});

});

app.post("/editbook", async (req,res)=> {

console.log(req.body);

await db.query(
  "UPDATE book_reviews SET book_review = $1, rating = $2 WHERE book_id = $3",
  [req.body.book_review, req.body.rating, req.body.book_id]
);



res.redirect("/");




});


app.post("/sort", (req,res)=> {

sort = req.body.sort;

res.redirect("/");

});





app.get("/delete/:id", async (req,res)=> {


   
  // const remove = data.filter((id) => id.cover_id = req.params.id);
  const postId= parseInt(req.params.id);



  await db.query("BEGIN; DELETE FROM book_reviews WHERE book_id = "+ postId +"; DELETE FROM books WHERE book_id = "+ postId +"; COMMIT; ");

   
res.redirect("/");


});








app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });