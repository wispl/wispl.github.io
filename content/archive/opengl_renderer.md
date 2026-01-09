---
title: OpenGL Renderer
date: 2025-01-12
updated: 2025-06-15
description: |
    And so states are often avoided, in pursuit for more a pure and stateless
    solution. After all, keeping track of numerous states is difficult and yet
    the US is bold enough to have 50 of them.
---

These are my notes on a more efficient OpenGL renderer. Even if Vulkan is the
new and mighty API, I still think it is worth it to work with OpenGL. I find
working with a predecessor to something really gives me an understanding of
why a new solution was needed. This in turns gives, what I find, to be great
insight in two both the target subjects.

## Less State, More Machine

A while back, OpenGL was primarily a bind and run API. Calls like these
```cpp
glBindBuffer(vertices);
glBufferData(vertices, size, data, flags);
glUnbindBuffer(vertices);
```
were common, and besides being rather annoying, it was inefficient. If you want
to add data to a buffer, you have to bind it first. While that may not be too
much of a problem if the game only runs on a single thread, it is limiting otherwise.
This forced binding means you cannot update data for a buffer while drawing.

Afterwards, DSA or direct state access was added, allowing callers to directly
update buffers and other objects without binding them. Now one can simply do
something like `glNamedBufferData(vertices, size, data, flags)` without a bind.
This eliminates a global state while also providing a way to update it without
wrecking havocs from the bind side effects.

There is no need to bind while updating, but when drawing, we still have quite
a number of binds which would be great to eliminate.

## Uniforms

Lets assume we want to render a whole much of meshes. For simplicity's sake, a
**mesh** is a collection of vertices, which may be grouped together into
**primitives**. We might want to apply some properties like textures or color to these
groups. These properties would be called the **material** of the primitive.

Now we want to render the meshes one by one. We need a way to update these
properties. This is done through **uniforms**, which can be seen as variables
which we can set before running a call. A sample loop might be
```cpp
for (auto& mesh : meshes) {
    for (auto& primitive : mesh.primitives) {
        bind(primitive.texture);
        bind(primitive.color);
        draw(primitive);
    }
}
```
While uniform binds are not too expensive, doing a bunch per frame is not too
optimal. But there is not too much we can do right now. And another thing, how
is the primitive drawn?

## Buffers

The GPU has to know what set of vertices it needs to render. A simple way might be
to store vertices data in each primitive.
```cpp
void draw(primitive p) {
    bind(p.vertices);
    bind(p.indices);
    draw();
}
```
If a mesh has 1000 primitives, that could mean potentially 4000 binds per frame
alone! And binding buffers is even more expensive. Okay, that is not ideal, what
if we store the data per mesh instead?
```cpp
for (auto& mesh : meshes) {
    bind(mesh.vertices);
    bind(mesh.indices);
    for (auto& primitive : mesh.primitives) {
        bind(primitive.texture);
        bind(primitive.color);
        draw(primitive);
    }
}
```
That would remove about 2000 binds, great! This does come at the cost of a more
complicated mesh loading though, but not by much. Just transfer all whole
vertices and indices of the mesh to two vectors. And draw might be more complex
as you now need to index into the per-mesh data instead of directly accessing the per
primitive data. So storing the start and end into the index buffer in the primitive
would probably be good.

### More Buffers

Per mesh is great, but what about the remaining binds there? OpenGL does not
really give us a way to bind textures all at once. But we could do that with
raw data like the primitive's color, or material in more complicated cases.
With an **SSBO**, shader store buffer object, we can do that. This is literally
just an extra large buffer on the GPU we can use. A uniform buffer object is
similar, but faster, it is however, much smaller too.
```cpp
std::vector<Material> mesh_materials = ...;
glNamedBufferData(material_buffer, mesh_materials.size() * sizeof(material), mesh_materials.data(), flags);
glBindBufferBase(GL_SHADER_STORAGE_BUFFER, binding, material_buffer);
```
Inefficiency aside, let's assume the `mesh_materials` contains the material
data for each primitive, the draw command is now simply
```cpp
for (auto& mesh : meshes) {
    bind(mesh.vertices);
    bind(mesh.indices);
    bind(mesh.materials);
    for (auto& primitive : mesh.primitives) {
        bind(primitive.texture);
        draw(primitive);
    }
}
```
Inside the shader we can access the data using something like `glDrawID` which
is generated for each draw call, in our case each primitive.

### Sorting It Out

We still have that ugly texture bind left. Unless a bindless texture
[extension](https://www.khronos.org/opengl/wiki/Bindless_Texture) is used,
there is no way to eliminate this final call. We could however, reduce the
amount of binds by say, drawing primitives with the same textures together.

If we sort by textures to bind into buckets,
```cpp
for (auto& mesh : meshes) {
    bind(mesh.vertices);
    bind(mesh.indices);
    bind(mesh.materials);
    for (auto& bucket : mesh.buckets) {
        bind(bucket.texture);
        draw(bucket);
    }
}
```
The only difference is primitives are grouped into buckets first. After a bind,
we draw every primitive in the bucket. This drops us from 4000 binds to
depending on the model, potentially less than 1000.

### Extending It

We can apply the strategy with the materials to other data as well. For
example, for mesh transforms we can upload it via SSBO as well.

## Taking Command

We are no longer bound by the binds, but another pressing concern is that the
number of draw calls is still 4000 for our 4000 primitive object. By now it
should be clear each API call costs, and reducing them would be great. What
if we draw per bucket instead of per primitive? We would have to sort the index
array into a layout described by the primitives then before submitting call. But
we now get
```cpp
for (auto& mesh : meshes) {
    bind(mesh.vertices);
    bind(mesh.indices);
    bind(mesh.materials);
    for (auto& bucket : mesh.buckets) {
        bind(bucket.texture);
        glDrawMultiElements(GL_TRIANGLES, bucket.count, GL_UNSIGNED_INT, bucket.start);
    }
}
```
Note that `mesh.materials` can now also be de-duplicated based on the buckets
as well. Not bad, but what if... we can store commands in a buffer as well?

### Commands in a Buffer

It just read my mind. With OpenGL Multi Draw Indirect (MDI), commands can be
stored and then sent all at once.
```cpp
struct DrawCommand {
	std::uint32_t count;            // how many indices
	std::uint32_t instance_count;   // how many instances to draw
	std::uint32_t first_index;      // offset to the first indice
	std::uint32_t base_vertex;      // offset to the first vertex
	std::uint32_t base_instance;    // offset for when drawing multiple instances
};
std::vector<DrawCommand> commands;

glNamedBufferStorage(command_buffer, sizeof(DrawCommand) * commands.size(), commands.data(), GL_DYNAMIC_STORAGE_BIT);
glBindBuffer(GL_DRAW_INDIRECT_BUFFER, command_buffer);
glMultiDrawElementsIndirect(GL_TRIANGLES, GL_UNSIGNED_INT, reinterpret_cast<const void*>(0), commands.size(), stride);
```
While we cannot directly use this because of the texture binds, when bindless
textures we can compress the draw call to a single draw call!
```cpp
for (auto& mesh : meshes) {
    bind(mesh.vertices);
    bind(mesh.indices);
    bind(mesh.commands);
    bind(mesh.materials);
    glMultiDrawElementsIndirect(GL_TRIANGLES, GL_UNSIGNED_INT, reinterpret_cast<const void*>(0), commands.size(), stride);
}
```
Wow... and even better you no longer have to sort the indices array because you
can just specify the index counts per primitive again. But that is a trade off
since you have to store duplicate materials in the materials array or at least
store material indices per primitive as the calls are now per primitive again.

### Command of the Future

A powerful aspect of using commands instead of directly submitting calls is you
can have other threads generate these commands while the main thread is
rendering. After that frame is done, all it has to do is now use bind the
generated command buffer.

Another pro is the commands can be bound to something like a SSBO and accessed
by the GPU using something like a compute shader. This might be good for directly
removing some calls base on some properties.

## Less Buffers?

Shocking, especially after all that. But having a per-mesh buffer still means
binds per mesh. And more complex .obj or .gltf files will have a lot more than
just one mesh, so the cost might add up. What if we merge all the mesh buffers
into a singular large buffer? The draw call becomes laughably simple
```cpp
bind(global_vertices);
bind(global_indices);
bind(global_commands);
bind(global_materials);
glMultiDrawElementsIndirect(GL_TRIANGLES, GL_UNSIGNED_INT, reinterpret_cast<const void*>(0), global_commands.size(), stride);
```
However bookkeeping is now no laughing matter. If we are using something like
an ECS or maybe even a list to manage a list of objects to render, we now also have
to update out global buffers.

### BufferKeeping

A naive way might be just reupload the whole data on a change. That is
obviously not too good when there a lot of objects. Additionally, if the buffer
runs out of space, it would have to be resized. Note that OpenGL has no way to
resize a buffer without discarding the previous data. One way would be to
create a new buffer and use `glCopyNamedBufferSubData` and friends to more
efficiently copy the buffer over. But we still need a way to actually manage
and control the buffer.

### Huge Buffer

Allocating a huge buffer up front and using it might be an option. The question
is generally how large of a buffer to use. Using this, one might have a persistently
mapped buffer or just buffer data to it normally.

Removing objects might require actually removing the data from it or simply
adding it to a free list. Adding objects may be an append or reusing the free
list.

However, deleting data in the middle of the buffer might cause fragmentation,
as smaller and smaller spaces of memory appear. Defragmenting these is now
another concern.

### Memory Pools

This is similar to a huge buffer, except it may dynamically grow instead of
being a huge fixed size. The only difference here is the pool may grow by some
factor when running out of space. These pools are generally fixed-sized, for
performance and reducing the issue of fragmentation. This means a pool
for vertices, another for indices, another for materials, and so on.

## Vulkan and Beyond

So how does this all relate to Vulkan?

* DSA: Vulkan reduces states and requires you to explicitly declare a renderpass
* Uniforms: Vulkan uses descriptor sets to bind all uniforms and buffer at once
* MDI: Vulkan uses a command system by default, and syncing primitives thrown in too
* Buffers: Vulkan encourages and kind of forces large buffer allocations (see VMA)

Vulkan is much more verbose, but it really seems to try to fix OpenGL's mistake
by removing state and increasing flexbility. In fact, vertex array/attribute
objects are entirely missing from Vulkan, just as their usages diminish on
OpenGL (vertex pulling).

* [vkguide](https://vkguide.dev/docs/chapter-3/triangle_mesh_code/)
* [Vulkan on Memory Allocation](https://docs.vulkan.org/guide/latest/memory_allocation.html)
* [Vulkan Memory Allocator (VMA)](https://github.com/GPUOpen-LibrariesAndSDKs/VulkanMemoryAllocator)
* [Mesh Shaders](https://developer.nvidia.com/blog/introduction-turing-mesh-shaders/)

## Resources

Will post more as I learn more. It is likely the techniques apply to more advanced
rendering subjects such as bloom and shadows. Some more related topics.

### More OpenGL!

* [Modern OpenGL Guides](https://ktstephano.github.io/)
* [Modern OpenGL Github](https://github.com/fendevel/Guide-to-Modern-OpenGL-Functions)
* [Modern OpenGL Best Practices](https://juandiegomontoya.github.io/modern_opengl.html)
* [Fwog Safe OpenGL library](https://github.com/JuanDiegoMontoya/Fwog)

### Threading

Will likely use a fiber based job system.

* [wicked engine simple job system](https://wickedengine.net/2018/11/simple-job-system-using-standard-c/)
* [poor man's threading](https://etodd.io/2016/01/12/poor-mans-threading-architecture/)
* [OurMachinary fiber system](https://ruby0x1.github.io/machinery_blog_archive/post/fiber-based-job-system/index.html)
* [NaughtyDog engine fiber system](https://www.youtube.com/watch?v=HIVBhKj7gQU)

### Memory Pools

Mostly dealing with defragmentation. In general it is a good idea to create
several fixed sized pools. There are a lot of implementations

* memory arenas
* slab allocators
* linear allocators (might also be called an arena as well, not sure)
* pool allocators
* linked list for tracking allocations or free spaces

Even with custom allocators like these, VirtualAlloc, discussed below, is still an option.

* [r/vulkan dealing with memory defragmentation](https://www.reddit.com/r/vulkan/comments/zmpsga/how_to_deal_with_memory_fragmentation/)
* [r/cpp dealing with memory fragmentation](https://www.reddit.com/r/cpp/comments/13fbixk/how_does_memory_pool_combat_memory_fragmentation/)
* [r/cpp making my smart memory pool much smarter](https://www.reddit.com/r/cpp/comments/smnv24/making_my_smart_memory_pool_much_smarter_and/)
* [r/c memory pool design](https://www.reddit.com/r/C_Programming/comments/pux8xe/question_regarding_pool_buffer_design_aka_memory/)
* [bitsquid custom memory allocation in c++](https://bitsquid.blogspot.com/2010/09/custom-memory-allocation-in-c.html)

### Virtual Memory

Virtual memory may avoid the huge upfront size allocation of the huge buffer.

* [OurMachinary Virtual Memory Tricks](https://ruby0x1.github.io/machinery_blog_archive/post/virtual-memory-tricks/index.html)

### Primitive Buffers

Might be good for drawing simple shapes.

* [OurMachinary Primitive Buffers](https://ruby0x1.github.io/machinery_blog_archive/post/ui-rendering-using-primitive-buffers/index.html)

### Architecture

Some notes, mostly based off OurMachinary's design. Likely would not use as it
is rather difficult to pull off hot reloading and pure C only.

* [Physical Design](https://ruby0x1.github.io/machinery_blog_archive/post/physical-design/index.html)
* [Modern Rendering Architecture](https://ruby0x1.github.io/machinery_blog_archive/post/a-modern-rendering-architecture/index.html)
* [Little Machines](https://ruby0x1.github.io/machinery_blog_archive/post/little-machines-working-together-part-1/index.html)
* [Little Machines 2](https://ruby0x1.github.io/machinery_blog_archive/post/little-machines-working-together-part-2/index.html)
* [OurMachinary Inspired Engine](https://github.com/imgeself/imge)
* [GameDev Old Enginuity](https://gamedev.net/tutorials/programming/general-and-gameplay-programming/enginuity-part-i-r1947/)

### Commands

A note on reordering commands and more general commands. Some of these designs
focus on abstracting multiple APIs. That is something to keep in mind when
examining the complexity.

* [OurMachinary Commands Management](https://ruby0x1.github.io/machinery_blog_archive/post/vulkan-command-buffer-management/index.html)
* [Sort-Based Render Calls](https://realtimecollisiondetection.net/blog/?p=86)
