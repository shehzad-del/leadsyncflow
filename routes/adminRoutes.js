let express = require("express");
let router = express.Router();

let requireAuth = require("../middlewares/requireAuth");
let requireSuperAdmin = require("../middlewares/requireSuperAdmin");
let adminController = require("../controllers/adminController");

router.get("/requests/pending", requireAuth, requireSuperAdmin, adminController.getPendingRequests);

router.patch("/requests/:id/approve", requireAuth, requireSuperAdmin, adminController.approveRequest);

router.delete("/requests/:id/reject", requireAuth, requireSuperAdmin, adminController.rejectRequest);

router.patch("/users/:id/make-super-admin", requireAuth, requireSuperAdmin, adminController.makeSuperAdmin);

module.exports = router;

