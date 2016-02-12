var project = new DemoProject();

project.onInit = function()
{
    this.camera.addComponent(new OrbitController());

    initScene(this.scene);
};

window.onload = function ()
{
    project.init(document.getElementById('webglContainer'));
};

function initScene(scene)
{
    var light = new HX.DirectionalLight();
    light.direction = new HX.Float4(-1.0, -1.0, -1.0, 0.0);
    light.intensity = 5.0;
    scene.attach(light);

    var textureLoader = new HX.AssetLoader(HX.JPG);
    var texture = textureLoader.load("textures/marbletiles_diffuse_white.jpg");
    var material = new HX.PBRMaterial();
    material.colorMap = texture;

    var primitive = HX.SpherePrimitive.create(
        {
            radius:.25,
            numSegmentsH: 20,
            numSegmentsW: 30
        });

    scene.attach(new HX.ModelInstance(primitive, material));
}