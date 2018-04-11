// Import config
const config = require('../config');
const logger = config.logger.logger;

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const mongooseIntlPhoneNumber = require('mongoose-intl-phone-number');

const Schema = mongoose.Schema;


mongoose.connect(process.env.MONGODB, {useMongoClient: true }, function(error){
    if(error){
        logger.error("Mongodb connection error: ", error);
    }else{
        logger.log("Mongodb connected");
    }
});


/**************** merchants  Scema **************************/
const merchantSchema = new Schema({
    merchantId: { type: String, required: true },
    domain: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

merchantSchema.index({ merchantId: 1}, {unique: true});
merchantSchema.index({ domain: 1}, {unique: true});

/**************** merchants  Scema **************************/



/**************** Files Scema **************************/
const filesSchema = new Schema({
    userId: { type: String, required: true },
    filePath: { type: String, required: true },
    fileHash: { type: String, required: true },
    versionHash: { type: String, required: true },
    resourceType: { type: String, required: true, default: "file" },
    fileIdentifier: { type: String, required: true },
    size: { type: Number, required: true },
    lastModified: { type: Number, required: true },
    type: { type: String, required: true },
    active: { type: Boolean, required: true, default: false },
    properties: {type: Object, default:{}},
    createdAt: { type: Date, default: Date.now },
    hashVerified: { type: Boolean, required: true, default: false }
});

filesSchema.index({ userId: 1, filePath: -1, versionHash: -1 }, {unique: true});
filesSchema.index({fileHash: 1});
/**************** Files Scema **************************/


/**************** Pending Files Scema **************************/
const pendingFilesSchema = new Schema({
    userId: { type: String, required: true },
    uploadId: { type: String, required: true },
    file: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now }
});

pendingFilesSchema.index({ userId: 1, uploadId: -1 }, {unique: true});

/**************** Pending Files Scema **************************/



/**************** Users Scema **************************/
const usersSchema = new Schema({
    merchantId: { type: String, required: true },
    userId: { type: String, required: true , unique: true},
    email: { type: String, required: true},
    secondaryEmail: { type: String},
    phoneNumber: { type: String},
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

usersSchema.plugin(mongooseIntlPhoneNumber, {
    hook: 'validate',
    phoneNumberField: 'phoneNumber',
    nationalFormatField: 'nationalFormat',
    internationalFormat: 'internationalFormat',
    countryCodeField: 'countryCode',
});

usersSchema.index({ merchantId: 1, userId: -1 }, {unique: true});
usersSchema.index({ merchantId: 1, email: -1 }, {unique: true});
usersSchema.index({ merchantId: 1, secondaryEmail: -1 }, {unique: true});
usersSchema.index({ merchantId: 1, phoneNumber: -1 }, {unique: true});

/**************** users Scema **************************/



/**************** Sync Scema **************************/
const syncSchema = new Schema({
    userId: { type: String, required: true },
    filePath: { type: String, required: true },
    old_filePath: { type: String },
    event: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

syncSchema.index({ userId: 1, filePath: -1}, {unique: true});

/**************** Sync Scema **************************/




/**************** Activity Scema **************************/

const activitySchema = new Schema({
    userId: { type: String, required: true },
    filePath: { type: String, required: true },
    old_filePath: { type: String },
    event: { type: String, required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

activitySchema.index({ userId: 1, filePath: -1});

/**************** Activity Scema **************************/




/**************** Shares Scema **************************/
const sharesSchema = new Schema({
    merchantId: { type: String, required: true },
    shareId: { type: String, required: true },
    sharedBy: { type: String, required: true },
    filePath: { type: String, required: true },
    sharedWith: { type: String, required: true },
    permissions: { type: Object, required: true , default:{read: true}},
    createdAt: { type: Date, default: Date.now }
});

sharesSchema.index({merchantId: 1, shareId: 1, sharedWith: -1 }, {unique: true});
sharesSchema.index({userId: 1, filePath: -1, sharedWith: -1 }, {unique: true});
/**************** Shares Scema **************************/


const Merchants = mongoose.model('Merchants', merchantSchema);
const Files = mongoose.model('Files', filesSchema);
const Users = mongoose.model('Users', usersSchema);
const Sync = mongoose.model('Sync', syncSchema);
const Activity = mongoose.model('Activity', activitySchema);
const PendFiles = mongoose.model('PendingFiles', pendingFilesSchema);


module.exports = {
    Files,
    Users,
    Sync,
    Activity,
    Merchants,
    PendFiles
};