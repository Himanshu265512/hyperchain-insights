const { ethers } = require('ethers');
const AIAnalyzer = require('./ai-analyzer');

class TransactionMonitor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.HYPERION_RPC);
    this.aiAnalyzer = new AIAnalyzer();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;
    
    console.log('🚀 Starting transaction monitoring...');
    this.isRunning = true;
    
    // Monitor new blocks (real transactions)
    this.provider.on('block', async (blockNumber) => {
      console.log(`📦 New block: ${blockNumber}`);
      await this.processBlock(blockNumber);
    });
  
    // Start demo mode for hackathon presentation
    await this.startDemoMode();
  
    console.log('✅ Transaction monitoring started (with demo mode)');
  }

  async processBlock(blockNumber) {
    try {
      const block = await this.provider.getBlock(blockNumber, true);
      
      if (block && block.transactions) {
        console.log(`🔍 Processing ${block.transactions.length} transactions in block ${blockNumber}`);
        
        for (const tx of block.transactions) {
          await this.processTransaction(tx);
        }
      }
    } catch (error) {
      console.error('Error processing block:', error);
    }
  }

  async processTransaction(tx) {
    try {
      const txData = {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        timestamp: Date.now(),
        blockNumber: tx.blockNumber
      };

      // Run AI analysis
      const aiResults = await this.aiAnalyzer.analyzeTransaction(txData);
      
      // Log results
      console.log('📊 Analysis results:', {
        hash: txData.hash.slice(0, 10) + '...',
        riskScore: aiResults.riskScore,
        patterns: aiResults.patterns.length,
        insights: aiResults.insights.length
      });

      // Store results (to be implemented)
      await this.storeResults(txData, aiResults);

    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  }

  async storeResults(txData, aiResults) {
    // Placeholder for database storage
    console.log('💾 Storing analysis results for:', txData.hash);
  }

  stop() {
    this.isRunning = false;
    this.provider.removeAllListeners();
    console.log('⏹️ Transaction monitoring stopped');
  }
  async startDemoMode() {
    console.log('🎬 Starting demo mode - generating test transactions...');
    
    const demoAddresses = [
      '0x742d35Cc6534C0532925a3b8D76140000000001',
      '0x742d35Cc6534C0532925a3b8D76140000000002', 
      '0x742d35Cc6534C0532925a3b8D76140000000003',
      '0x742d35Cc6534C0532925a3b8D76140000000004'
    ];
    
    setInterval(async () => {
      const mockTx = {
        hash: '0x' + Math.random().toString(16).substr(2, 62),
        from: demoAddresses[Math.floor(Math.random() * demoAddresses.length)],
        to: demoAddresses[Math.floor(Math.random() * demoAddresses.length)],
        value: (Math.random() * 1000 * 1e18).toString(),
        timestamp: Date.now(),
        blockNumber: Math.floor(Math.random() * 1000000) + 5000000
      };
      
      console.log('🎭 Processing demo transaction:', mockTx.hash.slice(0, 10) + '...');
      await this.processTransaction(mockTx);
    }, 8000); // New transaction every 8 seconds
  }
}

module.exports = TransactionMonitor;