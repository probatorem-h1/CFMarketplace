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

contract Marketplace {
    uint256[] public activeListings;
    uint256[] public closedListings;
    uint256 public listingIndex;
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
        uint8 status;
    }

    function List(
        uint256 _type,
        uint256 _price,
        string calldata _image,
        uint256 _totalEntrants,
        string calldata _name
    ) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
    }

    function addRole(address _address) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        _admin.add(_address);
    }

    function removeRole(address _address) public {
        require(_admin.has(msg.sender), "Invalid Permissions");
        _admin.remove(_address);
    }
}
