const singleStorageUpload = require('./singleStorageUpload');
const LocalSingleStorage = require('./LocalSingleStorage');
const creationStorageUpload = require('./creationStorageUpload');
const customFromFormStorageUpload = require('./customFromFormStorageUpload');

module.exports = {
  singleStorageUpload,
  creationStorageUpload,
  LocalSingleStorage,
  customFromFormStorageUpload
};
