const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const remove = require('./remove');
const update = require('./update');
const create = require('./create'); // Your custom create function for Attendance
const paginatedList = require('./paginatedList'); // Your paginated list function for Attendance

function modelController() {
  const Model = mongoose.model('Attendance'); // Use the Attendance model
  const methods = createCRUDController('Attendance'); // Initialize CRUD operations for Attendance

  // Override default CRUD methods or add new ones with custom implementations
  methods.create = (req, res) => create(Model, req, res); // Use custom create function
  methods.list = (req, res) => paginatedList(Model, req, res); // Paginated listing of attendance records
  methods.delete = (req, res) => remove(Model, req, res); // Soft delete or hard delete implementation
  methods.update = (req, res) => update(Model, req, res); // Update attendance records

  return methods;
}

module.exports = modelController();
