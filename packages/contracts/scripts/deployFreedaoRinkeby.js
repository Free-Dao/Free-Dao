// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  const host = "0xeD5B5b32110c3Ded02a07c8b8e97513FAfb883B6";
  const DAIx = "0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90";

  const accounts = await hre.ethers.getSigners();
  const gasLessMinter = accounts[0].address;
  console.log("Address?", gasLessMinter);
  const name = "freedao";
  const symbol = "FREEDAO";
  const baseURI = "https://google.com";

  // We get the contract to deploy
  const Freedao = await hre.ethers.getContractFactory("Freedao");
  const freedao = await Freedao.deploy(
    gasLessMinter,
    name,
    symbol,
    baseURI,
    host,
    DAIx
  );
  console.log("Freedao deployed to:", freedao.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
