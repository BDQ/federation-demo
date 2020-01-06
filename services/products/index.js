const xray = require("aws-xray-sdk-core");
// xray.captureAWS(require("aws-sdk"));
// const Lambda = require("aws-sdk/clients/lambda");
xray.captureHTTPsGlobal(require("http"));
xray.capturePromise();

const { ApolloServer, gql } = require("apollo-server-lambda");
const { buildFederatedSchema } = require("@apollo/federation");

const traceResolvers = require("@lifeomic/graphql-resolvers-xray-tracing");

const typeDefs = gql`
  extend type Query {
    topProducts(first: Int = 5): [Product]
  }

  type Product @key(fields: "upc") {
    upc: String!
    name: String
    price: Int
    weight: Int
  }
`;

const resolvers = {
  Product: {
    __resolveReference(object) {
      return products.find(product => product.upc === object.upc);
    }
  },
  Query: {
    topProducts(_, args) {
      return products.slice(0, args.first);
    }
  }
};

const schema = buildFederatedSchema([
  {
    typeDefs,
    resolvers
  }
]);

traceResolvers(schema);

const server = new ApolloServer({ schema });

const products = [
  {
    upc: "1",
    name: "Table",
    price: 899,
    weight: 100
  },
  {
    upc: "2",
    name: "Couch",
    price: 1299,
    weight: 1000
  },
  {
    upc: "3",
    name: "Chair",
    price: 54,
    weight: 50
  }
];

exports.handler = server.createHandler();
