const { expect } = require("chai");
const { ethers,deployments } = require("hardhat");

describe("VotingToken", function () {
    let VotingToken, votingToken, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const initialSupply = ethers.parseEther("1000");
        VotingToken = await ethers.getContractFactory("VotingToken");
        votingToken = await VotingToken.deploy(initialSupply);
        await votingToken.waitForDeployment();
        // Store contract deployment info
        const artifact = await deployments.getArtifact("VotingToken");
        await deployments.save("VotingToken", {
            address: await votingToken.getAddress(),
            abi: artifact.abi,
        });
    });

    it("Should have correct name and symbol", async function () {
        expect(await votingToken.name()).to.equal("VotingToken");
        expect(await votingToken.symbol()).to.equal("VTK");
    });

    it("Should assign the total supply to the owner", async function () {
        const ownerBalance = await votingToken.balanceOf(owner.address);
        expect(await votingToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should allow token transfers", async function () {
        await votingToken.transfer(addr1.address, ethers.parseEther("100"));
        expect(await votingToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should not allow transfer if sender has insufficient balance", async function () {
        await expect(
            votingToken.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))
        ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should emit Transfer event on successful transfer", async function () {
        await expect(votingToken.transfer(addr1.address, ethers.parseEther("50")))
            .to.emit(votingToken, "Transfer")
            .withArgs(owner.address, addr1.address, ethers.parseEther("50"));
    });
});
