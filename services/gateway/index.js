// const xray = require("aws-xray-sdk-core");
const Lambda = require("aws-sdk/clients/lambda");

const { ApolloServer } = require("apollo-server-lambda");
const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");
const { LambdaGraphQLDataSource } = require("./LambdaGraphQLDataSource");

class XRayTracedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
    if (process.env._X_AMZN_TRACE_ID) {
      request.http.headers.set("X-Amzn-Trace-Id", process.env._X_AMZN_TRACE_ID);
      request.http.headers.set("X-BDQ-Trace-Id", process.env._X_AMZN_TRACE_ID);
    }
  }
}

const gateway = new ApolloGateway({
  serviceList: [
    {
      name: "accounts",
      url: process.env.ACCOUNTS_API_URL,
      functionName: process.env.ACCOUNTS_LAMBDA_NAME
    },
    {
      name: "reviews",
      url: process.env.REVIEWS_API_URL,
      functionName: process.env.REVIEWS_LAMBDA_NAME
    },
    {
      name: "products",
      url: process.env.PRODUCTS_API_URL,
      functionName: process.env.PRODUCTS_LAMBDA_NAME
    },
    {
      name: "inventory",
      url: process.env.INVENTORY_API_URL,
      functionName: process.env.INVENTORY_LAMBDA_NAME
    }
  ],
  // buildService: ({ url }) => {
  //   return new XRayTracedDataSource({ url });
  // }

  buildService: ({ name, url, functionName }) => {
    return new LambdaGraphQLDataSource({
      functionName
    });
  }
});

const server = new ApolloServer({
  gateway,
  subscriptions: false,
  introspection: true,
  playground: true
  // context: ({ event }) => {
  //   xray.captureHTTPsGlobal(require("http"));
  //   xray.capturePromise();
  // }
});
exports.handler = server.createHandler();
