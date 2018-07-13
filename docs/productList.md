# Product List Documentation

### Introduction

This documentation is to describe component Product List.

Product List provides a list of available derivatives that has been published into it, allowing the derivatives owner to keep track of his own products
and making them available to other people.

### Interface

```javascript
    address[] public products;
    mapping(address => address[]) public productMappings;

    function getAllProducts() external view returns (address[] allProducts);
    function registerProduct() external returns(bool success);
    function getOwnProducts() external view returns (address[] addresses);

    event Registered(address product, address owner);
```

The interface list allow us to see the product list and the product by owner arrays. As well as provide the functionality for providing
to the client the capability of registering and retrieving the full array of own products or all products.

### Register Product

```javascript
    function registerProduct() external returns(bool success);
```

Only derivatives can register themself, this function is to be called inside the derivative, and not by the javascript client. Register product
will add your product in the list and will map this product with the owner of the derivative (using the Ownable interface that derivatives are implementing).

This function is eventually been call on the initialize phase of the derivative.

##### Returns

Will return true or revert.
Products can be registered twice, in case of a second attempt of registering it will revert the function.
In case of a successful transaction using register, the registered event will be fire with the address of the product and the creator.

### Example code

This function is not to be called from javascript, but from solidity

```solidity
        MarketplaceInterface(getComponentByName(MARKET)).registerProduct();
```

### Get Own Products

```javascript
    function getOwnProducts() external view returns (address[] addresses);
```

Get own products will return the list of derivatives published by the address who is calling the function.

##### Returns

A array with the addresses of the derivatives published, empty array if the caller hasn't publish any address.

#### Example code

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const address = "0x....";
const abi = [];
const contract = web3.eth.contract(abi).at(address);

contract.getOwnProducts((err, results) => {
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

Get a list of all products published in this product list.

##### Returns

A array of addresses accordingly

### Registered Event

Registered event will fire each time new product gets registered (NOTE: products can register themself once per market place).

#### Example code

```javascript
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const address = "0x....";
const abi = [];
const contract = web3.eth.contract(abi).at(address);

contract.events.Registered({}, function(error, event) {
  console.log(event);
});
```
