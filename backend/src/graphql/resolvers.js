const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

// Mock data storage (in production, this would be a database)
let transactions = [];
let walletData = {};
let riskAlerts = [];
let analytics = {
  totalTransactions: 0,
  criticalRisk: 0,
  highRisk: 0,
  mediumRisk: 0,
  lowRisk: 0,
  averageRiskScore: 0,
  lastUpdated: new Date().toISOString()
};

const resolvers = {
  Query: {
    transactions: (parent, args) => {
      const { limit = 50, offset = 0, riskLevel } = args;
      
      let filteredTransactions = transactions;
      
      if (riskLevel) {
        filteredTransactions = transactions.filter(tx => {
          if (riskLevel === 'HIGH' && tx.riskScore >= 70) return true;
          if (riskLevel === 'MEDIUM' && tx.riskScore >= 40 && tx.riskScore < 70) return true;
          if (riskLevel === 'LOW' && tx.riskScore < 40) return true;
          return false;
        });
      }
      
      return filteredTransactions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(offset, offset + limit);
    },

    transaction: (parent, args) => {
      return transactions.find(tx => tx.hash === args.hash);
    },

    walletAnalysis: (parent, args) => {
      const address = args.address;
      const walletTxs = transactions.filter(tx => tx.from === address || tx.to === address);
      
      if (walletTxs.length === 0) {
        return {
          address,
          totalTransactions: 0,
          totalVolume: '0',
          riskScore: 0,
          lastActivity: new Date().toISOString(),
          isHighRisk: false,
          recentTransactions: []
        };
      }

      const totalVolume = walletTxs.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
      const avgRiskScore = walletTxs.reduce((sum, tx) => sum + tx.riskScore, 0) / walletTxs.length;
      
      return {
        address,
        totalTransactions: walletTxs.length,
        totalVolume: totalVolume.toString(),
        riskScore: Math.round(avgRiskScore),
        lastActivity: walletTxs[0].timestamp,
        isHighRisk: avgRiskScore >= 70,
        recentTransactions: walletTxs.slice(0, 10)
      };
    },

    riskAlerts: (parent, args) => {
      const { severity, resolved } = args;
      
      return riskAlerts.filter(alert => {
        if (severity !== undefined && alert.severity !== severity) return false;
        if (resolved !== undefined && alert.resolved !== resolved) return false;
        return true;
      });
    },

    analyticsSummary: () => analytics,

    liveTransactions: (parent, args) => {
      const { limit = 10 } = args;
      return transactions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    }
  },

  Mutation: {
    resolveRiskAlert: (parent, args) => {
      const alert = riskAlerts.find(a => a.id === args.id);
      if (alert) {
        alert.resolved = true;
        return alert;
      }
      return null;
    },

    analyzeTransaction: async (parent, args) => {
      // This would trigger re-analysis of a transaction
      const tx = transactions.find(t => t.hash === args.hash);
      return tx;
    }
  },

  Subscription: {
    newTransaction: {
      subscribe: () => pubsub.asyncIterator(['NEW_TRANSACTION'])
    },
    
    riskAlert: {
      subscribe: () => pubsub.asyncIterator(['RISK_ALERT'])
    },
    
    analyticsUpdate: {
      subscribe: () => pubsub.asyncIterator(['ANALYTICS_UPDATE'])
    }
  }
};

// Helper functions to add data and trigger subscriptions
const addTransaction = (transaction) => {
  transactions.push(transaction);
  
  // Update analytics
  analytics.totalTransactions++;
  if (transaction.riskScore >= 80) analytics.criticalRisk++;
  else if (transaction.riskScore >= 60) analytics.highRisk++;
  else if (transaction.riskScore >= 40) analytics.mediumRisk++;
  else analytics.lowRisk++;
  
  analytics.averageRiskScore = transactions.reduce((sum, tx) => sum + tx.riskScore, 0) / transactions.length;
  analytics.lastUpdated = new Date().toISOString();
  
  // Trigger subscriptions
  pubsub.publish('NEW_TRANSACTION', { newTransaction: transaction });
  pubsub.publish('ANALYTICS_UPDATE', { analyticsUpdate: analytics });
  
  // Create risk alert if high risk
  if (transaction.riskScore >= 70) {
    const alert = {
      id: Date.now().toString(),
      walletAddress: transaction.from,
      alertType: 'HIGH_RISK_TRANSACTION',
      severity: transaction.riskScore,
      description: `High-risk transaction detected: ${transaction.riskScore}% risk score`,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    
    riskAlerts.push(alert);
    pubsub.publish('RISK_ALERT', { riskAlert: alert });
  }
};

module.exports = { resolvers, addTransaction };