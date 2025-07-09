'use client';

import { useQuery, useSubscription } from '@apollo/client';
import { gql } from '@apollo/client';
import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Shield, TrendingUp, Zap } from 'lucide-react';

// Types
interface Pattern {
  type: string;
  confidence: number;
  description: string;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  riskScore: number;
  timestamp: string;
  insights: string[];
  patterns: Pattern[];
}

// GraphQL Queries
const GET_ANALYTICS_SUMMARY = gql`
  query GetAnalyticsSummary {
    analyticsSummary {
      totalTransactions
      criticalRisk
      highRisk
      mediumRisk
      lowRisk
      averageRiskScore
      lastUpdated
    }
  }
`;

const GET_LIVE_TRANSACTIONS = gql`
  query GetLiveTransactions($limit: Int) {
    liveTransactions(limit: $limit) {
      hash
      from
      to
      value
      riskScore
      timestamp
      insights
      patterns {
        type
        confidence
        description
      }
    }
  }
`;

const NEW_TRANSACTION_SUBSCRIPTION = gql`
  subscription NewTransaction {
    newTransaction {
      hash
      from
      to
      value
      riskScore
      timestamp
      insights
      patterns {
        type
        confidence
        description
      }
    }
  }
`;

export default function Dashboard() {
  const [liveTransactions, setLiveTransactions] = useState<Transaction[]>([]);
  
  // Queries
  const { data: analyticsData } = useQuery(GET_ANALYTICS_SUMMARY, {
    pollInterval: 30000,
  });
  
  const { data: transactionsData } = useQuery(GET_LIVE_TRANSACTIONS, {
    variables: { limit: 10 },
    pollInterval: 5000,
  });

  // Subscription for real-time updates
  const { data: newTransaction } = useSubscription(NEW_TRANSACTION_SUBSCRIPTION);

  // Update live transactions when new transaction arrives
  useEffect(() => {
    if (newTransaction?.newTransaction) {
      setLiveTransactions((prev: Transaction[]) => [
        newTransaction.newTransaction as Transaction, 
        ...prev.slice(0, 9)
      ]);
    }
  }, [newTransaction]);

  // Initialize with query data
  useEffect(() => {
    if (transactionsData?.liveTransactions) {
      setLiveTransactions(transactionsData.liveTransactions);
    }
  }, [transactionsData]);

  const getRiskColor = (riskScore: number): string => {
    if (riskScore >= 70) return 'text-red-400 bg-red-900/20';
    if (riskScore >= 40) return 'text-yellow-400 bg-yellow-900/20';
    return 'text-green-400 bg-green-900/20';
  };

  const getRiskLabel = (riskScore: number): string => {
    if (riskScore >= 70) return 'HIGH';
    if (riskScore >= 40) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Transactions</p>
              <p className="text-2xl font-bold text-white">
                {analyticsData?.analyticsSummary?.totalTransactions || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">High Risk</p>
              <p className="text-2xl font-bold text-red-400">
                {analyticsData?.analyticsSummary?.criticalRisk || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Low Risk</p>
              <p className="text-2xl font-bold text-green-400">
                {analyticsData?.analyticsSummary?.lowRisk || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Avg Risk Score</p>
              <p className="text-2xl font-bold text-purple-400">
                {Math.round(analyticsData?.analyticsSummary?.averageRiskScore || 0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Transactions Feed */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Zap className="w-5 h-5 text-yellow-400 mr-2" />
              Live Transaction Analysis
            </h2>
            <div className="flex items-center text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
              Real-time AI Analysis
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-700">
          {liveTransactions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>Waiting for transactions...</p>
              <p className="text-sm mt-2">AI analysis will appear here in real-time</p>
            </div>
          ) : (
            liveTransactions.map((tx: Transaction) => (
              <div key={tx.hash} className="px-6 py-4 hover:bg-gray-750">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <code className="text-sm font-mono text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                        {tx.hash.slice(0, 10)}...
                      </code>
                      <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(tx.riskScore)}`}>
                        {getRiskLabel(tx.riskScore)} RISK
                      </span>
                      <span className="ml-2 text-sm text-gray-400">
                        Score: {tx.riskScore}%
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-300 mb-2">
                      <span className="text-gray-500">From:</span> {tx.from.slice(0, 8)}...
                      <span className="text-gray-500 ml-4">To:</span> {tx.to.slice(0, 8)}...
                      <span className="text-gray-500 ml-4">Value:</span> {(parseFloat(tx.value) / 1e18).toFixed(4)} ETH
                    </div>

                    {tx.insights && tx.insights.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tx.insights.map((insight: string, i: number) => (
                          <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                            {insight}
                          </span>
                        ))}
                      </div>
                    )}

                    {tx.patterns && tx.patterns.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tx.patterns.map((pattern: Pattern, i: number) => (
                          <span key={i} className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded">
                            🤖 {pattern.description} ({Math.round(pattern.confidence * 100)}%)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 ml-4">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}