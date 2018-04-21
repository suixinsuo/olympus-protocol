const BIBOX = require('../libs/bibox_api');
const twoFactor = require('node-2fa');
const models = require('../libs/db_helper');
const Config = require('../libs/bibox_config');

BIBOX.config(Config.apiKey, Config.apiSecret);

const dbUrl = 'mongodb://localhost:27017';
const dbName = 'olymplus';

const exchangeId = '0xef9d334ee3e15416314a60312ef616e881c3bfffe4b60b11befc2707c79b7d35';

let setup = async () => {
    await models.setDB(dbUrl, dbName);
}

let sleep = (dur) => { return new Promise(resolve => { setTimeout(() => { resolve(); }, dur) }) }

let loopPlaceOrder = async () => {

    while (true) {
        let orders = await models.listPendingAdapterOrders(exchangeId)
        console.log(events[0]);
        await sleep(1000);

        for (let i = 0; i < orders.length; i++) {
            // TODO:
            let tradeResult = await BIBOX.doTrade({ });
            let biboxOrder = new models.BiboxOrder();
            // TODO:
            biboxOrder.insert();
        }
    }
}

let loopCheckPendingOrder = async () => {

    while (true){
        let orders = await models.listNotCompletedBiboxOrders();
        for (let i = 0; i < orders.length; i++) {
            let o = orders[i];
            let biboxOrder = await BIBOX.getOrder(o.id);
            if (o.status == 1) {
                continue;
            }
            if (o.status == 2) {
                // TODO: check is completed amount changed
            }
        }
    }
}

let loopCheckWithdraw = async () => {

}

function run() { 
    loopPlaceOrder();
    // loopCheckPendingOrder();
    // loopCheckWithdraw();
}

function config(cfg) {
    exchangeId = cfg.exchangeId;
}

module.exports = async ()=>{
    await setup()
    run();
}