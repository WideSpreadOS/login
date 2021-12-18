const mongoose = require('mongoose'); 
  
const noteSchema = new mongoose.Schema({ 
    notebook_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Notebook'},
    note_from: {type: mongoose.Schema.Types.ObjectId, ref: 'NotebookSection'},
    note_title: {
        type: String,
        unique: true
    },
    note_tags: [String],
    note_images: [String],
    note_body: String,
    note_references: [String],
    flashcards: [{type: mongoose.Schema.Types.ObjectId, ref: 'Flashcard'}],
    note_created: {type: Date, default: Date.now()}
}); 
  
  
module.exports = new mongoose.model('Note', noteSchema); 