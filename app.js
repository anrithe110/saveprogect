const Product = require("./product"),
  User = require("./User"),
  upload = require("./Storage"),
  Deletefile = require("./Delete"),
  fs = require('fs'),
  express = require("express"),
  bodyParser = require("body-parser"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  app = express();

////////////////////////////////////////////////////////////////////////////////////////////////////////
// Express and Passport Configuration
////////////////////////////////////////////////////////////////////////////////////////////////////////

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(require("express-session")({
  secret: "ares1234.oil",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

////////////////////////////////////////////////////////////////////////////////////////////////////////
// Passport Configuration
////////////////////////////////////////////////////////////////////////////////////////////////////////

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

////////////////////////////////////////////////////////////////////////////////////////////////////////
// Routing
////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/", async (req, res) => {
  try {
    const itemss = await Product.find();
    res.render("home", { items: itemss });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////
// register
///////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/register", function (req, res) {
  res.render("register");
});
app.post("/register", async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.render("register", { error: "User already exists. Please choose a different email." });
    }
    await User.create({
      username: req.body.username,
      password: req.body.password,
      isadmin: req.body.isadmin === 'on'
    });
    res.redirect("/login");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// login
////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/login", function (req, res) {
  res.render("login");
});
app.post("/login", async function (req, res) {
  try {
    const user = await User.findOne({ username: req.body.username });
    let action;
  
    if (user) {
      const result = req.body.password === user.password;
  
      if (result) {
        action = user.isadmin == true ?  "adminDashboard" : "usercart";
      } else {
        action = "login";
        error = "Incorrect password";
      }
    } else {
      action = "login";
      error = "User doesn't exist";
    }
  
    switch (action) {
      case "adminDashboard":
        res.render("adminDashboard");
        break;
      case "usercart":
        res.render("usercart");
        break;
      case "login":
        res.render("login", { error });
        break;
      default:
        res.status(400).json({ error: "Unknown error" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
})


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// newproduct
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/newproduct", upload.single("image"), (req, res) => {
  const product = new Product({
    name: req.body.name,
    specs: req.body.specs,
    price: req.body.price,
    class: req.body.class,
    productCode: req.body.productcode,
    image: req.file.filename 
  });
  product.save()
    .then(() => {
      console.log("Saved product: ", product);
      res.redirect("/login")
    })
    .catch(error => {
      console.error("Error saving product: ", error);
      res.redirect("/login");
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// deleting item access via admin
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/todelete", (req, res) => {
  Product.find().then((Items) => {
    res.render("Delete", { items: Items })
  })
});
app.post("/delete", (req, res) => {
  const deleting = req.body.deleting;
  Product.deleteOne({ image: deleting }).then(Deletefile(deleting, fs));
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// finding specific item
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/Product/:Productid", async (req, res) => {
  const requestedProductId = req.params.Productid;
  try {
    const items1 = await Product.find({ _id: requestedProductId });
    res.render("product", { items: items1 });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Error handling middleware
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
};
app.use(errorHandler);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// port config
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(3000, () => {
  console.log("Server started on port 3000");
});