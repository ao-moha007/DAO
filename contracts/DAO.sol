// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DAO {
    IERC20 public votingToken;

    struct Proposal {
        uint256 id;
        address creator;
        string description;
        uint256 voteCount;
        uint256 voteEndTime;
        bool executed;
        address targetContract;
        bytes callData;
        mapping(address => bool) voted;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => address) public voteDelegation; // Delegated votes

    uint256 public quorum = 10 * 10**18; // 10 tokens minimum
    uint256 public votingPeriod = 2 minutes;

    event ProposalCreated(
        uint256 proposalId,
        address creator,
        string description
    );
    event Voted(address voter, uint256 proposalId);
    event VoteDelegated(address delegator, address delegatee);
    event ProposalExecuted(uint256 proposalId);
    event ExecutionFailure(uint256 proposalId, string errorMessage);
    constructor(IERC20 _votingToken) {
        votingToken = _votingToken;
    }

    modifier onlyTokenHolders() {
        require(votingToken.balanceOf(msg.sender) > 0, "Not a token holder");
        _;
    }

    // **1. Create Proposal**
    function createProposal(
        string memory _description,
        address _targetContract,
        bytes memory _callData
    ) external onlyTokenHolders {
        uint256 proposalId = proposalCount++;
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.creator = msg.sender;
        newProposal.description = _description;
        newProposal.voteEndTime = block.timestamp + votingPeriod;
        newProposal.targetContract = _targetContract;
        newProposal.callData = _callData;

        emit ProposalCreated(proposalId, msg.sender, _description);
    }

    // **2. Delegate Vote**
    function delegateVote(address _delegatee) external onlyTokenHolders {
        require(_delegatee != msg.sender, "Cannot delegate to self");
        voteDelegation[msg.sender] = _delegatee;
        emit VoteDelegated(msg.sender, _delegatee);
    }

    // **3. Vote on Proposal**
    function vote(uint256 _proposalId) external onlyTokenHolders {
        Proposal storage proposal = proposals[_proposalId];

        require(block.timestamp < proposal.voteEndTime, "Voting period ended");
        require(!proposal.voted[msg.sender], "Already voted");

        // Get voting power (includes delegated votes)
        uint256 voterTokens = votingToken.balanceOf(msg.sender);
        address delegatee = voteDelegation[msg.sender];
        if (delegatee != address(0)) {
            voterTokens += votingToken.balanceOf(delegatee);
        }

        require(voterTokens > 0, "No voting power");

        proposal.voteCount += voterTokens;
        proposal.voted[msg.sender] = true;

        emit Voted(msg.sender, _proposalId);
    }

    // **4. Execute Proposal**
    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];

        // Check if the voting period has ended
        require(
            block.timestamp >= proposal.voteEndTime,
            "Voting period not ended"
        );
        require(!proposal.executed, "Already executed");

        // Check if quorum is met
        require(proposal.voteCount >= quorum, "Not enough votes");

        proposal.executed = true;

        // Emit event for debugging
        emit ProposalExecuted(_proposalId);

        // Attempt to execute the proposal
        (bool success, bytes memory returndata) = proposal.targetContract.call(
            proposal.callData
        );
        if (!success) {
            // If the call failed, revert with the error message
            string memory errorMessage = _getRevertReason(returndata);
            emit ExecutionFailure(_proposalId, errorMessage);
            revert(errorMessage);
        }
    }

    function _getRevertReason(bytes memory returndata)
        internal
        pure
        returns (string memory)
    {
        if (returndata.length < 68) return "Transaction reverted silently";
        assembly {
            returndata := add(returndata, 0x04)
        }
        return abi.decode(returndata, (string));
    }

    
}
