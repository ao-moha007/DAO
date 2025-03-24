# DAO Smart Contract

# Overview
This Decentralized Autonomous Organization (DAO) contract enables token holders to create proposals, vote on governance decisions, and execute approved proposals on a target contract. It utilizes ERC-20 tokens for voting power and allows vote delegation.

# Features
# Governance & Voting
Proposal Creation: Token holders can propose changes or actions for the DAO.

Voting System: Members vote using ERC-20 tokens, with delegated voting support.

Quorum Requirement: A proposal needs at least 10 tokens to be valid.

Execution Mechanism: Proposals that pass voting are executed via smart contract calls.

# Security & Fair Voting
Delegated Voting: Users can delegate their votes to another member.

Vote Tracking: Prevents double voting per proposal.

Execution Failure Handling: Captures and logs transaction errors for debugging.
