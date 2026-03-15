import e from "express";
import Customers from "../models/customer_model.js";

//GET ALL CUSTOMERS
export const getCustomer= async(req,res)=>{
    try{
        const response = await Customers.findAll({
            attributes:['id','uuid','name','email','phone','company']
        });
        res.status(200).json(response);
    } catch(error){
        res.status(500).json({msg:error.message});
    }
}
//GET A CUSTOMER WITH SPECIFIC ID
export const getCustomerById = async(req,res)=>{
    try{
        const response = await Customers.findOne({
            attributes:['id','uuid','name','email','phone','company'],
            where:{
                id:req.params.id
            }
        });
        res.status(200).json(response);
    } catch (error){
        res.status(500).json({ msg:error.message });
    }
}
//CREATE A CUSTOMER
export const createCustomer = async (req, res) => {
    const { name, email, phone, company } = req.body;
    try {
        await Customers.create({
            name: name,
            email: email,
            phone: phone,
            company: company,
        });
        res.status(201).json({ msg: "Customer registered successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};
//UPDATE A CUSTOMER
// export const updateCustomer= async(req,res)=>{
//     const customer = await Customers.findOne({
//         where:{
//             id:req.params.id
//         }
//     });
//     if (!customer) return res.status(404).json({msg:"Customer not  found"});
//     const {name,email,phone,company} = req.body;
//     try{
//         await Customers.update({
//             name:name,
//             phone:phone,
//             email:email,
//             company:company,
//         },{
//             where:{
//                 id:customer.id
//             }
//         });
//         res.status(200).json({msg:"Customer updated Succesfully"});
//     } catch(error){
//         res.status(400).json({msg:error.message});
//     }
// }
// //DELETE A CUSTOMER
// export const deleteCustomer = async(req,res)=>{
//     const customer = await Customers.findOne({
//         where:{
//             id:req.params.id
//         }
//     });
//     if (!customer) return res.status(404).json({msg:"Customer not found"});
//     try{
//         await Customers.destroy({
//             where:{
//                 id:customer.id
//             }
//         });
//         res.status(200).json({msg:"Customer deleted"});
//     } catch(error){
//         res.status(400).json({msg:error.message});
//     }
// }
// UPDATE A CUSTOMER
export const updateCustomer = async (req, res) => {
    try {
        const [rowsUpdated] = await Customers.update(req.body, {
            where: { id: req.params.id },
        });

        if (rowsUpdated === 0) return res.status(404).json({ msg: "Customer not found" });

        res.status(200).json({ msg: "Customer updated successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// DELETE A CUSTOMER
export const deleteCustomer = async (req, res) => {
    try {
        const rowsDeleted = await Customers.destroy({
            where: { id: req.params.id },
        });

        if (rowsDeleted === 0) return res.status(404).json({ msg: "Customer not found" });

        res.status(200).json({ msg: "Customer deleted successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};
