var DappToken  = artifacts.require("./DappToken.sol");

contract('DappToken', function(accounts) {

    it('allocates correct values upon deployment',function () {
       return DappToken.deployed().then(function(instance) {
           tokenInstance = instance;
           return tokenInstance.name();
       }).then(function (name) {
           assert.equal(name, 'Dapp Token', 'has the correct name' );
           return tokenInstance.symbol();
       }).then(function (symbol) {
           assert.equal(symbol, 'DAPP', 'has the correct symbol' );
           return tokenInstance.standard();
       }).then(function (standard) {
           assert.equal(standard, 'Dapp Token v1.0', 'has the correct standard' );
       });
    });

    it('allocates initial supply upon deployment',function() {
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

    it('transfers ownership', function () {
        return DappToken.deployed().then(function(instance) {
            tokenInstance = instance;
            return tokenInstance.transfer.call(accounts[1], 999999999999999);
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
            return tokenInstance.transfer.call(accounts[1], 250000, {from: accounts[0]});
        }).then(function (success) {
            assert.equal(success, true,'it returns true');
            return tokenInstance.transfer(accounts[1], 250000, { from: accounts[0]});
        }).then(function (receipt) {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event,'Transfer','should be Transfer event');
            return tokenInstance.balanceOf(accounts[1]);
        }).then(function (balance) {
            assert.equal(balance.toNumber(), 250000, "adds the amount to receiving address");
            return tokenInstance.balanceOf(accounts[0]);
        }).then(function (balance) {
            assert.equal(balance.toNumber(),750000,'deducts from senders account');
        });
    });

    it('approves token for delegated transfers', function () {
        return DappToken.deployed().then(function (instance) {
            tokenInstance = instance;
            return tokenInstance.approve.call(accounts[1],100);
        }).then(function (success) {
            assert.equal(success, true,'it returns true');
            return tokenInstance.approve(accounts[1], 100, { from: accounts[0] });
        }).then(function (receipt) {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event,'Approval','should be Approval event');
            return tokenInstance.allowance(accounts[0], accounts[1]);
        }).then(function (allowance) {
            assert.equal(allowance.toNumber(), 100, 'stores the allowance for delegated transfer');
        });
    });

    it('handles delegated transfers',function() {
        return DappToken.deployed().then(function (instance) {
            tokenInstance = instance;
            fromAccount = accounts[2];
            toAccount = accounts[3];
            spendingAccount = accounts[4];
            return tokenInstance.transfer(fromAccount, 100, { from: accounts[0] });
        }).then(function (receipt) {
            return tokenInstance.approve(spendingAccount, 10, {from: fromAccount});
        }).then(function (receipt) {
            return tokenInstance.transferFrom(fromAccount, toAccount, 9999, {from: spendingAccount});
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
            return tokenInstance.transferFrom(fromAccount, toAccount, 20, {from: spendingAccount});
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
            return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, {from: spendingAccount});
        }).then(function (success) {
            assert.equal(success, true,'must be true')
            return tokenInstance.transferFrom(fromAccount, toAccount, 10, {from: spendingAccount});
        }).then(function (receipt) {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event,'Transfer','should be Transfer event');
            return tokenInstance.balanceOf(fromAccount);
        }).then(function (balance) {
            assert.equal(balance.toNumber(), 90, 'deducts balance from sending account');
            return tokenInstance.balanceOf(toAccount);
        }).then(function (balance) {
            assert.equal(balance.toNumber(), 10, 'adds amount to receiving account');
            return tokenInstance.allowance(fromAccount, spendingAccount);
        }).then(function (allowance) {
            assert.equal(allowance, 0, 'deducts the amount from the allowance')
        });
    });

});