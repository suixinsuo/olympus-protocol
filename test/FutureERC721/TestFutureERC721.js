const FutureERC721Token = artifacts.require("FutureERC721Token");
const futureTokenShort = {
  name: "FutureShortToken",
  symbol: "FTST",
  direction: 0,
}
const futureTokenLong = {
  name: "FutureLongToken",
  symbol: "FTLT",
  direction: 1,
}

const depositAmount = 10 ** 18;
const initialBuyingPrice = 10 ** 19;
const mainAccountShouldHaveAmountOfTokens = 1;
const alternativeAccountShouldHaveAmountOfTokens = 10;

const amountOfTokensToMint = 10;
contract("FutureERC721Token", accounts => {
  let futureERC721TokenShort;
  let futureERC721TokenLong;
  const mainAccount = accounts[0];
  const alternativeAccount = accounts[1];
  const alternativeAccountTwo = accounts[2];

  it("Should be able to deploy short and long position", async () => {
    futureERC721TokenShort = await FutureERC721Token.new(
      futureTokenShort.name,
      futureTokenShort.symbol,
      futureTokenShort.direction
    );
    futureERC721TokenLong = await FutureERC721Token.new(
      futureTokenLong.name,
      futureTokenLong.symbol,
      futureTokenLong.direction
    );
    assert.equal(await futureERC721TokenShort.name.call(), futureTokenShort.name);
    assert.equal(await futureERC721TokenLong.name.call(), futureTokenLong.name);
    assert.equal(await futureERC721TokenShort.symbol.call(), futureTokenShort.symbol);
    assert.equal(await futureERC721TokenLong.symbol.call(), futureTokenLong.symbol);
    assert.equal((await futureERC721TokenShort.tokenPosition.call()).toNumber(), futureTokenShort.direction);
    assert.equal((await futureERC721TokenLong.tokenPosition.call()).toNumber(), futureTokenLong.direction);
  });

  it("Should be able to mint a single token", async () => {
    const mintTx = await futureERC721TokenShort.mint(mainAccount, depositAmount, initialBuyingPrice);
    assert.ok(mintTx);
    assert.equal((await futureERC721TokenShort.totalSupply()).toNumber(), 1);
    assert.equal((await futureERC721TokenShort.balanceOf(mainAccount)).toNumber(), 1);
    const tokenIds = (await futureERC721TokenShort.getTokenIdsByOwner(mainAccount)).map(id => id.toNumber());
    assert.equal(tokenIds.length, mainAccountShouldHaveAmountOfTokens);
    assert.equal((await futureERC721TokenShort.exists(tokenIds[0])), true);
    assert.equal((await futureERC721TokenShort.ownerOf(tokenIds[0])), mainAccount);
  });

  it("Should be able to mint multiple tokens", async () => {
    const depositArray = [];
    const initialPriceArray = [];
    for (let i = 0; i < amountOfTokensToMint; i++) {
      depositArray.push(depositAmount);
      initialPriceArray.push(initialBuyingPrice);
    }
    const mintMultipleTx = await futureERC721TokenShort.mintMultiple(alternativeAccount, depositArray, initialPriceArray);

    assert.ok(mintMultipleTx);

    //This mint gives tokens to the alternative account, so it shouldn't change the main accounts tokens.
    const mainTokenIds = (await futureERC721TokenShort.getTokenIdsByOwner(mainAccount)).map(id => id.toNumber());
    assert.equal(mainTokenIds.length, mainAccountShouldHaveAmountOfTokens);

    //Check if the alternative account has the right amount of tokens
    const alternativeTokenIds = (await futureERC721TokenShort.getTokenIdsByOwner(alternativeAccount)).map(id => id.toNumber());
    assert.equal(alternativeTokenIds.length, alternativeAccountShouldHaveAmountOfTokens);

    for (let i = 0; i < amountOfTokensToMint; i++) {
      assert.equal(await futureERC721TokenShort.exists(alternativeTokenIds[i]), true);
    }

  });

  it("Should be able to transfer tokens", async () => {
    let transferTx;
    const alternativeTokenIdsBefore = (await futureERC721TokenShort.getTokenIdsByOwner(alternativeAccount)).map(id => id.toNumber());
    // Transfer first half of tokens
    for (let i = 0; i < alternativeTokenIdsBefore.length / 2; i++) {
      transferTx = await futureERC721TokenShort.safeTransferFrom(alternativeAccount, alternativeAccountTwo, alternativeTokenIdsBefore[i], {
        from: alternativeAccount,
      });
      assert.ok(transferTx);
    }

    //This mint gives tokens to the alternative account, so it shouldn't change the main accounts tokens.
    const mainTokenIds = (await futureERC721TokenShort.getTokenIdsByOwner(mainAccount)).map(id => id.toNumber());
    assert.equal(mainTokenIds.length, mainAccountShouldHaveAmountOfTokens, "0");

    //Check if the alternative account has the right amount of tokens
    const alternativeTokenIds = (await futureERC721TokenShort.getTokenIdsByOwner(alternativeAccount)).map(id => id.toNumber());
    assert.equal(alternativeTokenIds.length, alternativeAccountShouldHaveAmountOfTokens / 2, "1");

    //Check if the second alternative account has the right amount of tokens
    const alternativeTokenIdsTwo = (await futureERC721TokenShort.getTokenIdsByOwner(alternativeAccountTwo)).map(id => id.toNumber());
    assert.equal(alternativeTokenIdsTwo.length, alternativeAccountShouldHaveAmountOfTokens / 2, "2");
  });

});
