const xray = require("aws-xray-sdk-core");
xray.captureHTTPsGlobal(require("http"));
xray.capturePromise();

const { ApolloServer, gql } = require("apollo-server-lambda");
const { buildFederatedSchema } = require("@apollo/federation");

const traceResolvers = require("@lifeomic/graphql-resolvers-xray-tracing");

const typeDefs = gql`
  extend type Product @key(fields: "upc") {
    upc: String! @external
    weight: Int @external
    price: Int @external
    inStock: Boolean
    shippingEstimate: Int @requires(fields: "price weight")
  }
`;

const resolvers = {
  Product: {
    __resolveReference(object) {
      return {
        ...object,
        ...inventory.find(product => product.upc === object.upc)
      };
    },
    shippingEstimate(object) {
      // free for expensive items
      if (object.price > 1000) return 0;
      // estimate is based on weight
      return object.weight * 0.5;
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

const server = new ApolloServer({
  schema,
  introspection: true,
  playground: true
});

const inventory = [
  { upc: "1", inStock: true },
  { upc: "2", inStock: false },
  { upc: "3", inStock: true }
];

exports.handler = server.createHandler();
