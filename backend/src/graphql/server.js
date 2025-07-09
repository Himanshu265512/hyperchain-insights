const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { execute, subscribe } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');

const typeDefs = require('./schema');
const { resolvers } = require('./resolvers');

class GraphQLServer {
  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.schema = makeExecutableSchema({ typeDefs, resolvers });
  }

  async start() {
    // Middleware
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));
    this.app.use(cors());
    this.app.use(morgan('combined'));

    // Create Apollo Server
    this.server = new ApolloServer({
      schema: this.schema,
      context: ({ req }) => {
        return {
          // Add context here (auth, etc.)
        };
      },
      plugins: [
        {
          serverWillStart() {
            return {
              drainServer() {
                // Drain subscription server when Apollo server stops
              }
            };
          }
        }
      ]
    });

    // Start Apollo Server
    await this.server.start();
    this.server.applyMiddleware({ app: this.app, path: '/graphql' });

    // WebSocket server for subscriptions
    this.subscriptionServer = SubscriptionServer.create(
      {
        schema: this.schema,
        execute,
        subscribe,
        onConnect: () => {
          console.log('📡 Client connected to subscriptions');
        },
        onDisconnect: () => {
          console.log('📡 Client disconnected from subscriptions');
        }
      },
      {
        server: this.httpServer,
        path: '/graphql'
      }
    );

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Hyperchain Insights GraphQL API'
      });
    });

    // Start HTTP server
    const PORT = process.env.PORT || 4000;
    this.httpServer.listen(PORT, () => {
      console.log(`🚀 GraphQL API server running on http://localhost:${PORT}${this.server.graphqlPath}`);
      console.log(`🔌 GraphQL subscriptions ready at ws://localhost:${PORT}${this.server.graphqlPath}`);
      console.log(`📊 GraphQL Playground available at http://localhost:${PORT}${this.server.graphqlPath}`);
    });
  }

  async stop() {
    if (this.subscriptionServer) {
      this.subscriptionServer.close();
    }
    if (this.server) {
      await this.server.stop();
    }
    if (this.httpServer) {
      this.httpServer.close();
    }
    console.log('🛑 GraphQL server stopped');
  }
}

module.exports = GraphQLServer;