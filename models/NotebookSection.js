const mongoose = require('mongoose');

const notebookSectionSchema = new mongoose.Schema({
    section_from: { type: mongoose.Schema.Types.ObjectId, ref: 'Notebook' },
    section_title: String,
    section_category: String,
    section_tags: [String],
    section_color: String,
    section_created: { type: Date, default: Date.now() }
});


module.exports = new mongoose.model('NotebookSection', notebookSectionSchema);