exports.migrate = (result) => {
  const attendanceData = {};

  attendanceData._id = result._id;
  attendanceData.client = result.client; // Assuming client is populated with Client details
  attendanceData.checkInTime = result.checkInTime;
  attendanceData.checkOutTime = result.checkOutTime || null; // Default to null if checkOutTime is not provided
  attendanceData.created = result.created;

  return attendanceData;
};
