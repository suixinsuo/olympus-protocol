var request = require('request');

function shifts(withdrawal, pairs) {
    var result = pairs.map(p => {
        let o = {
            uri: "https://shapeshift.io/shift",
            method: 'POST',
            json: { "withdrawal": withdrawal, "pair": p }
        }

        return new Promise((resolve, reject) => {
            request(o, (error, response, body) => {

                body.pair = p;
                error ? reject(error) : resolve(body);
            })
        })
    });
    return Promise.all(result);
}

function limits(pairs) {
    var pairs_result = pairs.map(function (p) {
        return new Promise((resolve, reject) => {
            request("https://shapeshift.io/limit/" + p, (error, response, body) => {

                if (error) { return reject(error); }
                let obj = JSON.parse(body);
                resolve(obj);
            })
        })
    })
    return Promise.all(pairs_result);
}

module.exports = {

    shifts_limits: (withdraw, pairs) => {

        return new Promise((resolve, reject) => {

            shifts(withdraw, pairs).then(shifts_result => {
                limits(pairs).then(limits_result => {

                    var m = {};
                    limits_result.forEach(l => { m[l.pair] = l; })
                    resolve(shifts_result.map(s => { s.limit = m[s.pair]; return s; }));
                }).catch(reason => {
                    reject(reason);
                });
            })
        })
    }
}