# RemixTest

# Kovan Tokens

- MOT 0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a
- KNC 0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b

# Future

1. Create
// Direction address is MOT, must be change later on
`
  "Test Future", "For testing purposes", 1, 0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a,
  2, 100, 800

`
# Index

1.  Create
    //50,50 KNC, MANA
    `"Test Index" ,"TIX","Test index in kovan","index",18,["0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b","0x569b92514e4ea12413df6e02e1639976940cde70"] , [50,50]`
    // 100 KNC
    ```s
    "Test Index" ,"TIX","Test index in kovan","index",18,["0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b"] , [100]
    ```
2.  Initalize

"0x8dbcf3dd83ca558129fcb8738ec5d313da74b26e",0 // Olympus labs
"0xc212438ab81c07ea9d9f5e993161010ab1dbae68" , 0 // Gerdinand

3. Set intervals (1 days)
["0x576974686472617750726f766964657200000000000000000000000000000000", "0x427579546f6b656e730000000000000000000000000000000000000000000000", "0x526562616c616e636550726f7669646572000000000000000000000000000000"]
, ["86400","86400","86400"]
# Fund

1.  Create
    "Sample Fund","SFP","Testing fund","Funds","18"

2.  Initalize

"0x8dbcf3dd83ca558129fcb8738ec5d313da74b26e",0,0 // Basic
"0x8dbcf3dd83ca558129fcb8738ec5d313da74b26e","100","1296000" // As the portal will do
3.  Buy
    // MANA (0.001 ETH)
    `"0x0",["0x569b92514e4ea12413df6e02e1639976940cde70"],["1000000000000000"],[0]`
    `"0x0",["0x569b92514e4ea12413df6e02e1639976940cde70"],["4000000000000000"],["6872228904967590000000"]`

    // MOT (0.001 ETH)
    `"0x0",["0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a"],["1000000000000000"],[0]`

4.  Sell MANA (check balance)

`"0x0",["0x569b92514e4ea12413df6e02e1639976940cde70"],["292344449412625772"],[0]`
`"0x0",["0x569b92514e4ea12413df6e02e1639976940cde70"],["2000000000000000000"],[141218919641028]`

""
(same on the exchange provider) -- Remember to have tokens and approve before -- And change deposit address
`["0x965e1449b880ae4e24f8dcd6537d0bef79c7a731"],["292344449412625772"],[0],"0x13a1e7155e4da0aba3e05df8f6b3018666837f4a","0x0000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000"`

5.  Exchange provider
    5.1. buy mana (0.001ETH)
    ["0x569b92514e4ea12413df6e02e1639976940cde70"],["1000000000000000"],[0],"0x13a1e7155e4da0aba3e05df8f6b3018666837f4a","0x0000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000"
    1771813525437120782430

6.  Exchange component external
    "Reimbursable","ADDRESS"
## Mock Rebalance
["0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b","0x569b92514e4ea12413df6e02e1639976940cde70"] , [50,50], "0x7A9305A0f2a0A9b088Aef901A68A1E4B9212e195", "0x023d373f70662e8b7031421cfc513aeeaffb983a"

## Check rates
MOT Buy Rate
"0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a","1000000000000000000","0x0"



## Kovan Addresses

ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
MOT: '0x41dee9f481a1d2aa74a3f1d0958c1db6107c686a',
KNC: '0xd7cbe7bfc7d2de0b35b93712f113cae4deff426b',
ZIL: '0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27',
ENG: '0xf0ee6b27b759c9893ce4f094b49ad28fd15a23e4',
SNT: '0x81c9756442e26b9017a12db2321fe9490416533d',
ELF: '0x7e7a1fa9d2c6377b298bf00b0c6b8e2d5f9c0375',
POWR: '0x71da415026fa64d1e348415e9486253e94333acc',
MANA: '0x569b92514e4ea12413df6e02e1639976940cde70',
BAT: '0xec88a5050c63bb9e073afc78b3b9378d0eb53257',
REQ: '0xa0960b4eda324dfe7ba3eb7ad3f8c2cd097cf931',
GTO: '0x0ceba3579d3122d2a6c5677d5a06a77cb51deb1a',
RDN: '0xb805955423417c4084f29252dbc8e5aa5be06075',
DAI: '0x621e8c126fd0c62f1c6ce09483b8c6e83d5bc7c8', // Not texted
EOS: '0xea1887835d177ba8052e5461a269f42f9d77a5af',
SALT: '0xcffe65c16bd1141357f65d13b3dd53c9db8be785',
ETHOS: '0x5af2be193a6abca9c8817001f45744777db30756', // BQX in kyber, not tested
ADX: '0x5bb4514607f1ddc0c18af72685baa8914783b394',
AST: '0x9840b905dc6dcdbc6b37b59c423cfddbf0b522ed',
RCN: '0xf1712275bdc2f6802fa4acef834337ac3699fab5',
OMG: '0x7dc75361d616f4d5748a9f050d7cbb8ca3781b0b',
LINK: '0xe76b6c45192ece08ce5e9d41c6cfb9bb1390d469',
STORM: '0x533697dfa3b28a830618abd74724052f517c40fb', // No tested
IOST: '0x6e8704cba63029c442ee995933dc3a2b2197a3e6',
APPC: '0x7d7ff20dcfbfa9f714987602139ab12801a0677c',
DGX: '0x5a060e07ae8c5b670d2fd1af4b8f6e8c2e09b8e6', // No tested

"Olympus Fund","OLF","Derivative which base his assets value in diversification of tokens","General","18"
"0x0",["0x0f5d2fb29fb7d3cfee444a200298f468908cc942"],["844242424242425"],[0]
