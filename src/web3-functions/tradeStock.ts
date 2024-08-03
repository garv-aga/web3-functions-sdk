import {
    Web3Function,
    Web3FunctionEventContext,
  } from "@gelatonetwork/web3-functions-sdk";
  
  import { Interface } from "@ethersproject/abi";
  import ky from "ky";

  interface PostResponse {
    id: string,
    filled_qty: string,
    filled_avg_price: string,
    status: string
    }
  
  const abi = [
    `event BuyRequest(uint256 amountOfStocks, address buyer, uint256 purchaseValue)`,
    `function mintRStock(uint256 amoutnOfStocks, address _buyer, uint256 _purchaseValue) external`,
    `event SellRequest(uint256 amountOfStocks, address seller, uint256 sellValue)`,
    `function burnRStock(uint256 _amountOfStocks, address _seller, uint256 _sellValue) external`,
  ];
  
  Web3Function.onRun(async (context: Web3FunctionEventContext) => {
    const { log } = context;
  
    const rMarket = new Interface(abi);
    const contractAddr = "";
  
    const description = rMarket.parseLog(log);

    const {amount,trader, value} = description.args;

    const url = "https://paper-api.alpaca.markets/v2/orders/";
    const headers = {
        'accept': 'application/json',
        'content-type': 'application/json',
        'APCA-API-KEY-ID': 'secrets.alpacaKey',
        'APCA-API-SECRET-KEY': 'secrets.alpacaSecret'
    };
  
    if (description.name == "BuyRequest") {
        // buy share in Alpaca if success
        const data = {
            side: "buy",
            type: "market",
            time_in_force: "gtc",
            symbol: 'AAPL',
            qty: amount
        };

        const response = await ky.post(url, {
                            headers: headers,
                            json: data
                        }).json<PostResponse>();

        await sleep(2000);

        const filledResponse = await ky.get(url+`${response.id}`,{headers: headers}).json<PostResponse>();
        const amountOfStocks = parseInt(filledResponse.filled_qty);
        const purchaseValue = parseInt(filledResponse.filled_avg_price)*amountOfStocks;
        return {
            canExec: true,
            callData: [{to: contractAddr, data: rMarket.encodeFunctionData("mintRStock",[amountOfStocks,trader,purchaseValue]),},],
        };
    }
  
    else if(description.name == "SellRequest") {
        // sell shares in Alpaca if success
        const data = {
            side:'sell',
            type: "market",
            time_in_force: "gtc",
            symbol: 'AAPL',
            qty: amount
        };

        const response = await ky.post(url, {
                            headers: headers,
                            json: data
                        }).json<PostResponse>();

        await sleep(2000);
        
        const filledResponse = await ky.get(url+`${response.id}`,{headers: headers}).json<PostResponse>();
        const amountOfStocks = parseInt(filledResponse.filled_qty);
        const sellValue = parseInt(filledResponse.filled_avg_price)*amountOfStocks;
        return {
            canExec: true,
            callData: [{to: contractAddr, data: rMarket.encodeFunctionData("burnRStock",[amountOfStocks,trader,sellValue]),},],
        };
    }

    else {
        throw new Error("Unexpected");
    }

  });

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}