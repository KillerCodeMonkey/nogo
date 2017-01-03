const mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    // Authentication
let Authentication = new Schema({
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        token: String,
        platform: String,
        uuid: String,
        secret: {
            type: String,
            required: true
        },
        accessToken: {
            type: String,
            unique: true,
            required: true
        },
        refreshToken: {
            type: String,
            required: true
        },
        creationDate: {
            type: Date,
            'default': Date.now
        },
        data: {}
    }),
    AuthenticationModel = mongoose.model('Authentication', Authentication);

module.exports = {
    model: AuthenticationModel,
    schema: Authentication
};
