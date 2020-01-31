import http from "k6/http";
import { check } from "k6";

let query = `
{
  topProducts{
    name
    inStock
    reviews{
      body
      author{
        username
      }
    }
  }
}`;

let headers = {
  "Content-Type": "application/json"
};

const fedHTTP = "https://5ps4c076ve.execute-api.us-east-1.amazonaws.com/";
const fedREST = "https://pssjgo6lci.execute-api.us-east-1.amazonaws.com/prod/";

export default function() {
  let res = http.post(fedREST, JSON.stringify({ query: query }), {
    headers: headers
  });

  if (res.status === 200) {
    let body = JSON.parse(res.body);
    console.log(JSON.stringify(body, null, 2));
  }

  check(res, {
    "query results in 200": r => r.status === 200
  });
}
