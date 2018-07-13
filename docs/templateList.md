# Template List Documentation

### Introduction

This documentation is to describe component TemplateList.

Template List provides the users all the availale derivative templates including Fund, Index or any other implementations in the future.

### Interface

```javascript
enum TemplateType {
    Fund = 0,
    Index = 1,
    Others = 2
}

function getTemplates(TempalteType _type) public view returns (address[] templateIds);
```

TemplateType enum describes how many types we curretly have for templates, which for now, Fund and Index.

##### Parameters

​ \_type: Template type to filter.

##### Returns

​ An array ontains the addresses of the templates accordingly.

### Example code

The code below shows how to call this function with Web3.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const address = "0x....";
const abi = [];
const contract = web3.eth.contract(abi).at(address);
const type = 0;

contract.getTemplates(type, (err, results) => {
  if (err) {
    return console.error(err);
  }

  // use the template ABI to connect to the addresses and get detailed information.
  console.log(results);
});
```
