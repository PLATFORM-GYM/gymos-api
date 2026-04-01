exports.migrate = (result) => {
  const gymData = {};
  gymData._id = result._id;
  gymData.name = result.name;
  gymData.logo = result.logo;
  gymData.email = result.email;
  gymData.address = result.address;
  gymData.contactPhone = result.contactPhone;
  gymData.tagline = result.tagline || result.slogan || '';
  gymData.slug = result.slug || '';
  gymData.description = result.description || '';
  gymData.website = result.website || '';
  gymData.wompiPublicKey = result.wompiPublicKey || '';
  return gymData;
};
