// schema for the notes
const noteSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    date:Date,
  },
)
const Note = mongoose.model("Note", noteSchema);
module.exports = Note;