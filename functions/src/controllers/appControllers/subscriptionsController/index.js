const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const create = require('./create');
const update = require('./update');
const remove = require('./remove');
const paginatedList = require('./paginatedList');

function modelController() {
  const Model = mongoose.model('Subscription');
  const methods = createCRUDController('Subscription');

  methods.create = (req, res) => create(Model, req, res);
  methods.update = (req, res) => update(Model, req, res);
  methods.delete = (req, res) => remove(Model, req, res);
  methods.list = (req, res) => paginatedList(Model, req, res);

  return methods;
}

module.exports = modelController();
