module.exports.clearCollections = async (...modelNames) => {
  for (const name of modelNames) {
    await global[name].deleteMany({});
  }
};
