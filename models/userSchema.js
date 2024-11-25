const { Note } = require("./noteSchema.js");
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
module.exports = User;