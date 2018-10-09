const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");

// ensure folder exists
if (!fs.existsSync("./.temp")) {
  fs.mkdirSync("./.temp");
}

const names = ["OlympusBasicFund", "OlympusBasicIndex", "OlympusFund", "OlympusIndex"];
const versionRegEx = /version = \"(.*)\"/gi;
names.forEach(name => {
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

  fs.writeFile(path.resolve("./.temp", name, version + ".json"), JSON.stringify(data, null, 2), err => {
    if (err) {
      return console.error(err);
    }

    console.log(`${name}-v${version} created.`);
  });
});
