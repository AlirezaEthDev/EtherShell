import { ethers } from 'ethers';

const defaultUrl = 'http://127.0.0.1:8545' ;
export let currentUrl;
export let provider 

provider = new ethers.JsonRpcProvider(defaultUrl);
currentUrl = defaultUrl;

export function set(url){
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

export function get(){
    provider.getNetwork().then((result) => {
        const network = {
            URL: currentUrl,
            name: result.name,
            chainId: result.chainId
        }
        console.log(network);
    }).catch(console.error);
}

export function getDefault(){
    const result = {
        URL: defaultUrl
    }
    console.log(result);
}