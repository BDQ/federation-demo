const { ApolloServer } = require("apollo-server-lambda");
const { ApolloGateway } = require("@apollo/gateway");
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
  buildService: ({ name, url, functionName }) => {
    try {
      let dataSource = new LambdaGraphQLDataSource({
        functionName,
        willSendRequest({ request, context }) {
          // request.http.headers.set('x-correlation-id', '...');
          // if (context.req && context.req.headers) {
          //   request.http.headers.set(
          //     "authorization",
          //     context.req.headers["authorization"]
          //   );
          // }
          console.log("will send request -> ", name, JSON.stringify(request));
        }
        // didReceiveResponse(response, request, context) {
        //   console.log("inside response");
        //   const body = super.didReceiveResponse(response, request, context);
        //   const cookie = request.http.headers.get("Cookie");
        //   if (cookie) {
        //     context.responseCookies.push(cookie);
        //   }
        //   console.log("didRecRes", body);
        //   return body;
        // }
      });
      return dataSource;
    } catch (err) {
      console.warn("insdie buildService", err);
    }
  }
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
  subscriptions: false
});
exports.handler = server.createHandler();
