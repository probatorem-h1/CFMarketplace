// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */
library Roles {
    struct Role {
        mapping(address => bool) bearer;
    }

    /**
     * @dev give an account access to this role
     */
    function add(Role storage role, address account) internal {
        require(account != address(0));
        require(!has(role, account));

        role.bearer[account] = true;
    }

    /**
     * @dev remove an account's access to this role
     */
    function remove(Role storage role, address account) internal {
        require(account != address(0));
        require(has(role, account));

        role.bearer[account] = false;
    }

    /**
     * @dev check if an account has this role
     * @return bool
     */
    function has(Role storage role, address account)
        internal
        view
        returns (bool)
    {
        require(account != address(0));
        return role.bearer[account];
    }
}

interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

contract Marketplace {
    IERC20 public FYTE;
    uint256[] internal activeListings;
    uint256[] internal closedListings;
    uint256 internal listingIndex = 1;
    mapping(uint256 => Listing) public listings;
    using Roles for Roles.Role;
    Roles.Role private _admin;

    event Listed(uint256 _listingID);
    event Purchase(address _sender, uint256 _amount);
    event Activated(uint256 _listingID);
    event Closed(uint256 _listingID);

    constructor(address _token) {
        FYTE = IERC20(_token);
        _admin.add(msg.sender);
    }

    struct Listing {
        uint256 listingType;
        uint256 listingID;
        string imageURL;
        string websiteURL;
        string discordURL;
        string twitterURL;
        string marketplaceURL;
        string name;
        string description;
        uint256 price;
        uint256 winners;
        uint256 totalEntries;
        string endDate;
        address[] addresses;
    }

    function List(
        uint256 _type,
        string calldata _image,
        string calldata _website,
        string calldata _discord,
        string calldata _twitter,
        string calldata _marketplace,
        string calldata _name,
        string calldata _description,
        uint256 _price,
        uint256 _winners,
        uint256 _totalEntries,
        string calldata _endDate
    ) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        require(_type < 3, "Invalid Type");
        listings[listingIndex] = Listing(
            _type,
            listingIndex,
            _image,
            _website,
            _discord,
            _twitter,
            _marketplace,
            _name,
            _description,
            _price,
            _winners,
            _totalEntries,
            _endDate,
            new address[](0)
        );
        activeListings.push(listingIndex);
        listingIndex += 1;
        emit Listed(listingIndex);
    }

    function Close(uint256 _listingID) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        (uint256 i, bool r) = InArray(_listingID, activeListings);
        require(r, "Invalid Listing");
        activeListings[i] = activeListings[activeListings.length - 1];
        activeListings.pop();
        closedListings.push(_listingID);
        emit Closed(_listingID);
    }

    function Activate(uint256 _listingID) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        (uint256 i, bool r) = InArray(_listingID, closedListings);
        require(r, "Invalid Listing");
        closedListings[i] = closedListings[closedListings.length - 1];
        closedListings.pop();
        activeListings.push(_listingID);
        emit Activated(_listingID);
    }

    function Delete(uint256 _listingID) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        require(listings[_listingID].listingID != 0, "Invalid Listing");
        (uint256 i, bool r) = InArray(_listingID, activeListings);
        if (r) {
            activeListings[i] = activeListings[activeListings.length - 1];
            activeListings.pop();
        } else {
            closedListings[i] = closedListings[closedListings.length - 1];
            closedListings.pop();
        }
        delete listings[_listingID];
    }

    function Buy(uint256 _listingID, uint256 _amount) public payable {
        require(_amount > 0, "Invalid Amount");
        (uint256 index, bool r) = InArray(_listingID, activeListings);
        require(r, "Invalid Listing");
        Listing storage listing = listings[_listingID];

        uint256 t = listings[_listingID].listingType;
        if (t == 0) {
            for (uint256 i; i < listing.addresses.length; i++) {
                require(listing.addresses[i] != msg.sender);
            }
        }

        require(
            FYTE.allowance(msg.sender, address(this)) >= listing.price,
            "Approve Failed"
        );
        bool success = FYTE.transferFrom(
            msg.sender,
            address(this),
            listing.price
        );
        require(success, "Transfer Failed");
        for (uint256 i; i < _amount; i++) {
            if (listing.addresses.length + 1 == listing.totalEntries) {
                activeListings[index] = activeListings[
                    activeListings.length - 1
                ];
                activeListings.pop();
                closedListings.push(_listingID);
                listing.addresses.push(msg.sender);
                break;
            }
            listing.addresses.push(msg.sender);
        }
        emit Purchase(msg.sender, _amount);
    }

    function Edit(
        uint256 _listingID,
        string calldata _image,
        string calldata _website,
        string calldata _discord,
        string calldata _twitter,
        string calldata _marketplace,
        string calldata _name,
        string calldata _description,
        uint256 _winners,
        string calldata _endDate,
        uint256 _totalEntrants
    ) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        Listing storage listing = listings[_listingID];
        require(_totalEntrants > listing.addresses.length);
        listing.imageURL = _image;
        listing.websiteURL = _website;
        listing.discordURL = _discord;
        listing.twitterURL = _twitter;
        listing.marketplaceURL = _marketplace;
        listing.name = _name;
        listing.description = _description;
        listing.winners = _winners;
        listing.endDate = _endDate;
        listing.totalEntries = _totalEntrants;
    }

    function getActiveListings() public view returns (uint256[] memory) {
        return activeListings;
    }

    function getClosedListings() public view returns (uint256[] memory) {
        return closedListings;
    }

    function getEntrants(uint256 _listingID)
        public
        view
        returns (address[] memory)
    {
        return listings[_listingID].addresses;
    }

    function InArray(uint256 _listingID, uint256[] memory arr)
        internal
        pure
        returns (uint256, bool)
    {
        for (uint256 i; i < arr.length; i++) {
            if (arr[i] == _listingID) {
                return (i, true);
            }
        }
        return (0, false);
    }

    function changeToken(address _token) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        FYTE = IERC20(_token);
    }

    function AddRole(address _address) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        _admin.add(_address);
    }

    function RemoveRole(address _address) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        _admin.remove(_address);
    }

    function withdrawToken(uint256 _amount) external {
        require(_admin.has(msg.sender), "Invalid Permissions");
        FYTE.approve(address(this), _amount);
        FYTE.transferFrom(address(this), msg.sender, _amount);
    }
}
