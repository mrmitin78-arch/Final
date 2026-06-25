module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  await deploy("HashStorage", {
    from: deployer,
    log: true,
  });
};

module.exports.tags = ["HashStorage"];