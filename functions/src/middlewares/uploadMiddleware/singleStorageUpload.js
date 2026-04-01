const multer = require('multer');
const path = require('path');
const fs = require('fs'); // For creating folders
const { slugify } = require('transliteration');

const fileFilter = require('./utils/LocalfileFilter');

const creationStorageUpload = ({
  entity,
  fileType = 'default',
  uploadFieldName = 'file',
  fieldName = 'file',
}) => {
  var diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      try {
        // Generate a unique ID for the entity
        const uniqueId = Math.random().toString(36).slice(2, 9); // Generates a unique ID of length 7
        req.uniqueId = uniqueId; // Attach the unique ID to the request for later use

        // Define the folder structure
        const entityFolder = `src/public/uploads/${entity}`;
        const uniqueIdFolder = `${entityFolder}/${uniqueId}`;
        const imageFolder = `${uniqueIdFolder}/image`;

        // Ensure the folder structure exists
        fs.mkdirSync(imageFolder, { recursive: true });

        // Pass the image folder as the destination
        cb(null, imageFolder);
      } catch (error) {
        cb(error); // Handle errors
      }
    },
    filename: function (req, file, cb) {
      try {
        // Fetch the file extension
        const fileExtension = path.extname(file.originalname);
        const uniqueFileID = Math.random().toString(36).slice(2, 7); // Generate a unique file ID

        // Generate a clean file name
        let originalname = '';
        if (req.body.seotitle) {
          originalname = slugify(req.body.seotitle.toLocaleLowerCase()); // Convert seotitle to English characters
        } else {
          originalname = slugify(file.originalname.split('.')[0].toLocaleLowerCase()); // Convert original file name
        }

        // Final file name
        const _fileName = `${originalname}-${uniqueFileID}${fileExtension}`;

        // Set the file path in the request for further use
        const filePath = `public/uploads/${entity}/${req.uniqueId}/image/${_fileName}`;
        req.upload = {
          fileName: _fileName,
          fieldExt: fileExtension,
          entity: entity,
          fieldName: fieldName,
          fileType: fileType,
          filePath: filePath,
        };

        req.body[fieldName] = filePath; // Set file path in the request body
        cb(null, _fileName);
      } catch (error) {
        cb(error); // Handle filename errors
      }
    },
  });

  const filterType = fileFilter(fileType);

  // Use the provided uploadFieldName for multer
  return multer({ storage: diskStorage, fileFilter: filterType }).single(uploadFieldName);
};

module.exports = creationStorageUpload;
