const AWSXRay = require("aws-xray-sdk");
const Lambda = require("aws-sdk/clients/lambda");
const lambda = AWSXRay.captureAWSClient(new Lambda());

const {
  GraphQLRequestContext,
  GraphQLResponse,
  ValueOrPromise
} = require("apollo-server-types");
const {
  ApolloError,
  AuthenticationError,
  ForbiddenError
} = require("apollo-server-errors");
const { Headers } = require("apollo-server-env");

class LambdaGraphQLDataSource {
  constructor(config) {
    this.path = "/graphql";
    if (config) return Object.assign(this, config);
  }

  willSendRequest({ request, context }) {
    if (process.env._X_AMZN_TRACE_ID)
      request.http.headers.set("X-Amzn-Trace-Id", process.env._X_AMZN_TRACE_ID);
  }

  async process({ request, context }) {
    const headers = (request.http && request.http.headers) || new Headers();
    headers.set("Content-Type", "application/json");

    request.http = {
      method: "POST",
      url: this.functionName,
      headers
    };

    if (this.willSendRequest) await this.willSendRequest({ request, context });

    try {
      const headers = {};
      for (const [key, value] of request.http.headers) {
        headers[key] = value;
      }

      const event = {
        body: Buffer.from(JSON.stringify(request)).toString(),
        path: this.path,
        httpMethod: request.http.method,
        isBase64Encoded: false,
        headers
      };

      const lambdaResponse = await lambda
        .invoke({
          FunctionName: this.functionName,
          Payload: JSON.stringify(event, null, 2)
        })
        .promise();

      return await this.didReceiveResponse(lambdaResponse, context);
    } catch (error) {
      this.didEncounterError(error);
      throw error;
    }
  }

  async didReceiveResponse(response, _context) {
    if (
      response.StatusCode &&
      response.StatusCode >= 200 &&
      response.StatusCode < 300
    ) {
      console.log(response);
      return this.parseBody(response);
    } else {
      throw await this.errorFromResponse(response);
    }
  }

  didEncounterError(error) {
    console.warn("DS error", error);
    throw error;
  }

  parseBody(response) {
    if (typeof response.Payload === "undefined") {
      return {};
    }
    const payload = JSON.parse(response.Payload.toString());
    return JSON.parse(payload.body);
  }

  async errorFromResponse(response) {
    const message = `unexpected error`;
    let error;
    if (response.StatusCode === 401) {
      error = new AuthenticationError(message);
    } else if (response.StatusCode === 403) {
      error = new ForbiddenError(message);
    } else {
      error = new ApolloError(message);
    }
    const body = this.parseBody(response);
    Object.assign(error.extensions, {
      response: {
        status: response.StatusCode,
        body
      }
    });
    return error;
  }
}

exports.LambdaGraphQLDataSource = LambdaGraphQLDataSource;
