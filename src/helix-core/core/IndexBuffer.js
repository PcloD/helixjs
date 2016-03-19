/**
 *
 * @constructor
 */
HX.IndexBuffer = function()
{
    this._buffer = HX_GL.createBuffer();
};

HX.IndexBuffer.prototype = {
    constructor: HX.IndexBuffer,

    /**
     * Uploads data for the buffer.
     * @param data The data to upload, must be a Int16Array object.
     * @param usageHint An optional usage hint for the buffer.
     */
    uploadData: function(data, usageHint)
    {
        if (usageHint === undefined)
            usageHint = HX_GL.STATIC_DRAW;

        this.bind();
        HX_GL.bufferData(HX_GL.ELEMENT_ARRAY_BUFFER, data, usageHint);
    },

    dispose: function()
    {
        if (this._buffer) {
            HX_GL.deleteBuffer(this._buffer);
            this._buffer = 0;
        }
    },

    /**
     * @private
     */
    bind: function()
    {
        HX_GL.bindBuffer(HX_GL.ELEMENT_ARRAY_BUFFER, this._buffer);
    }
};