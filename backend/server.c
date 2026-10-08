#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#endif

#include "router.h"
#include "db.h"
#include "mongodb_config.h"

#define PORT 8080
#define BUFFER_SIZE 65536

int main(void) {
    printf("============================================================\n");
    printf(" Smart Waste Collection & Reward System — Pure C REST Server\n");
    printf(" Port: %d\n", PORT);
    printf(" Database: MongoDB Atlas Cluster0 (%s)\n", MONGODB_CLUSTER);
    printf(" URI: %s\n", MONGODB_URI);
    printf("============================================================\n\n");

#ifdef _WIN32
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        printf("[-] Failed to initialize Winsock.\n");
        return 1;
    }
#endif

    SOCKET server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd == INVALID_SOCKET) {
        printf("[-] Socket creation failed.\n");
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, (const char *)&opt, sizeof(opt));

    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);

    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) == SOCKET_ERROR) {
        printf("[-] Bind failed on port %d.\n", PORT);
#ifdef _WIN32
        closesocket(server_fd);
        WSACleanup();
#endif
        return 1;
    }

    if (listen(server_fd, 10) == SOCKET_ERROR) {
        printf("[-] Listen failed.\n");
#ifdef _WIN32
        closesocket(server_fd);
        WSACleanup();
#endif
        return 1;
    }

    printf("[+] C REST Server running at http://localhost:%d/\n", PORT);
    printf("[+] %s\n", db_get_mongodb_status());
    printf("[+] Ready for HTTP REST requests from React Frontend...\n\n");

    char *req_buffer = (char *)malloc(BUFFER_SIZE);
    char *resp_buffer = (char *)malloc(BUFFER_SIZE);

    if (!req_buffer || !resp_buffer) {
        printf("[-] Memory allocation failed.\n");
        return 1;
    }

    while (1) {
        struct sockaddr_in client_addr;
        int addrlen = sizeof(client_addr);
        SOCKET client_fd = accept(server_fd, (struct sockaddr *)&client_addr, &addrlen);

        if (client_fd == INVALID_SOCKET) {
            continue;
        }

        memset(req_buffer, 0, BUFFER_SIZE);
        int bytes_received = recv(client_fd, req_buffer, BUFFER_SIZE - 1, 0);

        if (bytes_received > 0) {
            req_buffer[bytes_received] = '\0';
            memset(resp_buffer, 0, BUFFER_SIZE);

            int resp_len = process_http_request(req_buffer, resp_buffer, BUFFER_SIZE);
            send(client_fd, resp_buffer, resp_len, 0);
        }

#ifdef _WIN32
        closesocket(client_fd);
#else
        close(client_fd);
#endif
    }

    free(req_buffer);
    free(resp_buffer);

#ifdef _WIN32
    closesocket(server_fd);
    WSACleanup();
#endif

    return 0;
}
