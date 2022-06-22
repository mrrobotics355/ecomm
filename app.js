require("dotenv").config()
const express = require("express")
const ejs = require("ejs")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const multer = require("multer")
const fs = require("fs")
const fileUpload = require("express-fileupload")
const passportLocal = require("passport-local-mongoose")
const expressSession = require("express-session")
const passport = require("passport")
const findOrCreate = require("mongoose-findorcreate")

//mongoose
mongoose.connect("mongodb+srv://admin-emmanuel:test123@cluster0.kw9lwhc.mongodb.net/ecommerce")



// express app
const app = express()

app.set("view engine", "ejs")

/// app usages
app.use(express.static(__dirname +  "/public/assets"))
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(fileUpload())
app.use(expressSession({
    secret: "Our little Secret.",
    resave: false,
    saveUninitialized:false
}))
app.use(passport.initialize())
app.use(passport.session())





//mongo schemas

const UserScema = mongoose.Schema({
    username: String,
    password: String, 
    name: String,
    lastname: String,
    image: {
        data: Buffer,
        contentType: String
    }
})


// user plugins
UserScema.plugin(passportLocal)
UserScema.plugin(findOrCreate)


const goodsSchema = mongoose.Schema({
    name: String,
    type: String,    
    description: String,
    price: Number,
    image: {
        data: Buffer,
        contentType: String
    },
})

/// mongo models
const Users = new mongoose.model("user", UserScema)


//user Strategy
passport.use(Users.createStrategy())



const goods = new mongoose.model("good", goodsSchema)




passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
passport.deserializeUser(function(user, done) {
    done(null, user);
  });



///////////////////////////// url Routes//////////////////////////////////////
app.route("/")
    .get((req, res) =>{
        goods.find((err, items) => {
            
            res.render("home", {product: items, auth: req.isAuthenticated()})

        })
    })
    .post((req, res) => {

    });

app.route("/items")
    .get((req, res) =>{
        goods.find((err, items) => {
            res.render("items", {product: items, auth: req.isAuthenticated()})

        })
    })
    .post((req, res) => {

    });

app.route("/add")
    .get((req, res) => {
        if(req.isAuthenticated()){
        res.render("enterGoods", {auth: req.isAuthenticated()})
        }else{
            res.redirect("/login")
        }
        
    })
    .post( (req, res) => {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
          }
        const img = req.files.image
  
        var obj = {
            name: req.body.name,
            type: req.body.type,
            price: req.body.price,
            description: req.body.description,
            image: {
                data: img.data,
                contentType: img.mimetype
            }
        }
        goods.create(obj, (err, item) => {
            if (err) {
                console.log(err);
            }
            else {
                // item.save();
                res.redirect('/add');
            }
        });

    });

 app.route("/login")
    .get((req, res) => {
        if(req.isAuthenticated()){
            res.redirect("/")

        }else{
            res.render("login")

        }
    })
    .post((req, res) => {
        const user = new Users({
            username: req.body.username,
            password: req.body.password,
        })
        req.login(user, (err) => {
            if(err) {
                console.log(err);
            }else{
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/")
                })
            }
        })
        

    });



app.route("/register")
    .get((req, res) => {

        if(req.isAuthenticated()){
            res.redirect("/")
        }else{
            res.render("register")
        }
        
        

    })
    .post((req, res) => {
        const img = req.files.image


    Users.register({username: req.body.username, image: {
                data: img.data,
                contentType: img.mimetype
            }, lastname: req.body.lastname, name: req.body.name }, req.body.password, (err, user) => {
        if(err) {
            console.log(err)
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req, res, () => {
                res.redirect("/")
            })

        }
    })

}); 

// app.route("/test")
//     .get((req, res) => {
//         if(req.isAuthenticated()){

//             Users.findById(req.user._id, (err, foundUser) => {
//                 if(err){
//                     console.log(err);
//                 }else{
//                     if(foundUser){
//                         res.render("testpage", {foundUser, foundUser})    
//                     }

//                 }
//             })


//         }else{
//             res.redirect("/login")
//         }      

//     })
//     .post((req, res) => {

//     });
 


app.route("/purchase/:prodId")
    .get((req, res) => {
        if(req.isAuthenticated()){

            goods.findById(req.params.prodId, (err, foundGood) => {
                if(err){
                    console.log(err);
                }else{
                    if(foundGood){
                        res.render("purchase", {good: foundGood})
                    }
                }
            } )

        }else{
            res.redirect("/login")
        }

    })
    .post(() => {

    });


app.get("/logout", (req, res) => {
    req.logout((err) => {
        if(err){
            console.log(err);
        }
    })
    res.redirect("/")
})

app.get("/done", (req, res) => {
    if(req.isAuthenticated()){
        res.render("done")
    }
})


app.listen(3000, () =>{
    console.log("Running on port 3000");
})