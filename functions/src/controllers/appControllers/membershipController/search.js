const { migrate } = require('./migrate');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const search = async (Model, req, res) => {
    try {
        const query = req.query.q || ''; // Get the query string
        const gymId = req.query.gymId; // Optional gymId filter
        const userId = req.admin ? req.admin._id : null; // Optional user ID for permission checks

        // If query is empty or undefined, fallback to gymId filtering
        if (!query.trim()) {
            if (!gymId) {
                return res.status(400).json({
                    success: false,
                    result: [],
                    message: 'Either a query or gymId must be provided.',
                });
            }

            // Validate gymId format
            if (!mongoose.Types.ObjectId.isValid(gymId)) {
                return res.status(400).json({
                    success: false,
                    result: [],
                    message: 'Invalid Gym ID provided.',
                });
            }

            // Query documents by gymId only
            // Build query
            const query = { gymId: new ObjectId(gymId) };

            // Fetch memberships
            const results = await Model.find(query).exec();

            const migratedData = results.map((x) => migrate(x));

            return res.status(results.length > 0 ? 200 : 204).json({
                success: true,
                result: migratedData,
                message: results.length > 0
                    ? 'Successfully found matching memberships.'
                    : 'No matching memberships found.',
            });
        }

        // If query is provided, process it
        const fieldsArray = req.query.fields ? req.query.fields.split(',') : ['name'];
        const searchFields = { $or: [] };

        // Add search conditions for each specified field
        for (const field of fieldsArray) {
            searchFields.$or.push({ [field]: { $regex: new RegExp(query, 'i') } });
        }

        // Build the query object
        const queryObject = {
            ...searchFields,
            removed: false, // Exclude removed items
        };

        // Include gymId in the query if provided
        if (gymId) {
            if (!mongoose.Types.ObjectId.isValid(gymId)) {
                return res.status(400).json({
                    success: false,
                    result: [],
                    message: 'Invalid Gym ID provided.',
                });
            }
            queryObject.gymId = gymId;
        }

        // Execute the search query
        const results = await Model.find(queryObject)
            .limit(20) // Limit results for performance
            .exec();

        const migratedData = results.map((x) => migrate(x));

        return res.status(results.length > 0 ? 200 : 204).json({
            success: true,
            result: migratedData,
            message: results.length > 0
                ? 'Successfully found matching memberships.'
                : 'No matching memberships found.',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            result: [],
            message: 'An error occurred during the search.',
            error: error.message,
        });
    }
};

module.exports = search;
