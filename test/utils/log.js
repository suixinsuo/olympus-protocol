
module.exports = {
  events: (tx) => {
    const logs = tx.logs.map((log) => ({ event: log.event, args: log.args }));
    console.log(JSON.stringify(logs, null, 2));

  },

  catch: async (asycnFunc) => {
    try {
      await asycnFunc();
    } catch (e) {
      console.error('Error on test');
      console.error(e);
      assert(false, 'Exception occured under the test');
    }
  }

}
