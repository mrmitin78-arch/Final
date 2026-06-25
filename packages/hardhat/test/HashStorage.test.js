const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HashStorage", function () {
  let HashStorage, hashStorage, owner, addr1;

  before(async () => {
    [owner, addr1] = await ethers.getSigners();
    HashStorage = await ethers.getContractFactory("HashStorage");
    hashStorage = await HashStorage.deploy();
    await hashStorage.waitForDeployment();
  });

  describe("storeHash", function () {
    it("should store a valid hash and emit HashStored", async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await expect(hashStorage.storeHash(hash))
        .to.emit(hashStorage, "HashStored")
        .withArgs(owner.address, hash, (timestamp) => timestamp > 0);
    });

    it("should revert when storing zero hash", async () => {
      await expect(
        hashStorage.storeHash(ethers.ZeroHash)
      ).to.be.revertedWith("Hash cannot be zero");
    });

    it("should revert when storing the same hash twice", async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("unique"));
      await hashStorage.storeHash(hash);
      await expect(
        hashStorage.storeHash(hash)
      ).to.be.revertedWith("Hash already stored");
    });
  });

  describe("isHashStored", function () {
    it("should return false for non-stored hash", async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("unknown"));
      expect(await hashStorage.isHashStored(hash)).to.equal(false);
    });

    it("should return true for stored hash", async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("known"));
      await hashStorage.storeHash(hash);
      expect(await hashStorage.isHashStored(hash)).to.equal(true);
    });
  });

  describe("getHashDetails", function () {
    it("should return correct storer and timestamp", async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("detail"));
      await hashStorage.storeHash(hash);
      const [storer, timestamp] = await hashStorage.getHashDetails(hash);
      expect(storer).to.equal(owner.address);
      expect(timestamp).to.be.gt(0);
    });
  });

  describe("event HashStored", function () {
    it("should emit event with correct parameters", async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("event_test"));
      const tx = await hashStorage.storeHash(hash);
      await expect(tx)
        .to.emit(hashStorage, "HashStored")
        .withArgs(owner.address, hash, await ethers.provider.getBlock("latest").then(b => b.timestamp));
    });
  });
});