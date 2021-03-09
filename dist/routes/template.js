"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const template_1 = require("../controllers/template");
const router = express_1.Router();
router.get('/inicio', template_1.vistaHolaMundo);
exports.default = router;
//# sourceMappingURL=template.js.map