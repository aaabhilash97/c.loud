// var ranges = [
//   '[^\u0000-\u007F]',
//   '\ud83c[\udf00-\udfff]', // U+1F300 to U+1F3FF
//   '\ud83d[\udc00-\ude4f]', // U+1F400 to U+1F64F
//   '\ud83d[\ude80-\udeff]',  // U+1F680 to U+1F6FF
//   '[A-Za-z\u00C0-\u00FF10-9\\s]',
//   "[\\-\\!\\@\\#\\$\\^\\&\\(\\)\\_\\+\\=\\[\\]\\{\\}\\;\\'\\,]"
// ];
// cv = new RegExp("^(\/(" + ranges.join('|') + ")*)+\/?$", 'g')
const { body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const _ = require('lodash');
const validator = require('validator');

const ranges = [
    '[^\u0000-\u007F]',
    '\ud83c[\udf00-\udfff]', // U+1F300 to U+1F3FF
    '\ud83d[\udc00-\ude4f]', // U+1F400 to U+1F64F
    '\ud83d[\ude80-\udeff]', // U+1F680 to U+1F6FF
    '[A-Za-z\u00C0-\u00FF10-9\\s]',
    "[\\-\\!\\@\\#\\$\\^\\&\\(\\)\\_\\+\\=\\[\\]\\{\\}\\;\\'\\,\\.]"
];

const create = [
    body("FilePath").exists().custom(value => {
        let fPathRegex = new RegExp("^(\/(" + ranges.join('|') + ")*)+\/?$", 'g');
        return fPathRegex.test(value);
    }),
    sanitizeBody("FilePath"),

    body('Hash').exists().isMD5(),
    sanitizeBody('Hash'),

    body("Properties").custom((value) => {
        if (!_.isObject(value)) {
            throw new Error("Invalid value for properties.");
        }
        return true;
    }),
    sanitizeBody("Properties"),

    body('LastModified').exists().custom((value) => {
        if (!_.isNumber(value) && value < 0) return false;
        var valid = (new Date(value)).getTime() > 0;
        return valid;
    }),
    sanitizeBody('LastModified'),

    body('Size').exists().isByteLength({ min: 0, max: 15000000000 }),
    sanitizeBody('Size'),

    body('Type').exists().custom((value) => {
        return validator.isMimeType(value);
    }),
    sanitizeBody('Type')
];


module.exports = {
    create
};