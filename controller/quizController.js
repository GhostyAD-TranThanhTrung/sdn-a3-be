const quizService = require('../repo/quizService');

const getAllQuiz = async (req, res) => {
    try {
        const quiz = await quizService.getAllQuiz();
        if (quiz.length === 0) {
            return res.status(404).json({ message: "There is no quizzes" });
        }
        res.status(200).json(quiz);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
}

const getAllQuizPopulated = async (req, res) => {
    try {
        const quiz = await quizService.getAllQuizPopulated();
        if (quiz.length === 0) {
            return res.status(404).json({ message: "There is no quizzes" });
        }
        res.status(200).json(quiz);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
}

const getQuizById = async (req, res) => {
    try {
        const quizId = req.params.quizId;

        console.log(quizId)

        const quiz = await quizService.getQuizById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found", quizId: quizId });
        }
        res.status(200).json(quiz);
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
}

const getQuizByIdPopulate = async (req, res) => {
    try {
        const quizId = req.params.quizId;

        console.log(quizId)

        const quiz = await quizService.getQuizByIdPopulate(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found", quizId: quizId });
        }
        res.status(200).json(quiz);
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
}

const createQuiz = async (req, res) => {
    try {
        const quiz = await quizService.createQuiz(req.body);
        res.status(201).json({ message: "Quiz create sucessfully", quiz });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
}

const updateQuizById = async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const quiz = await quizService.updateQuizById(quizId, req.body);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json({ message: "Quiz updated successfully", quiz });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
}

const deleteQuizById = async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const quiz = await quizService.deleteQuizById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }
        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
}

module.exports = {
    getAllQuiz,
    getAllQuizPopulated,
    getQuizById,
    createQuiz,
    updateQuizById,
    deleteQuizById,
    getQuizByIdPopulate
}