const Question = require('../schema/questionSchema');
const Quiz = require('../schema/quizSchema');


const createQuestion = async (data) => {
    if(Array.isArray(data)){
        const questions = await Question.insertMany(data);
        return questions;
    }
    const question = new Question(data);
    await question.save();
    return question;
};

const getAllQuestion = async () => {
    return Question.find();
}

const getAllQuestionOfAQuiz = async (quizId) => {
    const quiz = await Quiz.findById(quizId).populate('questions');
    return quiz ? quiz.questions : [];
}

const getQuestionById = async (id) => {
    return Question.findById(id);
}

const deleteQuestionById = async (id) => {
    return Question.findByIdAndDelete(id);
}

const updateQuestionById = async (id, data) => {
    return Question.findByIdAndUpdate(id, data, { new: true });
}

module.exports = {
    createQuestion,
    deleteQuestionById,
    getAllQuestion,
    getQuestionById,
    updateQuestionById,
    getAllQuestionOfAQuiz
}