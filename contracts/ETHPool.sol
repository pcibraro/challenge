//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ETHPool is AccessControl {
    event Deposit(address indexed _address, uint256 _value);
    event Withdraw(address indexed _address, uint256 _value);

    bytes32 public constant TEAM_MEMBER_ROLE = keccak256("TEAM_MEMBER_ROLE");

    uint256 public total;
  
    address[] public users;
      
    struct DepositValue {
        uint256 value;
        bool hasValue;
    }

    mapping(address => DepositValue) public deposits;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(TEAM_MEMBER_ROLE, msg.sender);
    }

    receive() external payable {
                
        if(!deposits[msg.sender].hasValue) // only pushes new users
            users.push(msg.sender);

        deposits[msg.sender].value += msg.value;
        deposits[msg.sender].hasValue = true;

        total += msg.value;

        emit Deposit(msg.sender, msg.value);
    }
    
    function depositRewards() public payable onlyRole(TEAM_MEMBER_ROLE) {
        require(total > 0); // No rewards to distribute if the pool is empty.

        for (uint i = 0; i < users.length; i++){
            
           address user = users[i];

           uint rewards = ((deposits[user].value * msg.value) / total);

           deposits[user].value += rewards;
        }
    }

    function withdraw() public {
        uint256 deposit = deposits[msg.sender].value;
        
        require(deposit > 0, "You don't have anything left to withdraw");

        deposits[msg.sender].value = 0;

        (bool success, ) = msg.sender.call{value:deposit}("");
  
        require(success, "Transfer failed");

        emit Withdraw(msg.sender, deposit);
    }

    function addTeamMember(address account) public {
        grantRole(TEAM_MEMBER_ROLE, account);
    }

    function removeTeamMember(address account) public {
        revokeRole(TEAM_MEMBER_ROLE, account);
    }
}
