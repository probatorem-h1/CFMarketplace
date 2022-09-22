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
            expect(await marketplace.activeListings()).to.be.empty;
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
});