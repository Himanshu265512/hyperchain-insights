const TransactionMonitor = require('./services/transaction-monitor');
const GraphQLServer = require('./graphql/server');
const { addTransaction } = require('./graphql/resolvers');
require('dotenv').config();

class HyperchainInsightsServer {
  constructor() {
    this.transactionMonitor = new TransactionMonitor();
    this.graphqlServer = new GraphQLServer();
  }

  async start() {
    console.log('🚀 Starting Hyperchain Insights Server...');
    
    try {
      // Start GraphQL API server
      await this.graphqlServer.start();
      
      // Override transaction processing to feed GraphQL
      this.transactionMonitor.storeResults = async (txData, aiResults) => {
        const transaction = {
          hash: txData.hash,
          from: txData.from,
          to: txData.to,
          value: txData.value,
          timestamp: new Date(txData.timestamp).toISOString(),
          blockNumber: txData.blockNumber,
          riskScore: aiResults.riskScore,
          patterns: aiResults.patterns,
          insights: aiResults.insights,
          aiConfidence: aiResults.aiConfidence
        };
        
        // Add to GraphQL data store and trigger subscriptions
        addTransaction(transaction);
        
        console.log('💾 Transaction stored and broadcasted via GraphQL');
      };
      
      // Start transaction monitoring
      await this.transactionMonitor.start();
      
      console.log('✅ Hyperchain Insights Server fully operational!');
      console.log('🤖 AI analysis engine: ACTIVE');
      console.log('📊 Transaction monitoring: ACTIVE');
      console.log('🔌 GraphQL API: ACTIVE');
      console.log('📡 Real-time subscriptions: ACTIVE');
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop() {
    await this.transactionMonitor.stop();
    await this.graphqlServer.stop();
    console.log('🛑 Server stopped');
  }
}

// Start the server
const server = new HyperchainInsightsServer();
server.start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await server.stop();
  process.exit(0);
});