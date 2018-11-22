/*
* This file is to retrieve meta information from contracts and complied json files.
* And to push them to the server by the gitlab ci later on.
* It generates content inside a folder called .temp by default/
*/

const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");

// ensure folder exists
if (!fs.existsSync("./.temp")) {
  fs.mkdirSync("./.temp");
}

const names = ["OlympusBasicFund",
  "OlympusBasicIndex",
  "OlympusFund",
  "OlympusIndex",
  "FutureContract",
  "OlympusFund_Fast",
  "OlympusIndex_Fast",

  "WhitelistProvider",
  "RebalanceProvider",
  "AsyncWithdraw",
  "Marketplace",
  "Locker",
  "ExchangeProvider",
];


const olympusProtocols = ["OlympusBasicFund",
  "OlympusBasicIndex",
  "OlympusFund",
  "OlympusIndex",
  "FutureContract",
  "OlympusFund_Fast",
  "OlympusIndex_Fast",

];
const specialVersionFiles = {
  "OlympusFund_Fast": 'OlympusFund',
  "OlympusIndex_Fast": 'OlympusIndex'

};

const versionRegEx = /version = \"(.*)\"/gi;
const templateListJson = [];

const getPath = (name, version) => {

  if (!fs.existsSync(`./.temp/${name}`)) {
    fs.mkdirSync(`./.temp/${name}`);
  }

  return path.resolve("./.temp", name, version + ".json");
};

const getVersion = (name) => {
  if (!olympusProtocols.find((includeName) => includeName === name)) {
    const version = "latest";
    return version;
  }
  const fileVersionName = specialVersionFiles[name] || name;
  var contract = fs.readFileSync(path.resolve("./contracts/olympusProtocols", fileVersionName + ".sol"));
  const parsed = versionRegEx.exec(contract);
  const version = parsed ? parsed[1] : "default";


  return version;

}

const getType = (name) => {
  if (name.includes("Index")) { return 'Index'; }
  if (name.includes("Future")) { return 'Future'; }
  return 'Fund';
}
names.forEach((name) => {

  const json = require(path.resolve("./build/contracts", name + ".json"));
  const sourceCode = fs.readFileSync(path.resolve("./build/", name + ".sol"))
  const version = getVersion(name);
  const data = {
    contractName: json.contractName,
    type: getType(name),
    abi: json.abi,
    bytecode: json.bytecode,
    version,
    sourceCode: Buffer.from(sourceCode).toString('base64')
  };


  const jsonData = JSON.stringify(data, null, 2);
  if (olympusProtocols.find((includeName) => includeName === name)) { templateListJson.push(data) };


  fs.writeFile(getPath(name, version), jsonData, err => {
    if (err) {
      return console.error(err);
    }
    // Override the previus latest
    fs.writeFile(getPath(name, "latest"), jsonData, () => {
      console.log(`${name}-v${version} renamed to latest.json.`);
    });
    console.log(`${name}-v${version} created.`);
  });
});
// Completed
fs.writeFile(path.resolve("./.temp/templateList.json"), JSON.stringify(templateListJson, null, 2), () => {
  console.log("templateList.json created.");
});

