exports.migrate = (result) => {
    const membershipData = {};
    membershipData._id = result._id;
    membershipData.name = result.name;
    membershipData.price = result.price;
    membershipData.attendances = result.attendances;
    membershipData.type = result.type;
    membershipData.category = result.category; // Assuming category will be populated with MembershipCategory details
    membershipData.gymId = result.gymId; // Assuming gymId will be populated with Gym details
    membershipData.created = result.created;
    return membershipData;
  };