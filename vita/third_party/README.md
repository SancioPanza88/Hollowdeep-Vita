# Third party

- `quickjs/` — QuickJS 2025-09-13 (Bellard, MIT). Vendored, trimmed to the
  interpreter sources (`quickjs.c`, `dtoa.c`, `libregexp.c`, `libunicode.c`,
  `cutils.c`) plus headers. `quickjs-libc.c`, `qjs`/`qjsc` and the test suite are
  not used.
- `stb_image.h`, `stb_truetype.h` — stb, public domain / MIT.
- `stb_impl.c` — the single translation unit that compiles both implementations.

## Local patches (PS Vita)

QuickJS assumes a POSIX host with pthreads and `malloc_usable_size`. The Vita is a
single-threaded newlib target, so two minimal edits are applied and marked with
comments in `quickjs.c`:

1. `CONFIG_ATOMICS` is not enabled when `HOLLOWDEEP_VITA` is defined (no
   `pthread.h` / `stdatomic.h`, no `Atomics.*` builtins — the game does not use them).
2. `js_def_malloc_usable_size()` returns `0` on `HOLLOWDEEP_VITA` instead of
   calling `malloc_usable_size()`, which newlib does not provide.

`CONFIG_STACK_CHECK` stays enabled: it only uses `__builtin_frame_address`.

Everything else is upstream code.
