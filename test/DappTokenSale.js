var DappToken = artifacts.require('./DappToken.sol');
var DappTokenSale = artifacts.require('./DappTokenSale.sol');

contract('DappTokenSale', function (accounts) {

    var tokenInstance;
    var tokenSaleInstance;
    var tokenPrice = 1000000000000000;
    var admin = accounts[0];
    var buyer = accounts[1];
    var tokensAvailable = 750000;
    var numberOfTokens;

    it('initializes the contract with the correct values', function () {
        return DappToken.deployed().then(function (instance) {
            tokenInstance = instance;
            return DappTokenSale.deployed();
        }).then(function (instance) {
            tokenSaleInstance = instance;
            return tokenSaleInstance.address;
        }).then(function (address) {
            assert.notEqual(address, 0x0, 'has contract address');
            return tokenSaleInstance.tokenContract();
        }).then(function (address) {
            assert.notEqual(address, 0x0, 'has token contract address');
            return tokenSaleInstance.tokenPrice();
        }).then(function (price) {
            assert.equal(price, tokenPrice, 'token price is correct');
        });
    });

    it('facilitates token buying', function () {
        return DappTokenSale.deployed().then(function (instance) {
            tokenSaleInstance = instance;
            return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, {from: admin});
        }).then(function (receipt) {
            numberOfTokens = 10;
            return tokenSaleInstance.buyTokens(numberOfTokens, {from: buyer, value: numberOfTokens * tokenPrice})
        }).then(function (receipt) {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Sell', 'should be Sell event');
            return tokenSaleInstance.tokensSold();
        }).then(function (amount) {
            assert.equal(amount, numberOfTokens, 'increments number of tokens sold');
            return tokenSaleInstance.balanceOf(buyer);
        }).then(function (balance) {
            assert.equal(balance.toNumber(),numberOfTokens,'increases amount of token buyer has');
            return tokenSaleInstance.balanceOf(tokenSaleInstance.address);
        }).then(function (balance) {
            assert.equal(balance.toNumber(),tokensAvailable - numberOfTokens,'decreases amount of token contract has');
            return tokenSaleInstance.buyTokens(numberOfTokens, {from: buyer, value: 1});
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');
            return tokenSaleInstance.buyTokens(800000, {from: buyer, value: numberOfTokens * tokenPrice})
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, 'cannot buy more tokens than available to contract');
        });
    });
});