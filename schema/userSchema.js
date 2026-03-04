const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    user:{
        type: String,
        required:true,
        unique: true
    },
    password:{
        type: String
    },
    admin:{
        type: Boolean
    }
})

const User = mongoose.model("User", UserSchema);

module.exports = User