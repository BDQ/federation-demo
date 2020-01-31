// const xray = require("aws-xray-sdk-core");
// xray.captureHTTPsGlobal(require("http"));
// xray.capturePromise();

const { ApolloServer } = require("apollo-server-lambda");
const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");
const { LambdaGraphQLDataSource } = require("./LambdaGraphQLDataSource");

const gateway = new ApolloGateway({
  serviceList: [
    {
      name: "accounts",
      url: `${process.env.GQL_API_BASE_URL}accounts`,
      functionName: process.env.ACCOUNTS_LAMBDA_NAME
    },
    {
      name: "reviews",
      url: `${process.env.GQL_API_BASE_URL}reviews`,
      functionName: process.env.REVIEWS_LAMBDA_NAME
    },
    {
      name: "products",
      url: `${process.env.GQL_API_BASE_URL}products`,
      functionName: process.env.PRODUCTS_LAMBDA_NAME
    },
    {
      name: "inventory",
      url: `${process.env.GQL_API_BASE_URL}inventory`,
      functionName: process.env.INVENTORY_LAMBDA_NAME
    }
  ],
  buildService: ({ url }) => {
    console.log("buildingService", url);
    console.log(RemoteGraphQLDataSource);
    let dataSource = new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        // request.http.headers.set('x-correlation-id', '...');
        // if (context.req && context.req.headers) {
        //   request.http.headers.set(
        //     "authorization",
        //     context.req.headers["authorization"]
        //   );
        // }
        console.log("will send request -> ", JSON.stringify(request));
      }
    });
    console.log(dataSource);
    return dataSource;
  }
  // buildService: ({ name, url, functionName }) => {
  //   try {
  //     let dataSource = new LambdaGraphQLDataSource({
  //       functionName
  //     });
  //     return dataSource;
  //   } catch (err) {
  //     console.warn("insdie buildService", err);
  //   }
  // }
});

// (async () => {
//   const { schema, executor } = await gateway.load();

//   const server = new ApolloServer({ schema, executor });

//   server.listen().then(({ url }) => {
//     console.log(`🚀 Server ready at ${url}`);
//   });
// })();

const server = new ApolloServer({
  gateway,
  subscriptions: false,
  introspection: true,
  playground: true
});
exports.handler = server.createHandler();
