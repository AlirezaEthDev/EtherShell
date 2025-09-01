// SPDX-License-Identifier: MIT

pragma solidity ^0.8.29;

contract A{

    string public location;

    function setLoc(string memory newLoc) public {
        location = newLoc;
    }

}

contract B{
    function plus(uint a, uint b) external pure returns(uint c){
        c = a + b;
    }
}

contract C{
    function getState() external pure returns (bool fullstate){
        fullstate = true;
    }
}