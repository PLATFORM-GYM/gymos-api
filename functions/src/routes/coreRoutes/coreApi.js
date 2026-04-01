const express = require('express');
const { generate: uniqueId } = require('shortid');
const { catchErrors } = require('@/handlers/errorHandlers');

const router = express.Router();
const adminController = require('@/controllers/coreControllers/adminController');
const clientController = require('@/controllers/appControllersModelsWithImages/clientController');
const gymController = require('@/controllers/appControllersModelsWithImages/gymController');
const settingController = require('@/controllers/coreControllers/settingController');
const emailController = require('@/controllers/coreControllers/emailController');

const { singleStorageUpload } = require('@/middlewares/uploadMiddleware');
const { creationStorageUpload } = require('@/middlewares/uploadMiddleware');

// //_______________________________ Client management_______________________________
router.route('/client/create').post(
  creationStorageUpload({ entity: 'client', fieldName: 'photo', fileType: 'image' }),
  catchErrors(clientController.create)
);

router.route('/client/list').get(catchErrors(clientController.list));
router.route('/client/listAll').get(catchErrors(clientController.listAll));
// //_______________________________ Admin management_______________________________

router.route('/admin/read/:id').get(catchErrors(adminController.read));
router.route('/admin/create').post(catchErrors(adminController.create));

router.route('/admin/password-update/:id').patch(catchErrors(adminController.updatePassword));

//_______________________________ Admin Profile _______________________________

router.route('/admin/profile/password').patch(catchErrors(adminController.updateProfilePassword));
router
  .route('/admin/profile/update')
  .patch(
    singleStorageUpload({ entity: 'admin', fieldName: 'photo', fileType: 'image' }),
    catchErrors(adminController.updateProfile)
  );

//_______________________________ Gym Management _______________________________
router.route('/gym/create').post(
  creationStorageUpload({ entity: 'gyms', fieldName: 'logo', fileType: 'image'}),

  catchErrors(gymController.create)
);

router.route('/gym/read/:id').get(catchErrors(gymController.read));

router.route('/gym/update/:id').patch(
  singleStorageUpload({ entity: 'gyms', fieldName: 'logo', fileType: 'image' }),
  catchErrors(gymController.update)
);

router.route('/gym/delete/:id').delete(catchErrors(gymController.delete));

router.route('/gym/list').get(catchErrors(gymController.list));

router.route('/gym/listAll').get(catchErrors(gymController.listAll));

// //____________________________________________ API for Global Setting _________________

router.route('/setting/create').post(catchErrors(settingController.create));
router.route('/setting/read/:id').get(catchErrors(settingController.read));
router.route('/setting/update/:id').patch(catchErrors(settingController.update));
//router.route('/setting/delete/:id).delete(catchErrors(settingController.delete));
router.route('/setting/search').get(catchErrors(settingController.search));
router.route('/setting/list').get(catchErrors(settingController.list));
router.route('/setting/listAll').get(catchErrors(settingController.listAll));
router.route('/setting/filter').get(catchErrors(settingController.filter));
router
  .route('/setting/readBySettingKey/:settingKey')
  .get(catchErrors(settingController.readBySettingKey));
router.route('/setting/listBySettingKey').get(catchErrors(settingController.listBySettingKey));
router
  .route('/setting/updateBySettingKey/:settingKey?')
  .patch(catchErrors(settingController.updateBySettingKey));
router
  .route('/setting/upload/:settingKey?')
  .patch(
    catchErrors(
      singleStorageUpload({ entity: 'setting', fieldName: 'settingValue', fileType: 'image' })
    ),
    catchErrors(settingController.updateBySettingKey)
  );
router.route('/setting/updateManySetting').patch(catchErrors(settingController.updateManySetting));

// //____________________________________________ API for Email Templates _________________
router.route('/email/create').post(catchErrors(emailController.create));
router.route('/email/read/:id').get(catchErrors(emailController.read));
router.route('/email/update/:id').patch(catchErrors(emailController.update));
router.route('/email/search').get(catchErrors(emailController.search));
router.route('/email/list').get(catchErrors(emailController.list));
router.route('/email/listAll').get(catchErrors(emailController.listAll));
router.route('/email/filter').get(catchErrors(emailController.filter));

module.exports = router;
