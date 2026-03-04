const User = require('../schema/userSchema');
const UserSchema = require('../schema/userSchema')

const getAllUser = async () =>{
    return await UserSchema.find();
}

const getUserByNameAndPassword = async(user, password) =>{
    return await UserSchema.findOne({'user': user, 'password':password});
}

const getUserById = async(id) =>{
    return await UserSchema.findById(id);
}

const createUser = async(data) =>{
    const user = await new UserSchema(data);
    user.save();
    return user;
}

module.exports = {
    getAllUser,
getUserByNameAndPassword,
createUser,
getUserById
}