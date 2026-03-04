const Quiz = require('../schema/quizSchema');
const Question = require('../schema/questionSchema');


const createQuiz = async (data) => {
    if(Array.isArray(data)){
            const quizzes = await Quiz.insertMany(data);
            return quizzes;
        }
    const quiz = new Quiz(data);
    await quiz.save();
    return quiz;
};

const getAllQuiz = async () => {
    return Quiz.find();
}

const getAllQuizPopulated = async () => {
    return Quiz.find().populate('questions');
}

const getQuizById = async (id) => {
    return Quiz.findById(id);
}

const getQuizByIdPopulate = async (id) => {
    return Quiz.findById(id).populate('questions');
}

const deleteQuizById = async (id) => {
    const quiz = await Quiz.findById(id)
    if(quiz && quiz.questions.length !== 0){
        await Question.deleteMany({ _id: { $in: quiz.questions } })
    }
    return Quiz.findByIdAndDelete(id);
}

const updateQuizById = async (id, data) => {
    return Quiz.findByIdAndUpdate(id, data, { new: true });
}

const addQuestionToQuiz = async (quizId, questionId) => {
    return Quiz.findByIdAndUpdate(
        quizId,
        { $push: { questions: questionId } },
        { new: true }
    );
}

const removeQuestionFromQuiz = async (quizId, questionId) => {
    return Quiz.findByIdAndUpdate(
        quizId,
        { $pull: { questions: questionId } },
        { new: true }
    );
}

module.exports = {
    createQuiz,
    deleteQuizById,
    getAllQuiz,
    getQuizById,
    updateQuizById,
    getAllQuizPopulated,
    addQuestionToQuiz,
    removeQuestionFromQuiz,
    getQuizByIdPopulate
}