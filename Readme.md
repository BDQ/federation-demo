## Extended Apollo Federation Demo using Lambda

This repository is a demo of using Apollo Federation to build a single schema on top of AWS Lambda. The Lambdas are located under the [`./services`](./services/) folder and the Gateway that composes the overall schema is in the [`gateway`](./services/gateway/index.js) service.

### What is this?

This demo showcases four partial schemas running as federated microservices. Each of these schemas can be accessed on their own and form a partial shape of an overall schema. The gateway fetches the service capabilities from the running services to create an overall composed schema which can be queried.

The Gateway service accesses the upstreams GQL endpoints by invoking the Lambda directly (removing the HTTP overhead of the AWS API gateway), this is achieved using a custom Apollo Gateway Data Source called: [LambdaGraphQLDataSource](./services/gateway/LambdaGraphQLDataSource.js).

To learn more about Apollo Federation, check out the [docs](https://www.apollographql.com/docs/apollo-server/federation/introduction)

### Deployment Config

This demo uses the AWS-CDK to configure the following components:

- **Gateway Lambda** - The public facing GraphQL endpoint, connected to its own AWS API Gateway (fedapi) to make it HTTP accessible.

- **Products, Reviews, Accounts, Inventory Lambdas** - Partial GraphQL endpoints (which are frontend by the Gateway Lambda above). These are also connected to an AWS API Gateway (gqlapi) for testing purposes only.

#### Federated Query - X-Ray Service Map

![x-ray service map](https://monosnap.com/image/n3BDYYjoOzAutC4vRK3ys5isWGpFdW)

### Deploying with CDK

Setup locally

```sh
npm install
```

Deploy using CDK

```
npm run deploy
```

The command above should output two API Gateway URL:

- _**gql-demo.gqlapiEndpointXXXXXXX**_ - this is the individual GraphQL endpoints, accessible at `/prod/accounts`, `/prod/products`, `/prod/reviews` & `/prod/inventory`

- _**gql-demo.fedapiEndpointXXXXXX**_ - this is the combined (federated) endpoint accessible at: `/prod`

### Examples

The following query will hit all 4 microservices, returning a single compiled response.

```graphql
{
  topProducts {
    name
    inStock
    reviews {
      body
      author {
        username
        name
      }
    }
  }
}
```

The X-Ray trace for this query looks like:

![federated query trace](https://monosnap.com/image/8GYNap5OneEPctNJoImPLB1QWhqoKJ)

### TIL

- Federated (sub) schemas shouldn't be exposed to the public (federation leaks too much info). This is easy to achieve with the deployment pattern here, as the Apollo Gateway invokes lambdas programmatically (not using the AWS API Gateway). I've included the `gqlapi` API for testing purposes only. If we want to expose sub schemas directly, we'd need to have a dedicated lambda handler for that, that doesn't use the federated schema methods.

- Apollo Gateway, is pretty smart:

  - It knows what sub-queries it can run in parallel (see `Inventory` & `Reviews` lambda invokes in the trace timing above).
  - It can deal with an individual sub-queries failing (if the endpoint is down etc), it returns as much of the result as it can (allong with the exceptions encountered).

- Invoking a lambda seems to have 10ms to 20ms of overhead, in the x-ray trace above - the `Gateway` lambda takes 31ms to invoke the `Products`. However, if you look at the `Products` lambda breakdown, it only takes 17ms to process.

- Using the [Lambda Power Tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning) tool is a great way to balance performance vs cost of a lambda. See [Product Lambda Tuning result](https://lambda-power-tuning.show/#gAAAAQACAAQACMAL;A/kLRZbczEQRIbdEzdyaRIWTfEQ3lJJE;P4agNgRM7TYxYVE3Xna1N4qLGThnBXY4) for example.
