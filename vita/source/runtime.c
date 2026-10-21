/* Hollowdeep Vita — QuickJS host + native command bridge.
 *
 * The game logic runs unchanged in QuickJS (no transpiling: QuickJS is ES2020);
 * drawing, storage and images are native. The JS side is a small browser shim,
 * not a web engine: there is no HTML/CSS engine here.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "quickjs.h"

#include "assets_data.h"
#include "canvas.h"
#include "platform.h"

enum {
    OP_CANVAS_NEW = 1,
    OP_CANVAS_FREE,
    OP_CLEAR_RECT,
    OP_FILL_RECT,
    OP_STROKE_RECT,
    OP_SAVE,
    OP_RESTORE,
    OP_TRANSLATE,
    OP_SCALE,
    OP_ROTATE,
    OP_SET_TRANSFORM,
    OP_TRANSFORM,
    OP_BEGIN_PATH,
    OP_MOVE_TO,
    OP_LINE_TO,
    OP_BEZIER,
    OP_QUAD,
    OP_ARC,
    OP_ELLIPSE,
    OP_CLOSE_PATH,
    OP_RECT_PATH,
    OP_FILL,
    OP_STROKE,
    OP_CLIP,
    OP_DRAW_IMAGE,
    OP_TEXT,
    OP_MEASURE,
    OP_GRAD_NEW,
    OP_GRAD_STOP,
    OP_IMAGE_NEW,
    OP_IMAGE_LOAD,
    OP_IMAGE_FREE,
    OP_IMAGE_INFO,
    OP_CANVAS_INFO,
    OP_STORAGE_LOAD,
    OP_STORAGE_SAVE,
    OP_LOG,
    OP_QUIT,
    OP_RESET,
    OP_SET_CANVAS,
    OP_SET_OVERLAY
};

static JSRuntime *g_rt = NULL;
static JSContext *g_ctx = NULL;
static int g_errors = 0;
static char g_last_error[1024];
static int g_quit = 0;

static int  g_game_canvas = 0;
static int  g_overlay_canvas = 0;
static int  g_overlay_active = 0;
static uint32_t *g_comp = NULL;
static int g_comp_w = 0, g_comp_h = 0;

/* --------------------------------------------------------------- helpers */

static void set_error(const char *where, const char *msg) {
    snprintf(g_last_error, sizeof(g_last_error), "%s: %s", where, msg ? msg : "(unknown)");
    g_errors++;
    plat_log("[hollowdeep] ");
    plat_log(g_last_error);
    plat_log("\n");
}

static void dump_exception(const char *where) {
    JSValue e = JS_GetException(g_ctx);
    const char *s = JS_ToCString(g_ctx, e);
    set_error(where, s ? s : "(exception)");
    if (s) JS_FreeCString(g_ctx, s);
    JS_FreeValue(g_ctx, e);
}

static double argnum(int argc, JSValueConst *argv, int i, double def) {
    double v = def;
    if (i < argc) JS_ToFloat64(g_ctx, &v, argv[i]);
    return v;
}

static int argint(int argc, JSValueConst *argv, int i, int def) {
    return (int)argnum(argc, argv, i, def);
}

static const char *argstr(int argc, JSValueConst *argv, int i) {
    if (i < argc && JS_IsString(argv[i])) return JS_ToCString(g_ctx, argv[i]);
    return NULL;
}

static int eval_global(const char *name, const unsigned char *buf, unsigned int len) {
    JSValue v;
    if (!buf || !len) {
        set_error(name, "empty asset");
        return 0;
    }
    v = JS_Eval(g_ctx, (const char *)buf, len, name, JS_EVAL_TYPE_GLOBAL);
    if (JS_IsException(v)) {
        dump_exception(name);
        JS_FreeValue(g_ctx, v);
        return 0;
    }
    JS_FreeValue(g_ctx, v);
    return 1;
}

static JSValue js_g(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
    int op = argint(argc, argv, 0, -1);
    (void)this_val;
    switch (op) {
    case OP_CANVAS_NEW:
        return JS_NewInt32(ctx, cv_new(argint(argc, argv, 1, 1), argint(argc, argv, 2, 1)));
    case OP_CANVAS_FREE:
        cv_free(argint(argc, argv, 1, 0));
        return JS_UNDEFINED;
    case OP_RESET:
        cv_reset(argint(argc, argv, 1, 0));
        return JS_UNDEFINED;
    case OP_CLEAR_RECT:
        cv_clear_rect(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0),
                      (float)argnum(argc, argv, 3, 0), (float)argnum(argc, argv, 4, 0),
                      (float)argnum(argc, argv, 5, 0));
        return JS_UNDEFINED;
    case OP_FILL_RECT:
        cv_fill_rect(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0),
                     (float)argnum(argc, argv, 3, 0), (float)argnum(argc, argv, 4, 0),
                     (float)argnum(argc, argv, 5, 0), argint(argc, argv, 6, 0),
                     (uint32_t)argnum(argc, argv, 7, 0), argint(argc, argv, 8, 0),
                     (float)argnum(argc, argv, 9, 1), argint(argc, argv, 10, 0));
        return JS_UNDEFINED;
    case OP_STROKE_RECT:
        cv_stroke_rect(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0),
                       (float)argnum(argc, argv, 3, 0), (float)argnum(argc, argv, 4, 0),
                       (float)argnum(argc, argv, 5, 0), argint(argc, argv, 6, 0),
                       (uint32_t)argnum(argc, argv, 7, 0), argint(argc, argv, 8, 0),
                       (float)argnum(argc, argv, 9, 1), argint(argc, argv, 10, 0),
                       (float)argnum(argc, argv, 11, 1));
        return JS_UNDEFINED;
    case OP_SAVE: cv_save(argint(argc, argv, 1, 0)); return JS_UNDEFINED;
    case OP_RESTORE: cv_restore(argint(argc, argv, 1, 0)); return JS_UNDEFINED;
    case OP_TRANSLATE:
        cv_translate(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0),
                     (float)argnum(argc, argv, 3, 0));
        return JS_UNDEFINED;
    case OP_SCALE:
        cv_scale(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 1),
                 (float)argnum(argc, argv, 3, 1));
        return JS_UNDEFINED;
    case OP_ROTATE:
        cv_rotate(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0));
        return JS_UNDEFINED;
    case OP_SET_TRANSFORM:
        cv_set_transform(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 1),
                         (float)argnum(argc, argv, 3, 0), (float)argnum(argc, argv, 4, 0),
                         (float)argnum(argc, argv, 5, 1), (float)argnum(argc, argv, 6, 0),
                         (float)argnum(argc, argv, 7, 0));
        return JS_UNDEFINED;
    case OP_TRANSFORM:
        cv_transform(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 1),
                     (float)argnum(argc, argv, 3, 0), (float)argnum(argc, argv, 4, 0),
                     (float)argnum(argc, argv, 5, 1), (float)argnum(argc, argv, 6, 0),
                     (float)argnum(argc, argv, 7, 0));
        return JS_UNDEFINED;
    case OP_BEGIN_PATH: cv_begin_path(argint(argc, argv, 1, 0)); return JS_UNDEFINED;
    case OP_MOVE_TO:
        cv_move_to(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0),
                   (float)argnum(argc, argv, 3, 0));
        return JS_UNDEFINED;
    case OP_LINE_TO:
        cv_line_to(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0),
                   (float)argnum(argc, argv, 3, 0));
        return JS_UNDEFINED;
    case OP_BEZIER:
        cv_bezier(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0),
                  (float)argnum(argc, argv, 3, 0), (float)argnum(argc, argv, 4, 0),
                  (float)argnum(argc, argv, 5, 0), (float)argnum(argc, argv, 6, 0),
                  (float)argnum(argc, argv, 7, 0), (float)argnum(argc, argv, 8, 0));
        return JS_UNDEFINED;
    case OP_QUAD:
        cv_quad(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0),
                (float)argnum(argc, argv, 3, 0), (float)argnum(argc, argv, 4, 0),
                (float)argnum(argc, argv, 5, 0), (float)argnum(argc, argv, 6, 0));
        return JS_UNDEFINED;
    case OP_ARC:
        cv_arc(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0),
               (float)argnum(argc, argv, 3, 0), (float)argnum(argc, argv, 4, 0),
               (float)argnum(argc, argv, 5, 0), (float)argnum(argc, argv, 6, 0),
               argint(argc, argv, 7, 0));
        return JS_UNDEFINED;
    case OP_ELLIPSE:
        cv_ellipse(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0),
                   (float)argnum(argc, argv, 3, 0), (float)argnum(argc, argv, 4, 0),
                   (float)argnum(argc, argv, 5, 0), (float)argnum(argc, argv, 6, 0),
                   (float)argnum(argc, argv, 7, 0), (float)argnum(argc, argv, 8, 0),
                   argint(argc, argv, 9, 0));
        return JS_UNDEFINED;
    case OP_CLOSE_PATH: cv_close_path(argint(argc, argv, 1, 0)); return JS_UNDEFINED;
    case OP_RECT_PATH:
        cv_rect_path(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0),
                     (float)argnum(argc, argv, 3, 0), (float)argnum(argc, argv, 4, 0),
                     (float)argnum(argc, argv, 5, 0));
        return JS_UNDEFINED;
    case OP_FILL:
        cv_fill(argint(argc, argv, 1, 0), argint(argc, argv, 2, 0),
                (uint32_t)argnum(argc, argv, 3, 0), argint(argc, argv, 4, 0),
                (float)argnum(argc, argv, 5, 1), argint(argc, argv, 6, 0));
        return JS_UNDEFINED;
    case OP_STROKE:
        cv_stroke(argint(argc, argv, 1, 0), argint(argc, argv, 2, 0),
                  (uint32_t)argnum(argc, argv, 3, 0), argint(argc, argv, 4, 0),
                  (float)argnum(argc, argv, 5, 1), argint(argc, argv, 6, 0),
                  (float)argnum(argc, argv, 7, 1));
        return JS_UNDEFINED;
    case OP_CLIP: cv_clip(argint(argc, argv, 1, 0)); return JS_UNDEFINED;
    case OP_DRAW_IMAGE:
        cv_draw_image(argint(argc, argv, 1, 0), argint(argc, argv, 2, 0),
                      argint(argc, argv, 3, 0), (float)argnum(argc, argv, 4, 0),
                      (float)argnum(argc, argv, 5, 0), (float)argnum(argc, argv, 6, 0),
                      (float)argnum(argc, argv, 7, 0), (float)argnum(argc, argv, 8, 0),
                      (float)argnum(argc, argv, 9, 0), (float)argnum(argc, argv, 10, 0),
                      (float)argnum(argc, argv, 11, 0), (float)argnum(argc, argv, 12, 1),
                      argint(argc, argv, 13, 0));
        return JS_UNDEFINED;
    case OP_TEXT: {
        const char *s = argstr(argc, argv, 2);
        if (s) {
            cv_text(argint(argc, argv, 1, 0), s, (float)argnum(argc, argv, 3, 0),
                    (float)argnum(argc, argv, 4, 0), argint(argc, argv, 5, 8),
                    argint(argc, argv, 6, 0), argint(argc, argv, 7, 0),
                    (uint32_t)argnum(argc, argv, 8, 0xffffffff),
                    (float)argnum(argc, argv, 9, 1), argint(argc, argv, 10, 0));
            JS_FreeCString(ctx, s);
        }
        return JS_UNDEFINED;
    }
    case OP_MEASURE: {
        const char *s = argstr(argc, argv, 1);
        float w = 0;
        if (s) {
            w = cv_measure(s, argint(argc, argv, 2, 8));
            JS_FreeCString(ctx, s);
        }
        return JS_NewFloat64(ctx, (double)w);
    }
    case OP_GRAD_NEW:
        return JS_NewInt32(ctx, grad_new(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0),
                                         (float)argnum(argc, argv, 3, 0), (float)argnum(argc, argv, 4, 0),
                                         (float)argnum(argc, argv, 5, 0), (float)argnum(argc, argv, 6, 0),
                                         (float)argnum(argc, argv, 7, 1)));
    case OP_GRAD_STOP:
        grad_stop(argint(argc, argv, 1, 0), (float)argnum(argc, argv, 2, 0),
                  (uint32_t)argnum(argc, argv, 3, 0));
        return JS_UNDEFINED;
    case OP_IMAGE_NEW:
        return JS_NewInt32(ctx, img_new());
    case OP_IMAGE_LOAD: {
        size_t len = 0, off = 0;
        uint8_t *bytes = NULL;
        int ok = 0;
        int id = argint(argc, argv, 1, 0);
        if (argc > 2) {
            bytes = JS_GetArrayBuffer(ctx, &len, argv[2]);
            if (!bytes) {
                JSValue ab = JS_GetTypedArrayBuffer(ctx, argv[2], &off, &len, NULL);
                if (!JS_IsException(ab)) {
                    bytes = JS_GetArrayBuffer(ctx, &len, ab);
                    JS_FreeValue(ctx, ab);
                } else {
                    JS_FreeValue(ctx, JS_GetException(ctx));
                }
            }
        }
        if (bytes && len) ok = img_load_png(id, bytes, (int)len);
        return JS_NewBool(ctx, ok);
    }
    case OP_IMAGE_FREE:
        img_free(argint(argc, argv, 1, 0));
        return JS_UNDEFINED;
    case OP_IMAGE_INFO:
        return JS_NewInt32(ctx, argint(argc, argv, 2, 0) ? img_height(argint(argc, argv, 1, 0))
                                                         : img_width(argint(argc, argv, 1, 0)));
    case OP_CANVAS_INFO:
        return JS_NewInt32(ctx, argint(argc, argv, 2, 0) ? cv_height(argint(argc, argv, 1, 0))
                                                         : cv_width(argint(argc, argv, 1, 0)));
    case OP_STORAGE_LOAD: {
        char *data = NULL;
        int len = 0;
        if (plat_storage_load(&data, &len) && data) {
            JSValue v = JS_NewStringLen(ctx, data, (size_t)len);
            free(data);
            return v;
        }
        return JS_NULL;
    }
    case OP_STORAGE_SAVE: {
        const char *s = argstr(argc, argv, 1);
        if (s) {
            plat_storage_save(s, (int)strlen(s));
            JS_FreeCString(ctx, s);
        }
        return JS_UNDEFINED;
    }
    case OP_LOG: {
        const char *s = argstr(argc, argv, 2);
        if (s) {
            plat_log("[js] ");
            plat_log(s);
            plat_log("\n");
            JS_FreeCString(ctx, s);
        }
        return JS_UNDEFINED;
    }
    case OP_QUIT:
        g_quit = 1;
        return JS_UNDEFINED;
    case OP_SET_CANVAS:
        g_game_canvas = argint(argc, argv, 1, 0);
        g_overlay_canvas = argint(argc, argv, 2, 0);
        return JS_UNDEFINED;
    case OP_SET_OVERLAY:
        g_overlay_active = argint(argc, argv, 1, 0);
        return JS_UNDEFINED;
    default:
        return JS_UNDEFINED;
    }
}

static int call_global_1(const char *name, double a) {
    JSValue global = JS_GetGlobalObject(g_ctx);
    JSValue fn = JS_GetPropertyStr(g_ctx, global, name);
    JSValue ret;
    int ok = 1;
    JS_FreeValue(g_ctx, global);
    if (!JS_IsFunction(g_ctx, fn)) {
        JS_FreeValue(g_ctx, fn);
        return 0;
    }
    ret = JS_Call(g_ctx, fn, JS_UNDEFINED, 1, &(JSValue){JS_NewFloat64(g_ctx, a)});
    JS_FreeValue(g_ctx, fn);
    if (JS_IsException(ret)) {
        dump_exception(name);
        ok = 0;
    }
    JS_FreeValue(g_ctx, ret);
    return ok;
}

void rt_init(void) {
    int i;
    JSValue global, fn;
    g_rt = JS_NewRuntime();
    if (!g_rt) {
        set_error("runtime", "JS_NewRuntime failed");
        return;
    }
    JS_SetMaxStackSize(g_rt, 512 * 1024);
    JS_SetMemoryLimit(g_rt, 256 * 1024 * 1024);
    g_ctx = JS_NewContext(g_rt);
    if (!g_ctx) {
        set_error("runtime", "JS_NewContext failed");
        return;
    }
    global = JS_GetGlobalObject(g_ctx);
    fn = JS_NewCFunction(g_ctx, js_g, "__g", 1);
    JS_SetPropertyStr(g_ctx, global, "__g", fn);
    JS_FreeValue(g_ctx, global);

    canvas_font_init(blob_font_ttf.data, (int)blob_font_ttf.len);

    if (!eval_global("shim.js", blob_shim_js.data, blob_shim_js.len)) return;
    if (!eval_global("ui.js", blob_ui_js.data, blob_ui_js.len)) return;
    for (i = 0; i < asset_game_script_count; i++) {
        char name[32];
        snprintf(name, sizeof(name), "game_%02d.js", i);
        if (!eval_global(name, asset_game_scripts[i].data, asset_game_scripts[i].len)) return;
    }
    plat_log("[hollowdeep] game scripts loaded\n");
}

void rt_key(const char *key, int down) {
    JSValue global, fn, arg;
    JSValue argv[2];
    if (!g_ctx || !key) return;
    global = JS_GetGlobalObject(g_ctx);
    fn = JS_GetPropertyStr(g_ctx, global, "__vita_key");
    JS_FreeValue(g_ctx, global);
    if (JS_IsFunction(g_ctx, fn)) {
        argv[0] = JS_NewString(g_ctx, key);
        argv[1] = JS_NewBool(g_ctx, down);
        arg = JS_Call(g_ctx, fn, JS_UNDEFINED, 2, argv);
        JS_FreeValue(g_ctx, argv[0]);
        JS_FreeValue(g_ctx, argv[1]);
        if (JS_IsException(arg)) dump_exception("__vita_key");
        JS_FreeValue(g_ctx, arg);
    }
    JS_FreeValue(g_ctx, fn);
}

void rt_frame(double now_ms) {
    call_global_1("__vita_frame", now_ms);
}

int rt_errors(void) { return g_errors; }
const char *rt_last_error(void) { return g_last_error; }

void rt_shutdown(void) {
    if (g_ctx) {
        JS_FreeContext(g_ctx);
        g_ctx = NULL;
    }
    if (g_rt) {
        JS_FreeRuntime(g_rt);
        g_rt = NULL;
    }
    free(g_comp);
    g_comp = NULL;
}

int rt_quit_requested(void) { return g_quit; }

/* Composite the game canvas with the overlay (when visible) and return the
 * pixels to present. When no overlay is drawn we hand out the game canvas
 * directly: no copy, no allocation. */
uint32_t *rt_framebuffer(int *out_w, int *out_h) {
    int w = cv_width(g_game_canvas), h = cv_height(g_game_canvas);
    uint32_t *base = cv_pixels(g_game_canvas);
    uint32_t *ov;
    int i, n;
    if (!base || w <= 0 || h <= 0) {
        *out_w = 0;
        *out_h = 0;
        return NULL;
    }
    if (!g_overlay_active) {
        *out_w = w;
        *out_h = h;
        return base;
    }
    ov = cv_pixels(g_overlay_canvas);
    if (!ov || cv_width(g_overlay_canvas) != w || cv_height(g_overlay_canvas) != h) {
        *out_w = w;
        *out_h = h;
        return base;
    }
    if (!g_comp || g_comp_w != w || g_comp_h != h) {
        free(g_comp);
        g_comp = (uint32_t *)malloc(sizeof(uint32_t) * (size_t)w * (size_t)h);
        g_comp_w = w;
        g_comp_h = h;
    }
    if (!g_comp) {
        *out_w = w;
        *out_h = h;
        return base;
    }
    n = w * h;
    memcpy(g_comp, base, sizeof(uint32_t) * (size_t)n);
    for (i = 0; i < n; i++) {
        uint32_t s = ov[i];
        int sa = (int)(s >> 24);
        if (sa == 0) continue;
        {
            uint32_t d = g_comp[i];
            int da = (int)(d >> 24);
            int ia = 255 - sa;
            int oa = sa + da * ia / 255;
            int r, g, b;
            if (oa <= 0) { g_comp[i] = 0; continue; }
            r = ((int)(s & 255) * sa + (int)(d & 255) * da * ia / 255) / oa;
            g = ((int)((s >> 8) & 255) * sa + (int)((d >> 8) & 255) * da * ia / 255) / oa;
            b = ((int)((s >> 16) & 255) * sa + (int)((d >> 16) & 255) * da * ia / 255) / oa;
            g_comp[i] = (uint32_t)r | ((uint32_t)g << 8) | ((uint32_t)b << 16) |
                        ((uint32_t)oa << 24);
        }
    }
    *out_w = w;
    *out_h = h;
    return g_comp;
}
