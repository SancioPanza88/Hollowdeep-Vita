/* Hollowdeep Vita — native Canvas2D rasterizer.
 *
 * 352x240 RGBA (ABGR8888 in memory: R|G<<8|B<<16|A<<24), nearest-neighbour
 * sampling, solid + gradient paints, software scanline filling.
 * No browser, no DOM: this is the drawing backend of the embedded engine.
 */
#ifndef HOLLOWDEEP_CANVAS_H
#define HOLLOWDEEP_CANVAS_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

enum { PAINT_SOLID = 0, PAINT_LINEAR = 1, PAINT_RADIAL = 2 };
enum { COMP_SOURCE_OVER = 0, COMP_DEST_OUT = 1, COMP_LIGHTER = 2, COMP_COPY = 3 };
enum { ALIGN_LEFT = 0, ALIGN_RIGHT = 1, ALIGN_CENTER = 2 };
enum { BASE_TOP = 0, BASE_MIDDLE = 1, BASE_BOTTOM = 2, BASE_ALPHA = 3 };

/* canvases ------------------------------------------------------------- */
int  cv_new(int w, int h);
void cv_free(int id);
int  cv_valid(int id);
int  cv_width(int id);
int  cv_height(int id);
uint32_t *cv_pixels(int id);

/* state ---------------------------------------------------------------- */
void cv_save(int id);
void cv_restore(int id);
void cv_reset(int id);
void cv_translate(int id, float x, float y);
void cv_scale(int id, float x, float y);
void cv_rotate(int id, float a);
void cv_transform(int id, float a, float b, float c, float d, float e, float f);
void cv_set_transform(int id, float a, float b, float c, float d, float e, float f);

/* path ----------------------------------------------------------------- */
void cv_begin_path(int id);
void cv_move_to(int id, float x, float y);
void cv_line_to(int id, float x, float y);
void cv_bezier(int id, float x1, float y1, float x2, float y2, float x3, float y3);
void cv_quad(int id, float x1, float y1, float x2, float y2);
void cv_arc(int id, float x, float y, float r, float a0, float a1, int ccw);
void cv_ellipse(int id, float x, float y, float rx, float ry, float rot,
                float a0, float a1, int ccw);
void cv_close_path(int id);
void cv_rect_path(int id, float x, float y, float w, float h);

/* drawing -------------------------------------------------------------- */
void cv_clear_rect(int id, float x, float y, float w, float h);
void cv_fill_rect(int id, float x, float y, float w, float h,
                  int paint, uint32_t rgba, int grad, float alpha, int comp);
void cv_stroke_rect(int id, float x, float y, float w, float h,
                    int paint, uint32_t rgba, int grad, float alpha, int comp,
                    float line_width);
void cv_fill(int id, int paint, uint32_t rgba, int grad, float alpha, int comp);
void cv_stroke(int id, int paint, uint32_t rgba, int grad, float alpha, int comp,
               float line_width);
void cv_clip(int id);
void cv_draw_image(int id, int src_kind, int src_id,
                   float sx, float sy, float sw, float sh,
                   float dx, float dy, float dw, float dh,
                   float alpha, int comp);

/* gradients ------------------------------------------------------------ */
int  grad_new(int type, float x0, float y0, float x1, float y1, float r0, float r1);
void grad_stop(int g, float pos, uint32_t rgba);
void grad_reset(void);

/* text ----------------------------------------------------------------- */
void  canvas_font_init(const uint8_t *ttf, int len);
void  cv_text(int id, const char *utf8, float x, float y, int px, int align,
              int baseline, uint32_t rgba, float alpha, int comp);
float cv_measure(const char *utf8, int px);

/* images --------------------------------------------------------------- */
int  img_new(void);
void img_free(int id);
int  img_load_png(int id, const uint8_t *data, int len);
int  img_width(int id);
int  img_height(int id);

#ifdef __cplusplus
}
#endif
#endif
