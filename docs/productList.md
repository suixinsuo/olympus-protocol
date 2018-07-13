# Product List Documentation

### Introduction

This documentation is to describe component Product List.

Product List provides a list of available derivatives that has been published into it, allowing the derivative owners to keep track of their own products.
and making them available to other people.

### Interface

```javascript
    address[] public products;
    mapping(address => address[]) public productMappings;

    function getAllProducts() external view returns (address[] allProducts);
    function getOwnProducts() external view returns (address[] addresses);

    event Registered(address product, address owner);
```

The interface list allows us to see the all products registered and the product list by owner.

### Get Own Products

```javascript
    function getOwnProducts() external view returns (address[] addresses);
```

Get own products will retrieve derivatives in the product list which belong to the caller.

##### Returns

An array with the addresses of the derivatives published, empty array if the caller hasn't published any address.

#### Example code

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const productListAdress = "0x....";
const productListAbi = [];
const productList = web3.eth.contract(productListAbi).at(productListAdress);

productList.getOwnProducts((err, results) => {
  if (err) {
    return console.error(err);
  }
  // use the template ABI to connect to the addresses and get detailed information.
  console.log(results);
});
```

### Get All Products

```javascript
    function getAllProducts() external view returns (address[] allProducts);
```

Get all products published in this product list.

##### Returns

An array of product addresses

#### Example code

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const productListAdress = "0x....";
const productListAbi = [];
const productList = web3.eth.contract(productListAbi).at(productListAdress);

productList.getAllProducts((err, results) => {
  if (err) {
    return console.error(err);
  }
  // use the template ABI to connect to the addresses and get detailed information.
  console.log(results);
});
```

## Get information of the products from the address

Once we get the product addresses we can hit the derivative contract in order to retrieve information.
In this example we will retreive common information that belong to all derivative implementations,
like name and description.

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const productListAdress = "0x....";
const productListAbi = [];
const productList = web3.eth.contract(productListAbi).at(productListAdress);

const derivativeAbi = [];
let derivativeContract;
const derivatives = {}; // Hasmap address => object

productList.getAllProducts((err, derivativeList) => {
  if (err) {
    return console.error(err);
  }
  // use the template ABI to connect to the addresses and get detailed information.
  derivativeList.forEach(derivativeAddress => {
      derivativeContract = web3.eth.contract(derivativeAbi).at(derivativeAddress);

      derivativeContract.name((err, name) => {
        if (err) {
          return console.error(err);
        }
        derivatives[derivativeAddress].name = name;
      });

      derivativeContract.description((err, description) => {
        if (err) {
          return console.error(err);
        }
        derivatives[derivativeAddress].description = description;
      });

      derivativeContract.totalSupply((err, totalSupply) => {
        if (err) {
          return console.error(err);
        }
        derivatives[derivativeAddress].totalSupply = totalSupply.toNumber();
      });

    });
  });
});
```

From a derivative we can get the next list of useful information:

- name: string
- owner: address
- description: string
- status: BigNumber (0: new, 1: active, 2:pause, 3: closed)
- fundType: number (0: fund, 1: index)
- totalSupply: BigNumber Total of derivative tokens delivered
- getPrice: BigNumber
- tokens: Array<address>, list of addresses of the tokens that are in the derivative.
