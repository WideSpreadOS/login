const mongoose = require('mongoose');


const QuizSchema = new mongoose.Schema({
    forClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class'},
    questions: [
        {
            question: String,
            options: [String],
            answer: Number,
            difficulty: Number
        }
    ],
    score: Number
});

const Quiz = mongoose.model('Quiz', QuizSchema);

module.exports = Quiz;