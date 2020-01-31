#!/usr/bin/env node
import "source-map-support/register";
import cdk = require("@aws-cdk/core");
import { FedStack } from "../lib/fed-stack";

const app = new cdk.App();
new FedStack(app, "fed-demo");
