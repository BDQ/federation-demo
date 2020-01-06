const xray = require("aws-xray-sdk-core");
xray.captureHTTPsGlobal(require("http"));
xray.capturePromise();

const { ApolloServer, gql } = require("apollo-server-lambda");
const { buildFederatedSchema } = require("@apollo/federation");

const traceResolvers = require("@lifeomic/graphql-resolvers-xray-tracing");

const typeDefs = gql`
  extend type Query {
    me: User
  }

  type User @key(fields: "id") {
    id: ID!
    name: String
    username: String
  }
`;

const resolvers = {
  Query: {
    me() {
      return users[0];
    }
  },
  User: {
    __resolveReference(object) {
      return users.find(user => user.id === object.id);
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

const users = [
  {
    id: "1",
    name: "Ada Lovelace",
    birthDate: "1815-12-10",
    username: "@ada"
  },
  {
    id: "2",
    name: "Alan Turing",
    birthDate: "1912-06-23",
    username: "@complete"
  }
];

exports.handler = server.createHandler();
