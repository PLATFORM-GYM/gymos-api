const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const wompiController = require('@/controllers/appControllers/wompiController');
const classScheduleController = require('@/controllers/appControllers/classScheduleController');
const superAdminController = require('@/controllers/appControllers/superAdminController');

// ─── Wompi Payments ─────────────────────────────────────────────────────────
router.route('/payment/plans').get(catchErrors(wompiController.getPlans));
router.route('/payment/platform/checkout').post(catchErrors(wompiController.platformCheckout));
router.route('/payment/gym/checkout').post(catchErrors(wompiController.gymClientCheckout));

// ─── Class Schedules ─────────────────────────────────────────────────────────
router.route('/classschedule/list').get(catchErrors(classScheduleController.list));
router.route('/classschedule/create').post(catchErrors(classScheduleController.create));
router.route('/classschedule/update/:id').patch(catchErrors(classScheduleController.update));
router.route('/classschedule/delete/:id').delete(catchErrors(classScheduleController.remove));
router.route('/classschedule/enroll/:id').post(catchErrors(classScheduleController.enroll));

// ─── Super Admin ─────────────────────────────────────────────────────────────
router.route('/superadmin/stats').get(catchErrors(superAdminController.getPlatformStats));
router.route('/superadmin/gyms').get(catchErrors(superAdminController.listGyms));
router.route('/superadmin/gym/:id').get(catchErrors(superAdminController.getGymDetail));
router.route('/superadmin/gym/:gymId/clients').get(catchErrors(superAdminController.getGymClients));
router.route('/superadmin/impersonate/:gymId').post(catchErrors(superAdminController.impersonate));
router.route('/superadmin/plans').get(catchErrors(superAdminController.getPlansConfig));
router.route('/superadmin/plans').put(catchErrors(superAdminController.updatePlansConfig));
router.route('/superadmin/subscriptions').get(catchErrors(superAdminController.listGymSubscriptions));
router.route('/superadmin/subscription/:gymId').patch(catchErrors(superAdminController.updateGymSubscription));

module.exports = router;
