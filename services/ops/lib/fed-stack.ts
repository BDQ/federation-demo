import cdk = require("@aws-cdk/core");
import lambda = require("@aws-cdk/aws-lambda");
import dynamodb = require("@aws-cdk/aws-dynamodb");
import iam = require("@aws-cdk/aws-iam");

import apigateway = require("@aws-cdk/aws-apigateway");
import path = require("path");

export class FedStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // api to house individual graphql endpoints
    const gapi = new apigateway.RestApi(this, `child-api`, {
      deployOptions: {
        tracingEnabled: true
      }
    });

    // accounts
    const accountsLambda = new lambda.Function(this, "accounts", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      // code: lambda.Code.fromAsset(path.join(__dirname, "../../accounts")),
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../dist/accounts")
      ),
      timeout: cdk.Duration.seconds(15),
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
      // code: lambda.Code.fromAsset(path.join(__dirname, "../../inventory")),
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../dist/inventory")
      ),
      timeout: cdk.Duration.seconds(15),
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
      // code: lambda.Code.fromAsset(path.join(__dirname, "../../products")),
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../dist/products")
      ),
      timeout: cdk.Duration.seconds(15),
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
      // code: lambda.Code.fromAsset(path.join(__dirname, "../../reviews")),
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../dist/reviews")
      ),
      timeout: cdk.Duration.seconds(15),
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 2048
    });
    const reviewsInteg = new apigateway.LambdaIntegration(reviewsLambda);
    const reviews = gapi.root.addResource("reviews");
    reviews.addMethod("GET", reviewsInteg);
    reviews.addMethod("POST", reviewsInteg);

    const gatewayLambda = new lambda.Function(this, "gateway", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      // code: lambda.Code.fromAsset(path.join(__dirname, "../../gateway")),
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../dist/gateway")
      ),
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

    // gateway
    const fedapi = new apigateway.CfnApiV2(this, `fed-api`, {
      name: "fedhttpapi",
      protocolType: "HTTP",
      target: gatewayLambda.functionArn
    });

    // this.formatArn()
    new lambda.CfnPermission(this, "gate-perm", {
      principal: "apigateway.amazonaws.com",
      functionName: gatewayLambda.functionName,
      sourceArn: `arn:aws:execute-api:us-east-1:${this.account}:*`,
      action: "lambda:InvokeFunction"
    });

    const fedrestapi = new apigateway.RestApi(this, `fed-rest-api`, {
      deployOptions: {
        tracingEnabled: true
      }
    });

    const gatewayInteg = new apigateway.LambdaIntegration(gatewayLambda);
    fedrestapi.root.addMethod("GET", gatewayInteg);
    fedrestapi.root.addMethod("POST", gatewayInteg);
  }
}
