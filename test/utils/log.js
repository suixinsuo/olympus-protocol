
module.exports = {
  events: (tx) => {
    const logs = tx.logs.map((log) => ({ event: log.event, args: log.args }));
    console.log(JSON.stringify(logs, null, 2));

  }
}
