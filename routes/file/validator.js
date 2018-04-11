// var ranges = [
//   '[^\u0000-\u007F]',
//   '\ud83c[\udf00-\udfff]', // U+1F300 to U+1F3FF
//   '\ud83d[\udc00-\ude4f]', // U+1F400 to U+1F64F
//   '\ud83d[\ude80-\udeff]',  // U+1F680 to U+1F6FF
//   '[A-Za-z\u00C0-\u00FF10-9\\s]',
//   "[\\-\\!\\@\\#\\$\\^\\&\\(\\)\\_\\+\\=\\[\\]\\{\\}\\;\\'\\,]"
// ];
// cv = new RegExp("^(\/(" + ranges.join('|') + ")*)+\/?$", 'g')
const validator = require('validator');
const _ = require('lodash');
const { body } = require('express-validator/check');
var ranges = [
    '[^\u0000-\u007F]',
    '\ud83c[\udf00-\udfff]', // U+1F300 to U+1F3FF
    '\ud83d[\udc00-\ude4f]', // U+1F400 to U+1F64F
    '\ud83d[\ude80-\udeff]', // U+1F680 to U+1F6FF
    '[A-Za-z\u00C0-\u00FF10-9\\s]',
    "[\\-\\!\\@\\#\\$\\^\\&\\(\\)\\_\\+\\=\\[\\]\\{\\}\\;\\'\\,\\.]"
];
const { sanitizeBody } = require('express-validator/filter');

const create = [
    body("filePath").exists().custom(value => {
        let fPath_regex = new RegExp("^(\/(" + ranges.join('|') + ")*)+\/?$", 'g');
        return fPath_regex.test(value);
    }),
    sanitizeBody("filePath"),

    body('fileHash').exists().isMD5(),
    sanitizeBody('fileHash'),

    body("properties").custom((value)=>{
        if(!_.isObject(value)){
            throw new Error("Invalid value for properties.");
        }
        return true;
    }),
    sanitizeBody("properties"),

    body('lastModified').exists().custom((value)=>{
        if(!_.isNumber(value) && value < 0) return false;
        var valid = (new Date(value)).getTime() > 0;
        return valid;
    }),
    sanitizeBody('lastModified'),

    body('size').exists().isByteLength({min: 0, max: 15000000000}),
    sanitizeBody('size'),

    body('type').exists().custom((value)=>{
        return validator.isMimeType(value);
    }),
    sanitizeBody('type')
];


module.exports = {
    create
};