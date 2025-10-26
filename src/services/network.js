import { ethers } from 'ethers';

const defaultUrl = 'http://127.0.0.1:8545' ;
export let currentUrl;
export let provider 

provider = new ethers.JsonRpcProvider(defaultUrl);
currentUrl = defaultUrl;

export async function set(url){
    try{
        provider = new ethers.JsonRpcProvider(url);
        currentUrl = url;
        const result = await provider.getNetwork();
        const network = {
            URL: currentUrl,
            name: result.name,
            chainId: result.chainId
        }    
        console.log(network);
    }catch(err){
        console.error(err);
    }
}

export async function get(){
    try{
        const result = await provider.getNetwork();
        const network = {
            URL: currentUrl,
            name: result.name,
            chainId: result.chainId
        }    
        console.log(network);
    }catch(err){
        console.error(err);
    }
}

export function getDefault(){
    try{
        const result = {
            URL: defaultUrl
        }
        console.log(result);
    }catch(err){
        console.error(err);
    }
}