Product List
============

[TOC]

Product List is a storage smart contract that stores the addresses of all initialized funds and indices. Funds and indexes will be stored in the ProductList when the initialize function is executed. The document serves as a guideline to build applications and tools to serve a new rising group of cryptocurrency product creators and investment managers.

Get the productListAddress
--------------------------

To use the Product List, first of all, you will have to get the productListAddress from the ComponentList contract.

#### Example code

> The code below shows how to get the productListAddress with Web3.

``` {.sourceCode .javascript}
const productListName = web3.fromAscii('Marketplace');
const componentListContract = web3.eth.contract(abi)
    .at(componentListAddress);
const productListAddress;
componentListContract.getComponentByName(productListName,
    (err, address)=>{
    if (err) {
        return console.error(err);
    }
    productListAddress = address;
});
```

### Interface

1. getAllProducts
-----------------

``` {.sourceCode .javascript}
function getAllProducts()
    external view returns (address[] allProducts);
```

#### Description

Call this function to get all products (including funds and indexes) that are in the product list.

#### Example code

> The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
    (new Web3.providers.HttpProvider("http://localhost:8545"));
const productListContract = web3.eth.contract(abi)
    .at(productListAddress);

productListContract.getAllProducts((err,productAddresses) => {
    if (err) {
    return console.error(err);
    }
    console.log(productAddresses);
    // We can use the following code to distinguish
    // between index and fund addresses.
    const indexContract = web3.eth.contract(indexAbi)
    .at(productAddresses[0])
    indexContract.fundType((err,fundType)=>{
        if (err) {
        return console.error(err);
        }
        if(fundType == 0){
        // This is an index address.
        }else if (fundType == 1){
        // This is a fund address.
        }else{
        // Unexpected result.
        }

    })
    // Or
    const fundContract = web3.eth.contract(fundAbi)
    .at(productAddresses[0])
    fundContract.fundType((err,fundType)=>{
        if (err) {
        return console.error(err);
        }
        if(fundType == 0){
        // This is an index address.
        }else if (fundType == 1){
        // This is a fund address.
        }else{
        // Unexpected result.
        }
    })
});
```

2. getOwnProducts
-----------------

``` {.sourceCode .javascript}
function getOwnProducts()
    external view returns (address[] addresses);
```

#### Description

Call this function to get a creator's products (including fund and index) that are in the product list.

#### Example code

> The code below shows how to call this function with Web3.

``` {.sourceCode .javascript}
const Web3 = require("web3");
const web3 = new Web3
    (new Web3.providers.HttpProvider("http://localhost:8545"));
const productListContract = web3.eth.contract(abi)
    .at(address);

productListContract.getOwnProducts((err,productAddresses) => {
    if (err) {
    return console.error(err);
    }
    console.log(productAddresses);
});
```

### abi & bytecode

> You can get the [abi & bytecode](../api.html) from our API.

### component list address

> You can get the [componentListAddress](../../pages/deployedaddress.html) from the deployed productAddresses
