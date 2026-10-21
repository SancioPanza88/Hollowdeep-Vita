/* Hollowdeep Vita — software Canvas2D backend.
 *
 * Small, self contained, deterministic: no GPU, no HTML, no libm surprises.
 * Coordinates arrive in device space (the JS layer owns the transform stack
 * contract through cv_translate/cv_scale/...); paths are flattened here.
 */
#include "canvas.h"

#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "stb_image.h"
#include "stb_truetype.h"

#define MAX_CANVAS 128
#define MAX_GRAD   256
#define MAX_IMG    32
#define MAX_STATE  16
#define MAX_GLYPH  4096
#define MAX_SUB    96
#define MAX_STOPS  12
#define PI 3.14159265358979323846f

typedef struct { float a, b, c, d, e, f; } Xf;

typedef struct { float pos, inv; uint32_t rgba; } Stop;
typedef struct {
    int used, type;
    float x0, y0, x1, y1, r0, r1;
    float dx, dy, inv_len2, inv_span;
    int n;
    Stop st[MAX_STOPS];
} Grad;

typedef struct { float x, y; } V2;
typedef struct { V2 *p; int n, cap; } Sub;

typedef struct {
    int used, w, h;
    uint32_t *px;
    Xf m;
    Xf st[MAX_STATE];
    int sp;
    Sub sub[MAX_SUB];
    int nsub;
    int clip[4];
    int clipst[MAX_STATE][4];
} Canvas;

typedef struct { int used, w, h; uint32_t *px; } Img;

typedef struct {
    int kind;
    uint32_t rgba;
    int grad;
    float alpha;
    int comp;
} Paint;

typedef struct { float x0, y0, x1, y1; } Edge;

static Canvas g_canvas[MAX_CANVAS];
static Grad g_grad[MAX_GRAD];
static int g_grad_hi = 0;
static Img g_img[MAX_IMG];

static Edge *g_edges;
static int g_nedges, g_edges_cap;
static float *g_xs;
static int *g_dirs;
static int g_cross_cap;

/* ------------------------------------------------------------------ util */

static inline uint32_t pack_rgba(int r, int g, int b, int a) {
    return (uint32_t)(r & 255) | ((uint32_t)(g & 255) << 8) |
           ((uint32_t)(b & 255) << 16) | ((uint32_t)(a & 255) << 24);
}
static inline int cr(uint32_t c) { return (int)(c & 255); }
static inline int cg(uint32_t c) { return (int)((c >> 8) & 255); }
static inline int cb(uint32_t c) { return (int)((c >> 16) & 255); }
static inline int ca(uint32_t c) { return (int)((c >> 24) & 255); }

static inline int clampi(int v, int lo, int hi) { return v < lo ? lo : (v > hi ? hi : v); }
static inline float clampf(float v, float lo, float hi) { return v < lo ? lo : (v > hi ? hi : v); }

static Canvas *C(int id) {
    if (id <= 0 || id > MAX_CANVAS) return NULL;
    return g_canvas[id - 1].used ? &g_canvas[id - 1] : NULL;
}

static inline V2 xf(const Xf *m, float x, float y) {
    V2 v;
    v.x = m->a * x + m->c * y + m->e;
    v.y = m->b * x + m->d * y + m->f;
    return v;
}

static void xf_identity(Xf *m) {
    m->a = 1; m->b = 0; m->c = 0; m->d = 1; m->e = 0; m->f = 0;
}

static void clip_reset(Canvas *c) {
    c->clip[0] = 0;
    c->clip[1] = 0;
    c->clip[2] = c->w;
    c->clip[3] = c->h;
}

static void path_clear(Canvas *c) {
    int i;
    for (i = 0; i < c->nsub; i++) {
        free(c->sub[i].p);
        c->sub[i].p = NULL;
        c->sub[i].n = c->sub[i].cap = 0;
    }
    c->nsub = 0;
}

static Sub *path_sub(Canvas *c) {
    if (c->nsub == 0) return NULL;
    return &c->sub[c->nsub - 1];
}

static void sub_push(Sub *s, float x, float y) {
    if (s->n == s->cap) {
        int cap = s->cap ? s->cap * 2 : 16;
        V2 *np = (V2 *)realloc(s->p, sizeof(V2) * cap);
        if (!np) return;
        s->p = np;
        s->cap = cap;
    }
    s->p[s->n].x = x;
    s->p[s->n].y = y;
    s->n++;
}

static Sub *path_new_sub(Canvas *c) {
    if (c->nsub >= MAX_SUB) return path_sub(c);
    Sub *s = &c->sub[c->nsub++];
    s->p = NULL;
    s->n = s->cap = 0;
    return s;
}

/* --------------------------------------------------------------- canvases */

int cv_new(int w, int h) {
    int i;
    if (w < 1) w = 1;
    if (h < 1) h = 1;
    if (w > 4096) w = 4096;
    if (h > 4096) h = 4096;
    for (i = 0; i < MAX_CANVAS; i++) {
        if (!g_canvas[i].used) {
            Canvas *c = &g_canvas[i];
            memset(c, 0, sizeof(*c));
            c->px = (uint32_t *)calloc((size_t)w * h, sizeof(uint32_t));
            if (!c->px) return 0;
            c->used = 1;
            c->w = w;
            c->h = h;
            xf_identity(&c->m);
            clip_reset(c);
            return i + 1;
        }
    }
    return 0;
}

void cv_free(int id) {
    Canvas *c = C(id);
    if (!c) return;
    path_clear(c);
    free(c->px);
    c->px = NULL;
    c->used = 0;
}

int cv_valid(int id) { return C(id) != NULL; }
int cv_width(int id) { Canvas *c = C(id); return c ? c->w : 0; }
int cv_height(int id) { Canvas *c = C(id); return c ? c->h : 0; }
uint32_t *cv_pixels(int id) { Canvas *c = C(id); return c ? c->px : NULL; }

void cv_reset(int id) {
    Canvas *c = C(id);
    if (!c) return;
    xf_identity(&c->m);
    c->sp = 0;
    clip_reset(c);
    path_clear(c);
}

void cv_save(int id) {
    Canvas *c = C(id);
    if (!c || c->sp >= MAX_STATE) return;
    memcpy(c->clipst[c->sp], c->clip, sizeof(c->clip));
    c->st[c->sp++] = c->m;
}

void cv_restore(int id) {
    Canvas *c = C(id);
    if (!c || c->sp <= 0) return;
    c->sp--;
    c->m = c->st[c->sp];
    memcpy(c->clip, c->clipst[c->sp], sizeof(c->clip));
}

void cv_translate(int id, float x, float y) {
    Canvas *c = C(id);
    if (!c) return;
    c->m.e += c->m.a * x + c->m.c * y;
    c->m.f += c->m.b * x + c->m.d * y;
}

void cv_scale(int id, float x, float y) {
    Canvas *c = C(id);
    if (!c) return;
    c->m.a *= x;
    c->m.b *= x;
    c->m.c *= y;
    c->m.d *= y;
}

void cv_rotate(int id, float a) {
    Canvas *c = C(id);
    float cs, sn, na, nb, nc, nd;
    if (!c) return;
    cs = cosf(a);
    sn = sinf(a);
    na = c->m.a * cs + c->m.c * sn;
    nb = c->m.b * cs + c->m.d * sn;
    nc = c->m.a * -sn + c->m.c * cs;
    nd = c->m.b * -sn + c->m.d * cs;
    c->m.a = na; c->m.b = nb; c->m.c = nc; c->m.d = nd;
}

void cv_transform(int id, float a, float b, float cc, float d, float e, float f) {
    Canvas *c = C(id);
    Xf m;
    if (!c) return;
    m.a = c->m.a * a + c->m.c * b;
    m.b = c->m.b * a + c->m.d * b;
    m.c = c->m.a * cc + c->m.c * d;
    m.d = c->m.b * cc + c->m.d * d;
    m.e = c->m.a * e + c->m.c * f + c->m.e;
    m.f = c->m.b * e + c->m.d * f + c->m.f;
    c->m = m;
}

void cv_set_transform(int id, float a, float b, float cc, float d, float e, float f) {
    Canvas *c = C(id);
    if (!c) return;
    c->m.a = a; c->m.b = b; c->m.c = cc; c->m.d = d; c->m.e = e; c->m.f = f;
}

/* ------------------------------------------------------------------- path */

void cv_begin_path(int id) {
    Canvas *c = C(id);
    if (c) path_clear(c);
}

void cv_move_to(int id, float x, float y) {
    Canvas *c = C(id);
    V2 v;
    if (!c) return;
    v = xf(&c->m, x, y);
    sub_push(path_new_sub(c), v.x, v.y);
}

void cv_line_to(int id, float x, float y) {
    Canvas *c = C(id);
    Sub *s;
    V2 v;
    if (!c) return;
    s = path_sub(c);
    if (!s) { cv_move_to(id, x, y); return; }
    v = xf(&c->m, x, y);
    sub_push(s, v.x, v.y);
}

void cv_bezier(int id, float x1, float y1, float x2, float y2, float x3, float y3) {
    Canvas *c = C(id);
    Sub *s;
    V2 p0, p1, p2, p3;
    int i, steps;
    if (!c) return;
    s = path_sub(c);
    if (!s || s->n == 0) { cv_move_to(id, x3, y3); return; }
    p0.x = s->p[s->n - 1].x;
    p0.y = s->p[s->n - 1].y;
    p1 = xf(&c->m, x1, y1);
    p2 = xf(&c->m, x2, y2);
    p3 = xf(&c->m, x3, y3);
    {
        float len = hypotf(p1.x - p0.x, p1.y - p0.y) + hypotf(p2.x - p1.x, p2.y - p1.y) +
                    hypotf(p3.x - p2.x, p3.y - p2.y);
        steps = clampi((int)(len / 4.0f), 4, 64);
    }
    for (i = 1; i <= steps; i++) {
        float t = (float)i / (float)steps, u = 1.0f - t;
        float x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
        float y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
        sub_push(s, x, y);
    }
}

void cv_quad(int id, float x1, float y1, float x2, float y2) {
    Canvas *c = C(id);
    Sub *s;
    V2 p0, p1, p2;
    int i, steps;
    if (!c) return;
    s = path_sub(c);
    if (!s || s->n == 0) { cv_move_to(id, x2, y2); return; }
    p0.x = s->p[s->n - 1].x;
    p0.y = s->p[s->n - 1].y;
    p1 = xf(&c->m, x1, y1);
    p2 = xf(&c->m, x2, y2);
    {
        float len = hypotf(p1.x - p0.x, p1.y - p0.y) + hypotf(p2.x - p1.x, p2.y - p1.y);
        steps = clampi((int)(len / 4.0f), 4, 48);
    }
    for (i = 1; i <= steps; i++) {
        float t = (float)i / (float)steps, u = 1.0f - t;
        sub_push(s, u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
                 u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y);
    }
}

static void add_ellipse_points(Canvas *c, float cx, float cy, float rx, float ry,
                               float rot, float a0, float a1, int ccw) {
    Sub *s = path_sub(c);
    float sweep = a1 - a0;
    int steps, i;
    if (!s) return;
    if (ccw) { while (sweep > 0) sweep -= 2 * PI; }
    else { while (sweep < 0) sweep += 2 * PI; }
    steps = (int)(fabsf(sweep) * (6.0f + 2.0f * fmaxf(rx, ry)) / PI);
    steps = clampi(steps, 8, 128);
    for (i = 0; i <= steps; i++) {
        float t = a0 + sweep * ((float)i / (float)steps);
        float ex = cosf(t) * rx;
        float ey = sinf(t) * ry;
        float x = ex * cosf(rot) - ey * sinf(rot) + cx;
        float y = ex * sinf(rot) + ey * cosf(rot) + cy;
        V2 v = xf(&c->m, x, y);
        sub_push(s, v.x, v.y);
    }
}

void cv_arc(int id, float x, float y, float r, float a0, float a1, int ccw) {
    Canvas *c = C(id);
    if (!c) return;
    if (!path_sub(c)) cv_move_to(id, x + cosf(a0) * r, y + sinf(a0) * r);
    add_ellipse_points(c, x, y, r, r, 0, a0, a1, ccw);
}

void cv_ellipse(int id, float x, float y, float rx, float ry, float rot,
                float a0, float a1, int ccw) {
    Canvas *c = C(id);
    float cs = cosf(rot), sn = sinf(rot);
    if (!c) return;
    if (!path_sub(c))
        cv_move_to(id, x + cosf(a0) * rx * cs - sinf(a0) * ry * sn,
                   y + cosf(a0) * rx * sn + sinf(a0) * ry * cs);
    add_ellipse_points(c, x, y, rx, ry, rot, a0, a1, ccw);
}

void cv_close_path(int id) {
    Canvas *c = C(id);
    Sub *s;
    if (!c) return;
    s = path_sub(c);
    if (s && s->n > 1) {
        sub_push(s, s->p[0].x, s->p[0].y);
    }
}

void cv_rect_path(int id, float x, float y, float w, float h) {
    Canvas *c = C(id);
    if (!c) return;
    path_new_sub(c);
    cv_move_to(id, x, y);
    cv_line_to(id, x + w, y);
    cv_line_to(id, x + w, y + h);
    cv_line_to(id, x, y + h);
    cv_close_path(id);
}

/* ---------------------------------------------------------------- paint */

static Paint mkpaint(int kind, uint32_t rgba, int grad, float alpha, int comp) {
    Paint p;
    p.kind = kind;
    p.rgba = rgba;
    p.grad = grad;
    p.alpha = clampf(alpha, 0.0f, 1.0f);
    p.comp = comp;
    return p;
}

int grad_new(int type, float x0, float y0, float x1, float y1, float r0, float r1) {
    int i;
    for (i = 0; i < MAX_GRAD; i++) {
        if (!g_grad[i].used) {
            Grad *g = &g_grad[i];
            memset(g, 0, sizeof(*g));
            g->used = 1;
            g->type = type;
            g->x0 = x0; g->y0 = y0; g->x1 = x1; g->y1 = y1;
            g->r0 = r0; g->r1 = (r1 > r0) ? r1 : r0 + 1.0f;
            g->dx = x1 - x0; g->dy = y1 - y0;
            g->inv_len2 = 1.0f / (g->dx * g->dx + g->dy * g->dy + 1e-9f);
            g->inv_span = 1.0f / (g->r1 - g->r0);
            if (i + 1 > g_grad_hi) g_grad_hi = i + 1;
            return i + 1;
        }
    }
    return 0;
}

/* Gradients only live for one frame; without this the 256-slot pool runs dry
 * after a few seconds and every later fill silently becomes a solid colour. */
void grad_reset(void) {
    int i;
    for (i = 0; i < g_grad_hi; i++) g_grad[i].used = 0;
    g_grad_hi = 0;
}

void grad_stop(int id, float pos, uint32_t rgba) {
    Grad *g;
    int i;
    if (id <= 0 || id > MAX_GRAD) return;
    g = &g_grad[id - 1];
    if (!g->used || g->n >= MAX_STOPS) return;
    i = g->n++;
    while (i > 0 && g->st[i - 1].pos > pos) {
        g->st[i] = g->st[i - 1];
        i--;
    }
    g->st[i].pos = clampf(pos, 0.0f, 1.0f);
    g->st[i].rgba = rgba;
    /* Recompute segment reciprocals: the inner loop interpolates per pixel and
     * must not divide there. */
    for (i = 0; i < g->n; i++) {
        float span = (i == 0) ? 0.0f : g->st[i].pos - g->st[i - 1].pos;
        g->st[i].inv = span > 0.00001f ? 1.0f / span : 0.0f;
    }
}

static inline int lerp_i(int a, int b, float t) { return a + (int)((b - a) * t + 0.5f); }

static inline uint32_t grad_color(const Grad *g, float x, float y) {
    float t;
    int i;
    if (g->n == 0) return 0;
    if (g->n == 1) return g->st[0].rgba;
    if (g->type == PAINT_RADIAL) {
        float dx = x - g->x0, dy = y - g->y0;
        float d = sqrtf(dx * dx + dy * dy);
        t = (d - g->r0) * g->inv_span;
    } else {
        if (g->inv_len2 <= 0.0f) return g->st[0].rgba;
        t = ((x - g->x0) * g->dx + (y - g->y0) * g->dy) * g->inv_len2;
    }
    t = clampf(t, 0.0f, 1.0f);
    if (t <= g->st[0].pos) return g->st[0].rgba;
    for (i = 1; i < g->n; i++) {
        if (t <= g->st[i].pos) {
            float f = (t - g->st[i - 1].pos) * g->st[i].inv;
            uint32_t c0 = g->st[i - 1].rgba, c1 = g->st[i].rgba;
            return pack_rgba(lerp_i(cr(c0), cr(c1), f), lerp_i(cg(c0), cg(c1), f),
                             lerp_i(cb(c0), cb(c1), f), lerp_i(ca(c0), ca(c1), f));
        }
    }
    return g->st[g->n - 1].rgba;
}

/* ------------------------------------------------------------- blending */

/* v / 255, rounded, for 0 <= v <= 65025. Constant-division by 255 is cheap
 * for the compiler, but this keeps the inner loops branch-simple and lets us
 * use it on products too. */
static inline unsigned int div255(unsigned int v) {
    return (v + 1u + (v >> 8)) >> 8;
}

/* 24.8 fixed-point reciprocal: 1/oa for the rare translucent-destination
 * blend. Built once, indexed by the 1..255 resulting alpha. */
static uint32_t g_recip[256];
static int g_recip_ready = 0;

static void recip_init(void) {
    unsigned int i;
    if (g_recip_ready) return;
    for (i = 1; i < 256; i++) g_recip[i] = (16777216u + i / 2) / i;
    g_recip_ready = 1;
}

/* The old version divided by the resulting alpha three times per pixel.
 * Cortex-A9 has no integer divider, so each of those was a ~40 cycle software
 * call: at 500k pixels/frame it alone cost more than everything else. The
 * opaque-destination path (nearly every pixel) is now multiply-only. */
static inline uint32_t blend_px(uint32_t dst, uint32_t src, int cov, int comp) {
    unsigned int sa, sr, sg, sb;
    if (cov <= 0) return dst;
    sr = src & 255u;
    sg = (src >> 8) & 255u;
    sb = (src >> 16) & 255u;
    sa = (src >> 24) & 255u;
    if (cov < 255) sa = div255(sa * (unsigned int)cov);
    if (sa == 0) return dst;
    switch (comp) {
    case COMP_COPY:
        return sr | (sg << 8) | (sb << 16) | (sa << 24);
    case COMP_DEST_OUT: {
        unsigned int da = (dst >> 24) & 255u;
        return (dst & 0x00FFFFFFu) | (div255(da * (255u - sa)) << 24);
    }
    case COMP_LIGHTER: {
        unsigned int da = (dst >> 24) & 255u;
        unsigned int r = (dst & 255u) + div255(sr * sa);
        unsigned int g = ((dst >> 8) & 255u) + div255(sg * sa);
        unsigned int b = ((dst >> 16) & 255u) + div255(sb * sa);
        unsigned int a = da + sa;
        return (r > 255 ? 255 : r) | ((g > 255 ? 255 : g) << 8) |
               ((b > 255 ? 255 : b) << 16) | ((a > 255 ? 255 : a) << 24);
    }
    default: {
        unsigned int da = (dst >> 24) & 255u;
        unsigned int ia = 255u - sa;
        if (da == 255) {
            unsigned int r = div255(sr * sa + (dst & 255u) * ia);
            unsigned int g = div255(sg * sa + ((dst >> 8) & 255u) * ia);
            unsigned int b = div255(sb * sa + ((dst >> 16) & 255u) * ia);
            return r | (g << 8) | (b << 16) | 0xFF000000u;
        }
        if (da == 0) return sr | (sg << 8) | (sb << 16) | (sa << 24);
        {
            unsigned int dia = div255(da * ia);
            unsigned int oa = sa + dia;
            uint64_t rn, gn, bn;
            unsigned int r, g, b;
            if (oa == 0) return 0;
            recip_init();
            rn = (uint64_t)(sr * sa + (dst & 255u) * dia);
            gn = (uint64_t)(sg * sa + ((dst >> 8) & 255u) * dia);
            bn = (uint64_t)(sb * sa + ((dst >> 16) & 255u) * dia);
            r = (unsigned int)((rn * g_recip[oa] + 8388608u) >> 24);
            g = (unsigned int)((gn * g_recip[oa] + 8388608u) >> 24);
            b = (unsigned int)((bn * g_recip[oa] + 8388608u) >> 24);
            return r | (g << 8) | (b << 16) | ((oa > 255 ? 255u : oa) << 24);
        }
    }
    }
}

/* ----------------------------------------------------------- rasterizer */

/* Composite an RGBA overlay onto the game frame. The old runtime.c loop did
 * straight-alpha "over" with three integer divisions per pixel; the overlay is
 * full screen, so on a Vita (no hardware divider) that alone blew a whole
 * frame budget. The game canvas is opaque, which removes the division. */
void cv_composite(uint32_t *dst, const uint32_t *base, const uint32_t *src, int n) {
    int i;
    for (i = 0; i < n; i++) {
        uint32_t s = src[i];
        uint32_t d;
        unsigned int sa = s >> 24;
        unsigned int ia, r, g, b;
        if (!sa) { dst[i] = base[i]; continue; }
        if (sa == 255) { dst[i] = s; continue; }
        d = base[i];
        if ((d >> 24) != 255u) { dst[i] = blend_px(d, s, 255, COMP_SOURCE_OVER); continue; }
        ia = 255u - sa;
        r = div255((s & 255u) * sa + (d & 255u) * ia);
        g = div255(((s >> 8) & 255u) * sa + ((d >> 8) & 255u) * ia);
        b = div255(((s >> 16) & 255u) * sa + ((d >> 16) & 255u) * ia);
        dst[i] = r | (g << 8) | (b << 16) | 0xFF000000u;
    }
}

static void edges_reserve(int extra) {
    if (g_nedges + extra > g_edges_cap) {
        int cap = g_edges_cap ? g_edges_cap : 256;
        while (cap < g_nedges + extra) cap *= 2;
        g_edges = (Edge *)realloc(g_edges, sizeof(Edge) * cap);
        g_edges_cap = cap;
    }
}

static void edges_add(float x0, float y0, float x1, float y1) {
    if (y0 == y1) return;
    edges_reserve(1);
    g_edges[g_nedges].x0 = x0;
    g_edges[g_nedges].y0 = y0;
    g_edges[g_nedges].x1 = x1;
    g_edges[g_nedges].y1 = y1;
    g_nedges++;
}

static void cross_reserve(int extra) {
    if (extra > g_cross_cap) {
        int cap = g_cross_cap ? g_cross_cap : 256;
        while (cap < extra) cap *= 2;
        g_xs = (float *)realloc(g_xs, sizeof(float) * cap);
        g_dirs = (int *)realloc(g_dirs, sizeof(int) * cap);
        g_cross_cap = cap;
    }
}

static inline const Grad *paint_grad(const Paint *p) {
    return (p->kind != PAINT_SOLID && p->grad > 0 && p->grad <= MAX_GRAD &&
            g_grad[p->grad - 1].used) ? &g_grad[p->grad - 1] : NULL;
}

/* One clipped horizontal run of a solid or gradient fill. */
static inline void span_fill(uint32_t *row, int x0, int x1, float yc,
                             const Grad *g, uint32_t solid, int cov, float alpha, int comp) {
    int j;
    if (!g) {
        if (cov <= 0) return;
        if (cov >= 255 && comp == COMP_SOURCE_OVER) {
            uint32_t v = (solid & 0x00FFFFFFu) | 0xFF000000u;
            for (j = x0; j < x1; j++) row[j] = v;
        } else {
            for (j = x0; j < x1; j++) row[j] = blend_px(row[j], solid, cov, comp);
        }
    } else {
        for (j = x0; j < x1; j++) {
            uint32_t col = grad_color(g, (float)j + 0.5f, yc);
            int a = (int)(ca(col) * alpha + 0.5f);
            if (a <= 0) continue;
            if (a >= 255 && comp == COMP_SOURCE_OVER)
                row[j] = (col & 0x00FFFFFFu) | 0xFF000000u;
            else
                row[j] = blend_px(row[j], col, a, comp);
        }
    }
}

static void raster_edges(Canvas *c, const Paint *p) {
    int i, y, nc = 0;
    int ymin = c->h, ymax = 0;
    uint32_t solid = p->rgba;
    const Grad *g = paint_grad(p);
    if (g_nedges <= 0) return;
    for (i = 0; i < g_nedges; i++) {
        int a = (int)floorf(fminf(g_edges[i].y0, g_edges[i].y1));
        int b = (int)ceilf(fmaxf(g_edges[i].y0, g_edges[i].y1));
        if (a < ymin) ymin = a;
        if (b > ymax) ymax = b;
    }
    if (ymin < c->clip[1]) ymin = c->clip[1];
    if (ymax > c->clip[3]) ymax = c->clip[3];
    cross_reserve(g_nedges + 4);
    for (y = ymin; y < ymax; y++) {
        float yc = (float)y + 0.5f;
        int j;
        nc = 0;
        for (i = 0; i < g_nedges; i++) {
            const Edge *e = &g_edges[i];
            float t;
            if ((e->y0 <= yc && e->y1 > yc) || (e->y1 <= yc && e->y0 > yc)) {
                t = (yc - e->y0) / (e->y1 - e->y0);
                g_xs[nc] = e->x0 + t * (e->x1 - e->x0);
                g_dirs[nc] = e->y1 > e->y0 ? 1 : -1;
                nc++;
            }
        }
        if (nc < 2) continue;
        for (i = 1; i < nc; i++) {
            float kx = g_xs[i];
            int kd = g_dirs[i];
            j = i - 1;
            while (j >= 0 && g_xs[j] > kx) {
                g_xs[j + 1] = g_xs[j];
                g_dirs[j + 1] = g_dirs[j];
                j--;
            }
            g_xs[j + 1] = kx;
            g_dirs[j + 1] = kd;
        }
        {
            int wind = 0;
            float sx = 0;
            for (i = 0; i < nc; i++) {
                if (wind == 0) sx = g_xs[i];
                wind += g_dirs[i];
                if (wind == 0 && g_xs[i] > sx) {
                    int x0 = (int)ceilf(sx - 0.5f);
                    int x1 = (int)ceilf(g_xs[i] - 0.5f);
                    uint32_t *row;
                    if (x0 < c->clip[0]) x0 = c->clip[0];
                    if (x1 > c->clip[2]) x1 = c->clip[2];
                    if (x1 <= x0) continue;
                    row = c->px + (size_t)y * c->w;
                    span_fill(row, x0, x1, yc, g, solid,
                              (int)(ca(solid) * p->alpha + 0.5f), p->alpha, p->comp);
                }
            }
        }
    }
    g_nedges = 0;
}

static void fill_poly(Canvas *c, const V2 *pts, int n, const Paint *p) {
    int i;
    if (n < 3) return;
    for (i = 0; i < n; i++) {
        int j = (i + 1) % n;
        edges_add(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
    }
    raster_edges(c, p);
}

static void fill_path(Canvas *c, const Paint *p) {
    int i, k;
    for (i = 0; i < c->nsub; i++) {
        Sub *s = &c->sub[i];
        if (s->n < 2) continue;
        for (k = 0; k < s->n; k++) {
            int j = (k + 1) % s->n;
            edges_add(s->p[k].x, s->p[k].y, s->p[j].x, s->p[j].y);
        }
    }
    raster_edges(c, p);
}

static void fill_box(Canvas *c, float x0, float y0, float x1, float y1, const Paint *p) {
    V2 q[4];
    q[0].x = x0; q[0].y = y0;
    q[1].x = x1; q[1].y = y0;
    q[2].x = x1; q[2].y = y1;
    q[3].x = x0; q[3].y = y1;
    fill_poly(c, q, 4, p);
}

/* ------------------------------------------------------------- drawing */

void cv_clear_rect(int id, float x, float y, float w, float h) {
    Canvas *c = C(id);
    V2 a, b;
    int x0, x1, yy, y0, y1;
    if (!c) return;
    a = xf(&c->m, x, y);
    b = xf(&c->m, x + w, y + h);
    x0 = (int)floorf(fminf(a.x, b.x));
    x1 = (int)ceilf(fmaxf(a.x, b.x));
    y0 = (int)floorf(fminf(a.y, b.y));
    y1 = (int)ceilf(fmaxf(a.y, b.y));
    if (x0 < c->clip[0]) x0 = c->clip[0];
    if (y0 < c->clip[1]) y0 = c->clip[1];
    if (x1 > c->clip[2]) x1 = c->clip[2];
    if (y1 > c->clip[3]) y1 = c->clip[3];
    if (x1 <= x0) return;
    for (yy = y0; yy < y1; yy++) {
        memset(c->px + (size_t)yy * c->w + x0, 0, sizeof(uint32_t) * (x1 - x0));
    }
}

void cv_fill_rect(int id, float x, float y, float w, float h, int paint, uint32_t rgba,
                  int grad, float alpha, int comp) {
    Canvas *c = C(id);
    Paint p;
    V2 a, b;
    if (!c) return;
    p = mkpaint(paint, rgba, grad, alpha, comp);
    a = xf(&c->m, x, y);
    b = xf(&c->m, x + w, y + h);
    if (c->m.b == 0.0f && c->m.c == 0.0f) {
        /* Axis-aligned rectangles are the common case (backgrounds, HUD
         * bars, dialog boxes): fill them directly instead of building an
         * edge list, sorting crossings and dividing per edge per scanline. */
        int x0, x1, y0, y1, yy;
        const Grad *g = paint_grad(&p);
        int cov = (int)(ca(rgba) * p.alpha + 0.5f);
        x0 = (int)ceilf(fminf(a.x, b.x) - 0.5f);
        x1 = (int)ceilf(fmaxf(a.x, b.x) - 0.5f);
        y0 = (int)ceilf(fminf(a.y, b.y) - 0.5f);
        y1 = (int)ceilf(fmaxf(a.y, b.y) - 0.5f);
        if (x0 < c->clip[0]) x0 = c->clip[0];
        if (y0 < c->clip[1]) y0 = c->clip[1];
        if (x1 > c->clip[2]) x1 = c->clip[2];
        if (y1 > c->clip[3]) y1 = c->clip[3];
        if (x1 <= x0 || y1 <= y0) return;
        for (yy = y0; yy < y1; yy++) {
            uint32_t *row = c->px + (size_t)yy * c->w;
            span_fill(row, x0, x1, (float)yy + 0.5f, g, rgba, cov, p.alpha, comp);
        }
    } else {
        V2 q[4];
        q[0] = a;
        q[1] = b;
        q[2] = b;
        q[3] = a;
        q[0] = xf(&c->m, x, y);
        q[1] = xf(&c->m, x + w, y);
        q[2] = xf(&c->m, x + w, y + h);
        q[3] = xf(&c->m, x, y + h);
        fill_poly(c, q, 4, &p);
    }
}

void cv_stroke_rect(int id, float x, float y, float w, float h, int paint, uint32_t rgba,
                    int grad, float alpha, int comp, float lw) {
    Canvas *c = C(id);
    Paint p;
    V2 q[4];
    int i;
    if (!c) return;
    p = mkpaint(paint, rgba, grad, alpha, comp);
    if (lw < 1.0f) lw = 1.0f;
    q[0] = xf(&c->m, x, y);
    q[1] = xf(&c->m, x + w, y);
    q[2] = xf(&c->m, x + w, y + h);
    q[3] = xf(&c->m, x, y + h);
    for (i = 0; i < 4; i++) {
        int j = (i + 1) % 4;
        float dx = q[j].x - q[i].x, dy = q[j].y - q[i].y;
        float len = sqrtf(dx * dx + dy * dy);
        V2 r[4];
        float nx, ny, hw;
        if (len < 0.0001f) continue;
        nx = -dy / len * (lw * 0.5f);
        ny = dx / len * (lw * 0.5f);
        hw = lw * 0.5f;
        r[0].x = q[i].x + nx - dx / len * hw;
        r[0].y = q[i].y + ny - dy / len * hw;
        r[1].x = q[j].x + nx + dx / len * hw;
        r[1].y = q[j].y + ny + dy / len * hw;
        r[2].x = q[j].x - nx + dx / len * hw;
        r[2].y = q[j].y - ny + dy / len * hw;
        r[3].x = q[i].x - nx - dx / len * hw;
        r[3].y = q[i].y - ny - dy / len * hw;
        fill_poly(c, r, 4, &p);
    }
}

void cv_fill(int id, int paint, uint32_t rgba, int grad, float alpha, int comp) {
    Canvas *c = C(id);
    Paint p;
    if (!c) return;
    p = mkpaint(paint, rgba, grad, alpha, comp);
    fill_path(c, &p);
}

void cv_stroke(int id, int paint, uint32_t rgba, int grad, float alpha, int comp, float lw) {
    Canvas *c = C(id);
    Paint p;
    int i, k;
    if (!c) return;
    p = mkpaint(paint, rgba, grad, alpha, comp);
    if (lw < 1.0f) lw = 1.0f;
    for (i = 0; i < c->nsub; i++) {
        Sub *s = &c->sub[i];
        if (s->n < 2) continue;
        for (k = 0; k < s->n - 1; k++) {
            V2 p0 = s->p[k], p1 = s->p[k + 1];
            float dx = p1.x - p0.x, dy = p1.y - p0.y;
            float len = sqrtf(dx * dx + dy * dy);
            V2 q[4];
            float nx, ny, hw;
            if (len < 0.0001f) continue;
            nx = -dy / len * (lw * 0.5f);
            ny = dx / len * (lw * 0.5f);
            hw = lw * 0.5f;
            q[0].x = p0.x + nx - dx / len * hw;
            q[0].y = p0.y + ny - dy / len * hw;
            q[1].x = p1.x + nx + dx / len * hw;
            q[1].y = p1.y + ny + dy / len * hw;
            q[2].x = p1.x - nx + dx / len * hw;
            q[2].y = p1.y - ny + dy / len * hw;
            q[3].x = p0.x - nx - dx / len * hw;
            q[3].y = p0.y - ny - dy / len * hw;
            fill_poly(c, q, 4, &p);
            if (lw >= 3.0f) {
                V2 cap[8];
                int a;
                float r = lw * 0.5f;
                for (a = 0; a < 8; a++) {
                    float t = (float)a * (2 * PI / 8);
                    cap[a].x = p0.x + cosf(t) * r;
                    cap[a].y = p0.y + sinf(t) * r;
                }
                fill_poly(c, cap, 8, &p);
                for (a = 0; a < 8; a++) {
                    float t = (float)a * (2 * PI / 8);
                    cap[a].x = p1.x + cosf(t) * r;
                    cap[a].y = p1.y + sinf(t) * r;
                }
                fill_poly(c, cap, 8, &p);
            }
        }
    }
}

void cv_clip(int id) {
    Canvas *c = C(id);
    float x0 = 1e30f, y0 = 1e30f, x1 = -1e30f, y1 = -1e30f;
    int i, k;
    if (!c) return;
    for (i = 0; i < c->nsub; i++) {
        Sub *s = &c->sub[i];
        for (k = 0; k < s->n; k++) {
            if (s->p[k].x < x0) x0 = s->p[k].x;
            if (s->p[k].y < y0) y0 = s->p[k].y;
            if (s->p[k].x > x1) x1 = s->p[k].x;
            if (s->p[k].y > y1) y1 = s->p[k].y;
        }
    }
    if (x1 < x0) {
        c->clip[2] = c->clip[0];
        return;
    }
    {
        int ix0 = (int)floorf(x0), iy0 = (int)floorf(y0);
        int ix1 = (int)ceilf(x1), iy1 = (int)ceilf(y1);
        if (ix0 > c->clip[0]) c->clip[0] = ix0;
        if (iy0 > c->clip[1]) c->clip[1] = iy0;
        if (ix1 < c->clip[2]) c->clip[2] = ix1;
        if (iy1 < c->clip[3]) c->clip[3] = iy1;
        if (c->clip[0] > c->clip[2]) c->clip[0] = c->clip[2];
        if (c->clip[1] > c->clip[3]) c->clip[1] = c->clip[3];
    }
}

/* ---------------------------------------------------------------- images */

int img_new(void) {
    int i;
    for (i = 0; i < MAX_IMG; i++) {
        if (!g_img[i].used) {
            memset(&g_img[i], 0, sizeof(g_img[i]));
            g_img[i].used = 1;
            return i + 1;
        }
    }
    return 0;
}

void img_free(int id) {
    if (id <= 0 || id > MAX_IMG) return;
    free(g_img[id - 1].px);
    g_img[id - 1].px = NULL;
    g_img[id - 1].used = 0;
}

int img_load_png(int id, const uint8_t *data, int len) {
    Img *im;
    int w = 0, h = 0, comp = 0, i, n;
    unsigned char *rgba;
    if (id <= 0 || id > MAX_IMG) return 0;
    im = &g_img[id - 1];
    if (!im->used) return 0;
    stbi_set_flip_vertically_on_load(0);
    rgba = stbi_load_from_memory(data, len, &w, &h, &comp, 4);
    if (!rgba) return 0;
    n = w * h;
    free(im->px);
    im->px = (uint32_t *)malloc(sizeof(uint32_t) * (size_t)n);
    if (!im->px) {
        stbi_image_free(rgba);
        return 0;
    }
    for (i = 0; i < n; i++) {
        im->px[i] = pack_rgba(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], rgba[i * 4 + 3]);
    }
    im->w = w;
    im->h = h;
    stbi_image_free(rgba);
    return 1;
}

int img_width(int id) { return (id > 0 && id <= MAX_IMG) ? g_img[id - 1].w : 0; }
int img_height(int id) { return (id > 0 && id <= MAX_IMG) ? g_img[id - 1].h : 0; }

static const uint32_t *src_pixels(int kind, int sid, int *w, int *h) {
    if (kind == 1) {
        if (sid <= 0 || sid > MAX_IMG || !g_img[sid - 1].used) return NULL;
        *w = g_img[sid - 1].w;
        *h = g_img[sid - 1].h;
        return g_img[sid - 1].px;
    }
    {
        Canvas *c = C(sid);
        if (!c) return NULL;
        *w = c->w;
        *h = c->h;
        return c->px;
    }
}

void cv_draw_image(int id, int src_kind, int src_id, float sx, float sy, float sw, float sh,
                   float dx, float dy, float dw, float dh, float alpha, int comp) {
    Canvas *c = C(id);
    const uint32_t *sp;
    int iw = 0, ih = 0;
    V2 p0, p1;
    int px, py;
    int x0, x1, y0, y1;
    uint32_t *copy = NULL;
    if (!c || dw == 0 || dh == 0) return;
    sp = src_pixels(src_kind, src_id, &iw, &ih);
    if (!sp || iw <= 0 || ih <= 0) return;
    if (src_kind == 0 && src_id == id) {
        copy = (uint32_t *)malloc(sizeof(uint32_t) * (size_t)iw * ih);
        if (!copy) return;
        memcpy(copy, sp, sizeof(uint32_t) * (size_t)iw * ih);
        sp = copy;
    }
    p0 = xf(&c->m, dx, dy);
    p1 = xf(&c->m, dx + dw, dy + dh);
    x0 = (int)floorf(fminf(p0.x, p1.x));
    x1 = (int)ceilf(fmaxf(p0.x, p1.x));
    y0 = (int)floorf(fminf(p0.y, p1.y));
    y1 = (int)ceilf(fmaxf(p0.y, p1.y));
    if (x0 < c->clip[0]) x0 = c->clip[0];
    if (y0 < c->clip[1]) y0 = c->clip[1];
    if (x1 > c->clip[2]) x1 = c->clip[2];
    if (y1 > c->clip[3]) y1 = c->clip[3];
    if (c->m.b == 0.0f && c->m.c == 0.0f) {
        /* Axis aligned: walk the source rect incrementally. The old loop did
         * two float divisions per pixel; now it is two adds. */
        float ax = c->m.a, ay = c->m.d;
        float stepx, stepy, u0, v0;
        int cov = (int)(alpha * 255.0f + 0.5f);
        if (fabsf(ax) < 1e-6f || fabsf(ay) < 1e-6f) { free(copy); return; }
        if (cov < 0) cov = 0;
        if (cov > 255) cov = 255;
        stepx = (sw / dw) / ax;
        stepy = (sh / dh) / ay;
        u0 = sx + ((((float)x0 + 0.5f - c->m.e) / ax) - dx) * (sw / dw);
        v0 = sy + ((((float)y0 + 0.5f - c->m.f) / ay) - dy) * (sh / dh);
        for (py = y0; py < y1; py++) {
            float vy = v0 + (float)(py - y0) * stepy;
            float ux = u0;
            uint32_t *row = c->px + (size_t)py * c->w;
            int syy;
            if (vy < 0.0f) continue;
            syy = (int)vy;
            if (syy >= ih) continue;
            {
                const uint32_t *srow = sp + (size_t)syy * iw;
                for (px = x0; px < x1; px++, ux += stepx) {
                    uint32_t s;
                    if (ux < 0.0f) continue;
                    {
                        int sxx = (int)ux;
                        if (sxx >= iw) continue;
                        s = srow[sxx];
                    }
                    if (!(s >> 24)) continue;
                    if (cov >= 255 && ((s >> 24) & 255u) == 255u && comp == COMP_SOURCE_OVER)
                        row[px] = s | 0xFF000000u;
                    else
                        row[px] = blend_px(row[px], s, cov, comp);
                }
            }
        }
    } else {
        /* rotated/scaled: inverse map destination pixels into the source rect */
        float det = c->m.a * c->m.d - c->m.b * c->m.c;
        float ia, ib, ic, idm;
        if (fabsf(det) < 1e-8f) { free(copy); return; }
        ia = c->m.d / det;
        ib = -c->m.b / det;
        ic = -c->m.c / det;
        idm = c->m.a / det;
        for (py = y0; py < y1; py++) {
            uint32_t *row = c->px + (size_t)py * c->w;
            for (px = x0; px < x1; px++) {
                float cx = (float)px + 0.5f, cy = (float)py + 0.5f;
                float ux = ia * (cx - c->m.e) + ic * (cy - c->m.f);
                float uy = ib * (cx - c->m.e) + idm * (cy - c->m.f);
                float lu = (ux - dx) / dw, lv = (uy - dy) / dh;
                int sxx, syy;
                uint32_t s;
                int a;
                if (lu < 0 || lu >= 1 || lv < 0 || lv >= 1) continue;
                sxx = (int)floorf(sx + lu * sw);
                syy = (int)floorf(sy + lv * sh);
                if (sxx < 0 || sxx >= iw || syy < 0 || syy >= ih) continue;
                s = sp[(size_t)syy * iw + sxx];
                a = ca(s);
                if (!a) continue;
                a = (int)(a * alpha + 0.5f);
                if (a <= 0) continue;
                row[px] = blend_px(row[px], s, a, comp);
            }
        }
    }
    free(copy);
}

/* ------------------------------------------------------------------ text */

static stbtt_fontinfo g_fi;
static int g_font_ok = 0;
static int g_asc = 0, g_desc = 0, g_gap = 0;

typedef struct {
    int cp, px, w, h, xo, yo, adv;
    unsigned char *bm;
} Glyph;

static Glyph g_glyphs[MAX_GLYPH];
static int g_nglyphs = 0;

void canvas_font_init(const uint8_t *ttf, int len) {
    int off;
    if (!ttf || len <= 0) return;
    off = stbtt_GetFontOffsetForIndex(ttf, 0);
    if (off < 0) return;
    if (!stbtt_InitFont(&g_fi, ttf, off)) return;
    stbtt_GetFontVMetrics(&g_fi, &g_asc, &g_desc, &g_gap);
    g_font_ok = 1;
}

static Glyph *glyph_get(int cp, int px) {
    int i;
    Glyph *g;
    float sc;
    int adv = 0, lsb = 0, gi;
    for (i = g_nglyphs - 1; i >= 0; i--) {
        if (g_glyphs[i].cp == cp && g_glyphs[i].px == px) return &g_glyphs[i];
    }
    if (!g_font_ok || g_nglyphs >= MAX_GLYPH) return NULL;
    g = &g_glyphs[g_nglyphs++];
    memset(g, 0, sizeof(*g));
    g->cp = cp;
    g->px = px;
    sc = stbtt_ScaleForMappingEmToPixels(&g_fi, (float)px);
    stbtt_GetCodepointHMetrics(&g_fi, cp, &adv, &lsb);
    g->adv = (int)lroundf((float)adv * sc);
    if (g->adv <= 0) g->adv = px;
    gi = stbtt_FindGlyphIndex(&g_fi, cp);
    if (gi) {
        g->bm = stbtt_GetCodepointBitmap(&g_fi, 0, sc, cp, &g->w, &g->h, &g->xo, &g->yo);
    }
    return g;
}

static const char *utf8_next(const char *s, int *cp) {
    unsigned char c = (unsigned char)*s++;
    if (c < 0x80) { *cp = c; return s; }
    if ((c & 0xE0) == 0xC0) {
        *cp = ((c & 0x1F) << 6) | ((unsigned char)s[0] & 0x3F);
        return s + 1;
    }
    if ((c & 0xF0) == 0xE0) {
        *cp = ((c & 0x0F) << 12) | (((unsigned char)s[0] & 0x3F) << 6) |
              ((unsigned char)s[1] & 0x3F);
        return s + 2;
    }
    if ((c & 0xF8) == 0xF0) {
        *cp = ((c & 0x07) << 18) | (((unsigned char)s[0] & 0x3F) << 12) |
              (((unsigned char)s[1] & 0x3F) << 6) | ((unsigned char)s[2] & 0x3F);
        return s + 3;
    }
    *cp = '?';
    return s;
}

static float text_width(const char *utf8, int px) {
    float w = 0;
    const char *s = utf8;
    while (*s) {
        int cp;
        s = utf8_next(s, &cp);
        if (cp == '\n') continue;
        {
            Glyph *g = glyph_get(cp, px);
            w += g ? (float)g->adv : (float)px;
        }
    }
    return w;
}

float cv_measure(const char *utf8, int px) {
    if (px < 1) px = 1;
    return text_width(utf8, px);
}

void cv_text(int id, const char *utf8, float x, float y, int px, int align, int baseline,
             uint32_t rgba, float alpha, int comp) {
    Canvas *c = C(id);
    const char *s = utf8;
    float pen, baselineY, w;
    float sc, asc_px, desc_px;
    int col_r = cr(rgba), col_g = cg(rgba), col_b = cb(rgba);
    int col_a = (int)(ca(rgba) * alpha + 0.5f);
    uint32_t col_px = pack_rgba(col_r, col_g, col_b, 255);
    if (!c || !utf8 || px < 1) return;
    if (!g_font_ok) return;
    sc = stbtt_ScaleForMappingEmToPixels(&g_fi, (float)px);
    asc_px = (float)g_asc * sc;
    desc_px = (float)g_desc * sc;
    pen = 0;
    w = text_width(utf8, px);
    if (align == ALIGN_CENTER) pen = -w * 0.5f;
    else if (align == ALIGN_RIGHT) pen = -w;
    switch (baseline) {
    case BASE_TOP: baselineY = y + asc_px; break;
    case BASE_MIDDLE: baselineY = y + (asc_px + desc_px) * 0.5f; break;
    case BASE_BOTTOM: baselineY = y + desc_px; break;
    default: baselineY = y; break;
    }
    while (*s) {
        int cp;
        Glyph *g;
        if (*s == '\n') {
            s++;
            pen = 0;
            baselineY += (float)px * 1.15f;
            if (align == ALIGN_CENTER) pen = -w * 0.5f;
            else if (align == ALIGN_RIGHT) pen = -w;
            continue;
        }
        s = utf8_next(s, &cp);
        g = glyph_get(cp, px);
        if (!g) continue;
        if (g->bm && g->w > 0 && g->h > 0 && col_a > 0) {
            V2 org = xf(&c->m, x + pen + (float)g->xo, baselineY + (float)g->yo);
            int gx = (int)floorf(org.x + 0.5f);
            int gy = (int)floorf(org.y + 0.5f);
            int row;
            int sx = 1, sy = 1;
            if (c->m.a < 0) { sx = -1; gx = (int)floorf(org.x - (float)g->w + 0.5f); }
            if (c->m.d < 0) { sy = -1; gy = (int)floorf(org.y - (float)g->h + 0.5f); }
            for (row = 0; row < g->h; row++) {
                int dyy = gy + row;
                uint32_t *drow;
                int colx;
                if (dyy < c->clip[1] || dyy >= c->clip[3]) continue;
                drow = c->px + (size_t)dyy * c->w;
                for (colx = 0; colx < g->w; colx++) {
                    int cov = g->bm[(sy > 0 ? row : g->h - 1 - row) * g->w +
                                    (sx > 0 ? colx : g->w - 1 - colx)];
                    int dxx = gx + colx;
                    int a;
                    if (!cov) continue;
                    if (dxx < c->clip[0] || dxx >= c->clip[2]) continue;
                    a = div255(cov * col_a);
                    if (a <= 0) continue;
                    if (a >= 255 && comp == COMP_SOURCE_OVER) drow[dxx] = col_px | 0xFF000000u;
                    else drow[dxx] = blend_px(drow[dxx], col_px, a, comp);
                }
            }
        }
        pen += (float)g->adv;
    }
}
