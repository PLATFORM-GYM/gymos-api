exports.migrate = (result) => {
  const gymData = {};
  gymData._id = result._id;
  gymData.name = result.name;
  gymData.logo = result.logo;
  gymData.email = result.email;
  gymData.address = result.address;
  gymData.contactPhone = result.contactPhone;
  gymData.created = result.created;
  gymData.updated = result.updated;
  gymData.administrators = result.administrators;
  gymData.coaches = result.coaches;
  gymData.clients = result.clients;
  return gymData;
};
