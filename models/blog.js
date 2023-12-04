const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var blogSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,      
    },
    description:{
        type:String,
        required:true,
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'BlogCategory'
    },
    // luot xem
    numberViews:{
        type:Number,
        default:0,
    },
    
    likes:[
        {
            type:mongoose.Types.ObjectId,
            ref:'User'
        }
    ],
    dislikes:[
        {
            type:mongoose.Types.ObjectId,
            ref:'User'
        }
    ],
    images :[{
        type: Array,
    }],
    //Tac gia bai viet
    author:{
        type:String,
        default :'Admin'
    }
},
    {timestamps:true, toJSON: {virtuals:true}, toObject: {virtuals:true}}
);





//Export the model
module.exports = mongoose.model('Blog', blogSchema);