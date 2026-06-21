// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SupplyChainTracker {
    address public owner;

    enum Status {
        Created,
        Shipped,
        Received,
        Sold
    }

    struct Product {
        uint256 id;
        string name;
        string origin;
        bytes32 productHash;
        Status status;
        address currentHandler;
        uint256 createdAt;
        bool exists;
    }

    struct HistoryRecord {
        Status status;
        string location;
        address updatedBy;
        uint256 timestamp;
    }

    uint256 public productCount;

    mapping(uint256 => Product) private products;
    mapping(uint256 => HistoryRecord[]) private productHistories;
    mapping(address => bool) public authorizedParticipants;

    event ParticipantAuthorized(address participant);

    event ProductCreated(
        uint256 indexed productId,
        string name,
        string origin,
        bytes32 productHash,
        address createdBy
    );

    event ProductStatusUpdated(
        uint256 indexed productId,
        Status status,
        string location,
        address updatedBy
    );

    constructor() {
        owner = msg.sender;
        authorizedParticipants[msg.sender] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedParticipants[msg.sender],
            "Only authorized participant can perform this action"
        );
        _;
    }

    function authorizeParticipant(address participant) public onlyOwner {
        authorizedParticipants[participant] = true;
        emit ParticipantAuthorized(participant);
    }

    function createProduct(
        string memory name,
        string memory origin,
        bytes32 productHash
    ) public onlyAuthorized returns (uint256) {
        productCount++;

        products[productCount] = Product({
            id: productCount,
            name: name,
            origin: origin,
            productHash: productHash,
            status: Status.Created,
            currentHandler: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        productHistories[productCount].push(
            HistoryRecord({
                status: Status.Created,
                location: origin,
                updatedBy: msg.sender,
                timestamp: block.timestamp
            })
        );

        emit ProductCreated(
            productCount,
            name,
            origin,
            productHash,
            msg.sender
        );

        return productCount;
    }

    function updateStatus(
        uint256 productId,
        Status newStatus,
        string memory location
    ) public onlyAuthorized {
        require(products[productId].exists, "Product does not exist");
        require(
            uint256(newStatus) > uint256(products[productId].status),
            "New status must move forward"
        );

        products[productId].status = newStatus;
        products[productId].currentHandler = msg.sender;

        productHistories[productId].push(
            HistoryRecord({
                status: newStatus,
                location: location,
                updatedBy: msg.sender,
                timestamp: block.timestamp
            })
        );

        emit ProductStatusUpdated(
            productId,
            newStatus,
            location,
            msg.sender
        );
    }

    function verifyProduct(
        uint256 productId,
        bytes32 productHash
    ) public view returns (bool) {
        return products[productId].exists &&
               products[productId].productHash == productHash;
    }

    function getProduct(
        uint256 productId
    )
        public
        view
        returns (
            uint256 id,
            string memory name,
            string memory origin,
            bytes32 productHash,
            Status status,
            address currentHandler,
            uint256 createdAt
        )
    {
        require(products[productId].exists, "Product does not exist");

        Product memory product = products[productId];

        return (
            product.id,
            product.name,
            product.origin,
            product.productHash,
            product.status,
            product.currentHandler,
            product.createdAt
        );
    }

    function getHistoryCount(uint256 productId) public view returns (uint256) {
        require(products[productId].exists, "Product does not exist");
        return productHistories[productId].length;
    }

    function getHistoryRecord(
        uint256 productId,
        uint256 index
    )
        public
        view
        returns (
            Status status,
            string memory location,
            address updatedBy,
            uint256 timestamp
        )
    {
        require(products[productId].exists, "Product does not exist");
        require(index < productHistories[productId].length, "Invalid history index");

        HistoryRecord memory record = productHistories[productId][index];

        return (
            record.status,
            record.location,
            record.updatedBy,
            record.timestamp
        );
    }
}
