const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const search = require('./search');
const paginatedList = require('./paginatedList');

function modelController() {

  const Model = mongoose.model('Membership'); // Use the Gym model
  const methods = createCRUDController('Membership'); // Initialize CRUD operations for Gym

  // Overriding default methods or adding new ones with custom implementations
  methods.search = (req, res) => search(Model, req, res);
  methods.list = (req, res) => paginatedList(Model, req, res);
  return methods;
}

module.exports = modelController();
