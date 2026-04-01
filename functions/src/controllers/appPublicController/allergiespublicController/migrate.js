exports.migrate = (result) => {
  const allergyData = {
    _id: result._id,
    gymId: result.gymId,
    name: result.name,
  };
  return allergyData;
};
