'use client';

import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/apollo';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <ApolloProvider client={apolloClient}>
          <div className="min-h-screen">
            <header className="bg-gray-800 border-b border-gray-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-blue-400">
                      ⚡ Hyperchain Insights
                    </h1>
                    <span className="ml-3 px-2 py-1 bg-green-600 text-xs rounded-full">
                      AI-Powered
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">
                      Hyperion Testnet
                    </span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </header>
            <main>{children}</main>
          </div>
        </ApolloProvider>
      </body>
    </html>
  );
}