const express = require('express');
const router = express.Router();
const methodOverride = require('method-override')
const {ensureAuthenticated } = require('../config/auth');
// User Model
const User = require('../models/User');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Flashcard = require('../models/Flashcard');
const Notebook = require('../models/Notebook');
const Note = require('../models/Note');
const NotebookSection = require('../models/NotebookSection');

router.get('/', ensureAuthenticated, async (req, res) => {
    const user = req.user.id;
    const notebooks = await Notebook.find({notebookOwner: {$eq: user}}).populate('notes').exec()
    const thisUser = await User.findById(user);

    res.render('notebook-home', {thisUser, notebooks})
})

router.post('/new', (req, res) => {
    const notebook = new Notebook({
        notebookOwner: req.user.id,
        notebookName: req.body.notebookName,
        notebookDescription: req.body.notebookDescription,
        notebookColor: req.body.notebookColor,
        notebookTags: req.body.notebookTags
    })
    notebook.save()
    res.redirect('/notebooks');
});

router.get('/:notebookId', ensureAuthenticated, async (req, res) => {
    const notebookId = req.params.notebookId
    const notebook = await Notebook.findById(notebookId)
    const sections = await NotebookSection.find({ section_from: { $eq: notebookId } })
    res.render('notebook-single', {notebook, sections})
});

router.get('/:notebookId/edit', ensureAuthenticated, async (req, res) => {
    const notebookId = req.params.notebookId;
    const notebook = await Notebook.findById(notebookId);
    res.render('notebook-edit', { notebook })
});

router.patch('/:notebookId/edit', ensureAuthenticated, async (req, res) => {
    try {
        const notebook = req.params.notebookId;
        const updates = req.body;
        const options = { new: true };
        await Notebook.findByIdAndUpdate(notebook, updates, options);
        res.redirect(`/notebooks/${notebook}`)
    } catch (error) {
        console.log(error);
    }

});

router.delete('/:notebookId', ensureAuthenticated, async (req, res) => {
    const notebookId = req.body.notebook_id
    await Notebook.findByIdAndDelete(notebookId);
    res.redirect(req.get('referer'));

});


router.post('/:notebookId/new/section', ensureAuthenticated, async (req, res) => {
    const notebookId = req.params.notebookId
    const section = new NotebookSection({
        section_from: notebookId,
        section_title: req.body.section_title,
        section_category: req.body.section_category,
        section_color: req.body.section_color,
        section_tags: req.body.section_tags
    })
    section.save()
    res.redirect(req.get('referer'));
});

router.get('/:notebookId/section/:sectionId', ensureAuthenticated, async (req, res) => {
    const notebookId = req.params.notebookId
    const sectionId = req.params.sectionId
    const notebook = await Notebook.findById(notebookId)
    const section = await NotebookSection.findById(sectionId)
    const notes = await Note.find({ note_from: {$eq: sectionId}})
    res.render('notebook-section', {notebook, section, notes})
});

router.post('/:notebookId/section/:sectionId/new/note', async (req, res) => {
    const notebookId = req.params.notebookId;
    const sectionId = req.params.sectionId
    const note = new Note({
        notebook_id: notebookId,
        note_from: sectionId,
        note_title: req.body.note_title,
        note_body: req.body.note_body,
        note_references: req.body.note_references
    })
    note.save()
    res.redirect(req.get('referer'));
});

router.delete('/:notebookId/section/:sectionId/note/:noteId', ensureAuthenticated, async (req, res) => {
    const noteId = req.body.note_id
    await Note.findByIdAndDelete(noteId);
    res.redirect(req.get('referer'));

})

router.get('/:notebookId/section/:sectionId/note/:noteId/edit', ensureAuthenticated, async (req, res) => {
    const notebookId = req.params.notebookId;
    const sectionId = req.params.sectionId;
    const noteId = req.params.noteId;
    const note = await Note.findById(noteId);
    res.render('notebook-section-note-edit', {note, sectionId, notebookId})
});

router.patch('/:notebookId/section/:sectionId/note/:noteId/edit', ensureAuthenticated, async (req, res) => {
    try {
        const notebookId = req.params.notebookId;
        const sectionId = req.params.sectionId;
        const note = req.params.noteId;
        const updates = req.body;
        const options = { new: true };
        await Note.findByIdAndUpdate(note, updates, options);
        res.redirect(`/notebooks/${notebookId}/section/${sectionId}`)
    } catch (error) {
        console.log(error);
    }

});



module.exports = router;