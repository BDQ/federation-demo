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

const url = "SETMETOSOMETHING";

export default function() {
  let res = http.post(url, JSON.stringify({ query: query }), {
    headers: headers
  });

  if (res.status === 200) {
    let body = JSON.parse(res.body);

    check(body, {
      "ensure 3 products returned": b => b.data.topProducts.length === 3
    });
  }

  check(res, {
    "query results in 200": r => r.status === 200
  });
}
