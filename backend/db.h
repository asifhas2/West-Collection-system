#ifndef DB_H
#define DB_H

#include "cJSON.h"

// Load JSON file into cJSON object
cJSON *db_load_file(const char *filename);

// Save cJSON object to file & sync to MongoDB Atlas Cluster0
int db_save_file(const char *filename, const cJSON *json);

// Generate unique ID with prefix
char *db_generate_id(const char *prefix);

// Get MongoDB Atlas connection status info string
const char *db_get_mongodb_status(void);

#endif
