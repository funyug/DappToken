var DappToken  = artifacts.require("./DappToken.sol");

contract('DappToken', function(accounts) {
   it('sets_total_supply_upon_deployment',function() {
       return DappToken.deployed().then(function(instance) {
           tokenInstance = instance;
           return tokenInstance.totalSupply();
       }).then(function (totalSupply) {
           assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1,000,000');
           return tokenInstance.balanceOf(accounts[0]);
       }).then(function(adminBalance) {
           assert.equal(adminBalance.toNumber(), 1000000, 'it allocates initial supply to admin');
       });
   });
});