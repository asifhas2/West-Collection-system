#ifndef ROUTER_H
#define ROUTER_H

// Process incoming HTTP request buffer and format HTTP response buffer
// Returns response string length
int process_http_request(const char *request_buf, char *response_buf, int max_resp_len);

#endif
