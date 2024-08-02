import {
    Web3Function,
    Web3FunctionEventContext,
  } from "@gelatonetwork/web3-functions-sdk";
  
  import { Interface } from "@ethersproject/abi";
  import ky from "ky";
  
  const abi = [
    `event BuyRequest(uint256 amountOfStocks, address buyer, uint256 purchaseValue)`,
    `function mintRStock(uint256 amoutnOfStocks, address _buyer, uint256 _purchaseValue) external`,
    `event SellRequest(uint256 amountOfStocks, address seller, uint256 sellValue)`,
    `function burnRStock(uint256 _amountOfStocks, address _seller, uint256 _sellValue) external`,
  ];
  
  Web3Function.onRun(async (context: Web3FunctionEventContext) => {
    const { log } = context;
  
    const rMarket = new Interface(abi);
  
    const description = rMarket.parseLog(log);

    const {amount,trader, value} = description.args;
  
    if (description.name == "BuyRequest") {
        // buy share in Alpaca if success
        const url = "https://paper-api.alpaca.markets/v2/orders";
        const headers = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'APCA-API-KEY-ID': 'secrets.alpacaKey',
            'APCA-API-SECRET-KEY': 'secrets.alpacaSecret'
        };
        const data = {
            side:'side',
            type: "market",
            time_in_force: "gtc",
            symbol: 'symbol',
            qty: 's'
        };

        const response = ky.post(url, {
                            headers: headers,
                            json: data
                        }).json();
        return {
            canExec: true,
            callData: rMarket.encodeFunctionData("mintRStock",[amount,trader, value]),
        };
    }
  
    else if(description.name == "SellRequest") {
        // sell shares in Alpaca if success
        const url = "https://paper-api.alpaca.markets/v2/orders";
        const headers = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'APCA-API-KEY-ID': 'secrets.alpacaKey',
            'APCA-API-SECRET-KEY': 'secrets.alpacaSecret'
        };
        const data = {
            side:'side',
            type: "market",
            time_in_force: "gtc",
            symbol: 'symbol',
            qty: 's'
        };

        const response = ky.post(url, {
                            headers: headers,
                            json: data
                        }).json();
        return {
            canExec: true,
            callData: rMarket.encodeFunctionData("burnRStock",[amount,trader, value]),
        };
    }

    else {
        throw new Error("Unexpected");
    }

  });
  