import { ethers } from 'ethers';
import { getContArr } from '../utils/contractLister.js';

export async function getContracts(contPointer) {
    const contArray = await getContArr();
    let result;

    if(!contPointer && contPointer != 0) {
        result = contArray;
    } else if(typeof contPointer === 'number') {
        result = contArray[contPointer];
    } else if(ethers.isAddress(contPointer)) {
        const index = contArray.findIndex(contract => contract.address == contPointer);
        result = contArray[index];
    } else if(typeof contPointer === 'string') {
        const index = contArray.findIndex(contract => contract.name == contPointer);
        result = contArray[index];
    } else {
        throw new Error('Input is NOT valid!');
    }

    console.log(result);
}
