/**
 *
 * @type {{}}
 */
HX.UniformSetter = {};

HX.UniformSetter.getSetters = function(shader) {
    if (HX.UniformSetter._table === undefined)
        HX.UniformSetter._init();

    return HX.UniformSetter._findSetters(shader);
};

HX.UniformSetter._findSetters = function(shader)
{
    var setters = [];
    for (var uniformName in HX.UniformSetter._table) {
        var location = HX_GL.getUniformLocation(shader._program, uniformName);
        if (location == null) continue;
        var setter = new HX.UniformSetter._table[uniformName]();
        setters.push(setter);
        setter.location = location;
    }

    return setters;
};

HX.UniformSetter._init = function()
{
    HX.UniformSetter._table = {};

    HX.UniformSetter._table.hx_worldMatrix = HX.WorldMatrixSetter;
    HX.UniformSetter._table.hx_worldViewMatrix = HX.WorldViewMatrixSetter;
    HX.UniformSetter._table.hx_wvpMatrix = HX.WorldViewProjectionSetter;
    HX.UniformSetter._table.hx_viewMatrix = HX.ViewMatrixSetter;
    HX.UniformSetter._table.hx_projectionMatrix = HX.ProjectionSetter;
    HX.UniformSetter._table.hx_inverseProjectionMatrix = HX.InverseProjectionSetter;
    HX.UniformSetter._table.hx_inverseWVPMatrix = HX.InverseWVPSetter;
    HX.UniformSetter._table.hx_viewProjectionMatrix = HX.ViewProjectionSetter;
    HX.UniformSetter._table.hx_inverseViewProjectionMatrix = HX.InverseViewProjectionSetter;
    HX.UniformSetter._table.hx_normalWorldMatrix = HX.NormalWorldMatrixSetter;
    HX.UniformSetter._table.hx_normalWorldViewMatrix = HX.NormalWorldViewMatrixSetter;
    HX.UniformSetter._table.hx_cameraWorldPosition = HX.CameraWorldPosSetter;
    HX.UniformSetter._table.hx_cameraWorldMatrix = HX.CameraWorldMatrixSetter;
    HX.UniformSetter._table.hx_cameraFrustumRange = HX.CameraFrustumRangeSetter;
    HX.UniformSetter._table.hx_rcpCameraFrustumRange = HX.RCPCameraFrustumRangeSetter;
    HX.UniformSetter._table.hx_cameraNearPlaneDistance = HX.CameraNearPlaneDistanceSetter;
    HX.UniformSetter._table.hx_cameraFarPlaneDistance = HX.CameraFarPlaneDistanceSetter;
    HX.UniformSetter._table.hx_renderTargetResolution = HX.RenderTargetResolutionSetter;
    HX.UniformSetter._table.hx_rcpRenderTargetResolution = HX.RCPRenderTargetResolutionSetter;
    HX.UniformSetter._table.hx_dither2DTextureScale = HX.Dither2DTextureScaleSetter;
    HX.UniformSetter._table["hx_skinningMatrices[0]"] = HX.SkinningMatricesSetter;
    HX.UniformSetter._table["hx_poissonDisk[0]"] = HX.PoissonDiskSetter;
};


HX.WorldMatrixSetter = function()
{
};

HX.WorldMatrixSetter.prototype.execute = function (camera, renderItem)
{
    HX_GL.uniformMatrix4fv(this.location, false, renderItem.worldMatrix._m);
};


HX.ViewProjectionSetter = function()
{
};

HX.ViewProjectionSetter.prototype.execute = function(camera)
{
    HX_GL.uniformMatrix4fv(this.location, false, camera.viewProjectionMatrix._m);
};

HX.InverseViewProjectionSetter = function()
{
};

HX.InverseViewProjectionSetter.prototype.execute = function(camera)
{
    HX_GL.uniformMatrix4fv(this.location, false, camera.inverseViewProjectionMatrix._m);
};

HX.InverseWVPSetter = function()
{
};

HX.InverseWVPSetter.prototype.execute = function(camera)
{
    HX_GL.uniformMatrix4fv(this.location, false, camera.inverseViewProjectionMatrix._m);
};

HX.ProjectionSetter = function()
{
};

HX.ProjectionSetter.prototype.execute = function(camera)
{
    HX_GL.uniformMatrix4fv(this.location, false, camera.projectionMatrix._m);
};

HX.InverseProjectionSetter = function()
{
};

HX.InverseProjectionSetter.prototype.execute = function(camera)
{
    HX_GL.uniformMatrix4fv(this.location, false, camera.inverseProjectionMatrix._m);
};

HX.WorldViewProjectionSetter = function()
{
};

HX.WorldViewProjectionSetter.prototype.execute = function()
{
    var matrix = new HX.Matrix4x4();
    var m = matrix._m;
    return function(camera, renderItem)
    {
        matrix.multiply(camera.viewProjectionMatrix, renderItem.worldMatrix);
        HX_GL.uniformMatrix4fv(this.location, false, m);
    };
}();

HX.WorldViewMatrixSetter = function()
{
    this._matrix = new HX.Matrix4x4();
};

HX.WorldViewMatrixSetter.prototype.execute = function(){
    var matrix = new HX.Matrix4x4();
    var m = matrix._m;
    return function (camera, renderItem)
    {
        matrix.multiply(camera.viewMatrix, renderItem.worldMatrix);
        HX_GL.uniformMatrix4fv(this.location, false, m);
    }
}();


HX.NormalWorldMatrixSetter = function()
{
};

HX.NormalWorldMatrixSetter.prototype.execute = function() {
    var data = new Float32Array(9);
    return function (camera, renderItem)
    {
        renderItem.worldMatrix.writeNormalMatrix(data);
        HX_GL.uniformMatrix3fv(this.location, false, data);    // transpose of inverse
    }
}();


HX.NormalWorldViewMatrixSetter = function()
{
};

HX.NormalWorldViewMatrixSetter.prototype.execute = function() {
    var matrix = new HX.Matrix4x4();
    var data = new Float32Array(9);

    return function (camera, renderItem)
    {
        matrix.multiply(camera.viewMatrix, renderItem.worldMatrix);
        matrix.writeNormalMatrix(data);
        HX_GL.uniformMatrix3fv(this.location, false, data);    // transpose of inverse
    }
}();

HX.CameraWorldPosSetter = function()
{
};

HX.CameraWorldPosSetter.prototype.execute = function (camera)
{
    var arr = camera.worldMatrix._m;
    HX_GL.uniform3f(this.location, arr[12], arr[13], arr[14]);
};

HX.CameraWorldMatrixSetter = function()
{
};

HX.CameraWorldMatrixSetter.prototype.execute = function (camera)
{
    var matrix = camera.worldMatrix;
    HX_GL.uniformMatrix4fv(this.location, false, matrix._m);
};

HX.CameraFrustumRangeSetter = function()
{
};

HX.CameraFrustumRangeSetter.prototype.execute = function (camera)
{
    HX_GL.uniform1f(this.location, camera._farDistance - camera._nearDistance);
};

HX.RCPCameraFrustumRangeSetter = function()
{
};

HX.RCPCameraFrustumRangeSetter.prototype.execute = function (camera)
{
    HX_GL.uniform1f(this.location, 1.0 / (camera._farDistance - camera._nearDistance));
};

HX.CameraNearPlaneDistanceSetter = function()
{
};

HX.CameraNearPlaneDistanceSetter.prototype.execute = function (camera)
{
    HX_GL.uniform1f(this.location, camera._nearDistance);
};

HX.CameraFarPlaneDistanceSetter = function()
{
};

HX.CameraFarPlaneDistanceSetter.prototype.execute = function (camera)
{
    HX_GL.uniform1f(this.location, camera._farDistance);
};

HX.ViewMatrixSetter = function()
{
};

HX.ViewMatrixSetter.prototype.execute = function (camera)
{
    HX_GL.uniformMatrix4fv(this.location, false, camera.viewMatrix._m);
};

HX.RenderTargetResolutionSetter = function()
{
};

HX.RenderTargetResolutionSetter.prototype.execute = function (camera)
{
    HX_GL.uniform2f(this.location, camera._renderTargetWidth, camera._renderTargetHeight);
};

HX.RCPRenderTargetResolutionSetter = function()
{
};

HX.RCPRenderTargetResolutionSetter.prototype.execute = function (camera)
{
    HX_GL.uniform2f(this.location, 1.0/camera._renderTargetWidth, 1.0/camera._renderTargetHeight);
};

HX.Dither2DTextureScaleSetter = function()
{
};

HX.Dither2DTextureScaleSetter.prototype.execute = function (camera)
{
    HX_GL.uniform2f(this.location, camera._renderTargetWidth / HX.DEFAULT_2D_DITHER_TEXTURE.width, camera._renderTargetHeight / HX.DEFAULT_2D_DITHER_TEXTURE.height);
};

HX.PoissonDiskSetter = function()
{
};

HX.PoissonDiskSetter.prototype.execute = function ()
{
    HX_GL.uniform2fv(this.location, HX.PoissonDisk.DEFAULT_FLOAT32);
};

HX.SkinningMatricesSetter = function()
{
    this._data = new Float32Array(64 * 16);
};

HX.SkinningMatricesSetter.prototype.execute = function (camera, renderItem)
{
    var skeleton = renderItem.skeleton;

    if (skeleton) {
        var matrices = renderItem.skeletonMatrices;
        var numJoints = skeleton.numJoints;
        var j = 0;
        for (var i = 0; i < numJoints; ++i) {
            matrices[i].writeData(this._data, j);
            j += 16;
        }
        HX_GL.uniformMatrix4fv(this.location, false, this._data);
    }
};


