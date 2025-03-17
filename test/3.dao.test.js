const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAO Contract", function () {
    let DAO, dao, Token, token, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        Token = await ethers.getContractFactory("VotingToken");
        const initialSupply = ethers.parseEther("1000");
        token = await Token.deploy(initialSupply);
        await token.waitForDeployment();
        console.log("token.address : ",await token.getAddress());
        DAO = await ethers.getContractFactory("DAO");
        dao = await DAO.deploy(await token.getAddress());
        await dao.waitForDeployment();
        console.log("dao.address : ",await dao.getAddress());
        // Distribute tokens for testing
        await token.transfer(addr1.address, ethers.parseEther("100"));
        await token.transfer(addr2.address, ethers.parseEther("50"));
        //console.log("dao.address : ",dao.address);
        //console.log("addr1.address : ",addr1.address);
        // Store contract deployment info
        const artifact = await deployments.getArtifact("VotingToken");
        await deployments.save("VotingToken", {
            address: await token.getAddress(),
            abi: artifact.abi,
        });
        // Store contract deployment info
        const artifact1 = await deployments.getArtifact("DAO");
        await deployments.save("DAO", {
            address: await dao.getAddress(),
            abi: artifact1.abi,
        });
       
    });

    it("should allow creating a proposal", async function () {
        await token.connect(addr1).approve(dao.getAddress(), ethers.parseEther("100"));
        await expect(dao.connect(addr1).createProposal("Test Proposal", addr2.address, "0x"))
            .to.emit(dao, "ProposalCreated");
    });

    it("should allow voting on a proposal", async function () {
        await token.connect(addr1).approve(dao.getAddress(), ethers.parseEther("100"));
        await dao.connect(addr1).createProposal("Test Proposal", addr2.address, "0x");
        
        await expect(dao.connect(addr1).vote(0))
            .to.emit(dao, "Voted");
    });

    it("should not allow double voting", async function () {
        await token.connect(addr1).approve(dao.getAddress(), ethers.parseEther("100"));
        await dao.connect(addr1).createProposal("Test Proposal", addr2.address, "0x");
        await dao.connect(addr1).vote(0);
        
        await expect(dao.connect(addr1).vote(0)).to.be.revertedWith("Already voted");
    });

    it("should allow vote delegation", async function () {
        await token.connect(addr1).approve(dao.getAddress(), ethers.parseEther("100"));
        await dao.connect(addr1).delegateVote(addr2.address);
        
        expect(await dao.voteDelegation(addr1.address)).to.equal(addr2.address);
    });

    it("should execute a proposal if quorum is met", async function () {
        await token.connect(addr1).approve(dao.getAddress(), ethers.parseEther("100"));
        await dao.connect(addr1).createProposal("Test Proposal", addr2.address, "0x");
        
        await dao.connect(addr1).vote(0);
        
        ethers.provider.send("evm_increaseTime", [120]); // Fast forward time
        ethers.provider.send("evm_mine");

        await expect(dao.executeProposal(0)).to.emit(dao, "ProposalExecuted");
    });
});
