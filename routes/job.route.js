// SIH-Backend/routes/job.route.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');

// POST /api/jobs
router.post('/jobs', jobController.getJobs);

module.exports = router;