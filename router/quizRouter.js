const express = require('express');
const router = express.Router();
const quizController = require('../controller/quizController')
const authorizationController = require('../controller/authorizationController')
const questRouter = require('./questionRouter')

// router.get('/', (req,res)=>{
//     res.send("hello, you are at quizzes");
// });

const placeholderFunction = (req, res) => {
    res.json({ message: "link work", })
}

router.get('/', quizController.getAllQuiz)

router.get('/populate', quizController.getAllQuizPopulated)

router.post('/', authorizationController.verifyAdmin ,quizController.createQuiz)

router.get('/:quizId', quizController.getQuizById)

router.get('/:quizId/populate', quizController.getQuizByIdPopulate)

router.put('/:quizId', authorizationController.verifyAdmin ,quizController.updateQuizById)

router.delete('/:quizId', authorizationController.verifyAdmin ,quizController.deleteQuizById)

router.use('/:quizId/question', questRouter)

module.exports = router;