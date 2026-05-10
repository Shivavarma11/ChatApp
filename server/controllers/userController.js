import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import bcrypt from "bcryptjs";


export const signup = async(req,res)=>{
    const{fullName,email,password,bio}=req.body;

    try {
        if(!fullName || !email || !password || !bio){
            return res.json({success : false,message : "Missing details"});
        }

        const user = await User.findOne({ email });

        if(user){
            return res.json({success : false,message : "User already exist."});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            bio,
        });

        const token = generateToken(newUser._id);

        return res.json({
            success: true,
            userData: newUser,
            token,
            message: "Account created successfully",
        })


    } catch (error) {
        console.log(error.message);
        res.json({success : false,message : error.message});        
    }
}

export const login = async(req,res)=>{
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if(!user){
            return res.json({
                success : false,
                message : "User not registered."
            })
        }

        const isCorrectPassword = await bcrypt.compare(password, user.password);

        if(!isCorrectPassword){
            return res.json({success : false,message : "Invalid credentails"});
        }

        const token = generateToken(user._id);

        res.json({ success: true, userData: user, token, message: "Login successful." });
    } catch (error) {

        console.error(error);
        return res.json({success : false,message: error.message })
        
    }
}


export const checkAuth = (req,res)=>{
    res.json({success:true,user : req.user});
}

export const updatedProfile = async(req,res)=>{
    try {
        const {profilePic,bio,fullName}=req.body;
        const userId = req.user._id;
        let updatedUser;
        if(!profilePic){
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { bio, fullName },
                { returnDocument: 'after' }
            );
        }else{
            const upload = await cloudinary.uploader.upload(profilePic);
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { profilePic: upload.secure_url, bio, fullName },
                { returnDocument: 'after' }
            )
        }
        res.json({success : true,user : updatedUser});

    } catch (error) {
        console.log(error.message);
        res.json({success : false ,message : error.message});
        
    }
}