'use strict';
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const fileRoutes = require("./file");
const uploadRoutes = require("./upload");


router.use('/upload', uploadRoutes);

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());


router.use('/file', fileRoutes);


module.exports = router;