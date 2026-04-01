const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const remove = require('./remove');
const update = require('./update');
const create = require('./create');
const search = require('./search');
const paginatedList = require('./paginatedList');

function modelController() {

  const Model = mongoose.model('Membership'); // Use the Gym model
  const methods = createCRUDController('Membership'); // Initialize CRUD operations for Gym

  // Overriding default methods or adding new ones with custom implementations
  methods.create = (req, res) => create(Model, req, res);
  methods.search = (req, res) => search(Model, req, res);
  methods.list = (req, res) => paginatedList(Model, req, res);
  methods.delete = (req, res) => remove(Model, req, res);
  methods.update = (req, res) => update(Model, req, res);
  return methods;
}

module.exports = modelController();
