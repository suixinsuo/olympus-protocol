module.exports = {
    parseArgs: () => {
        return process.argv
            .filter((a) => { return a.indexOf("=") > 0 })
            .reduce((objects, a) => {
                let args = a.split('=');
                objects[args[0].replace(/-/g,'')] = args[1];
                return objects;
            }, {});
    }
}
