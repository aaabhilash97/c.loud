'use strict';
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const V = require("./validator.js");
const r_utils = require("../utils.js");
const controller = require("../../controllers").upload;

const v_response = r_utils.validatorResponse;
router.post('/', V.upload, v_response, controller.upload);

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.post('/finish', V.upload_finish, v_response, controller.upload_finish);

module.exports = router;