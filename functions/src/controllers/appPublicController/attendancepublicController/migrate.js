exports.migrate = (result) => {
  const attendanceData = {
    attendanceId: result._id,             // Attendance ID
    checkInTime: result.checkInTime,     // Check-in time
    checkOutTime: result.checkOutTime || null, // Check-out time (if available)
    gym: {
      id: result.gym._id,                // Gym ID
      name: result.gym.name,             // Gym name
    },
    client: {
      id: result.client._id,             // Client ID
      name: result.client.name,          // Client name
    },
    created: result.created,             // Record creation time
  };

  return attendanceData;
};
