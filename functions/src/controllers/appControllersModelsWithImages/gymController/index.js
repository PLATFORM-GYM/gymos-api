const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const create = require('./create');
const read = require('./read');
const update = require('./update');
const remove = require('./remove');
const search = require('./search');
const summary = require('./summary');
const listAll = require('./listAll');
const paginatedList = require('./paginatedList');

function modelController() {
  const Model = mongoose.model('Gym'); // Use the Gym model
  const methods = createCRUDController('Gym'); // Initialize CRUD operations for Gym

  // Overriding default methods or adding new ones with custom implementations
  methods.create = (req, res) => create(Model, req, res);
  methods.read = (req, res) => read(Model, req, res);
  methods.update = (req, res) => update(Model, req, res);
  methods.delete = (req, res) => remove(Model, req, res);
  methods.search = (req, res) => search(Model, req, res);
  methods.summary = (req, res) => summary(Model, req, res);
  methods.listAll = (req, res) => listAll(Model, req, res);
  methods.list = (req, res) => paginatedList(Model, req, res);

  return methods;
}

module.exports = modelController();
