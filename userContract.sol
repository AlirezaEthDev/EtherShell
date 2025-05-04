// SPDX-License-Identifier: MIT`

pragma solidity ^0.5.12;

contract userContract{

    address owner;

    event registerOnKycContract( address kycContractAddress , uint valueToLock );
    event getBackValueFromKycContract( address kycContractAddress , uint valueToBack );
    event removeAccountFromKycContract( address kycContractAddress);
    event transferWithKycContract( address kycContractAddress , address destinationAddress, uint valueToTransfer );
    event transferSuccess( address destination , uint valueToTransfer );

    modifier onlyOwner( address requester ){

        require( owner == requester , "Access denied!" );
        _;

    }

    constructor() public {

        owner = msg.sender;

    }

    function registeringOnKycContract(address kycContract) external payable onlyOwner(msg.sender) {

        (bool success , bytes memory returnData) = kycContract.call.value(msg.value)("");
        require( success , "Register on kyc contract failed!");
        emit registerOnKycContract( kycContract , msg.value);

    }

    function accountView( address kycContract) external view onlyOwner( msg.sender ) returns( address , uint , bool , bool , uint ){

        ( bool success , bytes memory returnData ) = kycContract.staticcall( abi.encodeWithSignature("userView()") );
        require( success , "Call to kyc contract failed!" );
        return ( abi.decode( returnData , ( address , uint , bool , bool , uint) ) );

    }

    function kycView( address kycContract , address target ) external view returns(bool) {

    ( bool success , bytes memory returnData ) = kycContract.staticcall( abi.encodeWithSignature( "kycCheck(address)" , target ) );
    require( success , "Call to kyc contract failed!");
    return ( abi.decode( returnData , (bool)) );

    }

    function delegateTransfer( address kycContract , address destination) external payable onlyOwner( msg.sender ) {

        ( bool success , bytes memory returnData ) = kycContract.call( abi.encodeWithSignature( "secureTransfer(address,uint256)" , destination , msg.value) );
        require( success , "Call to kyc contract failed!");
        emit transferWithKycContract( kycContract , destination , msg.value );

    }

    function directTransfer( address kycContract , address destination ) external payable onlyOwner( msg.sender ) {

        bool kycResult = this.kycView( kycContract , destination );
        require( kycResult , "The destination not verified!" );

        uint destinationSize;

        assembly {

            destinationSize := extcodesize( destination )

        }

        if( destinationSize == 0){

            address(uint(destination)).transfer( msg.value );

        }else{

            ( bool success , bytes memory returnData ) = destination.call.value( msg.value )("");
            require( success , "Transfer failed!" );

        }

    emit transferSuccess( destination , msg.value );

    }

    function getBackValue( address kycContract , uint valueToBack ) external onlyOwner(msg.sender) {

        ( bool success , bytes memory returnData ) = kycContract.call( abi.encodeWithSignature("transferBack(uint256)",valueToBack));
        require( success , "Getting back value from kyc contract failed!");
        emit getBackValueFromKycContract( kycContract , valueToBack );

    }

    function removeFromKycContract( address kycContract ) external onlyOwner(msg.sender) {

        ( address accountAddr , uint lockedBalance , bool kycStatus , bool isContract , uint txCount ) =
            this.accountView(msg.sender);

        if( lockedBalance != 0 ){

            ( bool success , bytes memory returnData ) = kycContract.call( abi.encodeWithSignature( "transferBack()" , lockedBalance ) );
            require( success , "Call to kyc contract failed!" );

        }

        ( bool success , bytes memory returnData ) = kycContract.call( abi.encodeWithSignature( "removeAccount()" ) );
        require( success , "Call to kyc contract failed!" );
        emit removeAccountFromKycContract( kycContract );

    }

    function() external payable {}

}