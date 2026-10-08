#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>
#include "cJSON.h"
#include "db.h"
#include "router.h"

static const char *CORS_HEADERS =
    "Access-Control-Allow-Origin: *\r\n"
    "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n"
    "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";

static void make_response(char *resp, int max_len, int code, const char *status_text, const char *json_body) {
    int body_len = json_body ? (int)strlen(json_body) : 0;
    snprintf(resp, max_len,
        "HTTP/1.1 %d %s\r\n"
        "%s"
        "Content-Type: application/json\r\n"
        "Content-Length: %d\r\n"
        "Connection: close\r\n\r\n"
        "%s",
        code, status_text, CORS_HEADERS, body_len, json_body ? json_body : ""
    );
}

static int calculate_reward_points(const char *waste_type, double weight_kg) {
    if (weight_kg <= 0) return 0;
    int rate = 5;
    if (strcasecmp(waste_type, "Plastic") == 0) rate = 15;
    else if (strcasecmp(waste_type, "Metal") == 0) rate = 20;
    else if (strcasecmp(waste_type, "Paper") == 0) rate = 10;
    else if (strcasecmp(waste_type, "Glass") == 0) rate = 10;
    else if (strcasecmp(waste_type, "Organic") == 0) rate = 5;

    return (int)round(weight_kg * rate);
}

static char *get_current_timestamp() {
    static char buf[64];
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M", t);
    return buf;
}

int process_http_request(const char *req, char *resp, int max_resp_len) {
    char method[16], path[256], protocol[16];
    if (sscanf(req, "%15s %255s %15s", method, path, protocol) < 2) {
        make_response(resp, max_resp_len, 400, "Bad Request", "{\"error\":\"Invalid HTTP request\"}");
        return (int)strlen(resp);
    }

    if (strcmp(method, "OPTIONS") == 0) {
        snprintf(resp, max_resp_len,
            "HTTP/1.1 204 No Content\r\n"
            "%s"
            "Content-Length: 0\r\n"
            "Connection: close\r\n\r\n",
            CORS_HEADERS
        );
        return (int)strlen(resp);
    }

    const char *body_ptr = strstr(req, "\r\n\r\n");
    if (body_ptr) {
        body_ptr += 4;
    } else {
        body_ptr = strstr(req, "\n\n");
        if (body_ptr) body_ptr += 2;
    }

    cJSON *body_json = NULL;
    if (body_ptr && *body_ptr != '\0') {
        body_json = cJSON_Parse(body_ptr);
        if (!body_json) {
            const char *json_start = strpbrk(body_ptr, "{[");
            if (json_start) {
                body_json = cJSON_Parse(json_start);
            }
        }
    }

    // --- 1. AUTHENTICATION & REGISTRATION ---
    if (strcmp(path, "/api/auth/register") == 0 && strcmp(method, "POST") == 0) {
        if (!body_json) {
            make_response(resp, max_resp_len, 400, "Bad Request", "{\"error\":\"Missing JSON body\"}");
            return (int)strlen(resp);
        }

        cJSON *users = db_load_file("users.json");
        cJSON *new_user = cJSON_Duplicate(body_json, 1);

        char user_id[64];
        snprintf(user_id, sizeof(user_id), "USR-%d", 100 + cJSON_GetArraySize(users) + 1);
        cJSON_AddItemToObject(new_user, "id", cJSON_CreateString(user_id));
        cJSON_AddItemToObject(new_user, "role", cJSON_CreateString("user"));
        cJSON_AddItemToObject(new_user, "rewardPoints", cJSON_CreateNumber(0));

        cJSON_AddItemToArray(users, new_user);
        db_save_file("users.json", users);

        char *res_str = cJSON_PrintUnformatted(new_user);
        make_response(resp, max_resp_len, 201, "Created", res_str);
        if (res_str) free(res_str);

        cJSON_Delete(users);
        cJSON_Delete(body_json);
        return (int)strlen(resp);
    }

    if (strcmp(path, "/api/auth/quick-login") == 0 || strcmp(path, "/api/auth/login") == 0) {
        char role[32] = "user";
        char email[128] = "";

        if (body_json) {
            cJSON *r = cJSON_GetObjectItem(body_json, "role");
            if (r && r->valuestring) strncpy(role, r->valuestring, sizeof(role));
            cJSON *e = cJSON_GetObjectItem(body_json, "email");
            if (e && e->valuestring) strncpy(email, e->valuestring, sizeof(email));
        }

        cJSON *users = db_load_file("users.json");
        cJSON *target_user = NULL;
        cJSON *user_item;

        cJSON_ArrayForEach(user_item, users) {
            cJSON *u_email = cJSON_GetObjectItem(user_item, "email");
            cJSON *u_role = cJSON_GetObjectItem(user_item, "role");
            if (email[0] != '\0' && u_email && u_email->valuestring && strcasecmp(u_email->valuestring, email) == 0) {
                target_user = user_item;
                break;
            }
            if (email[0] == '\0' && u_role && u_role->valuestring && strcasecmp(u_role->valuestring, role) == 0) {
                target_user = user_item;
                break;
            }
        }

        if (!target_user && cJSON_GetArraySize(users) > 0) {
            target_user = cJSON_GetArrayItem(users, 0);
        }

        char *res_str = cJSON_PrintUnformatted(target_user);
        make_response(resp, max_resp_len, 200, "OK", res_str);
        if (res_str) free(res_str);
        cJSON_Delete(users);
        if (body_json) cJSON_Delete(body_json);
        return (int)strlen(resp);
    }

    // --- 2. USERS CRUD (/api/users) ---
    if (strncmp(path, "/api/users", 10) == 0) {
        cJSON *users = db_load_file("users.json");

        if (strcmp(method, "GET") == 0) {
            char *res_str = cJSON_PrintUnformatted(users);
            make_response(resp, max_resp_len, 200, "OK", res_str);
            if (res_str) free(res_str);
        } else if (strcmp(method, "POST") == 0 && body_json) {
            cJSON *new_u = cJSON_Duplicate(body_json, 1);
            char u_id[64];
            snprintf(u_id, sizeof(u_id), "USR-%d", 100 + cJSON_GetArraySize(users) + 1);
            cJSON_AddItemToObject(new_u, "id", cJSON_CreateString(u_id));
            cJSON_AddItemToArray(users, new_u);
            db_save_file("users.json", users);

            char *res_str = cJSON_PrintUnformatted(new_u);
            make_response(resp, max_resp_len, 201, "Created", res_str);
            if (res_str) free(res_str);
        } else if (strcmp(method, "DELETE") == 0 && strncmp(path, "/api/users/", 11) == 0) {
            const char *del_id = path + 11;
            cJSON *new_arr = cJSON_CreateArray();
            cJSON *item;
            cJSON_ArrayForEach(item, users) {
                cJSON *id_obj = cJSON_GetObjectItem(item, "id");
                if (!id_obj || !id_obj->valuestring || strcmp(id_obj->valuestring, del_id) != 0) {
                    cJSON_AddItemToArray(new_arr, cJSON_Duplicate(item, 1));
                }
            }
            db_save_file("users.json", new_arr);
            make_response(resp, max_resp_len, 200, "OK", "{\"message\":\"User deleted\"}");
            cJSON_Delete(new_arr);
        }

        cJSON_Delete(users);
        if (body_json) cJSON_Delete(body_json);
        return (int)strlen(resp);
    }

    // --- 3. REQUESTS FLOW (/api/requests) ---
    if (strncmp(path, "/api/requests", 13) == 0 && strcmp(method, "GET") == 0) {
        cJSON *requests = db_load_file("requests.json");
        char *res_str = cJSON_PrintUnformatted(requests);
        make_response(resp, max_resp_len, 200, "OK", res_str);
        if (res_str) free(res_str);
        cJSON_Delete(requests);
        if (body_json) cJSON_Delete(body_json);
        return (int)strlen(resp);
    }

    if (strcmp(path, "/api/requests") == 0 && strcmp(method, "POST") == 0) {
        if (!body_json) {
            make_response(resp, max_resp_len, 400, "Bad Request", "{\"error\":\"Missing JSON body\"}");
            return (int)strlen(resp);
        }

        cJSON *requests = db_load_file("requests.json");
        cJSON *new_req = cJSON_Duplicate(body_json, 1);

        char new_id[64];
        snprintf(new_id, sizeof(new_id), "REQ-%d", 8000 + cJSON_GetArraySize(requests) + 1);
        cJSON_AddItemToObject(new_req, "id", cJSON_CreateString(new_id));
        cJSON_AddItemToObject(new_req, "status", cJSON_CreateString("Pending"));
        cJSON_AddItemToObject(new_req, "actualWeightKg", cJSON_CreateNumber(0.0));
        cJSON_AddItemToObject(new_req, "rewardPointsEarned", cJSON_CreateNumber(0));
        cJSON_AddItemToObject(new_req, "collectorId", cJSON_CreateString(""));
        cJSON_AddItemToObject(new_req, "truckId", cJSON_CreateString(""));
        cJSON_AddItemToObject(new_req, "createdAt", cJSON_CreateString(get_current_timestamp()));

        cJSON_AddItemToArray(requests, new_req);
        db_save_file("requests.json", requests);

        char *res_str = cJSON_PrintUnformatted(new_req);
        make_response(resp, max_resp_len, 201, "Created", res_str);
        if (res_str) free(res_str);

        cJSON_Delete(requests);
        cJSON_Delete(body_json);
        return (int)strlen(resp);
    }

    if (strncmp(path, "/api/requests/", 14) == 0 && strcmp(method, "PUT") == 0) {
        const char *req_id = path + 14;
        if (!body_json) {
            make_response(resp, max_resp_len, 400, "Bad Request", "{\"error\":\"Missing body\"}");
            return (int)strlen(resp);
        }

        cJSON *requests = db_load_file("requests.json");
        cJSON *target = NULL;
        cJSON *item;

        cJSON_ArrayForEach(item, requests) {
            cJSON *id_obj = cJSON_GetObjectItem(item, "id");
            if (id_obj && id_obj->valuestring && strcmp(id_obj->valuestring, req_id) == 0) {
                target = item;
                break;
            }
        }

        if (!target) {
            cJSON_Delete(requests);
            cJSON_Delete(body_json);
            make_response(resp, max_resp_len, 404, "Not Found", "{\"error\":\"Request not found\"}");
            return (int)strlen(resp);
        }

        cJSON *field = body_json->child;
        while (field) {
            if (cJSON_HasObjectItem(target, field->string)) {
                cJSON_DeleteItemFromObjectCaseSensitive(target, field->string);
            }
            cJSON_AddItemToObject(target, field->string, cJSON_Duplicate(field, 1));
            field = field->next;
        }

        db_save_file("requests.json", requests);

        char *res_str = cJSON_PrintUnformatted(target);
        make_response(resp, max_resp_len, 200, "OK", res_str);
        if (res_str) free(res_str);

        cJSON_Delete(requests);
        cJSON_Delete(body_json);
        return (int)strlen(resp);
    }

    // --- 4. BINS CRUD (/api/bins) ---
    if (strncmp(path, "/api/bins", 9) == 0) {
        cJSON *bins = db_load_file("bins.json");

        if (strcmp(method, "GET") == 0) {
            char *res_str = cJSON_PrintUnformatted(bins);
            make_response(resp, max_resp_len, 200, "OK", res_str);
            if (res_str) free(res_str);
        } else if (strcmp(method, "POST") == 0 && body_json) {
            cJSON *new_bin = cJSON_Duplicate(body_json, 1);
            char bin_id[64];
            snprintf(bin_id, sizeof(bin_id), "BIN-%d", 1000 + cJSON_GetArraySize(bins) + 1);
            cJSON_AddItemToObject(new_bin, "id", cJSON_CreateString(bin_id));
            cJSON_AddItemToArray(bins, new_bin);
            db_save_file("bins.json", bins);

            char *res_str = cJSON_PrintUnformatted(new_bin);
            make_response(resp, max_resp_len, 201, "Created", res_str);
            if (res_str) free(res_str);
        } else if (strcmp(method, "PUT") == 0 && body_json && strncmp(path, "/api/bins/", 10) == 0) {
            const char *bin_id = path + 10;
            cJSON *item;
            cJSON_ArrayForEach(item, bins) {
                cJSON *id_obj = cJSON_GetObjectItem(item, "id");
                if (id_obj && id_obj->valuestring && strcmp(id_obj->valuestring, bin_id) == 0) {
                    cJSON *f = body_json->child;
                    while (f) {
                        if (cJSON_HasObjectItem(item, f->string)) cJSON_DeleteItemFromObjectCaseSensitive(item, f->string);
                        cJSON_AddItemToObject(item, f->string, cJSON_Duplicate(f, 1));
                        f = f->next;
                    }
                    break;
                }
            }
            db_save_file("bins.json", bins);
            char *res_str = cJSON_PrintUnformatted(bins);
            make_response(resp, max_resp_len, 200, "OK", res_str);
            if (res_str) free(res_str);
        } else if (strcmp(method, "DELETE") == 0 && strncmp(path, "/api/bins/", 10) == 0) {
            const char *del_id = path + 10;
            cJSON *new_arr = cJSON_CreateArray();
            cJSON *item;
            cJSON_ArrayForEach(item, bins) {
                cJSON *id_obj = cJSON_GetObjectItem(item, "id");
                if (!id_obj || !id_obj->valuestring || strcmp(id_obj->valuestring, del_id) != 0) {
                    cJSON_AddItemToArray(new_arr, cJSON_Duplicate(item, 1));
                }
            }
            db_save_file("bins.json", new_arr);
            make_response(resp, max_resp_len, 200, "OK", "{\"message\":\"Bin deleted\"}");
            cJSON_Delete(new_arr);
        }

        cJSON_Delete(bins);
        if (body_json) cJSON_Delete(body_json);
        return (int)strlen(resp);
    }

    // --- 5. TRUCKS CRUD (/api/trucks) ---
    if (strncmp(path, "/api/trucks", 11) == 0) {
        cJSON *trucks = db_load_file("trucks.json");
        if (strcmp(method, "GET") == 0) {
            char *res_str = cJSON_PrintUnformatted(trucks);
            make_response(resp, max_resp_len, 200, "OK", res_str);
            if (res_str) free(res_str);
        } else if (strcmp(method, "POST") == 0 && body_json) {
            cJSON *new_t = cJSON_Duplicate(body_json, 1);
            char t_id[64];
            snprintf(t_id, sizeof(t_id), "TRK-%d", 500 + cJSON_GetArraySize(trucks) + 1);
            cJSON_AddItemToObject(new_t, "id", cJSON_CreateString(t_id));
            cJSON_AddItemToArray(trucks, new_t);
            db_save_file("trucks.json", trucks);
            char *res_str = cJSON_PrintUnformatted(new_t);
            make_response(resp, max_resp_len, 201, "Created", res_str);
            if (res_str) free(res_str);
        } else if (strcmp(method, "DELETE") == 0 && strncmp(path, "/api/trucks/", 12) == 0) {
            const char *del_id = path + 12;
            cJSON *new_arr = cJSON_CreateArray();
            cJSON *item;
            cJSON_ArrayForEach(item, trucks) {
                cJSON *id_obj = cJSON_GetObjectItem(item, "id");
                if (!id_obj || !id_obj->valuestring || strcmp(id_obj->valuestring, del_id) != 0) {
                    cJSON_AddItemToArray(new_arr, cJSON_Duplicate(item, 1));
                }
            }
            db_save_file("trucks.json", new_arr);
            make_response(resp, max_resp_len, 200, "OK", "{\"message\":\"Truck deleted\"}");
            cJSON_Delete(new_arr);
        }
        cJSON_Delete(trucks);
        if (body_json) cJSON_Delete(body_json);
        return (int)strlen(resp);
    }

    // --- 6. COLLECTORS CRUD (/api/collectors) ---
    if (strncmp(path, "/api/collectors", 15) == 0) {
        cJSON *collectors = db_load_file("collectors.json");
        if (strcmp(method, "GET") == 0) {
            char *res_str = cJSON_PrintUnformatted(collectors);
            make_response(resp, max_resp_len, 200, "OK", res_str);
            if (res_str) free(res_str);
        } else if (strcmp(method, "POST") == 0 && body_json) {
            cJSON *new_c = cJSON_Duplicate(body_json, 1);
            char c_id[64];
            snprintf(c_id, sizeof(c_id), "COL-%d", 200 + cJSON_GetArraySize(collectors) + 1);
            cJSON_AddItemToObject(new_c, "id", cJSON_CreateString(c_id));
            cJSON_AddItemToObject(new_c, "role", cJSON_CreateString("collector"));
            cJSON_AddItemToArray(collectors, new_c);
            db_save_file("collectors.json", collectors);

            char *res_str = cJSON_PrintUnformatted(new_c);
            make_response(resp, max_resp_len, 201, "Created", res_str);
            if (res_str) free(res_str);
        } else if (strcmp(method, "DELETE") == 0 && strncmp(path, "/api/collectors/", 16) == 0) {
            const char *del_id = path + 16;
            cJSON *new_arr = cJSON_CreateArray();
            cJSON *item;
            cJSON_ArrayForEach(item, collectors) {
                cJSON *id_obj = cJSON_GetObjectItem(item, "id");
                if (!id_obj || !id_obj->valuestring || strcmp(id_obj->valuestring, del_id) != 0) {
                    cJSON_AddItemToArray(new_arr, cJSON_Duplicate(item, 1));
                }
            }
            db_save_file("collectors.json", new_arr);
            make_response(resp, max_resp_len, 200, "OK", "{\"message\":\"Collector deleted\"}");
            cJSON_Delete(new_arr);
        }

        cJSON_Delete(collectors);
        if (body_json) cJSON_Delete(body_json);
        return (int)strlen(resp);
    }

    // --- 7. ROUTES GENERATION & LEAFLET ROUTE (/api/routes) ---
    if (strncmp(path, "/api/routes", 11) == 0) {
        cJSON *routes = db_load_file("routes.json");
        if (strcmp(method, "GET") == 0) {
            char *res_str = cJSON_PrintUnformatted(routes);
            make_response(resp, max_resp_len, 200, "OK", res_str);
            if (res_str) free(res_str);
        } else if (strcmp(method, "POST") == 0 && body_json) {
            cJSON *new_r = cJSON_Duplicate(body_json, 1);
            char r_id[64];
            snprintf(r_id, sizeof(r_id), "RTE-%d", 700 + cJSON_GetArraySize(routes) + 1);
            cJSON_AddItemToObject(new_r, "id", cJSON_CreateString(r_id));
            cJSON_AddItemToObject(new_r, "status", cJSON_CreateString("Active"));
            cJSON_AddItemToArray(routes, new_r);
            db_save_file("routes.json", routes);

            char *res_str = cJSON_PrintUnformatted(new_r);
            make_response(resp, max_resp_len, 201, "Created", res_str);
            if (res_str) free(res_str);
        }
        cJSON_Delete(routes);
        if (body_json) cJSON_Delete(body_json);
        return (int)strlen(resp);
    }

    // --- 8. TASK ACTIONS (/api/tasks/complete) ---
    if (strcmp(path, "/api/tasks/complete") == 0 && strcmp(method, "POST") == 0) {
        if (!body_json) {
            make_response(resp, max_resp_len, 400, "Bad Request", "{\"error\":\"Missing task completion details\"}");
            return (int)strlen(resp);
        }

        cJSON *req_id_obj = cJSON_GetObjectItem(body_json, "requestId");
        cJSON *weight_obj = cJSON_GetObjectItem(body_json, "actualWeightKg");

        if (!req_id_obj || !req_id_obj->valuestring || !weight_obj || weight_obj->valuedouble < 0) {
            make_response(resp, max_resp_len, 400, "Bad Request", "{\"error\":\"Invalid request ID or weight (must be >= 0)\"}");
            if (body_json) cJSON_Delete(body_json);
            return (int)strlen(resp);
        }

        double actual_weight = weight_obj->valuedouble;
        const char *req_id = req_id_obj->valuestring;

        cJSON *requests = db_load_file("requests.json");
        cJSON *target_req = NULL;
        cJSON *item;

        cJSON_ArrayForEach(item, requests) {
            cJSON *id_o = cJSON_GetObjectItem(item, "id");
            if (id_o && id_o->valuestring && strcmp(id_o->valuestring, req_id) == 0) {
                target_req = item;
                break;
            }
        }

        if (!target_req) {
            cJSON_Delete(requests);
            cJSON_Delete(body_json);
            make_response(resp, max_resp_len, 404, "Not Found", "{\"error\":\"Request not found\"}");
            return (int)strlen(resp);
        }

        cJSON *waste_type_obj = cJSON_GetObjectItem(target_req, "wasteType");
        const char *w_type = (waste_type_obj && waste_type_obj->valuestring) ? waste_type_obj->valuestring : "General";
        int earned_pts = calculate_reward_points(w_type, actual_weight);

        cJSON_DeleteItemFromObjectCaseSensitive(target_req, "status");
        cJSON_AddItemToObject(target_req, "status", cJSON_CreateString("Completed"));
        cJSON_DeleteItemFromObjectCaseSensitive(target_req, "actualWeightKg");
        cJSON_AddItemToObject(target_req, "actualWeightKg", cJSON_CreateNumber(actual_weight));
        cJSON_DeleteItemFromObjectCaseSensitive(target_req, "rewardPointsEarned");
        cJSON_AddItemToObject(target_req, "rewardPointsEarned", cJSON_CreateNumber(earned_pts));

        db_save_file("requests.json", requests);

        cJSON *user_id_obj = cJSON_GetObjectItem(target_req, "userId");
        if (user_id_obj && user_id_obj->valuestring) {
            cJSON *users = db_load_file("users.json");
            cJSON *u_item;
            cJSON_ArrayForEach(u_item, users) {
                cJSON *uid = cJSON_GetObjectItem(u_item, "id");
                if (uid && uid->valuestring && strcmp(uid->valuestring, user_id_obj->valuestring) == 0) {
                    cJSON *pts_item = cJSON_GetObjectItem(u_item, "rewardPoints");
                    int cur_pts = pts_item ? pts_item->valueint : 0;
                    cJSON_DeleteItemFromObjectCaseSensitive(u_item, "rewardPoints");
                    cJSON_AddItemToObject(u_item, "rewardPoints", cJSON_CreateNumber(cur_pts + earned_pts));
                    break;
                }
            }
            db_save_file("users.json", users);
            cJSON_Delete(users);

            cJSON *rewards = db_load_file("rewards.json");
            cJSON *new_rwd = cJSON_CreateObject();
            char rwd_id[64];
            snprintf(rwd_id, sizeof(rwd_id), "RWD-%d", 300 + cJSON_GetArraySize(rewards) + 1);
            cJSON_AddItemToObject(new_rwd, "id", cJSON_CreateString(rwd_id));
            cJSON_AddItemToObject(new_rwd, "userId", cJSON_CreateString(user_id_obj->valuestring));
            cJSON_AddItemToObject(new_rwd, "requestId", cJSON_CreateString(req_id));
            cJSON_AddItemToObject(new_rwd, "wasteType", cJSON_CreateString(w_type));
            cJSON_AddItemToObject(new_rwd, "actualWeightKg", cJSON_CreateNumber(actual_weight));
            cJSON_AddItemToObject(new_rwd, "pointsEarned", cJSON_CreateNumber(earned_pts));
            cJSON_AddItemToObject(new_rwd, "date", cJSON_CreateString(get_current_timestamp()));

            cJSON_AddItemToArray(rewards, new_rwd);
            db_save_file("rewards.json", rewards);
            cJSON_Delete(rewards);
        }

        char *res_str = cJSON_PrintUnformatted(target_req);
        make_response(resp, max_resp_len, 200, "OK", res_str);
        if (res_str) free(res_str);

        cJSON_Delete(requests);
        cJSON_Delete(body_json);
        return (int)strlen(resp);
    }

    // --- 9. PROBLEMS FLOW (/api/problems) ---
    if (strncmp(path, "/api/problems", 13) == 0) {
        cJSON *problems = db_load_file("problems.json");

        if (strcmp(method, "GET") == 0) {
            char *res_str = cJSON_PrintUnformatted(problems);
            make_response(resp, max_resp_len, 200, "OK", res_str);
            if (res_str) free(res_str);
        } else if (strcmp(method, "POST") == 0 && body_json) {
            cJSON *new_p = cJSON_Duplicate(body_json, 1);
            char p_id[64];
            snprintf(p_id, sizeof(p_id), "PRB-%d", 900 + cJSON_GetArraySize(problems) + 1);
            cJSON_AddItemToObject(new_p, "id", cJSON_CreateString(p_id));
            cJSON_AddItemToObject(new_p, "status", cJSON_CreateString("Investigating"));
            cJSON_AddItemToObject(new_p, "createdAt", cJSON_CreateString(get_current_timestamp()));

            cJSON_AddItemToArray(problems, new_p);
            db_save_file("problems.json", problems);

            char *res_str = cJSON_PrintUnformatted(new_p);
            make_response(resp, max_resp_len, 201, "Created", res_str);
            if (res_str) free(res_str);
        } else if (strcmp(method, "PUT") == 0 && body_json && strncmp(path, "/api/problems/", 14) == 0) {
            const char *prob_id = path + 14;
            cJSON *item;
            cJSON_ArrayForEach(item, problems) {
                cJSON *id_obj = cJSON_GetObjectItem(item, "id");
                if (id_obj && id_obj->valuestring && strcmp(id_obj->valuestring, prob_id) == 0) {
                    cJSON *status_obj = cJSON_GetObjectItem(body_json, "status");
                    if (status_obj && status_obj->valuestring) {
                        cJSON_DeleteItemFromObjectCaseSensitive(item, "status");
                        cJSON_AddItemToObject(item, "status", cJSON_CreateString(status_obj->valuestring));
                    }
                    break;
                }
            }
            db_save_file("problems.json", problems);
            char *res_str = cJSON_PrintUnformatted(problems);
            make_response(resp, max_resp_len, 200, "OK", res_str);
            if (res_str) free(res_str);
        }

        cJSON_Delete(problems);
        if (body_json) cJSON_Delete(body_json);
        return (int)strlen(resp);
    }

    // --- 10. REPORTS ENGINE (/api/reports) ---
    if (strncmp(path, "/api/reports", 12) == 0 && strcmp(method, "GET") == 0) {
        cJSON *requests = db_load_file("requests.json");
        cJSON *bins = db_load_file("bins.json");
        cJSON *trucks = db_load_file("trucks.json");
        cJSON *rewards = db_load_file("rewards.json");
        cJSON *users = db_load_file("users.json");

        int total_requests = cJSON_GetArraySize(requests);
        int completed_requests = 0;
        double total_waste_kg = 0;
        int total_reward_points = 0;

        cJSON *item;
        cJSON_ArrayForEach(item, requests) {
            cJSON *st = cJSON_GetObjectItem(item, "status");
            cJSON *wt = cJSON_GetObjectItem(item, "actualWeightKg");
            cJSON *pt = cJSON_GetObjectItem(item, "rewardPointsEarned");
            if (st && st->valuestring && strcmp(st->valuestring, "Completed") == 0) {
                completed_requests++;
                if (wt) total_waste_kg += wt->valuedouble;
                if (pt) total_reward_points += pt->valueint;
            }
        }

        cJSON *report_obj = cJSON_CreateObject();
        cJSON_AddItemToObject(report_obj, "totalRequests", cJSON_CreateNumber(total_requests));
        cJSON_AddItemToObject(report_obj, "completedRequests", cJSON_CreateNumber(completed_requests));
        cJSON_AddItemToObject(report_obj, "totalWasteCollectedKg", cJSON_CreateNumber(total_waste_kg));
        cJSON_AddItemToObject(report_obj, "totalRewardPointsIssued", cJSON_CreateNumber(total_reward_points));
        cJSON_AddItemToObject(report_obj, "activeBinsCount", cJSON_CreateNumber(cJSON_GetArraySize(bins)));
        cJSON_AddItemToObject(report_obj, "activeTrucksCount", cJSON_CreateNumber(cJSON_GetArraySize(trucks)));
        cJSON_AddItemToObject(report_obj, "registeredUsersCount", cJSON_CreateNumber(cJSON_GetArraySize(users)));

        char *res_str = cJSON_PrintUnformatted(report_obj);
        make_response(resp, max_resp_len, 200, "OK", res_str);

        if (res_str) free(res_str);
        cJSON_Delete(report_obj);
        cJSON_Delete(requests);
        cJSON_Delete(bins);
        cJSON_Delete(trucks);
        cJSON_Delete(rewards);
        cJSON_Delete(users);
        if (body_json) cJSON_Delete(body_json);
        return (int)strlen(resp);
    }

    make_response(resp, max_resp_len, 404, "Not Found", "{\"error\":\"API route not found\"}");
    if (body_json) cJSON_Delete(body_json);
    return (int)strlen(resp);
}
