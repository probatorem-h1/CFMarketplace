const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

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

        it("Should set listingIndex to 1", async function () {
            const { marketplace, nft, owner } = await loadFixture(deployMarketplaceFixture);
            expect(await marketplace.listingIndex()).to.equal(1);
        });

        it("Should set FYTE to fyte address", async function () {
            const { marketplace, nft, owner } = await loadFixture(deployMarketplaceFixture);
            expect(await marketplace.FYTE()).to.equal(nft.address);
        });

        it("Should not have any active listings", async function () {
            const { marketplace, nft, owner } = await loadFixture(deployMarketplaceFixture);
            try {
                await marketplace.activeListings(0);
            } catch (e) {
                var err = e.message;
            }

            expect(err).to.equal('call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="activeListings(uint256)", data="0x", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.7.0)');
        })
    });

    describe("List", function () {
        it("Should only allow admin", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            const price = ethers.utils.parseEther("1.0");
            const image = "image";
            const name = "name";
            const totalEntrants = 10;
            await expect(marketplace.connect(account2).List(type, price, image, name, totalEntrants)).to.be.revertedWith("Invalid Permissions");
        });

        it("Should only allow types 0, 1, or 2", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 3;
            const price = ethers.utils.parseEther("1.0");
            const image = "image";
            const name = "name";
            const totalEntrants = 10;
            await expect(marketplace.List(type, price, image, name, totalEntrants)).to.be.revertedWith("Invalid Type");
        });


        it("Should add index to activeListings", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            const price = ethers.utils.parseEther("1.0");
            const image = "image";
            const name = "name";
            const totalEntrants = 10;
            const prevIndex = await marketplace.listingIndex();
            await marketplace.List(type, price, image, name, totalEntrants);
            expect(await marketplace.activeListings(0)).to.equal(prevIndex);
        });

        it("Should increment listingIndex", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            const price = ethers.utils.parseEther("1.0");
            const image = "image";
            const name = "name";
            const totalEntrants = 10;
            const prevIndex = await marketplace.listingIndex();
            await marketplace.List(type, price, image, name, totalEntrants);
            expect(await marketplace.listingIndex() - prevIndex).to.equal(1);
        });
    });

    describe("Close", function () {
        it("Should only allow admin", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            const price = ethers.utils.parseEther("1.0");
            const image = "image";
            const name = "name";
            const totalEntrants = 10;
            const index = await marketplace.listingIndex();
            await marketplace.List(type, price, image, name, totalEntrants);
            await expect(marketplace.connect(account2).Close(index)).to.be.revertedWith("Invalid Permissions");
        });

        it("Should only allow active listings", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            const price = ethers.utils.parseEther("1.0");
            const image = "image";
            const name = "name";
            const totalEntrants = 10;
            const index = await marketplace.listingIndex();
            await marketplace.List(type, price, image, name, totalEntrants);
            await expect(marketplace.Close(2)).to.be.revertedWith("Invalid Listing");
        });

        it("Should remove listing from active", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            const price = ethers.utils.parseEther("1.0");
            const image = "image";
            const name = "name";
            const totalEntrants = 10;
            const index = await marketplace.listingIndex();
            await marketplace.List(type, price, image, name, totalEntrants);
            await marketplace.Close(index);
            try {
                await marketplace.activeListings(0);
            } catch (e) {
                var err = e.message;
            }

            expect(err).to.equal('call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="activeListings(uint256)", data="0x", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.7.0)');
        });

        it("Should add listing to closed", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            const price = ethers.utils.parseEther("1.0");
            const image = "image";
            const name = "name";
            const totalEntrants = 10;
            const index = await marketplace.listingIndex();
            await marketplace.List(type, price, image, name, totalEntrants);
            await marketplace.Close(index);
            expect(await marketplace.closedListings(0)).to.equal(index);
        });
    });

    describe("Delete", function () {
        it("Shoud only allow owner", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            const price = ethers.utils.parseEther("1.0");
            const image = "image";
            const name = "name";
            const totalEntrants = 10;
            const index = await marketplace.listingIndex();
            await marketplace.List(type, price, image, name, totalEntrants);
            await expect(marketplace.connect(account2).Delete(index)).to.revertedWith("Invalid Permissions");
        });

        it("Should require listing", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            await expect(marketplace.Delete(1)).to.be.revertedWith("Invalid Listing");
        });

        it("Should remove listing from activeListings if active", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            const price = ethers.utils.parseEther("1.0");
            const image = "image";
            const name = "name";
            const totalEntrants = 10;
            const index = await marketplace.listingIndex();
            await marketplace.List(type, price, image, name, totalEntrants);
            await marketplace.Delete(index);
            try {
                await marketplace.activeListings(0);
            } catch (e) {
                var err = e.message;
            }

            expect(err).to.equal('call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="activeListings(uint256)", data="0x", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.7.0)');
        });

        it("Should remove listing from closedListings if closed", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            const price = ethers.utils.parseEther("1.0");
            const image = "image";
            const name = "name";
            const totalEntrants = 10;
            const index = await marketplace.listingIndex();
            await marketplace.List(type, price, image, name, totalEntrants);
            await marketplace.Close(index);
            await marketplace.Delete(index);
            try {
                await marketplace.closedListings(0);
            } catch (e) {
                var err = e.message;
            }

            expect(err).to.equal('call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="closedListings(uint256)", data="0x", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.7.0)');
        });

        describe("Buy", function () {

        });
    });

    describe("Edit", function () {
        it("Should only allow owner", async function () {
            const { marketplace, nft, owner, account2 } = await loadFixture(deployMarketplaceFixture);
            const type = 1;
            const price = ethers.utils.parseEther("1.0");
            var image = "image";
            var name = "name";
            var totalEntrants = 10;
            const index = await marketplace.listingIndex();
            await marketplace.List(type, price, image, name, totalEntrants);
            await expect(marketplace.connect(account2).Edit(index, image, name, totalEntrants)).to.be.revertedWith("Invalid Permissions");
        });
    });
});