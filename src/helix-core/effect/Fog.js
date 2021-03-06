/**
 * @classdesc
 * Fog is an {@linkcode Effect} added to the Camera that applies a fog effect to the scene.
 *
 * @property {number} density The "thickness" of the fog. Keep it tiny.
 * @property {Color} tint The color of the fog.
 * @property {number} heightFallOff The fall-off based on the height. This is to simulate a thinning atmosphere.
 * @property {number} startDistance The distance from the camera at which the effect should start to be applied.
 *
 * @constructor
 * @param {Number} [density] The "thickness" of the fog. Keep it tiny.
 * @param {Color} [tint] The color of the fog.
 * @param {Number} [heightFallOff] The fall-off based on the height. This is to simulate a thinning atmosphere.
 * @param {Number} [startDistance] The distance from the camera at which the effect should start to be applied.
 *
 * @extends Effect
 *
 * @author derschmale <http://www.derschmale.com>
 */
import {EffectPass} from "./EffectPass";
import {ShaderLibrary} from "../shader/ShaderLibrary";
import {Effect} from "./Effect";
import {GL} from "../core/GL";
import {Color} from "../core/Color";
import {META} from "../Helix";


function Fog(density, tint, heightFallOff, startDistance)
{
    Effect.call(this);

    this._fogPass = new EffectPass(ShaderLibrary.get("fog_vertex.glsl"), ShaderLibrary.get("fog_fragment.glsl"));
    this.needsNormalDepth = true;
    this.density = density === undefined? .001 : density;
    this._tint = new Color(1, 1, 1, 1);
    if (tint !== undefined)
        this.tint = tint;
    this.startDistance = startDistance === undefined? 0 : startDistance;
    this.heightFallOff = heightFallOff === undefined? 0.01 : heightFallOff;
}

Fog.prototype = Object.create(Effect.prototype,
    {
        density: {
            get: function()
            {
                return this._density;
            },
            set: function(value)
            {
                this._density = value;
                this._fogPass.setUniform("density", value);
            }
        },

        tint: {
            get: function ()
            {
                return this._tint;
            },
            set: function (value)
            {
                this._tint.copyFrom(value);

                if (META.OPTIONS.useGammaCorrection)
                    this._tint.gammaToLinear();

                this._fogPass.setUniform("tint", {x: value.r, y: value.g, z: value.b});
            }
        },

        startDistance: {
            get: function()
            {
                return this._startDistance;
            },
            set: function(value)
            {
                this._startDistance = value;
                this._fogPass.setUniform("startDistance", value);
            }
        },

        heightFallOff: {
            get: function()
            {
                return this._heightFallOff;
            },
            set: function(value)
            {
                this._heightFallOff = value;
                this._fogPass.setUniform("heightFallOff", value);
            }
        }
    }
);

/**
 * @ignore
 */
Fog.prototype.draw = function(renderer, dt)
{
    GL.setRenderTarget(this.hdrTarget);
    GL.clear();
	this._fogPass.draw(renderer);
};

export { Fog };