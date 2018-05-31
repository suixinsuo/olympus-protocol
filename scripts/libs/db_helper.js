const MongoClient = require('mongodb').MongoClient;

const blockEventColl = 'block_events';

let db;

function getLastBlockHeight(eventName) {

    return new Promise((resolve, reject) => {

        db.collection(blockEventColl)
            .findOne({ eventName: eventName },(err, result) => {
                if (!err) {
                    resolve(result ? result.blockNumber : -1);
                    return;
                }
                reject(err);
            })
    })
}
function setLastBlockHeight(eventName, blockNumber) {

  return new Promise((resolve, reject) => {
    db.collection(blockEventColl)
    .update({ eventName: eventName }, { "$set": { blockNumber: blockNumber } },{upsert:true}, (err, result) => {
        if(!err){
            resolve(true);
        }else{
            reject(err);
        }
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
    getLastBlockHeight,
    setLastBlockHeight
 }