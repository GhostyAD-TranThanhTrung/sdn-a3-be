const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  options: [
    {
         type: String
    }
  ]
  ,
  keywords: [
    {
         type: String
    }
  ],
  correctAnswerIndex:{
        type: Number
  },
  author:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
  }
});

const Question = mongoose.model("Question", questionSchema);
module.exports = Question;
