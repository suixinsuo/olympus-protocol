const CentralizedExchange = artifacts.require("CentralizedExchange");
const models = require('../libs/db_helper');
const AWS = require('aws-sdk');

const biboxExchangeId = '0xef9d334ee3e15416314a60312ef616e881c3bfffe4b60b11befc2707c79b7d35';
const eventName = 'PlacedOrder';

const dbUrl = 'mongodb://localhost:27017';
const dbName = 'olymplus';
var sqs = new AWS.SQS();

let sleep = (dur) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, dur)
  })
}

let setup = async () => {
  AWS.config.loadFromPath(__dirname + '/aws.config.dev.json');
  sqs = new AWS.SQS();
  console.log(__dirname + '/aws.config.dev.json')
  await models.setDB(dbUrl, dbName);
}

const QueueConfig = {
  smartContractReceiveQueueUrl: "https://sqs.us-east-2.amazonaws.com/568267030011/contract-event",
  smartContractNotifyQueueUrl: "https://sqs.us-east-2.amazonaws.com/568267030011/contract-notify",
}

function ReceiveMessage() {

  return new Promise((resolve, reject) => {

    let params = {
      QueueUrl: QueueConfig.smartContractNotifyQueueUrl
    }

    sqs.receiveMessage(params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    })
  })
}

function SendEventOrderMessage(e) {
  return new Promise((resolve, reject) => {

    let params = {
      MessageBody: JSON.stringify(e),
      QueueUrl: QueueConfig.smartContractReceiveQueueUrl,
    };

    sqs.receiveMessage(params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    })
  })

}

function erc20ToSmybol(address) {
  let mapping = {
    "0xa4e8c3ec456107ea67d3075bf9e3df3a75823db0": "LOOMETH"
  }
  return mapping[address];
}

let loopFetchPlacedOrderEvents = async () => {

  let fromBlock = await models.getLastBlockHeight(eventName);
  // TODO: use .at(<address>)
  const centralizedInstance = await CentralizedExchange.deployed();

  while (true) {

    let placedOrderEvent = centralizedInstance.PlacedOrder({}, {
      fromBlock: fromBlock + 1,
      toBlock: 'latest'
    });

    let logs = await (async (e) => {
      return new Promise(resolve => {
        e.get((err, logs) => {
          resolve(logs);
        })
      })
    })(placedOrderEvent)
    if (!logs.length) {
      await sleep(1000*10);
      continue
    }
    fromBlock = logs[logs.length - 1].blockNumber;

    for (let i = 0; i < logs.length; i++) {

      let l = logs[i];
      let orderInfo = await centralizedInstance.getOrderInfo(l.args.orderId);

      let e = {
        "contract_address": centralizedInstance.address,
        "transaction_id": l.transactionHash,
        "contract_order_id": l.args.orderId,
        "block_timestamp": 0,
        "action": "NEW",
        "origin_deposit": orderInfo[5],
        "exchange_id": l.args.exchangeId,
        "symbol": erc20ToSmybol[orderInfo[1]],
        "type": "LIMIT",
        "side": "BUY",
        "src_amount": parseFloat(orderInfo[2].toString()),
        "price": parseFloat(orderInfo[3].toString()),
      }

      await SendEventOrderMessage(e);
    }
    await models.setLastBlockHeight(eventName, fromBlock);    
    await sleep(10000*10);
  }
}

let loopFetchNotifyQueueMessage = async() => {

    const centralizedInstance = await CentralizedExchange.deployed();
    while (true) {

        let msg = await ReceiveMessage();
        if (msg.Messages && msg.Messages.length) {

            /*
            {
                "order":
                {
                    "contract_address": "0xbdb5c0b84996de6ebc5ff0c232db4381d40ed3a3",
                    "transaction_id": "0x952ebed58d1fc1e2238232c7f6beb27d2d052bc15f7436ee5ef326783ef8a5ce",
                    "contract_order_id": "1001",
                    "block_timestamp": 0,
                    "action": "",
                    "origin_deposit": "0x605F4607fe99013f976D22e9298B912396970708",
                    "exchange_id": "binance",
                    "symbol": "LOOMETH",
                    "type": "LIMIT",
                    "side": "BUY",
                    "src_amount": 1.2,
                    "price": 0.0313
                },
                "result": 1,
                "info": null
            }
            */

            for(let i = 0; i < msg.Messages.length; i++){

                let info = JSON.parse(msg.Messages[i].Body);
                if(info.corder.contract_address != centralizedInstance.address){
                    continue
                }

                let exchangeId = info.order.exchange_id;
                let owner = ""; // tokenOwner
                let payee = ""; // TODO, from config

                let orderId = info.order.contract_order_id;
                let srcAmountETH = info.info.filled;
                let destCompletedAmount = info.info.amount;

                let result = await centralizedInstance.PlaceOrderCompletedCallback(orderInfo[6], owner, payee, orderId, web3.toWei(srcAmountETH), destCompletedAmount);

            }
        }
        await sleep(1000*5)
    }

}

module.exports = async (callback) => {

    await setup();

    // loopFetchPlacedOrderEvents();
    loopFetchNotifyQueueMessage();

    console.log("quit centralized exchange listen!");

}