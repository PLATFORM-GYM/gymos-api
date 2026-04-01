const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const Gym = mongoose.model('Gym');
const Membership = mongoose.model('Membership');
const Subscription = mongoose.model('Subscription');
const Admin = mongoose.model('Admin');
const AdminPassword = mongoose.model('AdminPassword');
const { generate: uniqueId } = require('shortid');

const create = async (Model, req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gym,
      membership,
      password,
      weight,
      height,
      address,
      postalCode,
      city,
      country,
      birthDate,
      bloodType,
      startDate, 
      endDate,
      nameContactEmergency,
      phoneContactEmergency,
      relationshipContactEmergency,
      photo, // Assuming this is the photo
      medicalConditions,
      allergies,
      dniType, 
      dni
    } = req.body;
    // Validate required fields
    if (!name || !email || !gym || !membership || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, gym ID, and membership.',
      });
    }

    // Check if the client with the same email already exists
    const existingClient = await Model.findOne({ email, removed: false });
    if (existingClient) {
      return res.status(403).json({
        success: false,
        message: 'Client with this email already exists.',
      });
    }

    // Validate gym ID and check if it exists
    if (!ObjectId.isValid(gym)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gym ID.',
      });
    }

    const gymExists = await Gym.findOne({ _id: new ObjectId(gym), removed: false });
    if (!gymExists) {
      return res.status(404).json({
        success: false,
        message: 'The specified gym does not exist.',
      });
    }

    // Validate membership ID
    if (!ObjectId.isValid(membership)) {
      return res.status(400).json({
        success: false,
        message: `Invalid membership ID: ${membership}.`,
      });
    }

    const membershipExists = await Membership.findOne({ _id: new ObjectId(membership) });
    if (!membershipExists) {
      return res.status(404).json({
        success: false,
        message: `Membership with ID ${membership} does not exist.`,
      });
    }

    // Health and emergency contact info
    const healthParams = {
      weight,
      height,
      bloodType,
   
    };

    const emergencyContact = {
      name: nameContactEmergency,
      phone: phoneContactEmergency,
      relationship: relationshipContactEmergency,
    };

    // Address info
    const addressInfo = {
      address,
      postalCode,
      city,
      country,
    };

    // Create the client document
    const clientData = {
      name,
      email,
      phone,
      dniType, 
      dni,
      birthDate: new Date(birthDate),
      healthParams,
      emergencyContact,
      address:addressInfo,
      photo,
      gym: new ObjectId(gym),
      status: 'active',
    };

    const newClient = new Model(clientData);
    const savedClient = await newClient.save();

    const newSubscription = new Subscription({
      client: savedClient._id,
      membership: new ObjectId(membership),
      startDate: startDate,
      endDate: endDate,
      status: 'active',
    });

    const savedSubscription = await newSubscription.save();

    // Link subscription to the client
    savedClient.subscriptions = [savedSubscription._id];
    await savedClient.save();

    // Check if the admin account for this email already exists
    const existingAdmin = await Admin.findOne({ email, removed: false });
    if (!existingAdmin) {
      // If not, create an admin account
      const salt = uniqueId();
      const hashedPassword = new AdminPassword().generateHash(salt, password);

      const adminData = {
        email,
        name,
        role: 'client', // Default role for linked admin accounts
      };
      const savedAdmin = await new Admin(adminData).save();

      const adminPasswordData = {
        password: hashedPassword,
        salt,
        emailVerified: true,
        user: savedAdmin._id,
      };
      await new AdminPassword(adminPasswordData).save();

      // Append the new client's ObjectId to the gym's clients list
      await Gym.updateOne(
        { _id: gym }, // Find the gym by ID
        { $addToSet: { clients: savedAdmin._id } } // Append the client ID to the clients array (avoids duplicates)
      );
    }



    return res.status(201).json({
      success: true,
      result: savedClient,
      message: 'Successfully created the client, associated subscription, and linked admin account.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred during client creation.',
      error: error.message,
    });
  }
};

module.exports = create;
