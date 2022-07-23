const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const PocFactory = await ethers.getContractFactory("PocFactory");
    const Freedao = await ethers.getContractFactory("Freedao");
    const pocfactory = await PocFactory.deploy();
    console.log("pocfactory", pocfactory.address);
    const signers = await ethers.getSigners();
    const admin = signers[0];
    const alice = signers[1];
    const bob = signers[2];
    // console.log(signers[0].address);
    await pocfactory.createPoc(
      admin.address,
      "hello",
      "hello",
      2,
      "https://www.google.com"
    );

    const index = await pocfactory.getLastPocCreatorIndex(admin.address);
    console.log("index", parseInt(index, 16));

    const address = await pocfactory.getPocWithCreatorIndex(
      admin.address,
      index - 1
    );
    console.log("address", address);

    const freedao = await Freedao.attach(address);
    console.log("freedao", freedao.address);
    await expect(freedao.safeMint(alice.address)).to.not.be.reverted;
    await expect(freedao.safeMint(bob.address)).to.be.revertedWith(
      "Max Freedao amount reached"
    );
    // await expect(freedao.safeMint(admin.address)).to.not.be.reverted;
  });
});
