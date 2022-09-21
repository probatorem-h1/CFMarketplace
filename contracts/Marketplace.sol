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

library Array {
    function removeElement(uint256[] storage _array, uint256 _element) public {
        for (uint256 i; i < _array.length; i++) {
            if (_array[i] == _element) {
                _array[i] = _array[_array.length - 1];
                _array.pop();
                break;
            }
        }
    }
}

contract Marketplace {
    uint256[] public activeListings;
    uint256[] public closedListings;
    uint256 public listingIndex = 1;
    mapping(uint256 => Listing) public listings;
    using Roles for Roles.Role;
    Roles.Role private _admin;

    constructor() {
        _admin.add(msg.sender);
    }

    struct Listing {
        uint256 listingType;
        uint256 listingID;
        string imageURL;
        string name;
        uint256 price;
        uint256 totalEntrants;
        address[] addresses;
    }

    function List(
        uint256 _type,
        uint256 _price,
        string calldata _image,
        string calldata _name,
        uint256 _totalEntrants
    ) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        require(_type < 3, "Invalid Type");
        listings[listingIndex] = Listing(
            _type,
            listingIndex,
            _image,
            _name,
            _price,
            _totalEntrants,
            new address[](0)
        );
        activeListings.push(listingIndex);
        listingIndex += 1;
    }

    function Close(uint256 _listingID) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        (uint256 i, bool r) = InArray(_listingID, activeListings);
        require(r, "Invalid Listing");
        activeListings[i] = activeListings[activeListings.length - 1];
        activeListings.pop();
        closedListings.push(_listingID);
    }

    function Activate(uint256 _listingID) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        (uint256 i, bool r) = InArray(_listingID, closedListings);
        require(r, "Invalid Listing");
        closedListings[i] = closedListings[closedListings.length - 1];
        closedListings.pop();
        activeListings.push(_listingID);
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
    }

    function Buy(uint256 _listingID) public payable {
        (uint256 index, bool r) = InArray(_listingID, activeListings);
        delete index;
        require(r, "Invalid Listing");
        Listing storage listing = listings[_listingID];
        require(msg.value >= listing.price, "Insufficient Funds");
        uint256 t = listings[_listingID].listingType;
        if (t == 0) {
            for (uint256 i; i < listing.addresses.length; i++) {
                require(listing.addresses[i] != msg.sender);
            }
        }
        if (listing.addresses.length + 1 == listing.totalEntrants) {
            activeListings[index] = activeListings[activeListings.length - 1];
            activeListings.pop();
            closedListings.push(_listingID);
        }
        listing.addresses.push(msg.sender);
    }

    function Edit(
        uint256 _listingID,
        string calldata _image,
        string calldata _name,
        uint256 _totalEntrants
    ) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        Listing storage listing = listings[_listingID];
        require(_totalEntrants >= listing.addresses.length);
        listing.imageURL = _image;
        listing.name = _name;
        listing.totalEntrants = _totalEntrants;
    }

    function InArray(uint256 _listingID, uint256[] memory arr)
        public
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

    function AddRole(address _address) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        _admin.add(_address);
    }

    function RemoveRole(address _address) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        _admin.remove(_address);
    }
}
