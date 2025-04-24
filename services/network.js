const ethers = require('ethers');

const defaultUrl = 'http://127.0.0.1:8545' ;
let currentUrl;
let provider

const set = (url) => {
    provider = new ethers.JsonRpcProvider(url);
    provider.getNetwork().then((result) => {
        currentUrl = url;
        const network = {
            URL: currentUrl,
            name: result.name,
            chainId: result.chainId
        }
        console.log(network);
    }).catch(console.error);
}

const get = () => {
    provider.getNetwork().then((result) => {
        const network = {
            URL: currentUrl,
            name: result.name,
            chainId: result.chainId
        }
        console.log(network);
    }).catch(console.error);
}

const getDefault = () => {
    const result = {
        URL: defaultUrl
    }
    console.log(result);
}

module.exports = {
    set,
    get,
    getDefault
}