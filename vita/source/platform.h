/* Hollowdeep Vita — platform contract shared by the Vita app and the host
 * self-test harness. */
#ifndef HOLLOWDEEP_PLATFORM_H
#define HOLLOWDEEP_PLATFORM_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

void   plat_log(const char *s);
void   plat_logf(const char *fmt, ...);
double plat_time_ms(void);
void   plat_sleep_ms(int ms);

/* localStorage persistence: malloc'd buffer, caller frees. */
int    plat_storage_load(char **data, int *len);
void   plat_storage_save(const char *data, int len);

/* frame compositing + presentation (implemented per platform) */
uint32_t *rt_framebuffer(int *w, int *h); /* composited game + overlay */
int    rt_present(int *w, int *h);        /* returns 1 when the app should quit */
int    rt_quit_requested(void);

void   rt_init(void);
void   rt_frame(double now_ms);
void   rt_key(const char *key, int down);
int    rt_errors(void);
const char *rt_last_error(void);
void   rt_shutdown(void);

#ifdef __cplusplus
}
#endif
#endif
