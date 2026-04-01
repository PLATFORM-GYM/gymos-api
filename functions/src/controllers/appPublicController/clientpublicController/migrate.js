exports.migrate = (client) => {
  if (!client || typeof client !== 'object') {
    throw new Error('Invalid client data');
  }

  const {
    _id,
    name = null,
    email = null,
    phone = null,
    gym = [],
    subscriptions = [],
    status = 'inactive',
    photo = null,
    bloodType = null,
    birthDate = null,
    notes = null,
    healthParams = {},
    address = {},
    emergencyContact = {},
    created = null,
    updated = null,
  } = client;

  // Construct full address safely, handling undefined fields
  const fullAddress = [
    address.streetAddress,
    address.apartmentSuite,
    address.city,
    address.state,
    address.postalCode,
    address.country,
    address.notes,
  ]
    .filter((field) => typeof field === 'string' && field.trim() !== '')
    .join(', ');

  // Ensure health parameters have default values
  const defaultHealthParams = {
    weight: null,
    height: null,
    bodyFatPercentage: null,
    muscleMassPercentage: null,
    restingHeartRate: null,
    maxHeartRate: null,
    allergies: [],
    medicalConditions: [],
  };

  const mergedHealthParams = { ...defaultHealthParams, ...healthParams };

  // Ensure emergency contact has default values
  const defaultEmergencyContact = {
    name: null,
    relationship: null,
    phone: null,
    email: null,
  };

  const mergedEmergencyContact = { ...defaultEmergencyContact, ...emergencyContact };

  return {
    id: _id,
    name,
    email,
    phone,
    gym,
    subscriptions,
    status,
    photo,
    bloodType,
    birthDate,
    notes,
    healthParams: mergedHealthParams,
    address: fullAddress || null, // Return null if address is empty
    emergencyContact: mergedEmergencyContact,
    created,
    updated,
  };
};
