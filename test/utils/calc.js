module.exports = {
  bytes32ToString: bytes32 => {
    return web3.toAscii(bytes32).replace(/\u0000/g, "");
  },

  getRandomDecimals: () => {
    const [min, max] = [3, 18];
    return Math.floor(Math.random() * (max - min + 1) + min);
  },

  roundTo: (value, decimals) => {
    return Math.round(10 ** decimals * value) / 10 ** decimals;
  },

  ethBalance: async address => {
    return parseFloat(web3.fromWei((await web3.eth.getBalance(address)).toNumber(), "ether"), 10);
  },

  fromWei: number => {
    return parseFloat(web3.fromWei(number, "ether"), 10);
  },

  inRange: async (value, range, offset) => {
    return value > range - offset && value < range + offset;
  },

  getEvent: (tx, name) => {
    const results = tx.logs.map(log => ({ event: log.event, args: log.args })).filter(event => event.event === name);
    return results.length;
  },
  assertReverts: async (call, message) => {
    try {
      await call();
      assert(false, "Failed: " + message);
    } catch (e) {
      if (!e.message.includes("revert")) {
        throw e; // Error is not caused by revert but for another reason
      }
      assert(true, message);
    }
  },

  assertInvalidOpCode: async (call, message) => {
    try {
      await call();
      assert(false, "Failed: " + message);
    } catch (e) {
      if (!e.message.includes("invalid opcode")) {
        assert(false, e);
        throw e; // Error is not caused by revert but for another reason
      }
      assert(true, message);
    }
  },

  waitSeconds: async seconds => {
    return new Promise((resolve, reject) => setInterval(() => resolve(), seconds * 1000));
  },

  ethToken: "0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
};
