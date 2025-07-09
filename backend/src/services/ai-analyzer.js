class AIAnalyzer {
    constructor() {
      this.riskThresholds = {
        VOLUME_ANOMALY: 1000, // ETH equivalent
        FREQUENCY_SPIKE: 10,   // transactions per minute
        NEW_WALLET: 24,        // hours since first transaction
        SUSPICIOUS_PATTERN: 0.8 // confidence score
      };
    }
  
    async analyzeTransaction(txData) {
      console.log('🤖 AI analyzing transaction:', txData.hash?.slice(0, 10) + '...');
      
      try {
        // 1. Volume analysis
        const volumeRisk = this.analyzeVolume(txData);
        
        // 2. Pattern recognition
        const patterns = await this.detectPatterns(txData);
        
        // 3. Risk scoring
        const riskScore = this.calculateRiskScore(volumeRisk, patterns);
        
        // 4. Generate insights
        const insights = this.generateInsights(riskScore, patterns, txData);
  
        return {
          transactionHash: txData.hash,
          riskScore,
          patterns,
          insights,
          aiConfidence: this.calculateConfidence(patterns, riskScore),
          timestamp: Date.now()
        };
  
      } catch (error) {
        console.error('❌ AI analysis failed:', error);
        return {
          transactionHash: txData.hash,
          riskScore: 0,
          patterns: [],
          insights: ['AI analysis temporarily unavailable'],
          aiConfidence: 0,
          timestamp: Date.now()
        };
      }
    }
  
    analyzeVolume(txData) {
      const valueInETH = parseFloat(txData.value) / 1e18;
      
      if (valueInETH > this.riskThresholds.VOLUME_ANOMALY) {
        return {
          type: 'volume_anomaly',
          severity: 'high',
          confidence: 0.9,
          description: `Large transaction: ${valueInETH.toFixed(2)} ETH`
        };
      }
      
      return null;
    }
  
    async detectPatterns(txData) {
      const patterns = [];
      
      // Simulate AI pattern detection
      const random = Math.random();
      
      if (random < 0.1) {
        patterns.push({
          type: 'whale_movement',
          confidence: 0.85,
          description: 'Large holder activity detected'
        });
      }
      
      if (random < 0.05) {
        patterns.push({
          type: 'bot_activity',
          confidence: 0.78,
          description: 'Automated trading pattern'
        });
      }
      
      return patterns;
    }
  
    calculateRiskScore(volumeRisk, patterns) {
      let score = 0;
      
      // Volume-based risk
      if (volumeRisk) {
        score += 30;
      }
      
      // Pattern-based risk
      patterns.forEach(pattern => {
        if (pattern.type === 'whale_movement') score += 20;
        if (pattern.type === 'bot_activity') score += 15;
      });
      
      return Math.min(score, 100);
    }
  
    generateInsights(riskScore, patterns, txData) {
      const insights = [];
  
      if (riskScore > 70) {
        insights.push('🚨 High-risk transaction detected');
      } else if (riskScore > 40) {
        insights.push('⚠️ Medium-risk transaction');
      } else {
        insights.push('✅ Low-risk transaction');
      }
  
      patterns.forEach(pattern => {
        if (pattern.type === 'whale_movement') {
          insights.push('🐋 Whale activity may impact market');
        } else if (pattern.type === 'bot_activity') {
          insights.push('🤖 Automated trading detected');
        }
      });
  
      return insights;
    }
  
    calculateConfidence(patterns, riskScore) {
      const patternConfidence = patterns.reduce((acc, p) => acc + p.confidence, 0) / patterns.length || 0;
      return Math.min((patternConfidence + 0.7) / 2, 1.0);
    }
  }
  
  module.exports = AIAnalyzer;