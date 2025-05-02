// SPDX-License-Identifier: MIT

pragma solidity ^0.8.29;

contract Sample{

    string public location;

    function setLoc(string memory newLoc) public {
        location = newLoc;
    }

}