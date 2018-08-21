/**
 * @author abhilash.km
 * @description Mongoose schema for c.loud
 */
const config = require('../config');

const mongoose = require('mongoose');
const mongooseIntlPhoneNumber = require('mongoose-intl-phone-number');

mongoose.Promise = global.Promise;
const logger = config.logger.logger;
const Schema = mongoose.Schema;

/**
 * @description Connect to mongodb cluster.
 */
mongoose.connect(process.env.MONGODB, { useMongoClient: true }, function (error) {
    if (error) {
        logger.error("Mongodb connection error: ", error);
    } else {
        logger.log("Mongodb connected");
    }
});


/**************** merchants  Scema **************************/
const merchantSchema = new Schema({
    MerchantId: { type: String, required: true },
    Domain: { type: String, required: true },
    CreatedAt: { type: Date, default: Date.now }
});

merchantSchema.index({ MerchantId: 1 }, { unique: true });
merchantSchema.index({ Domain: 1 }, { unique: true });

/**************** merchants  Scema **************************/



/**************** Files Scema **************************/
const filesSchema = new Schema({
    UserId: { type: String, required: true },
    Owner: { type: String, required: true },
    Parent: { type: String, required: true, default: 'root' },
    Name: { type: String, required: true },
    Hash: { type: String, required: true },
    ResourceType: {
        type: String,
        required: true,
        validate: {
            validator: function (type) {
                return ['file', 'folder'].includes(type);
            },
            message: '{VALUE} is not a valid resource type!'
        },
        default: "file"
    },
    FileIdentifier: { type: String, required: true },
    Size: { type: Number, required: true },
    LastModified: { type: Number, required: true },
    Type: { type: String, required: true },
    Active: { type: Boolean, required: true, default: false },
    Properties: { type: Object, default: {} },
    HashVerified: { type: Boolean, required: true, default: false },
    CreatedAt: { type: Date, default: Date.now },
    ModifiedAt: { type: Date, default: Date.now },
});

filesSchema.index({ UserId: 1, Parent: -1, Name: 1, Hash: -1 }, { unique: true });
filesSchema.index({ Hash: 1 });
/**************** Files Scema **************************/


/**************** Pending Files Scema **************************/
const pendingFilesSchema = new Schema({
    UserId: { type: String, required: true },
    UploadId: { type: String, required: true },
    File: filesSchema,
    FilePath: { type: String, required: true },
    CreatedAt: { type: Date, default: Date.now },
    ModifiedAt: { type: Date, default: Date.now }
});

pendingFilesSchema.index({ UserId: 1, UploadId: -1 }, { unique: true });

/**************** Pending Files Scema **************************/



/**************** Users Scema **************************/
const usersSchema = new Schema({
    MerchantId: { type: String, required: true },
    UserId: { type: String, required: true, unique: true },
    Email: { type: String, required: true, unique: true },
    SecondaryEmail: { type: String, unique: true },
    PhoneNumber: { type: String, unique: true },
    Password: { type: String, required: true },
    CreatedAt: { type: Date, default: Date.now },
    ModifiedAt: { type: Date, default: Date.now }
});

usersSchema.plugin(mongooseIntlPhoneNumber, {
    hook: 'validate',
    phoneNumberField: 'PhoneNumber',
    nationalFormatField: 'nationalFormat',
    internationalFormat: 'internationalFormat',
    countryCodeField: 'countryCode',
});

usersSchema.index({ MerchantId: 1, UserId: -1 }, { unique: true });
usersSchema.index({ MerchantId: 1, Email: -1 }, { unique: true });
usersSchema.index({ MerchantId: 1, SecondaryEmail: -1 }, { unique: true });
usersSchema.index({ MerchantId: 1, PhoneNumber: -1 }, { unique: true });

/**************** users Scema **************************/



/**************** Sync Scema **************************/
const syncSchema = new Schema({
    UserId: { type: String, required: true },
    FileId: { type: String, required: true },
    OldParent: { type: String },
    OldName: { type: String },
    Event: { type: String, required: true },
    CreatedAt: { type: Date, default: Date.now },
    ModifiedAt: { type: Date, default: Date.now }
});

syncSchema.index({ UserId: 1, FileId: -1 }, { unique: true });

/**************** Sync Scema **************************/




/**************** Activity Scema **************************/

const activitySchema = new Schema({
    UserId: { type: String, required: true },
    FileId: { type: String, required: true },
    OldParent: { type: String },
    OldName: { type: String },
    Event: { type: String, required: true },
    Comment: { type: String, required: true },
    CreatedAt: { type: Date, default: Date.now }
});

activitySchema.index({ UserId: 1, FileId: -1 });

/**************** Activity Scema **************************/




/**************** Shares Scema **************************/
const sharesSchema = new Schema({
    UserId: { type: String, required: true },
    ShareId: { type: String, required: true },
    SharedBy: { type: String, required: true },
    FileId: { type: String, required: true },
    SharedWith: { type: String, required: true },
    Permissions: { type: Object, required: true, default: { read: true } },
    CreatedAt: { type: Date, default: Date.now }
});

sharesSchema.index({ UserId: 1, ShareId: 1 }, { unique: true });
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