import cdk = require("@aws-cdk/core");
import lambda = require("@aws-cdk/aws-lambda");
import dynamodb = require("@aws-cdk/aws-dynamodb");

import apigateway = require("@aws-cdk/aws-apigateway");
import path = require("path");

export class GQLStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // api to house individual graphql endpoints
    const gapi = new apigateway.RestApi(this, `gql-api`, {});

    // accounts
    const accountsLambda = new lambda.Function(this, "accounts", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../accounts")),
      timeout: cdk.Duration.seconds(60),
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 2048
    });
    const accountInteg = new apigateway.LambdaIntegration(accountsLambda);
    const accounts = gapi.root.addResource("accounts");
    accounts.addMethod("GET", accountInteg);
    accounts.addMethod("POST", accountInteg);

    // inventory
    const inventoryLambda = new lambda.Function(this, "inventory", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../inventory")),
      timeout: cdk.Duration.seconds(60),
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 2048
    });
    const inventoryInteg = new apigateway.LambdaIntegration(inventoryLambda);
    const inventory = gapi.root.addResource("inventory");
    inventory.addMethod("GET", inventoryInteg);
    inventory.addMethod("POST", inventoryInteg);

    // products
    const productsTable = new dynamodb.Table(this, "productsTable", {
      partitionKey: { name: "slug", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "locale", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });
    const productsLambda = new lambda.Function(this, "productsLambda", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../products")),
      timeout: cdk.Duration.seconds(60),
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 2048,
      environment: {
        TABLE: productsTable.tableName
      }
    });
    const productsInteg = new apigateway.LambdaIntegration(productsLambda);
    const products = gapi.root.addResource("products");
    products.addMethod("GET", productsInteg);
    products.addMethod("POST", productsInteg);

    // reviews
    const reviewsLambda = new lambda.Function(this, "reviews", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../reviews")),
      timeout: cdk.Duration.seconds(60),
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 2048
    });
    const reviewsInteg = new apigateway.LambdaIntegration(reviewsLambda);
    const reviews = gapi.root.addResource("reviews");
    reviews.addMethod("GET", reviewsInteg);
    reviews.addMethod("POST", reviewsInteg);

    // gateway
    const fedapi = new apigateway.RestApi(this, `fed-api`, {});

    const gatewayLambda = new lambda.Function(this, "gateway", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../gateway")),
      timeout: cdk.Duration.seconds(60),
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 2048,
      environment: {
        GQL_API_BASE_URL: gapi.url,
        PRODUCTS_LAMBDA_NAME: productsLambda.functionName,
        ACCOUNTS_LAMBDA_NAME: accountsLambda.functionName,
        INVENTORY_LAMBDA_NAME: inventoryLambda.functionName,
        REVIEWS_LAMBDA_NAME: reviewsLambda.functionName
      }
    });

    [reviewsLambda, accountsLambda, productsLambda, inventoryLambda].forEach(
      lambda => {
        lambda.grantInvoke(gatewayLambda);
      }
    );

    const gatewayInteg = new apigateway.LambdaIntegration(gatewayLambda);
    fedapi.root.addMethod("GET", gatewayInteg);
    fedapi.root.addMethod("POST", gatewayInteg);
  }
}
