const express = require('express');
const app = express();
const engine= require('ejs-mate');
const port = 2000;
const { mongoose, mongo } = require('mongoose');
const {Schema} = mongoose;
const methodOverride = require('method-override');
const session = require('express-session');
var flash = require('connect-flash');


mongoose.connect('mongodb://127.0.0.1:27017/cloudNotes')
  .then(() => console.log('Connected!'));

app.use(methodOverride('_method'));
app.use(methodOverride('_method'))
app.engine('ejs', engine);
app.set('views', __dirname + '/views');
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session(
  {
    secret: "mysession",
    resave: false,
    saveUninitialized: true,
  }
));

app.use(flash());

// schema for the notes
const noteSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    date:Date,
  },
)
const Note = mongoose.model("Note", noteSchema);

// Schema for the user
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    notes: [
      {
      type:Schema.Types.ObjectId,
       ref:"Note",
    },
    ]
  } 
);
const User = mongoose.model("User", userSchema);

// schema for the help
const heplSchema = new mongoose.Schema(
  {
    email: String,
    help: String,
  }
);
const Help = mongoose.model("Help", heplSchema);

//Home page route
app.get("/", (req, res) => {
  // console.log("Working the route");
  res.render("home.ejs");
});

// singUp page route
app.get("/singup", async (req, res) => {
  res.render("signup.ejs",{message:req.flash("error")});
});

// Singupup page route
app.post("/singup", async (req, res) => {
  const { name, email, password } = req.body;
  const user1 = new User(
    {
      name: name,
      email: email,
      password: password,
    }
  )
  const data = await User.findOne({ email: { $eq: email } });
  if (!data) {
    console.log("does not found data");
    user1.save();
    req.flash("login", "Now login your account");
    res.redirect("/login");
  } else {
    // console.log("data is found in the data base");
    req.flash("error", "This email already registered!");
    res.redirect("/singup");
  }

});

// login page route
app.get("/login", async (req, res) => {
  res.render("login.ejs",{message:req.flash("error2"),login:req.flash("login")});
});

// loginpage route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const data = await User.findOne({ email: email, password: password }).populate('notes');
  // console.log(data);
  if (data) {
    res.redirect(`/user/${data._id}`);
    // console.log(data);
  } else {
    req.flash("error2", "Email or Password is incorrect!");
    res.redirect("/login");
  }
});

// user page route
app.get("/user/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const data2 = await User.findOne({ _id: { $eq: id } });
    if (data2) {
      const data = await User.findOne({ _id: id }).populate("notes");
      const date = new Date();
      let hour = date.getHours();
      console.log(hour);
    res.render("user.ejs", { data,hour,message:req.flash("create"),message2:req.flash("delete")});
  } else {
      throw new Error("User does not found");
  }
  }
  catch(e){
    res.redirect("/login");
  }
 
});

// Create Notes new route
app.get("/create/:id", async (req, res) => {
  const {id}= req.params;
  try {
    const data = await User.findOne({ _id: { $eq: id } });
    if (data) {
       res.render("createNotes.ejs",{id});
    } else {
      throw new Error("User does not found");
    }
  }
  catch (e) {
    res.redirect("/login");
  }
});

// Create Notes new route
app.post("/create/:id", async (req, res) => {
  const { id } = req.params;
  const { title, notes } = req.body;
  try {
    const data = await User.findOne({ _id: { $eq: id } });
    if (data) {
      let date = new Date().toLocaleDateString();
   let newNote = new Note(
    {
      title: title,
      content: notes,
      date: date,
    }
  );
    await newNote.save();
    await data.notes.push(newNote);
    let temp = await data.save();
    req.flash("create", "Your note created !");
    res.redirect(`/user/${id}`);
    } else {
      throw new Error("User does not found");
    }
  }
  catch (e) {
    res.redirect("/login");
  }
});

// Read/Seen notes route
app.get("/notepage/:id1/:id2", async (req, res) => {
  let { id1, id2 } = req.params;
  try {
    const data = await Note.findOne({ _id: id2 });
    if (data) {
       console.log(data);
    res.render("notepage.ejs", { d:data,id:id1,message:req.flash("edit")});
    } else {
      throw new Error("Some wrong path request");
    }
   }
  catch (e) {
    res.redirect(`/user/${id1}`);
  }
});

// Edit notes route
app.get("/edit/:id1/:id2", async (req, res) => {
  const {id1, id2 } = req.params;
  try {
    const userData = await User.findOne({ _id: { $eq: id1 } });
    const data = await Note.findOne({ _id: id2 });

    if (userData && data) {
      res.render("edit.ejs",{id:id1,data:data});
    } else {
      throw new Error("Some wrong path request");
    }
  }
  catch (e) {
  res.redirect(`/user/${id1}`);
  }
});

// Edit notes route
app.put("/edit/:id1/:id2", async (req, res) => {
  let { id1, id2 } = req.params;
  let { title, notes } = req.body;
  try {
    const userData = await User.findOne({ _id: { $eq: id1 } });
    const noteData = await Note.findOne({ _id: { $eq: id2 } });
    if (userData && noteData) {
       let data = await Note.updateOne({ _id: { $eq: id2 } }, {title:title,content: notes,date:Date.now()}, {
       new:true
       });
     console.log("edited");
     req.flash("edit","Your notes edited !")
     res.redirect(`/notepage/${id1}/${id2}`);
    } else {
      throw new Error("Some worng path request");
    }
  }
  catch (e) {
    res.redirect(`/user/${id1}`);
  }
  
})

// Delete note route
app.delete("/delete/:id1/:id2", async (req, res) => {
  let { id1, id2 } = req.params;
  try {
    const userData = await User.findOne({ _id: { $eq: id1 } });
    const noteData = await Note.findOne({ _id: { $eq: id2 } });
    if (userData && noteData) {
      let data = await User.updateOne({ _id: id1 }, { $pull: { notes: { _id: id2 } } }); 
      let temp = await Note.findByIdAndDelete({ _id: id2 });
      req.flash("delete","Your note deleted !")
      res.redirect(`/user/${id1}`);
    } else {
      throw new Error("Some wrong request");
    }
  }
  catch (e) {
   res.redirect(`/user/${id1}`);
  }
});

// Privecy page route
app.get("/previcy", async (req, res) => {
  try {
    res.render("previcy.ejs");
  }
  catch (e) {
    res.redirect("/");
  }
});

// trem page route
app.get("/term", async (req, res) => {
  try {
    res.render("term.ejs");
  }
  catch (e) {
    res.redirect("/");
  }
});

// help page route
app.get("/help", async (req, res) => {
  try {
    res.render("help.ejs");
  }
  catch (e) {
    res.redirect("/");
  }
});
app.post("/help", async (req, res) => {
  let { email, help } = req.body;
  try {
    let newHelp = new Help(
      {
        email: email,
        help: help,
      }
    );
    const data = await newHelp.save();
    console.log(data);
    res.redirect("/help");
  }
  catch (e) {
    res.redirect("/");
  }
  
})

app.listen(port, () => {
  console.log(`Listening the port ${port}`);
})