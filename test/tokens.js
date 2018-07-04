const erc20Addresses = [
  0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c
];
const changerAddresses = [
  0x3839416bd0095d97be9b354cbfb0f6807d4d609e
];
const relayAddresses = [
  0x0
];

console.log(
  [
    {
      _id: "5937d635231e97001f744267",
      symbol: "Ξ",
      type: "ethereum",
      code: "ETH",
      details: {
        type: "native",
        contractAddress: "0xc0829421c1d260bd3cb3e0f06cfe2d52db2ce315",
        supply: "7244187237357846184871",
        changer: {
          activatedAt: "2017-06-07T13:34:15.731Z"
        }
      },
      status: "published",
      stage: "traded",
      primaryCommunityImageName: "aea83e97-13a3-4fe7-b682-b2a82299cdf2.png",
      createdAt: "2017-06-07T13:34:15.731Z",
      numDecimalDigits: 18,
      name: "Ethereum",
      order: 4000,
      isDeleted: false,
      lowerCaseSymbol: "ξ",
      lowerCaseCode: "eth"
    },
    {
      _id: "594bb7e468a95e00203b048d",
      symbol: "BNT",
      type: "ethereum",
      details: {
        type: "bancor",
        subType: "smart",
        contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
        supply: "75753325623181407215157498",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x3839416bd0095d97be9b354cbfb0f6807d4d609e",
          isActive: true,
          activatedAt: "2017-06-22T07:00:00.000Z"
        },
        reserves: {
          "5937d635231e97001f744267": {
            contractAddress: "0xc0829421c1d260bd3cb3e0f06cfe2d52db2ce315",
            currencySymbol: "Ξ",
            ratio: 100000,
            numDecimalDigits: 18,
            balance: "50103467618528415660177"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-06-22T07:00:00.000Z",
      numDecimalDigits: 18,
      primaryCommunityId: "5967699a4a93370018b7b891",
      primaryCommunityImageName: "f80f2a40-eaf5-11e7-9b5e-179c6e04aa7c.png",
      code: "BNT",
      name: "Bancor",
      isDeleted: false,
      order: 3000,
      isDiscoverable: true,
      lowerCaseSymbol: "bnt",
      lowerCaseCode: "bnt"
    },
    {
      _id: "5a2cf93be116dc0001fa9406",
      symbol: "STORMBNT",
      type: "ethereum",
      code: "STORMBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xcad4da66e00fdecabec137a24e12af8edf303a1d",
        supply: "271479127940138720414733",
        changer: {
          type: "bancor",
          version: "0.6",
          contractAddress: "0x58b249b613ce917b6ccc2f66787856ef39f4f0b6",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2017-12-18T19:39:32.955Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "249047554177917026022060"
          },
          "5a3800604b02a6ad9f85324f": {
            contractAddress: "0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433",
            currencySymbol: "STORM",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "39390967853549225434082621"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-10T09:07:07.494Z",
      isDeleted: false,
      primaryCommunityId: "5a2cf91793d1f500018b03ef",
      numDecimalDigits: 18,
      name: "Storm Relay",
      primaryCommunityImageName: "cbc749a0-e8a6-11e7-875f-03079c4bb7e5.png",
      isDiscoverable: true,
      lowerCaseSymbol: "stormbnt",
      lowerCaseCode: "stormbnt",
      order: 204
    },
    {
      _id: "5a8b1f1db2b342000166f58d",
      symbol: "NPXS",
      type: "ethereum",
      code: "NPXS",
      details: {
        type: "erc20",
        contractAddress: "0xa15c7ebe1f07caf6bff097d8a589fb8ac49ae5b3",
        supply: "50262607056620970785110269218",
        changer: {
          activatedAt: "2018-06-16T10:29:09.639Z"
        },
        relayCurrencyId: "5a8b1fc9d8670d0001694c80"
      },
      status: "published",
      order: 204,
      stage: "managed",
      isDiscoverable: false,
      createdAt: "2018-02-19T19:01:49.072Z",
      isDeleted: false,
      primaryCommunityId: "5a8b1f010cefca0001207e91",
      numDecimalDigits: 18,
      name: "Pundi X",
      primaryCommunityImageName: "fd84e250-3e45-11e8-b094-85955a15de56.jpeg",
      lowerCaseSymbol: "npxs",
      lowerCaseCode: "npxs"
    },
    {
      _id: "5a3800604b02a6ad9f85324f",
      symbol: "STORM",
      code: "STORM",
      type: "ethereum",
      details: {
        type: "erc20",
        contractAddress: "0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433",
        supply: "10000000000000000000000000000",
        changer: {
          activatedAt: "2017-12-18T19:39:48.044Z"
        },
        relayCurrencyId: "5a2cf93be116dc0001fa9406"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-18T12:31:50.000Z",
      primaryCommunityId: "59eee23eacb3c1fd9ed19eff",
      primaryCommunityImageName: "d4a54d00-b8af-11e7-84b3-dd4458950587.png",
      numDecimalDigits: 18,
      name: "Storm",
      isDeleted: false,
      order: 203,
      isDiscoverable: true,
      lowerCaseSymbol: "storm",
      lowerCaseCode: "storm"
    },
    {
      _id: "5ac0ba43e4c90c81d0378c66",
      symbol: "RVTBNT",
      type: "ethereum",
      code: "RVTBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x5039f60594ffa3f1a5acbe85e1ebe12dc8da7c5c",
        supply: "504650000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x635c9c9940d512bf5cb455706a28f9c7174d307f",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-04-04T22:31:52.023Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "198082181563942134504642",
            numDecimalDigits: 18
          },
          "5a69a9d51b67798dab40b9d7": {
            contractAddress: "0x3d1ba9be9f66b8ee101911bc36d3fb562eac2244",
            currencySymbol: "RVT",
            ratio: 500000,
            balance: "2614037248158065930015580",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-04-01T10:53:55.904Z",
      isDeleted: false,
      primaryCommunityId: "5ac0ba2df17e5100019f3f5d",
      numDecimalDigits: 18,
      name: "Rivetz Relay",
      primaryCommunityImageName: "be857740-3bd9-11e8-8208-adb8418cbb95.png",
      lowerCaseSymbol: "rvtbnt",
      lowerCaseCode: "rvtbnt",
      order: 202
    },
    {
      _id: "5a69a9d51b67798dab40b9d7",
      symbol: "RVT",
      type: "ethereum",
      name: "Rivetz",
      code: "RVT",
      status: "published",
      stage: "traded",
      details: {
        type: "erc20",
        contractAddress: "0x3d1ba9be9f66b8ee101911bc36d3fb562eac2244",
        supply: "200000000000000000000000000",
        changer: {
          activatedAt: "2018-04-04T22:31:00.389Z"
        },
        relayCurrencyId: "5ac0ba43e4c90c81d0378c66"
      },
      numDecimalDigits: 18,
      primaryCommunityImageName: "ad978310-3bd9-11e8-a132-e5d1db607067.png",
      isDeleted: false,
      isDiscoverable: true,
      order: 201,
      createdAt: "2018-01-25T09:56:37.930Z",
      primaryCommunityId: "5ac0b6a6fdb5b6b9ec5010cc",
      lowerCaseSymbol: "rvt",
      lowerCaseCode: "rvt"
    },
    {
      _id: "5b05638440bfe8f52e6258ea",
      symbol: "DBET",
      lowerCaseSymbol: "dbet",
      type: "ethereum",
      code: "DBET",
      lowerCaseCode: "dbet",
      details: {
        type: "erc20",
        contractAddress: "0x9b68bfae21df5a510931a262cecf63f41338f264",
        supply: "184686014555183569949364642",
        changer: {
          activatedAt: "2018-05-30T18:25:34.764Z"
        },
        relayCurrencyId: "5b0565d48c1db4a2fed9a82a"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-23T12:50:12.860Z",
      isDeleted: false,
      primaryCommunityId: "5b05635b794f5d00014c2f5a",
      numDecimalDigits: 18,
      name: "Decent.bet",
      primaryCommunityImageName: "443976e0-5e88-11e8-9952-89831889dec2.png",
      order: 200
    },
    {
      _id: "5b0565d48c1db4a2fed9a82a",
      symbol: "DBETBNT",
      lowerCaseSymbol: "dbetbnt",
      type: "ethereum",
      code: "DBETBNT",
      lowerCaseCode: "dbetbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xfe9e6111e45a6066374bf33e831e80b1949a9faa",
        supply: "482773000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xf4327c919854cb099ac574a22f5fba901e2025c4",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-30T18:25:24.911Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "193797822173239915312554",
            numDecimalDigits: 18
          },
          "5b05638440bfe8f52e6258ea": {
            contractAddress: "0x9b68bfae21df5a510931a262cecf63f41338f264",
            currencySymbol: "DBET",
            ratio: 500000,
            balance: "4405698593134116690255377",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-23T13:00:04.152Z",
      isDeleted: false,
      primaryCommunityId: "5b0565c1c1ec90000120452e",
      numDecimalDigits: 18,
      name: "Decent.bet Relay",
      primaryCommunityImageName: "52342640-5e89-11e8-a205-7bf13fb32a99.png",
      order: 199
    },
    {
      _id: "5a69a9d11b67798dab40b9bd",
      symbol: "POE",
      type: "ethereum",
      name: "Po.et",
      code: "POE",
      status: "published",
      stage: "traded",
      details: {
        type: "erc20",
        contractAddress: "0x0e0989b1f9b8a38983c2ba8053269ca62ec9b195",
        supply: "",
        changer: {
          activatedAt: "2018-05-16T16:23:53.080Z"
        },
        relayCurrencyId: "5af4756e04aa4672b00f9fe6"
      },
      numDecimalDigits: 8,
      primaryCommunityImageName: "4746e920-5470-11e8-a380-5df7437b363c.png",
      isDeleted: false,
      isDiscoverable: true,
      order: 198,
      createdAt: "2018-01-25T09:56:33.823Z",
      lowerCaseSymbol: "poe",
      lowerCaseCode: "poe",
      primaryCommunityId: "5af46aecbfd7ae1ae4f07113"
    },
    {
      _id: "5af4756e04aa4672b00f9fe6",
      symbol: "POEBNT",
      lowerCaseSymbol: "poebnt",
      type: "ethereum",
      code: "POEBNT",
      lowerCaseCode: "poebnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xa5f2a49aafa052e28a50a575cd9e7488fa598e78",
        supply: "330228862929094900292190",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x8c2036ce61648fcddffb06d6d11fe0b479ed63fe",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-16T16:37:08.667Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "148240293200693299006122",
            numDecimalDigits: 18
          },
          "5a69a9d11b67798dab40b9bd": {
            contractAddress: "0x0e0989b1f9b8a38983c2ba8053269ca62ec9b195",
            currencySymbol: "POE",
            ratio: 500000,
            balance: "2284440413376919",
            numDecimalDigits: 8
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-10T16:38:06.955Z",
      isDeleted: false,
      primaryCommunityId: "5af4755f6f1d0f00018b2cbc",
      numDecimalDigits: 18,
      name: "POE Relay",
      primaryCommunityImageName: "ac2b9d90-5470-11e8-a473-e17b8e82a26f.png",
      order: 197
    },
    {
      _id: "5a1d81011b11f300016dc7a4",
      symbol: "BMCBNT",
      type: "ethereum",
      code: "BMCBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x1bce0e684a1607fd86407909073eea2336042bf7",
        supply: "260491139555218017850238",
        changer: {
          type: "bancor",
          version: "0.6",
          contractAddress: "0x94c654fef85b8b0a982909a6ca45b66bb2384236",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2017-11-29T09:50:45.762Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "146923859213709976278887"
          },
          "5a048e3078658d0001ffdab8": {
            contractAddress: "0xdf6ef343350780bf8c3410bf062e0c015b1dd671",
            currencySymbol: "BMC",
            ratio: 500000,
            numDecimalDigits: 8,
            balance: "71418163973618"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-28T15:30:09.822Z",
      primaryCommunityId: "5a1d80d6e17ffd0001b8ef39",
      numDecimalDigits: 18,
      primaryCommunityImageName: "0bd72410-d91c-11e7-91c4-63061ece2a28.jpeg",
      name: "Blackmoon Relay",
      isDeleted: false,
      isDiscoverable: true,
      lowerCaseSymbol: "bmcbnt",
      lowerCaseCode: "bmcbnt",
      order: 196
    },
    {
      _id: "5a048e3078658d0001ffdab8",
      symbol: "BMC",
      type: "ethereum",
      code: "BMC",
      details: {
        type: "erc20",
        contractAddress: "0xdf6ef343350780bf8c3410bf062e0c015b1dd671",
        supply: "6000000000000000",
        changer: {
          activatedAt: "2017-11-29T09:50:18.831Z"
        },
        relayCurrencyId: "5a1d81011b11f300016dc7a4"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-09T17:19:44.456Z",
      primaryCommunityId: "5a048e08f83f4c00013c46d7",
      numDecimalDigits: 8,
      primaryCommunityImageName: "55067260-d83d-11e7-91c4-63061ece2a28.png",
      name: "Blackmoon",
      isDeleted: false,
      order: 195,
      isDiscoverable: true,
      lowerCaseSymbol: "bmc",
      lowerCaseCode: "bmc"
    },
    {
      _id: "5b1653a08f10bd2ced3593dc",
      symbol: "CLNBNT",
      lowerCaseSymbol: "clnbnt",
      type: "ethereum",
      code: "CLNBNT",
      lowerCaseCode: "clnbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xeb027349398de19d925defc15c4302fe92fc69f9",
        supply: "245658000000001487319411",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xf346a9884bf8f858848268fb9d8ab31dae4b323f",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-06-05T14:51:49.889Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "121931805549189672938109",
            numDecimalDigits: 18
          },
          "5b1652d46055c7261b889182": {
            contractAddress: "0x4162178b78d6985480a308b2190ee5517460406d",
            currencySymbol: "CLN",
            ratio: 500000,
            balance: "9663384680663640465700178",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-06-05T09:10:56.291Z",
      isDeleted: false,
      primaryCommunityId: "5b16537f673ab40001dd8bc6",
      numDecimalDigits: 18,
      name: "Colu Local Network Relay",
      primaryCommunityImageName: "7f17c380-68a0-11e8-8840-c7b05733591e.png",
      order: 194
    },
    {
      _id: "5b1652d46055c7261b889182",
      symbol: "CLN",
      lowerCaseSymbol: "cln",
      type: "ethereum",
      code: "CLN",
      lowerCaseCode: "cln",
      details: {
        type: "erc20",
        contractAddress: "0x4162178b78d6985480a308b2190ee5517460406d",
        supply: "1540701333592592592592614116",
        changer: {
          activatedAt: "2018-06-05T14:51:32.801Z"
        },
        relayCurrencyId: "5b1653a08f10bd2ced3593dc"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-06-05T09:07:32.141Z",
      isDeleted: false,
      primaryCommunityId: "5b164e7888cc9e000182fff3",
      numDecimalDigits: 18,
      name: "Colu Local Network",
      primaryCommunityImageName: "07600730-68a0-11e8-8840-c7b05733591e.png",
      order: 193
    },
    {
      _id: "5af31eb33a695919b3e7c2c3",
      symbol: "POA20",
      lowerCaseSymbol: "poa20",
      type: "ethereum",
      code: "POA20",
      lowerCaseCode: "poa20",
      details: {
        type: "erc20",
        contractAddress: "0x6758b7d441a9739b98552b373703d8d3d14f9e62",
        supply: "1215172250000000000000000",
        changer: {
          activatedAt: "2018-05-10T15:38:11.041Z"
        },
        relayCurrencyId: "5af31fcae36ff35fafcf0a32"
      },
      status: "published",
      order: 192,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-09T16:15:47.112Z",
      isDeleted: false,
      primaryCommunityId: "5af31ea96f1d0f00018b2c80",
      numDecimalDigits: 18,
      name: "POA",
      primaryCommunityImageName: "4be7bb20-53a4-11e8-a04a-a1dcf04454c8.png"
    },
    {
      _id: "5af31fcae36ff35fafcf0a32",
      symbol: "POA20BNT",
      lowerCaseSymbol: "poa20bnt",
      type: "ethereum",
      code: "POA20BNT",
      lowerCaseCode: "poa20bnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x564c07255afe5050d82c8816f78da13f2b17ac6d",
        supply: "389862000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x2769eb86e3acdda921c4f36cfe6cad035d95d31b",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-10T15:35:47.094Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "125793429609348576059168",
            numDecimalDigits: 18
          },
          "5af31eb33a695919b3e7c2c3": {
            contractAddress: "0x6758b7d441a9739b98552b373703d8d3d14f9e62",
            currencySymbol: "POA20",
            ratio: 500000,
            balance: "1793271663577396273832093",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-09T16:20:26.770Z",
      isDeleted: false,
      primaryCommunityId: "5af31fc2ed1c3a0001091df5",
      numDecimalDigits: 18,
      name: "POA Relay",
      primaryCommunityImageName: "0ba56ca0-53a5-11e8-a473-e17b8e82a26f.png",
      order: 191
    },
    {
      _id: "5a1d94593203d200012b8b74",
      symbol: "KINBNT",
      type: "ethereum",
      code: "KINBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x26b5748f9253363f95e37767e9ed7986877a4b1b",
        supply: "150756349607115298112437",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xe9800c0b73a71be61d49a61fa3b2320ee524fb3d",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2017-12-20T20:40:42.517Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "123696117722638876698027"
          },
          "5a1d8d7b634e00000187855b": {
            contractAddress: "0x818fc6c2ec5986bc6e2cbf00939d90556ab12ce5",
            currencySymbol: "KIN",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "2588880755154061687754881598"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-28T16:52:41.826Z",
      primaryCommunityId: "5a1d9443e17ffd0001b8ef3e",
      numDecimalDigits: 18,
      name: "Kin Relay",
      isDeleted: false,
      primaryCommunityImageName: "a077d2b0-e98c-11e7-9b5e-179c6e04aa7c.png",
      isDiscoverable: true,
      lowerCaseSymbol: "kinbnt",
      lowerCaseCode: "kinbnt",
      order: 190
    },
    {
      _id: "5a1d8d7b634e00000187855b",
      symbol: "KIN",
      type: "ethereum",
      code: "KIN",
      details: {
        type: "erc20",
        contractAddress: "0x818fc6c2ec5986bc6e2cbf00939d90556ab12ce5",
        supply: "10000000000000000000000000000000",
        changer: {
          activatedAt: "2017-12-20T20:40:57.016Z"
        },
        relayCurrencyId: "5a1d94593203d200012b8b74"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-28T16:23:23.975Z",
      primaryCommunityId: "5a1d8d69171b01000182777c",
      numDecimalDigits: 18,
      primaryCommunityImageName: "806f5540-d458-11e7-8d93-0dddd703d386.png",
      name: "Kin",
      isDeleted: false,
      order: 189,
      isDiscoverable: true,
      lowerCaseSymbol: "kin",
      lowerCaseCode: "kin"
    },
    {
      _id: "5a9f840b7d22844df5b5e4be",
      symbol: "BAX",
      type: "ethereum",
      code: "BAX",
      details: {
        type: "erc20",
        contractAddress: "0x9a0242b7a33dacbe40edb927834f96eb39f8fbcb",
        supply: "50000000000000000000000000000",
        changer: {
          activatedAt: "2018-03-13T10:30:12.940Z"
        },
        relayCurrencyId: "5a9f880a164c654238f40a0d"
      },
      status: "published",
      order: 188,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-07T06:17:47.987Z",
      isDeleted: false,
      primaryCommunityId: "5a9f8403ad1988000122eae0",
      numDecimalDigits: 18,
      name: "BABB",
      primaryCommunityImageName: "03112a30-21f9-11e8-baf6-5fcc218084fc.png",
      lowerCaseSymbol: "bax",
      lowerCaseCode: "bax"
    },
    {
      _id: "5a9f880a164c654238f40a0d",
      symbol: "BAXBNT",
      type: "ethereum",
      code: "BAXBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xa9de5935ae3eae8a7f943c9329940eda160267f4",
        supply: "136928274773979113638124",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xc02d4bd00f642d2821e4279c810dd7b6e49264f8",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-03-13T10:28:07.635Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "109123689518806997985511",
            numDecimalDigits: 18
          },
          "5a9f840b7d22844df5b5e4be": {
            contractAddress: "0x9a0242b7a33dacbe40edb927834f96eb39f8fbcb",
            currencySymbol: "BAX",
            ratio: 500000,
            balance: "296843668181254298612188755",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-07T06:34:50.663Z",
      isDeleted: false,
      primaryCommunityId: "5a9f88025ffa680001c99a0b",
      numDecimalDigits: 18,
      name: "BABB Relay",
      primaryCommunityImageName: "c246b560-21f8-11e8-baf6-5fcc218084fc.png",
      lowerCaseSymbol: "baxbnt",
      lowerCaseCode: "baxbnt",
      order: 187
    },
    {
      _id: "59d27d45acb3c12634d19efb",
      symbol: "STX",
      type: "ethereum",
      details: {
        type: "bancor",
        subType: "smart",
        contractAddress: "0x006bea43baa3f7a6f765f14f10a1a1b08334ef45",
        supply: "57250110996459550329078296",
        changer: {
          type: "bancor",
          version: "0.4",
          contractAddress: "0x8606704880234178125b2d44cbbe190ccdbde015",
          isActive: true,
          activatedAt: "2017-10-04T10:00:00.341Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 20000,
            numDecimalDigits: 18,
            balance: "73013134064822048495471"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-10-02T17:51:34.341Z",
      primaryCommunityId: "59d2682dacb3c12b91d19efb",
      numDecimalDigits: 18,
      primaryCommunityImageName: "55d9ef30-a78e-11e7-a91e-3950c0cd8344.png",
      code: "STX",
      name: "Stox",
      isDeleted: false,
      order: 186,
      isDiscoverable: true,
      lowerCaseSymbol: "stx",
      lowerCaseCode: "stx"
    },
    {
      _id: "5a2d4f8fd0129700019a7647",
      symbol: "TKNBNT",
      type: "ethereum",
      code: "TKNBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x497ec0d6ba2080f0ed7ecf7a79a2a907401b3239",
        supply: "174547372846554825001094",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xc04b5a4556d00bca8eac5f5acca31981a6597409",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-28T13:45:48.739Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "93126605897639281045102"
          },
          "5a2d4ab9d0129700019a7604": {
            contractAddress: "0xaaaf91d9b90df800df4f55c205fd6989c977e73a",
            currencySymbol: "TKN",
            ratio: 500000,
            numDecimalDigits: 8,
            balance: "26816963760526"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-10T15:15:27.433Z",
      isDeleted: false,
      isDiscoverable: true,
      primaryCommunityId: "5a2d4f7b93d1f500018b0423",
      numDecimalDigits: 18,
      name: "TokenCard Relay",
      primaryCommunityImageName: "99227500-fae0-11e7-aabd-a344aed92db1.png",
      lowerCaseSymbol: "tknbnt",
      lowerCaseCode: "tknbnt",
      order: 184
    },
    {
      _id: "5a2d4ab9d0129700019a7604",
      type: "ethereum",
      name: "TokenCard",
      code: "TKN",
      status: "published",
      stage: "traded",
      details: {
        type: "erc20",
        contractAddress: "0xaaaf91d9b90df800df4f55c205fd6989c977e73a",
        supply: "3940675992832044",
        changer: {
          activatedAt: "2018-02-28T13:46:39.068Z"
        },
        relayCurrencyId: "5a2d4f8fd0129700019a7647"
      },
      numDecimalDigits: 8,
      isDiscoverable: true,
      order: 183,
      createdAt: "2018-01-25T10:07:51.003Z",
      symbol: "TKN",
      isDeleted: false,
      primaryCommunityImageName: "745fa0b0-21ed-11e8-85f0-f592f4a72353.png",
      primaryCommunityId: "5a2d4a6780e8200001fa1c80",
      lowerCaseSymbol: "tkn",
      lowerCaseCode: "tkn"
    },
    {
      _id: "5a22a25d33a64900015489d2",
      symbol: "OMGBNT",
      type: "ethereum",
      code: "OMGBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x99ebd396ce7aa095412a4cd1a0c959d6fd67b340",
        supply: "209300261548351186686179",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x11614c5f1eb215ecffe657da56d3dd12df395dc8",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2017-12-16T20:37:54.600Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "91324974672855237326454"
          },
          "5a086f93875e890001605abc": {
            contractAddress: "0xd26114cd6ee289accf82350c8d8487fedb8a0c07",
            currencySymbol: "OMG",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "33435731716809843199122"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-02T12:53:49.643Z",
      primaryCommunityId: "5a22a248171b01000182785e",
      numDecimalDigits: 18,
      primaryCommunityImageName: "b5d09390-e8a6-11e7-b0a9-ed964a07ad49.png",
      name: "OmiseGo Relay",
      isDeleted: false,
      isDiscoverable: true,
      lowerCaseSymbol: "omgbnt",
      lowerCaseCode: "omgbnt",
      order: 182
    },
    {
      _id: "5a086f93875e890001605abc",
      symbol: "OMG",
      type: "ethereum",
      code: "OMG",
      details: {
        type: "erc20",
        contractAddress: "0xd26114cd6ee289accf82350c8d8487fedb8a0c07",
        supply: "140245398245132780789239631",
        changer: {
          activatedAt: "2017-12-16T20:37:30.569Z"
        },
        relayCurrencyId: "5a22a25d33a64900015489d2"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-12T15:58:11.460Z",
      primaryCommunityId: "5a086ead5d174f0001e52402",
      numDecimalDigits: 18,
      primaryCommunityImageName: "6e2ce740-e343-11e7-8594-f3366fd77b2c.png",
      name: "OmiseGo",
      isDeleted: false,
      order: 181,
      isDiscoverable: true,
      lowerCaseSymbol: "omg",
      lowerCaseCode: "omg"
    },
    {
      _id: "5b1ea7a0c9c3a9bf92629414",
      symbol: "CMCT",
      lowerCaseSymbol: "cmct",
      type: "ethereum",
      code: "CMCT",
      lowerCaseCode: "cmct",
      details: {
        type: "erc20",
        contractAddress: "0x47bc01597798dcd7506dcca36ac4302fc93a8cfb",
        supply: "200000000000000000",
        changer: {
          activatedAt: "2018-06-11T18:42:04.706Z"
        },
        relayCurrencyId: "5b1ea829c9c3a9b7966294b8"
      },
      status: "published",
      order: 180,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-06-11T16:47:28.516Z",
      isDeleted: false,
      primaryCommunityId: "5b1ea79317d62b0001e39603",
      numDecimalDigits: 8,
      name: "Crowd Machine",
      primaryCommunityImageName: "5deccf10-6d97-11e8-b276-f32edc99ad99.png"
    },
    {
      _id: "5b1ea829c9c3a9b7966294b8",
      symbol: "CMCTBNT",
      lowerCaseSymbol: "cmctbnt",
      type: "ethereum",
      code: "CMCTBNT",
      lowerCaseCode: "cmctbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x6c77f061a756723ef852d9dfc0f5bac9ab5e65e0",
        supply: "185564000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x07cff9c779702a57a4da4b15ef9a0af58e9472d3",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-06-11T18:49:14.853Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "70641941175467861759049",
            numDecimalDigits: 18
          },
          "5b1ea7a0c9c3a9bf92629414": {
            contractAddress: "0x47bc01597798dcd7506dcca36ac4302fc93a8cfb",
            currencySymbol: "CMCT",
            ratio: 500000,
            balance: "785803591069496",
            numDecimalDigits: 8
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-06-11T16:49:45.289Z",
      isDeleted: false,
      primaryCommunityId: "5b1ea820c80d9e0001daeffa",
      numDecimalDigits: 18,
      name: "Crowd Machine Relay",
      primaryCommunityImageName: "8408ab10-6d97-11e8-8840-c7b05733591e.png",
      order: 179
    },
    {
      _id: "5a410f076787350001bd745e",
      symbol: "TIOBNT",
      type: "ethereum",
      code: "TIOBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x1b30042b537b30b1254ce84b27b332be523e974a",
        supply: "152867999999999999999964",
        changer: {
          type: "bancor",
          version: "0.6",
          contractAddress: "0xaf6a5b0998ff41355f3b4fe1ab96d89bd2c487d3",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-17T18:37:03.036Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "82376737384967968578174"
          },
          "5a410ae56787350001bd739b": {
            contractAddress: "0x80bc5512561c7f85a3a9508c7df7901b370fa1df",
            currencySymbol: "TIO",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "677983420340876688754688"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-25T14:45:27.519Z",
      isDeleted: false,
      primaryCommunityId: "5a410ef8a44e8f000107d44a",
      numDecimalDigits: 18,
      name: "Trade.io Relay",
      primaryCommunityImageName: "c8bfbd30-f613-11e7-bc6b-87a36d827eff.png",
      isDiscoverable: true,
      lowerCaseSymbol: "tiobnt",
      lowerCaseCode: "tiobnt",
      order: 178
    },
    {
      _id: "5a410ae56787350001bd739b",
      symbol: "TIO",
      type: "ethereum",
      code: "TIO",
      details: {
        type: "erc20",
        contractAddress: "0x80bc5512561c7f85a3a9508c7df7901b370fa1df",
        supply: "223534822661022743815939072",
        changer: {
          activatedAt: "2018-01-17T18:36:53.798Z"
        },
        relayCurrencyId: "5a410f076787350001bd745e"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-25T14:27:49.899Z",
      isDeleted: false,
      primaryCommunityId: "5a410ad7d82f0300018b1941",
      numDecimalDigits: 18,
      name: "Trade.io",
      primaryCommunityImageName: "f7b26820-f615-11e7-9454-0922d1574472.png",
      order: 177,
      isDiscoverable: true,
      lowerCaseSymbol: "tio",
      lowerCaseCode: "tio"
    },
    {
      _id: "5a1fda2c3203d200012b8b7c",
      symbol: "BATBNT",
      type: "ethereum",
      code: "BATBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x131da075a2832549128e93acc2b54174045232cf",
        supply: "186130315549943700799576",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x46ffcdc6d8e6ed69f124d944bbfe0ac74f8fcf7f",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-17T19:08:02.155Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "97805113713849481155938"
          },
          "5a1fd517634e000001878565": {
            contractAddress: "0x0d8775f648430679a709e98d2b0cb6250d2887ef",
            currencySymbol: "BAT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "1111040079456440865940925"
          }
        }
      },
      status: "published",
      isDiscoverable: true,
      stage: "traded",
      createdAt: "2017-11-30T10:15:08.692Z",
      primaryCommunityId: "5a1fda15e17ffd0001b8efa3",
      numDecimalDigits: 18,
      primaryCommunityImageName: "3713fea0-1495-11e8-bf39-bd2b2e4b10cf.png",
      name: "Basic Attention Token Relay",
      isDeleted: false,
      lowerCaseSymbol: "batbnt",
      lowerCaseCode: "batbnt",
      order: 176
    },
    {
      _id: "5a1fd517634e000001878565",
      type: "ethereum",
      name: "Basic Attention Token",
      code: "BAT",
      status: "published",
      stage: "traded",
      details: {
        type: "erc20",
        contractAddress: "0x0d8775f648430679a709e98d2b0cb6250d2887ef",
        supply: "1500000000000000000000000000",
        changer: {
          activatedAt: "2018-02-17T19:09:11.570Z"
        },
        relayCurrencyId: "5a1fda2c3203d200012b8b7c"
      },
      numDecimalDigits: 18,
      isDiscoverable: true,
      order: 175,
      createdAt: "2018-01-25T10:07:49.916Z",
      symbol: "BAT",
      isDeleted: false,
      primaryCommunityImageName: "47424c50-1495-11e8-a36b-c1b17c6baaea.png",
      primaryCommunityId: "5a1fd4ee31b0890001c2b93e",
      lowerCaseSymbol: "bat",
      lowerCaseCode: "bat"
    },
    {
      _id: "5a722b4cec75fc00012d4b8c",
      symbol: "ELF",
      type: "ethereum",
      code: "ELF",
      details: {
        type: "erc20",
        contractAddress: "0xbf2179859fc6d5bee9bf9158632dc51678a4100e",
        supply: "280000000000000000000000000",
        changer: {
          activatedAt: "2018-02-24T20:39:30.641Z"
        },
        relayCurrencyId: "5a722c3c9bee5b00013bd50f"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      order: 174,
      createdAt: "2018-02-26T16:00:00.434Z",
      isDeleted: false,
      primaryCommunityId: "5a722b269b393a00014ae7c0",
      numDecimalDigits: 18,
      name: "aelf",
      primaryCommunityImageName: "6f4bfaa0-0718-11e8-8744-97748b632eaf.jpeg",
      lowerCaseSymbol: "elf",
      lowerCaseCode: "elf"
    },
    {
      _id: "5a722c3c9bee5b00013bd50f",
      symbol: "ELFBNT",
      type: "ethereum",
      code: "ELFBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x0f2318565f1996cb1ed2f88e172135791bc1fcbf",
        supply: "171710353301259888789431",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x645a3f2fa86be27a4d9a3cc93a73f27b33df766f",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-26T20:35:58.114Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "83166838240528913858332"
          },
          "5a722b4cec75fc00012d4b8c": {
            contractAddress: "0xbf2179859fc6d5bee9bf9158632dc51678a4100e",
            currencySymbol: "ELF",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "354964371572606720764316"
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-31T20:51:08.859Z",
      isDeleted: false,
      primaryCommunityId: "5a722c279b393a00014ae7c1",
      numDecimalDigits: 18,
      name: "aelf Relay",
      lowerCaseSymbol: "elfbnt",
      lowerCaseCode: "elfbnt",
      order: 173
    },
    {
      _id: "5a806bfda47fc50001d5bd5c",
      symbol: "GTO",
      type: "ethereum",
      code: "GTO",
      details: {
        type: "erc20",
        contractAddress: "0xc5bbae50781be1669306b9e001eff57a2957b09d",
        supply: "100000000000000",
        changer: {
          activatedAt: "2018-02-26T17:29:14.568Z"
        },
        relayCurrencyId: "5a8071d9a47fc50001d5cc72"
      },
      status: "published",
      order: 172,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-11T16:14:53.801Z",
      isDeleted: false,
      primaryCommunityId: "5a806bf487285a0001bc1eba",
      numDecimalDigits: 5,
      name: "Gifto",
      primaryCommunityImageName: "b86c6900-0f46-11e8-b388-9b9c3ace7f5b.png",
      lowerCaseSymbol: "gto",
      lowerCaseCode: "gto"
    },
    {
      _id: "5a8071d9a47fc50001d5cc72",
      symbol: "GTOBNT",
      type: "ethereum",
      code: "GTOBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xc4938292ea2d3085fffc11c46b87ca068a83be01",
        supply: "186276000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xe88d6d63389d5c91e6348e379913f330739ad2c4",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-26T17:28:29.094Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "79731776509429472460174"
          },
          "5a806bfda47fc50001d5bd5c": {
            contractAddress: "0xc5bbae50781be1669306b9e001eff57a2957b09d",
            currencySymbol: "GTO",
            ratio: 500000,
            numDecimalDigits: 5,
            balance: "146148548905"
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-11T16:39:53.817Z",
      isDeleted: false,
      primaryCommunityId: "5a8071d287285a0001bc1ebe",
      numDecimalDigits: 18,
      name: "Gifto Relay",
      primaryCommunityImageName: "3b8f1730-0f4a-11e8-9d6e-fb9202c9fa3b.png",
      lowerCaseSymbol: "gtobnt",
      lowerCaseCode: "gtobnt",
      order: 171
    },
    {
      _id: "5b0bbaef8702d4abf13d90a4",
      symbol: "MAD",
      lowerCaseSymbol: "mad",
      type: "ethereum",
      code: "MAD",
      lowerCaseCode: "mad",
      details: {
        type: "erc20",
        contractAddress: "0x5b09a0371c1da44a8e24d36bf5deb1141a84d875",
        supply: "220000000000000000000000000",
        changer: {
          activatedAt: "2018-06-04T08:37:36.418Z"
        },
        relayCurrencyId: "5b0bc22a2ebbee8064ec4ad6"
      },
      status: "published",
      order: 170,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-28T08:16:47.803Z",
      isDeleted: false,
      primaryCommunityId: "5b0bbacb1643d20001acf2af",
      numDecimalDigits: 18,
      name: "Mad Network",
      primaryCommunityImageName: "96bc71a0-6253-11e8-9938-d9099e6ba61c.png"
    },
    {
      _id: "5b0bc22a2ebbee8064ec4ad6",
      symbol: "MADBNT",
      lowerCaseSymbol: "madbnt",
      type: "ethereum",
      code: "MADBNT",
      lowerCaseCode: "madbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x014186b1a2d675fc1e303a3d62b574c3270a38e0",
        supply: "160887520291069827586000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xbafc0bf857ae9b8feaed937ac90e44d90a487c72",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-06-04T08:40:10.376Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "54667694256703641511663",
            numDecimalDigits: 18
          },
          "5b0bbaef8702d4abf13d90a4": {
            contractAddress: "0x5b09a0371c1da44a8e24d36bf5deb1141a84d875",
            currencySymbol: "MAD",
            ratio: 500000,
            balance: "1870283347968040354637486",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-28T08:47:38.607Z",
      isDeleted: false,
      primaryCommunityId: "5b0bc2231643d20001acf2b3",
      numDecimalDigits: 18,
      name: "Mad Network Relay",
      primaryCommunityImageName: "d68c80e0-6253-11e8-b45d-a156476a373e.png",
      order: 169
    },
    {
      _id: "5a1ace8a967e9c6a2a5ac385",
      symbol: "ENJBNT",
      code: "ENJBNT",
      type: "ethereum",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xf3ad2cbc4276eb4b0fb627af0059cfce094e20a1",
        supply: "8708350689002294363104445",
        changer: {
          type: "bancor",
          version: "0.5",
          contractAddress: "0xf3ed5b15618494ddbd0a57b3bca8b2686ac0bc04",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2017-11-23T10:08:24.000Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "59226629918727161028138"
          },
          "5a174c5145a97200011ad30a": {
            contractAddress: "0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c",
            currencySymbol: "ENJ",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "3008490406029069789442842"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-26T16:53:00.000Z",
      numDecimalDigits: 18,
      primaryCommunityId: "5a1ad17e967e9c6a2f5ac385",
      primaryCommunityImageName: "21cc7a90-d91c-11e7-8594-f3366fd77b2c.jpeg",
      name: "Enjin Relay",
      isDeleted: false,
      isDiscoverable: true,
      lowerCaseSymbol: "enjbnt",
      lowerCaseCode: "enjbnt",
      order: 168
    },
    {
      _id: "5a174c5145a97200011ad30a",
      symbol: "ENJ",
      code: "ENJ",
      type: "ethereum",
      details: {
        type: "erc20",
        contractAddress: "0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c",
        supply: "1000000000000000000000000000",
        changer: {
          activatedAt: "2017-11-23T22:31:50.000Z"
        },
        relayCurrencyId: "5a1ace8a967e9c6a2a5ac385"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-23T22:31:45.650Z",
      primaryCommunityId: "5a174bc0171b0100018276b3",
      primaryCommunityImageName: "626cb710-d145-11e7-8d93-0dddd703d386.png",
      numDecimalDigits: 18,
      name: "Enjin",
      isDeleted: false,
      order: 167,
      isDiscoverable: true,
      lowerCaseSymbol: "enj",
      lowerCaseCode: "enj"
    },
    {
      _id: "5a604be401b4a80001539d48",
      symbol: "DAIBNT",
      type: "ethereum",
      code: "DAIBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xee01b3ab5f6728adc137be101d99c678938e6e72",
        supply: "92253762358033094120158",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x587044b74004e3d5ef2d453b7f8d198d9e4cb558",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-23T10:41:53.881Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "69208659806208948050310"
          },
          "5a604b62c5e04600015b72d5": {
            contractAddress: "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
            currencySymbol: "DAI",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "223136425799843267805671"
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-18T07:25:24.568Z",
      isDeleted: false,
      primaryCommunityId: "5a604bd4d9aebc000117639b",
      numDecimalDigits: 18,
      name: "Dai Relay",
      primaryCommunityImageName: "be962170-fc51-11e7-9454-0922d1574472.png",
      lowerCaseSymbol: "daibnt",
      lowerCaseCode: "daibnt",
      order: 166
    },
    {
      _id: "5a604b62c5e04600015b72d5",
      symbol: "DAI",
      type: "ethereum",
      code: "DAI",
      details: {
        type: "erc20",
        contractAddress: "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
        supply: "9671745362569421959607646",
        changer: {
          activatedAt: "2018-01-23T10:41:48.150Z"
        },
        relayCurrencyId: "5a604be401b4a80001539d48"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-18T07:23:14.799Z",
      isDeleted: false,
      primaryCommunityId: "5a604b1f7b6b0e0001fc6ce2",
      numDecimalDigits: 18,
      name: "Dai",
      primaryCommunityImageName: "d4938e40-fc51-11e7-90ab-6d53c6790097.png",
      order: 165,
      lowerCaseSymbol: "dai",
      lowerCaseCode: "dai"
    },
    {
      _id: "5a957c0cd10aa7000167e4c7",
      symbol: "J8T",
      type: "ethereum",
      code: "J8T",
      details: {
        type: "erc20",
        contractAddress: "0x0d262e5dc4a06a0f1c90ce79c7a60c09dfc884e4",
        supply: "150000000000000000",
        changer: {
          activatedAt: "2018-05-10T13:49:33.618Z"
        },
        relayCurrencyId: "5a957f848d47c800015d97ea"
      },
      status: "published",
      order: 164,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-27T15:41:00.247Z",
      isDeleted: false,
      primaryCommunityId: "5a957c04566e770001505f93",
      numDecimalDigits: 8,
      name: "Jet8",
      primaryCommunityImageName: "9030a0e0-546b-11e8-a04a-a1dcf04454c8.png",
      lowerCaseSymbol: "j8t",
      lowerCaseCode: "j8t"
    },
    {
      _id: "5a957f848d47c800015d97ea",
      symbol: "J8TBNT",
      type: "ethereum",
      code: "J8TBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x8e00bacd7d8265d8f3f9d5b4fbd7f6b0b0c46f36",
        supply: "137904000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xc7151af2e9d1a702a61fcb655e2334bfee5b5faf",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-10T13:49:04.303Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "63075731202354368797944",
            numDecimalDigits: 18
          },
          "5a957c0cd10aa7000167e4c7": {
            contractAddress: "0x0d262e5dc4a06a0f1c90ce79c7a60c09dfc884e4",
            currencySymbol: "J8T",
            ratio: 500000,
            balance: "2253746448607201",
            numDecimalDigits: 8
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-27T15:55:48.309Z",
      isDeleted: false,
      primaryCommunityId: "5a957f77f6d657000151da1b",
      numDecimalDigits: 18,
      name: "J8TBNT",
      primaryCommunityImageName: "b5102c50-546b-11e8-a04a-a1dcf04454c8.png",
      lowerCaseSymbol: "j8tbnt",
      lowerCaseCode: "j8tbnt",
      order: 163
    },
    {
      _id: "5b1648b1ea2d014dcb5686a1",
      symbol: "MYBBNT",
      lowerCaseSymbol: "mybbnt",
      type: "ethereum",
      code: "MYBBNT",
      lowerCaseCode: "mybbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xf22fb05ac032fcaf3273f50af8db2753888bdd48",
        supply: "139710000000000000000000",
        changer: {
          type: "bancor",
          version: "0.8",
          contractAddress: "0x6b431a7a99780819473722161ee9145e5649c5e2",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-06-12T10:19:38.890Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "57054471167471887791913",
            numDecimalDigits: 18
          },
          "5b164627ae2482321708eb93": {
            contractAddress: "0x5d60d8d7ef6d37e16ebabc324de3be57f135e0bc",
            currencySymbol: "MYB",
            ratio: 500000,
            balance: "3505777212396951783640065",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-06-05T08:24:17.285Z",
      isDeleted: false,
      primaryCommunityId: "5b16489e88cc9e000182fff1",
      numDecimalDigits: 18,
      name: "MyBit Token Relay",
      primaryCommunityImageName: "0b8359d0-689a-11e8-8840-c7b05733591e.png",
      order: 162
    },
    {
      _id: "5b164627ae2482321708eb93",
      symbol: "MYB",
      lowerCaseSymbol: "myb",
      type: "ethereum",
      code: "MYB",
      lowerCaseCode: "myb",
      details: {
        type: "erc20",
        contractAddress: "0x5d60d8d7ef6d37e16ebabc324de3be57f135e0bc",
        supply: "180000000000000000000000000",
        changer: {
          activatedAt: "2018-06-12T10:20:35.624Z"
        },
        relayCurrencyId: "5b1648b1ea2d014dcb5686a1"
      },
      status: "published",
      order: 161,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-06-05T08:13:27.192Z",
      isDeleted: false,
      primaryCommunityId: "5b16460462bc740001afa01e",
      numDecimalDigits: 18,
      name: "MyBit Token",
      primaryCommunityImageName: "836a9c80-6898-11e8-b276-f32edc99ad99.png"
    },
    {
      _id: "5a69a9d11b67798dab40b9b8",
      symbol: "VIB",
      type: "ethereum",
      name: "Viberate",
      code: "VIB",
      status: "published",
      stage: "traded",
      details: {
        type: "erc20",
        contractAddress: "0x2c974b2d0ba1716e644c1fc59982a89ddd2ff724",
        supply: "200000000000000000000000000",
        changer: {
          activatedAt: "2018-03-01T12:27:51.547Z"
        },
        relayCurrencyId: "5a968eb39758945ce6954656"
      },
      numDecimalDigits: 18,
      primaryCommunityImageName: "ce96b8c0-208a-11e8-891a-85ca6815b23e.png",
      isDeleted: false,
      isDiscoverable: true,
      order: 160,
      createdAt: "2018-01-25T09:56:33.017Z",
      primaryCommunityId: "5a970546de1bd7ae8e2eba5f",
      lowerCaseSymbol: "vib",
      lowerCaseCode: "vib"
    },
    {
      _id: "5a968eb39758945ce6954656",
      symbol: "VIBBNT",
      type: "ethereum",
      code: "VIBBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x2948bd241243bb6924a0b2f368233dda525aab05",
        supply: "180802088539980000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xbe1daf05bf9e054b3e28b7e9c318819ef5dacb58",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-03-01T12:26:29.756Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "57459500799769827492364"
          },
          "5a69a9d11b67798dab40b9b8": {
            contractAddress: "0x2c974b2d0ba1716e644c1fc59982a89ddd2ff724",
            currencySymbol: "VIB",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "2287484642326457794502273"
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-28T11:12:51.909Z",
      isDeleted: false,
      primaryCommunityId: "5a968ea31a6176000107fced",
      numDecimalDigits: 18,
      name: "Viberate Relay",
      primaryCommunityImageName: "b9b03a30-208a-11e8-85f0-f592f4a72353.png",
      lowerCaseSymbol: "vibbnt",
      lowerCaseCode: "vibbnt",
      order: 159
    },
    {
      _id: "59d74c1b90509a8807e9db0f",
      symbol: "GNOBNT",
      type: "ethereum",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xd7eb9db184da9f099b84e2f86b1da1fe6b305b3d",
        supply: "209505625030708166391296",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x3f7ba8b8f663fddb47568cca30eac7aed3d2f1a3",
          isActive: true,
          activatedAt: "2017-10-06T10:00:00.000Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "54363003289995516106750"
          },
          "59d745ff90509add31e9db14": {
            contractAddress: "0x6810e776880c02933d47db1b9fc05908e5386b96",
            currencySymbol: "GNO",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "3585835995189951068243"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-10-06T10:00:00.000Z",
      numDecimalDigits: 18,
      primaryCommunityId: "59da678aacb3c14a8ad19efd",
      code: "GNOBNT",
      primaryCommunityImageName: "38c00730-d91c-11e7-91c4-63061ece2a28.jpeg",
      name: "Gnosis Relay",
      isDeleted: false,
      isDiscoverable: true,
      lowerCaseSymbol: "gnobnt",
      lowerCaseCode: "gnobnt",
      order: 158
    },
    {
      _id: "59d745ff90509add31e9db14",
      type: "ethereum",
      symbol: "GNO",
      details: {
        type: "erc20",
        contractAddress: "0x6810e776880c02933d47db1b9fc05908e5386b96",
        supply: "10000000000000000000000000",
        changer: {
          activatedAt: "2017-10-06T10:00:00.000Z"
        },
        relayCurrencyId: "59d74c1b90509a8807e9db0f"
      },
      status: "published",
      stage: "traded",
      primaryCommunityId: "59d7438290509ac9b9e9db13",
      primaryCommunityImageName: "b48283f0-d5c7-11e7-a7f0-3f204353e561.png",
      createdAt: "2017-10-06T10:00:00.000Z",
      numDecimalDigits: 18,
      code: "GNO",
      name: "Gnosis",
      isDeleted: false,
      order: 157,
      isDiscoverable: true,
      lowerCaseSymbol: "gno",
      lowerCaseCode: "gno"
    },
    {
      _id: "5a1d86dc634e00000187855a",
      symbol: "POWRBNT",
      type: "ethereum",
      code: "POWRBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x168d7bbf38e17941173a352f1352df91a7771df3",
        supply: "133912984330161427794562",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x8fd5bfbc2f61a450400ae275e64d1e171c05b639",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-27T16:13:22.699Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "61313430305421570180225"
          },
          "5a12993ac1a3da0001a37aa6": {
            contractAddress: "0x595832f8fc6bf59c85c527fec3740a1b7a361269",
            currencySymbol: "POWR",
            ratio: 500000,
            numDecimalDigits: 6,
            balance: "627890913504"
          }
        }
      },
      status: "published",
      isDiscoverable: true,
      stage: "traded",
      createdAt: "2017-11-28T15:55:08.976Z",
      primaryCommunityId: "5a1d85aee17ffd0001b8ef3c",
      numDecimalDigits: 18,
      primaryCommunityImageName: "09432910-d827-11e7-8594-f3366fd77b2c.jpeg",
      name: "Power Ledger Relay",
      isDeleted: false,
      lowerCaseSymbol: "powrbnt",
      lowerCaseCode: "powrbnt",
      order: 156
    },
    {
      _id: "5a12993ac1a3da0001a37aa6",
      type: "ethereum",
      name: "Power Ledger",
      code: "POWR",
      status: "published",
      stage: "traded",
      details: {
        type: "erc20",
        contractAddress: "0x595832f8fc6bf59c85c527fec3740a1b7a361269",
        supply: "1000000000000000",
        changer: {
          activatedAt: "2018-02-27T16:15:09.730Z"
        },
        relayCurrencyId: "5a1d86dc634e00000187855a"
      },
      numDecimalDigits: 6,
      isDiscoverable: true,
      createdAt: "2018-01-25T10:07:49.610Z",
      symbol: "POWR",
      order: 155,
      isDeleted: false,
      primaryCommunityImageName: "328df670-0751-11e8-aeaa-3305f3982028.png",
      primaryCommunityId: "5a12961222d792000139707c",
      lowerCaseSymbol: "powr",
      lowerCaseCode: "powr"
    },
    {
      _id: "5a2d3380d0129700019a74f3",
      symbol: "SNTBNT",
      type: "ethereum",
      code: "SNTBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xa3b3c5a8b22c044d5f2d372f628245e2106d310d",
        supply: "131883474979503534365456",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x599485dc0f3d8b308b973b2db5cd44bae46d31c4",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-31T12:59:07.365Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "54249453119369901087662"
          },
          "5a2d307c47bbf500018ecc6e": {
            contractAddress: "0x744d70fdbe2ba4cf95131626614a1763df805b9e",
            currencySymbol: "SNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "2316579095392449788215123"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-10T13:15:44.656Z",
      isDeleted: false,
      primaryCommunityId: "5a2d337293d1f500018b0414",
      numDecimalDigits: 18,
      name: "Status Relay",
      primaryCommunityImageName: "6d459d60-0425-11e8-90ab-6d53c6790097.png",
      isDiscoverable: true,
      lowerCaseSymbol: "sntbnt",
      lowerCaseCode: "sntbnt",
      order: 154
    },
    {
      _id: "5a2d307c47bbf500018ecc6e",
      type: "ethereum",
      name: "Status",
      code: "SNT",
      status: "published",
      stage: "traded",
      details: {
        type: "erc20",
        contractAddress: "0x744d70fdbe2ba4cf95131626614a1763df805b9e",
        supply: "6804870174878168246198837603",
        changer: {
          activatedAt: "2018-01-31T12:51:45.043Z"
        },
        relayCurrencyId: "5a2d3380d0129700019a74f3"
      },
      numDecimalDigits: 18,
      isDiscoverable: true,
      createdAt: "2018-01-25T10:07:49.457Z",
      symbol: "SNT",
      isDeleted: false,
      primaryCommunityImageName: "Status.png",
      order: 153,
      primaryCommunityId: "5a2d305693d1f500018b0413",
      lowerCaseSymbol: "snt",
      lowerCaseCode: "snt"
    },
    {
      _id: "5a804f05a47fc50001d57673",
      symbol: "KNCBNT",
      type: "ethereum",
      code: "KNCBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x248afff1aa83cf860198ddee14b5b3e8edb46d47",
        supply: "112306611502815040220547",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xcde79f10b689a716029d0edb54de78b1bbc14957",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-03-13T12:49:18.122Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "54156973505862818150629",
            numDecimalDigits: 18
          },
          "5a69a9cb1b67798dab40b997": {
            contractAddress: "0xdd974d5c2e2928dea5f71b9825b8b646686bd200",
            currencySymbol: "KNC",
            ratio: 500000,
            balance: "174788325676991437048062",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-11T14:11:17.105Z",
      isDeleted: false,
      primaryCommunityId: "5a804efcb3501b00016ac825",
      numDecimalDigits: 18,
      name: "Kyber Network Relay",
      primaryCommunityImageName: "d7cbeeb0-779c-11e8-a04e-4b9b4af37e24.png",
      lowerCaseSymbol: "kncbnt",
      lowerCaseCode: "kncbnt",
      order: 152
    },
    {
      _id: "5a69a9cb1b67798dab40b997",
      symbol: "KNC",
      type: "ethereum",
      name: "Kyber Network",
      code: "KNC",
      status: "published",
      order: 151,
      stage: "traded",
      details: {
        type: "erc20",
        contractAddress: "0xdd974d5c2e2928dea5f71b9825b8b646686bd200",
        supply: "215625273275937966377659088",
        changer: {
          activatedAt: "2018-03-13T12:49:32.619Z"
        },
        relayCurrencyId: "5a804f05a47fc50001d57673"
      },
      numDecimalDigits: 18,
      primaryCommunityImageName: "a0f71130-779c-11e8-a329-1d4492a24b90.png",
      isDeleted: false,
      isDiscoverable: true,
      createdAt: "2018-01-25T09:56:27.807Z",
      primaryCommunityId: "5a8046e82b60506383ec5141",
      lowerCaseSymbol: "knc",
      lowerCaseCode: "knc"
    },
    {
      _id: "5a2d030dd0129700019a72d5",
      symbol: "MANABNT",
      type: "ethereum",
      code: "MANABNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x79d83b390cf0edf86b9efbe47b556cc6e20926ac",
        supply: "78576226027260225411168",
        changer: {
          type: "bancor",
          version: "0.6",
          contractAddress: "0x967f1c667fc490ddd2fb941e3a461223c03d40e9",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2017-12-28T15:42:08.820Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "54334535859767548897149"
          },
          "5a2cfacad0129700019a7270": {
            contractAddress: "0x0f5d2fb29fb7d3cfee444a200298f468908cc942",
            currencySymbol: "MANA",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "1738040618346139380661031"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-10T09:49:01.786Z",
      isDeleted: false,
      primaryCommunityId: "5a2d02fb4f1311000100b916",
      numDecimalDigits: 18,
      name: "Decentraland Relay",
      primaryCommunityImageName: "5b0f9ee0-e0f1-11e7-91c4-63061ece2a28.png",
      isDiscoverable: true,
      lowerCaseSymbol: "manabnt",
      lowerCaseCode: "manabnt",
      order: 150
    },
    {
      _id: "5a2cfacad0129700019a7270",
      symbol: "MANA",
      type: "ethereum",
      code: "MANA",
      details: {
        type: "erc20",
        contractAddress: "0x0f5d2fb29fb7d3cfee444a200298f468908cc942",
        supply: "2805886393158302800966567885",
        changer: {
          activatedAt: "2017-12-28T15:42:21.126Z"
        },
        relayCurrencyId: "5a2d030dd0129700019a72d5"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-10T09:13:46.879Z",
      isDeleted: false,
      primaryCommunityId: "5a2cfa6c93d1f500018b03f0",
      numDecimalDigits: 18,
      name: "Decentraland",
      primaryCommunityImageName: "541d40e0-dd8d-11e7-8594-f3366fd77b2c.png",
      order: 149,
      isDiscoverable: true,
      lowerCaseSymbol: "mana",
      lowerCaseCode: "mana"
    },
    {
      _id: "5a8072fbdbe94b0001c641ef",
      symbol: "REQBNT",
      type: "ethereum",
      code: "REQBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xccb5e3ba5356d57001976092795626ac3b87ad4e",
        supply: "150414000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x37c88474b5d6c593bbd2e4ce16635c08f8215b1e",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-18T13:58:45.058Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "53134892222093371758651"
          },
          "5a69a9cd1b67798dab40b9a1": {
            contractAddress: "0x8f8221afbb33998d8584a2b05749ba73c37a938a",
            currencySymbol: "REQ",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "1900348426066323134805446"
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-11T16:44:43.081Z",
      isDeleted: false,
      primaryCommunityId: "5a8072ecb3501b00016ac835",
      numDecimalDigits: 18,
      name: "Request Network Relay",
      primaryCommunityImageName: "ff180180-0f4a-11e8-9d6e-fb9202c9fa3b.png",
      lowerCaseSymbol: "reqbnt",
      lowerCaseCode: "reqbnt",
      order: 148
    },
    {
      _id: "5a69a9cd1b67798dab40b9a1",
      symbol: "REQ",
      type: "ethereum",
      name: "Request Network",
      code: "REQ",
      status: "published",
      stage: "traded",
      details: {
        type: "erc20",
        contractAddress: "0x8f8221afbb33998d8584a2b05749ba73c37a938a",
        supply: "999999999244592134526985951",
        changer: {
          activatedAt: "2018-02-18T13:59:57.977Z"
        },
        relayCurrencyId: "5a8072fbdbe94b0001c641ef"
      },
      numDecimalDigits: 18,
      primaryCommunityImageName: "b53f2730-0ff1-11e8-9bbb-f9f8c8c99387.png",
      isDeleted: false,
      isDiscoverable: true,
      order: 147,
      createdAt: "2018-01-25T09:56:29.388Z",
      primaryCommunityId: "5a8157f5762c10d22cf012c6",
      lowerCaseSymbol: "req",
      lowerCaseCode: "req"
    },
    {
      _id: "5afad8c9e76319b13946450f",
      symbol: "MORPH",
      lowerCaseSymbol: "morph",
      type: "ethereum",
      code: "MORPH",
      lowerCaseCode: "morph",
      details: {
        type: "erc20",
        contractAddress: "0x2ef27bf41236bd859a95209e17a43fbd26851f92",
        supply: "1000000000",
        changer: {
          activatedAt: "2018-05-28T11:57:13.099Z"
        },
        relayCurrencyId: "5afad0ddea38e729ad4109f5"
      },
      status: "published",
      order: 146,
      stage: "managed",
      isDiscoverable: false,
      createdAt: "2018-05-15T12:55:37.720Z",
      isDeleted: false,
      primaryCommunityId: "5afad8b01cd106000162f003",
      numDecimalDigits: 4,
      name: "Morpheus",
      primaryCommunityImageName: "820f12d0-583f-11e8-b48c-35d88ea2b959.png"
    },
    {
      _id: "5afad0ddea38e729ad4109f5",
      symbol: "MORPHBNT",
      lowerCaseSymbol: "morphbnt",
      type: "ethereum",
      code: "MORPHBNT",
      lowerCaseCode: "morphbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xb2ea67533290fad84e3fe2e1fb68d21ca062d7fc",
        supply: "110550237910666169393000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x952eb7dc904f6f8b6b0bc6c5c99d45143e743cd7",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-28T12:01:14.805Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "35612332883238249049106",
            numDecimalDigits: 18
          },
          "5afad8c9e76319b13946450f": {
            contractAddress: "0x2ef27bf41236bd859a95209e17a43fbd26851f92",
            currencySymbol: "MORPH",
            ratio: 500000,
            balance: "4843491461",
            numDecimalDigits: 4
          }
        }
      },
      status: "published",
      stage: "managed",
      isDiscoverable: false,
      createdAt: "2018-05-15T12:21:49.387Z",
      isDeleted: false,
      primaryCommunityId: "5afad0d2c1ec9000012042ab",
      numDecimalDigits: 18,
      name: "Morpheus Relay",
      primaryCommunityImageName: "b11c4ed0-583a-11e8-9952-89831889dec2.png",
      order: 145
    },
    {
      _id: "5a8007eccd261900013b5402",
      symbol: "SHPBNT",
      type: "ethereum",
      code: "SHPBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x6e0e0b9ab5f8e5f5f2de4d34ffe46668ffb37476",
        supply: "59354374541390473687332",
        changer: {
          type: "bancor",
          version: "0.6",
          contractAddress: "0x0f1c029c5d7f626f6820bfe0f6a7b2ac48746ddf",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-13T12:29:43.960Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "45549145801050216984967"
          },
          "5a37b389ed8a500001de42da": {
            contractAddress: "0xef2463099360a085f1f10b076ed72ef625497a06",
            currencySymbol: "SHP",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "842766469274246350477410"
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-11T09:07:56.902Z",
      isDeleted: false,
      primaryCommunityId: "5a8007e287285a0001bc1e94",
      numDecimalDigits: 18,
      name: "Sharpe Capital Relay",
      primaryCommunityImageName: "452f53b0-10d8-11e8-b0af-65b5ce9d6148.png",
      lowerCaseSymbol: "shpbnt",
      lowerCaseCode: "shpbnt",
      order: 144
    },
    {
      _id: "5a37b389ed8a500001de42da",
      symbol: "SHP",
      type: "ethereum",
      code: "SHP",
      details: {
        type: "erc20",
        contractAddress: "0xef2463099360a085f1f10b076ed72ef625497a06",
        supply: "32000000000000000000000000",
        changer: {
          activatedAt: "2018-02-13T12:31:05.669Z"
        },
        relayCurrencyId: "5a8007eccd261900013b5402"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-18T12:24:41.068Z",
      isDeleted: false,
      primaryCommunityId: "5a37b35d4f1311000100bc1e",
      numDecimalDigits: 18,
      name: "Sharpe Capital",
      order: 143,
      isDiscoverable: true,
      primaryCommunityImageName: "6d984ca0-2463-11e8-891a-85ca6815b23e.png",
      lowerCaseSymbol: "shp",
      lowerCaseCode: "shp"
    },
    {
      _id: "5a36828a9416220001fa9d94",
      symbol: "AION",
      type: "ethereum",
      code: "AION",
      details: {
        type: "erc20",
        contractAddress: "0x4ceda7906a5ed2179785cd3a40a69ee8bc99c466",
        supply: " 46593458666000000 ",
        changer: {
          activatedAt: "2017-12-17T21:53:50.913Z"
        },
        relayCurrencyId: "5a36833d4c101900019763b1"
      },
      status: "published",
      stage: "traded",
      createdAt: "2018-02-26T14:43:22.703Z",
      isDiscoverable: true,
      order: 142,
      isDeleted: false,
      primaryCommunityId: "5a36825f80e8200001fa1efe",
      numDecimalDigits: 8,
      name: "Aion Network",
      primaryCommunityImageName: "f605cf40-4a38-11e8-963a-05fa26187558.png",
      lowerCaseSymbol: "aion",
      lowerCaseCode: "aion"
    },
    {
      _id: "5a36833d4c101900019763b1",
      symbol: "AIONBNT",
      type: "ethereum",
      code: "AIONBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x73fa2b855be96ab3c73f375b8ec777226efa3845",
        supply: "103114000000000000000000",
        changer: {
          type: "bancor",
          version: "0.7",
          contractAddress: "0xdd9b82c59aa260b2a834ec67c472f43b40a2e6f1",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-26T21:52:42.500Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "40288610969620394816157"
          },
          "5a36828a9416220001fa9d94": {
            contractAddress: "0x4ceda7906a5ed2179785cd3a40a69ee8bc99c466",
            currencySymbol: "AION",
            ratio: 500000,
            numDecimalDigits: 8,
            balance: "10655395838293"
          }
        }
      },
      status: "published",
      isDiscoverable: true,
      stage: "traded",
      createdAt: "2017-12-17T14:46:21.026Z",
      isDeleted: false,
      primaryCommunityId: "5a3683334f1311000100bbbc",
      numDecimalDigits: 18,
      name: "Aion Network Relay",
      primaryCommunityImageName: "6fdf4e90-148d-11e8-891a-85ca6815b23e.png",
      lowerCaseSymbol: "aionbnt",
      lowerCaseCode: "aionbnt",
      order: 141
    },
    {
      _id: "5acf2833a0ed07a22711f3fc",
      symbol: "MDTBNT",
      lowerCaseSymbol: "mdtbnt",
      type: "ethereum",
      code: "MDTBNT",
      lowerCaseCode: "mdtbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xbab15d72731ea7031b10324806e7aad8448896d5",
        supply: "109156000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x72844ab8b5f59c0251bcce6ef5f2be92d7528c1a",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-04-12T15:19:51.962Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "43407498759969164222532",
            numDecimalDigits: 18
          },
          "5acf279c44dff67de7101342": {
            contractAddress: "0x814e0908b12a99fecf5bc101bb5d0b8b5cdf7d26",
            currencySymbol: "MDT",
            ratio: 500000,
            balance: "4187378615309261449510379",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-04-12T09:34:43.702Z",
      isDeleted: false,
      primaryCommunityId: "5acf280bac4ef80001910b4d",
      numDecimalDigits: 18,
      name: "Measurable Data Token Relay",
      primaryCommunityImageName: "f41e7400-3e37-11e8-b094-85955a15de56.png",
      order: 140
    },
    {
      _id: "5acf279c44dff67de7101342",
      symbol: "MDT",
      lowerCaseSymbol: "mdt",
      type: "ethereum",
      code: "MDT",
      lowerCaseCode: "mdt",
      details: {
        type: "erc20",
        contractAddress: "0x814e0908b12a99fecf5bc101bb5d0b8b5cdf7d26",
        supply: "1E+27",
        changer: {
          activatedAt: "2018-04-12T15:18:42.572Z"
        },
        relayCurrencyId: "5acf2833a0ed07a22711f3fc"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-04-12T09:32:12.770Z",
      isDeleted: false,
      primaryCommunityId: "5acf2695ac4ef80001910b4c",
      numDecimalDigits: 18,
      name: "Measurable Data Token",
      primaryCommunityImageName: "cd2c3530-3e37-11e8-b094-85955a15de56.png",
      order: 139
    },
    {
      _id: "5b0d0bb08702d4ca0e3f2796",
      symbol: "BOXX",
      lowerCaseSymbol: "boxx",
      type: "ethereum",
      code: "BOXX",
      lowerCaseCode: "boxx",
      details: {
        type: "erc20",
        contractAddress: "0x780116d91e5592e58a3b3c76a351571b39abcec6",
        supply: "90,000,000,000,000,000,000,000.00",
        changer: {
          activatedAt: "2018-05-29T16:26:53.779Z"
        },
        relayCurrencyId: "5b0d0ce2fa1d381941134969"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-29T08:13:36.721Z",
      isDeleted: false,
      primaryCommunityId: "5b0d0ba81643d20001acf2f9",
      numDecimalDigits: 15,
      name: "Blockparty",
      primaryCommunityImageName: "42e8d320-64ab-11e8-b0ae-6d2fb3484860.png",
      order: 138
    },
    {
      _id: "5b0d0ce2fa1d381941134969",
      symbol: "BOXXBNT",
      lowerCaseSymbol: "boxxbnt",
      type: "ethereum",
      code: "BOXXBNT",
      lowerCaseCode: "boxxbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x849d49911cef804bdb1fec58150b8eabab119796",
        supply: "108338000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x3167cc146d228c6977dcbada380df926b39865b1",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-29T16:26:35.853Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "39246106126912333627538",
            numDecimalDigits: 18
          },
          "5b0d0bb08702d4ca0e3f2796": {
            contractAddress: "0x780116d91e5592e58a3b3c76a351571b39abcec6",
            currencySymbol: "BOXX",
            ratio: 500000,
            balance: "317618894501232630095",
            numDecimalDigits: 15
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-29T08:18:42.753Z",
      isDeleted: false,
      primaryCommunityId: "5b0d0cd81643d20001acf2fb",
      numDecimalDigits: 18,
      name: "Blockparty Relay",
      primaryCommunityImageName: "65341f20-64ab-11e8-b0ae-6d2fb3484860.png",
      order: 137
    },
    {
      _id: "5ab141592ba8c12410734e6d",
      symbol: "FTR",
      type: "ethereum",
      code: "FTR",
      details: {
        type: "erc20",
        contractAddress: "0x2023dcf7c438c8c8c0b0f28dbae15520b4f3ee20",
        supply: "197674774198572283677525000",
        changer: {
          activatedAt: "2018-03-27T09:34:30.960Z"
        },
        relayCurrencyId: "5ab146bb683255e5fa87240e"
      },
      status: "published",
      order: 136,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-20T17:14:01.214Z",
      isDeleted: false,
      primaryCommunityId: "5ab14151dc99f10001a75ebe",
      numDecimalDigits: 18,
      name: "Futourist",
      primaryCommunityImageName: "3b246c20-2c62-11e8-baf6-5fcc218084fc.png",
      lowerCaseSymbol: "ftr",
      lowerCaseCode: "ftr"
    },
    {
      _id: "5ab146bb683255e5fa87240e",
      symbol: "FTRBNT",
      type: "ethereum",
      code: "FTRBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x2da44da464d6b1f4957a221007f9f0a0759cbb3a",
        supply: "155183760000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xc44330a585c3408392afb85b7018178bd4bae219",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-03-27T09:33:55.535Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "41494178288355102008639",
            numDecimalDigits: 18
          },
          "5ab141592ba8c12410734e6d": {
            contractAddress: "0x2023dcf7c438c8c8c0b0f28dbae15520b4f3ee20",
            currencySymbol: "FTR",
            ratio: 500000,
            balance: "37973312771678274428921717",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-20T17:36:59.397Z",
      isDeleted: false,
      primaryCommunityId: "5ab146b3dc99f10001a75ec5",
      numDecimalDigits: 18,
      name: "Futourist Relay",
      primaryCommunityImageName: "6b580610-2c65-11e8-baf6-5fcc218084fc.png",
      lowerCaseSymbol: "ftrbnt",
      lowerCaseCode: "ftrbnt",
      order: 135
    },
    {
      _id: "5a92b80b4695da0001d00524",
      symbol: "RCNBNT",
      type: "ethereum",
      code: "RCNBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xf7b9fa01098f22527db205ff9bb6fdf7c7d9f1c5",
        supply: "112582648471498466029486",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x8e7fc617e87b39bd5fe1767a95afa53d2c79f147",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-04-26T08:00:32.089Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "41616461447870353406741",
            numDecimalDigits: 18
          },
          "5a92b443ef48d60001102970": {
            contractAddress: "0xf970b8e36e23f7fc3fd752eea86f8be8d83375a6",
            currencySymbol: "RCN",
            ratio: 500000,
            balance: "2376096051204213684865382",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-25T13:20:11.020Z",
      isDeleted: false,
      primaryCommunityId: "5a92b7fe583f4a0001f75f46",
      numDecimalDigits: 18,
      name: "Ripio Relay",
      primaryCommunityImageName: "a6c694d0-1a2e-11e8-a36b-c1b17c6baaea.png",
      lowerCaseSymbol: "rcnbnt",
      lowerCaseCode: "rcnbnt",
      order: 134
    },
    {
      _id: "5a92b443ef48d60001102970",
      symbol: "RCN",
      type: "ethereum",
      code: "RCN",
      details: {
        type: "erc20",
        contractAddress: "0xf970b8e36e23f7fc3fd752eea86f8be8d83375a6",
        supply: "999942647353090031740080000",
        changer: {
          activatedAt: "2018-04-26T07:59:11.396Z"
        },
        relayCurrencyId: "5a92b80b4695da0001d00524"
      },
      status: "published",
      order: 133,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-25T13:04:03.912Z",
      isDeleted: false,
      primaryCommunityId: "5a92b438583f4a0001f75f42",
      numDecimalDigits: 18,
      name: "Ripio",
      primaryCommunityImageName: "87cde120-1a2c-11e8-a36b-c1b17c6baaea.png",
      lowerCaseSymbol: "rcn",
      lowerCaseCode: "rcn"
    },
    {
      _id: "5a97ec891cbcd07b03616d3b",
      symbol: "LDC",
      type: "ethereum",
      code: "LDC",
      details: {
        type: "erc20",
        contractAddress: "0x5102791ca02fc3595398400bfe0e33d7b6c82267",
        supply: "2627412705532190000027000000",
        changer: {
          activatedAt: "2018-03-25T15:17:37.868Z"
        },
        relayCurrencyId: "5a97f35fd66473f765d846c7"
      },
      status: "published",
      order: 132,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-01T12:05:29.944Z",
      isDeleted: false,
      primaryCommunityId: "5a97ec0fe90a8c00012fd350",
      numDecimalDigits: 18,
      name: "Lead Coin",
      primaryCommunityImageName: "63b76010-1d63-11e8-baf6-5fcc218084fc.png",
      lowerCaseSymbol: "ldc",
      lowerCaseCode: "ldc"
    },
    {
      _id: "5a97f35fd66473f765d846c7",
      symbol: "LDCBNT",
      type: "ethereum",
      code: "LDCBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xb79c3a1a2d50cc99459f3a21d709bcec86656e97",
        supply: "206372803522796976262000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x6411a822850dcfe2fae215248e47de77b1738bea",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-03-29T13:18:05.699Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "42609425401926922881745"
          },
          "5a97ec891cbcd07b03616d3b": {
            contractAddress: "0x5102791ca02fc3595398400bfe0e33d7b6c82267",
            currencySymbol: "LDC",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "25078500828923959347046776"
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-01T12:34:39.867Z",
      isDeleted: false,
      primaryCommunityId: "5a97f305cb8285000192c540",
      numDecimalDigits: 18,
      name: "Lead Coin Relay",
      primaryCommunityImageName: "c7d66aa0-1d4f-11e8-baf6-5fcc218084fc.jpeg",
      lowerCaseSymbol: "ldcbnt",
      lowerCaseCode: "ldcbnt",
      order: 131
    },
    {
      _id: "5aa65e09450d7792a35d8e4a",
      symbol: "SIG",
      type: "ethereum",
      code: "SIG",
      details: {
        type: "erc20",
        contractAddress: "0x6888a16ea9792c15a4dcf2f6c623d055c8ede792",
        supply: "378851756132668438465808450",
        changer: {
          activatedAt: "2018-03-14T21:47:43.980Z"
        },
        relayCurrencyId: "5aa660d11e0f48703bdc64dd"
      },
      status: "published",
      order: 130,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-12T11:01:29.560Z",
      isDeleted: false,
      primaryCommunityId: "5aa65d675ffa680001c99b66",
      numDecimalDigits: 18,
      name: "Spectiv",
      primaryCommunityImageName: "194daba0-2606-11e8-891a-85ca6815b23e.png",
      lowerCaseSymbol: "sig",
      lowerCaseCode: "sig"
    },
    {
      _id: "5aa660d11e0f48703bdc64dd",
      symbol: "SIGBNT",
      type: "ethereum",
      code: "SIGBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x09953e3e5c6be303d8d83ccb672d241abc9bee29",
        supply: "95330000000000000001000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xfe75413e059eecf6eb2b92f06456276e8596862b",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-03-13T21:47:14.165Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "37180220232198185171644",
            numDecimalDigits: 18
          },
          "5aa65e09450d7792a35d8e4a": {
            contractAddress: "0x6888a16ea9792c15a4dcf2f6c623d055c8ede792",
            currencySymbol: "SIG",
            ratio: 500000,
            balance: "7995723976033536001710928",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-12T11:13:21.247Z",
      isDeleted: false,
      primaryCommunityId: "5aa660bb5ffa680001c99b67",
      numDecimalDigits: 18,
      name: "Spectiv Relay",
      lowerCaseSymbol: "sigbnt",
      lowerCaseCode: "sigbnt",
      order: 129
    },
    {
      _id: "5ae98e6cf5578824a2725f49",
      symbol: "FKXBNT",
      lowerCaseSymbol: "fkxbnt",
      type: "ethereum",
      code: "FKXBNT",
      lowerCaseCode: "fkxbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x80c222e38fb57f0710af21128535096d90503285",
        supply: "107098994901810345036752",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x9f547e89078b24d0e2269ba08eb411102e98ca14",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-03T16:00:20.884Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "33045561735943671799462",
            numDecimalDigits: 18
          },
          "5ae9860e349b106da25832cd": {
            contractAddress: "0x009e864923b49263c7f10d19b7f8ab7a9a5aad33",
            currencySymbol: "FKX",
            ratio: 500000,
            balance: "4547932492626225945319873",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-02T10:09:48.704Z",
      isDeleted: false,
      primaryCommunityId: "5ae98e6388fed400011d904d",
      numDecimalDigits: 18,
      name: "FortKnoxster Relay",
      primaryCommunityImageName: "5529f3f0-4df1-11e8-a04a-a1dcf04454c8.png",
      order: 128
    },
    {
      _id: "5ae9860e349b106da25832cd",
      symbol: "FKX",
      lowerCaseSymbol: "fkx",
      type: "ethereum",
      code: "FKX",
      lowerCaseCode: "fkx",
      details: {
        type: "erc20",
        contractAddress: "0x009e864923b49263c7f10d19b7f8ab7a9a5aad33",
        supply: "150000000000000000000000000",
        changer: {
          activatedAt: "2018-05-03T16:00:53.910Z"
        },
        relayCurrencyId: "5ae98e6cf5578824a2725f49"
      },
      status: "published",
      order: 127,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-02T09:34:06.721Z",
      isDeleted: false,
      primaryCommunityId: "5ae984d70079720001196e77",
      numDecimalDigits: 18,
      name: "FortKnoxster",
      primaryCommunityImageName: "0d32be10-4dec-11e8-a04a-a1dcf04454c8.png"
    },
    {
      _id: "5a51bd2807932a000117672c",
      symbol: "SENSEBNT",
      type: "ethereum",
      code: "SENSEBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x47244bc49d90f25473ebf8ad0a14ea6d4232a4c7",
        supply: "109622000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xc31db08240a11df6a4c159ff4e6d69f484fc3828",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-15T22:43:10.730Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "44421506491652700048874"
          },
          "5a32880be42b240001a15bad": {
            contractAddress: "0x6745fab6801e376cd24f03572b9c9b0d4edddccf",
            currencySymbol: "SENSE",
            ratio: 500000,
            numDecimalDigits: 8,
            balance: "644902402522575"
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-07T06:24:40.168Z",
      isDeleted: false,
      primaryCommunityId: "5a51bd20d9aebc0001175fb1",
      numDecimalDigits: 18,
      name: "Sense Relay",
      primaryCommunityImageName: "b477a6d0-f479-11e7-aabd-a344aed92db1.png",
      lowerCaseSymbol: "sensebnt",
      lowerCaseCode: "sensebnt",
      order: 126
    },
    {
      _id: "5a32880be42b240001a15bad",
      symbol: "SENSE",
      type: "ethereum",
      code: "SENSE",
      details: {
        type: "erc20",
        contractAddress: "0x6745fab6801e376cd24f03572b9c9b0d4edddccf",
        supply: "66363636600000000",
        changer: {
          activatedAt: "2018-01-15T22:43:01.546Z"
        },
        relayCurrencyId: "5a51bd2807932a000117672c"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-14T14:17:47.427Z",
      isDeleted: false,
      primaryCommunityId: "5a3287e193d1f500018b0578",
      numDecimalDigits: 8,
      name: "Sensay",
      primaryCommunityImageName: "93fab230-f479-11e7-aabd-a344aed92db1.png",
      order: 125,
      isDiscoverable: true,
      lowerCaseSymbol: "sense",
      lowerCaseCode: "sense"
    },
    {
      _id: "5aa61c76450d771c395d3403",
      symbol: "UPBNT",
      type: "ethereum",
      code: "UPBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xd4c810fdca379831078267f3402845e5205aa0e1",
        supply: "90724000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xa7a402266ceea0652ea8eafd919d619d16bee134",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-03-17T14:02:57.422Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "32761192009298708274082",
            numDecimalDigits: 18
          },
          "5aa61b9bd5a17c4dc8b098ac": {
            contractAddress: "0x6ba460ab75cd2c56343b3517ffeba60748654d26",
            currencySymbol: "UP",
            ratio: 500000,
            balance: "210309884922657",
            numDecimalDigits: 8
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-12T06:21:42.238Z",
      isDeleted: false,
      primaryCommunityId: "5aa61c6e28582400019d9f71",
      numDecimalDigits: 18,
      name: "Coinme Relay",
      primaryCommunityImageName: "08184660-2b65-11e8-baf6-5fcc218084fc.png",
      lowerCaseSymbol: "upbnt",
      lowerCaseCode: "upbnt",
      order: 124
    },
    {
      _id: "5aa61b9bd5a17c4dc8b098ac",
      symbol: "UP",
      type: "ethereum",
      code: "UP",
      details: {
        type: "erc20",
        contractAddress: "0x6ba460ab75cd2c56343b3517ffeba60748654d26",
        supply: "1000000000000000000",
        changer: {
          activatedAt: "2018-03-17T14:03:33.906Z"
        },
        relayCurrencyId: "5aa61c76450d771c395d3403"
      },
      status: "published",
      order: 123,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-12T06:18:03.439Z",
      isDeleted: false,
      primaryCommunityId: "5aa61b919376630001c743da",
      numDecimalDigits: 8,
      name: "UpToken",
      primaryCommunityImageName: "7c584fd0-2b5f-11e8-baf6-5fcc218084fc.png",
      lowerCaseSymbol: "up",
      lowerCaseCode: "up"
    },
    {
      _id: "5a60937501b4a8000153a22e",
      symbol: "XDCE",
      type: "ethereum",
      code: "XDCE",
      details: {
        type: "erc20",
        contractAddress: "0x41ab1b6fcbb2fa9dced81acbdec13ea6315f2bf2",
        supply: "15000000000000000000000000000",
        changer: {
          activatedAt: "2018-03-16T19:08:25.626Z"
        },
        relayCurrencyId: "5a8c2bd15ea75000016f24d4"
      },
      status: "published",
      order: 122,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-18T12:30:45.437Z",
      isDeleted: false,
      primaryCommunityId: "5a6093537b6b0e0001fc6cf2",
      numDecimalDigits: 18,
      name: "XinFin",
      primaryCommunityImageName: "e90d16e0-163f-11e8-a36b-c1b17c6baaea.png",
      lowerCaseSymbol: "xdce",
      lowerCaseCode: "xdce"
    },
    {
      _id: "5a8c2bd15ea75000016f24d4",
      symbol: "XDCEBNT",
      type: "ethereum",
      code: "XDCEBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xd1bb51fecc950c7b1e4197d8d13a1d2a60795d2c",
        supply: "83198963150501960522876",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x2dad2c84f6c3957ef4b83a5df6f1339dfd9e6080",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-03-16T19:09:21.827Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "35672737056027546804531",
            numDecimalDigits: 18
          },
          "5a60937501b4a8000153a22e": {
            contractAddress: "0x41ab1b6fcbb2fa9dced81acbdec13ea6315f2bf2",
            currencySymbol: "XDCE",
            ratio: 500000,
            balance: "26514005927143248156489560",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-20T14:08:17.262Z",
      isDeleted: false,
      primaryCommunityId: "5a8c2bc20cefca0001207ed6",
      numDecimalDigits: 18,
      name: "XinFin Relay",
      primaryCommunityImageName: "94c72b90-1647-11e8-a36b-c1b17c6baaea.png",
      lowerCaseSymbol: "xdcebnt",
      lowerCaseCode: "xdcebnt",
      order: 121
    },
    {
      _id: "5a1fcea2634e000001878564",
      symbol: "BNBBNT",
      type: "ethereum",
      code: "BNBBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xe6b31fb3f29fbde1b92794b0867a315ff605a324",
        supply: "47066033922545371274005",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x751b934e7496e437503d74d0679a45e49c0b7071",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-14T22:02:23.507Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "35377203992195998973854"
          },
          "5a1fb3df634e000001878563": {
            contractAddress: "0xb8c77482e45f1f44de1745f52c74426c631bdd52",
            currencySymbol: "BNB",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "7594878588433317398886"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-30T09:25:54.145Z",
      primaryCommunityId: "5a1fce94e17ffd0001b8ef9d",
      numDecimalDigits: 18,
      primaryCommunityImageName: "7c0d2870-f94b-11e7-aabd-a344aed92db1.png",
      name: "Binance Relay",
      isDeleted: false,
      isDiscoverable: true,
      lowerCaseSymbol: "bnbbnt",
      lowerCaseCode: "bnbbnt",
      order: 120
    },
    {
      _id: "5a1fb3df634e000001878563",
      symbol: "BNB",
      type: "ethereum",
      code: "BNB",
      details: {
        type: "erc20",
        contractAddress: "0xb8c77482e45f1f44de1745f52c74426c631bdd52",
        supply: "199013968000000000000000000",
        changer: {
          activatedAt: "2018-01-14T22:02:03.653Z"
        },
        relayCurrencyId: "5a1fcea2634e000001878564"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-30T07:31:43.867Z",
      primaryCommunityId: "5a1fb39de17ffd0001b8ef99",
      numDecimalDigits: 18,
      primaryCommunityImageName: "43332c20-f94b-11e7-9454-0922d1574472.png",
      name: "Binance",
      isDeleted: false,
      order: 119,
      isDiscoverable: true,
      lowerCaseSymbol: "bnb",
      lowerCaseCode: "bnb"
    },
    {
      _id: "5a69a9cc1b67798dab40b99b",
      symbol: "MTL",
      type: "ethereum",
      name: "Metal",
      code: "MTL",
      status: "published",
      stage: "traded",
      details: {
        type: "erc20",
        contractAddress: "0xf433089366899d83a9f26a773d59ec7ecf30355e",
        supply: "6658888800000000",
        changer: {
          activatedAt: "2018-06-26T07:50:14.265Z"
        },
        relayCurrencyId: "5b1e0404807958967756043c"
      },
      numDecimalDigits: 8,
      primaryCommunityImageName: "5ffa1c20-6d53-11e8-9b33-47ec6716605d.png",
      isDeleted: false,
      isDiscoverable: true,
      createdAt: "2018-01-25T09:56:28.439Z",
      lowerCaseSymbol: "mtl",
      lowerCaseCode: "mtl",
      primaryCommunityId: "5b1e200944355cdcf878df7f",
      order: 118
    },
    {
      _id: "5afad1e8a40e8ccd21fa1a7f",
      symbol: "MRG",
      lowerCaseSymbol: "mrg",
      type: "ethereum",
      code: "MRG",
      lowerCaseCode: "mrg",
      details: {
        type: "erc20",
        contractAddress: "0xcbee6459728019cb1f2bb971dde2ee3271bc7617",
        supply: "100,000,000.00",
        changer: {
          activatedAt: "2018-05-29T16:27:03.710Z"
        },
        relayCurrencyId: "5afacfc336fa80649def7e5a"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-15T12:26:16.329Z",
      isDeleted: false,
      primaryCommunityId: "5afad1ce1cd106000162effe",
      numDecimalDigits: 18,
      name: "Wemerge",
      primaryCommunityImageName: "3e2b73f0-583b-11e8-b48c-35d88ea2b959.png",
      order: 118
    },
    {
      _id: "5b190c66c26f474628422a40",
      symbol: "BBO",
      lowerCaseSymbol: "bbo",
      type: "ethereum",
      code: "BBO",
      lowerCaseCode: "bbo",
      details: {
        type: "erc20",
        contractAddress: "0x84f7c44b6fed1080f647e354d552595be2cc602f",
        supply: "1999751536605432145941728000",
        changer: {
          activatedAt: "2018-06-18T07:29:46.446Z"
        },
        relayCurrencyId: "5b190e12e6d62fcafccf01ce"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-06-07T10:43:50.253Z",
      isDeleted: false,
      primaryCommunityId: "5b190c55c4a1a60001decac7",
      numDecimalDigits: 18,
      name: "Bigbom",
      primaryCommunityImageName: "6ce608f0-6a46-11e8-9b33-47ec6716605d.png",
      order: 118
    },
    {
      _id: "5afacfc336fa80649def7e5a",
      symbol: "MRGBNT",
      lowerCaseSymbol: "mrgbnt",
      type: "ethereum",
      code: "MRGBNT",
      lowerCaseCode: "mrgbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x25bf8913d6296a69c7b43bc781614992cb218935",
        supply: "57200000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xe65c7e27c1c086f26ce0daa986c3d9c24ef3c2d8",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-29T16:26:20.479Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "32218528445244833244680",
            numDecimalDigits: 18
          },
          "5afad1e8a40e8ccd21fa1a7f": {
            contractAddress: "0xcbee6459728019cb1f2bb971dde2ee3271bc7617",
            currencySymbol: "MRG",
            ratio: 500000,
            balance: "8490569814132080037482565",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-15T12:17:07.328Z",
      isDeleted: false,
      primaryCommunityId: "5afacfbb794f5d00014c2ce3",
      numDecimalDigits: 18,
      name: "Wemerge Relay",
      primaryCommunityImageName: "716ee2c0-583a-11e8-b48c-35d88ea2b959.png",
      order: 117
    },
    {
      _id: "5b0fdbcd3b7891d727d11e4f",
      symbol: "CEEK",
      lowerCaseSymbol: "ceek",
      type: "ethereum",
      code: "CEEK",
      lowerCaseCode: "ceek",
      details: {
        type: "erc20",
        contractAddress: "0xb056c38f6b7dc4064367403e26424cd2c60655e1",
        supply: "1,000,000,000,000,000,000,000,000,000.00",
        changer: {
          activatedAt: "2018-06-06T08:16:15.787Z"
        },
        relayCurrencyId: "5b0fde738bfb800b8546063e"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-31T11:26:05.520Z",
      isDeleted: false,
      primaryCommunityId: "5b0fdbac88cc9e000182ff0f",
      numDecimalDigits: 18,
      name: "CEEK VR",
      primaryCommunityImageName: "63736710-64d1-11e8-b0ae-6d2fb3484860.png",
      order: 116
    },
    {
      _id: "5b0fde738bfb800b8546063e",
      symbol: "CEEKBNT",
      lowerCaseSymbol: "ceekbnt",
      type: "ethereum",
      code: "CEEKBNT",
      lowerCaseCode: "ceekbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x2f2ad6954d99ea14fa145b9ab0fb6ba5ac32c0ee",
        supply: "70352000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xc18166e01970be040d8c7761cdd1c3372ae1edf0",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-06-06T08:17:42.041Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "25775903767184238302029",
            numDecimalDigits: 18
          },
          "5b0fdbcd3b7891d727d11e4f": {
            contractAddress: "0xb056c38f6b7dc4064367403e26424cd2c60655e1",
            currencySymbol: "CEEK",
            ratio: 500000,
            balance: "2465339135586333089007757",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-31T11:37:23.839Z",
      isDeleted: false,
      primaryCommunityId: "5b0fde6562bc740001af9f27",
      numDecimalDigits: 18,
      name: "CEEK VR Relay",
      primaryCommunityImageName: "d7131f90-64d0-11e8-b0ae-6d2fb3484860.png",
      order: 115
    },
    {
      _id: "5afc2bd5ea38e7d37643002b",
      symbol: "ELI",
      lowerCaseSymbol: "eli",
      type: "ethereum",
      code: "ELI",
      lowerCaseCode: "eli",
      details: {
        type: "erc20",
        contractAddress: "0xc7c03b8a3fc5719066e185ea616e87b88eba44a3",
        supply: "327,902,034,000,000,000,000,000,000.00",
        changer: {
          activatedAt: "2018-05-18T18:27:26.180Z"
        },
        relayCurrencyId: "5afc2e8a9712bab5c5c12006"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-16T13:02:13.712Z",
      isDeleted: false,
      primaryCommunityId: "5afc2bcbc1ec90000120430a",
      numDecimalDigits: 18,
      name: "Eligma",
      primaryCommunityImageName: "fb289e50-5cfb-11e8-b48c-35d88ea2b959.png",
      order: 114
    },
    {
      _id: "5afc2e8a9712bab5c5c12006",
      symbol: "ELIBNT",
      lowerCaseSymbol: "elibnt",
      type: "ethereum",
      code: "ELIBNT",
      lowerCaseCode: "elibnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x9ad9ba0bb0001e9571073b595562af9645273ab1",
        supply: "85043592928512174909364",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xb5a5a031d8b8577871384be6055b2ea29fac064c",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-18T18:27:17.412Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "25327601971251127354359",
            numDecimalDigits: 18
          },
          "5afc2bd5ea38e7d37643002b": {
            contractAddress: "0xc7c03b8a3fc5719066e185ea616e87b88eba44a3",
            currencySymbol: "ELI",
            ratio: 500000,
            balance: "4013120011560941787595835",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-16T13:13:46.959Z",
      isDeleted: false,
      primaryCommunityId: "5afc2e80c1ec90000120430c",
      numDecimalDigits: 18,
      name: "Eligma Relay",
      primaryCommunityImageName: "ecc1ca30-5cfb-11e8-a205-7bf13fb32a99.png",
      order: 113
    },
    {
      _id: "5b05350603269839025fbb32",
      symbol: "XNKBNT",
      lowerCaseSymbol: "xnkbnt",
      type: "ethereum",
      code: "XNKBNT",
      lowerCaseCode: "xnkbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x1b4d8c62ddf6947616a5fcda4ca40a8715d2a4cb",
        supply: "60944000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x4f138e1ceec7b33dfa4f3051594ec016a08c7513",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-26T15:39:28.875Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "26327326175244938860377",
            numDecimalDigits: 18
          },
          "5b05322332e5aaa0a77c26c4": {
            contractAddress: "0xbc86727e770de68b1060c91f6bb6945c73e10388",
            currencySymbol: "XNK",
            ratio: 500000,
            balance: "3748817099776959626035923",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-23T09:31:50.359Z",
      isDeleted: false,
      primaryCommunityId: "5b0534f71cd106000162f26a",
      numDecimalDigits: 18,
      name: "Ink Protocol Relay",
      primaryCommunityImageName: "3ba8fe90-5e6c-11e8-9952-89831889dec2.png",
      order: 112
    },
    {
      _id: "5a329b629416220001fa61f7",
      type: "ethereum",
      name: "Flixxo",
      code: "FLIXX",
      status: "published",
      stage: "traded",
      details: {
        type: "erc20",
        contractAddress: "0xf04a8ac553fcedb5ba99a64799155826c136b0be",
        supply: "189151328574678856483195800",
        changer: {
          activatedAt: "2018-06-21T16:07:06.217Z"
        },
        relayCurrencyId: "5a33c3a9e42b240001a16c8e"
      },
      numDecimalDigits: 18,
      isDiscoverable: true,
      createdAt: "2018-01-25T10:07:51.310Z",
      symbol: "FLIXX",
      isDeleted: false,
      primaryCommunityImageName: "Flixxo.png",
      primaryCommunityId: "5a329b504f1311000100bab8",
      lowerCaseSymbol: "flixx",
      lowerCaseCode: "flixx",
      order: 111
    },
    {
      _id: "5b05322332e5aaa0a77c26c4",
      symbol: "XNK",
      lowerCaseSymbol: "xnk",
      type: "ethereum",
      code: "XNK",
      lowerCaseCode: "xnk",
      details: {
        type: "erc20",
        contractAddress: "0xbc86727e770de68b1060c91f6bb6945c73e10388",
        supply: "500000000000000000000000000",
        changer: {
          activatedAt: "2018-05-26T15:40:10.695Z"
        },
        relayCurrencyId: "5b05350603269839025fbb32"
      },
      status: "published",
      order: 111,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-23T09:19:31.659Z",
      isDeleted: false,
      primaryCommunityId: "5b0531f8c1ec90000120451e",
      numDecimalDigits: 18,
      name: "Ink Protocol",
      primaryCommunityImageName: "93e9d680-5e6a-11e8-9952-89831889dec2.png"
    },
    {
      _id: "5a89a2a44ad829000135d1d0",
      symbol: "BETRBNT",
      type: "ethereum",
      code: "BETRBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x679f601f0deb53c2db0c8c26369fdcba5fd753cf",
        supply: "2331058000000000000000000",
        changer: {
          type: "bancor",
          version: "0.7",
          contractAddress: "0x8bb76c5ae6b7d6bd1678510edd06444acdf8f72b",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-19T14:09:16.963Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "26173777600026619276069"
          },
          "5a89a0538eae3b0001747e88": {
            contractAddress: "0x763186eb8d4856d536ed4478302971214febc6a9",
            currencySymbol: "BETR",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "1565440564980149711564698"
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-18T15:58:28.580Z",
      isDeleted: false,
      primaryCommunityId: "5a89a2990cefca0001207e23",
      numDecimalDigits: 18,
      name: "Better Betting Relay",
      primaryCommunityImageName: "717270b0-6eed-11e8-8840-c7b05733591e.png",
      lowerCaseSymbol: "betrbnt",
      lowerCaseCode: "betrbnt",
      order: 110
    },
    {
      _id: "5a89a0538eae3b0001747e88",
      symbol: "BETR",
      type: "ethereum",
      code: "BETR",
      details: {
        type: "erc20",
        contractAddress: "0x763186eb8d4856d536ed4478302971214febc6a9",
        supply: "128161353027931567948214687",
        changer: {
          activatedAt: "2018-02-19T14:23:23.201Z"
        },
        relayCurrencyId: "5a89a2a44ad829000135d1d0"
      },
      status: "published",
      stage: "traded",
      order: 109,
      isDiscoverable: true,
      createdAt: "2018-02-18T15:48:35.573Z",
      isDeleted: false,
      primaryCommunityId: "5a89a03b583f4a0001f75d47",
      numDecimalDigits: 18,
      name: "BetterBetting",
      primaryCommunityImageName: "34a456d0-6eed-11e8-9b33-47ec6716605d.png",
      lowerCaseSymbol: "betr",
      lowerCaseCode: "betr"
    },
    {
      _id: "5a43dd317b7ec50001a98241",
      symbol: "XBPBNT",
      type: "ethereum",
      code: "XBPBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xbb83a9fe991baa72f412f39af254eebbfdc910ba",
        supply: "51076000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xba2be1cd1f00470c21385b7cbed6211aefac0172",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-04-23T11:39:19.671Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "25410142737425082614203",
            numDecimalDigits: 18
          },
          "5a43d37c7b7ec50001a98137": {
            contractAddress: "0x28dee01d53fed0edf5f6e310bf8ef9311513ae40",
            currencySymbol: "XBP",
            ratio: 500000,
            balance: "20031286611631769336759112",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2017-12-27T17:49:37.529Z",
      isDeleted: false,
      primaryCommunityId: "5a43dd1644c5eb000195c97e",
      numDecimalDigits: 18,
      name: "BlitzPredict Relay",
      primaryCommunityImageName: "601632e0-eb2e-11e7-875f-03079c4bb7e5.jpeg",
      lowerCaseSymbol: "xbpbnt",
      lowerCaseCode: "xbpbnt",
      order: 108
    },
    {
      _id: "5a43d37c7b7ec50001a98137",
      symbol: "XBP",
      type: "ethereum",
      code: "XBP",
      details: {
        type: "erc20",
        contractAddress: "0x28dee01d53fed0edf5f6e310bf8ef9311513ae40",
        supply: "950873123276599998652200000",
        changer: {
          activatedAt: "2018-04-23T11:44:33.381Z"
        },
        relayCurrencyId: "5a43dd317b7ec50001a98241"
      },
      status: "published",
      order: 107,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2017-12-27T17:08:12.218Z",
      isDeleted: false,
      primaryCommunityId: "5a43d36644c5eb000195c978",
      numDecimalDigits: 18,
      name: "BlitzPredict",
      primaryCommunityImageName: "94736860-eb28-11e7-875f-03079c4bb7e5.jpeg",
      lowerCaseSymbol: "xbp",
      lowerCaseCode: "xbp"
    },
    {
      _id: "5a549246cc62d20001e5855a",
      symbol: "SRNBNT",
      type: "ethereum",
      code: "SRNBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xd2deb679ed81238caef8e0c32257092cecc8888b",
        supply: "108361451557244535793701",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xd3a3bace3d61f6f5d16a9b415d51813cd2ea3887",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-09T20:38:42.601Z"
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-09T09:58:30.883Z",
      isDeleted: false,
      primaryCommunityId: "5a54922fd9aebc00011760a2",
      numDecimalDigits: 18,
      name: "Sirin Labs Relay",
      primaryCommunityImageName: "966b02c0-f525-11e7-bc6b-87a36d827eff.png",
      lowerCaseSymbol: "srnbnt",
      lowerCaseCode: "srnbnt",
      order: 106
    },
    {
      _id: "5a548d3244680b000198e7f3",
      symbol: "SRN",
      type: "ethereum",
      code: "SRN",
      details: {
        type: "erc20",
        contractAddress: "0x68d57c9a1c35f63e2c83ee8e49a64e9d70528d25",
        supply: "572166103885716646983596714",
        changer: {
          activatedAt: "2018-01-09T20:38:25.862Z"
        },
        relayCurrencyId: "5a549246cc62d20001e5855a"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-09T09:36:50.824Z",
      isDeleted: false,
      primaryCommunityId: "5a548d047b6b0e0001fc69ba",
      numDecimalDigits: 18,
      name: "Sirin Labs",
      primaryCommunityImageName: "c8845400-f525-11e7-9454-0922d1574472.png",
      order: 105,
      lowerCaseSymbol: "srn",
      lowerCaseCode: "srn"
    },
    {
      _id: "5a69a9cf1b67798dab40b9ac",
      symbol: "PLR",
      type: "ethereum",
      name: "Pillar",
      code: "PLR",
      status: "published",
      stage: "traded",
      details: {
        type: "erc20",
        contractAddress: "0xe3818504c1b32bf1557b16c238b2e01fd3149c17",
        supply: "800000000000000000000000000",
        changer: {
          activatedAt: "2018-03-29T17:23:11.141Z"
        },
        relayCurrencyId: "5a73499b9bee5b00013c33b4"
      },
      numDecimalDigits: 18,
      primaryCommunityImageName: "e052c3b0-35c5-11e8-a132-e5d1db607067.png",
      isDeleted: false,
      isDiscoverable: true,
      order: 104,
      createdAt: "2018-01-25T09:56:31.124Z",
      primaryCommunityId: "5a780b3a287443a5cdea2477",
      lowerCaseSymbol: "plr",
      lowerCaseCode: "plr"
    },
    {
      _id: "5a73499b9bee5b00013c33b4",
      symbol: "PLRBNT",
      type: "ethereum",
      code: "PLRBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x2843f6c3b14e698e3d7562584959c61274f93328",
        supply: "86243959178489864060000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x2ac0e433c3c9ad816db79852d6f933b0b117aefe",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-03-29T17:21:01.863Z"
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-01T17:08:43.051Z",
      isDeleted: false,
      primaryCommunityId: "5a7349919b393a00014ae80a",
      numDecimalDigits: 18,
      name: "Pillar Relay",
      primaryCommunityImageName: "bae9d2e0-3597-11e8-a132-e5d1db607067.png",
      lowerCaseSymbol: "plrbnt",
      lowerCaseCode: "plrbnt",
      order: 103
    },
    {
      _id: "5a5ef872c5e04600015b413e",
      symbol: "VEEBNT",
      type: "ethereum",
      code: "VEEBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xc9c3a465380bfaac486c89ff7d5f60cc275d4e08",
        supply: "71320000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x3b42239a8bc2f07bb16b17578fe44ff2422c16f6",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-20T16:24:45.322Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-17T07:17:06.542Z",
      isDeleted: false,
      primaryCommunityId: "5a5ef8637b6b0e0001fc6c9c",
      numDecimalDigits: 18,
      name: "BLOCKv Relay",
      primaryCommunityImageName: "e46f0ea0-fb6d-11e7-9454-0922d1574472.png",
      lowerCaseSymbol: "veebnt",
      lowerCaseCode: "veebnt",
      order: 102
    },
    {
      _id: "5a5eeb3fc5e04600015b40f1",
      symbol: "VEE",
      type: "ethereum",
      code: "VEE",
      details: {
        type: "erc20",
        contractAddress: "0x340d2bde5eb28c1eed91b2f790723e3b160613b7",
        supply: "3646271241200255205023407108",
        changer: {
          activatedAt: "2018-02-20T16:26:51.454Z"
        },
        relayCurrencyId: "5a5ef872c5e04600015b413e"
      },
      status: "published",
      stage: "traded",
      order: 101,
      isDiscoverable: true,
      createdAt: "2018-01-17T06:20:47.020Z",
      isDeleted: false,
      primaryCommunityId: "5a5eeb1b399bc50001662575",
      numDecimalDigits: 18,
      name: "BLOCKv",
      primaryCommunityImageName: "b50fe640-fb6b-11e7-9454-0922d1574472.png",
      lowerCaseSymbol: "vee",
      lowerCaseCode: "vee"
    },
    {
      _id: "5a26a1870c970f0001f22a8f",
      symbol: "KICK",
      type: "ethereum",
      details: {
        type: "bancor",
        subType: "smart",
        contractAddress: "0x27695e09149adc738a978e9a678f99e4c39e9eb9",
        supply: "52622325559184645",
        changer: {
          type: "bancor",
          version: "0.7",
          contractAddress: "0x51907923c3280c24b6b69b0d217ea34cabde684d",
          isActive: true,
          activatedAt: "2018-05-29T10:00:00.341Z"
        },
      },
      status: "published",
      stage: "traded",
      createdAt: "2018-04-06T17:51:34.341Z",
      primaryCommunityId: "5a26a15e93d1f500018b02ba",
      numDecimalDigits: 8,
      primaryCommunityImageName: "KickCoin.png",
      code: "KICK",
      name: "KICKICO",
      isDeleted: false,
      order: 100,
      isDiscoverable: true,
      lowerCaseSymbol: "kick",
      lowerCaseCode: "kick"
    },
    {
      _id: "5a3789b5a88c2a00013b61fc",
      symbol: "DTRC",
      type: "ethereum",
      code: "DTRC",
      details: {
        type: "erc20",
        contractAddress: "0xc20464e0c373486d2b3335576e83a218b1618a5e",
        supply: "239992867336773858158249736",
        changer: {
          activatedAt: "2018-04-26T09:03:10.536Z"
        },
        relayCurrencyId: "5a378e72a88c2a00013b65d2"
      },
      status: "published",
      order: 99,
      stage: "traded",
      createdAt: "2017-12-18T09:26:13.729Z",
      isDeleted: false,
      primaryCommunityId: "5a37896193d1f500018b06af",
      numDecimalDigits: 18,
      name: "Datarius Credit",
      primaryCommunityImageName: "719a99a0-e4aa-11e7-93e8-03f720d5bc8c.png",
      isDiscoverable: true,
      lowerCaseSymbol: "dtrc",
      lowerCaseCode: "dtrc"
    },
    {
      _id: "5a54be4e07932a000117c00f",
      symbol: "RLCBNT",
      type: "ethereum",
      code: "RLCBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x9003411ac4073c2d9f37af71d00e373b72cbe9e2",
        supply: "38633197304351176033574",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x8b30e174bddb3c0376e666afb8a4196e2f53182d",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-11T11:33:38.214Z"
        },
      },
      status: "published",
      isDiscoverable: true,
      stage: "traded",
      createdAt: "2018-01-09T13:06:22.277Z",
      isDeleted: false,
      primaryCommunityId: "5a54be437b6b0e0001fc69d0",
      numDecimalDigits: 18,
      name: "iExec Relay",
      primaryCommunityImageName: "027d40f0-f53e-11e7-aabd-a344aed92db1.png",
      lowerCaseSymbol: "rlcbnt",
      lowerCaseCode: "rlcbnt",
      order: 98
    },
    {
      _id: "5a54b9cfb6b5870001b890e0",
      symbol: "RLC",
      type: "ethereum",
      code: "RLC",
      details: {
        type: "erc20",
        contractAddress: "0x607f4c5bb672230e8672085532f7e901544a7375",
        supply: "86999784986845492",
        changer: {
          activatedAt: "2018-03-06T22:10:06.749Z"
        },
        relayCurrencyId: "5a54be4e07932a000117c00f"
      },
      status: "published",
      isDiscoverable: true,
      stage: "traded",
      createdAt: "2018-01-09T12:47:11.379Z",
      isDeleted: false,
      primaryCommunityId: "5a54b99c399bc50001662287",
      numDecimalDigits: 9,
      name: "iExec",
      primaryCommunityImageName: "836bdeb0-f6ce-11e7-9454-0922d1574472.png",
      order: 97,
      lowerCaseSymbol: "rlc",
      lowerCaseCode: "rlc"
    },
    {
      _id: "5b0530cddeec7a47f41143b4",
      symbol: "HOTBNT",
      lowerCaseSymbol: "hotbnt",
      type: "ethereum",
      code: "HOTBNT",
      lowerCaseCode: "hotbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x0ac0e122d09cc4da4a96cc2731d2b7cc1f8b025a",
        supply: "53586086433462451798000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xc6aacdf2cb021515009098025a0ece472608918e",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-24T21:27:57.693Z"
        },
        reserves: {
          "594bb7e468a95e00203b048d": {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            balance: "20849261849399251221618",
            numDecimalDigits: 18
          },
          "5b052fcb73c0d120294802ae": {
            contractAddress: "0x9af839687f6c94542ac5ece2e317daae355493a1",
            currencySymbol: "HOT",
            ratio: 500000,
            balance: "2178113576256259522823006",
            numDecimalDigits: 18
          }
        }
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-23T09:13:49.853Z",
      isDeleted: false,
      primaryCommunityId: "5b0530c61cd106000162f269",
      numDecimalDigits: 18,
      name: "Hydro Protocol Relay",
      primaryCommunityImageName: "ae39a2f0-5e69-11e8-9952-89831889dec2.png",
      order: 96
    },
    {
      _id: "5b052fcb73c0d120294802ae",
      symbol: "HOT",
      lowerCaseSymbol: "hot",
      type: "ethereum",
      code: "HOT",
      lowerCaseCode: "hot",
      details: {
        type: "erc20",
        contractAddress: "0x9af839687f6c94542ac5ece2e317daae355493a1",
        supply: "1560000000000000000000000000",
        changer: {
          activatedAt: "2018-05-24T20:42:15.456Z"
        },
        relayCurrencyId: "5b0530cddeec7a47f41143b4"
      },
      status: "published",
      order: 95,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-23T09:09:31.677Z",
      isDeleted: false,
      primaryCommunityId: "5b052fb81cd106000162f268",
      numDecimalDigits: 18,
      name: "Hydro Protocol",
      primaryCommunityImageName: "22b822b0-5e69-11e8-9952-89831889dec2.png"
    },
    {
      _id: "5a9fcf6818e400ceb73a8949",
      symbol: "ESZBNT",
      type: "ethereum",
      code: "ESZBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xa2020e324c365d05e87cf25552e6e6734260b089",
        supply: "51997800000054864243803",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x0a9ed23490cf8f89e750bbc3e28f96502bb45491",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-03-13T16:49:25.075Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-07T11:39:20.824Z",
      isDeleted: false,
      primaryCommunityId: "5a9fcf529376630001c742a0",
      numDecimalDigits: 18,
      name: "EtherSportz Relay",
      primaryCommunityImageName: "4a8474f0-21fc-11e8-85f0-f592f4a72353.png",
      lowerCaseSymbol: "eszbnt",
      lowerCaseCode: "eszbnt",
      order: 94
    },
    {
      _id: "5a9fcbb9f777533f052234b5",
      symbol: "ESZ",
      type: "ethereum",
      code: "ESZ",
      details: {
        type: "erc20",
        contractAddress: "0xe8a1df958be379045e2b46a31a98b93a2ecdfded",
        supply: "10000000000000000000000000",
        changer: {
          activatedAt: "2018-03-13T16:46:17.605Z"
        },
        relayCurrencyId: "5a9fcf6818e400ceb73a8949"
      },
      status: "published",
      order: 93,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-07T11:23:37.167Z",
      isDeleted: false,
      primaryCommunityId: "5a9fcba5ad1988000122eaf4",
      numDecimalDigits: 18,
      name: "Ethersportz",
      primaryCommunityImageName: "03032b00-21fa-11e8-85f0-f592f4a72353.png",
      lowerCaseSymbol: "esz",
      lowerCaseCode: "esz"
    },
    {
      _id: "5a3cb9eec4c2b60001f748a0",
      symbol: "DRGNBNT",
      type: "ethereum",
      code: "DRGNBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xa7774f9386e1653645e1a08fb7aae525b4dedb24",
        supply: "89410652180370647557345",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xfa968bc2e4768d431ffec4ee64307f8152e1c9f1",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-06T22:47:54.531Z"
        },
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-22T07:53:18.834Z",
      isDeleted: false,
      primaryCommunityId: "5a3cb9dff23600000159d2c2",
      numDecimalDigits: 18,
      name: "Dragonchain Relay",
      primaryCommunityImageName: "e2e32ad0-f393-11e7-bc6b-87a36d827eff.png",
      isDiscoverable: true,
      lowerCaseSymbol: "drgnbnt",
      lowerCaseCode: "drgnbnt",
      order: 92
    },
    {
      _id: "5a3cb6868fb75500011ab51d",
      symbol: "DRGN",
      type: "ethereum",
      code: "DRGN",
      details: {
        type: "erc20",
        contractAddress: "0x419c4db4b9e25d6db2ad9691ccb832c8d9fda05e",
        supply: "433494437000000000000000000",
        changer: {
          activatedAt: "2018-01-06T22:47:43.968Z"
        },
        relayCurrencyId: "5a3cb9eec4c2b60001f748a0"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-22T07:38:46.449Z",
      isDeleted: false,
      primaryCommunityId: "5a3cb5cb7d8bd2000191297f",
      numDecimalDigits: 18,
      name: "Dragonchain",
      primaryCommunityImageName: "5663e3a0-f3d5-11e7-9454-0922d1574472.png",
      order: 91,
      isDiscoverable: true,
      lowerCaseSymbol: "drgn",
      lowerCaseCode: "drgn"
    },
    {
      _id: "5ac0a4de9617446af309cc25",
      symbol: "GOLDBNT",
      type: "ethereum",
      code: "GOLDBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xb4961fa7358efa9b3a9f8e03c82c596b429cf453",
        supply: "90001000978458434574633",
        changer: {
          type: "bancor",
          version: "0.7",
          contractAddress: "0x315b9696cd3c83bb3e082f5c7f612cd2126f90d1",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-04-02T17:05:32.631Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-04-01T09:22:38.144Z",
      isDeleted: false,
      primaryCommunityId: "5ac0a4ce4d4a5c000117fa24",
      numDecimalDigits: 18,
      name: "Goldmint Relay",
      primaryCommunityImageName: "68e7f3e0-358e-11e8-9b64-c1e3a770fe2d.png",
      lowerCaseSymbol: "goldbnt",
      lowerCaseCode: "goldbnt",
      order: 90
    },
    {
      _id: "5ac09bd046d7d4c6269d440f",
      symbol: "GOLD",
      type: "ethereum",
      code: "GOLD",
      details: {
        type: "erc20",
        contractAddress: "0x61d40b844ea5b68c9c504fccdb05b68c2d7ae965",
        supply: "100000000000000000000",
        changer: {
          activatedAt: "2018-04-02T17:04:39.873Z"
        },
        relayCurrencyId: "5ac0a4de9617446af309cc25"
      },
      status: "published",
      order: 89,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-04-01T08:44:00.799Z",
      isDeleted: false,
      primaryCommunityId: "5ac09bc7b1ccbd0001a7578f",
      numDecimalDigits: 18,
      name: "Goldmint",
      primaryCommunityImageName: "ab56a1e0-3746-11e8-9b64-c1e3a770fe2d.png",
      lowerCaseSymbol: "gold",
      lowerCaseCode: "gold"
    },
    {
      _id: "5ae5bf1c3c124c8c3d024e02",
      symbol: "ZIPT",
      lowerCaseSymbol: "zipt",
      type: "ethereum",
      code: "ZIPT",
      lowerCaseCode: "zipt",
      details: {
        type: "erc20",
        contractAddress: "0xedd7c94fd7b4971b916d15067bc454b9e1bad980",
        supply: "1000000000000000000000000000",
        changer: {
          activatedAt: "2018-04-30T11:21:35.045Z"
        },
        relayCurrencyId: "5ae5c6ec38e2335c37122c89"
      },
      status: "published",
      order: 88,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-04-29T12:48:28.549Z",
      isDeleted: false,
      primaryCommunityId: "5ae5bef260fabb0001be34ea",
      numDecimalDigits: 18,
      name: "Zippie",
      primaryCommunityImageName: "e856c200-4baf-11e8-963a-05fa26187558.png"
    },
    {
      _id: "5ae5c6ec38e2335c37122c89",
      symbol: "ZIPTBNT",
      lowerCaseSymbol: "ziptbnt",
      type: "ethereum",
      code: "ZIPTBNT",
      lowerCaseCode: "ziptbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xc4a01182ab1e502a1c1d17024e4924573ce001cc",
        supply: "65793469122918264492483",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x83e240d1cbc6ec7f394cd6ba5ed01b7fcdf44ed5",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-04-30T11:20:58.004Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-04-29T13:21:48.689Z",
      isDeleted: false,
      primaryCommunityId: "5ae5c6d760fabb0001be34ec",
      numDecimalDigits: 18,
      name: "Zippie Relay",
      primaryCommunityImageName: "78ea04d0-4bb0-11e8-ad13-7fdc32c9e38a.png",
      order: 87
    },
    {
      _id: "5af2de49d8d7b13369d5a2cb",
      symbol: "RBLXBNT",
      lowerCaseSymbol: "rblxbnt",
      type: "ethereum",
      code: "RBLXBNT",
      lowerCaseCode: "rblxbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x78acf38ec85a9e4b2b88961b9d4bffba04fdba59",
        supply: "40000000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x32131848edc60e032abf0369241d34ec969ebf90",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-11T15:10:16.818Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-09T11:40:57.888Z",
      isDeleted: false,
      primaryCommunityId: "5af2de43ed1c3a0001091de7",
      numDecimalDigits: 18,
      name: "Rublix Relay",
      primaryCommunityImageName: "f6ceb740-537d-11e8-a380-5df7437b363c.png",
      order: 86
    },
    {
      _id: "5af2e3e4b2007855dcaff39a",
      symbol: "RBLX",
      lowerCaseSymbol: "rblx",
      type: "ethereum",
      code: "RBLX",
      lowerCaseCode: "rblx",
      details: {
        type: "erc20",
        contractAddress: "0xfc2c4d8f95002c14ed0a7aa65102cac9e5953b5e",
        supply: "100000000000000000000000000",
        changer: {
          activatedAt: "2018-05-11T15:08:29.724Z"
        },
        relayCurrencyId: "5af2de49d8d7b13369d5a2cb"
      },
      status: "published",
      order: 85,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-09T12:04:52.395Z",
      isDeleted: false,
      primaryCommunityId: "5af2e3d8ed1c3a0001091de8",
      numDecimalDigits: 18,
      name: "Rublix",
      primaryCommunityImageName: "455c17b0-5381-11e8-a473-e17b8e82a26f.png"
    },
    {
      _id: "5af1a4e45349c04bba2c9837",
      symbol: "DATABNT",
      lowerCaseSymbol: "databnt",
      type: "ethereum",
      code: "DATABNT",
      lowerCaseCode: "databnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xdd8a17169aa94e548602096eb9c9d44216ce8a37",
        supply: "40776000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x8658863984d116d4b3a0a5af45979eceac8a62f1",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-11T15:25:04.970Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-08T13:23:48.795Z",
      isDeleted: false,
      primaryCommunityId: "5af1a4dded1c3a0001091d75",
      numDecimalDigits: 18,
      name: "Streamr Relay",
      primaryCommunityImageName: "3f59f300-52c3-11e8-a380-5df7437b363c.png",
      order: 84
    },
    {
      _id: "5af19e5820e434fb44cdeaed",
      symbol: "DATA",
      lowerCaseSymbol: "data",
      type: "ethereum",
      code: "DATA",
      lowerCaseCode: "data",
      details: {
        type: "erc20",
        contractAddress: "0x0cf0ee63788a0849fe5297f3407f701e122cc023",
        supply: "987154514000000000000000000",
        changer: {
          activatedAt: "2018-05-11T15:25:44.042Z"
        },
        relayCurrencyId: "5af1a4e45349c04bba2c9837"
      },
      status: "published",
      order: 83,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-08T12:55:52.272Z",
      isDeleted: false,
      primaryCommunityId: "5af19e154d4c240001bdc44f",
      numDecimalDigits: 18,
      name: "Streamr",
      primaryCommunityImageName: "36493a40-52bf-11e8-a473-e17b8e82a26f.png"
    },
    {
      _id: "5aafdef1aa258beb09fd43a4",
      symbol: "MFG",
      type: "ethereum",
      code: "MFG",
      details: {
        type: "erc20",
        contractAddress: "0x6710c63432a2de02954fc0f851db07146a6c0312",
        supply: "1000000000000000000000000000",
        changer: {
          activatedAt: "2018-04-17T07:42:34.042Z"
        },
        relayCurrencyId: "5aafe1e9a74ac99dbf620980"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-19T16:01:53.030Z",
      isDeleted: false,
      primaryCommunityId: "5aafdee1dc99f10001a75e56",
      numDecimalDigits: 18,
      name: "SyncFab",
      primaryCommunityImageName: "488280b0-2b8f-11e8-891a-85ca6815b23e.png",
      lowerCaseSymbol: "mfg",
      lowerCaseCode: "mfg",
      order: 82
    },
    {
      _id: "5aafe1e9a74ac99dbf620980",
      symbol: "MFGBNT",
      type: "ethereum",
      code: "MFGBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xb3b2861a093b7fb19352bd62cd8efc314e0641a7",
        supply: "63696996629749892917000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x0fec04a7526f601a1019edcd5d5b003101c46a0c",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-04-17T07:42:03.723Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-19T16:14:33.287Z",
      isDeleted: false,
      primaryCommunityId: "5aafe1dfaacf0c0001090a3f",
      numDecimalDigits: 18,
      name: "SyncFab Relay",
      primaryCommunityImageName: "b0a1d140-2b90-11e8-baf6-5fcc218084fc.png",
      lowerCaseSymbol: "mfgbnt",
      lowerCaseCode: "mfgbnt",
      order: 81
    },
    {
      _id: "5af03f52ea772b2ac0d06983",
      symbol: "JOY",
      lowerCaseSymbol: "joy",
      type: "ethereum",
      code: "JOY",
      lowerCaseCode: "joy",
      details: {
        type: "erc20",
        contractAddress: "0xfb725bab323927cfb20fb82ba9a1975f7d24705b",
        supply: "69999857378292991044530348",
        changer: {
          activatedAt: "2018-05-13T20:39:18.638Z"
        },
        relayCurrencyId: "5af03ecdbb95be44c0814a8a"
      },
      status: "published",
      order: 80,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-07T11:58:10.487Z",
      isDeleted: false,
      primaryCommunityId: "5af03f490079720001196fd0",
      numDecimalDigits: 18,
      name: "Joy Token",
      primaryCommunityImageName: "fa64f720-51ed-11e8-a380-5df7437b363c.png"
    },
    {
      _id: "5af03ecdbb95be44c0814a8a",
      symbol: "JOYBNT",
      lowerCaseSymbol: "joybnt",
      type: "ethereum",
      code: "JOYBNT",
      lowerCaseCode: "joybnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xef449de92ee1d812607d5b42c71c02a9e508ca10",
        supply: "39557385045115499687000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x14609cca8a69c734f7ba6dca3f723c4fbbeb6b43",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-13T20:38:46.803Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-07T11:55:57.771Z",
      isDeleted: false,
      primaryCommunityId: "5af03ec550a0000001abba45",
      numDecimalDigits: 18,
      name: "Joy Token Relay",
      primaryCommunityImageName: "b009a040-51ed-11e8-a473-e17b8e82a26f.png",
      order: 79
    },
    {
      _id: "5a9bf3e37d22843897b06e3b",
      symbol: "X8XBNT",
      type: "ethereum",
      code: "X8XBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xae0cecc84bc1ddefe13c6e5b2e9d311927e45ed8",
        supply: "43937382408421298970197",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x8c73126b85f59d85aa61391579b4c2710dd70f96",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-03-07T20:46:25.561Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-04T13:25:55.969Z",
      isDeleted: false,
      primaryCommunityId: "5a9bf3d7cd79b00001229b66",
      numDecimalDigits: 18,
      name: "x8currency Relay",
      primaryCommunityImageName: "4dc49f30-2064-11e8-baf6-5fcc218084fc.png",
      lowerCaseSymbol: "x8xbnt",
      lowerCaseCode: "x8xbnt",
      order: 78
    },
    {
      _id: "5a9bea027e33d66aea309c5d",
      symbol: "X8X",
      type: "ethereum",
      code: "X8X",
      details: {
        type: "erc20",
        contractAddress: "0x910dfc18d6ea3d6a7124a6f8b5458f281060fa4c",
        supply: "68,042,628,000,000,000,000,000,000.00",
        changer: {
          activatedAt: "2018-03-07T20:45:32.388Z"
        },
        relayCurrencyId: "5a9bf3e37d22843897b06e3b"
      },
      status: "published",
      stage: "traded",
      order: 77,
      isDiscoverable: true,
      createdAt: "2018-03-04T12:43:46.931Z",
      isDeleted: false,
      primaryCommunityId: "5a9be9f6feb1c3000111b8b9",
      numDecimalDigits: 18,
      name: "x8currency",
      primaryCommunityImageName: "dda69360-2064-11e8-85f0-f592f4a72353.png",
      lowerCaseSymbol: "x8x",
      lowerCaseCode: "x8x"
    },
    {
      _id: "5af97979df67d337959616f4",
      symbol: "DAN",
      lowerCaseSymbol: "dan",
      type: "ethereum",
      code: "DAN",
      lowerCaseCode: "dan",
      details: {
        type: "erc20",
        contractAddress: "0x9b70740e708a083c6ff38df52297020f5dfaa5ee",
        supply: "1000000000000000000",
        changer: {
          activatedAt: "2018-05-15T07:50:12.901Z"
        },
        relayCurrencyId: "5af97b423ed0a72095a55685"
      },
      status: "published",
      order: 76,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-14T11:56:41.261Z",
      isDeleted: false,
      primaryCommunityId: "5af978f6c1ec900001204276",
      numDecimalDigits: 10,
      name: "Daneel",
      primaryCommunityImageName: "9586f930-576e-11e8-b48c-35d88ea2b959.png"
    },
    {
      _id: "5af97b423ed0a72095a55685",
      symbol: "DANBNT",
      lowerCaseSymbol: "danbnt",
      type: "ethereum",
      code: "DANBNT",
      lowerCaseCode: "danbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xa06cfab8b584c91df1abee6e8503486ab4e23f40",
        supply: "50593762501367796886000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x20d23c7a4b2ea38f9dc885bd25b1bc8c2601d44d",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-15T07:54:48.126Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-14T12:04:18.034Z",
      isDeleted: false,
      primaryCommunityId: "5af97b2ec1ec900001204278",
      numDecimalDigits: 18,
      name: "Daneel Relay",
      primaryCommunityImageName: "39c68ce0-576f-11e8-a205-7bf13fb32a99.png",
      order: 75
    },
    {
      _id: "5ad9c1d54c4998a2f940e933",
      symbol: "AUC",
      lowerCaseSymbol: "auc",
      type: "ethereum",
      code: "AUC",
      lowerCaseCode: "auc",
      details: {
        type: "erc20",
        contractAddress: "0xc12d099be31567add4e4e4d0d45691c3f58f5663",
        supply: "65829657557007329968290000",
        changer: {
          activatedAt: "2018-04-21T12:00:23.045Z"
        },
        relayCurrencyId: "5ad9c3794c4998ba4340ed66"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-04-20T10:32:53.403Z",
      isDeleted: false,
      primaryCommunityId: "5ad9c1c5c7d1460001bc9bfa",
      numDecimalDigits: 18,
      name: "Auctus",
      primaryCommunityImageName: "ff0d5f00-4604-11e8-963a-05fa26187558.png",
      order: 72
    },
    {
      _id: "5ad9c3794c4998ba4340ed66",
      symbol: "AUCBNT",
      lowerCaseSymbol: "aucbnt",
      type: "ethereum",
      code: "AUCBNT",
      lowerCaseCode: "aucbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x164a1229f4826c9dd70ee3d9f4f3d7b68a172153",
        supply: "108912489530614453884081",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x3b0116363e435d9e4ef24eca6282a21b7cc662df",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-04-21T11:58:45.449Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-04-20T10:39:53.447Z",
      isDeleted: false,
      primaryCommunityId: "5ad9c36fc7d1460001bc9bfb",
      numDecimalDigits: 18,
      name: "Auctus Relay",
      primaryCommunityImageName: "217a8ae0-4605-11e8-a17a-b13f6dff47e0.png",
      order: 71
    },
    {
      _id: "5aead4e7f71e1d1482b4cb32",
      symbol: "SCLBNT",
      lowerCaseSymbol: "sclbnt",
      type: "ethereum",
      code: "SCLBNT",
      lowerCaseCode: "sclbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xfceb45cf070b277fede520c5539ae204bc1d493e",
        supply: "41000000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xd361339550cd8b3e9446bbb12aea337785a7aea4",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-04T08:51:04.058Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-03T09:22:47.379Z",
      isDeleted: false,
      primaryCommunityId: "5aead4d288fed400011d9093",
      numDecimalDigits: 18,
      name: "Sociall Relay",
      order: 70
    },
    {
      _id: "5a69a9d91b67798dab40b9ec",
      symbol: "SCL",
      type: "ethereum",
      name: "Sociall",
      code: "SCL",
      status: "published",
      stage: "traded",
      details: {
        type: "erc20",
        contractAddress: "0xd7631787b4dcc87b1254cfd1e5ce48e96823dee8",
        supply: "1671401966436979",
        changer: {
          activatedAt: "2018-05-04T08:43:23.637Z"
        },
        relayCurrencyId: "5aead4e7f71e1d1482b4cb32"
      },
      numDecimalDigits: 8,
      primaryCommunityImageName: "bbfa82e0-4eee-11e8-a380-5df7437b363c.png",
      isDeleted: false,
      isDiscoverable: true,
      order: 69,
      createdAt: "2018-01-25T09:56:41.244Z",
      lowerCaseSymbol: "scl",
      lowerCaseCode: "scl",
      primaryCommunityId: "5aead51570a04eaf69e59a88"
    },
    {
      _id: "5a6ef0a500c51c0001e125e5",
      symbol: "SWMBNT",
      type: "ethereum",
      code: "SWMBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xf251523c1614ec3f449a93b7be547882ebc682ca",
        supply: "27808000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xbb9859dca5b269e787e9dd6042db46b07515fc4b",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-29T21:49:05.024Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-29T10:00:05.008Z",
      isDeleted: false,
      primaryCommunityId: "5a6ef090f4f65d0001c4946b",
      numDecimalDigits: 18,
      name: "Swarm Fund Relay",
      primaryCommunityImageName: "48f4af90-04e4-11e8-bc6b-87a36d827eff.png",
      lowerCaseSymbol: "swmbnt",
      lowerCaseCode: "swmbnt",
      order: 68
    },
    {
      _id: "5a6ef00cc9a24e00019f675e",
      symbol: "SWM",
      type: "ethereum",
      code: "SWM",
      details: {
        type: "erc20",
        contractAddress: "0x9e88613418cf03dca54d6a2cf6ad934a78c7a17a",
        supply: "100000000000015150000000000",
        changer: {
          activatedAt: "2018-01-29T21:48:55.804Z"
        },
        relayCurrencyId: "5a6ef0a500c51c0001e125e5"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-29T09:57:32.283Z",
      isDeleted: false,
      primaryCommunityId: "5a6eefd7f4f65d0001c4946a",
      numDecimalDigits: 18,
      name: "Swarm Fund",
      primaryCommunityImageName: "8e0d2740-0851-11e8-8744-97748b632eaf.png",
      order: 67,
      lowerCaseSymbol: "swm",
      lowerCaseCode: "swm"
    },
    {
      _id: "5a1eaa33634e00000187855d",
      symbol: "WINGSBNT",
      type: "ethereum",
      code: "WINGSBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xa6ab3c8ae51962f4582db841de6b0a092041461e",
        supply: "46445387080415483185490",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x0cfbed1bd80bd8a740f24ec5fca8e8d1a9f87052",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-09T03:55:41.820Z"
        },
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-29T12:38:11.709Z",
      primaryCommunityId: "5a1eaa2131b0890001c2b909",
      numDecimalDigits: 18,
      primaryCommunityImageName: "6213a960-f51a-11e7-bc6b-87a36d827eff.png",
      name: "Wings Relay",
      isDeleted: false,
      isDiscoverable: true,
      lowerCaseSymbol: "wingsbnt",
      lowerCaseCode: "wingsbnt",
      order: 66
    },
    {
      _id: "5a1ea4d8634e00000187855c",
      symbol: "WINGS",
      type: "ethereum",
      code: "WINGS",
      details: {
        type: "erc20",
        contractAddress: "0x667088b212ce3d06a1b553a7221e1fd19000d9af",
        supply: "100000000000000000000000000",
        changer: {
          activatedAt: "2018-01-09T03:56:06.164Z"
        },
        relayCurrencyId: "5a1eaa33634e00000187855d"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-29T12:15:20.249Z",
      primaryCommunityId: "5a1ea498171b0100018277b0",
      numDecimalDigits: 18,
      primaryCommunityImageName: "5038e430-f51a-11e7-aabd-a344aed92db1.png",
      name: "Wings",
      isDeleted: false,
      order: 65,
      isDiscoverable: true,
      lowerCaseSymbol: "wings",
      lowerCaseCode: "wings"
    },
    {
      _id: "5a312b5b4c1019000197111e",
      symbol: "MNTPBNT",
      type: "ethereum",
      code: "MNTPBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x8da321ab610cd24fb2bcce191f423dae7c327ca9",
        supply: "36402697982751582400392",
        changer: {
          type: "bancor",
          version: "0.6",
          contractAddress: "0x25d4aef414ea092fbcbd83fd30e89e15cf820d0a",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2017-12-31T09:04:14.481Z"
        },
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-13T13:30:03.821Z",
      isDeleted: false,
      primaryCommunityId: "5a312b1f4f1311000100ba67",
      numDecimalDigits: 18,
      name: "Goldmint Relay",
      primaryCommunityImageName: "0ea8a680-ef08-11e7-9454-0922d1574472.png",
      isDiscoverable: true,
      lowerCaseSymbol: "mntpbnt",
      lowerCaseCode: "mntpbnt",
      order: 64
    },
    {
      _id: "5a03590f08849f0001097d29",
      symbol: "MNTP",
      type: "ethereum",
      code: "MNTP",
      details: {
        type: "erc20",
        contractAddress: "0x83cee9e086a77e492ee0bb93c2b0437ad6fdeccc",
        supply: "9686614650000235999951500",
        changer: {
          activatedAt: "2018-02-27T09:04:30.899Z"
        },
        relayCurrencyId: "5a312b5b4c1019000197111e"
      },
      status: "published",
      stage: "traded",
      isDeleted: false,
      createdAt: "2017-11-08T19:20:47.828Z",
      primaryCommunityId: "5a0358c52d5f720001d84ef5",
      numDecimalDigits: 18,
      primaryCommunityImageName: "5f706490-ea3f-11e7-9b5e-179c6e04aa7c.png",
      name: "Goldmint",
      order: 63,
      isDiscoverable: true,
      lowerCaseSymbol: "mntp",
      lowerCaseCode: "mntp"
    },
    {
      _id: "5a9d5db17e33d6685e32d2ae",
      symbol: "FTX",
      type: "ethereum",
      code: "FTX",
      details: {
        type: "erc20",
        contractAddress: "0xd559f20296ff4895da39b5bd9add54b442596a61",
        supply: "100000000000000000000000000",
        changer: {
          activatedAt: "2018-04-24T09:59:28.520Z"
        },
        relayCurrencyId: "5a9d612bb71998eba86d3dd0"
      },
      status: "published",
      stage: "traded",
      order: 62,
      isDiscoverable: true,
      createdAt: "2018-03-05T15:09:37.185Z",
      isDeleted: false,
      primaryCommunityId: "5a9d5d9bc93db5000141ea3e",
      numDecimalDigits: 18,
      name: "FintruX",
      primaryCommunityImageName: "cbea38c0-5dc7-11e8-b48c-35d88ea2b959.jpeg",
      lowerCaseSymbol: "ftx",
      lowerCaseCode: "ftx"
    },
    {
      _id: "5a9d612bb71998eba86d3dd0",
      symbol: "FTXBNT",
      type: "ethereum",
      code: "FTXBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x4d849dad08a4061be102dbca2ce2718a9a0b635a",
        supply: "29811721065186238380876",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x810c99c5de0a673e4bc86090f9bfe96a6d1b49a7",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-04-24T09:58:54.378Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-03-05T15:24:27.575Z",
      isDeleted: false,
      primaryCommunityId: "5a9d6123cd79b00001229bbd",
      numDecimalDigits: 18,
      name: "FintruX Relay",
      primaryCommunityImageName: "a01c55a0-2089-11e8-baf6-5fcc218084fc.png",
      lowerCaseSymbol: "ftxbnt",
      lowerCaseCode: "ftxbnt",
      order: 61
    },
    {
      _id: "5a675aba1bb6a60001aad797",
      symbol: "WANDBNT",
      type: "ethereum",
      code: "WANDBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x6a46f6dc570a1304a23f771c26b1802dffcdab0d",
        supply: "41528000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x4f88dfc8e1d7ba696db158656457797cfbdfb844",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-07T12:22:07.226Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-23T15:54:34.165Z",
      isDeleted: false,
      primaryCommunityId: "5a675a93d6ea1100015ec5a4",
      numDecimalDigits: 18,
      name: "WandX Relay",
      primaryCommunityImageName: "fab998d0-130d-11e8-bf39-bd2b2e4b10cf.png",
      lowerCaseSymbol: "wandbnt",
      lowerCaseCode: "wandbnt",
      order: 60
    },
    {
      _id: "59f6f966a149b500018d7da4",
      symbol: "WAND",
      type: "ethereum",
      code: "WAND",
      details: {
        type: "erc20",
        contractAddress: "0x27f610bf36eca0939093343ac28b1534a721dbb4",
        supply: "75,400,000",
        changer: {
          activatedAt: "2018-02-07T12:20:51.322Z"
        },
        relayCurrencyId: "5a675aba1bb6a60001aad797"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-10-30T10:05:26.534Z",
      primaryCommunityId: "59f6f93cdc10a80001295673",
      numDecimalDigits: 18,
      primaryCommunityImageName: "bf9d1dd0-bd5e-11e7-9386-c3d5072e15a2.png",
      name: "WandX",
      order: 59,
      isDiscoverable: true,
      isDeleted: false,
      lowerCaseSymbol: "wand",
      lowerCaseCode: "wand"
    },
    {
      _id: "5a7c305a16bc390001ec02be",
      symbol: "AIDBNT",
      type: "ethereum",
      code: "AIDBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xe3bf775ec5f4f4dfcbb21194b22be1217b815b1d",
        supply: "36182000000000000000000",
        changer: {
          type: "bancor",
          version: "0.6",
          contractAddress: "0xb85e52268cbf57b97ae15136aa65d4f567b8107c",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-16T11:44:03.676Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-08T11:11:22.148Z",
      isDeleted: false,
      primaryCommunityId: "5a7c305004de660001aa1507",
      numDecimalDigits: 18,
      name: "AidCoin Relay",
      primaryCommunityImageName: "d87f84d0-0cc0-11e8-9397-4570d27ed895.png",
      lowerCaseSymbol: "aidbnt",
      lowerCaseCode: "aidbnt",
      order: 58
    },
    {
      _id: "5a7c2d3716bc390001ebfd35",
      symbol: "AID",
      type: "ethereum",
      code: "AID",
      details: {
        type: "erc20",
        contractAddress: "0x37e8789bb9996cac9156cd5f5fd32599e6b91289",
        supply: "100000000000000000000000000",
        changer: {
          activatedAt: "2018-02-16T11:46:09.426Z"
        },
        relayCurrencyId: "5a7c305a16bc390001ec02be"
      },
      status: "published",
      order: 57,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-02-08T10:57:59.237Z",
      isDeleted: false,
      primaryCommunityId: "5a7c2d2a04de660001aa1506",
      numDecimalDigits: 18,
      name: "AidCoin",
      primaryCommunityImageName: "f8485690-0cbe-11e8-9d6e-fb9202c9fa3b.png",
      lowerCaseSymbol: "aid",
      lowerCaseCode: "aid"
    },
    {
      _id: "5ad9c58b4c49985f6440f114",
      symbol: "CHXBNT",
      lowerCaseSymbol: "chxbnt",
      type: "ethereum",
      code: "CHXBNT",
      lowerCaseCode: "chxbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x5a9790c2d029e4406f3d820d51774e4e3efac8cd",
        supply: "43898000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x69e37aba9b520a204bb0baebd76b0ac1a2390b37",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-04-25T14:19:43.001Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-04-20T10:48:43.318Z",
      isDeleted: false,
      primaryCommunityId: "5ad9c584fcd2330001c8c6c3",
      numDecimalDigits: 18,
      name: "Chainium Relay",
      primaryCommunityImageName: "174f1680-4605-11e8-963a-05fa26187558.png",
      order: 56
    },
    {
      _id: "5ad9c49e9ba6c6076f8960ef",
      symbol: "CHX",
      lowerCaseSymbol: "chx",
      type: "ethereum",
      code: "CHX",
      lowerCaseCode: "chx",
      details: {
        type: "erc20",
        contractAddress: "0x1460a58096d80a50a2f1f956dda497611fa4f165",
        supply: "168956522093084393899693958",
        changer: {
          activatedAt: "2018-04-25T14:20:16.386Z"
        },
        relayCurrencyId: "5ad9c58b4c49985f6440f114"
      },
      status: "published",
      order: 55,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-04-20T10:44:46.876Z",
      isDeleted: false,
      primaryCommunityId: "5ad9c4802208fa000137e4a5",
      numDecimalDigits: 18,
      name: "Chainium",
      primaryCommunityImageName: "0ab7d240-4605-11e8-963a-05fa26187558.png"
    },
    {
      _id: "5a1d75171b11f300016dc7a3",
      symbol: "INDBNT",
      type: "ethereum",
      code: "INDBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x32423158e8fbd2839e085626f8a98d86b2766de8",
        supply: "37004158509271895202532",
        changer: {
          type: "bancor",
          version: "0.5",
          contractAddress: "0xb018af916ed0116404537d1238b18988d652733a",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2017-12-06T02:00:00.000Z"
        },
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-28T14:39:19.388Z",
      primaryCommunityId: "5a1d74f1e17ffd0001b8ef33",
      numDecimalDigits: 18,
      primaryCommunityImageName: "96671550-e8a7-11e7-9b5e-179c6e04aa7c.png",
      name: "Indorse Relay",
      isDeleted: false,
      isDiscoverable: true,
      lowerCaseSymbol: "indbnt",
      lowerCaseCode: "indbnt",
      order: 54
    },
    {
      _id: "5a1af60e9f604e00011f09eb",
      symbol: "IND",
      type: "ethereum",
      code: "IND",
      details: {
        type: "erc20",
        contractAddress: "0xf8e386eda857484f5a12e4b5daa9984e06e73705",
        supply: "170622047000000000000000000",
        changer: {
          activatedAt: "2017-12-02T02:00:00.000Z"
        },
        relayCurrencyId: "5a1d75171b11f300016dc7a3"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-26T17:12:46.929Z",
      primaryCommunityId: "5a1af5b131b0890001c2b85d",
      numDecimalDigits: 18,
      primaryCommunityImageName: "5e67d760-db5b-11e7-91c4-63061ece2a28.png",
      name: "Indorse",
      isDeleted: false,
      order: 53,
      isDiscoverable: true,
      lowerCaseSymbol: "ind",
      lowerCaseCode: "ind"
    },
    {
      _id: "5ae9ab97f71e1d9abcb2d4fd",
      symbol: "GESBNT",
      lowerCaseSymbol: "gesbnt",
      type: "ethereum",
      code: "GESBNT",
      lowerCaseCode: "gesbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x5972ced550248b17c9f674639d33e5446b6ad95a",
        supply: "59384000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x32d4fb837f41955b81556f74dadb2c5b8a0d0989",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-07T11:34:07.692Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-02T12:14:15.324Z",
      isDeleted: false,
      primaryCommunityId: "5ae9ab5288fed400011d9053",
      numDecimalDigits: 18,
      name: "Galaxy eSolutions Relay",
      primaryCommunityImageName: "b20f5310-4e02-11e8-a04a-a1dcf04454c8.png",
      order: 52
    },
    {
      _id: "5ae99f4cf930d40f76734426",
      symbol: "GES",
      lowerCaseSymbol: "ges",
      type: "ethereum",
      code: "GES",
      lowerCaseCode: "ges",
      details: {
        type: "erc20",
        contractAddress: "0xfb1e5f5e984c28ad7e228cdaa1f8a0919bb6a09b",
        supply: "299999999999505027471548000",
        changer: {
          activatedAt: "2018-05-07T11:29:22.732Z"
        },
        relayCurrencyId: "5ae9ab97f71e1d9abcb2d4fd"
      },
      status: "published",
      order: 51,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-02T11:21:48.149Z",
      isDeleted: false,
      primaryCommunityId: "5ae99f3950a0000001abb8dc",
      numDecimalDigits: 18,
      name: "Galaxy eSolutions",
      primaryCommunityImageName: "d22a9fb0-4e02-11e8-a04a-a1dcf04454c8.png"
    },
    {
      _id: "5a6f62794a071500016d4015",
      symbol: "CANBNT",
      type: "ethereum",
      code: "CANBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x854809b0c072d9c9c09e268cd7836d1b58101b62",
        supply: "46908000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x5142127a6703f5fc80bf11b7b57ff68998f218e4",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-05T18:55:50.204Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-29T18:05:45.134Z",
      isDeleted: false,
      primaryCommunityId: "5a6f626f0c836d0001e0c689",
      numDecimalDigits: 18,
      name: "CanYa Relay",
      primaryCommunityImageName: "0de81a00-051f-11e8-bc6b-87a36d827eff.png",
      lowerCaseSymbol: "canbnt",
      lowerCaseCode: "canbnt",
      order: 50
    },
    {
      _id: "5a6f61ece3de16000123763a",
      symbol: "CAN",
      type: "ethereum",
      code: "CAN",
      details: {
        type: "erc20",
        contractAddress: "0x1d462414fe14cf489c7a21cac78509f4bf8cd7c0",
        supply: "100000000000000",
        changer: {
          activatedAt: "2018-02-05T18:55:03.814Z"
        },
        relayCurrencyId: "5a6f62794a071500016d4015"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-29T18:03:24.483Z",
      isDeleted: false,
      primaryCommunityId: "5a6f61d50c836d0001e0c688",
      numDecimalDigits: 6,
      name: "CanYa",
      order: 49,
      primaryCommunityImageName: "c2e649f0-051e-11e8-9454-0922d1574472.png",
      lowerCaseSymbol: "can",
      lowerCaseCode: "can"
    },
    {
      _id: "5a1d829b1b11f300016dc7a5",
      symbol: "DRTBNT",
      type: "ethereum",
      code: "DRTBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x904c7051d12ace7d0107ada8702c0c759cad1672",
        supply: "35176000000000000000000",
        changer: {
          type: "bancor",
          version: "0.6",
          contractAddress: "0x9b10206f236669f4f40e8e9806de9ab1813d3f65",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-02T14:30:52.909Z"
        },
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-28T15:36:59.764Z",
      primaryCommunityId: "5a1d827ee17ffd0001b8ef3a",
      numDecimalDigits: 18,
      primaryCommunityImageName: "20cefa40-1310-11e8-a36b-c1b17c6baaea.png",
      name: "DomRaider Relay",
      isDiscoverable: true,
      isDeleted: false,
      lowerCaseSymbol: "drtbnt",
      lowerCaseCode: "drtbnt",
      order: 48
    },
    {
      _id: "5a19bc169f604e00011f09ea",
      symbol: "DRT",
      type: "ethereum",
      code: "DRT",
      details: {
        type: "erc20",
        contractAddress: "0x9af4f26941677c706cfecf6d3379ff01bb85d5ab",
        supply: "130000000000000000",
        changer: {
          activatedAt: "2018-02-02T14:29:31.595Z"
        },
        relayCurrencyId: "5a1d829b1b11f300016dc7a5"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-25T18:53:10.833Z",
      primaryCommunityId: "5a19bbbd171b0100018276f3",
      numDecimalDigits: 8,
      primaryCommunityImageName: "627afd80-0830-11e8-b83b-855c569b045b.jpeg",
      name: "DomRaider",
      isDeleted: false,
      isDiscoverable: true,
      order: 47,
      lowerCaseSymbol: "drt",
      lowerCaseCode: "drt"
    },
    {
      _id: "5a2ff4d4bbbef90001ae29e3",
      symbol: "TBXBNT",
      type: "ethereum",
      code: "TBXBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xe844e4ef529cb1a507d47206beef65a921b07287",
        supply: "34748000000000000000000",
        changer: {
          type: "bancor",
          version: "0.8",
          contractAddress: "0x2f3cdf19a7ed0352f96440dac92a6d2959719c07",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-16T17:34:49.225Z"
        },
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-12T15:25:08.520Z",
      isDeleted: false,
      primaryCommunityId: "5a2ff4ca93d1f500018b04c8",
      numDecimalDigits: 18,
      name: "Token box Relay",
      primaryCommunityImageName: "0bfe2810-f47b-11e7-9454-0922d1574472.png",
      isDiscoverable: true,
      lowerCaseSymbol: "tbxbnt",
      lowerCaseCode: "tbxbnt",
      order: 46
    },
    {
      _id: "5a2ff2b8bbbef90001ae29c1",
      symbol: "TBX",
      type: "ethereum",
      code: "TBX",
      details: {
        type: "erc20",
        contractAddress: "0x3a92bd396aef82af98ebc0aa9030d25a23b11c6b",
        supply: "16051589782693112363990381",
        changer: {
          activatedAt: "2018-01-16T17:34:37.563Z"
        },
        relayCurrencyId: "5a2ff4d4bbbef90001ae29e3"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-12T15:16:08.874Z",
      isDeleted: false,
      primaryCommunityId: "5a2ff27c4f1311000100b9e8",
      numDecimalDigits: 18,
      name: "Tokenbox",
      primaryCommunityImageName: "e0590500-f479-11e7-bc6b-87a36d827eff.png",
      order: 45,
      isDiscoverable: true,
      lowerCaseSymbol: "tbx",
      lowerCaseCode: "tbx"
    },
    {
      _id: "5ac5f1ceb9b20e2a231fc556",
      symbol: "AMN",
      lowerCaseSymbol: "amn",
      type: "ethereum",
      code: "AMN",
      lowerCaseCode: "amn",
      details: {
        type: "erc20",
        contractAddress: "0x737f98ac8ca59f2c68ad658e3c3d8c8963e40a4c",
        supply: "1666666667000000000000000000",
        changer: {
          activatedAt: "2018-05-02T14:06:49.875Z"
        },
        relayCurrencyId: "5ac5f6f3c03162f4d225c65f"
      },
      order: 44,
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-04-05T09:52:14.441Z",
      isDeleted: false,
      primaryCommunityId: "5ac5f1c5f17e5100019f406c",
      numDecimalDigits: 18,
      name: "Amon",
      primaryCommunityImageName: "0d917fd0-38b7-11e8-8208-adb8418cbb95.png"
    },
    {
      _id: "5ac5f6f3c03162f4d225c65f",
      symbol: "AMNBNT",
      lowerCaseSymbol: "amnbnt",
      type: "ethereum",
      code: "AMNBNT",
      lowerCaseCode: "amnbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x0f9be347378a37ced33a13ae061175af07cc9868",
        supply: "43396644964566315029220",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xaa8cec9cbd7d051ba86d9deff1ec0775bd4b13c5",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-02T14:05:59.457Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-04-05T10:14:11.571Z",
      isDeleted: false,
      primaryCommunityId: "5ac5f6e94d4a5c000117fb5f",
      numDecimalDigits: 18,
      name: "Amon Relay",
      primaryCommunityImageName: "255a0850-38ba-11e8-a132-e5d1db607067.png",
      order: 43
    },
    {
      _id: "5b065bc3f8d1136fc42bcf2f",
      symbol: "XPATBNT",
      lowerCaseSymbol: "xpatbnt",
      type: "ethereum",
      code: "XPATBNT",
      lowerCaseCode: "xpatbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xee769ce6b4e2c2a079c5f67081225af7c89f874c",
        supply: "47581023635612953096317",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x7172c5b24bdce3b93a78c53ef1ece011b0472c1b",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-06-04T16:14:03.595Z"
        },
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-24T06:29:23.610Z",
      isDeleted: false,
      primaryCommunityId: "5b065bbc794f5d00014c2f8f",
      numDecimalDigits: 18,
      name: "Bitnation Relay",
      primaryCommunityImageName: "df87e120-5f1b-11e8-9952-89831889dec2.png",
      order: 42
    },
    {
      _id: "5b056686f2e6af420feecbd0",
      symbol: "XPAT",
      lowerCaseSymbol: "xpat",
      type: "ethereum",
      code: "XPAT",
      lowerCaseCode: "xpat",
      details: {
        type: "erc20",
        contractAddress: "0xbb1fa4fdeb3459733bf67ebc6f893003fa976a82",
        supply: "42000000000000000000000000000",
        changer: {
          activatedAt: "2018-06-04T16:16:59.180Z"
        },
        relayCurrencyId: "5b065bc3f8d1136fc42bcf2f"
      },
      status: "published",
      order: 41,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-23T13:03:02.979Z",
      isDeleted: false,
      primaryCommunityId: "5b05667a794f5d00014c2f5b",
      numDecimalDigits: 18,
      name: "Bitnation",
      primaryCommunityImageName: "bbc6da80-5f1a-11e8-a205-7bf13fb32a99.png"
    },
    {
      _id: "5a8c0f22d8670d00016b90cb",
      symbol: "ONG",
      type: "ethereum",
      code: "ONG",
      details: {
        type: "erc20",
        contractAddress: "0xd341d1680eeee3255b8c4c75bcce7eb57f144dae",
        supply: "300000000000000000000000000",
        changer: {
          activatedAt: "2018-02-23T18:55:54.238Z"
        },
        relayCurrencyId: "5a8c1d32da03090001482040"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      order: 40,
      createdAt: "2018-02-26T12:05:54.924Z",
      isDeleted: false,
      primaryCommunityId: "5a8c0f14583f4a0001f75de8",
      numDecimalDigits: 18,
      name: "onG.social",
      primaryCommunityImageName: "6fed0710-1636-11e8-a36b-c1b17c6baaea.png",
      lowerCaseSymbol: "ong",
      lowerCaseCode: "ong"
    },
    {
      _id: "5a8c1d32da03090001482040",
      symbol: "ONGBNT",
      type: "ethereum",
      code: "ONGBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x8104e7ce81fab39c42e34cd9d8b654135261fae8",
        supply: "38901482541630736405433",
        changer: {
          type: "bancor",
          version: "0.7",
          contractAddress: "0xa0db892affca7ec5ba3cea5d03fc0bc53db34036",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-26T18:55:10.051Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "9768888545720002342995"
    },
    5a8c0f22d8670d00016b90cb: {
      contractAddress: "0xd341d1680eeee3255b8c4c75bcce7eb57f144dae",
      currencySymbol: "ONG",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "803268579135860880798364"
    }
}
},
    status: "published",
    stage: "traded",
    isDiscoverable: true,
    createdAt: "2018-02-20T13:05:54.037Z",
    isDeleted: false,
    primaryCommunityId: "5a8c1d290cefca0001207ed4",
    numDecimalDigits: 18,
    name: "onG.social Relay",
    primaryCommunityImageName: "d2624880-163e-11e8-bf39-bd2b2e4b10cf.png",
    lowerCaseSymbol: "ongbnt",
    lowerCaseCode: "ongbnt",
    order: 39
},
    {
      _id: "5a54b71407932a000117bf84",
      symbol: "EDGBNT",
      type: "ethereum",
      code: "EDGBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xf95dd0fc6df64b2f149afa9219579e0f850bcd4d",
        supply: "24230000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x445556b7215349b205997aaaf6c6dfa258eb029d",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-10T19:58:01.754Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "8201920851337857326408"
    },
    5a54b411b74c960001e261eb: {
      contractAddress: "0x08711d3b02c8758f2fb3ab4e80228418a7f8e39c",
      currencySymbol: "EDG",
      ratio: 500000,
      numDecimalDigits: 0,
      balance: "74754"
    }
}
},
    status: "published",
    stage: "traded",
    isDiscoverable: true,
    createdAt: "2018-01-09T12:35:32.279Z",
    isDeleted: false,
    primaryCommunityId: "5a54b70bd9aebc00011760bf",
    numDecimalDigits: 18,
    name: "Edgeless Relay",
    primaryCommunityImageName: "a2c1a470-f539-11e7-bc6b-87a36d827eff.png",
    lowerCaseSymbol: "edgbnt",
    lowerCaseCode: "edgbnt",
    order: 38
},
    {
      _id: "5a54b411b74c960001e261eb",
      symbol: "EDG",
      type: "ethereum",
      code: "EDG",
      details: {
        type: "erc20",
        contractAddress: "0x08711d3b02c8758f2fb3ab4e80228418a7f8e39c",
        supply: "132046997",
        changer: {
          activatedAt: "2018-01-10T19:57:43.649Z"
        },
        relayCurrencyId: "5a54b71407932a000117bf84"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-09T12:22:41.620Z",
      isDeleted: false,
      primaryCommunityId: "5a54b4027b6b0e0001fc69c9",
      numDecimalDigits: 0,
      name: "Edgeless",
      primaryCommunityImageName: "d580e490-f537-11e7-bc6b-87a36d827eff.png",
      order: 37,
      lowerCaseSymbol: "edg",
      lowerCaseCode: "edg"
    },
    {
      _id: "5a36c11a9416220001faa380",
      symbol: "AIXBNT",
      type: "ethereum",
      code: "AIXBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xa415cd56c694bd7402d14560d18bb19a28f77617",
        supply: "15250936350232749555146",
        changer: {
          type: "bancor",
          version: "0.6",
          contractAddress: "0xff8d1014da6382f4c07461fbd5f3bed733b229f1",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2017-12-19T18:07:27.189Z"
        },
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-17T19:10:18.121Z",
      isDeleted: false,
      primaryCommunityId: "5a36c10c80e8200001fa1f27",
      numDecimalDigits: 18,
      name: "Aigang Relay",
      primaryCommunityImageName: "b9031960-e8a7-11e7-9b5e-179c6e04aa7c.png",
      isDiscoverable: true,
      lowerCaseSymbol: "aixbnt",
      lowerCaseCode: "aixbnt",
      order: 36
    },
    {
      _id: "5a1327c9c92a1700011c7baf",
      symbol: "AIX",
      type: "ethereum",
      code: "AIX",
      details: {
        type: "erc20",
        contractAddress: "0x1063ce524265d5a3a624f4914acd573dd89ce988",
        supply: "29274566724462560143156861",
        changer: {
          activatedAt: "2017-12-19T18:07:19.825Z"
        },
        relayCurrencyId: "5a36c11a9416220001faa380"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-20T19:06:49.482Z",
      primaryCommunityId: "5a13272422d792000139709b",
      numDecimalDigits: 18,
      primaryCommunityImageName: "3e7e7220-e35c-11e7-91c4-63061ece2a28.png",
      name: "Aigang",
      isDeleted: false,
      order: 35,
      isDiscoverable: true,
      lowerCaseSymbol: "aix",
      lowerCaseCode: "aix"
    },
    {
      _id: "5a37ebb3a88c2a00013bbd66",
      symbol: "WAXBNT",
      type: "ethereum",
      code: "WAXBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x67563e7a0f13642068f6f999e48c690107a4571f",
        supply: "27902152219783370783306",
        changer: {
          type: "bancor",
          version: "0.6",
          contractAddress: "0x7bac8115f3789f4d7a3bfe241eb1bcb4d7f71665",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-03T00:21:36.391Z"
        },
        reserves: {
          '594bb7e468a95e00203b048d': {
            contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
            currencySymbol: "BNT",
            ratio: 500000,
            numDecimalDigits: 18,
            balance: "8202703452750197354619"
          },
          '5a37e92fed8a500001de70da': {
            contractAddress: "0x39bb259f66e1c59d5abef88375979b4d20d98022",
            currencySymbol: "WAX",
            ratio: 500000,
            numDecimalDigits: 8,
            balance: "15949041465652"
          }
        }
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-18T16:24:19.126Z",
      isDeleted: false,
      primaryCommunityId: "5a37eba893d1f500018b06d2",
      numDecimalDigits: 18,
      name: "Wax Relay",
      primaryCommunityImageName: "25ec2580-f3b6-11e7-bc6b-87a36d827eff.png",
      isDiscoverable: true,
      lowerCaseSymbol: "waxbnt",
      lowerCaseCode: "waxbnt",
      order: 34
    },
    {
      _id: "5a37e92fed8a500001de70da",
      symbol: "WAX",
      type: "ethereum",
      code: "WAX",
      details: {
        type: "erc20",
        contractAddress: "0x39bb259f66e1c59d5abef88375979b4d20d98022",
        supply: "185000000000000000",
        changer: {
          activatedAt: "2018-01-03T00:21:23.233Z"
        },
        relayCurrencyId: "5a37ebb3a88c2a00013bbd66"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-18T16:13:35.282Z",
      isDeleted: false,
      primaryCommunityId: "5a37e92493d1f500018b06ce",
      numDecimalDigits: 8,
      name: "Wax",
      primaryCommunityImageName: "7f4fc5e0-f06f-11e7-9454-0922d1574472.png",
      isDiscoverable: true,
      order: 33,
      lowerCaseSymbol: "wax",
      lowerCaseCode: "wax"
    },
    {
      _id: "5a8c35eab2b34200016974e2",
      symbol: "INSTAR",
      type: "ethereum",
      code: "INSTAR",
      details: {
        type: "erc20",
        contractAddress: "0xc72fe8e3dd5bef0f9f31f259399f301272ef2a2d",
        supply: "202955562642595000000000000",
        changer: {
          activatedAt: "2018-03-01T11:00:12.979Z"
        },
        relayCurrencyId: "5a8c3e50d8670d00016bf6d3"
      },
      status: "published",
      stage: "traded",
      order: 32,
      isDiscoverable: true,
      createdAt: "2018-02-20T14:51:22.150Z",
      isDeleted: false,
      primaryCommunityId: "5a8c35cea9a35000014c4b44",
      numDecimalDigits: 18,
      name: "Insights Network",
      primaryCommunityImageName: "950cff70-164d-11e8-bf39-bd2b2e4b10cf.png",
      lowerCaseSymbol: "instar",
      lowerCaseCode: "instar"
    },
    {
      _id: "5a8c3e50d8670d00016bf6d3",
      symbol: "INSTARBNT",
      type: "ethereum",
      code: "INSTARBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xc803b2b2c3ba24c0c934aeb3ba508a4dd6853f1b",
        supply: "80846748846111926904494",
        changer: {
          type: "bancor",
          version: "0.7",
          contractAddress: "0x7e4b0abad3407b87a381c1c05af78d7ad42975e7",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-03-01T11:00:40.022Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "5774921551776528478279"
    },
    5a8c35eab2b34200016974e2: {
      contractAddress: "0xc72fe8e3dd5bef0f9f31f259399f301272ef2a2d",
      currencySymbol: "INSTAR",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "899763888061847076955979"
    }
}
},
    status: "published",
    stage: "traded",
    isDiscoverable: true,
    createdAt: "2018-02-20T15:27:12.501Z",
    isDeleted: false,
    primaryCommunityId: "5a8c3e48a9a35000014c4b47",
    numDecimalDigits: 18,
    name: "Insights Network Relay",
    primaryCommunityImageName: "98dd9d30-1652-11e8-bf39-bd2b2e4b10cf.png",
    lowerCaseSymbol: "instarbnt",
    lowerCaseCode: "instarbnt",
    order: 31
},
    {
      _id: "5a33c33a9416220001fa721d",
      symbol: "WLKBNT",
      type: "ethereum",
      code: "WLKBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xd387cdaf85429b455f0f716d51be33db2fc00463",
        supply: "28714459286595063931445",
        changer: {
          type: "bancor",
          version: "0.6",
          contractAddress: "0xc11cce040583640001f5a7e945dfd82f662cc0ae",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-18T21:50:04.942Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "4840941099400481454697"
    },
    5a33bfed9416220001fa71ce: {
      contractAddress: "0xf6b55acbbc49f4524aa48d19281a9a77c54de10f",
      currencySymbol: "WLK",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "302942680576496057200341"
    }
}
},
    status: "published",
    stage: "traded",
    createdAt: "2017-12-15T12:42:34.709Z",
    isDeleted: false,
    primaryCommunityId: "5a33c3214f1311000100bb09",
    numDecimalDigits: 18,
    name: "Wolk Relay",
    primaryCommunityImageName: "bcb404a0-fcf9-11e7-90ab-6d53c6790097.png",
    isDiscoverable: true,
    lowerCaseSymbol: "wlkbnt",
    lowerCaseCode: "wlkbnt",
    order: 30
},
    {
      _id: "5a33bfed9416220001fa71ce",
      symbol: "WLK",
      type: "ethereum",
      code: "WLK",
      details: {
        type: "erc20",
        contractAddress: "0xf6b55acbbc49f4524aa48d19281a9a77c54de10f",
        supply: "61182033343940291134360520",
        changer: {
          activatedAt: "2018-01-18T21:49:55.486Z"
        },
        relayCurrencyId: "5a33c33a9416220001fa721d"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-15T12:28:29.057Z",
      isDeleted: false,
      primaryCommunityId: "5a33bf9d93d1f500018b05ab",
      numDecimalDigits: 18,
      name: "Wolk",
      primaryCommunityImageName: "ce0e4f30-fcf9-11e7-9454-0922d1574472.png",
      order: 29,
      isDiscoverable: true,
      lowerCaseSymbol: "wlk",
      lowerCaseCode: "wlk"
    },
    {
      _id: "5af039febb95be2a238146e5",
      symbol: "REPUXBNT",
      lowerCaseSymbol: "repuxbnt",
      type: "ethereum",
      code: "REPUXBNT",
      lowerCaseCode: "repuxbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x28291d74bca9de7cb6948a8e699651ed93832c50",
        supply: "38859159383694539968195",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xe27cf7324e6377bddc48db6bac642839ffa9bb36",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-10T12:37:01.896Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 500000,
      balance: "6845488937510266372928",
      numDecimalDigits: 18
    },
    5af03684a772b83c86040002: {
      contractAddress: "0x4d305c2334c02e44ac592bbea681ba4cc1576de3",
      currencySymbol: "REPUX",
      ratio: 500000,
      balance: "2686993034453635649802458",
      numDecimalDigits: 18
    }
}
},
    status: "published",
    stage: "traded",
    isDiscoverable: true,
    createdAt: "2018-05-07T11:35:26.978Z",
    isDeleted: false,
    primaryCommunityId: "5af038b588fed400011d9193",
    numDecimalDigits: 18,
    name: "Repux Relay",
    primaryCommunityImageName: "408299c0-51ed-11e8-a04a-a1dcf04454c8.png",
    order: 28
},
    {
      _id: "5af03684a772b83c86040002",
      symbol: "REPUX",
      lowerCaseSymbol: "repux",
      type: "ethereum",
      code: "REPUX",
      lowerCaseCode: "repux",
      details: {
        type: "erc20",
        contractAddress: "0x4d305c2334c02e44ac592bbea681ba4cc1576de3",
        supply: "500000000000000000000000000",
        changer: {
          activatedAt: "2018-05-10T12:33:10.169Z"
        },
        relayCurrencyId: "5af039febb95be2a238146e5"
      },
      status: "published",
      order: 27,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-07T11:20:36.270Z",
      isDeleted: false,
      primaryCommunityId: "5af0361088fed400011d9191",
      numDecimalDigits: 18,
      name: "Repux",
      primaryCommunityImageName: "bfc26210-51e8-11e8-a380-5df7437b363c.png"
    },
    {
      _id: "5afd383bb29ebb33081abbd7",
      symbol: "INV",
      lowerCaseSymbol: "inv",
      type: "ethereum",
      code: "INV",
      lowerCaseCode: "inv",
      details: {
        type: "erc20",
        contractAddress: "0xece83617db208ad255ad4f45daf81e25137535bb",
        supply: "6,000,000,000,000,000.00",
        changer: {
          activatedAt: "2018-05-20T17:14:40.414Z"
        },
        relayCurrencyId: "5afd39c4049a7d0503c06b04"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-17T08:07:23.693Z",
      isDeleted: false,
      primaryCommunityId: "5afd37f7794f5d00014c2d7b",
      numDecimalDigits: 8,
      name: "Invacio",
      primaryCommunityImageName: "638fbe70-59a9-11e8-9952-89831889dec2.png",
      order: 26
    },
    {
      _id: "5afd39c4049a7d0503c06b04",
      symbol: "INVBNT",
      lowerCaseSymbol: "invbnt",
      type: "ethereum",
      code: "INVBNT",
      lowerCaseCode: "invbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x9da52b3b37bdbe8b851d882dc55bd823b4b66bf4",
        supply: "42794999878195617016359",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xb19710f3bdb4df4c781b9dc3cd62979921878280",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-20T17:14:55.828Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 500000,
      balance: "5679528556405717354286",
      numDecimalDigits: 18
    },
    5afd383bb29ebb33081abbd7: {
      contractAddress: "0xece83617db208ad255ad4f45daf81e25137535bb",
      currencySymbol: "INV",
      ratio: 500000,
      balance: "46364527950724",
      numDecimalDigits: 8
    }
}
},
    status: "published",
    stage: "traded",
    isDiscoverable: true,
    createdAt: "2018-05-17T08:13:56.334Z",
    isDeleted: false,
    primaryCommunityId: "5afd39b4c1ec900001204334",
    numDecimalDigits: 18,
    name: "Invacio Relay",
    primaryCommunityImageName: "5e373970-59aa-11e8-a205-7bf13fb32a99.png",
    order: 25
},
    {
      _id: "5a37989ced8a500001de23e9",
      symbol: "CATBNT",
      type: "ethereum",
      code: "CATBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xb3c55930368d71f643c3775869afc73f6c5237b2",
        supply: "31175082725497144318695",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x73314db8f62312e6a1fb365c3a98599119a91c74",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-06T17:41:40.932Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "5619591162914830928622"
    },
    5a3794f26de5cb0001ce3993: {
      contractAddress: "0x1234567461d3f8db7496581774bd869c83d51c93",
      currencySymbol: "CAT",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "1573209077221231295668059"
    }
}
},
    status: "published",
    stage: "traded",
    createdAt: "2017-12-18T10:29:48.718Z",
    isDeleted: false,
    primaryCommunityId: "5a3798914f1311000100bc13",
    numDecimalDigits: 18,
    name: "Bitclave Relay",
    primaryCommunityImageName: "df5bd760-004d-11e8-9454-0922d1574472.png",
    isDiscoverable: true,
    lowerCaseSymbol: "catbnt",
    lowerCaseCode: "catbnt",
    order: 24
},
    {
      _id: "5a3794f26de5cb0001ce3993",
      symbol: "CAT",
      type: "ethereum",
      code: "CAT",
      details: {
        type: "erc20",
        contractAddress: "0x1234567461d3f8db7496581774bd869c83d51c93",
        supply: "1376842581000000000000000000",
        changer: {
          activatedAt: "2018-01-06T17:41:29.196Z"
        },
        relayCurrencyId: "5a37989ced8a500001de23e9"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-18T10:14:10.135Z",
      isDeleted: false,
      primaryCommunityId: "5a3794d980e8200001fa1f5f",
      numDecimalDigits: 18,
      name: "BitClave",
      primaryCommunityImageName: "a9b9b770-f46e-11e7-aabd-a344aed92db1.png",
      order: 23,
      isDiscoverable: true,
      lowerCaseSymbol: "cat",
      lowerCaseCode: "cat"
    },
    {
      _id: "5a956d2cd54774000161022a",
      symbol: "STACBNT",
      type: "ethereum",
      code: "STACBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x258d1210e9e242fdc0ecfa3b039a51a945cd0d0a",
        supply: "40616000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x73f73391e5f56ce371a61fc3e18200a73d44cf6f",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-03-01T10:25:19.414Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "5449221395909121143581"
    },
    5a2fffd7c768d200015f1929: {
      contractAddress: "0x9a005c9a89bd72a4bd27721e7a09a3c11d2b03c4",
      currencySymbol: "STAC",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "3206512951500133779133601"
    }
}
},
    status: "published",
    stage: "traded",
    isDiscoverable: true,
    createdAt: "2018-02-27T14:37:32.082Z",
    isDeleted: false,
    primaryCommunityId: "5a956d0af6d657000151da0c",
    numDecimalDigits: 18,
    name: "CoinStarter Relay",
    primaryCommunityImageName: "c74ddd00-1bcb-11e8-891a-85ca6815b23e.png",
    lowerCaseSymbol: "stacbnt",
    lowerCaseCode: "stacbnt",
    order: 22
},
    {
      _id: "5a2fffd7c768d200015f1929",
      symbol: "STAC",
      type: "ethereum",
      code: "STAC",
      details: {
        type: "erc20",
        contractAddress: "0x9a005c9a89bd72a4bd27721e7a09a3c11d2b03c4",
        supply: "342007188930508238876818050",
        changer: {
          activatedAt: "2018-03-01T10:22:40.413Z"
        },
        relayCurrencyId: "5a956d2cd54774000161022a"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-12-12T16:12:07.749Z",
      isDeleted: false,
      primaryCommunityId: "5a2fffa480e8200001fa1d45",
      numDecimalDigits: 18,
      name: "CoinStarter",
      primaryCommunityImageName: "2ef50240-1bcb-11e8-a36b-c1b17c6baaea.png",
      isDiscoverable: true,
      order: 21,
      lowerCaseSymbol: "stac",
      lowerCaseCode: "stac"
    },
    {
      _id: "5ae816abc6295138b0a311d8",
      symbol: "TNS",
      lowerCaseSymbol: "tns",
      type: "ethereum",
      code: "TNS",
      lowerCaseCode: "tns",
      details: {
        type: "erc20",
        contractAddress: "0xb0280743b44bf7db4b6be482b2ba7b75e5da096c",
        supply: "120000000000000000000000000",
        changer: {
          activatedAt: "2018-05-01T21:35:28.726Z"
        },
        relayCurrencyId: "5ae819a7237f3e76d27ffa5c"
      },
      status: "published",
      order: 20,
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-01T07:26:35.184Z",
      isDeleted: false,
      primaryCommunityId: "5ae8168a0727500001b17741",
      numDecimalDigits: 18,
      name: "Transcodium",
      primaryCommunityImageName: "21150a90-4d11-11e8-ad13-7fdc32c9e38a.png"
    },
    {
      _id: "5ae819a7237f3e76d27ffa5c",
      symbol: "TNSBNT",
      lowerCaseSymbol: "tnsbnt",
      type: "ethereum",
      code: "TNSBNT",
      lowerCaseCode: "tnsbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x5cf2f6387c4f551316e1e422acf1025a539825c3",
        supply: "45375005443695364832302",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xce1e2b5ffe4d441abafd136768f24867101dfa50",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-01T21:34:21.543Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 500000,
      balance: "5273128198798502857235",
      numDecimalDigits: 18
    },
    5ae816abc6295138b0a311d8: {
      contractAddress: "0xb0280743b44bf7db4b6be482b2ba7b75e5da096c",
      currencySymbol: "TNS",
      ratio: 500000,
      balance: "873865448119113505931457",
      numDecimalDigits: 18
    }
}
},
    status: "published",
    stage: "traded",
    isDiscoverable: true,
    createdAt: "2018-05-01T07:39:19.364Z",
    isDeleted: false,
    primaryCommunityId: "5ae8198b0727500001b17742",
    numDecimalDigits: 18,
    name: "Transcodium Relay",
    primaryCommunityImageName: "ec344a00-4d12-11e8-ad13-7fdc32c9e38a.png",
    order: 19
},
    {
      _id: "5a61ff38e99f560001bb40d4",
      symbol: "BCSBNT",
      type: "ethereum",
      code: "BCSBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xd3ad4c39a12b48164068fef8f86ef5836a9ef303",
        supply: "29046000000000000000000",
        changer: {
          type: "bancor",
          version: "0.6",
          contractAddress: "0xe86d3a9bada1b7adcc32abde0522861b1dc7973a",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-21T14:08:07.936Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "5467488160735479184554"
    },
    5a08874c8393360001a32d4e: {
      contractAddress: "0x98bde3a768401260e7025faf9947ef1b81295519",
      currencySymbol: "BCS",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "27079942544935853590660"
    }
}
},
    status: "published",
    stage: "traded",
    isDiscoverable: true,
    createdAt: "2018-01-19T14:22:48.378Z",
    isDeleted: false,
    primaryCommunityId: "5a61ff1fa91c04000144cbc9",
    numDecimalDigits: 18,
    name: "BC Shop Relay",
    primaryCommunityImageName: "1ec5b240-fec3-11e7-90ab-6d53c6790097.jpeg",
    lowerCaseSymbol: "bcsbnt",
    lowerCaseCode: "bcsbnt",
    order: 18
},
    {
      _id: "5a08874c8393360001a32d4e",
      symbol: "BCS",
      type: "ethereum",
      code: "BCS",
      details: {
        type: "erc20",
        contractAddress: "0x98bde3a768401260e7025faf9947ef1b81295519",
        supply: "10000000000000000000000000",
        changer: {
          activatedAt: "2018-01-21T14:07:59.530Z"
        },
        relayCurrencyId: "5a61ff38e99f560001bb40d4"
      },
      status: "published",
      stage: "traded",
      createdAt: "2017-11-12T17:39:24.478Z",
      primaryCommunityId: "5a0886b0502ba10001e39ee4",
      numDecimalDigits: 18,
      primaryCommunityImageName: "4d4f62b0-c7d1-11e7-a7f0-3f204353e561.png",
      name: "BC Shop",
      isDeleted: false,
      isDiscoverable: true,
      order: 17,
      lowerCaseSymbol: "bcs",
      lowerCaseCode: "bcs"
    },
    {
      _id: "5ae9bb7735b3071e4c371451",
      symbol: "FUNDZBNT",
      lowerCaseSymbol: "fundzbnt",
      type: "ethereum",
      code: "FUNDZBNT",
      lowerCaseCode: "fundzbnt",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0xc47657b54e945e1d8b8b550749732a057c0ddeb4",
        supply: "43328000000000000000000",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0x38ef8fd7cfd46d615ebf7788bc7225906b58406f",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-05-02T21:12:52.085Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 500000,
      balance: "3968176882402132692791",
      numDecimalDigits: 18
    },
    5ae9b57ef51f6406f972c3f3: {
      contractAddress: "0xbf5496122cf1bb778e0cbe5eab936f2be5fc0940",
      currencySymbol: "FUNDZ",
      ratio: 500000,
      balance: "826620375317671092097846",
      numDecimalDigits: 18
    }
}
},
    status: "published",
    stage: "traded",
    isDiscoverable: true,
    createdAt: "2018-05-02T13:21:59.617Z",
    isDeleted: false,
    primaryCommunityId: "5ae9bb6850a0000001abb8e7",
    numDecimalDigits: 18,
    name: "FundFantasy Relay",
    primaryCommunityImageName: "f8f51c20-4e0b-11e8-a380-5df7437b363c.png",
    order: 16
},
    {
      _id: "5ae9b57ef51f6406f972c3f3",
      symbol: "FUNDZ",
      lowerCaseSymbol: "fundz",
      type: "ethereum",
      code: "FUNDZ",
      lowerCaseCode: "fundz",
      details: {
        type: "erc20",
        contractAddress: "0xbf5496122cf1bb778e0cbe5eab936f2be5fc0940",
        supply: "79796587835326473761390689",
        changer: {
          activatedAt: "2018-05-02T21:13:21.807Z"
        },
        relayCurrencyId: "5ae9bb7735b3071e4c371451"
      },
      order: 15,
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-05-02T12:56:30.606Z",
      isDeleted: false,
      primaryCommunityId: "5ae9b5510079720001196e8a",
      numDecimalDigits: 18,
      name: "FundFantasy",
      primaryCommunityImageName: "4cc3b7c0-4e08-11e8-a473-e17b8e82a26f.png"
    },
    {
      _id: "5a54afbecc62d20001e58910",
      symbol: "TRSTBNT",
      type: "ethereum",
      code: "TRSTBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x064432e84f05094e3ed746a35ab9b7ab865fda5c",
        supply: "21709351482677285067659",
        changer: {
          type: "bancor",
          version: "0.9",
          contractAddress: "0xb952ccbc1893c4dd1701bde249e62fc3ed357967",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-01-13T16:22:07.766Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "3675335850692713920778"
    },
    5a54ad0144680b000198ec2f: {
      contractAddress: "0xcb94be6f13a1182e4a4b6140cb7bf2025d28e41b",
      currencySymbol: "TRST",
      ratio: 500000,
      numDecimalDigits: 6,
      balance: "242550103208"
    }
}
},
    status: "published",
    stage: "traded",
    isDiscoverable: true,
    createdAt: "2018-01-09T12:04:14.083Z",
    isDeleted: false,
    primaryCommunityId: "5a54afb4d9aebc00011760bc",
    numDecimalDigits: 18,
    name: "WeTrust Relay",
    primaryCommunityImageName: "401d66f0-f535-11e7-9454-0922d1574472.png",
    lowerCaseSymbol: "trstbnt",
    lowerCaseCode: "trstbnt",
    order: 14
},
    {
      _id: "5a54ad0144680b000198ec2f",
      symbol: "TRST",
      type: "ethereum",
      code: "TRST",
      details: {
        type: "erc20",
        contractAddress: "0xcb94be6f13a1182e4a4b6140cb7bf2025d28e41b",
        supply: "100000000000000",
        changer: {
          activatedAt: "2018-01-13T16:22:13.969Z"
        },
        relayCurrencyId: "5a54afbecc62d20001e58910"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      createdAt: "2018-01-09T11:52:33.035Z",
      isDeleted: false,
      primaryCommunityId: "5a54acc8d9aebc00011760b6",
      numDecimalDigits: 6,
      name: "WeTrust",
      primaryCommunityImageName: "a8886de0-f533-11e7-aabd-a344aed92db1.png",
      order: 13,
      lowerCaseSymbol: "trst",
      lowerCaseCode: "trst"
    },
    {
      _id: "5a8be332b2b342000168ad43",
      symbol: "ATSBNT",
      type: "ethereum",
      code: "ATSBNT",
      details: {
        type: "bancor",
        subType: "relay",
        contractAddress: "0x1d75ebc72f4805e9c9918b36a8969b2e3847c9fb",
        supply: "63921728304626929127596",
        changer: {
          type: "bancor",
          version: "0.7",
          contractAddress: "0xdf76e7e26f6ee937f09a3f17f1d7047c0f928e12",
          conversionFee: "1000",
          isActive: true,
          activatedAt: "2018-02-21T14:45:31.193Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 500000,
      numDecimalDigits: 18,
      balance: "1650450621764101331555"
    },
    5a8be19ed9dc6800011ce986: {
      contractAddress: "0x2daee1aa61d60a252dc80564499a69802853583a",
      currencySymbol: "ATS",
      ratio: 500000,
      numDecimalDigits: 4,
      balance: "7085612711"
    }
}
},
    status: "published",
    stage: "traded",
    isDiscoverable: true,
    createdAt: "2018-02-20T08:58:26.315Z",
    isDeleted: false,
    primaryCommunityId: "5a8be326583f4a0001f75dd6",
    numDecimalDigits: 18,
    name: "Authorship Relay",
    primaryCommunityImageName: "4b9de6b0-1634-11e8-a36b-c1b17c6baaea.png",
    lowerCaseSymbol: "atsbnt",
    lowerCaseCode: "atsbnt",
    order: 12
},
    {
      _id: "5a8be19ed9dc6800011ce986",
      symbol: "ATS",
      type: "ethereum",
      code: "ATS",
      details: {
        type: "erc20",
        contractAddress: "0x2daee1aa61d60a252dc80564499a69802853583a",
        supply: "1000000000000",
        changer: {
          activatedAt: "2018-02-21T14:46:08.032Z"
        },
        relayCurrencyId: "5a8be332b2b342000168ad43"
      },
      status: "published",
      stage: "traded",
      isDiscoverable: true,
      order: 11,
      createdAt: "2018-02-20T08:51:42.612Z",
      isDeleted: false,
      primaryCommunityId: "5a8be18da9a35000014c4b28",
      numDecimalDigits: 4,
      name: "Authorship",
      primaryCommunityImageName: "1162d3c0-1634-11e8-bf39-bd2b2e4b10cf.png",
      lowerCaseSymbol: "ats",
      lowerCaseCode: "ats"
    },
    {
      _id: "5907235ab1b4330001842f4c",
      symbol: "BNCLNG",
      type: "ethereum",
      details: {
        type: "bancor",
        contractAddress: "0xcb76c4edffa1f728ece3269262fb819918b693a3",
        supply: "13950",
        changer: {
          type: "bancor",
          version: "0.1",
          contractAddress: "0x802396452e645a6f724179a3fc1d0b159d8de932",
          isActive: true,
          activatedAt: "2017-05-01T12:00:26.202Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 100,
      numDecimalDigits: 18,
      balance: "7382189533479201711149"
    }
},
    subType: "bounty"
},
    status: "published",
    stage: "traded",
    createdAt: "2017-05-01T12:00:26.202Z",
    primaryCommunityId: "59072308fe34d10001aaf3d7",
    numDecimalDigits: 0,
    primaryCommunityImageName: "521f1270-2fdf-11e7-8b94-7feee6cc151c.jpeg",
    code: "BNCLNG",
    name: "Lingo",
    isDeleted: false,
    isDiscoverable: false,
    lowerCaseSymbol: "bnclng",
    lowerCaseCode: "bnclng",
    order: 1
},
    {
      _id: "59072a82d726c80001ce82f1",
      symbol: "BNCHDL",
      type: "ethereum",
      details: {
        type: "bancor",
        contractAddress: "0x23d1a8bef46012f922243065b1ec1abf7d214436",
        supply: "1781",
        changer: {
          type: "bancor",
          version: "0.1",
          contractAddress: "0xd76bea0bb0538f77030b4705214d7da0331809e3",
          isActive: true,
          activatedAt: "2017-05-01T12:30:58.214Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 100,
      numDecimalDigits: 18,
      balance: "9261200000000000000000"
    }
},
    subType: "bounty"
},
    status: "published",
    stage: "traded",
    createdAt: "2017-05-01T12:30:58.214Z",
    primaryCommunityId: "59072a4f98c9cb000161fee9",
    numDecimalDigits: 0,
    primaryCommunityImageName: "58644bf0-2fdf-11e7-aad4-8938af37073c.jpeg",
    code: "BNCHDL",
    name: "Hodl",
    isDeleted: false,
    isDiscoverable: false,
    lowerCaseSymbol: "bnchdl",
    lowerCaseCode: "bnchdl",
    order: 1
},
    {
      _id: "59072b55f8fe2200012da080",
      symbol: "BNCZUK",
      type: "ethereum",
      details: {
        type: "bancor",
        contractAddress: "0xbc4c0313edea0c6d32f4b668564bca1e542d1119",
        supply: "5270",
        changer: {
          type: "bancor",
          version: "0.1",
          contractAddress: "0x8427fe8ecdb6f958678d8de4c6f980939c100103",
          isActive: true,
          activatedAt: "2017-05-01T12:34:29.405Z"
        },
        reserves: {
          594bb7e468a95e00203b048d: {
      contractAddress: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      currencySymbol: "BNT",
      ratio: 100,
      numDecimalDigits: 18,
      balance: "7387200000000000000000"
    }
},
    subType: "bounty"
},
    status: "published",
    stage: "traded",
    createdAt: "2017-05-01T12:34:29.405Z",
    primaryCommunityId: "59072b3b73f6660001aa8e91",
    numDecimalDigits: 0,
    primaryCommunityImageName: "46fb8270-2fdf-11e7-afc0-2f7aabc1ddf6.jpeg",
    code: "BNCZUK",
    name: "Zuk",
    isDeleted: false,
    isDiscoverable: false,
    lowerCaseSymbol: "bnczuk",
    lowerCaseCode: "bnczuk",
    order: 1
}
  ]
)
