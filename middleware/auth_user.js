import User from "../models/user_model.js";




export const verifyUser = async (req,res,next)=>{
    if(!req.session.userId){
        return res.status(401).json({msg:"please log in to yourt account"});
    }
    const user = await User.findOne({
        where:{
            uuid:req.session.userId
        }
    });
    if (!user) return res.status(404).json({msg:"User not  found"});

    req.userId = user.id;
    req.role = user.role;
    next();
}




export const adminOnly = async (req,res,next)=>{
   
    const user = await User.findOne({
        where:{
            uuid:req.session.userId
        }
    });
    if (!user) return res.status(404).json({msg:"User not  found"});
    if (user.role !=="admin") return res.status(403).json({msg:"Access forbiden"});

    next();
}

export const adminOrManagerOnly = async (req, res, next) => {
    const user = await User.findOne({
        where: {
            uuid: req.session.userId
        }
    });

    if (!user) return res.status(404).json({ msg: "User not found" });
    
    if (user.role !== "admin" && user.role !== "manager") {
        return res.status(403).json({ msg: "Access forbidden" });
    }

    next();
};

export const connectedUserOnly = async (req,res,next)=>{
   try {

        const user = await User.findOne({
            where:{
                uuid:req.session.userId
            }
        });

        if (!user) return res.status(404).json({msg:"User not  found"});
        
        if (user.role === "admin") {
            return next();
        }

        if (user.uuid === req.params.id) {
            return next();
        }

        return res.status(403).json({ msg: "Access forbidden" });
    
   } catch (error) {
        return res.status(500).json({ msg: "Internal server error" });

   }
    
}