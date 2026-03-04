const questionService = require('../repo/questionService');
const quizService = require('../repo/quizService');




const getAllQuestionOfAQuiz = async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const question = await questionService.getAllQuestionOfAQuiz(quizId);

        res.status(200).json(question);
    }
    catch (e) {
        res.status(500).json({ message: e.message })
    }
}

const getAllQuestion = async (req, res) => {
    try {
        const question = await questionService.getAllQuestion();
        res.status(200).json(question);
    }
    catch (e) {
        res.status(500).json({ message: e.message })
    }
}

const getQuestionById = async (req, res) => {
    try {
        const questionId = req.params.questionId
        const quizId = req.params.quizId

        const quiz = await quizService.getQuizById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const flag = quiz.questions.includes(questionId);
        if (!flag) {
            return res.status(404).json({ message: 'Question not found in this quiz' });
        }

        const question = await questionService.getQuestionById(questionId);
        res.status(200).json(question);
    }
    catch (e) {
        res.status(500).json({ message: e.message })
    }
}

const deleteQuestionById = async (req, res) => {
    try {
        const user = req.params.user;

        console.log(user)
        
        const questionId = req.params.questionId
        const quizId = req.params.quizId

        const quiz = await quizService.getQuizById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const flag = quiz.questions.includes(questionId);
        if (!flag) {
            return res.status(404).json({ message: 'Question not found in this quiz' });
        }
        const que = await questionService.getQuestionById(questionId);

        console.log(!que.author.equals(user._id) || !user.admin)

        if(!que.author.equals(user._id)){
            console.log("not equal user id")
            if(!user.admin){
                console.log("is not admin")
                res.status(401).json({message: 'Unauthorized access'});
                return;
            }
        }

        

        const question = await questionService.deleteQuestionById(questionId);

        await quizService.removeQuestionFromQuiz(quizId, question._id);

        res.status(200).json({ message: "Question successfully delete" });
    }
    catch (e) {
        res.status(500).json({ message: e.message })
    }
}

const updateQuestionById = async (req, res) => {
    try {
        const user = req.params.user;
        const questionId = req.params.questionId;
        const quizId = req.params.quizId;

        console.log(user)
        const quiz = await quizService.getQuizById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const flag = quiz.questions.includes(questionId);
        if (!flag) {
            return res.status(404).json({ message: 'Question not found in this quiz' });
        }

        const que = await questionService.getQuestionById(questionId);

        console.log(que.author)


        if(!que.author.equals(user._id)){
            console.log("not equal user id")
            if(!user.admin){
                console.log("is not admin")
                res.status(401).json({message: 'Unauthorized access'});
                return;
            }
        }

        const question = await questionService.updateQuestionById(questionId, req.body);
        res.status(200).json({ message: "Question successfully update", question });
    }
    catch (e) {
        res.status(500).json({ message: e.message })
    }
}

const createQuestion = async (req, res) => {
    try {
        const user = req.params.user;
        const quizId = req.params.quizId;
        if(Array.isArray(req.body)){
            req.body.forEach(q =>{
                q.author = user.id;
            })
        }else{
          req.body.author = user._id;
        }
        const quiz = await quizService.getQuizById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const question = await questionService.createQuestion(req.body);

        if(Array.isArray(question)){
            question.forEach(que => {
                quizService.addQuestionToQuiz(quizId, que._id);
            });
        }

        await quizService.addQuestionToQuiz(quizId, question._id)

        res.status(200).json({ message: "Question successfully create", question });
    }
    catch (e) {
        res.status(500).json({ message: e.message })
    }
}





module.exports = {
    getAllQuestionOfAQuiz,
    getAllQuestion,
    getQuestionById,
    createQuestion,
    deleteQuestionById,
    updateQuestionById
}