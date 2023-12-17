const mongoose = require('mongoose');

var listSizeSchema = new mongoose.Schema({
    list_size: [
        {
            name: {
                type: String,
                required: false,

            },
            quantity:
            {
                type: Number,
                required: false,
            },
        },
    ],
    nameSize: String


},
    { timestamps: true }
);

//Export the model
module.exports = mongoose.model('listSize', listSizeSchema);