const create = async (Model, req, res) => {
    try {
      const { name, gymId } = req.body;
  
      if (!name || !gymId) {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Name and gymId are required',
        });
      }
  
      if (!mongoose.Types.ObjectId.isValid(gymId)) {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Invalid gymId',
        });
      }
  
      const newCondition = new Model({ name, gymId: new mongoose.Types.ObjectId(gymId) });
      const savedCondition = await newCondition.save();
  
      return res.status(201).json({
        success: true,
        result: savedCondition,
        message: 'Successfully created medical condition',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: `An error occurred: ${error.message}`,
      });
    }
  };
  
  module.exports = create;
  