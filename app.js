const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

//Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); //directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
})

const upload = multer({storage: storage});

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'c237_culinary_cove'
});
connection.connect((err) => {
if (err) {
console.error('Error connecting to MySQL:', err);
return;
}
console.log('Connected to MySQL database');
});
// Set up view engine
app.set('view engine', 'ejs');
// enable static files
app.use(express.static('public'));
// enable from processing 
app.use(express.urlencoded({
    extended: false
}));
// Define routes
app.get('/',(req, res) => {
    const sql = 'SELECT * FROM recipe';
    // fetch data from MySQL
    connection.query(sql, (error, results) => {
        if (error){
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving recipe');
        }
        //render HTML page with data
        res.render('index', {recipe: results});
    });
});




// Home route
//app.get('/', (req, res) => {
    //const sql = 'SELECT * FROM recipes';
    //db.query(sql, (err, results) => {
        //if (err) throw err;
        //res.render('index', { recipes: results });
    //});
//});





app.get('/viewrecipe',(req, res) => {
    const sql = 'SELECT * FROM recipe';
    // fetch data from MySQL
    connection.query(sql, (error, results) => {
        if (error){
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving recipe');
        }
        //render HTML page with data
        res.render('viewrecipe', {recipe: results});
    });
});

app.get('/viewrecipe/:id',(req, res) => {
    //Extract the student ID from the request parameters
    const category_id = req.params.id;
    const sql = 'SELECT * FROM recipe WHERE category_id = ?';
    // fetch data from MySQL
    connection.query(sql, [category_id], (error, results) => {
        if (error){
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving recipe');
        }
        //render HTML page with data
        res.render('viewrecipe', {recipe: results});
    });
});

app.get('/recipe/:id', (req,res) => {
    //Extract the student ID from the request parameters
    const recipe_id = req.params.id;
    const sql = 'SELECT * FROM recipe INNER JOIN recipe_ingredient ON recipe_ingredient.Recipe_id = recipe.recipe_id INNER JOIN ingredient ON ingredient.ingredient_id = recipe_ingredient.ingredient_id WHERE recipe.recipe_id = ?';
    // fetch data from MySQL based on the student ID
    connection.query(sql, [recipe_id], (error, results) => {
        if (error){
            console.error('Database query error :', error.message);
            return res.status(500).send('Error Retrieving recipe by ID');
        }
        //check if any student with the gievn ID was found
        if (results.length > 0) {
            //render HTML page with the student data
            res.render('recipe', {recipe: results});
        } else {
            // if no student with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('recipe not found');
        }
    });
});

app.get('/submitrecipe',(req, res) => {
    const sql = 'SELECT * FROM ingredient';
    // fetch data from MySQL
    connection.query(sql, (error, results) => {
        if (error){
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving ingredient');
        }
        //render HTML page with data
        res.render('submitrecipe', {ingredient: results});
    });
});


app.post('/submitrecipe', (req,res) => {
    // extract student data from the request body
    const {title, category, ingredient, measure, unit, description, instruction} = req.body;

    // Filter out the empty values from the ingredient, measure, and unit arrays
    // const filteredIngredient = ingredient.filter(item => item !== '');
    const filteredMeasure = measure.filter(item => item !== '');
    const filteredUnit = unit.filter(item => item !== '');

    // Insert the recipe into the recipe table
    const sql  = "INSERT INTO recipe (category_id, user_id, title, description, instructions, created_on, updated_on) VALUES (?, 0, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
    connection.query(sql, [category, title, description, instruction], (error, results) =>{
        if (error) {
            //handle any error that occurs during the database operation
            console.error("Error adding recipe:", error);
            res.status(500).send('Error adding recipe');
        } else {
            // Get the recipe_id of the newly inserted recipe
            const recipe_id = results.insertId;

            // Insert the ingredients into the recipe_ingredient table
            for (let i = 0; i < filteredMeasure.length; i++) {
                const sql2 = "INSERT INTO recipe_ingredient (Recipe_id, Ingredient_id, Quantity, Unit) VALUES (?, ?, ?, ?)";
                connection.query(sql2, [recipe_id, ingredient[i], filteredMeasure[i], filteredUnit[i]], (error2, results2) => {
                    if (error2) {
                        console.error("Error adding ingredient:", error2);
                    }
                });
            }

            res.redirect('/submitrecipe');
        }
    })
})




app.get('/profile', (req,res) => {
    res.render('profile');
});

app.get('/addingredient',(req, res) => {
    res.render('addingredient');
});

app.post('/addingredient', (req,res) => {
    // extract student data from the request body
    const {name} = req.body;
    const sql  = "INSERT INTO ingredient (name) VALUES (?)";
    // insert the new student into the database
    connection.query(sql, [name], (error, results) =>{
        if (error) {
            //handle any error that occurs during the database operation
            console.error("Error adding ingredient:", error);
            res.status(500).send('Error adding ingredient');
        } else {
            //send a success response 
            res.redirect('/addingredient');
        }
    })
})

app.get('/deleterecipe', (req,res) => {
    const sql = 'SELECT * FROM recipe';
    // fetch data from MySQL
    connection.query(sql, (error, results) => {
        if (error){
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving recipe');
        }
        //render HTML page with data
        res.render('deleterecipe', {recipe: results});
    });
})

app.get('/deleterecipe/:id', (req, res) => {
    const recipeId = req.params.id;
    const sql = "DELETE FROM recipe WHERE recipe_id = ?";
    connection.query(sql, [recipeId], (error, results) => {
        if (error) {
            console.error("Error deleting recipe:", error);
            res.status(500).send('Error deleting recipe');
        } else {
            const sql2 = "DELETE FROM recipe_ingredient WHERE Recipe_id = ?";
            connection.query(sql2, [recipeId], (error, results) => {
                if (error) {
                    console.error("Error deleting recipe ingredients:", error);
                    res.status(500).send('Error deleting recipe ingredients');
                } else {
                    // Redirect to the recipe list or home page
                    res.redirect('/deleterecipe');
                }
            });
        }
    });
});

app.get('/editrecipe/:id', (req,res) => {
    const recipeId = req.params.id;
    const sql = 'SELECT * FROM recipe INNER JOIN recipe_ingredient ON recipe_ingredient.Recipe_id = recipe.recipe_id INNER JOIN ingredient ON ingredient.ingredient_id = recipe_ingredient.ingredient_id WHERE recipe.recipe_id = ?';
    // fetch data from MySQL based on the student ID
    connection.query(sql, [recipeId], (error, results) => {
        if (error){
            console.error('Database query error :', error.message);
            return res.status(500).send('Error Retrieving student by ID');
        }
        //check if any student with the gievn ID was found
        if (results.length > 0) {
            //render HTML page with the student data
            res.render('editrecipe', {recipe: results});
        } else {
            // if no student with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Student not found');
        }
    });
})

app.post('/editrecipe/:id', (req,res) => {
    const recipeId = req.params.id;
    const {title, category, ingredient,measure, unit, description, instruction,created } = req.body;
    // Filter out the empty values from the ingredient, measure, and unit arrays
    // const filteredIngredient = ingredient.filter(item => item !== '');
    const filteredMeasure = measure.filter(item => item !== '');
    const filteredUnit = unit.filter(item => item !== '');

    const sql  = "UPDATE recipe SET category_id = ?, title = ?, description = ?, instructions = ?, updated_on = CURRENT_TIMESTAMP WHERE recipe_id = ?";
    // insert the new student into the database
    connection.query(sql, [category, title, description, instruction, recipeId], (error, results) =>{
        if (error) {
            //handle any error that occurs during the database operation
            console.error("Error adding student:", error);
            res.status(500).send('Error adding student');
        } else {
            // Insert the ingredients into the recipe_ingredient table
            for (let i = 0; i < filteredMeasure.length; i++) {
                const sql2 = "UPDATE recipe_ingredient SET Quantity = ?, Unit = ? WHERE recipe_id = ?"
                connection.query(sql2, [ filteredMeasure[i], filteredUnit[i], recipeId], (error2, results2) => {
                    if (error2) {
                        console.error("Error adding ingredient:", error2);
                    }
                });
            }

            res.redirect('/viewrecipe');
        }
    })
})



// For reference
app.get('/student/:id', (req,res) => {
    //Extract the student ID from the request parameters
    const studentId = req.params.id;
    const sql = 'SELECT * FROM students WHERE studentId = ?';
    // fetch data from MySQL based on the student ID
    connection.query(sql, [studentId], (error, results) => {
        if (error){
            console.error('Database query error :', error.message);
            return res.status(500).send('Error Retrieving student by ID');
        }
        //check if any student with the gievn ID was found
        if (results.length > 0) {
            //render HTML page with the student data
            res.render('student', {students: results[0]});
        } else {
            // if no student with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('student not found');
        }
    });
});
app.get('/addstudent', (req,res) => {
    res.render('addstudent');
});
app.post('/addstudent', upload.single('image'), (req,res) => {
    // extract student data from the request body
    const {name, dob, contact} = req.body;
    let image;
    if (req.file){
        image = req.file.filename; // save only the file name
    } else {
        image = null;
    }
    const sql  = "INSERT INTO students (name, dob, contact, image) VALUES (?, ?, ?, ?)";
    // insert the new student into the database
    connection.query(sql, [name, dob, contact, image], (error, results) =>{
        if (error) {
            //handle any error that occurs during the database operation
            console.error("Error adding student:", error);
            res.status(500).send('Error adding student');
        } else {
            //send a success response 
            res.redirect('/');
        }
    })
})

app.get('/editstudent/:id', (req,res) => {
    const studentId = req.params.id;
    const sql = 'SELECT * FROM students WHERE studentId = ?';
    // fetch data from MySQL based on the student ID
    connection.query(sql, [studentId], (error, results) => {
        if (error){
            console.error('Database query error :', error.message);
            return res.status(500).send('Error Retrieving student by ID');
        }
        //check if any student with the gievn ID was found
        if (results.length > 0) {
            //render HTML page with the student data
            res.render('editstudent', {student: results[0]});
        } else {
            // if no student with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Student not found');
        }
    });
})

app.post('/editstudent/:id', upload.single('image'), (req,res) => {
    const studentId = req.params.id;
    // extract student data from the request body
    const {name, dob, contact} = req.body;
    let image;
    if (req.file){
        image = req.file.filename; // save only the file name
    } 
    const sql  = "UPDATE students SET name = ?, dob = ?, contact = ?, image = ? WHERE studentId = ?";
    // insert the new student into the database
    connection.query(sql, [name, dob, contact, image, studentId], (error, results) =>{
        if (error) {
            //handle any error that occurs during the database operation
            console.error("Error adding student:", error);
            res.status(500).send('Error adding student');
        } else {
            //send a success response 
            res.redirect('/');
        }
    })
})

app.get('/deletestudent/:id', (req,res) => {
    const studentId = req.params.id;
    const sql  = "DELETE FROM students WHERE studentId = ?";
    // insert the new student into the database
    connection.query(sql, [studentId], (error, reults) =>{
        if (error) {
            //handle any error that occurs during the database operation
            console.error("Error adding student:", error);
            res.status(500).send('Error adding student');
        } else {
            //send a success response 
            res.redirect('/');
        }
    })
})
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));