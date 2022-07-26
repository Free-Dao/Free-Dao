import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import ethers from "ethers";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import serverdbPoolPromise from "./dbPool.js";
import pocAbi from "./pocAbi.js";

function chainIDToProvider(chainID) {
  switch (chainID) {
    case 10:
      return "https://opt-mainnet.g.alchemy.com/v2/QUwxJKOtcZZY5teOJ7EMqb2RNjG-2nXE";
    case 69:
      return "https://opt-kovan.g.alchemy.com/v2/QUwxJKOtcZZY5teOJ7EMqb2RNjG-2nXE";
    case 137:
      return "https://polygon-mainnet.g.alchemy.com/v2/T6fdScSf_Edl3Rwxel0ygxWceNyDV8kX";
    case 4:
      return "https://rinkeby.infura.io/v3/64ccd977c19d4730b461d2de8147dd1e";
  }
}

let pool;

// API v1 url prefix
const BASE_URL_V1 = "/v1/server";

const limiter = rateLimit({
  windowMs: 1000,
  max: 50,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const corsOptions = {
  // origin: process.env.FRONTEND_URL,
  origin: "*",
  optionsSuccessStatus: 200,
};

const app = express();

app.use(cors(corsOptions));
app.use(helmet());
app.use(limiter);

var jsonParser = bodyParser.json();

app.get(`${BASE_URL_V1}/ping`, async (req, res) => {
  res.send("pong");
});

app.post(`${BASE_URL_V1}/savePoc`, jsonParser, async (req, res) => {
  try {
    const { userAddress, chainId, pocAddress } = req.body;
    const decimalChainId = parseInt(chainId, 16);
    await pool.query("INSERT INTO pocs VALUES ?", [
      [[userAddress, decimalChainId, pocAddress]],
    ]);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

app.get(`${BASE_URL_V1}/userPocs`, async (req, res) => {
  try {
    const { userAddr } = req.query;
    const query = await pool.query(
      "SELECT poc_address FROM user_pocs WHERE user_address = ?",
      [userAddr]
    );
    const pocs = query[0].map((e) => e.poc_address);
    res.send(pocs);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

app.get(`${BASE_URL_V1}/allPocs`, async (req, res) => {
  try {
    const query = await pool.query(
      "SELECT DISTINCT poc_address FROM user_pocs"
    );
    const pocs = query[0].map((e) => e.poc_address);
    res.send(pocs);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

app.post(
  `${BASE_URL_V1}/getAllPocsCreatedByUser`,
  jsonParser,
  async (req, res) => {
    // read the request data
    const { userAddr } = req.body;
    const query = await pool.query(
      "SELECT poc_address FROM pocs WHERE creator_address = ?",
      [userAddr]
    );
    res.send(query[0]);
  }
);

app.post(`${BASE_URL_V1}/mint`, jsonParser, async (req, res) => {
  // read the request data
  console.log(req.body);
  const { pocAddress, recipient } = req.body;
  console.log("freedao address and recipient", pocAddress, recipient);
  // select the freedao address in the freedao table
  const pocs = await pool.query("SELECT * FROM pocs WHERE poc_address = ?", [
    pocAddress,
  ]);
  const chainID = parseInt(pocs[0][0].chain_id, 10);
  console.log("chainID?", chainID, pocs[0].chain_id);
  const providerURL = chainIDToProvider(chainID);
  console.log("chainID, provider url", chainID, providerURL);
  const provider = new ethers.providers.JsonRpcProvider(providerURL);
  const pocContract = new ethers.Contract(pocAddress, pocAbi, provider);
  const signer = new ethers.Wallet(process.env.SK, provider);
  let gasPrice = await provider.getGasPrice();
  await pocContract.connect(signer).safeMint(recipient, { gasPrice });
  // save the minted freedao to the userPocs table
  await pool.query("INSERT INTO user_pocs VALUES ?", [
    [[recipient, chainID, pocAddress]],
  ]);
  res.send("minted");
});

// launch server on port 3000
app.listen(3000, async () => {
  dotenv.config();

  pool = await serverdbPoolPromise();

  const providerURL = chainIDToProvider(10);
  const provider = new ethers.providers.JsonRpcProvider(providerURL);
  const signer = new ethers.Wallet(process.env.SK, provider);
  // cors allow all
  const corsOptions = {
    origin: process.env.FRONTEND_URL,
    optionsSuccessStatus: 200,
  };
});
