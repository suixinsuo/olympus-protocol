const FutureERC721Token = artifacts.require("FutureERC721Token");

contract("FutureERC721Token", accounts => {
  let futureERC721Token;

  it("Should be able to deploy", async () => {
    futureERC721Token = await FutureERC721Token.new("FutureToken", "FTT");
  });

  it("Should be able to deploy", async () => {
    futureERC721Token = await FutureERC721Token.mint();
  });

});
