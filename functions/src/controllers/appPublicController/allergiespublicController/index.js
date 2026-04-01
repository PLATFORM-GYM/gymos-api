const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const create = require('./create');
const search = require('./search');
const paginatedList = require('./paginatedList');

function modelController() {

  const Model = mongoose.model('Allergies'); // Use the Gym model
  const methods = createCRUDController('Allergies'); // Initialize CRUD operations for Gym

  // Overriding default methods or adding new ones with custom implementations
  methods.search = (req, res) => search(Model, req, res);
  methods.create = (req, res) => create(Model, req, res);
  methods.list = (req, res) => paginatedList(Model, req, res);
  return methods;
}

module.exports = modelController();
