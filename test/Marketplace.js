const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai");

var strings = ['imageURL', 'websiteURL', 'discordURL', 'twitterURL', 'marketplaceURL', 'name', 'desciprtion', 'enddate']
var ints = [10, 1, 10]

describe('Marketplace', function () {

    async function deployMarketplaceFixture() {
        const [owner, account2] = await ethers.getSigners();
        const Marketplace = await ethers.getContractFactory("Marketplace");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const marketplace = await Marketplace.deploy(nft.address);

        return { marketplace, nft, owner, account2 }
    };

    describe("Deployment", function () {

        it("Should set FYTE to fyte address", async function () {
            const { marketplace, nft, owner } = await loadFixture(deployMarketplaceFixture);
            expect(await marketplace.FYTE()).to.equal(nft.address);
        });

        it("Should not have any active listings", async function () {
            const { marketplace, nft, owner } = await loadFixture(deployMarketplaceFixture);
            expect(await marketplace.getActiveListings()).to.be.empty;
        });
    });

    describe("List", function () {
        it("Should only allow admin", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await expect(marketplace.connect(account2).List(type, strings, ints)).to.be.revertedWith("Invalid Permissions");
        });

        it("Should allow type 0", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 0;
            await marketplace.List(type, strings, ints);
            expect((await marketplace.getActiveListings())[0]).to.equal(ethers.BigNumber.from(1));
        });

        it("Should allow type 1", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            expect((await marketplace.getActiveListings())[0]).to.equal(ethers.BigNumber.from(1))
        });

        it("Should allow type 2", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 2;
            await marketplace.List(type, strings, ints);
            expect((await marketplace.getActiveListings())[0]).to.equal(ethers.BigNumber.from(1))
        });

        it("Should only allow types 0, 1, or 2", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 3;
            await expect(marketplace.List(type, strings, ints)).to.be.revertedWith("Invalid Type");
        });


        it("Should add index to activeListings", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            expect((await marketplace.getActiveListings())[0]).to.equal(ethers.BigNumber.from(1));
        });

        it("Should increment listingIndex", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            await marketplace.List(type, strings, ints);
            expect((await marketplace.getActiveListings())[1].toNumber() - (await marketplace.getActiveListings())[0].toNumber()).to.equal(1);
        });

        it("Should emit Listed event with correct args", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await expect( marketplace.List(type, strings, ints)).to.emit(marketplace, "Listed").withArgs(ethers.BigNumber.from(1));

        });
    });

    describe("Close", function () {
        it("Should only allow admin", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings())
            let index = activeListings[activeListings.length - 1]
            await expect(marketplace.connect(account2).Close(index)).to.be.revertedWith("Invalid Permissions");
        });

        it("Should only allow active listings", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            await expect(marketplace.Close(2)).to.be.revertedWith("Invalid Listing");
        });

        it("Should remove listing from active", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings())
            let index = activeListings[activeListings.length - 1]
            await marketplace.Close(index);
            expect(await marketplace.getActiveListings()).to.not.include(index)
       });

        it("Should add listing to closed", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let index = activeListings[activeListings.length - 1]
            await marketplace.Close(index.toNumber());
            expect(await marketplace.getClosedListings()).to.deep.include(index);
        });

        it("Should emit Closed event with correct args", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let index = activeListings[activeListings.length - 1]
            await expect(marketplace.Close(index.toNumber())).to.emit(marketplace, "Closed").withArgs(ethers.BigNumber.from(1));

        });
    });

    describe("Delete", function () {
        it("Shoud only allow owner", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let index = activeListings[activeListings.length - 1]
            await expect(marketplace.connect(account2).Delete(index)).to.revertedWith("Invalid Permissions");
        });

        it("Should require listing", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            await expect(marketplace.Delete(1)).to.be.revertedWith("Invalid Listing");
        });

        it("Should remove listing from activeListings if active", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let index = activeListings[activeListings.length - 1];
            await marketplace.Delete(index);
            expect(await marketplace.getActiveListings()).to.be.empty;
        });

        it("Should remove listing from closedListings if closed", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let index = activeListings[activeListings.length - 1];
            await marketplace.Close(index)
            await marketplace.Delete(index);
            expect(await marketplace.getClosedListings()).to.be.empty;
        });

        it("Should delete from listings", async function() {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let index = activeListings[activeListings.length - 1];
            await marketplace.Delete(index);
            expect((await marketplace.listings(0)).listingID).to.equal(0);
        })
    });
    
    describe("Buy", function () {
        it("Should only allow active listings", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let index = activeListings[activeListings.length - 1];
            await expect(marketplace.connect(account2).Buy(2, 1)).to.be.revertedWith("Invalid Listing");
        });

        it("Should only require amound greater than 0", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let index = activeListings[activeListings.length - 1];
            await expect(marketplace.connect(account2).Buy(index, 0)).to.be.revertedWith("Invalid Amount");
        });

        it("Should revert if token count is below listing price", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let index = activeListings[activeListings.length - 1];
            await expect(marketplace.connect(account2).Buy(index, 1)).to.be.revertedWith("Approve Failed");
        });

        it("Should transfer one token", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let id = activeListings[activeListings.length - 1];
            await nft.connect(account2).Claim(10);
            await nft.connect(account2).approve(marketplace.address, 10);
            let amount = 1
            await expect(marketplace.connect(account2).Buy(id, amount)).to.changeTokenBalances(nft, [account2, marketplace], [-10, 10]);
        });

        it("Should transfer multiple tokens", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let id = activeListings[activeListings.length - 1];
            await nft.connect(account2).Claim(20);
            await nft.connect(account2).approve(marketplace.address, 20);
            let amount = 2;
            await expect(marketplace.connect(account2).Buy(id, amount)).to.changeTokenBalances(nft, [account2, marketplace], [-20, 20]);    
        });

        it("Should revert if token 0 already purchased", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 0;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let id = activeListings[activeListings.length - 1];
            await nft.connect(account2).Claim(20);
            await nft.connect(account2).approve(marketplace.address, 20);
            let amount = 1
            await marketplace.connect(account2).Buy(id, amount);
            await expect(marketplace.connect(account2).Buy(id, amount)).to.be.reverted;
        });

        it("Should revert if more than 1 of token 0 purchased", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 0;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let id = activeListings[activeListings.length - 1];
            await nft.connect(account2).Claim(20);
            await nft.connect(account2).approve(marketplace.address, 20);
            let amount = 2
            await expect(marketplace.connect(account2).Buy(id, amount)).to.be.reverted;
        });

        it("Should close listing if entrants at max", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, [10, 1, 1]);
            let activeListings = (await marketplace.getActiveListings());
            let id = activeListings[activeListings.length - 1];
            await nft.connect(account2).Claim(10);
            await nft.connect(account2).approve(marketplace.address, 10);
            let amount = 1
            await marketplace.connect(account2).Buy(id, amount)
            expect(await marketplace.getClosedListings()).to.deep.include(id);
        });

        it("Should revert if token closed", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let id = activeListings[activeListings.length - 1];
            await marketplace.Close(id);
            await nft.connect(account2).Claim(10);
            await nft.connect(account2).approve(marketplace.address, 10);
            let amount = 1
            await expect(marketplace.connect(account2).Buy(id, amount)).to.be.reverted;
        });

        it("Should revert if amount greater than total entries remainng", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let id = activeListings[activeListings.length - 1];
            await marketplace.Close(id);
            await nft.connect(account2).Claim(110);
            await nft.connect(account2).approve(marketplace.address, 110);
            let amount = 11
            await expect(marketplace.connect(account2).Buy(id, amount)).to.be.reverted;
        });

        it("Should close if user buys all remaining", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let id = activeListings[activeListings.length - 1];
            await marketplace.Close(id);
            await nft.connect(account2).Claim(10);
            await nft.connect(account2).approve(marketplace.address, 10);
            let amount = 11
            expect(await marketplace.getClosedListings()).to.deep.include(id);
        });

        it("Should emit Purchase event with correct args", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let id = activeListings[activeListings.length - 1];
            await nft.Claim(20);
            await nft.approve(marketplace.address, 20);
            let amount = 2;
            await (expect(marketplace.Buy(id, amount))).to.emit(marketplace,'Purchase').withArgs(owner.address, amount);
        });
    });

    describe("Edit", function () {
        it("Should only allow owner", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            let type = 1
            await marketplace.List(type, strings, ints);
            let index = 1
            await expect(marketplace.connect(account2).Edit(index, strings, ints)).to.be.revertedWith("Invalid Permissions");
        });

        it("Should only allow totalEntrants to be greater than current entrants", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            let type = 1
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let id = activeListings[activeListings.length - 1];
            await nft.connect(account2).Claim(20);
            await nft.connect(account2).approve(marketplace.address, 20);
            let amount = 2
            await marketplace.connect(account2).Buy(id, amount);
            await expect(marketplace.Edit(type, strings, [10, 1, 1])).to.be.revertedWith("Invalid Total Entrants")
        });
    });

    describe("changeToken", function () {
        it("Should only allow owner", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            await expect(marketplace.connect(account2).changeToken(nft.address)).to.be.revertedWith("Invalid Permissions");
        });
    });

    describe("AddRole", function () {
        it("Should only allow owner", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            await expect(marketplace.connect(account2).AddRole(account2.address)).to.be.revertedWith("Invalid Permissions");
        });

        it("Should add role", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            await marketplace.AddRole(account2.address)
            await expect(marketplace.connect(account2).AddRole(account2.address));
        });
    });

    describe("RemoveRole", function () {
        it("Should only allow owner", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            await expect(marketplace.connect(account2).RemoveRole(owner.address)).to.be.revertedWith("Invalid Permissions");
        });

        it("Should remove role", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            await marketplace.AddRole(account2.address);
            await marketplace.RemoveRole(account2.address);
            await expect(marketplace.connect(account2).RemoveRole(owner.address)).to.be.revertedWith("Invalid Permissions");
        })
    });

    describe("WithdrawToken", function () {
        it("Should only allow owner", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            await expect(marketplace.connect(account2).withdrawToken(1)).to.be.revertedWith("Invalid Permissions");
        });

        it("Should transfer the correct amount", async function (){
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            await marketplace.List(type, strings, ints);
            let activeListings = (await marketplace.getActiveListings());
            let id = activeListings[activeListings.length - 1];
            await nft.connect(account2).Claim(10);
            await nft.connect(account2).approve(marketplace.address, 10);
            await marketplace.connect(account2).Buy(id, 1);
            await expect(marketplace.withdrawToken(10)).to.changeTokenBalances(nft, [marketplace, owner], [-10, 10]);
        });

        it("Should revert if amount greater than marketplace balance", async function (){
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            await expect(marketplace.withdrawToken(10)).to.be.revertedWith("Invalid Amount")
        });
    });
});