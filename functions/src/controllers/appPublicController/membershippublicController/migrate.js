exports.migrate = (result) => {
    const membershipData = {};
    membershipData._id = result._id;
    membershipData.name = result.name;
    membershipData.price = result.price;
    membershipData.type = result.type;
    membershipData.category = result.category; 
    return membershipData;
  };