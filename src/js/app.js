App = {
    web3Provider:null,
    contracts:{},
    account:"0x0",
    tokenPrice:1000000000000000,
    tokensSold:0,
    tokensAvailable:750000,
    loading:false,
    init: function () {
        console.log("app initialized");
        return App.initWeb3();
    },
    initWeb3: function() {
        if(typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContracts();
    },
    initContracts: function () {
        $.getJSON("DappTokenSale.json",function(dappTokenSale) {
            App.contracts.DappTokenSale = TruffleContract(dappTokenSale);
            App.contracts.DappTokenSale.setProvider(App.web3Provider);
            App.contracts.DappTokenSale.deployed().then(function (dappTokenSale) {
                console.log(dappTokenSale.address);
            })
        }).done(function () {
            $.getJSON("DappToken.json",function (dappToken) {
                App.contracts.DappToken = TruffleContract(dappToken);
                App.contracts.DappToken.setProvider(App.web3Provider);
                App.contracts.DappToken.deployed().then(function (dappToken) {
                    console.log(dappToken.address);
                });
            });

            App.listenForEvents();
            return App.render();
        });
    },
    render: function () {
        if(App.loading) {
            return;
        }
        App.loading = true;
        var loader = $('#loader');
        var content = $('#content');
        loader.show();
        content.hide();
        web3.eth.getCoinbase(function (err, account) {
            if(err == null) {
                App.account = account;
                $('#accountAddress').html("Your account:" + account);
            }
        });

        App.contracts.DappTokenSale.deployed().then(function(instance) {
           dappTokenSaleInstance = instance;
           return dappTokenSaleInstance.tokenPrice();
        }).then(function (tokenPrice) {
            App.tokenPrice = tokenPrice;
            $('.token-price').html(web3.fromWei(App.tokenPrice,"ether").toNumber());
            return dappTokenSaleInstance.tokensSold();
        }).then(function (tokensSold) {
            App.tokensSold = tokensSold.toNumber();
            $('.tokens-sold').html(App.tokensSold);
            $('.tokens-available').html(App.tokensAvailable);

            var progressPercent = (Math.ceil(App.tokensSold)/App.tokensAvailable) * 100;
            $('#progress').css('width',progressPercent + '%');

            App.contracts.DappToken.deployed().then(function (instance) {
                DappTokenInstance = instance;
                return DappTokenInstance.balanceOf(App.account);
            }).then(function (balance) {
                $('.dapp-balance').html(balance.toNumber());
                App.loading = false;
                loader.hide();
                content.show();
            })
        });
    },
    buyTokens: function () {
        $('#content').hide();
        $('#loader').show();
        var numberOfTokens = $('#numberOfToken').val();
        App.contracts.DappTokenSale.deployed().then(function (instance) {
            return instance.buyTokens(numberOfTokens,{
                from: App.account,
                value: numberOfTokens * App.tokenPrice,
                gas: 500000
            });
        }).then(function (result) {
            console.log("tokens bought...")
            $('form').trigger('reset');
        });
    },

    listenForEvents:function () {
        App.contracts.DappTokenSale.deployed().then(function (instance) {
            instance.Sell({},{
                fromBlock: 0,
                toBlock: 'latest',
            }).watch(function (error, event) {
                console.log("event triggered",event);
                App.render();
            })
        })
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});