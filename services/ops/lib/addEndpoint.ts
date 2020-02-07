import cdk = require("@aws-cdk/core");
import lambda = require("@aws-cdk/aws-lambda");

import apigateway = require("@aws-cdk/aws-apigateway");
import path = require("path");

export const addEndpoint = (
  stack: cdk.Stack,
  name: string,

  environment: any = {}
) => {
  const lmbd = new lambda.Function(stack, name, {
    runtime: lambda.Runtime.NODEJS_12_X,
    handler: "index.handler",
    code: lambda.Code.fromAsset(path.join(__dirname, `../../../dist/${name}`)),
    timeout: cdk.Duration.seconds(10),
    tracing: lambda.Tracing.DISABLED,
    memorySize: 2048,
    environment
  });

  const gateway = new apigateway.RestApi(stack, `${name}-apirest`, {
    deployOptions: {
      tracingEnabled: false
    }
  });

  const httpInteg = new apigateway.LambdaIntegration(lmbd, {});
  gateway.root.addMethod("GET", httpInteg);
  gateway.root.addMethod("POST", httpInteg);

  return { lambda: lmbd, gateway };
};
