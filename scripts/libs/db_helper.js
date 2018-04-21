const MongoClient = require('mongodb').MongoClient;

const blockEventColl = 'block_events';
const adapterOrderColl = 'adapter_orders';
const biboxOrderColl = 'bibox_orders';

let db;

function BlockEvent() {
    this.tx = '';
    this.eventName = '';
    this.blockNumber = 0;
    this.logIndex = '';
    this.contractAddress = '';
    this.exchangeId = '';
    this.isPlacedOrder = false;
    this.createdAt = 0;
}

BlockEvent.prototype.insert = function () {

    return new Promise((resolve, reject) => {
        db.collection(blockEventColl).insert(this, (e, doc) => {
            if (doc.result && doc.result.ok && doc.result.n === 1) {
                resolve(doc.ops[0]);
                return;
            }
            reject('error insert blockEvents');
        });
    })
}


function AdapterOrder() {
    this._id = null;
    this.blockEventId = null;
    this.adatperOrderId = '';
    this.exchangeId = '';
    this.contract = '';
    this.srcTokenAddr = ''; // always ETH
    this.status = '';
    this.destTokenAddr = ''; // eg. MOT
    this.dest = '';
    this.srcAmount = '';
    this.rate = '';
    this.createdAt = '';
    this.updatedAt = '';
}


AdapterOrder.prototype.insert = function () {

    return new Promise((resolve,reject)=>{
        db.collection(adapterOrderColl).insert(this, (e, doc) => {
            if (doc.result && doc.result.ok && doc.result.n === 1) {
                resolve(doc.ops[0]);
                return;
            }
            reject('error insert adapterOrders')
        });
    })
}

function BiboxOrder() {
    this.orderId = '';
    this.biboxOrderId = '';
    this.id = 159;
    this.createdAt = 1512756997000;
    this.account_type = 0;
    this.coin_symbol = "LTC";
    this.currency_symbol = "BTC";
    this.order_side = 2;
    this.order_type = 2;
    this.price = 0.009;
    this.amount = 1;
    this.money = 0.009;
    this.deal_amount = 0;
    this.deal_percent = "0.00%";
    this.status = 1; //status，1-pending，2-part completed，3-completed，4-part canceled，5-canceled，6-canceling
}

function listNotCompletedBiboxOrders() {

    return new Promise((resolve, reject) => {

        db.collection(biboxOrderColl)
            .find({ status: { $in: [1, 2] } }).limit(100).toArray((err, result) => {
                if (!err) {
                    resolve(result.length ? result[0].blockNumber : -1);
                    return;
                }
                reject(err);
            })
    })

}

function BiboxWithdrawal() {
    this.coin_symbol = '';  // coin symbol，get from transfer/coinList，example：BTC
    this.amount = '';  // withdrawal amount
    this.addr = '';  // withdrawal address
    this.addr_remark = ''; // address remark
}

function getLastBlockHeight(eventName) {

    return new Promise((resolve, reject) => {

        db.collection(blockEventColl)
            .find({ eventName: eventName }).sort({ blockNumber: -1 }).limit(1).toArray((err, result) => {
                if (!err) {
                    resolve(result.length ? result[0].blockNumber : -1);
                    return;
                }
                reject(err);
            })
    })
}

const AdapterOrderStatusPending = 0;

function listPendingAdapterOrders(exchangeId) {

    return new Promise((resolve, reject) => {
        db.collection(adapterOrderColl)
            .find({ exchangeId: exchangeId, status: AdapterOrderStatusPending })
            .sort({ createdAt: 1 })
            .limit(100).toArray((err, result) => {
                resolve(result);
            })
    })
}

let setDB = async (dbUrl, dbName) => {
    db = await (() => {
        return new Promise((resolve, reject) => {
            MongoClient.connect(dbUrl, (err, client) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.info("Connected successfully to db server");
                const db = client.db(dbName);
                resolve(db);
            });
        })
    })()
}

module.exports = { 
    setDB, 
    BlockEvent, 
    AdapterOrder,
    BiboxOrder,
    getLastBlockHeight,
    listPendingAdapterOrders,
    listNotCompletedBiboxOrders,
 }