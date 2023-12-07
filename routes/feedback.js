// import express, { Router } from "express";
// import { createFeedback, getFeedback, getFeedbacks, removeFeedback, updateFeedback } from "../controllers/feedback";
const router = require('express').Router()
const ctrls = require('../controllers/feedback')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')



router.post("/", ctrls.getFeedbacks)
router.post("/feedback", ctrls.createFeedback)
router.put("/feedback/:id", ctrls.updateFeedback)
router.delete("/feedback/:id", ctrls.removeFeedback)
router.get("/feedback/:id", ctrls.getFeedback)

module.exports = router