const express = require('express');

const router = express.Router();
const path = require('path');
const gymController = require('@/controllers/appPublicController/gympublicController');
const clientController = require('@/controllers/appPublicController/clientpublicController');
const membershipController = require('@/controllers/appPublicController/membershippublicController');
const attendanceController = require('@/controllers/appPublicController/attendancepublicController');
const wompiController = require('@/controllers/appControllers/wompiController');
const {  creationStorageUpload } = require('@/middlewares/uploadMiddleware');
const { catchErrors } = require('@/handlers/errorHandlers');

//_______________________________ Public Gyms info _______________________________
router.route('/gym/search').get(catchErrors(gymController.search));
router.route('/gym/:slug').get(catchErrors(gymController.getBySlug));

//_______________________________ Public Wompi Webhook _______________________________
router.route('/wompi/webhook').post(catchErrors(wompiController.webhookHandler));

//_______________________________ Public Payment (gym client checkout) _______________________________
router.route('/payment/gym/checkout').post(catchErrors(wompiController.gymClientCheckout));


//_______________________________ Public Client Register info _______________________________
router.route('/client/create').post(
  creationStorageUpload({ entity: 'client', fieldName: 'photo', fileType: 'image'}),
  catchErrors(clientController.create)
);

//_______________________________ Public Memberships info _______________________________
router.route('/membership/list').get(catchErrors(membershipController.list));
router.route('/membership/search').get(catchErrors(membershipController.search));


//_______________________________ Attendances info _______________________________
router.route('/attendance/create').post(catchErrors(attendanceController.create));


//_______________________________ Public Images_______________________________
router.route('/:subPath/:entity/:id/:directory/:file').get((req, res) => {
  try {
    const { subPath,entity,id, directory, file } = req.params;

    // Log the request for debugging
    console.log(`[INFO] Request received to serve: ${subPath}/${entity}/${id}/${directory}/${file}`);

    // Construct the root path dynamically
    const options = {
      root: path.join(__dirname, `../../public/${subPath}/${entity}/${id}/${directory}`),
    };

    const fileName = file;

    // Send the file to the client
    return res.sendFile(fileName, options, (error) => {
      if (error) {
        console.error(`[ERROR] File not found: ${fileName} in ${options.root}`);
        return res.status(404).json({
          success: false,
          result: null,
          message: `We could not find the requested file: ${file}`,
        });
      } else {
        console.log(`[INFO] File served successfully: ${fileName}`);
      }
    });
  } catch (error) {
    console.error(`[ERROR] Server error: ${error.message}`);
    return res.status(503).json({
      success: false,
      result: null,
      message: `Server error: ${error.message}`,
      error: error,
    });
  }
});


module.exports = router;
