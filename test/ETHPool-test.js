const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ETHPool", function () {
  let owner, addr1, addr2, addr3, addr4, addr5;
  let ETHPool;
    
  beforeEach(async function() {
      [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();

      ETHPool = await ethers.getContractFactory("ETHPool");
      ethpool = await ETHPool.deploy();
      
      await ethpool.deployed();
  });

  it("Should allow deposits", async function () {
    const oneEther = ethers.BigNumber.from("1000000000000000000");

    let tx = {
      to: ethpool.address,
      value: oneEther
    };
  
    await owner.sendTransaction(tx);
    
    expect(await ethpool.total()).to.be.equal(oneEther);
  });

  it("Should allow deposits from multiple users", async function () {
    const oneEther = ethers.BigNumber.from("1000000000000000000");

    let tx = {
      to: ethpool.address,
      value: oneEther
    };
  
    await owner.sendTransaction(tx);

    await addr1.sendTransaction(tx);
    
    expect(await ethpool.total()).to.be.equal(oneEther.mul(2));
  });

  it("Should allow multiple deposits from single user", async function () {
    const oneEther = ethers.BigNumber.from("1000000000000000000");

    let tx = {
      to: ethpool.address,
      value: oneEther
    };
  
    await owner.sendTransaction(tx);
    await owner.sendTransaction(tx);
    
    expect(await ethpool.total()).to.be.equal(oneEther.mul(2));
  });
  
  it("Should withdraw same amount when rewards were not distributed", async function () {
    const balance = await owner.getBalance();
    const oneEther = ethers.BigNumber.from("1000000000000000000");

    const tx = {
      to: ethpool.address,
      value: oneEther
    };

    await owner.sendTransaction(tx);
    
    await ethpool.connect(owner).withdraw();
    
    const newBalance = await owner.getBalance();

    expect(newBalance).to.be.within(balance.sub(oneEther), balance); // gas costs deducted from original balance
  });

  it("Should not distribute rewards if pool is empty", async function () {
    const oneEther = ethers.BigNumber.from("1000000000000000000");

    await expect(ethpool.connect(owner).depositRewards({ value : oneEther })).to.be.reverted;
  });
  

  it("Should allow depositing rewards from team member", async function () {
    const balance1 = await addr1.getBalance();
    const balance2 = await addr2.getBalance();

    const oneHundredEth = ethers.BigNumber.from("100000000000000000000");
    const twoHundredEth = ethers.BigNumber.from("200000000000000000000");
    const threeHundredEth = ethers.BigNumber.from("300000000000000000000");

    const fiftyEth = ethers.BigNumber.from("50000000000000000000");
    const oneHundredAndfiftyEth = ethers.BigNumber.from("150000000000000000000");
    
    let tx1 = {
      to: ethpool.address,
      value: oneHundredEth
    };
  
    let tx2 = {
      to: ethpool.address,
      value: threeHundredEth
    };
  
    await addr1.sendTransaction(tx1);
    await addr2.sendTransaction(tx2);

    await ethpool.connect(owner).depositRewards({ value : twoHundredEth });

    await ethpool.connect(addr1).withdraw();
    await ethpool.connect(addr2).withdraw();

    const newBalance1 = await addr1.getBalance();
    const newBalance2 = await addr2.getBalance();
    
    expect(newBalance1).to.be.within(balance1, balance1.add(fiftyEth)); // Original Balance + 50 ethers
    expect(newBalance2).to.be.within(balance2, balance2.add(oneHundredAndfiftyEth)); // Original Balance + 150 ethers
  });

  it("Should only distribute rewards for users in pool", async function () {
    const balance1 = await addr1.getBalance();
    const balance2 = await addr2.getBalance();

    const oneEther = ethers.BigNumber.from("1000000000000000000");
    const oneHundredEth = ethers.BigNumber.from("100000000000000000000");
    const twoHundredEth = ethers.BigNumber.from("200000000000000000000");
    const threeHundredEth = ethers.BigNumber.from("300000000000000000000");

    const fiftyEth = ethers.BigNumber.from("50000000000000000000");
    const oneHundredAndfiftyEth = ethers.BigNumber.from("150000000000000000000");
    
    let tx1 = {
      to: ethpool.address,
      value: oneHundredEth
    };
  
    let tx2 = {
      to: ethpool.address,
      value: threeHundredEth
    };
  
    await addr1.sendTransaction(tx1);
    await addr2.sendTransaction(tx2);

    await ethpool.connect(addr1).withdraw();

    // it should only send rewards to addr2
    await ethpool.connect(owner).depositRewards({ value : twoHundredEth });
    
    await ethpool.connect(addr2).withdraw();

    const newBalance1 = await addr1.getBalance();
    const newBalance2 = await addr2.getBalance();
    
    expect(newBalance1).to.be.within(balance1.sub(oneEther), balance1); // Original Balance - gas
    expect(newBalance2).to.be.within(balance2, balance2.add(twoHundredEth)); // Original Balance + 200 ethers
  });

  it("Should distribute rewards to single user in pool", async function () {
    const balance1 = await addr1.getBalance();

    const oneHundredEth = ethers.BigNumber.from("100000000000000000000");
    const twoHundredEth = ethers.BigNumber.from("200000000000000000000");
    const threeHundredEth = ethers.BigNumber.from("300000000000000000000");
    
    let tx1 = {
      to: ethpool.address,
      value: oneHundredEth
    };
  
    let tx2 = {
      to: ethpool.address,
      value: threeHundredEth
    };
  
    await addr1.sendTransaction(tx1);
    await addr1.sendTransaction(tx2);

    await ethpool.connect(owner).depositRewards({ value : twoHundredEth });
    
    await ethpool.connect(addr1).withdraw();

    const newBalance1 = await addr1.getBalance();
    
    expect(newBalance1).to.be.within(balance1, balance1.add(twoHundredEth)); // Original Balance + 200 ethers
  });

  it("Should add and remove team member", async function () {
    
    const txAdd = await (await ethpool.addTeamMember(addr1.address)).wait();
    const txRemove = await (await ethpool.removeTeamMember(addr1.address)).wait();
    
    expect(txAdd.events?.filter((x) => {return x.event == "RoleGranted"})).to.not.be.null;
    expect(txRemove.events?.filter((x) => {return x.event == "RoleRevoked"})).to.not.be.null;
  });

});
