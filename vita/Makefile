# Hollowdeep Vita — native build
#
#   make host   headless self-test binary (CI screenshots, runtime checks)
#   make vpk    PS Vita package (VitaSDK in $VITASDK, default /usr/local/vitasdk)
#
# Assets are extracted from ../Hollowdeep.html by ../tools/extract_assets.py
# and embedded into the binary by ../tools/embed.py.

VITASDK ?= /usr/local/vitasdk
VITABIN := $(VITASDK)/bin

HOST_CC ?= cc
VITA_CC := $(VITABIN)/arm-vita-eabi-gcc

BUILD := build
GEN := $(BUILD)/generated
OBJH := $(BUILD)/host
OBJV := $(BUILD)/vita
QJS := third_party/quickjs

QJS_SRC := $(QJS)/quickjs.c $(QJS)/dtoa.c $(QJS)/libregexp.c $(QJS)/libunicode.c $(QJS)/cutils.c
QJS_OBJ_NAMES := quickjs dtoa libregexp libunicode cutils
COMMON_SRC := source/canvas.c source/runtime.c third_party/stb_impl.c
COMMON_OBJ_NAMES := canvas runtime stb_impl
GAME_JS := $(sort $(wildcard assets/game_*.js))
# ui.js/shim.js are not listed as prerequisites of a generated file (make of
# the wildcard can be empty on a clean checkout only if extraction was skipped)
ASSET_DEPS := ../tools/embed.py js/shim.js js/ui.js assets/font.ttf $(GAME_JS)

INCLUDES := -I$(GEN) -Isource -Ithird_party -I$(QJS)
WARN := -Wall -Wno-unused-parameter -Wno-unused-function -Wno-format-truncation

HOST_CFLAGS := -O2 -g -std=gnu11 $(WARN) $(INCLUDES) -DHOLLOWDEEP_HOST=1
VITA_CFLAGS := -O2 -std=gnu11 $(WARN) $(INCLUDES) -DHOLLOWDEEP_VITA=1 \
	-mcpu=cortex-a9 -mfpu=neon -mfloat-abi=hard -ffunction-sections -fdata-sections

.PHONY: all host vpk clean assets

all: host vpk

assets: $(GAME_JS)
	@true

$(GEN)/assets_data.c: $(ASSET_DEPS)
	@mkdir -p $(GEN)
	python3 ../tools/embed.py

$(OBJH):
	@mkdir -p $(OBJH)

$(OBJV):
	@mkdir -p $(OBJV)

# ---------------------------------------------------------------- host build

$(OBJH)/%.o: source/%.c | $(OBJH)
	$(HOST_CC) $(HOST_CFLAGS) -c $< -o $@

$(OBJH)/%.o: $(QJS)/%.c | $(OBJH)
	$(HOST_CC) $(HOST_CFLAGS) -c $< -o $@

$(OBJH)/%.o: third_party/%.c | $(OBJH)
	$(HOST_CC) $(HOST_CFLAGS) -c $< -o $@

HOST_OBJS := $(addprefix $(OBJH)/,$(COMMON_OBJ_NAMES:%=%.o)) \
             $(addprefix $(OBJH)/,$(QJS_OBJ_NAMES:%=%.o)) \
             $(OBJH)/main_host.o $(GEN)/assets_data.o

$(GEN)/assets_data.o: $(GEN)/assets_data.c | $(OBJH)
	$(HOST_CC) $(HOST_CFLAGS) -x c -c $< -o $@

$(BUILD)/hollowdeep_host: $(HOST_OBJS)
	$(HOST_CC) $(HOST_CFLAGS) -o $@ $^ -lm

host: $(BUILD)/hollowdeep_host

# ---------------------------------------------------------------- vita build

$(OBJV)/%.o: source/%.c | $(OBJV)
	$(VITA_CC) $(VITA_CFLAGS) -c $< -o $@

$(OBJV)/%.o: $(QJS)/%.c | $(OBJV)
	$(VITA_CC) $(VITA_CFLAGS) -c $< -o $@

$(OBJV)/%.o: third_party/%.c | $(OBJV)
	$(VITA_CC) $(VITA_CFLAGS) -c $< -o $@

VITA_OBJS := $(addprefix $(OBJV)/,$(COMMON_OBJ_NAMES:%=%.o)) \
             $(addprefix $(OBJV)/,$(QJS_OBJ_NAMES:%=%.o)) \
             $(OBJV)/main_vita.o $(GEN)/assets_data_vita.o

$(GEN)/assets_data_vita.o: $(GEN)/assets_data.c | $(OBJV)
	$(VITA_CC) $(VITA_CFLAGS) -x c -c $< -o $@

$(OBJV)/hollowdeep.elf: $(VITA_OBJS)
	$(VITA_CC) -Wl,-q -o $@ $^ -lm -lvita2d \
		-lSceDisplay_stub -lSceGxm_stub -lSceCtrl_stub -lSceSysmodule_stub \
		-lSceAppMgr_stub -lScePower_stub -lSceKernelThreadMgr_stub \
		-lSceCommonDialog_stub

vpk: $(BUILD)/Hollowdeep.vpk

$(BUILD)/Hollowdeep.vpk: $(OBJV)/hollowdeep.elf sce_sys/param.sfo sce_sys/icon0.png \
	sce_sys/livearea/contents/bg.png sce_sys/livearea/contents/startup.png \
	sce_sys/livearea/contents/template.xml
	$(VITABIN)/vita-elf-create $(OBJV)/hollowdeep.elf $(OBJV)/hollowdeep.velf
	$(VITABIN)/vita-make-fself $(OBJV)/hollowdeep.velf $(BUILD)/eboot.bin
	$(VITABIN)/vita-pack-vpk -s sce_sys/param.sfo -b $(BUILD)/eboot.bin \
		-a sce_sys/icon0.png=sce_sys/icon0.png \
		-a sce_sys/livearea/contents/bg.png=sce_sys/livearea/contents/bg.png \
		-a sce_sys/livearea/contents/startup.png=sce_sys/livearea/contents/startup.png \
		-a sce_sys/livearea/contents/template.xml=sce_sys/livearea/contents/template.xml \
		$(BUILD)/Hollowdeep.vpk
	@ls -l $(BUILD)/Hollowdeep.vpk

sce_sys/param.sfo: | $(BUILD)
	@mkdir -p sce_sys
	$(VITABIN)/vita-mksfoex -d ATTRIBUTE2=12 -s TITLE_ID=HLLWDVITA "Hollowdeep" $@

sce_sys/icon0.png sce_sys/livearea/contents/bg.png sce_sys/livearea/contents/startup.png sce_sys/livearea/contents/template.xml:
	python3 ../tools/make_vita_art.py

clean:
	rm -rf $(BUILD) sce_sys
