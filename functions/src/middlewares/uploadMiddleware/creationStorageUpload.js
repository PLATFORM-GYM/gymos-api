const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { slugify } = require('transliteration');
const { generate: uniqueId } = require('shortid');
const fileFilter = require('./utils/LocalfileFilter');

const customStorageUpload = ({
  entity,
  fileType = 'default',
  uploadFieldName = 'file',
  fieldName = 'file',
}) => {
  var diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      try {
        // Generate a unique ID for the entity folder
        const salt_id = uniqueId();
        req.uniqueId = salt_id; // Attach unique ID to the request object

        // Construct folder paths
        const entityFolderPath = path.resolve(`src/public/uploads/${entity}`);
        const uniqueFolderPath = path.resolve(`${entityFolderPath}/${salt_id}`);
        const imageFolderPath = path.resolve(`${uniqueFolderPath}/image`);

        // Create folders if they don't exist
        if (!fs.existsSync(entityFolderPath)) {
          fs.mkdirSync(entityFolderPath, { recursive: true });
        }
        if (!fs.existsSync(uniqueFolderPath)) {
          fs.mkdirSync(uniqueFolderPath, { recursive: true });
        }
        if (!fs.existsSync(imageFolderPath)) {
          fs.mkdirSync(imageFolderPath, { recursive: true });
        }

        // Set the upload destination to the image folder
        cb(null, imageFolderPath);
      } catch (error) {
        cb(error); // Handle errors during folder creation
      }
    },
    filename: function (req, file, cb) {
      try {
        // Extract file extension and generate a unique filename
        const fileExtension = path.extname(file.originalname);
        const uniqueFileID = Math.random().toString(36).slice(2, 7);

        let originalname = '';
        if (req.body.seotitle) {
          originalname = slugify(req.body.seotitle.toLocaleLowerCase());
        } else {
          originalname = slugify(file.originalname.split('.')[0].toLocaleLowerCase());
        }

        // Create the filename
        const _fileName = `${originalname}-${uniqueFileID}${fileExtension}`;

        // Save the file path in the request object for further use
        const filePath = `public/uploads/${entity}/${req.uniqueId}/image/${_fileName}`;
        req.upload = {
          fileName: _fileName,
          fieldExt: fileExtension,
          entity: entity,
          fieldName: fieldName,
          fileType: fileType,
          filePath: filePath,
        };

        req.body[fieldName] = filePath;

        cb(null, _fileName);
      } catch (error) {
        cb(error);
      }
    },
  });

  // Set up multer's file filtering and storage
  const filterType = fileFilter(fileType);
  const multerStorage = multer({ storage: diskStorage, fileFilter: filterType }).single(uploadFieldName);
  return multerStorage;
};

module.exports = customStorageUpload;
