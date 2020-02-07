import cdk = require("@aws-cdk/core");

import { addEndpoint } from "./addEndpoint";
import { addFederationEP } from "./addFederationEP";

export class FedStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // accounts API + lambda
    const { lambda: accountsLambda, gateway: accountsAPI } = addEndpoint(
      this,
      "accounts"
    );

    // inventory API + lambda
    const { lambda: inventoryLambda, gateway: inventoryAPI } = addEndpoint(
      this,
      "inventory"
    );

    // products API + lambda
    const { lambda: productsLambda, gateway: productsAPI } = addEndpoint(
      this,
      "products"
    );

    // reviews API + lambda
    const { lambda: reviewsLambda, gateway: reviewsAPI } = addEndpoint(
      this,
      "reviews"
    );

    // gateway API + lambda
    const gatewayLambda = addFederationEP(this, "gateway", "alb", {
      AWS_XRAY_DEBUG_MODE: "true",
      PRODUCTS_LAMBDA_NAME: productsLambda.functionName,
      PRODUCTS_API_URL: productsAPI.url,
      ACCOUNTS_LAMBDA_NAME: accountsLambda.functionName,
      ACCOUNTS_API_URL: accountsAPI.url,
      INVENTORY_LAMBDA_NAME: inventoryLambda.functionName,
      INVENTORY_API_URL: inventoryAPI.url,
      REVIEWS_LAMBDA_NAME: reviewsLambda.functionName,
      REVIEWS_API_URL: reviewsAPI.url
    });

    // give the gateway lambda permissions to invoke all the children
    // lambdas directly (for non-HTTP invoke tests)
    [reviewsLambda, accountsLambda, productsLambda, inventoryLambda].forEach(
      lambda => {
        lambda.grantInvoke(gatewayLambda);
      }
    );
  }
}
