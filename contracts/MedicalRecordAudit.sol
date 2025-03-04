// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedicalRecordAudit {
    address public admin;

    event RecordAction(
        uint recordId,
        string recordType,
        string action,
        uint timestamp
    );

    constructor() {
        admin = msg.sender; // Set the deployer as the admin
    }

    function logAction(uint recordId, string memory recordType, string memory action) public {
        require(msg.sender == admin, "Unauthorized");
        emit RecordAction(recordId, recordType, action, block.timestamp);
    }
}
