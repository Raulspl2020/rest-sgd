"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = express_1.Router();
const login_1 = require("../controllers/login");
//====================
//   /login 
//=====================
router.post('/auth', login_1.auth);
router.get('/auth', login_1.googleView);
router.post('/googleauth', login_1.googleAuth);
router.post('/renewtoken', login_1.renewToken);
router.post('/recuperacion', login_1.correoRecuperacion);
router.get('/viewresetpass/:token', login_1.resetPass);
router.post('/savenewpass', login_1.saveNewPass);
exports.default = router;
//# sourceMappingURL=login.js.map