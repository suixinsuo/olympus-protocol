const FutureERC721Token = artifacts.require("FutureERC721Token");
const futureTokenShort = {
  name: "FutureShortToken",
  symbol: "FTST",
  direction: -1,
}
const futureTokenLong = {
  name: "FutureLongToken",
  symbol: "FTLT",
  direction: 1,
}

const depositAmount = 10 ** 18;
const initialBuyingPrice = 10 ** 19;
const accountAShouldHaveAmountOfTokens = 1;
const accountBShouldHaveAmountOfTokens = 10;
const randomTokenId = Math.floor(Math.random() * 10);

const amountOfTokensToMint = 10;
contract("FutureERC721Token", accounts => {
  let futureERC721TokenShort;
  let futureERC721TokenLong;
  const accountA = accounts[0];
  const accountB = accounts[1];
  const accountC = accounts[2];

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
    const mintTx = await futureERC721TokenShort.mint(accountA, depositAmount, initialBuyingPrice);
    assert.ok(mintTx);
    assert.equal((await futureERC721TokenShort.totalSupply()).toNumber(), 1);
    assert.equal((await futureERC721TokenShort.balanceOf(accountA)).toNumber(), 1);
    const tokenIds = (await futureERC721TokenShort.getTokenIdsByOwner(accountA)).map(id => id.toNumber());
    assert.equal(tokenIds.length, accountAShouldHaveAmountOfTokens);
    assert.equal((await futureERC721TokenShort.exists(tokenIds[0])), true);
    assert.equal((await futureERC721TokenShort.ownerOf(tokenIds[0])), accountA);
  });

  it("Should be able to mint multiple tokens", async () => {

    const mintMultipleTx = await futureERC721TokenShort.mintMultiple(
      accountB,
      depositAmount,
      initialBuyingPrice,
      amountOfTokensToMint
    );

    assert.ok(mintMultipleTx);

    //This mint gives tokens to the alternative account, so it shouldn't change the main accounts tokens.
    const mainTokenIds = (await futureERC721TokenShort.getTokenIdsByOwner(accountA)).map(id => id.toNumber());
    assert.equal(mainTokenIds.length, accountAShouldHaveAmountOfTokens);

    //Check if the alternative account has the right amount of tokens
    const alternativeTokenIds = (await futureERC721TokenShort.getTokenIdsByOwner(accountB)).map(id => id.toNumber());
    assert.equal(alternativeTokenIds.length, accountBShouldHaveAmountOfTokens);

    for (let i = 0; i < amountOfTokensToMint; i++) {
      assert.equal(await futureERC721TokenShort.exists(alternativeTokenIds[i]), true);
    }

  });

  it("Should be able to transfer tokens", async () => {
    let transferTx;
    const alternativeTokenIdsBefore = (await futureERC721TokenShort.getTokenIdsByOwner(accountB)).map(id => id.toNumber());
    // Transfer first half of tokens
    for (let i = 0; i < alternativeTokenIdsBefore.length / 2; i++) {
      transferTx = await futureERC721TokenShort.safeTransferFrom(accountB, accountC, alternativeTokenIdsBefore[i], {
        from: accountB,
      });
      assert.ok(transferTx);
    }

    //This mint gives tokens to the alternative account, so it shouldn't change the main accounts tokens.
    const mainTokenIds = (await futureERC721TokenShort.getTokenIdsByOwner(accountA)).map(id => id.toNumber());
    assert.equal(mainTokenIds.length, accountAShouldHaveAmountOfTokens, "0");

    //Check if the alternative account has the right amount of tokens
    const alternativeTokenIds = (await futureERC721TokenShort.getTokenIdsByOwner(accountB)).map(id => id.toNumber());
    assert.equal(alternativeTokenIds.length, accountBShouldHaveAmountOfTokens / 2, "1");

    //Check if the second alternative account has the right amount of tokens
    const alternativeTokenIdsTwo = (await futureERC721TokenShort.getTokenIdsByOwner(accountC)).map(id => id.toNumber());
    assert.equal(alternativeTokenIdsTwo.length, accountBShouldHaveAmountOfTokens / 2, "2");
  });

  it("Should be able to invalidate a token", async () => {
    // We update the hashmap, is not really required this token exists
    const invalidateTx = await futureERC721TokenShort.invalidateToken(randomTokenId);
    assert.ok(invalidateTx);
    assert.equal(await futureERC721TokenShort.isTokenValid(randomTokenId), false);
  });

  // --------------------------------------------------------------------------
  // ----------------------------- FILTERS  -------------------------------
  // We depend of the first test that create long token.
  // Previous test uses short token, we expected long token to be empty,


  it("Should be able to filter valid tokens", async () => {
    let validTokenList;

    validTokenList = await futureERC721TokenLong.getValidTokens();
    assert.equal(validTokenList.length, 0, ' Future LONG has no tokens at the starting of the test');

    await futureERC721TokenLong.mintMultiple(
      accountA,
      depositAmount,
      initialBuyingPrice,
      amountOfTokensToMint
    );

    validTokenList = await futureERC721TokenLong.getValidTokens();
    assert.equal(validTokenList.length, amountOfTokensToMint, 'All tokens are valid');

    validTokenList = await futureERC721TokenLong.getValidTokenIdsByOwner(accountA);
    assert.equal(validTokenList.length, amountOfTokensToMint, 'All tokens by owner are valid');

    const firstTokenId = validTokenList[0];

    // We invalidate 1 token
    await futureERC721TokenLong.invalidateToken(firstTokenId);

    validTokenList = await futureERC721TokenLong.getValidTokens();
    assert.equal(validTokenList.length, amountOfTokensToMint - 1, 'All tokens are valid less 1');
    assert.notEqual(validTokenList[0], firstTokenId, 'Invalidated token doesn\'t  appear in array');

    validTokenList = await futureERC721TokenLong.getValidTokenIdsByOwner(accountA);
    assert.equal(validTokenList.length, amountOfTokensToMint - 1, 'All tokens by owner are valid less 1');
    assert.notEqual(validTokenList[0], firstTokenId, 'Invalidated token doesn\'t appear in array');
  });

  it("Should be able to invalidate several tokens", async () => {
    let validTokenList;

    validTokenList = await futureERC721TokenLong.getValidTokens();
    assert.equal(validTokenList.length, amountOfTokensToMint - 1, ' Dependency from previous test');

    // Empty array
    const tx = await futureERC721TokenLong.invalidateTokens([]);
    assert.ok(tx, 'Empty array doesnt revert');

    // We will disable all except the last token
    const lastTokenId = validTokenList[validTokenList.length - 1];

    await futureERC721TokenLong.invalidateTokens(validTokenList.splice(0, validTokenList.length - 1));


    validTokenList = await futureERC721TokenLong.getValidTokens();
    assert.equal(validTokenList.length, 1, 'Only 1 token is valid');
    assert.notEqual(validTokenList[0], lastTokenId, 'Only last token is valid');

    validTokenList = await futureERC721TokenLong.getValidTokenIdsByOwner(accountA);
    assert.equal(validTokenList.length, 1, 'Only 1 token is valid by owner');
    assert.notEqual(validTokenList[0], lastTokenId, 'Only last token is valid by owner');
  });
});
