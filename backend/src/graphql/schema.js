const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Transaction {
    hash: String!
    from: String!
    to: String!
    value: String!
    timestamp: String!
    blockNumber: Int!
    riskScore: Int!
    patterns: [Pattern!]!
    insights: [String!]!
    aiConfidence: Float!
  }

  type Pattern {
    type: String!
    confidence: Float!
    description: String!
  }

  type WalletAnalysis {
    address: String!
    totalTransactions: Int!
    totalVolume: String!
    riskScore: Int!
    lastActivity: String!
    isHighRisk: Boolean!
    recentTransactions: [Transaction!]!
  }

  type RiskAlert {
    id: ID!
    walletAddress: String!
    alertType: String!
    severity: Int!
    description: String!
    timestamp: String!
    resolved: Boolean!
  }

  type AnalyticsSummary {
    totalTransactions: Int!
    criticalRisk: Int!
    highRisk: Int!
    mediumRisk: Int!
    lowRisk: Int!
    averageRiskScore: Float!
    lastUpdated: String!
  }

  type Query {
    # Get all transactions with optional filters
    transactions(limit: Int, offset: Int, riskLevel: String): [Transaction!]!
    
    # Get specific transaction details
    transaction(hash: String!): Transaction
    
    # Get wallet analysis
    walletAnalysis(address: String!): WalletAnalysis
    
    # Get risk alerts
    riskAlerts(severity: Int, resolved: Boolean): [RiskAlert!]!
    
    # Get analytics summary
    analyticsSummary: AnalyticsSummary!
    
    # Get live transactions (recent)
    liveTransactions(limit: Int): [Transaction!]!
  }

  type Mutation {
    # Mark risk alert as resolved
    resolveRiskAlert(id: ID!): RiskAlert
    
    # Manually trigger transaction analysis
    analyzeTransaction(hash: String!): Transaction
  }

  type Subscription {
    # Subscribe to new transactions
    newTransaction: Transaction!
    
    # Subscribe to risk alerts
    riskAlert: RiskAlert!
    
    # Subscribe to analytics updates
    analyticsUpdate: AnalyticsSummary!
  }
`;

module.exports = typeDefs;