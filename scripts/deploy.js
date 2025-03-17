const hre = require("hardhat");

async function main() {
    let DAO, dao, Token, token, Treasury, treasury, owner, addr1, addr2;
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy VotingToken contract
    Token = await ethers.getContractFactory("VotingToken");
    const initialSupply = ethers.parseEther("1000");
    token = await Token.deploy(initialSupply);
    await token.waitForDeployment();
    console.log("token.address : ", await token.getAddress());

    // Deploy DAO contract
    DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy(await token.getAddress());
    await dao.waitForDeployment();
    console.log("dao.address : ", await dao.getAddress());

    

    // Deploy Treasury contract with DAO as the deployer
    Treasury = await ethers.getContractFactory("Treasury");

    // Deploy Treasury from the DAO contract
    
    treasury = await Treasury.deploy(await dao.getAddress());
     await treasury.waitForDeployment();
     const treasuryAt = await ethers.getContractAt("Treasury", await treasury.getAddress());
     
     
    
    console.log("treasury.address : ", await treasury.getAddress());

    // Send ETH to the Treasury contract
    const tx = await treasuryAt.connect(owner).deposit({ value: ethers.parseEther("100") });
    await tx.wait();
    console.log("100 ETH deposited to Treasury contract.");
        
    }

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
