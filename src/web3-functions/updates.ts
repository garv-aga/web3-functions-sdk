import {
    Web3Function,
    Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "@ethersproject/contracts";
import ky from "ky";
import { parse } from "path";
import { boolean } from "hardhat/internal/core/params/argumentTypes";

const abi = ["function updateMarketData(bool _isOpen, uint256 _stockValue, uint256 _usdtValue) external"];
const precision = 10 ^ 10;

interface MarketResponse {
    is_open: boolean,
}

interface PriceResponse {
    price: string,
}

Web3Function.onRun(async (context: Web3FunctionContext) => {
    const { multiChainProvider } = context;
    const provider = multiChainProvider.default();

    const contractAddr = "";
    const contract = new Contract(contractAddr, abi, provider);

    const marketUrl = "https://paper-api.alpaca.markets/v2/clock/";
    const headers = {
        'accept': 'application/json',
        'content-type': 'application/json',
        'APCA-API-KEY-ID': 'secrets.alpacaKey',
        'APCA-API-SECRET-KEY': 'secrets.alpacaSecret'
    };
    const stockUrl = "https://api.twelvedata.com/price?symbol=AAPL&apikey=your_api_key";
    const usdtUrl = "https://api.coingecko.com/api/v3/simple/price?ids=usdt&vs_currencies=usd";


    const marketRespone = await ky.get(marketUrl, { headers: headers }).json<MarketResponse>();
    const stockResponse = await ky.get(stockUrl).json<PriceResponse>();
    const usdtResponse = await ky.get(usdtUrl).json<PriceResponse>();
    const stockValue = parseFloat(stockResponse.price) * precision;
    const usdtValue = parseFloat(usdtResponse.price) * precision;
    const open = marketRespone.is_open;

    return {
        canExec: true,
        callData: [{to: contractAddr, data: contract.interface.encodeFunctionData("updateMarketData", [open, stockValue, usdtValue]),},],
    };

});