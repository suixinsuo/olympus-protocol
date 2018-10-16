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

const names = ["OlympusBasicFund", "OlympusBasicIndex", "OlympusFund", "OlympusIndex"];
const versionRegEx = /version = \"(.*)\"/gi;
const templateListJson = [];

const getPath = (name, version) => {

  if (!fs.existsSync(`./.temp/${name}`)) {
    fs.mkdirSync(`./.temp/${name}`);
  }

  return path.resolve("./.temp", name, version + ".json");
};

const getVersion = (name) => {
  const contract = fs.readFileSync(path.resolve("./contracts/olympusProtocols", name + ".sol"));
  const version = versionRegEx.exec(contract)[1] || "default";
  return version;
}

names.forEach((name, _index) => {

  const json = require(path.resolve("./build/contracts", name + ".json"));

  const data = {
    contractName: json.contractName,
    type: name.indexOf("Index") === -1 ? "Fund" : "Index",
    abi: json.abi,
    bytecode: json.bytecode,
    version: getVersion(name),
  };


  const jsonData = JSON.stringify(data, null, 2);
  templateListJson.push(data);

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

