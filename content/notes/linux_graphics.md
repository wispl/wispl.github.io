---
title: Linux Graphics
date: 2025-01-13
---

# Linux Graphics

1.  graphics api: Vulkan, OpenGL, etc...
2.  drm: Manages memory, both shared and graphics memory, allows allocating,
    querying and moving memory buffers
3.  mesa: Provides framework and implementations of graphics api and interacts
    with drm
4.  compositing: X or wayland, draws output buffers to screens and responsible
    for gathering user input for the application.

## Wayland

Wayland can use software rendering or hardware rendering, using dma-buf, for
rendering images. Dma-buf allows application and the compositor to read and
access the rendered images, instead of having it sent over a hardware bus after
storing it in shared memory. However, since we cannot tell if the hardware has
finished rendering, so an operation called fencing is used as a signal.

After the image is rendered, the compositor prints it to the screen in a series of steps:

1.  drm framebuffer: A buffer which stores the image, along with its size and color format
2.  scanout: The framebuffer's pixel data is read into one or multiple scanout
    buffers depending on the format
3.  cathode-ray tube controller (CRTC): Reads pixels from the scanout buffer.
    More specifically, it reads pixels from a plane. A plane encodes a scanout
    buffers position, orientation, and scaling. This is required because a
    framebuffer could be smaller or larger than the screen, resulting in
    multiple active planes, especially when considering multi-monitor
    configurations. The planes can overlap, so the CRTC is responsible for
    blending them and then forwarding them to ouputs, which are made of
    encoders and connectors.
4.  encoders: encodes pixel data for a specifc connector
5.  connectors: physical connection to a device, such as HDMI or VGA

There can be mutiple framebuffers as well, and therefore multiple scanout
buffers. For example, there can be a framebuffer and scanout for the cursor,
window, taskbar, overlays.

When first rendering, the compositor sets up the pipeline: creating
framebuffers, attaching planes, setting display mode for CRTC, and then
connecting the stages. Afterwards, updating the image merely requires changing
the framebuffer, a process called page flipping.

However the stage linking can be done in many ways, CRTC to multiple outputs,
or framebuffer to multiple CRTCs. In such cases, individually connecting each
stage without verifying can lead to an invalid pipeline configuration and thus
issues with page flips or switching modes. To solve this, DRM provides a atomic
mode setting which verifies the configuration is valid before applying changes
such as page flips.

## References

[The Linux graphics stack in a nutshell, part 1](https://lwn.net/Articles/955376/)
[The Linux graphics stack in a nutshell, part 2](https://lwn.net/Articles/955708/)

[Atomic mode setting design overview, part 1](https://lwn.net/Articles/653071/)
[Atomic mode setting design overview, part 2](https://lwn.net/Articles/653466/)

