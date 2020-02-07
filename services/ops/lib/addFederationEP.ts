import cdk = require("@aws-cdk/core");
import lambda = require("@aws-cdk/aws-lambda");
import ec2 = require("@aws-cdk/aws-ec2");

import elbv2 = require("@aws-cdk/aws-elasticloadbalancingv2");
import targets = require("@aws-cdk/aws-elasticloadbalancingv2-targets");

import apigateway = require("@aws-cdk/aws-apigateway");
import path = require("path");

export const addFederationEP = (
  stack: cdk.Stack,
  name: string,
  gatewayType: string = "rest",
  environment: any = {}
) => {
  const lmbd = new lambda.Function(stack, name, {
    runtime: lambda.Runtime.NODEJS_12_X,
    handler: "index.handler",
    code: lambda.Code.fromAsset(path.join(__dirname, `../../../dist/${name}`)),
    timeout: cdk.Duration.seconds(60),
    tracing: lambda.Tracing.DISABLED,
    memorySize: 2048,
    environment
  });

  if (gatewayType === "rest") {
    // 'default API Gateway config
    const gateway = new apigateway.RestApi(stack, `${name}-apirest`, {
      deployOptions: {
        tracingEnabled: false
      }
    });

    const httpInteg = new apigateway.LambdaIntegration(lmbd, {});
    gateway.root.addMethod("GET", httpInteg);
    gateway.root.addMethod("POST", httpInteg);
  } else if (gatewayType === "http") {
    // HTTP BETA service (no CDK support yet)
    new apigateway.CfnApiV2(stack, `${name}-apigw`, {
      name: `${name} api`,
      protocolType: "HTTP",
      target: lmbd.functionArn
    });

    new lambda.CfnPermission(stack, `${name}-perm`, {
      principal: "apigateway.amazonaws.com",
      functionName: lmbd.functionName,
      sourceArn: `arn:aws:execute-api:us-east-1:${stack.account}:*`,
      action: "lambda:InvokeFunction"
    });
  } else if (gatewayType === "alb") {
    const vpc = new ec2.Vpc(stack, "fed-vpc", { maxAzs: 2 });
    const lb = new elbv2.ApplicationLoadBalancer(stack, "LB", {
      vpc,
      internetFacing: true
    });

    const listener = lb.addListener("Listener", { port: 80 });
    listener.addTargets("Targets", {
      targets: [new targets.LambdaTarget(lmbd)]
    });
  } else {
    throw new Error("Unspported gatewayType");
  }
  return lmbd;
};
