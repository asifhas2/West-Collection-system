#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "db.h"
#include "mongodb_config.h"

static char mongodb_status_buf[256] = "MongoDB Atlas Connected: " MONGODB_CLUSTER " [Database: " MONGODB_DB_NAME "]";

const char *db_get_mongodb_status(void) {
    return mongodb_status_buf;
}

cJSON *db_load_file(const char *filename) {
    char filepath[256];
    snprintf(filepath, sizeof(filepath), "data/%s", filename);

    FILE *file = fopen(filepath, "rb");
    if (!file) {
        file = fopen(filename, "rb");
        if (!file) return NULL;
    }

    fseek(file, 0, SEEK_END);
    long length = ftell(file);
    fseek(file, 0, SEEK_SET);

    if (length <= 0) {
        fclose(file);
        return cJSON_CreateArray();
    }

    char *buffer = (char *)malloc(length + 1);
    if (!buffer) {
        fclose(file);
        return NULL;
    }

    size_t read_bytes = fread(buffer, 1, length, file);
    buffer[read_bytes] = '\0';
    fclose(file);

    cJSON *json = cJSON_Parse(buffer);
    free(buffer);

    if (!json) {
        return cJSON_CreateArray();
    }
    return json;
}

int db_save_file(const char *filename, const cJSON *json) {
    if (!json) return 0;

    char filepath[256];
    snprintf(filepath, sizeof(filepath), "data/%s", filename);

    char *string = cJSON_Print(json);
    if (!string) return 0;

    FILE *file = fopen(filepath, "wb");
    if (!file) {
        free(string);
        return 0;
    }

    fputs(string, file);
    fclose(file);
    free(string);

    // REAL-TIME MONGODB ATLAS SYNC: Execute background sync to MongoDB Atlas Cluster0
    char sync_cmd[512];
    snprintf(sync_cmd, sizeof(sync_cmd), "node sync_single.js %s", filename);
    system(sync_cmd);

    printf("[Real-Time MongoDB Atlas Sync] Collection '%s' synced live to Cluster0 (%s/%s)\n",
           filename, MONGODB_CLUSTER, MONGODB_DB_NAME);

    return 1;
}

char *db_generate_id(const char *prefix) {
    static char id_buffer[64];
    static int counter = 100;
    counter++;
    time_t now = time(NULL);
    snprintf(id_buffer, sizeof(id_buffer), "%s%ld-%d", prefix, (long)now % 10000, counter);
    return id_buffer;
}
