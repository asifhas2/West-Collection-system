/*
  cJSON implementation - Lightweight ANSI C JSON parser
*/

#include <string.h>
#include <stdio.h>
#include <math.h>
#include <stdlib.h>
#include <limits.h>
#include <ctype.h>
#include "cJSON.h"

static const char *global_ep;

static void *(*cJSON_malloc)(size_t sz) = malloc;
static void (*cJSON_free)(void *ptr) = free;

static char* cJSON_strdup(const char* str) {
    size_t len;
    char* copy;
    if (!str) return NULL;
    len = strlen(str) + 1;
    if (!(copy = (char*)cJSON_malloc(len))) return NULL;
    memcpy(copy, str, len);
    return copy;
}

static cJSON *cJSON_New_Item(void) {
    cJSON* node = (cJSON*)cJSON_malloc(sizeof(cJSON));
    if (node) memset(node, 0, sizeof(cJSON));
    return node;
}

void cJSON_Delete(cJSON *c) {
    cJSON *next;
    while (c) {
        next = c->next;
        if (!(c->type & cJSON_IsReference) && c->child) cJSON_Delete(c->child);
        if (!(c->type & cJSON_IsReference) && c->valuestring) cJSON_free(c->valuestring);
        if (!(c->type & cJSON_StringIsConst) && c->string) cJSON_free(c->string);
        cJSON_free(c);
        c = next;
    }
}

static const char *parse_number(cJSON *item, const char *num) {
    double n = 0, sign = 1, scale = 0;
    int subscale = 0, signsubscale = 1;

    if (*num == '-') sign = -1, num++;
    if (*num == '0') num++;
    if (*num >= '1' && *num <= '9') do n = (n * 10.0) + (*num - '0'), num++; while (*num >= '0' && *num <= '9');
    if (*num == '.' && num[1] >= '0' && num[1] <= '9') {
        num++;
        do n = (n * 10.0) + (*num - '0'), scale--, num++; while (*num >= '0' && *num <= '9');
    }
    if (*num == 'e' || *num == 'E') {
        num++;
        if (*num == '+') num++; else if (*num == '-') signsubscale = -1, num++;
        while (*num >= '0' && *num <= '9') subscale = (subscale * 10) + (*num - '0'), num++;
    }

    n = sign * n * pow(10.0, (scale + subscale * signsubscale));
    item->valuedouble = n;
    item->valueint = (int)n;
    item->type = cJSON_Number;
    return num;
}

static unsigned parse_hex4(const char *str) {
    unsigned h = 0;
    for (int i = 0; i < 4; i++) {
        if (*str >= '0' && *str <= '9') h = (h << 4) + (*str - '0');
        else if (*str >= 'A' && *str <= 'F') h = (h << 4) + 10 + (*str - 'A');
        else if (*str >= 'a' && *str <= 'f') h = (h << 4) + 10 + (*str - 'a');
        else return 0;
        str++;
    }
    return h;
}

static const char *parse_string(cJSON *item, const char *str) {
    const char *ptr = str + 1;
    char *ptr2;
    char *out;
    int len = 0;
    unsigned uc, uc2;
    if (*str != '\"') { global_ep = str; return 0; }

    while (*ptr != '\"' && *ptr && ++len) {
        if (*ptr++ == '\\') ptr++;
    }

    out = (char*)cJSON_malloc(len + 1);
    if (!out) return 0;

    ptr = str + 1;
    ptr2 = out;
    while (*ptr != '\"' && *ptr) {
        if (*ptr != '\\') *ptr2++ = *ptr++;
        else {
            ptr++;
            switch (*ptr) {
                case 'b': *ptr2++ = '\b'; break;
                case 'f': *ptr2++ = '\f'; break;
                case 'n': *ptr2++ = '\n'; break;
                case 'r': *ptr2++ = '\r'; break;
                case 't': *ptr2++ = '\t'; break;
                case 'u':
                    uc = parse_hex4(ptr + 1); ptr += 4;
                    if ((uc >= 0xD800 && uc <= 0xDBFF)) {
                        if (ptr[1] == '\\' && ptr[2] == 'u') {
                            uc2 = parse_hex4(ptr + 3); ptr += 6;
                            if (uc2 >= 0xDC00 && uc2 <= 0xDFFF) uc = 0x10000 + (((uc & 0x3FF) << 10) | (uc2 & 0x3FF));
                        }
                    }
                    if (uc < 0x80) *ptr2++ = (char)uc;
                    else if (uc < 0x800) { *ptr2++ = (char)(0xC0 | (uc >> 6)); *ptr2++ = (char)(0x80 | (uc & 0x3F)); }
                    else if (uc < 0x10000) { *ptr2++ = (char)(0xE0 | (uc >> 12)); *ptr2++ = (char)(0x80 | ((uc >> 6) & 0x3F)); *ptr2++ = (char)(0x80 | (uc & 0x3F)); }
                    else { *ptr2++ = (char)(0xF0 | (uc >> 18)); *ptr2++ = (char)(0x80 | ((uc >> 12) & 0x3F)); *ptr2++ = (char)(0x80 | ((uc >> 6) & 0x3F)); *ptr2++ = (char)(0x80 | (uc & 0x3F)); }
                    break;
                default: *ptr2++ = *ptr; break;
            }
            ptr++;
        }
    }
    *ptr2 = 0;
    if (*ptr == '\"') ptr++;
    item->valuestring = out;
    item->type = cJSON_String;
    return ptr;
}

static const char *skip(const char *in) {
    while (in && *in && (unsigned char)*in <= 32) in++;
    return in;
}

static const char *parse_value(cJSON *item, const char *value);
static const char *parse_array(cJSON *item, const char *value);
static const char *parse_object(cJSON *item, const char *value);

static const char *parse_value(cJSON *item, const char *value) {
    if (!value) return 0;
    if (!strncmp(value, "null", 4)) { item->type = cJSON_NULL; return value + 4; }
    if (!strncmp(value, "false", 5)) { item->type = cJSON_False; return value + 5; }
    if (!strncmp(value, "true", 4)) { item->type = cJSON_True; item->valueint = 1; return value + 4; }
    if (*value == '\"') { return parse_string(item, value); }
    if (*value == '-' || (*value >= '0' && *value <= '9')) { return parse_number(item, value); }
    if (*value == '[') { return parse_array(item, value); }
    if (*value == '{') { return parse_object(item, value); }

    global_ep = value;
    return 0;
}

static const char *parse_array(cJSON *item, const char *value) {
    cJSON *child;
    if (*value != '[') { global_ep = value; return 0; }

    item->type = cJSON_Array;
    value = skip(value + 1);
    if (*value == ']') return value + 1;

    item->child = child = cJSON_New_Item();
    if (!item->child) return 0;
    value = skip(parse_value(child, skip(value)));
    if (!value) return 0;

    while (*value == ',') {
        cJSON *new_item = cJSON_New_Item();
        if (!new_item) return 0;
        child->next = new_item;
        new_item->prev = child;
        child = new_item;
        value = skip(parse_value(child, skip(value + 1)));
        if (!value) return 0;
    }

    if (*value == ']') return value + 1;
    global_ep = value;
    return 0;
}

static const char *parse_object(cJSON *item, const char *value) {
    cJSON *child;
    if (*value != '{') { global_ep = value; return 0; }

    item->type = cJSON_Object;
    value = skip(value + 1);
    if (*value == '}') return value + 1;

    item->child = child = cJSON_New_Item();
    if (!item->child) return 0;
    value = skip(parse_string(child, skip(value)));
    if (!value) return 0;
    child->string = child->valuestring;
    child->valuestring = 0;

    if (*value != ':') { global_ep = value; return 0; }
    value = skip(parse_value(child, skip(value + 1)));
    if (!value) return 0;

    while (*value == ',') {
        cJSON *new_item = cJSON_New_Item();
        if (!new_item) return 0;
        child->next = new_item;
        new_item->prev = child;
        child = new_item;
        value = skip(parse_string(child, skip(value + 1)));
        if (!value) return 0;
        child->string = child->valuestring;
        child->valuestring = 0;
        if (*value != ':') { global_ep = value; return 0; }
        value = skip(parse_value(child, skip(value + 1)));
        if (!value) return 0;
    }

    if (*value == '}') return value + 1;
    global_ep = value;
    return 0;
}

cJSON *cJSON_Parse(const char *value) {
    cJSON *c = cJSON_New_Item();
    if (!c) return 0;
    if (!parse_value(c, skip(value))) {
        cJSON_Delete(c);
        return 0;
    }
    return c;
}

static char *print_number(cJSON *item) {
    char *str;
    double d = item->valuedouble;
    if (fabs(((double)item->valueint) - d) <= 0.00000000001 && d >= INT_MIN && d <= INT_MAX) {
        str = (char*)cJSON_malloc(21);
        if (str) sprintf(str, "%d", item->valueint);
    } else {
        str = (char*)cJSON_malloc(64);
        if (str) sprintf(str, "%.15g", d);
    }
    return str;
}

static char *print_string_ptr(const char *str) {
    const char *ptr; char *ptr2, *out; int len = 0;
    if (!str) return cJSON_strdup("\"\"");
    for (ptr = str; *ptr; ptr++) {
        if ((unsigned char)*ptr < 32 || *ptr == '\"' || *ptr == '\\') len += 2;
        else len++;
    }
    out = (char*)cJSON_malloc(len + 3);
    if (!out) return 0;
    ptr2 = out; *ptr2++ = '\"';
    for (ptr = str; *ptr; ptr++) {
        if ((unsigned char)*ptr > 31 && *ptr != '\"' && *ptr != '\\') *ptr2++ = *ptr;
        else {
            *ptr2++ = '\\';
            switch (*ptr) {
                case '\\': *ptr2++ = '\\'; break;
                case '\"': *ptr2++ = '\"'; break;
                case '\b': *ptr2++ = 'b'; break;
                case '\f': *ptr2++ = 'f'; break;
                case '\n': *ptr2++ = 'n'; break;
                case '\r': *ptr2++ = 'r'; break;
                case '\t': *ptr2++ = 't'; break;
                default: sprintf(ptr2, "u%04x", (unsigned char)*ptr); ptr2 += 5; break;
            }
        }
    }
    *ptr2++ = '\"'; *ptr2++ = 0;
    return out;
}

static char *print_value(cJSON *item);
static char *print_array(cJSON *item);
static char *print_object(cJSON *item);

static char *print_value(cJSON *item) {
    if (!item) return 0;
    switch ((item->type) & 255) {
        case cJSON_NULL: return cJSON_strdup("null");
        case cJSON_False: return cJSON_strdup("false");
        case cJSON_True: return cJSON_strdup("true");
        case cJSON_Number: return print_number(item);
        case cJSON_String: return print_string_ptr(item->valuestring);
        case cJSON_Array: return print_array(item);
        case cJSON_Object: return print_object(item);
    }
    return 0;
}

static char *print_array(cJSON *item) {
    char **entries;
    char *out = 0, *ptr;
    int len = 5;
    cJSON *child = item->child;
    int numentries = 0, i = 0, fail = 0;

    while (child) numentries++, child = child->next;
    if (!numentries) return cJSON_strdup("[]");

    entries = (char**)cJSON_malloc(numentries * sizeof(char*));
    if (!entries) return 0;
    memset(entries, 0, numentries * sizeof(char*));

    child = item->child;
    while (child && !fail) {
        entries[i] = print_value(child);
        if (entries[i]) len += strlen(entries[i]) + 2; else fail = 1;
        i++;
        child = child->next;
    }

    if (!fail) out = (char*)cJSON_malloc(len);
    if (!out) fail = 1;

    if (fail) {
        for (i = 0; i < numentries; i++) if (entries[i]) cJSON_free(entries[i]);
        cJSON_free(entries);
        return 0;
    }

    *out = '['; ptr = out + 1; *ptr = 0;
    for (i = 0; i < numentries; i++) {
        strcpy(ptr, entries[i]);
        ptr += strlen(entries[i]);
        if (i != numentries - 1) { *ptr++ = ','; *ptr = 0; }
        cJSON_free(entries[i]);
    }
    cJSON_free(entries);
    *ptr++ = ']'; *ptr++ = 0;
    return out;
}

static char *print_object(cJSON *item) {
    char **entries = 0, **names = 0;
    char *out = 0, *ptr;
    int len = 7;
    cJSON *child = item->child;
    int numentries = 0, i = 0, fail = 0;

    while (child) numentries++, child = child->next;
    if (!numentries) return cJSON_strdup("{}");

    entries = (char**)cJSON_malloc(numentries * sizeof(char*));
    names = (char**)cJSON_malloc(numentries * sizeof(char*));
    if (!entries || !names) {
        if (entries) cJSON_free(entries);
        if (names) cJSON_free(names);
        return 0;
    }
    memset(entries, 0, numentries * sizeof(char*));
    memset(names, 0, numentries * sizeof(char*));

    child = item->child;
    while (child && !fail) {
        names[i] = print_string_ptr(child->string);
        entries[i] = print_value(child);
        if (names[i] && entries[i]) len += strlen(names[i]) + strlen(entries[i]) + 3;
        else fail = 1;
        i++;
        child = child->next;
    }

    if (!fail) out = (char*)cJSON_malloc(len);
    if (!out) fail = 1;

    if (fail) {
        for (i = 0; i < numentries; i++) {
            if (names[i]) cJSON_free(names[i]);
            if (entries[i]) cJSON_free(entries[i]);
        }
        cJSON_free(names); cJSON_free(entries);
        return 0;
    }

    *out = '{'; ptr = out + 1; *ptr = 0;
    for (i = 0; i < numentries; i++) {
        strcpy(ptr, names[i]); ptr += strlen(names[i]);
        *ptr++ = ':';
        strcpy(ptr, entries[i]); ptr += strlen(entries[i]);
        if (i != numentries - 1) *ptr++ = ',';
        *ptr = 0;
        cJSON_free(names[i]); cJSON_free(entries[i]);
    }
    cJSON_free(names); cJSON_free(entries);
    *ptr++ = '}'; *ptr++ = 0;
    return out;
}

char *cJSON_Print(const cJSON *item) { return print_value((cJSON*)item); }
char *cJSON_PrintUnformatted(const cJSON *item) { return print_value((cJSON*)item); }

int cJSON_GetArraySize(const cJSON *array) {
    cJSON *c = array ? array->child : 0;
    int i = 0;
    while (c) i++, c = c->next;
    return i;
}

cJSON *cJSON_GetArrayItem(const cJSON *array, int index) {
    cJSON *c = array ? array->child : 0;
    while (c && index > 0) index--, c = c->next;
    return c;
}

cJSON *cJSON_GetObjectItem(const cJSON * const object, const char * const string) {
    cJSON *c = object ? object->child : 0;
    while (c && c->string && strcasecmp(c->string, string)) c = c->next;
    return c;
}

cJSON *cJSON_GetObjectItemCaseSensitive(const cJSON * const object, const char * const string) {
    cJSON *c = object ? object->child : 0;
    while (c && c->string && strcmp(c->string, string)) c = c->next;
    return c;
}

cJSON_bool cJSON_HasObjectItem(const cJSON *object, const char *string) {
    return cJSON_GetObjectItem(object, string) != NULL;
}

cJSON *cJSON_CreateNull(void) { cJSON *item = cJSON_New_Item(); if (item) item->type = cJSON_NULL; return item; }
cJSON *cJSON_CreateTrue(void) { cJSON *item = cJSON_New_Item(); if (item) item->type = cJSON_True; return item; }
cJSON *cJSON_CreateFalse(void) { cJSON *item = cJSON_New_Item(); if (item) item->type = cJSON_False; return item; }
cJSON *cJSON_CreateBool(cJSON_bool b) { cJSON *item = cJSON_New_Item(); if (item) item->type = b ? cJSON_True : cJSON_False; return item; }
cJSON *cJSON_CreateNumber(double num) { cJSON *item = cJSON_New_Item(); if (item) { item->type = cJSON_Number; item->valuedouble = num; item->valueint = (int)num; } return item; }
cJSON *cJSON_CreateString(const char *string) { cJSON *item = cJSON_New_Item(); if (item) { item->type = cJSON_String; item->valuestring = cJSON_strdup(string); } return item; }
cJSON *cJSON_CreateArray(void) { cJSON *item = cJSON_New_Item(); if (item) item->type = cJSON_Array; return item; }
cJSON *cJSON_CreateObject(void) { cJSON *item = cJSON_New_Item(); if (item) item->type = cJSON_Object; return item; }

cJSON_bool cJSON_AddItemToArray(cJSON *array, cJSON *item) {
    cJSON *c;
    if (!item || !array) return 0;
    c = array->child;
    if (!c) { array->child = item; }
    else { while (c && c->next) c = c->next; c->next = item; item->prev = c; }
    return 1;
}

cJSON_bool cJSON_AddItemToObject(cJSON *object, const char *string, cJSON *item) {
    if (!item) return 0;
    if (item->string) cJSON_free(item->string);
    item->string = cJSON_strdup(string);
    return cJSON_AddItemToArray(object, item);
}

cJSON *cJSON_Duplicate(const cJSON *item, cJSON_bool recurse) {
    cJSON *newitem, *child, *next, *newchild;
    if (!item) return 0;
    newitem = cJSON_New_Item();
    if (!newitem) return 0;
    newitem->type = item->type & (~cJSON_IsReference);
    newitem->valueint = item->valueint;
    newitem->valuedouble = item->valuedouble;
    if (item->valuestring) {
        newitem->valuestring = cJSON_strdup(item->valuestring);
        if (!newitem->valuestring) { cJSON_Delete(newitem); return 0; }
    }
    if (item->string) {
        newitem->string = cJSON_strdup(item->string);
        if (!newitem->string) { cJSON_Delete(newitem); return 0; }
    }
    if (!recurse) return newitem;
    child = item->child;
    while (child) {
        newchild = cJSON_Duplicate(child, 1);
        if (!newchild) { cJSON_Delete(newitem); return 0; }
        cJSON_AddItemToArray(newitem, newchild);
        child = child->next;
    }
    return newitem;
}

void cJSON_DeleteItemFromObjectCaseSensitive(cJSON *object, const char *string) {
    cJSON *c = object ? object->child : NULL;
    while (c && c->string && strcmp(c->string, string)) c = c->next;
    if (!c) return;
    if (c->prev) c->prev->next = c->next;
    if (c->next) c->next->prev = c->prev;
    if (c == object->child) object->child = c->next;
    c->next = c->prev = NULL;
    cJSON_Delete(c);
}

cJSON_bool cJSON_IsInvalid(const cJSON * const item) { return item ? item->type == cJSON_Invalid : 0; }
cJSON_bool cJSON_IsFalse(const cJSON * const item) { return item ? (item->type & 255) == cJSON_False : 0; }
cJSON_bool cJSON_IsTrue(const cJSON * const item) { return item ? (item->type & 255) == cJSON_True : 0; }
cJSON_bool cJSON_IsBool(const cJSON * const item) { return item ? ((item->type & 255) == cJSON_True || (item->type & 255) == cJSON_False) : 0; }
cJSON_bool cJSON_IsNull(const cJSON * const item) { return item ? (item->type & 255) == cJSON_NULL : 0; }
cJSON_bool cJSON_IsNumber(const cJSON * const item) { return item ? (item->type & 255) == cJSON_Number : 0; }
cJSON_bool cJSON_IsString(const cJSON * const item) { return item ? (item->type & 255) == cJSON_String : 0; }
cJSON_bool cJSON_IsArray(const cJSON * const item) { return item ? (item->type & 255) == cJSON_Array : 0; }
cJSON_bool cJSON_IsObject(const cJSON * const item) { return item ? (item->type & 255) == cJSON_Object : 0; }
