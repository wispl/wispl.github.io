---
title: OpenGL
date: 2025-01-13
---
# OpenGL

Yada yada graphics API, communicates with GPU, blah blah. Under the hood it is
a state engine, which is why there are all these binds, unbinds and sets. This
is kind of bad, because state is bad, and so later OpenGL versions and Vulkan
try to move away from state and avoid this bind, unbind loop. 

In fact, recent OpenGL versions have Direct State Access where the caller can
perform a set operation without binding and unbinding the target. This text
will be using the Direct State Access variant for as many of the OpenGL
functions here as possible.

## Startup

Unlike Vulkan, to obtain a OpenGL context, we need a window. So we open up a
window and obtain one, either manually or through something like SDL or GLFW.
Now we can start GL-ing.

Actually, before that, we need to load OpenGL functions for the given platform
using something called a wrangler, the most modern option seems to be GLAD.

Debug outputs can help a lot for ... debugging.
```c
glEnable(GL_DEBUG_OUTPUT);
glDebugMessageCallback(callback, nullptr);
```
Where a callback is of the form
```c
void callback(GLenum source, GLenum type, GLuint id, GLenum severity,
              GLsizei length, const GLchar* message, const void*  user_param)
```

## Shaders and Programs

Shaders are just fancy term for code run in a graphics pipeline. A program is a
collection of shaders linked and ready to render.

The code without error handling is along the lines of
```c
GLuint program = glCreateProgram();
GLuint shader = glCreateShader(GL_VERTEX_SHADER);

// Repeat for each shader type
glShaderSource(shader, 1, &data, &size);
glCompileShader(shader);
glAttachShader(program, shader);

glLinkProgram(program);
```
See the `GL_VERTEX_SHADER`? There are different types of shaders which run in
different points of the graphics pipeline. After binding the program with
`glUseProgam(progam)`, we are ready to render... except what are we rendering?

## Buffers

The concept of buffers here is not really all that different, they just store
data, except in the memory allocated by the GPU. As usual, they are unformatted.
```c
GLuint buffer = GL_NONE;
glCreateBuffers(1, &buffer);
```
Now that we have a buffer, we can pass some data to it. Note that we have to
pass in the size of the passed in data, which can be an array or vector, not
its length.
```c
// non-fixed size
glNamedBufferData(buffer, size, *data, flags);
// fixed size, more performance
glNamedBufferStorage(buffer, size, *data, flags);
// to update data
glNamedBufferSubData(buffer, size, *data, flags);
```
There are a lot of other ways to update and set data, all with their pros and
caveats. Anyways, this data is unformatted right? How are you suppose to render
with a random stream of data?

## Vertex Arrays

We can solve the unformatted data issue by passing in pre-formatted data and
telling OpenGL how it is formatted. Kind of boring, right? There is now also
something called vertex pulling to avoid this vertex array, but that has its
own implications.
```c
GLuint vao = GL_NONE;
glCreateVertexArrays(1, &vao);
```
If our data is formatted as a vertex as follows
```c
struct Vertex { vec3 pos; vec3 normal; vec2 uv };
```
There are clearly three variables, or in OpenGL-land, attributes, so we should OpenGL that,
```c
glEnableVertexArrayAttrib(vao, 0);
glEnableVertexArrayAttrib(vao, 1);
glEnableVertexArrayAttrib(vao, 2);
```
And then the format in detail, including the offsets
```c
glVertexArrayAttribFormat(vao, 0, 3, GL_FLOAT, GL_FALSE, offsetof(Vertex, pos));
glVertexArrayAttribFormat(vao, 1, 3, GL_FLOAT, GL_FALSE, offsetof(Vertex, normal));
glVertexArrayAttribFormat(vao, 2, 2, GL_FLOAT, GL_FALSE, offsetof(Vertex, uv));
```
And no we have to enable the binding, weird huh,
```c
glVertexArrayAttribBinding(vao, 0, 0);
glVertexArrayAttribBinding(vao, 1, 0);
glVertexArrayAttribBinding(vao, 2, 0);
```
Afterwards we have to bind this along with the buffers we created earlier, so
OpenGL knows which vertex array describes which set of buffers
```c
glBindVertexArray(vao);
glVertexArrayVertexBuffer(vao, 0, vbo, 0, sizeof(Vertex));
```
If we also want to bind a buffer which stores only the indices of the vertices to be rendered
in order to de-duplicate duplicate vertices, for example.
```c
glVertexArrayElementBuffer(vao, ebo);
```
Note we can actually rebind other buffers to the bound vertex array afterwards.
And no we can render, right?

## Rendering

This section is about rendering, but not how to render, boo. Okay, there are a
couple of different "models" of rendering

* regular
* indexed
* instancing

Regular is the simplest, drawing whatever is in the buffer using something like
triangles, strips, rectangles, whatever. Index takes a step up and draws
vertices based on indices and connects them. And instancing uses GPU voodoo
magic to draw a set of the same model, mesh, shape, whatever efficiently.

The indexed and instancing models can be used together and there are different
variants to tune how you index the instances. If the function takes indices, it
is using indexed draw, if it takes arguments like `instancecount`, it uses
instancing. If it has both, then it uses both.

## Draw Commands

Newer OpenGL has something called draw commands, where we can directly submit a
buffer of draw commands to the GPU instead of submit them one by one. Besides
being able to pack multiple related draw commands in one go, this paves the way
for generating draw commands in another buffer ahead of time, where the current
draw buffer is executed. Then the new draw buffer can be submitted while another
one is being prepared.

This one is for glMultiDrawElements, as evident by index and base_instance.
```c
struct DrawCommand {
	std::uint32_t count;		// how many indices
	std::uint32_t instance_count;	// how many instances to draw
	std::uint32_t first_index;	// offset to the first indice
	std::int32_t base_vertex;	// offset to the first vertex
	std::uint32_t base_instance;	// offset for when drawing multiple instances
};
```
We can add these commands to a buffer similar to the vertices from before
```c
GLuint cmd_buffer;
glCreateBuffers(1, &buffer);
glNamedBufferStorage(cmd_buffer, command_vector_size, *data, flags);
```
And then binding it and performing the draw
```c
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, index_buffer);
glBindBuffer(GL_DRAW_INDIRECT_BUFFER, cmd_buffer);

glMultiDrawElementsIndirect(GL_TRIANGLES, GL_UNSIGNED_INT, offset, cmd_vector_len, stride);
```

We can draw now! But what exactly are we going to draw?

## glTF

glTF is a file format for specifying a scene, which turns out to have all the
information needed to render said scene. And in binary format, too, for
performance. There are other details like skin, animation, camera, and sampler
which will be ignored for now in favor of the geometry.

### Nodes

The scene is composed of nodes, which can hold children nodes, and more
importantly a mesh. Any of the root nodes can be thought of as the subject to
be rendered. The node can hold transformation information, such as position,
rotation, and scale.

Why nodes instead of just meshes? A model may have duplicate meshes, like the
wheels of a car, and instead of respecifying the mesh, the format can represent
it as a child node with a different position instead.

### Meshes

A mesh is just a list of primitives. Primitives can be a point, line or triangle. It contains

* indices
* attributes, like normal, position, and texture coordinates
* material

Note that these values are not the values themselves, but rather an index to a
buffer stored by the glTF. These values then index accessors. And long story
short, these accessors index buffer views which segment the buffers and gives
the actual values.

Oh and there is also a sparse accessors which is different from the default
one. And also primitives can be morphed or deformed, by specifying a morph
target. Not getting into that.

### Materials

Bet you glazed over the materials part of the primitive, well here it is. Materials
define roughly how the primitive should look, in terms of lighting and texture. Lighting
is defined using the PBR, physically based rendering model, and describes a whole set
of properties important for lighting.

The primitive can either use a texture to define its color in addition to RGB
scaling values. Ummm, read the specs, basically

* baseColorFactor: scaling for RGB, used as color if baseColorTexture is missing
* metallicFactor: scaling for metalness in blue channel, substitutes metallicRoughnessFactorTexture
* roughnessFactor: scaling for metalness in green channel, substitutes metallicRoughnessFactorTexture
* normalTexture
* occulsionTexture
* emmisiveTexture

The textures point to the index the texture in a buffer, similar to the story
with the mesh and geometry. There can also be multiple textures to be bound in
a property.

### Textures

Pretty much just an image... yes. This can point to a file via a URI, or the
actual buffer data. There is also sampling information for how to sample it,
the sampler in question being the OpenGL texture samplers.

### Extensions, Skins, Cameras, Animation

We are not doing this, skip, skip skip!

## Renderer Design

Must haves

* Multiple programs, for different forms of rendering
* Singular VAO, or keep it as little as possible, format should not vary that much
* Scenegraph, whether as a list or tree
* nodes represented as glTF nodes, generally, but can be other things too
* mesh should have draw command buffers, vertex buffers, and index buffers, and materials
* sort draws base on materials
* primitives should hold indices to command buffers

Nice to haves

* UI via IMgui
* async and concurrency
* ECS
* hot reload

## Links

### OpenGL

https://github.com/fendevel/Guide-to-Modern-OpenGL-Functions?tab=readme-ov-file#faster-reads-and-writes-with-persistent-mapping
https://ktstephano.github.io/
https://nlguillemot.wordpress.com/2016/11/18/opengl-renderer-design/
https://www.khronos.org/opengl/wiki/Buffer_Object_Streaming

### Renderer Design

https://bitsquid.blogspot.com/2017/02/stingray-renderer-walkthrough.html
https://ruby0x1.github.io/machinery_blog_archive/
