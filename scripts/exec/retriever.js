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
  return path.resolve("./.temp", name, version + ".json");
};

names.forEach((name, index) => {
  const json = require(path.resolve("./build/contracts", name + ".json"));
  const contract = fs.readFileSync(path.resolve("./contracts/olympusProtocols", name + ".sol"));
  const version = versionRegEx.exec(contract)[1] || "default";
  const data = {
    contractName: json.contractName,
    type: name.indexOf("Index") === -1 ? "Fund" : "Index",
    abi: json.abi,
    bytecode: json.bytecode,
    version
  };

  if (!fs.existsSync(`./.temp/${name}`)) {
    fs.mkdirSync(`./.temp/${name}`);
  }

  const jsonData = JSON.stringify(data, null, 2);
  templateListJson.push(data);

  fs.writeFile(getPath(name, version), jsonData, err => {
    if (err) {
      return console.error(err);
    }

    fs.writeFile(getPath(name, "latest"), jsonData, () => {
      console.log(`${name}-v${version} renamed to latest.json.`);
    });
    console.log(`${name}-v${version} created.`);
  });

  if (index == names.length - 1) {
    fs.writeFile(path.resolve("./.temp/templateList.json"), JSON.stringify(templateListJson, null, 2), () => {
      console.log("templateList.json created.");
    });
  }
});
