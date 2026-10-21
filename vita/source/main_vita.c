/* Hollowdeep Vita — native PS Vita entry point.
 *
 * No browser: VitaSDK + vita2d, the game runs on the embedded JS engine and
 * draws through the native rasterizer. This file only maps the pad, presents
 * the 352x240 framebuffer at integer 2x and persists localStorage.
 */
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <psp2/ctrl.h>
#include <psp2/io/fcntl.h>
#include <psp2/io/stat.h>
#include <psp2/kernel/processmgr.h>
#include <psp2/kernel/threadmgr.h>
#include <psp2/power.h>
#include <vita2d.h>

#include "platform.h"

#define SAVE_DIR "ux0:data/Hollowdeep"
#define SAVE_FILE SAVE_DIR "/store.json"
#define LOG_FILE SAVE_DIR "/log.txt"

#define GAME_W 352
#define GAME_H 240

static vita2d_texture *g_tex = NULL;
static const int kScale = 2;

/* ------------------------------------------------------------------ utils */

void plat_log(const char *s) {
    FILE *f = fopen(LOG_FILE, "a");
    if (f) {
        fputs(s, f);
        fclose(f);
    }
}

void plat_logf(const char *fmt, ...) {
    char buf[512];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(buf, sizeof(buf), fmt, ap);
    va_end(ap);
    plat_log(buf);
}

double plat_time_ms(void) {
    return (double)sceKernelGetProcessTimeWide() / 1000.0;
}

void plat_sleep_ms(int ms) {
    if (ms > 0) sceKernelDelayThread((unsigned)ms * 1000);
}

int plat_storage_load(char **data, int *len) {
    SceIoStat st;
    FILE *f;
    long n;
    char *buf;
    *data = NULL;
    *len = 0;
    if (sceIoGetstat(SAVE_FILE, &st) < 0) return 0;
    f = fopen(SAVE_FILE, "rb");
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
    FILE *f = fopen(SAVE_FILE, "wb");
    if (!f) return;
    fwrite(data, 1, (size_t)len, f);
    fclose(f);
}

/* ------------------------------------------------------------------ input */

static unsigned g_prev = 0;

static const struct {
    unsigned mask;
    const char *key;
} KEYMAP[] = {
    { SCE_CTRL_UP, "ArrowUp" },
    { SCE_CTRL_DOWN, "ArrowDown" },
    { SCE_CTRL_LEFT, "ArrowLeft" },
    { SCE_CTRL_RIGHT, "ArrowRight" },
    { SCE_CTRL_CROSS, " " },
    { SCE_CTRL_CIRCLE, "Escape" },
    { SCE_CTRL_SQUARE, "e" },
    { SCE_CTRL_TRIANGLE, "q" },
    { SCE_CTRL_LTRIGGER, "Shift" },
    { SCE_CTRL_RTRIGGER, "j" },
    { SCE_CTRL_START, "Escape" },
    { SCE_CTRL_SELECT, "m" },
};

static void poll_input(void) {
    SceCtrlData pad;
    unsigned cur;
    size_t i;
    memset(&pad, 0, sizeof(pad));
    if (sceCtrlPeekBufferPositive(0, &pad, 1) < 0) return;
    cur = pad.buttons;
    /* left analog stick acts as a digital d-pad so menus work with either */
    if (pad.ly < 100) cur |= SCE_CTRL_UP;
    if (pad.ly > 155) cur |= SCE_CTRL_DOWN;
    if (pad.lx < 100) cur |= SCE_CTRL_LEFT;
    if (pad.lx > 155) cur |= SCE_CTRL_RIGHT;
    for (i = 0; i < sizeof(KEYMAP) / sizeof(KEYMAP[0]); i++) {
        unsigned m = KEYMAP[i].mask;
        if ((cur & m) && !(g_prev & m)) rt_key(KEYMAP[i].key, 1);
        if (!(cur & m) && (g_prev & m)) rt_key(KEYMAP[i].key, 0);
    }
    g_prev = cur;
}

/* ------------------------------------------------------------- presentation */

int rt_present(int *w, int *h) {
    uint32_t *fb = rt_framebuffer(w, h);
    int sw, sh, ox, oy;
    if (!fb || *w != GAME_W || *h != GAME_H) return rt_quit_requested();
    memcpy(vita2d_texture_get_datap(g_tex), fb, (size_t)GAME_W * GAME_H * 4);
    sw = GAME_W * kScale;
    sh = GAME_H * kScale;
    ox = (960 - sw) / 2;
    oy = (544 - sh) / 2;
    vita2d_start_drawing();
    vita2d_clear_screen();
    vita2d_draw_texture_scale(g_tex, ox, oy, kScale, kScale);
    vita2d_end_drawing();
    vita2d_common_dialog_update();
    vita2d_swap_buffers();
    return rt_quit_requested();
}

int main(void) {
    uint64_t t0, tframe, now;
    sceIoMkdir(SAVE_DIR, 0777);
    plat_log("[hollowdeep] boot\n");

    scePowerSetArmClockFrequency(444);
    scePowerSetBusClockFrequency(222);
    scePowerSetGpuClockFrequency(222);
    scePowerSetGpuXbarClockFrequency(166);

    sceCtrlSetSamplingMode(SCE_CTRL_MODE_ANALOG);
    vita2d_init();
    vita2d_set_clear_color(0xFF000000);
    g_tex = vita2d_create_empty_texture_format((unsigned)GAME_W, (unsigned)GAME_H,
                                               SCE_GXM_TEXTURE_FORMAT_A8B8G8R8);
    if (!g_tex) {
        plat_log("[hollowdeep] texture allocation failed\n");
        vita2d_fini();
        sceKernelExitProcess(1);
        return 1;
    }
    vita2d_texture_set_filters(g_tex, SCE_GXM_TEXTURE_FILTER_POINT, SCE_GXM_TEXTURE_FILTER_POINT);

    t0 = sceKernelGetProcessTimeWide();
    rt_init();
    if (rt_errors()) {
        plat_logf("[hollowdeep] init errors: %d (%s)\n", rt_errors(), rt_last_error());
    }

    for (;;) {
        int w = 0, h = 0;
        poll_input();
        now = sceKernelGetProcessTimeWide();
        rt_frame((double)(now - t0) / 1000.0);
        if (rt_present(&w, &h)) break;
        tframe = sceKernelGetProcessTimeWide() - now;
        if (tframe < 33000) sceKernelDelayThread((unsigned)(33000 - tframe));
    }

    rt_shutdown();
    vita2d_free_texture(g_tex);
    vita2d_fini();
    sceKernelExitProcess(0);
    return 0;
}
