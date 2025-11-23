import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (userId,res)=>{
    const token = jwt.sign({userId},process.env.JWT_SECRET,{expiresIn:'7d'});

    

    res.cookie('token',token,{
        maxAge:7*24*60*60*1000,
        httpOnly:true,//prevent XSS attack
        secure: false,
        sameSite: "Lax",
    });

    return token;
}