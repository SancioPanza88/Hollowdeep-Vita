/* Hollowdeep Vita — headless host harness.
 *
 * Runs the very same runtime as the Vita build (QuickJS + native rasterizer)
 * on the CI runner, drives the menus and writes PPM frames. This is how the
 * port is actually exercised: a green compile alone would prove nothing.
 *
 * usage: hollowdeep_host [--frames N] [--shots 2,60,120] [--out DIR]
 *                        [--keys "10:Enter,12:EnterUp,30:Space"]
 */
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "platform.h"

static double g_start = 0;

static double now_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (double)ts.tv_sec * 1000.0 + (double)ts.tv_nsec / 1e6;
}

void plat_log(const char *s) {
    fputs(s, stderr);
}

void plat_logf(const char *fmt, ...) {
    va_list ap;
    va_start(ap, fmt);
    vfprintf(stderr, fmt, ap);
    va_end(ap);
}

double plat_time_ms(void) {
    return now_ms() - g_start;
}

void plat_sleep_ms(int ms) {
    (void)ms;
}

int plat_storage_load(char **data, int *len) {
    FILE *f = fopen("host_save.json", "rb");
    long n;
    char *buf;
    *data = NULL;
    *len = 0;
    if (!f) return 0;
    fseek(f, 0, SEEK_END);
    n = ftell(f);
    fseek(f, 0, SEEK_SET);
    if (n <= 0 || n > 1024 * 1024) {
        fclose(f);
        return 0;
    }
    buf = (char *)malloc((size_t)n + 1);
    if (!buf) {
        fclose(f);
        return 0;
    }
    if (fread(buf, 1, (size_t)n, f) != (size_t)n) {
        free(buf);
        fclose(f);
        return 0;
    }
    buf[n] = 0;
    fclose(f);
    *data = buf;
    *len = (int)n;
    return 1;
}

void plat_storage_save(const char *data, int len) {
    FILE *f = fopen("host_save.json", "wb");
    if (!f) return;
    fwrite(data, 1, (size_t)len, f);
    fclose(f);
}

int rt_present(int *w, int *h) {
    (void)w;
    (void)h;
    return 0;
}

static void write_ppm(const char *dir, int frame, const uint32_t *fb, int w, int h) {
    char path[512];
    FILE *f;
    int x, y;
    if (!fb || w <= 0 || h <= 0) return;
    snprintf(path, sizeof(path), "%s/frame_%04d.ppm", dir, frame);
    f = fopen(path, "wb");
    if (!f) return;
    fprintf(f, "P6\n%d %d\n255\n", w, h);
    for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
            uint32_t p = fb[y * w + x];
            unsigned char rgb[3];
            rgb[0] = (unsigned char)(p & 255);
            rgb[1] = (unsigned char)((p >> 8) & 255);
            rgb[2] = (unsigned char)((p >> 16) & 255);
            fwrite(rgb, 1, 3, f);
        }
    }
    fclose(f);
    fprintf(stderr, "[host] wrote %s\n", path);
}

struct ev { int frame; char key[32]; int down; };

int main(int argc, char **argv) {
    int frames = 240;
    int shots[64];
    int nshots = 0;
    int present = 0;
    char outdir[256] = "shots";
    struct ev events[64];
    int nev = 0;
    int i, f;
    const char *defkeys = "10: ,14:EscapeUp,30: ,34:EscapeUp,60: ,64:EscapeUp";
    const char *keyspec = defkeys;

    g_start = now_ms();

    for (i = 1; i < argc; i++) {
        if (!strcmp(argv[i], "--frames") && i + 1 < argc) frames = atoi(argv[++i]);
        else if (!strcmp(argv[i], "--present")) present = 1;
        else if (!strcmp(argv[i], "--out") && i + 1 < argc) snprintf(outdir, sizeof(outdir), "%s", argv[++i]);
        else if (!strcmp(argv[i], "--keys") && i + 1 < argc) keyspec = argv[++i];
        else if (!strcmp(argv[i], "--shots") && i + 1 < argc) {
            char *copy = strdup(argv[++i]);
            char *tok = strtok(copy, ",");
            while (tok && nshots < 64) {
                shots[nshots++] = atoi(tok);
                tok = strtok(NULL, ",");
            }
            free(copy);
        }
    }
    /* key script: "frame:key" (down) or "frame:keyUp" (release); a bare " "
     * token is the space key. */
    {
        char *copy = strdup(keyspec);
        char *tok = strtok(copy, ",");
        while (tok && nev < 64) {
            char *colon = strchr(tok, ':');
            if (colon) {
                *colon = 0;
                events[nev].frame = atoi(tok);
                snprintf(events[nev].key, sizeof(events[nev].key), "%s", colon + 1);
                events[nev].down = 1;
                if (strlen(events[nev].key) > 2 &&
                    !strcmp(events[nev].key + strlen(events[nev].key) - 2, "Up")) {
                    events[nev].key[strlen(events[nev].key) - 2] = 0;
                    events[nev].down = 0;
                }
                if (!strcmp(events[nev].key, "Space")) snprintf(events[nev].key, sizeof(events[nev].key), " ");
                if (!strcmp(events[nev].key, "Enter")) snprintf(events[nev].key, sizeof(events[nev].key), "Enter");
                nev++;
            }
            tok = strtok(NULL, ",");
        }
        free(copy);
    }

    rt_init();
    if (rt_errors()) {
        fprintf(stderr, "[host] init failed: %s\n", rt_last_error());
        return 2;
    }

    for (f = 0; f < frames; f++) {
        for (i = 0; i < nev; i++) {
            if (events[i].frame == f) rt_key(events[i].key, events[i].down);
        }
        rt_frame((double)f * 33.333);
        if (present) {
            int pw = 0, ph = 0;
            rt_framebuffer(&pw, &ph);
        }
        for (i = 0; i < nshots; i++) {
            if (shots[i] == f) {
                int w = 0, h = 0;
                uint32_t *fb = rt_framebuffer(&w, &h);
                write_ppm(outdir, f, fb, w, h);
            }
        }
        if (rt_quit_requested()) break;
    }

    fprintf(stderr, "[host] frames=%d errors=%d last=%s\n", f, rt_errors(),
            rt_errors() ? rt_last_error() : "none");
    rt_shutdown();
    return rt_errors() ? 1 : 0;
}
