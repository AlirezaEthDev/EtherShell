// SPDX-License-Identifier: MIT`

pragma solidity ^0.5.12;

contract kycContract{

    struct account{

        address accountAddr;
        uint lockedBalance;
        bool kycStatus;
        bool isContract;
        uint txCount;

    }

    mapping(address => account) private accountList;

    event newAccountListed(address newAccountAddress,
                            uint newAccountLockedBalance,
                            bool newAccountkycStatus,
                            bool isContractAccount);
    event balanceUnlocked(address accountAddress,
                            uint unlockedValue,
                            uint lockedBalance);
    event accountRemoved(address accountAddress,
                            uint accountLockedBalance,
                            bool accountKycStatus,
                            bool isContractAccount,
                            uint accountTxCount);
    event accountUpdated(address newAccountAddress,
                            uint newAccountLockedBalance,
                            bool newAccountkycStatus,
                            bool isContractAccount,
                            uint accountTxCount);
    event transferSuccess(address senderAccountAddress,
                            address recieptAccountAddress,
                            uint transferredValue,
                            uint accountTxCount);

    function addNewAccount(address requester , uint valueToLock) private {

        if(tx.origin == requester){//To detect the requester is EOA or contract!
        
            accountList[requester] = account(requester,valueToLock,true,false,0);
            emit newAccountListed(requester,valueToLock,true,false);

        }else{

            accountList[requester] = account(requester,valueToLock,true,true,0);
            emit newAccountListed(requester,valueToLock,true,true);

        }

    }

    function transferBack(uint backValue) external {

        require( accountList[msg.sender].lockedBalance >= backValue ,
                "The requested value is more than locked value!"
                );

         if(tx.origin == msg.sender){

                address(uint160(msg.sender)).transfer(backValue);

            }else{

                (bool success,bytes memory returnData) = (msg.sender).call.value(backValue)("");
                require(success , "Transfer back failed!");

            }

            accountList[msg.sender].lockedBalance -= backValue;
            emit balanceUnlocked(msg.sender,backValue,accountList[msg.sender].lockedBalance);

    }

    function removeAccount() external {

        require( accountList[msg.sender].lockedBalance == 0 ,
                    "You need to withdraw your entire balance first!");
        emit accountRemoved(msg.sender,
                            accountList[msg.sender].lockedBalance,
                            accountList[msg.sender].kycStatus,
                            accountList[msg.sender].isContract,
                            accountList[msg.sender].txCount
                            );

        //this.transferBack(msg.sender,accountList[msg.sender].lockedBalance);
        accountList[msg.sender].accountAddr=0x0000000000000000000000000000000000000000;
        accountList[msg.sender].kycStatus=false;
        accountList[msg.sender].isContract=false;
        accountList[msg.sender].txCount=0;

    }

    function userView() external view returns(address,uint,bool,bool,uint){

        return (accountList[msg.sender].accountAddr,
                accountList[msg.sender].lockedBalance,
                accountList[msg.sender].kycStatus,
                accountList[msg.sender].isContract,
                accountList[msg.sender].txCount
                );

    }

    function kycCheck(address target) external view returns(bool){

        return accountList[target].kycStatus;

    }

    function secureTransfer(address destination,uint sendValue) external {

        require(accountList[msg.sender].lockedBalance >= sendValue ,
                "The value for send is more than locked value!");
        require(this.kycCheck(destination) , "The destination not verified!");

        uint destinationSize;

        assembly {

            destinationSize := extcodesize(destination)

        }

        if( destinationSize > 0 ){

            (bool success , bytes memory returnData) = destination.call.value(sendValue)("");
            require( success , "Transfer to contract failed!");

        }else{

            address(uint160(destination)).transfer(sendValue);

        }

        accountList[msg.sender].lockedBalance -= sendValue;
        accountList[msg.sender].txCount++;
        emit transferSuccess(msg.sender,destination,sendValue,accountList[msg.sender].txCount);
        
    }

    function() external payable{

        addNewAccount(msg.sender,msg.value);

    }

}