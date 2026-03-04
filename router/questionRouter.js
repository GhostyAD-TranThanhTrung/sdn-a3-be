const express = require('express');
const router = express.Router({ mergeParams: true });
const questionController = require('../controller/questionController')
const authorizationController = require('../controller/authorizationController')


// router.get('/', (req,res)=>{
//     res.send("hello, you are at quizzes");
// });


router.get('/', questionController.getAllQuestionOfAQuiz)

router.post('/', authorizationController.verifyUser, questionController.createQuestion)

router.get('/:questionId', questionController.getQuestionById)

router.put('/:questionId', authorizationController.verifyUser ,questionController.updateQuestionById)

router.delete('/:questionId', authorizationController.verifyUser,questionController.deleteQuestionById)

module.exports = router;