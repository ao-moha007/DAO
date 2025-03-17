const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Treasury Contract", function () {
    let Treasury, treasury, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        Treasury = await ethers.getContractFactory("Treasury");
        treasury = await Treasury.deploy(owner.address);
        await treasury.waitForDeployment();
        // Store contract deployment info
        const artifact = await deployments.getArtifact("Treasury");
        await deployments.save("Treasury", {
            address: await treasury.getAddress(),
            abi: artifact.abi,
        });
    });

    it("Should set the deployer as the DAO", async function () {
        expect(await treasury.dao()).to.equal(owner.address);
    });

    it("Should allow deposits", async function () {
        const depositAmount = ethers.parseEther("1.0");
        await treasury.connect(addr1).deposit({ value: depositAmount });
        expect(await treasury.getBalance()).to.equal(depositAmount);
    });

    it("Should not allow non-DAO to withdraw", async function () {
        await expect(
            treasury.connect(addr1).withdraw(addr1.address, ethers.parseEther("0.5"))
        ).to.be.revertedWith("Only DAO can execute this");
    });

    it("Should allow DAO to withdraw funds", async function () {
        const depositAmount = ethers.parseEther("2.0");
        await treasury.connect(addr1).deposit({ value: depositAmount });
        
        await expect(() => treasury.withdraw(addr2.address, ethers.parseEther("1.0")))
            .to.changeEtherBalances([addr2], [ethers.parseEther("1.0")] );
    });

    it("Should transfer DAO role", async function () {
        await treasury.transferDAORole(addr1.address);
        expect(await treasury.dao()).to.equal(addr1.address);
    });

    it("Should not allow non-DAO to transfer DAO role", async function () {
        await expect(
            treasury.connect(addr1).transferDAORole(addr2.address)
        ).to.be.revertedWith("Only DAO can execute this");
    });
});
