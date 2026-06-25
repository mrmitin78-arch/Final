pragma solidity ^0.8.20;

contract HashStorage {
    struct Record {
        address storer;
        uint256 timestamp;
    }

    mapping(bytes32 => Record) private records;

    event HashStored(
        address indexed storer,
        bytes32 indexed hash,
        uint256 timestamp
    );

    function storeHash(bytes32 _hash) external {
        require(_hash != bytes32(0), "Hash cannot be zero");
        require(records[_hash].timestamp == 0, "Hash already stored");

        records[_hash] = Record({
            storer: msg.sender,
            timestamp: block.timestamp
        });

        emit HashStored(msg.sender, _hash, block.timestamp);
    }

    function isHashStored(bytes32 _hash) external view returns (bool) {
        return records[_hash].timestamp != 0;
    }

    function getHashDetails(bytes32 _hash)
        external
        view
        returns (address storer, uint256 timestamp)
    {
        Record memory record = records[_hash];
        return (record.storer, record.timestamp);
    }
}