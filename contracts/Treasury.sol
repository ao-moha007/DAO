// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Treasury {
    address public dao;
    mapping(address => uint256) private balances;

    modifier onlyDAO() {
        require(msg.sender == dao, "Only DAO can execute this");
        _;
    }

     constructor(address _dao) {
        dao = _dao;
    }

    // Function that the DAO can call
    function withdraw(address _to, uint256 _amount) external onlyDAO {
        require(balances[address(this)] >= _amount, "Insufficient funds");
        payable(_to).transfer(_amount);
    }

    // Allow deposits to the treasury
    function deposit() external payable {
        balances[address(this)] += msg.value;
    }

    function getBalance() external view returns (uint256) {
    return address(this).balance; // Returns the ETH balance of the Treasury contract
}
    //  Function to transfer DAO control to another address
    function transferDAORole(address _newDAO) external onlyDAO {
        require(_newDAO != address(0), "Invalid DAO address");
        dao = _newDAO;
    }
}
