/**
 * SimpleProject is a project template for the most common 1-scene, 1-camera projects
 * @constructor
 */
HX.SimpleProject = function()
{
    this._initialized = false;
};

HX.SimpleProject.prototype =
{
    //override or assign these
    onInit: function() {},
    onUpdate: function(dt) {},

    // automatically starts as well
    init: function(canvas, initOptions)
    {
        if (this._initialized) throw "Already initialized project!";

        HX.init(canvas, initOptions);
        this._resizeCanvas();

        this._scene = new HX.Scene();
        this._camera = new HX.PerspectiveCamera();
        this._scene.attach(this._camera);
        this._renderer = new HX.Renderer();

        var self = this;

        window.addEventListener('resize', function()
        {
            self._resizeCanvas.call(self);
        });

        this.onInit();
        this._initialized = true;
        this.start();
    },

    start: function()
    {
        HX.onFrame.bind(this._update, this);
    },

    stop: function()
    {
        HX.onFrame.unbind(this._update);
    },

    get renderer()
    {
        return this._renderer;
    },

    get scene()
    {
        return this._scene;
    },

    set scene(value)
    {
        this._scene.detach(this._camera);
        this._scene = value;
        this._scene.attach(this._camera);
    },

    get camera()
    {
        return this._camera;
    },

    set camera(value)
    {
        this._scene.detach(this._camera);
        this._camera = value;
        this._scene.attach(this._camera);
    },

    _update: function(dt)
    {
        HX._clearGLStats();

        this.onUpdate(dt);

        HX.clear();
        this._renderer.render(this._camera, this._scene, dt);
    },

    _resizeCanvas: function()
    {
        this._canvas = document.getElementById('webglContainer');
        this._canvas.width = this._canvas.clientWidth;
        this._canvas.height = this._canvas.clientHeight;
    }
};