const express = require('express');
const app = express();


app.get('/status-info', (req, res) => {
  const code = parseInt(req.query.code);

  
  const statusCodes = {
      200: "OK: The request has succeeded.",
      201: "Created: A new resource has been successfully created.",
      204: "No Content: The request was successful but has no response body.",
      400: "Bad Request: The request was malformed or invalid.",
      401: "Unauthorized: Authentication is required.",
      403: "Forbidden: The server understood but refuses to authorize it.",
      404: "Not Found: The requested resource was not found.",
      405: "Method Not Allowed: The HTTP method is not allowed for the resource.",
      429: "Too Many Requests: You have sent too many requests in a given time.",
      500: "Internal Server Error: The server encountered an unexpected error.",
      502: "Bad Gateway: The server received an invalid response from an upstream server.",
      503: "Service Unavailable: The server is temporarily unavailable.",
      504: "Gateway Timeout: The server did not receive a timely response."
  };

 
  if (!code || !statusCodes[code]) {
      return res.status(400).json({
          error: "Invalid or missing status code. Please provide a valid HTTP status code."
      });
  }


  res.json({
      status: code,
      message: statusCodes[code]
  });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
