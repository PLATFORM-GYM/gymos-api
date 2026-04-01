exports.migrate = (result) => {
  const subscriptionData = {};

  subscriptionData._id = result._id;
  subscriptionData.client = result.client; // Autopopulated client details
  subscriptionData.membership = result.membership; // Autopopulated membership details
  subscriptionData.startDate = result.startDate;
  subscriptionData.endDate = result.endDate;
  subscriptionData.status = result.status;
  subscriptionData.attendances = result.attendances; // Autopopulated attendance records
  subscriptionData.created = result.created;

  return subscriptionData;
};
