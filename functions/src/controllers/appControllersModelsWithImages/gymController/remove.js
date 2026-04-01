const mongoose = require('mongoose');

const QuoteModel = mongoose.model('Quote');
const InvoiceModel = mongoose.model('Invoice');

const remove = async (Model, req, res) => {
  try {
    const { id } = req.params;

    // Check if there are any quotes or invoices associated with the gym
    const resultQuotes = QuoteModel.findOne({
      gym: id,
      removed: false,
    }).exec();

    const resultInvoice = InvoiceModel.findOne({
      gym: id,
      removed: false,
    }).exec();

    const [quotes, invoice] = await Promise.allSettled([resultQuotes, resultInvoice]);

    if (quotes?.value || invoice?.value) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Cannot delete gym if it has associated quotes or invoices.',
      });
    }

    // Soft delete gym by setting the 'removed' flag to true
    const result = await Model.findOneAndUpdate(
      { _id: id, removed: false },
      { removed: true },
      { new: true } // Return the updated document
    ).exec();

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: `No gym found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      result: null,
      message: `Successfully marked gym as removed with ID: ${id}`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, result: null, message: error.message });
  }
};

module.exports = remove;
