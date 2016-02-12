/**
 * Base function for basic copies
 * @param fragmentShader The fragment shader to use while copying.
 * @constructor
 */
HX.CustomCopyShader = function(fragmentShader)
{
    HX.Shader.call(this);
    this.init(HX.ShaderLibrary.get("copy_vertex.glsl"), fragmentShader);

    this._textureLocation = HX.GL.getUniformLocation(this._program, "sampler");
    this._positionAttributeLocation = HX.GL.getAttribLocation(this._program, "hx_position");
    this._texCoordAttributeLocation = HX.GL.getAttribLocation(this._program, "hx_texCoord");

    HX.GL.useProgram(this._program);
    HX.GL.uniform1i(this._textureLocation, 0);
};

HX.CustomCopyShader.prototype = Object.create(HX.Shader.prototype);

HX.CustomCopyShader.prototype.execute = function(rect, texture)
{
    HX.setDepthTest(HX.Comparison.DISABLED);
    HX.setCullMode(HX.CullMode.NONE);

    rect._vertexBuffers[0].bind();
    rect._indexBuffer.bind();

    this.updateRenderState();

    texture.bind(0);

    HX.GL.vertexAttribPointer(this._positionAttributeLocation, 2, HX.GL.FLOAT, false, 16, 0);
    HX.GL.vertexAttribPointer(this._texCoordAttributeLocation, 2, HX.GL.FLOAT, false, 16, 8);

    HX.enableAttributes(2);

    HX.drawElements(HX.GL.TRIANGLES, 6, 0);
};


/**
 * Copies one texture's channels (in configurable ways) to another's.
 * @param channel Can be either x, y, z, w or any 4-component swizzle. default is xyzw, meaning a simple copy
 * @constructor
 */
HX.CopyChannelsShader = function(channel, copyAlpha)
{
    channel = channel || "xyzw";
    copyAlpha = copyAlpha === undefined? true : copyAlpha;

    var define = "#define extractChannels(src) ((src)." + channel + ")\n";

    if (copyAlpha) define += "#define COPY_ALPHA\n";

    HX.CustomCopyShader.call(this, define + HX.ShaderLibrary.get("copy_fragment.glsl"));
};

HX.CopyChannelsShader.prototype = Object.create(HX.CustomCopyShader.prototype);

/**
 * Copies one texture's channels (in configurable ways) to another's.
 * @param channel Can be either x, y, z, w or any 4-component swizzle. default is xyzw, meaning a simple copy
 * @constructor
 */
HX.MultiplyColorCopyShader = function()
{
    HX.CustomCopyShader.call(this, HX.ShaderLibrary.get("multiply_color_fragment.glsl"));

    HX.GL.useProgram(this._program);
    this._colorLocation = HX.GL.getUniformLocation(this._program, "color");
};

HX.MultiplyColorCopyShader.prototype = Object.create(HX.CustomCopyShader.prototype);

HX.MultiplyColorCopyShader.prototype.execute = function(rect, texture, color)
{
    HX.setDepthTest(HX.Comparison.DISABLED);
    HX.setCullMode(HX.CullMode.NONE);

    rect._vertexBuffers[0].bind();
    rect._indexBuffer.bind();

    this.updateRenderState();

    texture.bind(0);

    HX.GL.uniform4f(this._colorLocation, color.r, color.g, color.b, color.a);
    HX.GL.vertexAttribPointer(this._positionAttributeLocation, 2, HX.GL.FLOAT, false, 16, 0);
    HX.GL.vertexAttribPointer(this._texCoordAttributeLocation, 2, HX.GL.FLOAT, false, 16, 8);

    HX.enableAttributes(2);

    HX.drawElements(HX.GL.TRIANGLES, 6, 0);
};


/**
 * Copies data in one texture, using a second texture's alpha information
 * @constructor
 */
HX.CopyWithSeparateAlpha = function()
{
    HX.Shader.call(this);
    this.init(HX.ShaderLibrary.get("copy_vertex.glsl"), HX.ShaderLibrary.get("copy_with_separate_alpha_fragment.glsl"));

    this._textureLocation = HX.GL.getUniformLocation(this._program, "sampler");
    this._alphaLocation = HX.GL.getUniformLocation(this._program, "alphaSource");
    this._positionAttributeLocation = HX.GL.getAttribLocation(this._program, "hx_position");
    this._texCoordAttributeLocation = HX.GL.getAttribLocation(this._program, "hx_texCoord");

    HX.GL.useProgram(this._program);
    HX.GL.uniform1i(this._textureLocation, 0);
    HX.GL.uniform1i(this._alphaLocation, 1);
};

HX.CopyWithSeparateAlpha.prototype = Object.create(HX.Shader.prototype);

HX.CopyWithSeparateAlpha.prototype.execute = function(rect, texture, alphaTexture)
{
    HX.setDepthTest(HX.Comparison.DISABLED);
    HX.setCullMode(HX.CullMode.NONE);

    rect._vertexBuffers[0].bind();
    rect._indexBuffer.bind();

    this.updateRenderState();

    texture.bind(0);
    alphaTexture.bind(1);

    HX.GL.vertexAttribPointer(this._positionAttributeLocation, 2, HX.GL.FLOAT, false, 16, 0);
    HX.GL.vertexAttribPointer(this._texCoordAttributeLocation, 2, HX.GL.FLOAT, false, 16, 8);

    HX.enableAttributes(2);

    HX.drawElements(HX.GL.TRIANGLES, 6, 0);
};

/**
 * Unpack and draw depth values to screen
 */
HX.DebugDepthShader = function()
{
    HX.CustomCopyShader.call(this, HX.ShaderLibrary.get("debug_depth_fragment.glsl"));
};

HX.DebugDepthShader.prototype = Object.create(HX.CustomCopyShader.prototype);


/**
 * Copies the texture from linear space to gamma space.
 */
HX.ApplyGammaShader = function()
{
    HX.CustomCopyShader.call(this, HX.ShaderLibrary.get("copy_to_gamma_fragment.glsl"));
};

HX.ApplyGammaShader.prototype = Object.create(HX.CustomCopyShader.prototype);


/**
 * Draw the normals to screen.
 * @constructor
 */
HX.DebugNormalsShader = function()
{
    HX.CustomCopyShader.call(this, HX.ShaderLibrary.get("debug_normals_fragment.glsl"));
};

HX.DebugNormalsShader.prototype = Object.create(HX.CustomCopyShader.prototype);


/**
 * Converts depth buffer values to linear depth values
 */
HX.LinearizeDepthShader = function()
{
    HX.Shader.call(this);

    this.init(HX.ShaderLibrary.get("linearize_depth_vertex.glsl"), HX.ShaderLibrary.get("linearize_depth_fragment.glsl"));

    HX.GL.useProgram(this._program);

    this._textureLocation = HX.GL.getUniformLocation(this._program, "sampler");
    this._textureLocation2 = HX.GL.getUniformLocation(this._program, "sampler2");
    this._rcpFrustumRangeLocation = HX.GL.getUniformLocation(this._program, "hx_rcpCameraFrustumRange");
    this._projectionLocation = HX.GL.getUniformLocation(this._program, "hx_projectionMatrix");
    this._positionAttributeLocation = HX.GL.getAttribLocation(this._program, "hx_position");
    this._texCoordAttributeLocation = HX.GL.getAttribLocation(this._program, "hx_texCoord");

    HX.GL.uniform1i(this._textureLocation, 0);
    if (this._textureLocation2)
        HX.GL.uniform1i(this._textureLocation2, 1);
};

HX.LinearizeDepthShader.prototype = Object.create(HX.Shader.prototype);

HX.LinearizeDepthShader.prototype.execute = function(rect, texture, camera, texture2)
{
    HX.setDepthTest(HX.Comparison.DISABLED);
    HX.setCullMode(HX.CullMode.NONE);
    HX.setBlendState(null);

    rect._vertexBuffers[0].bind();
    rect._indexBuffer.bind();

    this.updateRenderState(camera);

    texture.bind(0);
    if (texture2)
        texture2.bind(1);

    HX.GL.vertexAttribPointer(this._positionAttributeLocation, 2, HX.GL.FLOAT, false, 16, 0);
    HX.GL.vertexAttribPointer(this._texCoordAttributeLocation, 2, HX.GL.FLOAT, false, 16, 8);
    HX.GL.uniform1f(this._rcpFrustumRangeLocation, 1.0/(camera.nearDistance - camera.farDistance));
    HX.GL.uniformMatrix4fv(this._projectionLocation, false, camera.projectionMatrix._m);

    HX.enableAttributes(2);

    HX.drawElements(HX.GL.TRIANGLES, 6, 0);
};


/**
 * Copies the contents from one frame projection to another projection
 * @constructor
 */
HX.ReprojectShader = function()
{
    HX.Shader.call(this);
    this.init(HX.ShaderLibrary.get("copy_vertex.glsl"), HX.ShaderLibrary.get("reproject_fragment.glsl"));

    this._reprojectionMatrix = new HX.Matrix4x4();
    this._sourceLocation = HX.GL.getUniformLocation(this._program, "source");
    this._depthLocation = HX.GL.getUniformLocation(this._program, "depth");
    this._reprojectionMatrixLocation = HX.GL.getUniformLocation(this._program, "reprojectionMatrix");
    this._positionAttributeLocation = HX.GL.getAttribLocation(this._program, "hx_position");
    this._texCoordAttributeLocation = HX.GL.getAttribLocation(this._program, "hx_texCoord");

    HX.GL.useProgram(this._program);
    HX.GL.uniform1i(this._sourceLocation , 0);
    HX.GL.uniform1i(this._depthLocation, 1);
};

HX.ReprojectShader.prototype = Object.create(HX.Shader.prototype);

HX.ReprojectShader.prototype.execute = function(rect, sourceTexture, depthTexture, camera, oldViewProjection)
{
    HX.setDepthTest(HX.Comparison.DISABLED);
    HX.setCullMode(HX.CullMode.NONE);

    rect._vertexBuffers[0].bind();
    rect._indexBuffer.bind();

    this.updateRenderState(camera);

    sourceTexture.bind(0);
    depthTexture.bind(1);

    this._reprojectionMatrix.multiply(oldViewProjection, camera.inverseViewProjectionMatrix);

    HX.GL.uniformMatrix4fv(this._reprojectionMatrixLocation, false, this._reprojectionMatrix._m);

    HX.GL.vertexAttribPointer(this._positionAttributeLocation, 2, HX.GL.FLOAT, false, 16, 0);
    HX.GL.vertexAttribPointer(this._texCoordAttributeLocation, 2, HX.GL.FLOAT, false, 16, 8);

    HX.enableAttributes(2);

    HX.drawElements(HX.GL.TRIANGLES, 6, 0);
};