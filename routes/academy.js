const express = require('express');
const router = express.Router();

const {ensureAuthenticated } = require('../config/auth');
const axios = require('axios');
// User Model
const User = require('../models/User');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Flashcard = require('../models/Flashcard');
const LearningPoint = require('../models/LearningPoint');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Note = require('../models/Note');
const Notebook = require('../models/Notebook');


router.get('/', ensureAuthenticated, async (req, res) => {
    const user = req.user._id;
    const academyInfo = await User.findById(user).populate({
        path: 'academy_info.current_courses',
        model: 'Course',
        populate: {
            path: 'classes',
            model: 'Class'
        }
    })
        .exec()
        res.render('academy-main', {currentPageTitle: 'Academy Main', academyInfo})
});

router.get('/courses', ensureAuthenticated, async (req, res) => {
    const courses = await Course.find().populate('classes').exec();
    res.render('academy-all-courses', {currentPageTitle: 'All Courses', courses})
});

router.get('/add-course', ensureAuthenticated, (req, res) => {

    res.render('add-course', {currentPageTitle: 'Add New Course'});
});

router.post('/add-course', ensureAuthenticated, (req, res) => {
    const course = new Course({
        courseCreator: req.user._id,
        subject: req.body.subject,
        course: req.body.course,
        difficulty: req.body.difficulty,
        credit_value: req.body.credit_value
    })
    course.save()
    res.redirect('/academy/courses');
})

router.get('/courses/:courseId', ensureAuthenticated, (req, res) => {
    const thisCourse = req.params.courseId;
    const course = Course.findById(thisCourse);
    Course.findById(thisCourse)
    .populate('classes')
    .exec()
    .then(courseData => {
            const courseClasses = Class.find({inCourse: {$eq: thisCourse}});
            Class.find({inCourse: {$eq: thisCourse}});
/*             console.log(`This is the selected course: ${courseData.course}`);
            console.log(`These are the Classes in this Course: ${courseClasses}`); */
            res.render('course-home', {courseData, courseClasses})
        });
})
router.patch('/courses/:courseId/add-course', async (req, res) => {
    const courseId = req.params.courseId;
    const user = req.user._id;

    await User.findByIdAndUpdate(user, 
        {$addToSet: {"academy_info.current_courses": courseId}},
        {safe: true, upsert: true},
        function(err, doc) {
            if(err) {
                console.log(err)
            } else {
                return;
            }
        }
        )
        res.redirect('/academy')
})
router.get('/courses/:courseId/add-class', ensureAuthenticated, async (req, res) => {
    const course = req.params.courseId;
    const courseInfo = await Course.findById(course)
    await Course.findById(course)
    res.render('add-class', {currentPageTitle: 'Add New Class', course, courseInfo});
});

router.post('/:courseId/:classId/new-notebook', ensureAuthenticated, async (req, res) => {
    const courseId = req.params.courseId;
    const classId = req.params.classId;

    const courseData = await Course.findById(courseId);
    const className = await Class.findById(classId);
    const notebook = await new Notebook({
        notebookOwner: req.user.id,
        forClass: classId,
        notebookName: className.name,
        notebookDescription: req.body.notebookDescription,
        notebookImage: courseData.background_image 
    })
    notebook.save()
    res.redirect(`/academy/courses/${courseId}/${classId}`);
})

router.post('/courses/:courseId/add-class', ensureAuthenticated, async (req, res) => {
    const thisCourseId = req.params.courseId;
    const creator = req.user._id;
    const aClass = new Class({
        inCourse: thisCourseId,
        classCreator: creator,
        name: req.body.name,
        description: req.body.description
    })
    aClass.save()
    await Course.findByIdAndUpdate(thisCourseId,
            {$addToSet: {classes: aClass._id}},
            {safe: true, upsert: true},
            function(err, doc) {
                if(err){
                    console.log(err);
                }else{
                    
                    return
                }
            }
            )
            
    
    res.redirect(`/academy/courses/${thisCourseId}`);
});


router.get('/courses/:courseId/:classId', ensureAuthenticated, async (req, res) => {
    const userId = req.user._id;
    const classId = req.params.classId;
    const thisCourseId = req.params.courseId;
    const thisUser = await User.findById(userId);
    const thisClass = await Class.findById(classId);
    const thisCourse = await Course.findById(thisCourseId);
    const courseNotebooks = await Notebook.find({notebookOwner: {$eq: userId}, forClass: {$eq: classId}}).populate('notes').exec()
    const learningPoints = await LearningPoint.find({class: {$eq: classId}})
    const quiz = await Quiz.findOne({forClass: {$eq: classId }})

    res.render('class-page', {currentPageTitle: 'Classroom', learningPoints, thisUser, thisClass, thisCourse, thisCourseId, quiz, courseNotebooks})
        
});


router.post('/:classId/add-learning-point', ensureAuthenticated, (req, res) => {
    const classId = req.params.classId;
    const courseId = req.body.courseId;
    const learningPoint = new LearningPoint({
        class: classId,
        section_header: req.body.section_header,
        section_body: req.body.section_body,
        section_notes: req.body.section_notes,
        difficulty: req.body.difficulty
    })
    
    learningPoint.save()
    res.redirect(`/academy/courses/${courseId}/${classId}`)
});
router.get('/:classId/add-learning-point', ensureAuthenticated, (req, res) => {
    const classId = req.params.classId;
    res.render('academy-add-learning-point')

});

router.post('/:classId/:learningPointId/bookmark', ensureAuthenticated, (req, res) => {
    const user = req.user._id;
    const classId = req.params.classId;
    const learningPointId = req.params. learningPointId;

    User.findByIdAndUpdate(user,
        {$push: {"academy_info.bookmarked_learning_points": learningPointId}},
        {safe: true, upsert: true},
        function(err, doc) {
            if(err){
                console.log(err);
            }else{
                
                return
            }
        }
        )

        res.redirect(req.get('referer'));
})

router.post('/:courseId/:classId/add-quiz', ensureAuthenticated, (req, res) => {
    const courseId = req.body.courseId;
    const classId = req.params.classId;

    const quiz = new Quiz({
        forClass: req.body.classId,

/*             question1: req.body.question1,
            question1_option1: req.body.question1_option1,
            question1_option2: req.body.question1_option2,
            question1_option3: req.body.question1_option3,
            question1_option4: req.body.question1_option4,
            answer1: req.body.answer1,
            difficulty1: req.body.difficulty1,
            question2: req.body.question2,
            question2_option1: req.body.question2_option1,
            question2_option2: req.body.question2_option2,
            question2_option3: req.body.question2_option3,
            question2_option4: req.body.question2_option4,
            answer2: req.body.answer2,
            difficulty2: req.body.difficulty2,
            question3: req.body.question3,
            question3_option1: req.body.question3_option1,
            question3_option2: req.body.question3_option2,
            question3_option3: req.body.question3_option3,
            question3_option4: req.body.question3_option4,
            answer3: req.body.answer3,
            difficulty3: req.body.difficulty3,
            question4: req.body.question4,
            question4_option1: req.body.question4_option1,
            question4_option2: req.body.question4_option2,
            question4_option3: req.body.question4_option3,
            question4_option4: req.body.question4_option4,
            answer4: req.body.answer4,
            difficulty4: req.body.difficulty4,
            question5: req.body.question5,
            question5_option1: req.body.question5_option1,
            question5_option2: req.body.question5_option2,
            question5_option3: req.body.question5_option3,
            question5_option4: req.body.question5_option4,
            answer5: req.body.answer5,
            difficulty5: req.body.difficulty5, */
    })
    quiz.save()
    res.redirect(`/academy/courses/${courseId}/${classId}`)
});

router.get('/:courseId/:classId/:quizId/add', ensureAuthenticated, async (req, res) => {
    const courseId = req.params.courseId;
    const classId = req.params.classId;
    const quizId = req.params.quizId;

    const course = await Course.findById(courseId);
    const thisClass = await Class.findById(classId);
    const quiz = await Quiz.findOne({forClass: {$eq: classId}});


    res.render('create-quiz', {course, thisClass, quiz, quizId});
});

router.patch('/:courseId/:classId/:quizId/add', ensureAuthenticated, async (req, res) => {
    const courseId = req.params.courseId;
    const classId = req.params.classId;
    const quizId = req.params.quizId;
    const questionData = {
        question: req.body.question,
        options: [req.body.option1, req.body.option2, req.body.option3, req.body.option4],
        answer: req.body.answer,
        difficulty: req.body.difficulty
    }
    const updateQuiz = await Quiz.findByIdAndUpdate(quizId,
        {$addToSet: {questions: questionData}},
        {safe: true, upsert: true},
        function(err, doc) {
            if(err) {
                console.log(err)
            } else {
                return
            }
        }
        )
    updateQuiz.save();   
    
    res.redirect(`/academy/${courseId}/${classId}/${quizId}/add`);
});

router.get('/courses/:courseId/:classId/:quizId', ensureAuthenticated, async (req, res) => {
    const user = req.user._id;
    const courseId = req.params.courseId;
    const classId = req.params.classId;
    const quizId = req.params.quizId;

    const quiz = await Quiz.findById(quizId);

    res.render('academy-take-quiz', {quiz})
})
router.post('/:courseId/:classId/:quizId/take-quiz', ensureAuthenticated, (req, res) => {
    const courseId = req.params.courseId;
    const classId = req.params.classId;
    const learningPointId = req.body.learningPointId;
    const quizId = req.body.quizId;

    const newQuizTaken = new Quiz({
        forLearningPoint: req.body.forLearningPoint,
            question1: req.body.question1,
            answer1: req.body.answer1,
            difficulty1: req.body.difficulty1,
            question2: req.body.question2,
            answer2: req.body.answer2,
            difficulty2: req.body.difficulty2,
            question3: req.body.question3,
            answer3: req.body.answer3,
            difficulty3: req.body.difficulty3,
            question4: req.body.question4,
            answer4: req.body.answer4,
            difficulty4: req.body.difficulty4,
            question5: req.body.question5,
            answer5: req.body.answer5,
            difficulty5: req.body.difficulty5,
    })
})
router.post('/:courseId/:classId/add-flashcard', ensureAuthenticated, (req, res) => {
    const classId = req.params.classId;
    const courseId = req.params.courseId;
    const flashcard = new Flashcard({
        class: classId,
        question: req.body.question,
        answer: req.body.answer,
        difficulty: req.body.difficulty
    })
    flashcard.save()
    res.redirect(`/academy/courses/${courseId}/${classId}`)
});

router.get('/:courseId/:classId/flashcards', ensureAuthenticated, async (req, res) => {
    const classId = req.params.classId;
    const courseId = req.params.courseId;
    const thisClass = await Class.findById(classId);
    const thisCourse = await Course.findById(courseId);
    const flashcards = await Flashcard.find({class: {$eq: classId}});
    res.render('flashcards', {currentPageTitle: 'Flashcards', flashcards, thisClass, thisCourse, courseId})

})
router.post('/question', ensureAuthenticated, (req, res) => {
    const question = new Question({
        author: req.user._id,
        question_body: req.body.question_body,
        category: req.body.category,
        resolved: false,
    });
    question.save()
    res.redirect('/dashboard');
})

router.get('/questions', ensureAuthenticated, async (req, res) => {
    const allQuestions = await Question.find({}).populate({
        path: 'author',
        model: 'User'
    })
    .exec()

    res.render('all-questions', {allQuestions});
})

router.get('/question/:questionId', ensureAuthenticated, async (req, res) => {
    const questionId = req.params.questionId;
    const thisQuestion = await Question.findById(questionId).populate('author').populate('answers').exec();
    const answers = await Answer.find({from_question: {$eq: questionId}}).populate('author').exec();
    res.render('single-question', {thisQuestion, answers})

})
router.post('/question/:questionId/answer', ensureAuthenticated, async (req, res) => {
    const questionId = req.params.questionId;
    const answer = new Answer({
        author: req.user._id,
        from_question: questionId,
        answer_body: req.body.answer_body,
        resources: req.body.resources
    });
    answer.save()
    res.redirect(`/academy/question/${questionId}`)

});

router.get('/encyclopedia', (req, res) => {
    /* const searchTerm = req.params.term; */
const options = {
  method: 'GET',
  url: `https://en.wikipedia.org/w/rest.php/v1/search/title?q=learn&limit=50`
};

axios.request(options).then(function (response) {
    const returnedData = response.data;
    console.log(returnedData)
    res.render('encyclopedia', {returnedData});
}).catch(function (error) {
	console.error(error);
});
});

router.post('/encyclopedia/search', (req, res) => {
    const searchTerm = req.body.search;
	const options = {
  method: 'GET',
  url: `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${searchTerm}&limit=50`
};

axios.request(options).then(function (response) {
    const returnedData = response.data;
    console.log(returnedData)
    res.render('encyclopedia', {returnedData});
}).catch(function (error) {
	console.error(error);
});
});

router.get('/encyclopedia/:pageKey', async (req, res) => {
    const pageKey = req.params.pageKey;
	const options = {
  method: 'GET',
  url: `https://en.wikipedia.org/w/rest.php/v1/page/${pageKey}/html`
};
await axios.request(options).then(function (response) {
    const returnedData = response.data;
    console.log(returnedData)
    res.render('encyclopedia-result', {returnedData});
}).catch(function (error) {
	console.error(error);
});
});

router.get('/encyclopedia/images/:pageKey', async (req, res) => {
    const pageKey = req.params.pageKey;
	const options = {
  method: 'GET',
  url: `https://en.wikipedia.org/w/rest.php/v1/page/${pageKey}/links/media`
};
await axios.request(options).then(function (response) {
    const returnedData = response.data;
    console.log(returnedData)
    res.render('encyclopedia-result', {returnedData});
}).catch(function (error) {
	console.error(error);
});
});

module.exports = router;