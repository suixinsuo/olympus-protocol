const Config = require('../libs/bibox_config');
const CentralizedExchange = artifacts.require("CentralizedExchange");
const models = require('../libs/db_helper');

const biboxExchangeId = '0xef9d334ee3e15416314a60312ef616e881c3bfffe4b60b11befc2707c79b7d35';
const eventName = 'PlacedOrder';

const dbUrl = 'mongodb://localhost:27017';
const dbName = 'olymplus';

let sleep = (dur) => { return new Promise(resolve => { setTimeout(() => { resolve(); }, dur) }) }

let setup = async () => {
    await models.setDB(dbUrl, dbName);
}

let loopFetchPlacedOrderEvents = async () => {

    let fromBlock = await models.getLastBlockHeight(eventName);
    // TODO: use .at(<address>)
    const centralizedInstance = await CentralizedExchange.deployed();

    while (true) {

        console.info("fetching placedOrder event from block = ", fromBlock + 1);
        let placedOrderEvent = centralizedInstance.PlacedOrder({}, { fromBlock: fromBlock + 1, toBlock: 'latest' });

        let logs = await (async (e) => { return new Promise(resolve => { e.get((err, logs) => { resolve(logs); }) }) })(placedOrderEvent)
        if (!logs.length) {
            await sleep(1000);
            continue;
        }
        fromBlock = logs[logs.length - 1].blockNumber;

        for (let i = 0; i < logs.length; i++) {
            let l = logs[i];
            let e = new models.BlockEvent();
            e.tx = l.transactionHash;
            e.blockNumber = l.blockNumber;
            e.exchangeId = l.args.exchangeId;
            e.eventName = l.event;
            e.logIndex = l.logIndex;
            e.contractAddress = centralizedInstance.address;
            let adapterOrderId = parseInt(l.args.orderId);
            let eventDoc = await e.insert()
            let orderInfo = await centralizedInstance.getOrderInfo(l.args.orderId);

            let o = new models.AdapterOrder();
            o.blockEventId = eventDoc._id;
            o.adatperOrderId = adapterOrderId;
            o.contract = centralizedInstance.address;
            o.status = parseInt(orderInfo[0].toString());
            o.destTokenAddr = orderInfo[1];
            o.srcAmount = orderInfo[2].toString();
            o.rate = orderInfo[3].toString();
            o.dest = orderInfo[5];
            o.exchangeId = orderInfo[6];
            o.createdAt = new Date().getTime();
            await o.insert();
        }
        await sleep(1000);
    }
}

module.exports = async (callback) => {
    await setup();
    loopFetchPlacedOrderEvents();
    console.log("quit centralized exchange listen!");
}