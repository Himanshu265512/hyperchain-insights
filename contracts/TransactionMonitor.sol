// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TransactionMonitor is Ownable, ReentrancyGuard {
    struct TransactionData {
        address from;
        address to;
        uint256 value;
        uint256 timestamp;
        bytes32 txHash;
        uint256 riskScore;
        bool flagged;
        uint8 category;
    }

    struct WalletProfile {
        uint256 totalTransactions;
        uint256 totalVolume;
        uint256 riskScore;
        uint256 lastActivity;
        bool isHighRisk;
        uint8[] categories;
    }

    // Events for real-time monitoring
    event TransactionAnalyzed(
        bytes32 indexed txHash,
        address indexed wallet,
        uint256 riskScore,
        uint8 riskCategory,
        uint256 timestamp
    );

    event RiskAlert(
        address indexed wallet,
        uint8 alertType,
        uint256 severity,
        string description,
        uint256 timestamp
    );

    event WalletProfileUpdated(
        address indexed wallet,
        uint256 riskScore,
        uint256 totalTransactions,
        uint256 totalVolume
    );

    // Storage
    mapping(bytes32 => TransactionData) public transactions;
    mapping(address => WalletProfile) public walletProfiles;
    mapping(address => bytes32[]) public walletTransactions;
    
    // Risk thresholds
    uint256 public constant HIGH_RISK_THRESHOLD = 70;
    uint256 public constant MEDIUM_RISK_THRESHOLD = 40;
    uint256 public constant VOLUME_ANOMALY_THRESHOLD = 1000 ether;
    uint256 public constant FREQUENCY_SPIKE_THRESHOLD = 10;

    // Analysis counters
    uint256 public totalTransactionsAnalyzed;
    mapping(uint8 => uint256) public riskCategoryCounts;

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Analyze and store transaction data
     */
    function analyzeTransaction(
        address _from,
        address _to,
        uint256 _value,
        bytes32 _txHash
    ) external nonReentrant validAddress(_from) validAddress(_to) {
        require(_txHash != bytes32(0), "Invalid transaction hash");
        require(transactions[_txHash].timestamp == 0, "Transaction already analyzed");

        // Calculate risk score using multiple factors
        uint256 riskScore = calculateRiskScore(_from, _to, _value);
        uint8 category = determineRiskCategory(riskScore, _value);
        bool flagged = riskScore >= HIGH_RISK_THRESHOLD;

        // Store transaction data
        TransactionData memory txData = TransactionData({
            from: _from,
            to: _to,
            value: _value,
            timestamp: block.timestamp,
            txHash: _txHash,
            riskScore: riskScore,
            flagged: flagged,
            category: category
        });

        transactions[_txHash] = txData;
        walletTransactions[_from].push(_txHash);
        walletTransactions[_to].push(_txHash);

        // Update wallet profiles
        updateWalletProfile(_from, _value, riskScore);
        updateWalletProfile(_to, _value, riskScore);

        // Update global counters
        totalTransactionsAnalyzed++;
        riskCategoryCounts[category]++;

        // Emit events
        emit TransactionAnalyzed(_txHash, _from, riskScore, category, block.timestamp);

        // Trigger risk alerts if necessary
        if (flagged) {
            triggerRiskAlert(_from, category, riskScore);
        }
    }

    /**
     * @dev Calculate risk score based on multiple factors
     */
    function calculateRiskScore(
        address _from,
        address _to,
        uint256 _value
    ) internal view returns (uint256) {
        uint256 baseScore = 0;
        
        // Volume-based risk
        if (_value > VOLUME_ANOMALY_THRESHOLD) {
            baseScore += 30;
        }
        
        // Wallet history-based risk
        WalletProfile memory fromProfile = walletProfiles[_from];
        WalletProfile memory toProfile = walletProfiles[_to];
        
        if (fromProfile.isHighRisk) {
            baseScore += 25;
        }
        
        if (toProfile.isHighRisk) {
            baseScore += 15;
        }
        
        // New wallet risk
        if (fromProfile.totalTransactions == 0) {
            baseScore += 10;
        }
        
        // Frequency-based risk
        if (fromProfile.totalTransactions > 0) {
            uint256 timeSinceLastActivity = block.timestamp - fromProfile.lastActivity;
            if (timeSinceLastActivity < 1 minutes) {
                baseScore += 20;
            }
        }
        
        return baseScore > 100 ? 100 : baseScore;
    }

    /**
     * @dev Determine risk category based on score and value
     */
    function determineRiskCategory(uint256 _riskScore, uint256 _value) internal pure returns (uint8) {
        if (_riskScore >= 80 || _value > 5000 ether) return 1; // CRITICAL
        if (_riskScore >= 60 || _value > 1000 ether) return 2; // HIGH
        if (_riskScore >= 40 || _value > 100 ether) return 3; // MEDIUM
        return 4; // LOW
    }

    /**
     * @dev Update wallet profile with new transaction data
     */
    function updateWalletProfile(address _wallet, uint256 _value, uint256 _riskScore) internal {
        WalletProfile storage profile = walletProfiles[_wallet];
        
        profile.totalTransactions++;
        profile.totalVolume += _value;
        profile.lastActivity = block.timestamp;
        
        // Update risk score (weighted average)
        if (profile.totalTransactions == 1) {
            profile.riskScore = _riskScore;
        } else {
            profile.riskScore = (profile.riskScore * 7 + _riskScore * 3) / 10;
        }
        
        // Update high risk status
        profile.isHighRisk = profile.riskScore >= HIGH_RISK_THRESHOLD;
        
        emit WalletProfileUpdated(_wallet, profile.riskScore, profile.totalTransactions, profile.totalVolume);
    }

    /**
     * @dev Trigger risk alert for flagged transactions
     */
    function triggerRiskAlert(address _wallet, uint8 _category, uint256 _riskScore) internal {
        string memory description;
        
        if (_category == 1) {
            description = "Critical risk detected - potential security threat";
        } else if (_category == 2) {
            description = "High risk transaction - unusual activity pattern";
        } else if (_category == 3) {
            description = "Medium risk - monitor closely";
        }
        
        emit RiskAlert(_wallet, _category, _riskScore, description, block.timestamp);
    }

    /**
     * @dev Get wallet transaction history
     */
    function getWalletTransactions(address _wallet) external view returns (bytes32[] memory) {
        return walletTransactions[_wallet];
    }

    /**
     * @dev Get transaction details
     */
    function getTransactionDetails(bytes32 _txHash) external view returns (TransactionData memory) {
        return transactions[_txHash];
    }

    /**
     * @dev Get wallet profile
     */
    function getWalletProfile(address _wallet) external view returns (WalletProfile memory) {
        return walletProfiles[_wallet];
    }

    /**
     * @dev Get analytics summary
     */
    function getAnalyticsSummary() external view returns (
        uint256 totalAnalyzed,
        uint256 criticalRisk,
        uint256 highRisk,
        uint256 mediumRisk,
        uint256 lowRisk
    ) {
        return (
            totalTransactionsAnalyzed,
            riskCategoryCounts[1], // CRITICAL
            riskCategoryCounts[2], // HIGH
            riskCategoryCounts[3], // MEDIUM
            riskCategoryCounts[4]  // LOW
        );
    }
}