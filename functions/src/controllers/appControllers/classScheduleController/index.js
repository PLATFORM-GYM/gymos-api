const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const list = async (req, res) => {
  try {
    const ClassSchedule = mongoose.model('ClassSchedule');
    const { gymId, coachId, startDate, endDate } = req.query;

    const filter = { removed: false };
    if (gymId) filter.gymId = gymId;
    if (coachId) filter.coachId = coachId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const result = await ClassSchedule.find(filter).sort({ date: 1, startTime: 1 }).exec();

    return res.status(200).json({
      success: true,
      result,
      message: 'Class schedules retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const ClassSchedule = mongoose.model('ClassSchedule');
    const data = req.body;

    if (!data.gymId || !data.title || !data.startTime || !data.endTime || !data.date) {
      return res.status(400).json({
        success: false,
        message: 'gymId, title, startTime, endTime, and date are required',
      });
    }

    const schedule = await ClassSchedule.create(data);
    return res.status(201).json({ success: true, result: schedule, message: 'Class created successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const ClassSchedule = mongoose.model('ClassSchedule');
    const updated = await ClassSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Class not found' });
    return res.status(200).json({ success: true, result: updated, message: 'Class updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const ClassSchedule = mongoose.model('ClassSchedule');
    const updated = await ClassSchedule.findByIdAndUpdate(req.params.id, { removed: true }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Class not found' });
    return res.status(200).json({ success: true, result: updated, message: 'Class deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const enroll = async (req, res) => {
  try {
    const ClassSchedule = mongoose.model('ClassSchedule');
    const { clientId } = req.body;
    const schedule = await ClassSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Class not found' });

    if (schedule.enrolled.length >= schedule.capacity) {
      return res.status(400).json({ success: false, message: 'Class is full' });
    }

    if (!schedule.enrolled.includes(clientId)) {
      schedule.enrolled.push(clientId);
      await schedule.save();
    }

    return res.status(200).json({ success: true, result: schedule, message: 'Enrolled successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove, enroll };
