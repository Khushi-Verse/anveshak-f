// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EvidenceRegistry {
    struct EvidenceRecord {
        string evidenceId;
        string evidenceHash;
        uint256 timestamp;
        address anchoredBy;
    }

    mapping(string => EvidenceRecord) private records;

    event EvidenceAnchored(string evidenceId, string evidenceHash, uint256 timestamp, address anchoredBy);

    function anchorEvidence(string memory evidenceId, string memory evidenceHash) public {
        records[evidenceId] = EvidenceRecord({
            evidenceId: evidenceId,
            evidenceHash: evidenceHash,
            timestamp: block.timestamp,
            anchoredBy: msg.sender
        });
        emit EvidenceAnchored(evidenceId, evidenceHash, block.timestamp, msg.sender);
    }

    function getEvidence(string memory evidenceId) public view returns (string memory, string memory, uint256, address) {
        EvidenceRecord memory record = records[evidenceId];
        return (record.evidenceId, record.evidenceHash, record.timestamp, record.anchoredBy);
    }
}
