vertex_attribute vec4 hx_position;
vertex_attribute vec2 hx_texCoord;

varying_out vec2 uv;
varying_out vec3 viewDir;

uniform mat4 hx_inverseProjectionMatrix;

void main()
{
    uv = hx_texCoord;
    viewDir = hx_getLinearDepthViewVector(hx_position.xy, hx_inverseProjectionMatrix);
    gl_Position = hx_position;
}