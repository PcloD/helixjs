import { ShaderLibrary } from '../shader/ShaderLibrary';

/**
 * <p>LightingModel defines a lighting model to be used by a {@Material}. A default lighting model can be assigned to
 * {@linkcode InitOptions#defaultLightingModel}, which will mean any material will use it by default. In addition,
 * any material using the default lighting model without a {@linkcode BlendState} will use the deferred rendering path,
 * potentially increasing the performance for heavily lit scenes.</p>
 *
 * <p>You can add pass your own lighting models as a string into a material, as long as the glsl code contains the
 * functions hx_brdf and hx_probeGeometricShadowing</p>
 *
 * @namespace
 *
 * @author derschmale <http://www.derschmale.com>
 *
 */
export var LightingModel =
{
    /** No lighting applied when rendering */
    Unlit: null,
    /** Normalized Blinn-Phong shading applied */
    BlinnPhong: ShaderLibrary.get("lighting_blinn_phong.glsl"),
    /** GGX shading applied */
    GGX: ShaderLibrary.get("lighting_ggx.glsl")
};