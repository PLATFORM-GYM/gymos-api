const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const search = require('./search');
const getBySlug = require('./getBySlug');

function modelController() {
  const Model = mongoose.model('Gym');
  const methods = createCRUDController('Gym');

  methods.search = (req, res) => search(Model, req, res);
  methods.getBySlug = (req, res) => getBySlug(Model, req, res);
  return methods;
}

module.exports = modelController();
