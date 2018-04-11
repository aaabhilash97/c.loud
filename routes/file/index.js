'use strict';
const express = require('express');
const router = express.Router();

const V = require("./validator.js");
const r_utils = require("../utils.js");
const controller = require("../../controllers").file;

const v_response = r_utils.validatorResponse;

router.post('/create', V.create, v_response, controller.create);


module.exports = router;