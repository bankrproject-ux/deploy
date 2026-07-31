// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TyconToken {
    string public constant name = "Tycoon";
    string public constant symbol = "TYCON";

    uint8 public constant decimals = 18;

    uint256 public totalSupply;

    address public owner;
    address public minter;

    mapping(address => uint256) public balanceOf;

    mapping(address => mapping(address => uint256))
        public allowance;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 value
    );

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    event MinterChanged(
        address indexed previousMinter,
        address indexed newMinter
    );

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "TYCON: not owner"
        );

        _;
    }

    modifier onlyMinter() {
        require(
            msg.sender == minter,
            "TYCON: not minter"
        );

        _;
    }

    constructor() {
        owner = msg.sender;
        minter = msg.sender;

        emit OwnershipTransferred(
            address(0),
            msg.sender
        );

        emit MinterChanged(
            address(0),
            msg.sender
        );
    }

    function transfer(
        address to,
        uint256 amount
    )
        external
        returns (bool)
    {
        _transfer(
            msg.sender,
            to,
            amount
        );

        return true;
    }

    function approve(
        address spender,
        uint256 amount
    )
        external
        returns (bool)
    {
        require(
            spender != address(0),
            "TYCON: zero spender"
        );

        allowance[msg.sender][spender] =
            amount;

        emit Approval(
            msg.sender,
            spender,
            amount
        );

        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    )
        external
        returns (bool)
    {
        uint256 currentAllowance =
            allowance[from][msg.sender];

        require(
            currentAllowance >= amount,
            "TYCON: insufficient allowance"
        );

        if (
            currentAllowance !=
            type(uint256).max
        ) {
            unchecked {
                allowance[from][msg.sender] =
                    currentAllowance -
                    amount;
            }

            emit Approval(
                from,
                msg.sender,
                allowance[from][msg.sender]
            );
        }

        _transfer(
            from,
            to,
            amount
        );

        return true;
    }

    function mint(
        address to,
        uint256 amount
    )
        external
        onlyMinter
    {
        require(
            to != address(0),
            "TYCON: zero recipient"
        );

        require(
            amount > 0,
            "TYCON: zero amount"
        );

        totalSupply += amount;

        balanceOf[to] += amount;

        emit Transfer(
            address(0),
            to,
            amount
        );
    }

    function burn(
        uint256 amount
    )
        external
    {
        uint256 balance =
            balanceOf[msg.sender];

        require(
            balance >= amount,
            "TYCON: insufficient balance"
        );

        unchecked {
            balanceOf[msg.sender] =
                balance -
                amount;
        }

        totalSupply -= amount;

        emit Transfer(
            msg.sender,
            address(0),
            amount
        );
    }

    function setMinter(
        address newMinter
    )
        external
        onlyOwner
    {
        require(
            newMinter != address(0),
            "TYCON: zero minter"
        );

        address previousMinter =
            minter;

        minter = newMinter;

        emit MinterChanged(
            previousMinter,
            newMinter
        );
    }

    function transferOwnership(
        address newOwner
    )
        external
        onlyOwner
    {
        require(
            newOwner != address(0),
            "TYCON: zero owner"
        );

        address previousOwner =
            owner;

        owner = newOwner;

        emit OwnershipTransferred(
            previousOwner,
            newOwner
        );
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    )
        internal
    {
        require(
            to != address(0),
            "TYCON: zero recipient"
        );

        uint256 balance =
            balanceOf[from];

        require(
            balance >= amount,
            "TYCON: insufficient balance"
        );

        unchecked {
            balanceOf[from] =
                balance -
                amount;
        }

        balanceOf[to] += amount;

        emit Transfer(
            from,
            to,
            amount
        );
    }
}
