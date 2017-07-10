(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define('HX', ['exports'], factory) :
	(factory((global.HX = global.HX || {})));
}(this, (function (exports) { 'use strict';

/**
 * ShaderLibrary is an object that will store shader code processed by the build process: contents of glsl files stored
 * in the glsl folder will be stored here and can be retrieved using their original filename.
 */
var ShaderLibrary = {
    _files: {},
    /**
     * Retrieves the shader code for a given filename.
     * @param filename The filename of the glsl code to retrieve
     * @param defines (Optional) An object containing variable names that need to be defined with the given value.
     * This should not be used for macros, which should be explicitly prepended
     * @param extensions (Optional) An array of extensions to be required
     * @returns A string containing the shader code from the files with defines prepended
     */
    get: function(filename, defines)
    {
        var defineString = "";

        for (var key in defines) {
            if (defines.hasOwnProperty(key)) {
                defineString += "#define " + key + " " + defines[key] + "\n";
            }
        }

        return defineString + ShaderLibrary._files[filename];
    }
};

ShaderLibrary._files['debug_bounds_fragment.glsl'] = 'uniform vec4 color;\n\nvoid main()\n{\n    gl_FragColor = color;\n}';

ShaderLibrary._files['debug_bounds_vertex.glsl'] = 'attribute vec4 hx_position;\n\nuniform mat4 hx_wvpMatrix;\n\nvoid main()\n{\n    gl_Position = hx_wvpMatrix * hx_position;\n}';

ShaderLibrary._files['deferred_ambient_light_fragment.glsl'] = 'varying vec2 uv;\n\nuniform sampler2D hx_gbufferAlbedo;\nuniform sampler2D hx_gbufferNormalDepth;\nuniform sampler2D hx_gbufferSpecular;\nuniform sampler2D hx_ssao;\n\nuniform vec3 hx_ambientColor;\n\n\nvoid main()\n{\n// TODO: move this to snippets_deferred file, along with the hx_decodeGBufferSpecular method\n    HX_GBufferData data = hx_parseGBuffer(hx_gbufferAlbedo, hx_gbufferNormalDepth, hx_gbufferSpecular, uv);\n\n    float ssao = texture2D(hx_ssao, uv).x;\n\n    gl_FragColor.xyz = hx_ambientColor * ssao * data.geometry.color.xyz;\n    gl_FragColor.w = 1.0;\n\n    #ifdef HX_GAMMA_CORRECT_LIGHTS\n        gl_FragColor = hx_linearToGamma(gl_FragColor);\n    #endif\n}';

ShaderLibrary._files['deferred_dir_light_fragment.glsl'] = 'varying vec2 uv;\nvarying vec3 viewDir;\n\nuniform HX_DirectionalLight hx_directionalLight;\n\nuniform sampler2D hx_gbufferAlbedo;\nuniform sampler2D hx_gbufferNormalDepth;\nuniform sampler2D hx_gbufferSpecular;\n\n#ifdef HX_SHADOW_MAP\nuniform sampler2D hx_shadowMap;\n#endif\n\nuniform float hx_cameraNearPlaneDistance;\nuniform float hx_cameraFrustumRange;\n\n\nvoid main()\n{\n// TODO: move this to snippets_deferred file, along with the hx_decodeGBufferSpecular method\n    HX_GBufferData data = hx_parseGBuffer(hx_gbufferAlbedo, hx_gbufferNormalDepth, hx_gbufferSpecular, uv);\n\n    float absViewZ = hx_cameraNearPlaneDistance + data.linearDepth * hx_cameraFrustumRange;\n	vec3 viewPosition = viewDir * absViewZ;\n    vec3 viewVector = normalize(viewPosition);\n    vec3 diffuse, specular;\n\n    hx_calculateLight(hx_directionalLight, data.geometry, viewVector, viewPosition, data.normalSpecularReflectance, diffuse, specular);\n\n    gl_FragColor.xyz = diffuse * data.geometry.color.xyz + specular;\n    gl_FragColor.w = 1.0;\n\n    #ifdef HX_SHADOW_MAP\n        gl_FragColor.xyz *= hx_calculateShadows(hx_directionalLight, hx_shadowMap, viewPosition);\n    #endif\n\n    #ifdef HX_GAMMA_CORRECT_LIGHTS\n        gl_FragColor = hx_linearToGamma(gl_FragColor);\n    #endif\n}';

ShaderLibrary._files['deferred_dir_light_vertex.glsl'] = 'attribute vec4 hx_position;\nattribute vec2 hx_texCoord;\n\nvarying vec2 uv;\nvarying vec3 viewDir;\n\nuniform mat4 hx_inverseProjectionMatrix;\n\nvoid main()\n{\n    uv = hx_texCoord;\n    viewDir = hx_getLinearDepthViewVector(hx_position.xy, hx_inverseProjectionMatrix);\n    gl_Position = hx_position;\n}';

ShaderLibrary._files['deferred_point_light_fragment.glsl'] = '//#ifdef HX_SPHERE_MESH\n//uniform mat4 hx_inverseProjectionMatrix;\n//uniform vec2 hx_rcpRenderTargetResolution;\n//#else\nvarying vec2 uv;\nvarying vec3 viewDir;\n//#endif\n\nuniform HX_PointLight hx_pointLight;\n\nuniform sampler2D hx_gbufferAlbedo;\nuniform sampler2D hx_gbufferNormalDepth;\nuniform sampler2D hx_gbufferSpecular;\n\nuniform float hx_cameraNearPlaneDistance;\nuniform float hx_cameraFrustumRange;\n\n\nvoid main()\n{\n//    #ifdef HX_SPHERE_MESH\n//    vec2 uv = gl_FragCoord.xy * hx_rcpRenderTargetResolution;\n//    vec3 viewDir = hx_getLinearDepthViewVector(uv * 2.0 - 1.0, hx_inverseProjectionMatrix);\n//    #endif\n\n    HX_GBufferData data = hx_parseGBuffer(hx_gbufferAlbedo, hx_gbufferNormalDepth, hx_gbufferSpecular, uv);\n\n    float absViewZ = hx_cameraNearPlaneDistance + data.linearDepth * hx_cameraFrustumRange;\n\n\n	vec3 viewPosition = viewDir * absViewZ;\n    vec3 viewVector = normalize(viewPosition);\n    vec3 diffuse, specular;\n\n    hx_calculateLight(hx_pointLight, data.geometry, viewVector, viewPosition, data.normalSpecularReflectance, diffuse, specular);\n\n    gl_FragColor.xyz = diffuse * data.geometry.color.xyz + specular;\n    gl_FragColor.w = 1.0;\n\n    #ifdef HX_GAMMA_CORRECT_LIGHTS\n        gl_FragColor = hx_linearToGamma(gl_FragColor);\n    #endif\n}';

ShaderLibrary._files['deferred_point_light_vertex.glsl'] = 'attribute vec4 hx_position;\n\n\n#ifdef HX_SPHERE_MESH\nuniform HX_PointLight hx_pointLight;\nuniform mat4 hx_projectionMatrix;\n\n#else\n\nattribute vec2 hx_texCoord;\n#endif\n\nvarying vec2 uv;\nvarying vec3 viewDir;\n\nuniform mat4 hx_inverseProjectionMatrix;\n\nvoid main()\n{\n#ifdef HX_SPHERE_MESH\n    vec4 viewPos = vec4(hx_position.xyz * hx_pointLight.radius + hx_pointLight.position, 1.0);\n\n    gl_Position = hx_projectionMatrix * viewPos;\n//    gl_Position /= gl_Position.w;\n    uv = gl_Position.xy / gl_Position.w * .5 + .5;\n    viewDir = hx_getLinearDepthViewVector(gl_Position.xy / gl_Position.w, hx_inverseProjectionMatrix);\n#else\n    uv = hx_texCoord;\n    gl_Position = hx_position;\n    viewDir = hx_getLinearDepthViewVector(hx_position.xy, hx_inverseProjectionMatrix);\n#endif\n}';

ShaderLibrary._files['deferred_probe_fragment.glsl'] = 'varying vec2 uv;\nvarying vec3 viewDir;\n\nuniform sampler2D hx_gbufferAlbedo;\nuniform sampler2D hx_gbufferNormalDepth;\nuniform sampler2D hx_gbufferSpecular;\nuniform sampler2D hx_ssao;\nuniform samplerCube hx_diffuseProbeMap;\nuniform samplerCube hx_specularProbeMap;\n\nuniform float hx_cameraNearPlaneDistance;\nuniform float hx_cameraFrustumRange;\nuniform float hx_specularProbeNumMips;\nuniform mat4 hx_cameraWorldMatrix;\n\n\nvoid main()\n{\n// TODO: move this to snippets_deferred file, along with the hx_decodeGBufferSpecular method\n    HX_GBufferData data = hx_parseGBuffer(hx_gbufferAlbedo, hx_gbufferNormalDepth, hx_gbufferSpecular, uv);\n\n    vec3 worldNormal = mat3(hx_cameraWorldMatrix) * data.geometry.normal;\n\n    vec3 viewVector = normalize(viewDir);\n    vec3 reflectedViewDir = reflect(viewVector, data.geometry.normal);\n    vec3 fresnel = hx_fresnelProbe(data.normalSpecularReflectance, reflectedViewDir, data.geometry.normal, data.geometry.roughness);\n    reflectedViewDir = mat3(hx_cameraWorldMatrix) * reflectedViewDir;\n\n    vec3 diffuse = vec3(0.0);\n    vec3 specular = vec3(0.0);\n#ifdef HX_DIFFUSE_PROBE\n    diffuse = hx_calculateDiffuseProbeLight(hx_diffuseProbeMap, worldNormal);\n#endif\n#ifdef HX_SPECULAR_PROBE\n    specular = hx_calculateSpecularProbeLight(hx_specularProbeMap, hx_specularProbeNumMips, reflectedViewDir, fresnel, data.geometry.roughness);\n#endif\n\n    float ssao = texture2D(hx_ssao, uv).x;\n    gl_FragColor.xyz = (diffuse * data.geometry.color.xyz + specular) * ssao;\n    gl_FragColor.w = 1.0;\n\n    #ifdef HX_GAMMA_CORRECT_LIGHTS\n        gl_FragColor = hx_linearToGamma(gl_FragColor);\n    #endif\n}';

ShaderLibrary._files['deferred_probe_vertex.glsl'] = 'attribute vec4 hx_position;\nattribute vec2 hx_texCoord;\n\nvarying vec2 uv;\nvarying vec3 viewDir;\n\nuniform mat4 hx_inverseProjectionMatrix;\n\nvoid main()\n{\n    uv = hx_texCoord;\n    viewDir = hx_getLinearDepthViewVector(hx_position.xy, hx_inverseProjectionMatrix);\n    gl_Position = hx_position;\n}';

ShaderLibrary._files['lighting_blinn_phong.glsl'] = 'float hx_probeGeometricShadowing(vec3 normal, vec3 reflection, float roughness, float metallicness)\n{\n    // schlick-smith\n    /*float k = 2.0 / sqrt(3.1415 * (roughness * roughness + 2.0));\n    float nDotV = max(dot(normal, reflection), 0.0);\n    float denom = nDotV * (1.0 - k) + k;\n    return nDotV * nDotV / (denom * denom);   // since l == v*/\n    float att = 1.0 - roughness;\n    return mix(att * att, 1.0, metallicness);\n}\n\n// schlick-beckman\nfloat hx_lightVisibility(vec3 normal, vec3 viewDir, float roughness, float nDotL)\n{\n	float nDotV = max(-dot(normal, viewDir), 0.0);\n	float r = roughness * roughness * 0.797896;\n	float g1 = nDotV * (1.0 - r) + r;\n	float g2 = nDotL * (1.0 - r) + r;\n    return .25 / (g1 * g2);\n}\n\nfloat hx_blinnPhongDistribution(float roughness, vec3 normal, vec3 halfVector)\n{\n	float roughnessSqr = clamp(roughness * roughness, 0.0001, .9999);\n//	roughnessSqr *= roughnessSqr;\n	float halfDotNormal = max(-dot(halfVector, normal), 0.0);\n	return pow(halfDotNormal, 2.0/roughnessSqr - 2.0) / roughnessSqr;\n}\n\nvoid hx_brdf(in HX_GeometryData geometry, in vec3 lightDir, in vec3 viewDir, in vec3 viewPos, in vec3 lightColor, vec3 normalSpecularReflectance, out vec3 diffuseColor, out vec3 specularColor)\n{\n	float nDotL = max(-dot(lightDir, geometry.normal), 0.0);\n	vec3 irradiance = nDotL * lightColor;	// in fact irradiance / PI\n\n	vec3 halfVector = normalize(lightDir + viewDir);\n\n	float distribution = hx_blinnPhongDistribution(geometry.roughness, geometry.normal, halfVector);\n\n	float halfDotLight = max(dot(halfVector, lightDir), 0.0);\n	float cosAngle = 1.0 - halfDotLight;\n	// to the 5th power\n	float power = cosAngle*cosAngle;\n	power *= power;\n	power *= cosAngle;\n	vec3 fresnel = normalSpecularReflectance + (1.0 - normalSpecularReflectance)*power;\n\n// / PI factor is encoded in light colour\n	diffuseColor = irradiance;\n	specularColor = irradiance * fresnel * distribution;\n\n//#ifdef HX_VISIBILITY\n//    specularColor *= hx_lightVisibility(normal, lightDir, geometry.roughness, nDotL);\n//#endif\n}';

ShaderLibrary._files['lighting_ggx.glsl'] = '// schlick-beckman\nfloat hx_lightVisibility(vec3 normal, vec3 viewDir, float roughness, float nDotL)\n{\n	float nDotV = max(-dot(normal, viewDir), 0.0);\n	float r = roughness * roughness * 0.797896;\n	float g1 = nDotV * (1.0 - r) + r;\n	float g2 = nDotL * (1.0 - r) + r;\n    return .25 / (g1 * g2);\n}\n\nfloat hx_ggxDistribution(float roughness, vec3 normal, vec3 halfVector)\n{\n    float roughSqr = roughness*roughness;\n    float halfDotNormal = max(-dot(halfVector, normal), 0.0);\n    float denom = (halfDotNormal * halfDotNormal) * (roughSqr - 1.0) + 1.0;\n    return roughSqr / (denom * denom);\n}\n\n// light dir is to the lit surface\n// view dir is to the lit surface\nvoid hx_brdf(in HX_GeometryData geometry, in vec3 lightDir, in vec3 viewDir, in vec3 viewPos, in vec3 lightColor, vec3 normalSpecularReflectance, out vec3 diffuseColor, out vec3 specularColor)\n{\n	float nDotL = max(-dot(lightDir, geometry.normal), 0.0);\n	vec3 irradiance = nDotL * lightColor;	// in fact irradiance / PI\n\n	vec3 halfVector = normalize(lightDir + viewDir);\n\n	float distribution = hx_ggxDistribution(geometry.roughness, geometry.normal, halfVector);\n\n	float halfDotLight = max(dot(halfVector, lightDir), 0.0);\n	float cosAngle = 1.0 - halfDotLight;\n	// to the 5th power\n	float power = cosAngle*cosAngle;\n	power *= power;\n	power *= cosAngle;\n	vec3 fresnel = normalSpecularReflectance + (1.0 - normalSpecularReflectance)*power;\n\n	diffuseColor = irradiance;\n\n	specularColor = irradiance * fresnel * distribution;\n\n#ifdef VISIBILITY\n    specularColor *= hx_lightVisibility(normal, lightDir, geometry.roughness, nDotL);\n#endif\n}';

ShaderLibrary._files['directional_light.glsl'] = 'struct HX_DirectionalLight\n{\n    vec3 color;\n    vec3 direction; // in view space?\n\n    mat4 shadowMapMatrices[4];\n    vec4 splitDistances;\n    float depthBias;\n    float maxShadowDistance;    // = light.splitDistances[light.numCascades - 1]\n};\n\nvoid hx_calculateLight(HX_DirectionalLight light, HX_GeometryData geometry, vec3 viewVector, vec3 viewPosition, vec3 normalSpecularReflectance, out vec3 diffuse, out vec3 specular)\n{\n	hx_brdf(geometry, light.direction, viewVector, viewPosition, light.color, normalSpecularReflectance, diffuse, specular);\n}\n\nmat4 hx_getShadowMatrix(HX_DirectionalLight light, vec3 viewPos)\n{\n    #if HX_NUM_SHADOW_CASCADES > 1\n        // not very efficient :(\n        for (int i = 0; i < HX_NUM_SHADOW_CASCADES - 1; ++i) {\n            // remember, negative Z!\n            if (viewPos.z > light.splitDistances[i])\n                return light.shadowMapMatrices[i];\n        }\n        return light.shadowMapMatrices[HX_NUM_SHADOW_CASCADES - 1];\n    #else\n        return light.shadowMapMatrices[0];\n    #endif\n}\n\nfloat hx_calculateShadows(HX_DirectionalLight light, sampler2D shadowMap, vec3 viewPos)\n{\n    mat4 shadowMatrix = hx_getShadowMatrix(light, viewPos);\n    float shadow = hx_readShadow(shadowMap, viewPos, shadowMatrix, light.depthBias);\n    // this makes sure that anything beyond the last cascade is unshadowed\n    return max(shadow, float(viewPos.z < light.maxShadowDistance));\n}';

ShaderLibrary._files['light_probe.glsl'] = '#define HX_PROBE_K0 .00098\n#define HX_PROBE_K1 .9921\n\n/*\nvar minRoughness = 0.0014;\nvar maxPower = 2.0 / (minRoughness * minRoughness) - 2.0;\nvar maxMipFactor = (exp2(-10.0/Math.sqrt(maxPower)) - HX_PROBE_K0)/HX_PROBE_K1;\nvar HX_PROBE_SCALE = 1.0 / maxMipFactor\n*/\n\n#define HX_PROBE_SCALE\n\nvec3 hx_calculateDiffuseProbeLight(samplerCube texture, vec3 normal)\n{\n	return hx_gammaToLinear(textureCube(texture, normal).xyz);\n}\n\nvec3 hx_calculateSpecularProbeLight(samplerCube texture, float numMips, vec3 reflectedViewDir, vec3 fresnelColor, float roughness)\n{\n    #ifdef HX_TEXTURE_LOD\n    // knald method:\n        float power = 2.0/(roughness * roughness) - 2.0;\n        float factor = (exp2(-10.0/sqrt(power)) - HX_PROBE_K0)/HX_PROBE_K1;\n//        float mipLevel = numMips * (1.0 - clamp(factor * HX_PROBE_SCALE, 0.0, 1.0));\n        float mipLevel = numMips * (1.0 - clamp(factor, 0.0, 1.0));\n        vec4 specProbeSample = textureCubeLodEXT(texture, reflectedViewDir, mipLevel);\n    #else\n        vec4 specProbeSample = textureCube(texture, reflectedViewDir);\n    #endif\n	return hx_gammaToLinear(specProbeSample.xyz) * fresnelColor;\n}';

ShaderLibrary._files['point_light.glsl'] = 'struct HX_PointLight\n{\n    vec3 color;\n    vec3 position;\n    float radius;\n};\n\nvoid hx_calculateLight(HX_PointLight light, HX_GeometryData geometry, vec3 viewVector, vec3 viewPosition, vec3 normalSpecularReflectance, out vec3 diffuse, out vec3 specular)\n{\n    vec3 direction = viewPosition - light.position;\n    float attenuation = dot(direction, direction);  // distance squared\n    float distance = sqrt(attenuation);\n    direction /= distance;\n    attenuation = max((1.0 - distance / light.radius) / attenuation, 0.0);\n	hx_brdf(geometry, direction, viewVector, viewPosition, light.color * attenuation, normalSpecularReflectance, diffuse, specular);\n}';

ShaderLibrary._files['default_geometry_fragment.glsl'] = 'varying vec3 normal;\n\nuniform vec3 color;\nuniform float alpha;\n\n#if defined(COLOR_MAP) || defined(NORMAL_MAP)|| defined(SPECULAR_MAP)|| defined(ROUGHNESS_MAP) || defined(MASK_MAP)\nvarying vec2 texCoords;\n#endif\n\n#ifdef COLOR_MAP\nuniform sampler2D colorMap;\n#endif\n\n#ifdef MASK_MAP\nuniform sampler2D maskMap;\n#endif\n\n#ifdef NORMAL_MAP\nvarying vec3 tangent;\nvarying vec3 bitangent;\n\nuniform sampler2D normalMap;\n#endif\n\nuniform float roughness;\nuniform float roughnessRange;\nuniform float normalSpecularReflectance;\nuniform float metallicness;\n\n#if defined(ALPHA_THRESHOLD)\nuniform float alphaThreshold;\n#endif\n\n#if defined(SPECULAR_MAP) || defined(ROUGHNESS_MAP)\nuniform sampler2D specularMap;\n#endif\n\n#ifdef VERTEX_COLORS\nvarying vec3 vertexColor;\n#endif\n\nHX_GeometryData hx_geometry()\n{\n    vec4 outputColor = vec4(color, alpha);\n\n    #ifdef VERTEX_COLORS\n        outputColor.xyz *= vertexColor;\n    #endif\n\n    #ifdef COLOR_MAP\n        outputColor *= texture2D(colorMap, texCoords);\n    #endif\n\n    #ifdef MASK_MAP\n        outputColor.w *= texture2D(maskMap, texCoords).x;\n    #endif\n\n    #ifdef ALPHA_THRESHOLD\n        if (outputColor.w < alphaThreshold) discard;\n    #endif\n\n    float metallicnessOut = metallicness;\n    float specNormalReflOut = normalSpecularReflectance;\n    float roughnessOut = roughness;\n\n    vec3 fragNormal = normal;\n    #ifdef NORMAL_MAP\n        vec4 normalSample = texture2D(normalMap, texCoords);\n        mat3 TBN;\n        TBN[2] = normalize(normal);\n        TBN[0] = normalize(tangent);\n        TBN[1] = normalize(bitangent);\n\n        fragNormal = TBN * (normalSample.xyz - .5);\n\n        #ifdef NORMAL_ROUGHNESS_MAP\n            roughnessOut -= roughnessRange * (normalSample.w - .5);\n        #endif\n    #endif\n\n    #if defined(SPECULAR_MAP) || defined(ROUGHNESS_MAP)\n          vec4 specSample = texture2D(specularMap, texCoords);\n          roughnessOut -= roughnessRange * (specSample.x - .5);\n\n          #ifdef SPECULAR_MAP\n              specNormalReflOut *= specSample.y;\n              metallicnessOut *= specSample.z;\n          #endif\n    #endif\n\n    HX_GeometryData data;\n    data.color = hx_gammaToLinear(outputColor);\n    data.normal = normalize(fragNormal);\n    data.metallicness = metallicnessOut;\n    data.normalSpecularReflectance = specNormalReflOut;\n    data.roughness = roughnessOut;\n    data.emission = vec3(0.0);\n    return data;\n}';

ShaderLibrary._files['default_geometry_vertex.glsl'] = 'attribute vec4 hx_position;\nattribute vec3 hx_normal;\n\n// morph positions are offsets re the base position!\n#ifdef HX_USE_MORPHING\nattribute vec3 hx_morphPosition0;\nattribute vec3 hx_morphPosition1;\nattribute vec3 hx_morphPosition2;\nattribute vec3 hx_morphPosition3;\n#if HX_NUM_MORPH_TARGETS > 4\nattribute vec3 hx_morphPosition4;\nattribute vec3 hx_morphPosition5;\nattribute vec3 hx_morphPosition6;\nattribute vec3 hx_morphPosition7;\n#endif\n\nuniform float hx_morphWeights[HX_NUM_MORPH_TARGETS];\n#endif\n\n#ifdef HX_USE_SKINNING\nattribute vec4 hx_boneIndices;\nattribute vec4 hx_boneWeights;\n\n// WebGL doesn\'t support mat4x3 and I don\'t want to split the uniform either\n#ifdef HX_USE_SKINNING_TEXTURE\nuniform sampler2D hx_skinningTexture;\n#else\nuniform vec4 hx_skinningMatrices[HX_MAX_BONES * 3];\n#endif\n#endif\n\nuniform mat4 hx_wvpMatrix;\nuniform mat3 hx_normalWorldViewMatrix;\nuniform mat4 hx_worldViewMatrix;\n\nvarying vec3 normal;\n\n#if defined(COLOR_MAP) || defined(NORMAL_MAP)|| defined(SPECULAR_MAP)|| defined(ROUGHNESS_MAP) || defined(MASK_MAP)\nattribute vec2 hx_texCoord;\nvarying vec2 texCoords;\n#endif\n\n#ifdef VERTEX_COLORS\nattribute vec3 hx_vertexColor;\nvarying vec3 vertexColor;\n#endif\n\n#ifdef NORMAL_MAP\nattribute vec4 hx_tangent;\n\nvarying vec3 tangent;\nvarying vec3 bitangent;\n#endif\n\nvoid hx_geometry()\n{\n    vec4 morphedPosition = hx_position;\n    vec3 morphedNormal = hx_normal;\n\n// TODO: Abstract this in functions for easier reuse in other materials\n#ifdef HX_USE_MORPHING\n    morphedPosition.xyz += hx_morphPosition0 * hx_morphWeights[0];\n    morphedPosition.xyz += hx_morphPosition1 * hx_morphWeights[1];\n    morphedPosition.xyz += hx_morphPosition2 * hx_morphWeights[2];\n    morphedPosition.xyz += hx_morphPosition3 * hx_morphWeights[3];\n    #if HX_NUM_MORPH_TARGETS > 4\n        morphedPosition.xyz += hx_morphPosition4 * hx_morphWeights[4];\n        morphedPosition.xyz += hx_morphPosition5 * hx_morphWeights[5];\n        morphedPosition.xyz += hx_morphPosition6 * hx_morphWeights[6];\n        morphedPosition.xyz += hx_morphPosition7 * hx_morphWeights[7];\n    #endif\n#endif\n\n#ifdef HX_USE_SKINNING\n    mat4 skinningMatrix = hx_getSkinningMatrix(0);\n\n    vec4 animPosition = morphedPosition * skinningMatrix;\n    vec3 animNormal = morphedNormal * mat3(skinningMatrix);\n\n    #ifdef NORMAL_MAP\n    vec3 animTangent = hx_tangent.xyz * mat3(skinningMatrix);\n    #endif\n#else\n    vec4 animPosition = morphedPosition;\n    vec3 animNormal = morphedNormal;\n\n    #ifdef NORMAL_MAP\n    vec3 animTangent = hx_tangent.xyz;\n    #endif\n#endif\n\n    gl_Position = hx_wvpMatrix * animPosition;\n    normal = normalize(hx_normalWorldViewMatrix * animNormal);\n\n#ifdef NORMAL_MAP\n    tangent = mat3(hx_worldViewMatrix) * animTangent;\n    bitangent = cross(tangent, normal) * hx_tangent.w;\n#endif\n\n#if defined(COLOR_MAP) || defined(NORMAL_MAP)|| defined(SPECULAR_MAP)|| defined(ROUGHNESS_MAP) || defined(MASK_MAP)\n    texCoords = hx_texCoord;\n#endif\n\n#ifdef VERTEX_COLORS\n    vertexColor = hx_vertexColor;\n#endif\n}';

ShaderLibrary._files['default_skybox_fragment.glsl'] = 'varying vec3 viewWorldDir;\n\nuniform samplerCube hx_skybox;\n\nHX_GeometryData hx_geometry()\n{\n    HX_GeometryData data;\n    data.color = textureCube(hx_skybox, viewWorldDir);\n    data.emission = vec3(0.0);\n    data.color = hx_gammaToLinear(data.color);\n    return data;\n}';

ShaderLibrary._files['default_skybox_vertex.glsl'] = 'attribute vec4 hx_position;\n\nuniform vec3 hx_cameraWorldPosition;\nuniform float hx_cameraFarPlaneDistance;\nuniform mat4 hx_viewProjectionMatrix;\n\nvarying vec3 viewWorldDir;\n\n// using 2D quad for rendering skyboxes rather than 3D cube causes jittering of the skybox\nvoid hx_geometry()\n{\n    viewWorldDir = hx_position.xyz;\n    vec4 pos = hx_position;\n    // use a decent portion of the frustum to prevent FP issues\n    pos.xyz = pos.xyz * hx_cameraFarPlaneDistance + hx_cameraWorldPosition;\n    pos = hx_viewProjectionMatrix * pos;\n    // make sure it\'s drawn behind everything else, so z = 1.0\n    pos.z = pos.w;\n    gl_Position = pos;\n}\n\n';

ShaderLibrary._files['material_apply_gbuffer_fragment.glsl'] = 'uniform vec2 hx_rcpRenderTargetResolution;\n\nuniform sampler2D hx_lightAccumulation;\n\nvoid main()\n{\n    HX_GeometryData data = hx_geometry();\n    vec2 screenUV = gl_FragCoord.xy * hx_rcpRenderTargetResolution;\n    gl_FragColor = texture2D(hx_lightAccumulation, screenUV);\n    gl_FragColor.xyz += data.emission;\n}';

ShaderLibrary._files['material_apply_gbuffer_vertex.glsl'] = 'void main()\n{\n    hx_geometry();\n}';

ShaderLibrary._files['material_dir_shadow_fragment.glsl'] = 'void main()\n{\n    // geometry is really only used for kil instructions if necessary\n    // hopefully the compiler optimizes the rest out for us\n    HX_GeometryData data = hx_geometry();\n    gl_FragColor = hx_getShadowMapValue(gl_FragCoord.z);\n}';

ShaderLibrary._files['material_fwd_base_fragment.glsl'] = 'uniform vec3 hx_ambientColor;\n\nuniform sampler2D hx_ssao;\nuniform vec2 hx_rcpRenderTargetResolution;\n\nvoid main()\n{\n    vec2 screenUV = gl_FragCoord.xy * hx_rcpRenderTargetResolution;\n\n    HX_GeometryData data = hx_geometry();\n    // simply override with emission\n    gl_FragColor = data.color;\n    float ssao = texture2D(hx_ssao, screenUV).x;\n    gl_FragColor.xyz = gl_FragColor.xyz * hx_ambientColor * ssao + data.emission;\n\n    #ifdef HX_GAMMA_CORRECT_LIGHTS\n        gl_FragColor = hx_linearToGamma(gl_FragColor);\n    #endif\n}';

ShaderLibrary._files['material_fwd_base_vertex.glsl'] = 'void main()\n{\n    hx_geometry();\n}';

ShaderLibrary._files['material_fwd_dir_fragment.glsl'] = 'varying vec3 hx_viewPosition;\n\nuniform HX_DirectionalLight hx_directionalLight;\n\n#ifdef HX_SHADOW_MAP\nuniform sampler2D hx_shadowMap;\n#endif\n\nvoid main()\n{\n    HX_GeometryData data = hx_geometry();\n\n    vec3 viewVector = normalize(hx_viewPosition);\n    vec3 diffuse, specular;\n\n    vec3 specularColor = mix(vec3(data.normalSpecularReflectance), data.color.xyz, data.metallicness);\n    data.color.xyz *= 1.0 - data.metallicness;\n\n    hx_calculateLight(hx_directionalLight, data, viewVector, hx_viewPosition, specularColor, diffuse, specular);\n\n    gl_FragColor = vec4(diffuse * data.color.xyz + specular, data.color.w);\n\n    #ifdef HX_SHADOW_MAP\n        gl_FragColor.xyz *= hx_calculateShadows(hx_directionalLight, hx_shadowMap, hx_viewPosition);\n    #endif\n\n    #ifdef HX_GAMMA_CORRECT_LIGHTS\n        gl_FragColor = hx_linearToGamma(gl_FragColor);\n    #endif\n}';

ShaderLibrary._files['material_fwd_dir_vertex.glsl'] = 'varying vec3 hx_viewPosition;\nuniform mat4 hx_inverseProjectionMatrix;\n\nvoid main()\n{\n    hx_geometry();\n    hx_viewPosition = (hx_inverseProjectionMatrix * gl_Position).xyz;\n}';

ShaderLibrary._files['material_fwd_point_fragment.glsl'] = 'varying vec3 hx_viewPosition;\n\nuniform HX_PointLight hx_pointLight;\n\nvoid main()\n{\n    HX_GeometryData data = hx_geometry();\n\n    vec3 viewVector = normalize(hx_viewPosition);\n    vec3 diffuse, specular;\n\n    vec3 specularColor = mix(vec3(data.normalSpecularReflectance), data.color.xyz, data.metallicness);\n    data.color.xyz *= 1.0 - data.metallicness;\n\n    hx_calculateLight(hx_pointLight, data, viewVector, hx_viewPosition, specularColor, diffuse, specular);\n\n    gl_FragColor = vec4(diffuse * data.color.xyz + specular, data.color.w);\n\n    #ifdef HX_GAMMA_CORRECT_LIGHTS\n        gl_FragColor = hx_linearToGamma(gl_FragColor);\n    #endif\n}';

ShaderLibrary._files['material_fwd_point_vertex.glsl'] = 'varying vec3 hx_viewPosition;\nuniform mat4 hx_inverseProjectionMatrix;\n\nvoid main()\n{\n    hx_geometry();\n    hx_viewPosition = (hx_inverseProjectionMatrix * gl_Position).xyz;\n}';

ShaderLibrary._files['material_fwd_probe_fragment.glsl'] = 'varying vec3 hx_viewPosition;\n\nuniform samplerCube hx_diffuseProbeMap;\nuniform samplerCube hx_specularProbeMap;\nuniform float hx_specularProbeNumMips;\n\nuniform mat4 hx_cameraWorldMatrix;\n\n#if HX_APPLY_SSAO\nuniform vec2 hx_rcpRenderTargetResolution;\nuniform sampler2D hx_ssao;\n#endif\n\nvoid main()\n{\n    HX_GeometryData data = hx_geometry();\n\n    vec3 viewVector = normalize(hx_viewPosition);\n\n    vec3 specularColor = mix(vec3(data.normalSpecularReflectance), data.color.xyz, data.metallicness);\n    data.color.xyz *= 1.0 - data.metallicness;\n\n    // TODO: We should be able to change the base of TBN in vertex shader\n    vec3 worldNormal = mat3(hx_cameraWorldMatrix) * data.normal;\n    vec3 reflectedViewDir = reflect(viewVector, data.normal);\n    vec3 fresnel = hx_fresnelProbe(specularColor, reflectedViewDir, data.normal, data.roughness);\n    reflectedViewDir = mat3(hx_cameraWorldMatrix) * reflectedViewDir;\n    vec3 diffuse = hx_calculateDiffuseProbeLight(hx_diffuseProbeMap, worldNormal);\n    vec3 specular = hx_calculateSpecularProbeLight(hx_specularProbeMap, hx_specularProbeNumMips, reflectedViewDir, fresnel, data.roughness);\n\n    gl_FragColor = vec4(diffuse * data.color.xyz + specular, data.color.w);\n\n    #if HX_APPLY_SSAO\n    vec2 screenUV = gl_FragCoord.xy * hx_rcpRenderTargetResolution;\n    gl_FragColor.xyz *= texture2D(hx_ssao, screenUV).x;\n    #endif\n\n    #ifdef HX_GAMMA_CORRECT_LIGHTS\n        gl_FragColor = hx_linearToGamma(gl_FragColor);\n    #endif\n}';

ShaderLibrary._files['material_fwd_probe_vertex.glsl'] = 'varying vec3 hx_viewPosition;\nuniform mat4 hx_inverseProjectionMatrix;\n\nvoid main()\n{\n    hx_geometry();\n    hx_viewPosition = (hx_inverseProjectionMatrix * gl_Position).xyz;\n}';

ShaderLibrary._files['material_gbuffer_albedo_fragment.glsl'] = 'void main()\n{\n    HX_GeometryData data = hx_geometry();\n    gl_FragColor.xyz = data.color.xyz;\n    gl_FragColor.w = 1.0;    // only opaques are rendered; could use this as a sort of post-process mark (fe: apply SSS)\n}';

ShaderLibrary._files['material_gbuffer_albedo_vertex.glsl'] = 'void main()\n{\n    hx_geometry();\n}';

ShaderLibrary._files['material_gbuffer_full_fragment.glsl'] = '#drawbuffers\n\nvarying float hx_linearDepth;\n\nvoid main()\n{\n    HX_GeometryData data = hx_geometry();\n    gl_FragData[0] = vec4(data.color.xyz, 1.0);\n    gl_FragData[1].xy = hx_encodeNormal(data.normal);\n    gl_FragData[1].zw = hx_floatToRG8(hx_linearDepth);\n    gl_FragData[2].x = data.metallicness;\n    gl_FragData[2].y = data.normalSpecularReflectance * 5.0;  // better use of available range\n    gl_FragData[2].z = data.roughness;\n    gl_FragData[2].w = 1.0;\n}';

ShaderLibrary._files['material_gbuffer_full_vertex.glsl'] = 'varying float hx_linearDepth;\n\nuniform float hx_rcpCameraFrustumRange;\nuniform float hx_cameraNearPlaneDistance;\n\nvoid main()\n{\n    hx_geometry();\n\n    hx_linearDepth = (gl_Position.w - hx_cameraNearPlaneDistance) * hx_rcpCameraFrustumRange;\n}';

ShaderLibrary._files['material_gbuffer_normal_depth_fragment.glsl'] = 'varying float hx_linearDepth;\n\nvoid main()\n{\n    HX_GeometryData data = hx_geometry();\n    gl_FragColor.xy = hx_encodeNormal(data.normal);\n    gl_FragColor.zw = hx_floatToRG8(hx_linearDepth);\n}';

ShaderLibrary._files['material_gbuffer_normal_depth_vertex.glsl'] = 'varying float hx_linearDepth;\n\nuniform float hx_rcpCameraFrustumRange;\nuniform float hx_cameraNearPlaneDistance;\n\nvoid main()\n{\n    hx_geometry();\n\n    hx_linearDepth = (gl_Position.w - hx_cameraNearPlaneDistance) * hx_rcpCameraFrustumRange;\n}';

ShaderLibrary._files['material_gbuffer_specular_fragment.glsl'] = 'void main()\n{\n    HX_GeometryData data = hx_geometry();\n    gl_FragColor.x = data.metallicness;\n    gl_FragColor.y = data.normalSpecularReflectance * 5.0;  // better use of available range\n    gl_FragColor.z = data.roughness;\n    gl_FragColor.w = 1.0;\n}';

ShaderLibrary._files['material_gbuffer_specular_vertex.glsl'] = 'void main()\n{\n    hx_geometry();\n}';

ShaderLibrary._files['material_unlit_fragment.glsl'] = 'void main()\n{\n    HX_GeometryData data = hx_geometry();\n    gl_FragColor = data.color;\n    gl_FragColor.xyz += data.emission;\n\n\n    #ifdef HX_GAMMA_CORRECT_LIGHTS\n        gl_FragColor = hx_linearToGamma(gl_FragColor);\n    #endif\n}';

ShaderLibrary._files['material_unlit_vertex.glsl'] = 'void main()\n{\n    hx_geometry();\n}';

ShaderLibrary._files['bloom_composite_fragment.glsl'] = 'varying vec2 uv;\n\nuniform sampler2D bloomTexture;\nuniform sampler2D hx_backbuffer;\nuniform float strength;\n\nvoid main()\n{\n	gl_FragColor = texture2D(hx_backbuffer, uv) + texture2D(bloomTexture, uv) * strength;\n}';

ShaderLibrary._files['bloom_composite_vertex.glsl'] = 'attribute vec4 hx_position;\nattribute vec2 hx_texCoord;\n\nvarying vec2 uv;\n\nvoid main()\n{\n	   uv = hx_texCoord;\n	   gl_Position = hx_position;\n}';

ShaderLibrary._files['bloom_threshold_fragment.glsl'] = 'varying vec2 uv;\n\nuniform sampler2D hx_backbuffer;\n\nuniform float threshold;\n\nvoid main()\n{\n        vec4 color = texture2D(hx_backbuffer, uv);\n        float originalLuminance = .05 + hx_luminance(color);\n        float targetLuminance = max(originalLuminance - threshold, 0.0);\n        gl_FragColor = color * targetLuminance / originalLuminance;\n}\n';

ShaderLibrary._files['default_post_vertex.glsl'] = 'attribute vec4 hx_position;\nattribute vec2 hx_texCoord;\n\nvarying vec2 uv;\n\nvoid main()\n{\n	uv = hx_texCoord;\n	gl_Position = hx_position;\n}';

ShaderLibrary._files['fog_fragment.glsl'] = 'varying vec2 uv;\nvarying vec3 viewDir;\n\nuniform vec3 tint;\nuniform float density;\nuniform float startDistance;\nuniform float heightFallOff;\n\nuniform float hx_cameraFrustumRange;\nuniform float hx_cameraNearPlaneDistance;\nuniform vec3 hx_cameraWorldPosition;\n\nuniform sampler2D hx_gbufferNormalDepth;\nuniform sampler2D hx_backbuffer;\n\nvoid main()\n{\n    vec4 normalDepth = texture2D(hx_gbufferNormalDepth, uv);\n	vec4 color = texture2D(hx_backbuffer, uv);\n	float depth = hx_decodeLinearDepth(normalDepth);\n	// do not fog up skybox\n	if (normalDepth.z == 1.0 && normalDepth.w == 1.0) depth = 0.0;\n	float absViewZ = hx_cameraNearPlaneDistance + depth * hx_cameraFrustumRange;\n	vec3 viewVec = viewDir * absViewZ;\n	float fogFactor = max(length(viewVec) - startDistance, 0.0);// * exp(-heightFallOff * hx_cameraWorldPosition.y);\n//    if( abs( viewVec.y ) > 0.1 )\n//	{\n		float t = heightFallOff * (viewVec.y + hx_cameraWorldPosition.y);\n		fogFactor *= saturate(( 1.0 - exp( -t ) ) / t);\n//	}\n\n	float fog = clamp(exp(-fogFactor * density), 0.0, 1.0);\n	color.xyz = mix(tint, color.xyz, fog);\n	gl_FragColor = color;\n}';

ShaderLibrary._files['fog_vertex.glsl'] = 'attribute vec4 hx_position;\nattribute vec2 hx_texCoord;\n\nvarying vec2 uv;\nvarying vec3 viewDir;\n\nuniform mat4 hx_inverseProjectionMatrix;\nuniform mat4 hx_cameraWorldMatrix;\n\nvoid main()\n{\n    uv = hx_texCoord;\n    viewDir = mat3(hx_cameraWorldMatrix) * hx_getLinearDepthViewVector(hx_position.xy, hx_inverseProjectionMatrix);\n    gl_Position = hx_position;\n}';

ShaderLibrary._files['fxaa_fragment.glsl'] = 'varying vec2 uv;\n\nuniform sampler2D hx_backbuffer;\nuniform vec2 hx_rcpRenderTargetResolution;\nuniform float edgeThreshold;\nuniform float edgeThresholdMin;\nuniform float edgeSharpness;\n\nfloat luminanceHint(vec4 color)\n{\n	return .30/.59 * color.r + color.g;\n}\n\nvoid main()\n{\n	vec4 center = texture2D(hx_backbuffer, uv);\n	vec2 halfRes = vec2(hx_rcpRenderTargetResolution.x, hx_rcpRenderTargetResolution.y) * .5;\n	float topLeftLum = luminanceHint(texture2D(hx_backbuffer, uv + vec2(-halfRes.x, halfRes.y)));\n	float bottomLeftLum = luminanceHint(texture2D(hx_backbuffer, uv + vec2(-halfRes.x, -halfRes.y)));\n	float topRightLum = luminanceHint(texture2D(hx_backbuffer, uv + vec2(halfRes.x, halfRes.y)));\n	float bottomRightLum = luminanceHint(texture2D(hx_backbuffer, uv + vec2(halfRes.x, -halfRes.y)));\n\n	float centerLum = luminanceHint(center);\n	float minLum = min(min(topLeftLum, bottomLeftLum), min(topRightLum, bottomRightLum));\n	float maxLum = max(max(topLeftLum, bottomLeftLum), max(topRightLum, bottomRightLum));\n	float range = max(centerLum, maxLum) - min(centerLum, minLum);\n	float threshold = max(edgeThresholdMin, maxLum * edgeThreshold);\n	float applyFXAA = range < threshold? 0.0 : 1.0;\n\n	float diagDiff1 = bottomLeftLum - topRightLum;\n	float diagDiff2 = bottomRightLum - topLeftLum;\n	vec2 dir1 = normalize(vec2(diagDiff1 + diagDiff2, diagDiff1 - diagDiff2));\n	vec4 sampleNeg1 = texture2D(hx_backbuffer, uv - halfRes * dir1);\n	vec4 samplePos1 = texture2D(hx_backbuffer, uv + halfRes * dir1);\n\n	float minComp = min(abs(dir1.x), abs(dir1.y)) * edgeSharpness;\n	vec2 dir2 = clamp(dir1.xy / minComp, -2.0, 2.0) * 2.0;\n	vec4 sampleNeg2 = texture2D(hx_backbuffer, uv - hx_rcpRenderTargetResolution * dir2);\n	vec4 samplePos2 = texture2D(hx_backbuffer, uv + hx_rcpRenderTargetResolution * dir2);\n	vec4 tap1 = sampleNeg1 + samplePos1;\n	vec4 fxaa = (tap1 + sampleNeg2 + samplePos2) * .25;\n	float fxaaLum = luminanceHint(fxaa);\n	if ((fxaaLum < minLum) || (fxaaLum > maxLum))\n		fxaa = tap1 * .5;\n	gl_FragColor = mix(center, fxaa, applyFXAA);\n}';

ShaderLibrary._files['gaussian_blur_fragment.glsl'] = 'varying vec2 uv;\n\nuniform sampler2D sourceTexture;\n\nuniform vec2 stepSize;\n\nuniform float gaussianWeights[NUM_WEIGHTS];\n\nvoid main()\n{\n	vec4 total = texture2D(sourceTexture, uv) * gaussianWeights[0];\n    vec2 offset = vec2(0.0);\n\n	for (int i = 1; i <= RADIUS; ++i) {\n		offset += stepSize;\n	    vec4 s = texture2D(sourceTexture, uv + offset) + texture2D(sourceTexture, uv - offset);\n		total += s * gaussianWeights[i];\n	}\n\n	gl_FragColor = total;\n}';

ShaderLibrary._files['gaussian_blur_vertex.glsl'] = 'attribute vec4 hx_position;\nattribute vec2 hx_texCoord;\n\nvarying vec2 uv;\n\nvoid main()\n{\n	uv = hx_texCoord;\n	gl_Position = hx_position;\n}';

ShaderLibrary._files['post_viewpos_vertex.glsl'] = 'attribute vec4 hx_position;\nattribute vec2 hx_texCoord;\n\nvarying vec2 uv;\nvarying vec3 viewDir;\n\nuniform mat4 hx_inverseProjectionMatrix;\n\nvoid main()\n{\n    uv = hx_texCoord;\n    viewDir = hx_getLinearDepthViewVector(hx_position.xy, hx_inverseProjectionMatrix);\n    gl_Position = hx_position;\n}';

ShaderLibrary._files['ssr_fragment.glsl'] = '#derivatives\n\nuniform sampler2D hx_gbufferColor;\nuniform sampler2D hx_gbufferNormals;\nuniform sampler2D hx_gbufferSpecular;\nuniform sampler2D hx_gbufferDepth;\nuniform sampler2D hx_dither2D;\nuniform vec2 hx_renderTargetResolution;\n\nuniform sampler2D hx_frontbuffer;\n\nvarying vec2 uv;\nvarying vec3 viewDir;\n\nuniform vec2 ditherTextureScale;\nuniform float hx_cameraNearPlaneDistance;\nuniform float hx_cameraFrustumRange;\nuniform float hx_rcpCameraFrustumRange;\nuniform mat4 hx_projectionMatrix;\n\nuniform float maxDistance;\nuniform float stepSize;\nuniform float maxRoughness;\n\n// all in viewspace\n// 0 is start, 1 is end\nfloat raytrace(in vec3 ray0, in vec3 rayDir, out float hitZ, out vec2 hitUV)\n{\n    vec4 dither = texture2D(hx_dither2D, uv * ditherTextureScale);\n    // Clip to the near plane\n	float rayLength = ((ray0.z + rayDir.z * maxDistance) > -hx_cameraNearPlaneDistance) ?\n						(-hx_cameraNearPlaneDistance - ray0.z) / rayDir.z : maxDistance;\n\n    vec3 ray1 = ray0 + rayDir * rayLength;\n\n    // only need the w component for perspective correct interpolation\n    // need to get adjusted ray end\'s uv value\n    vec4 hom0 = hx_projectionMatrix * vec4(ray0, 1.0);\n    vec4 hom1 = hx_projectionMatrix * vec4(ray1, 1.0);\n    float rcpW0 = 1.0 / hom0.w;\n    float rcpW1 = 1.0 / hom1.w;\n\n    hom0 *= rcpW0;\n    hom1 *= rcpW1;\n\n    // expressed in pixels, so we can snap to 1\n    // need to figure out the ratio between 1 pixel and the entire line \"width\" (if primarily vertical, it\'s actually height)\n\n    // line dimensions in pixels:\n\n    vec2 pixelSize = (hom1.xy - hom0.xy) * hx_renderTargetResolution * .5;\n\n    // line-\"width\" = max(abs(pixelSize.x), abs(pixelSize.y))\n    // ratio pixel/width = 1 / max(abs(pixelSize.x), abs(pixelSize.y))\n\n    float stepRatio = 1.0 / max(abs(pixelSize.x), abs(pixelSize.y)) * stepSize;\n\n    vec2 uvEnd = hom1.xy * .5 + .5;\n\n    vec2 dUV = (uvEnd - uv) * stepRatio;\n    hitUV = uv;\n\n    // linear depth\n    float rayDepth = (-ray0.z - hx_cameraNearPlaneDistance) * hx_rcpCameraFrustumRange;\n    float rayPerspDepth0 = rayDepth * rcpW0;\n    float rayPerspDepth1 = (-ray1.z - hx_cameraNearPlaneDistance) * hx_rcpCameraFrustumRange * rcpW1;\n    float rayPerspDepth = rayPerspDepth0;\n    // could probably optimize this:\n    float dRayD = (rayPerspDepth1 - rayPerspDepth0) * stepRatio;\n\n    float rcpW = rcpW0;\n    float dRcpW = (rcpW1 - rcpW0) * stepRatio;\n    float sceneDepth = rayDepth;\n\n    float amount = 0.0;\n\n    hitUV += dUV * dither.z;\n    rayPerspDepth += dRayD * dither.z;\n    rcpW += dRcpW * dither.z;\n\n    float sampleCount;\n    for (int i = 0; i < NUM_SAMPLES; ++i) {\n        rayDepth = rayPerspDepth / rcpW;\n\n        sceneDepth = hx_sampleLinearDepth(hx_gbufferDepth, hitUV);\n\n        if (rayDepth > sceneDepth + .001) {\n            amount = float(sceneDepth < 1.0);\n            sampleCount = float(i);\n            break;\n        }\n\n        hitUV += dUV;\n        rayPerspDepth += dRayD;\n        rcpW += dRcpW;\n    }\n\n    hitZ = -hx_cameraNearPlaneDistance - sceneDepth * hx_cameraFrustumRange;\n\n    amount *= clamp((1.0 - (sampleCount - float(NUM_SAMPLES)) / float(NUM_SAMPLES)) * 5.0, 0.0, 1.0);\n    return amount;\n}\n\nvoid main()\n{\n    vec4 colorSample = hx_gammaToLinear(texture2D(hx_gbufferColor, uv));\n    vec4 specularSample = texture2D(hx_gbufferSpecular, uv);\n    float depth = hx_sampleLinearDepth(hx_gbufferDepth, uv);\n    vec3 normalSpecularReflectance;\n    float roughness;\n    float metallicness;\n    hx_decodeReflectionData(colorSample, specularSample, normalSpecularReflectance, roughness, metallicness);\n    vec3 normal = hx_decodeNormal(texture2D(hx_gbufferNormals, uv));\n    vec3 reflDir = reflect(normalize(viewDir), normal);\n\n    vec3 fresnel = hx_fresnel(normalSpecularReflectance, reflDir, normal);\n    // not physically correct, but attenuation is required to look good\n\n    // step for every pixel\n\n    float absViewZ = hx_cameraNearPlaneDistance + depth * hx_cameraFrustumRange;\n    vec3 viewSpacePos = absViewZ * viewDir;\n\n    float hitZ = 0.0;\n    vec2 hitUV;\n    float amount = raytrace(viewSpacePos, reflDir, hitZ, hitUV);\n    float fadeFactor = 1.0 - clamp(reflDir.z * 2.0, 0.0, 1.0);\n\n    vec2 borderFactors = abs(hitUV * 2.0 - 1.0);\n    borderFactors = (1.0 - borderFactors) * 10.0;\n    fadeFactor *= clamp(borderFactors.x, 0.0, 1.0) * clamp(borderFactors.y, 0.0, 1.0);\n\n    float diff = viewSpacePos.z - hitZ;\n    fadeFactor *= hx_linearStep(-1.0, 0.0, diff);\n    fadeFactor *= hx_linearStep(maxRoughness, 0.0, roughness);\n\n    vec4 reflColor = texture2D(hx_frontbuffer, hitUV);\n\n    float amountUsed = amount * fadeFactor;\n    gl_FragColor = vec4(fresnel * reflColor.xyz, amountUsed);\n}\n\n';

ShaderLibrary._files['ssr_stencil_fragment.glsl'] = 'uniform sampler2D hx_gbufferSpecular;\n\nvarying vec2 uv;\n\nuniform float maxRoughness;\n\nvoid main()\n{\n    vec4 specularSample = texture2D(hx_gbufferSpecular, uv);\n    if (specularSample.x > maxRoughness)\n        discard;\n}\n\n';

ShaderLibrary._files['tonemap_filmic_fragment.glsl'] = 'void main()\n{\n	vec4 color = hx_getToneMapScaledColor();\n	vec3 x = max(vec3(0.0), color.xyz - 0.004);\n\n	// this has pow 2.2 gamma included, not valid if using fast gamma correction\n	//gl_FragColor = vec4((x * (6.2 * x + .5))/(x * (6.2 * x + 1.7) + 0.06), 1.0);\n\n    // Jim Hejl and Richard Burgess-Dawson\n	/*float a = 6.2;\n    float b = .5;\n    float c = 6.2;\n    float d = 1.7;\n    float e = 0.06;*/\n\n	// ACES -> this desaturates less\n	float a = 2.51;\n    float b = 0.03;\n    float c = 2.43;\n    float d = 0.59;\n    float e = 0.14;\n	gl_FragColor = vec4((x*(a*x+b))/(x*(c*x+d)+e), 1.0);\n}';

ShaderLibrary._files['tonemap_reference_fragment.glsl'] = 'varying vec2 uv;\n\nuniform sampler2D hx_backbuffer;\n\nvoid main()\n{\n	vec4 color = texture2D(hx_backbuffer, uv);\n	float lum = clamp(hx_luminance(color), 0.0, 1000.0);\n	float l = log(1.0 + lum);\n	gl_FragColor = vec4(l, l, l, 1.0);\n}';

ShaderLibrary._files['tonemap_reinhard_fragment.glsl'] = 'void main()\n{\n	vec4 color = hx_getToneMapScaledColor();\n	float lum = hx_luminance(color);\n	gl_FragColor = color / (1.0 + lum);\n}';

ShaderLibrary._files['blend_color_copy_fragment.glsl'] = 'varying vec2 uv;\n\nuniform sampler2D sampler;\n\nuniform vec4 blendColor;\n\nvoid main()\n{\n    // extractChannel comes from a macro\n   gl_FragColor = texture2D(sampler, uv) * blendColor;\n}\n';

ShaderLibrary._files['copy_fragment.glsl'] = 'varying vec2 uv;\n\nuniform sampler2D sampler;\n\nvoid main()\n{\n    // extractChannel comes from a macro\n   gl_FragColor = vec4(extractChannels(texture2D(sampler, uv)));\n\n#ifndef COPY_ALPHA\n   gl_FragColor.a = 1.0;\n#endif\n}\n';

ShaderLibrary._files['copy_to_gamma_fragment.glsl'] = 'varying vec2 uv;\n\nuniform sampler2D sampler;\n\nvoid main()\n{\n   gl_FragColor = vec4(hx_linearToGamma(texture2D(sampler, uv).xyz), 1.0);\n}';

ShaderLibrary._files['copy_vertex.glsl'] = 'attribute vec4 hx_position;\nattribute vec2 hx_texCoord;\n\nvarying vec2 uv;\n\nvoid main()\n{\n    uv = hx_texCoord;\n    gl_Position = hx_position;\n}';

ShaderLibrary._files['null_fragment.glsl'] = 'void main()\n{\n   gl_FragColor = vec4(1.0);\n}\n';

ShaderLibrary._files['null_vertex.glsl'] = 'attribute vec4 hx_position;\n\nvoid main()\n{\n    gl_Position = hx_position;\n}';

ShaderLibrary._files['snippets_general.glsl'] = '#define HX_LOG_10 2.302585093\n\nfloat saturate(float value)\n{\n    return clamp(value, 0.0, 1.0);\n}\n\nvec2 saturate(vec2 value)\n{\n    return clamp(value, 0.0, 1.0);\n}\n\nvec3 saturate(vec3 value)\n{\n    return clamp(value, 0.0, 1.0);\n}\n\nvec4 saturate(vec4 value)\n{\n    return clamp(value, 0.0, 1.0);\n}\n\n// Only for 0 - 1\nvec4 hx_floatToRGBA8(float value)\n{\n    vec4 enc = value * vec4(1.0, 255.0, 65025.0, 16581375.0);\n    // cannot fract first value or 1 would not be encodable\n    enc.yzw = fract(enc.yzw);\n    return enc - enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n}\n\nfloat hx_RGBA8ToFloat(vec4 rgba)\n{\n    return dot(rgba, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0));\n}\n\nvec2 hx_floatToRG8(float value)\n{\n    vec2 enc = vec2(1.0, 255.0) * value;\n    enc.y = fract(enc.y);\n    enc.x -= enc.y / 255.0;\n    return enc;\n}\n\nfloat hx_RG8ToFloat(vec2 rg)\n{\n    return dot(rg, vec2(1.0, 1.0/255.0));\n}\n\nvec2 hx_encodeNormal(vec3 normal)\n{\n    vec2 data;\n    float p = sqrt(normal.z*8.0 + 8.0);\n    data = normal.xy / p + .5;\n    return data;\n}\n\nvec3 hx_decodeNormal(vec4 data)\n{\n    vec3 normal;\n    data.xy = data.xy*4.0 - 2.0;\n    float f = dot(data.xy, data.xy);\n    float g = sqrt(1.0 - f * .25);\n    normal.xy = data.xy * g;\n    normal.z = 1.0 - f * .5;\n    return normal;\n}\n\nfloat hx_log10(float val)\n{\n    return log(val) / HX_LOG_10;\n}\n\nvec4 hx_gammaToLinear(vec4 color)\n{\n    #if defined(HX_GAMMA_CORRECTION_PRECISE)\n        color.x = pow(color.x, 2.2);\n        color.y = pow(color.y, 2.2);\n        color.z = pow(color.z, 2.2);\n    #elif defined(HX_GAMMA_CORRECTION_FAST)\n        color.xyz *= color.xyz;\n    #endif\n    return color;\n}\n\nvec3 hx_gammaToLinear(vec3 color)\n{\n    #if defined(HX_GAMMA_CORRECTION_PRECISE)\n        color.x = pow(color.x, 2.2);\n        color.y = pow(color.y, 2.2);\n        color.z = pow(color.z, 2.2);\n    #elif defined(HX_GAMMA_CORRECTION_FAST)\n        color.xyz *= color.xyz;\n    #endif\n    return color;\n}\n\nvec4 hx_linearToGamma(vec4 linear)\n{\n    #if defined(HX_GAMMA_CORRECTION_PRECISE)\n        linear.x = pow(linear.x, 0.454545);\n        linear.y = pow(linear.y, 0.454545);\n        linear.z = pow(linear.z, 0.454545);\n    #elif defined(HX_GAMMA_CORRECTION_FAST)\n        linear.xyz = sqrt(linear.xyz);\n    #endif\n    return linear;\n}\n\nvec3 hx_linearToGamma(vec3 linear)\n{\n    #if defined(HX_GAMMA_CORRECTION_PRECISE)\n        linear.x = pow(linear.x, 0.454545);\n        linear.y = pow(linear.y, 0.454545);\n        linear.z = pow(linear.z, 0.454545);\n    #elif defined(HX_GAMMA_CORRECTION_FAST)\n        linear.xyz = sqrt(linear.xyz);\n    #endif\n    return linear;\n}\n\n/*float hx_sampleLinearDepth(sampler2D tex, vec2 uv)\n{\n    return hx_RGBA8ToFloat(texture2D(tex, uv));\n}*/\n\nfloat hx_decodeLinearDepth(vec4 samp)\n{\n    return hx_RG8ToFloat(samp.zw);\n}\n\nvec3 hx_getFrustumVector(vec2 position, mat4 unprojectionMatrix)\n{\n    vec4 unprojNear = unprojectionMatrix * vec4(position, -1.0, 1.0);\n    vec4 unprojFar = unprojectionMatrix * vec4(position, 1.0, 1.0);\n    return unprojFar.xyz/unprojFar.w - unprojNear.xyz/unprojNear.w;\n}\n\n// view vector with z = -1, so we can use nearPlaneDist + linearDepth * (farPlaneDist - nearPlaneDist) as a scale factor to find view space position\nvec3 hx_getLinearDepthViewVector(vec2 position, mat4 unprojectionMatrix)\n{\n    vec4 unproj = unprojectionMatrix * vec4(position, 0.0, 1.0);\n    unproj /= unproj.w;\n    return -unproj.xyz / unproj.z;\n}\n\n// THIS IS FOR NON_LINEAR DEPTH!\nfloat hx_depthToViewZ(float depthSample, mat4 projectionMatrix)\n{\n//    z = -projectionMatrix[3][2] / (d * 2.0 - 1.0 + projectionMatrix[2][2])\n    return -projectionMatrix[3][2] / (depthSample * 2.0 - 1.0 + projectionMatrix[2][2]);\n}\n\nvec3 hx_getNormalSpecularReflectance(float metallicness, float insulatorNormalSpecularReflectance, vec3 color)\n{\n    return mix(vec3(insulatorNormalSpecularReflectance), color, metallicness);\n}\n\nvec3 hx_fresnel(vec3 normalSpecularReflectance, vec3 lightDir, vec3 halfVector)\n{\n    float cosAngle = 1.0 - max(dot(halfVector, lightDir), 0.0);\n    // to the 5th power\n    float power = pow(cosAngle, 5.0);\n    return normalSpecularReflectance + (1.0 - normalSpecularReflectance) * power;\n}\n\n// https://seblagarde.wordpress.com/2011/08/17/hello-world/\nvec3 hx_fresnelProbe(vec3 normalSpecularReflectance, vec3 lightDir, vec3 normal, float roughness)\n{\n    float cosAngle = 1.0 - max(dot(normal, lightDir), 0.0);\n    // to the 5th power\n    float power = pow(cosAngle, 5.0);\n    float gloss = (1.0 - roughness) * (1.0 - roughness);\n    vec3 bound = max(vec3(gloss), normalSpecularReflectance);\n    return normalSpecularReflectance + (bound - normalSpecularReflectance) * power;\n}\n\n\nfloat hx_luminance(vec4 color)\n{\n    return dot(color.xyz, vec3(.30, 0.59, .11));\n}\n\nfloat hx_luminance(vec3 color)\n{\n    return dot(color, vec3(.30, 0.59, .11));\n}\n\n// linear variant of smoothstep\nfloat hx_linearStep(float lower, float upper, float x)\n{\n    return clamp((x - lower) / (upper - lower), 0.0, 1.0);\n}\n\n// sadly, need a parameter due to a bug in Internet Explorer / Edge. Just pass in 0.\n#ifdef HX_USE_SKINNING_TEXTURE\n#define HX_RCP_MAX_BONES 1.0 / float(HX_MAX_BONES - 1)\nmat4 hx_getSkinningMatrixImpl(vec4 weights, vec4 indices, sampler2D tex)\n{\n    mat4 m = mat4(0.0);\n    for (int i = 0; i < 4; ++i) {\n        mat4 t;\n        float index = indices[i] * HX_RCP_MAX_BONES;\n        t[0] = texture2D(tex, vec2(index, 0.0));\n        t[1] = texture2D(tex, vec2(index, 0.5));\n        t[2] = texture2D(tex, vec2(index, 1.0));\n        t[3] = vec4(0.0, 0.0, 0.0, 1.0);\n        m += weights[i] * t;\n    }\n    return m;\n}\n#define hx_getSkinningMatrix(v) hx_getSkinningMatrixImpl(hx_boneWeights, hx_boneIndices, hx_skinningTexture)\n#else\n#define hx_getSkinningMatrix(v) ( hx_boneWeights.x * mat4(hx_skinningMatrices[int(hx_boneIndices.x) * 3], hx_skinningMatrices[int(hx_boneIndices.x) * 3 + 1], hx_skinningMatrices[int(hx_boneIndices.x) * 3 + 2], vec4(0.0, 0.0, 0.0, 1.0)) + hx_boneWeights.y * mat4(hx_skinningMatrices[int(hx_boneIndices.y) * 3], hx_skinningMatrices[int(hx_boneIndices.y) * 3 + 1], hx_skinningMatrices[int(hx_boneIndices.y) * 3 + 2], vec4(0.0, 0.0, 0.0, 1.0)) + hx_boneWeights.z * mat4(hx_skinningMatrices[int(hx_boneIndices.z) * 3], hx_skinningMatrices[int(hx_boneIndices.z) * 3 + 1], hx_skinningMatrices[int(hx_boneIndices.z) * 3 + 2], vec4(0.0, 0.0, 0.0, 1.0)) + hx_boneWeights.w * mat4(hx_skinningMatrices[int(hx_boneIndices.w) * 3], hx_skinningMatrices[int(hx_boneIndices.w) * 3 + 1], hx_skinningMatrices[int(hx_boneIndices.w) * 3 + 2], vec4(0.0, 0.0, 0.0, 1.0)) )\n#endif';

ShaderLibrary._files['snippets_geometry.glsl'] = 'struct HX_GeometryData\n{\n    vec4 color;\n    vec3 normal;\n    float metallicness;\n    float normalSpecularReflectance;\n    float roughness;\n    vec3 emission;\n    vec4 data;  // this can be anything the lighting model requires (only works with forward rendering)\n};\n\n// used for parsing deferred passes\nstruct HX_GBufferData\n{\n    HX_GeometryData geometry;\n\n    // extra decoding stuff\n    vec3 normalSpecularReflectance;\n    float linearDepth;\n};\n\nHX_GBufferData hx_parseGBuffer(sampler2D albedoTex, sampler2D normalDepthTex, sampler2D specularTex, vec2 uv)\n{\n    HX_GBufferData data;\n    vec4 albedoSample = texture2D(albedoTex, uv);\n    vec4 normalDepthSample = texture2D(normalDepthTex, uv);\n    vec4 specularSample = texture2D(specularTex, uv);\n    data.geometry.normal = hx_decodeNormal(normalDepthSample);\n    data.geometry.metallicness = specularSample.x;\n    data.geometry.normalSpecularReflectance = specularSample.y * .2;\n    data.geometry.roughness = max(specularSample.z, .01);\n    data.geometry.color = vec4(albedoSample.xyz * (1.0 - data.geometry.metallicness), 1.0);\n    data.normalSpecularReflectance = hx_getNormalSpecularReflectance(specularSample.x, data.geometry.normalSpecularReflectance, albedoSample.xyz);\n    data.linearDepth = hx_RG8ToFloat(normalDepthSample.zw);\n    return data;\n}';

ShaderLibrary._files['snippets_tonemap.glsl'] = 'varying vec2 uv;\n\n#ifdef HX_ADAPTIVE\nuniform sampler2D hx_luminanceMap;\nuniform float hx_luminanceMipLevel;\n#endif\n\nuniform float hx_exposure;\nuniform float hx_key;\n\nuniform sampler2D hx_backbuffer;\n\n\nvec4 hx_getToneMapScaledColor()\n{\n    #ifdef HX_ADAPTIVE\n    float referenceLuminance = exp(texture2DLodEXT(hx_luminanceMap, uv, hx_luminanceMipLevel).x) - 1.0;\n    referenceLuminance = clamp(referenceLuminance, .08, 1000.0);\n	float exposure = hx_key / referenceLuminance * hx_exposure;\n	#else\n	float exposure = hx_exposure;\n	#endif\n    return texture2D(hx_backbuffer, uv) * exposure;\n}';

ShaderLibrary._files['dir_shadow_esm.glsl'] = 'vec4 hx_getShadowMapValue(float depth)\n{\n    // I wish we could write exp directly, but precision issues (can\'t encode real floats)\n    return vec4(exp(HX_ESM_CONSTANT * depth));\n// so when blurring, we\'ll need to do ln(sum(exp())\n//    return vec4(depth);\n}\n\nfloat hx_readShadow(sampler2D shadowMap, vec3 viewPos, mat4 shadowMapMatrix, float depthBias)\n{\n    vec4 shadowMapCoord = shadowMapMatrix * vec4(viewPos, 1.0);\n    float shadowSample = texture2D(shadowMap, shadowMapCoord.xy).x;\n    shadowMapCoord.z += depthBias;\n//    float diff = shadowSample - shadowMapCoord.z;\n//    return saturate(HX_ESM_DARKENING * exp(HX_ESM_CONSTANT * diff));\n    return saturate(HX_ESM_DARKENING * shadowSample * exp(-HX_ESM_CONSTANT * shadowMapCoord.z));\n}';

ShaderLibrary._files['dir_shadow_hard.glsl'] = 'vec4 hx_getShadowMapValue(float depth)\n{\n    return hx_floatToRGBA8(depth);\n}\n\nfloat hx_readShadow(sampler2D shadowMap, vec3 viewPos, mat4 shadowMapMatrix, float depthBias)\n{\n    vec4 shadowMapCoord = shadowMapMatrix * vec4(viewPos, 1.0);\n    float shadowSample = hx_RGBA8ToFloat(texture2D(shadowMap, shadowMapCoord.xy));\n    float diff = shadowMapCoord.z - shadowSample - depthBias;\n    return float(diff < 0.0);\n}';

ShaderLibrary._files['dir_shadow_pcf.glsl'] = '#ifdef HX_PCF_DITHER_SHADOWS\n    uniform sampler2D hx_dither2D;\n    uniform vec2 hx_dither2DTextureScale;\n#endif\n\nuniform vec2 hx_poissonDisk[HX_PCF_NUM_SHADOW_SAMPLES];\n\nvec4 hx_getShadowMapValue(float depth)\n{\n    return hx_floatToRGBA8(depth);\n}\n\nfloat hx_readShadow(sampler2D shadowMap, vec3 viewPos, mat4 shadowMapMatrix, float depthBias)\n{\n    vec2 radii = vec2(shadowMapMatrix[0][0], shadowMapMatrix[1][1]) * float(HX_PCF_SOFTNESS);\n    vec4 shadowMapCoord = shadowMapMatrix * vec4(viewPos, 1.0);\n    float shadowTest = 0.0;\n\n    #ifdef HX_PCF_DITHER_SHADOWS\n        vec4 dither = texture2D(hx_dither2D, gl_FragCoord.xy * hx_dither2DTextureScale);\n        dither = vec4(dither.x, -dither.y, dither.y, dither.x) * radii.xxyy;  // add radius scale\n    #else\n        vec4 dither = radii.xxyy;\n    #endif\n\n    for (int i = 0; i < HX_PCF_NUM_SHADOW_SAMPLES; ++i) {\n        vec2 offset;\n        offset.x = dot(dither.xy, hx_poissonDisk[i]);\n        offset.y = dot(dither.zw, hx_poissonDisk[i]);\n        float shadowSample = hx_RGBA8ToFloat(texture2D(shadowMap, shadowMapCoord.xy + offset));\n        float diff = shadowMapCoord.z - shadowSample - depthBias;\n        shadowTest += float(diff < 0.0);\n    }\n\n    return shadowTest * HX_PCF_RCP_NUM_SHADOW_SAMPLES;\n}';

ShaderLibrary._files['dir_shadow_vsm.glsl'] = '#derivatives\n\nvec4 hx_getShadowMapValue(float depth)\n{\n    float dx = dFdx(depth);\n    float dy = dFdy(depth);\n    float moment2 = depth * depth + 0.25*(dx*dx + dy*dy);\n    return vec4(hx_floatToRG8(depth), hx_floatToRG8(moment2));\n}\n\nfloat hx_readShadow(sampler2D shadowMap, vec3 viewPos, mat4 shadowMapMatrix, float depthBias)\n{\n    vec4 shadowMapCoord = shadowMapMatrix * vec4(viewPos, 1.0);\n    vec4 s = texture2D(shadowMap, shadowMapCoord.xy);\n    vec2 moments = vec2(hx_RG8ToFloat(s.xy), hx_RG8ToFloat(s.zw));\n    shadowMapCoord.z += depthBias;\n\n    float variance = moments.y - moments.x * moments.x;\n    variance = max(variance, HX_VSM_MIN_VARIANCE);\n\n    float diff = shadowMapCoord.z - moments.x;\n    float upperBound = 1.0;\n\n    // transparents could be closer to the light than casters\n    if (diff > 0.0)\n        upperBound = variance / (variance + diff*diff);\n\n    return saturate((upperBound - HX_VSM_LIGHT_BLEED_REDUCTION) / HX_VSM_LIGHT_BLEED_REDUCTION_RANGE);\n}';

ShaderLibrary._files['esm_blur_fragment.glsl'] = 'varying vec2 uv;\n\nuniform sampler2D source;\nuniform vec2 direction; // this is 1/pixelSize\n\nfloat readValue(vec2 coord)\n{\n    float v = texture2D(source, coord).x;\n    return v;\n//    return exp(HX_ESM_CONSTANT * v);\n}\n\nvoid main()\n{\n    float total = readValue(uv);\n\n	for (int i = 1; i <= RADIUS; ++i) {\n	    vec2 offset = direction * float(i);\n		total += readValue(uv + offset) + readValue(uv - offset);\n	}\n\n//	gl_FragColor = vec4(log(total * RCP_NUM_SAMPLES) / HX_ESM_CONSTANT);\n	gl_FragColor = vec4(total * RCP_NUM_SAMPLES);\n}';

ShaderLibrary._files['vsm_blur_fragment.glsl'] = 'varying vec2 uv;\n\nuniform sampler2D source;\nuniform vec2 direction; // this is 1/pixelSize\n\nvec2 readValues(vec2 coord)\n{\n    vec4 s = texture2D(source, coord);\n    return vec2(hx_RG8ToFloat(s.xy), hx_RG8ToFloat(s.zw));\n}\n\nvoid main()\n{\n    vec2 total = readValues(uv);\n\n	for (int i = 1; i <= RADIUS; ++i) {\n	    vec2 offset = direction * float(i);\n		total += readValues(uv + offset) + readValues(uv - offset);\n	}\n\n    total *= RCP_NUM_SAMPLES;\n\n	gl_FragColor.xy = hx_floatToRG8(total.x);\n	gl_FragColor.zw = hx_floatToRG8(total.y);\n}';

ShaderLibrary._files['2d_to_cube_vertex.glsl'] = '// position to write to\nattribute vec4 hx_position;\n\n// the corner of the cube map\nattribute vec3 corner;\n\nvarying vec3 direction;\n\nvoid main()\n{\n    direction = corner;\n    gl_Position = hx_position;\n}\n';

ShaderLibrary._files['equirectangular_to_cube_fragment.glsl'] = '#define RECIPROCAL_PI2 0.15915494\n\nvarying vec3 direction;\n\nuniform sampler2D source;\n\nvoid main()\n{\n    vec3 dir = normalize(direction);\n    vec2 uv;\n    uv.x = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;\n	uv.y = dir.y * 0.5 + 0.5;\n    gl_FragColor = texture2D(source, uv);\n}\n';

ShaderLibrary._files['greyscale_to_rgba8.glsl'] = 'varying vec2 uv;\n\nuniform sampler2D source;\n\nvoid main()\n{\n    gl_FragColor = hx_floatToRGBA8(texture2D(source, uv).x);\n}\n';

ShaderLibrary._files['smooth_heightmap_fragment.glsl'] = 'varying vec2 uv;\n\nuniform sampler2D reference;    // the source (8 bit) texture\nuniform sampler2D source;\n\nuniform vec2 stepSize;\n\nvoid main()\n{\n    float gauss[4];\n    gauss[0] = 0.201788613113303;\n    gauss[1] = 0.17755834971394;\n    gauss[2] = 0.120969095455128;\n    gauss[3] = 0.063811162332456;\n    float refHeight = texture2D(reference, uv).x;\n    float total = hx_RGBA8ToFloat(texture2D(source, uv)) * gauss[0];\n    float totalWeight = gauss[0];\n    float currentWeightL = 1.0;\n    float currentWeightR = 1.0;\n    vec2 offset = vec2(0.0);\n\n\n    for (int i = 0; i < 3; ++i) {\n        offset += stepSize;\n        float refLeft = texture2D(reference, uv - offset).x;\n        float refRight = texture2D(reference, uv + offset).x;\n        float heightLeft = hx_RGBA8ToFloat(texture2D(source, uv - offset));\n        float heightRight = hx_RGBA8ToFloat(texture2D(source, uv + offset));\n        // smooth out over N pixels that have the same reference height in the source image\n        currentWeightL = max(currentWeightL - abs(refLeft - refHeight) * 5.0, 0.0);\n        currentWeightR = max(currentWeightR - abs(refRight - refHeight) * 5.0, 0.0);\n        totalWeight += (currentWeightL + currentWeightR) * gauss[i + 1];\n        total += (heightLeft * currentWeightL + heightRight * currentWeightR) *  gauss[i + 1];\n    }\n\n    gl_FragColor = hx_floatToRGBA8(total / totalWeight);\n//    gl_FragColor = hx_floatToRGBA8(refHeight);\n}\n';

ShaderLibrary._files['ao_blur_fragment.glsl'] = 'varying vec2 uv1;\nvarying vec2 uv2;\nvarying vec2 uv3;\nvarying vec2 uv4;\n\nuniform sampler2D source;\n\nvoid main()\n{\n    vec4 total = texture2D(source, uv1) + texture2D(source, uv2) + texture2D(source, uv3) + texture2D(source, uv4);\n	gl_FragColor = total * .25;\n}';

ShaderLibrary._files['ao_blur_vertex.glsl'] = 'attribute vec4 hx_position;\nattribute vec2 hx_texCoord;\n\nvarying vec2 uv1;\nvarying vec2 uv2;\nvarying vec2 uv3;\nvarying vec2 uv4;\n\nuniform vec2 pixelSize;\n\nvoid main()\n{\n	uv1 = hx_texCoord + vec2(-1.5, .5) * pixelSize;\n	uv2 = hx_texCoord + vec2(.5, .5) * pixelSize;\n	uv3 = hx_texCoord + vec2(.5, -1.5) * pixelSize;\n	uv4 = hx_texCoord + vec2(-1.5, -1.5) * pixelSize;\n	gl_Position = hx_position;\n}';

ShaderLibrary._files['hbao_fragment.glsl'] = 'uniform float hx_cameraFrustumRange;\nuniform float hx_cameraNearPlaneDistance;\nuniform vec2 hx_rcpRenderTargetResolution;\nuniform mat4 hx_projectionMatrix;\n\nuniform float strengthPerRay;\nuniform float halfSampleRadius;\nuniform float bias;\nuniform float rcpFallOffDistance;\nuniform vec2 ditherScale;\n\nuniform sampler2D hx_gbufferNormalDepth;\nuniform sampler2D sampleDirTexture;\nuniform sampler2D ditherTexture;\n\nvarying vec2 uv;\nvarying vec3 viewDir;\nvarying vec3 frustumCorner;\n\nvec3 getViewPos(vec2 sampleUV)\n{\n    vec4 smp = texture2D(hx_gbufferNormalDepth, sampleUV);\n    float depth = hx_decodeLinearDepth(smp);\n    float viewZ = depth * hx_cameraFrustumRange + hx_cameraNearPlaneDistance;\n    vec3 viewPos = frustumCorner * vec3(sampleUV * 2.0 - 1.0, 1.0);\n    return viewPos * viewZ;\n}\n\n// Retrieves the occlusion factor for a particular sample\nfloat getSampleOcclusion(vec2 sampleUV, vec3 centerViewPos, vec3 centerNormal, vec3 tangent, inout float topOcclusion)\n{\n    vec3 sampleViewPos = getViewPos(sampleUV);\n\n    // get occlusion factor based on candidate horizon elevation\n    vec3 horizonVector = sampleViewPos - centerViewPos;\n    float horizonVectorLength = length(horizonVector);\n\n    float occlusion;\n\n    // If the horizon vector points away from the tangent, make an estimate\n    if (dot(tangent, horizonVector) < 0.0)\n        occlusion = .5;\n    else\n        occlusion = dot(centerNormal, horizonVector) / horizonVectorLength;\n\n    // this adds occlusion only if angle of the horizon vector is higher than the previous highest one without branching\n    float diff = max(occlusion - topOcclusion, 0.0);\n    topOcclusion = max(occlusion, topOcclusion);\n\n    // attenuate occlusion contribution using distance function 1 - (d/f)^2\n    float distanceFactor = clamp(horizonVectorLength * rcpFallOffDistance, 0.0, 1.0);\n    distanceFactor = 1.0 - distanceFactor * distanceFactor;\n    return diff * distanceFactor;\n}\n\n// Retrieves the occlusion for a given ray\nfloat getRayOcclusion(vec2 direction, float jitter, vec2 projectedRadii, vec3 centerViewPos, vec3 centerNormal)\n{\n    // calculate the nearest neighbour sample along the direction vector\n    vec2 texelSizedStep = direction * hx_rcpRenderTargetResolution;\n    direction *= projectedRadii;\n\n    // gets the tangent for the current ray, this will be used to handle opposing horizon vectors\n    // Tangent is corrected with respect to face normal by projecting it onto the tangent plane defined by the normal\n    vec3 tangent = getViewPos(uv + texelSizedStep) - centerViewPos;\n    tangent -= dot(centerNormal, tangent) * centerNormal;\n\n    vec2 stepUV = direction.xy / float(NUM_SAMPLES_PER_RAY - 1);\n\n    // jitter the starting position for ray marching between the nearest neighbour and the sample step size\n    vec2 jitteredOffset = mix(texelSizedStep, stepUV, jitter);\n    //stepUV *= 1.0 + jitter * .1;\n    vec2 sampleUV = uv + jitteredOffset;\n\n    // top occlusion keeps track of the occlusion contribution of the last found occluder.\n    // set to bias value to avoid near-occluders\n    float topOcclusion = bias;\n    float occlusion = 0.0;\n\n    // march!\n    for (int step = 0; step < NUM_SAMPLES_PER_RAY; ++step) {\n        occlusion += getSampleOcclusion(sampleUV, centerViewPos, centerNormal, tangent, topOcclusion);\n        sampleUV += stepUV;\n    }\n\n    return occlusion;\n}\n\nvoid main()\n{\n    vec4 normalDepth = texture2D(hx_gbufferNormalDepth, uv);\n    vec3 centerNormal = hx_decodeNormal(normalDepth);\n    float centerDepth = hx_decodeLinearDepth(normalDepth);\n    float viewZ = hx_cameraNearPlaneDistance + centerDepth * hx_cameraFrustumRange;\n    vec3 centerViewPos = viewZ * viewDir;\n\n    // clamp z to a minimum, so the radius does not get excessively large in screen-space\n    float projRadius = halfSampleRadius / max(-centerViewPos.z, 7.0);\n    vec2 projectedRadii = projRadius * vec2(hx_projectionMatrix[0][0], hx_projectionMatrix[1][1]);\n\n    // do not take more steps than there are pixels\n    float totalOcclusion = 0.0;\n\n    vec2 randomFactors = texture2D(ditherTexture, uv * ditherScale).xy;\n\n    vec2 rayUV = vec2(0.0);\n    for (int i = 0; i < NUM_RAYS; ++i) {\n        rayUV.x = (float(i) + randomFactors.x) / float(NUM_RAYS);\n        vec2 sampleDir = texture2D(sampleDirTexture, rayUV).xy * 2.0 - 1.0;\n        totalOcclusion += getRayOcclusion(sampleDir, randomFactors.y, projectedRadii, centerViewPos, centerNormal);\n    }\n\n    totalOcclusion = 1.0 - clamp(strengthPerRay * totalOcclusion, 0.0, 1.0);\n    gl_FragColor = vec4(vec3(totalOcclusion), 1.0);\n}';

ShaderLibrary._files['hbao_vertex.glsl'] = 'attribute vec4 hx_position;\nattribute vec2 hx_texCoord;\n\nuniform mat4 hx_inverseProjectionMatrix;\n\nvarying vec2 uv;\nvarying vec3 viewDir;\nvarying vec3 frustumCorner;\n\nvoid main()\n{\n    uv = hx_texCoord;\n    viewDir = hx_getLinearDepthViewVector(hx_position.xy, hx_inverseProjectionMatrix);\n    frustumCorner = hx_getLinearDepthViewVector(vec2(1.0, 1.0), hx_inverseProjectionMatrix);\n    gl_Position = hx_position;\n}';

ShaderLibrary._files['ssao_fragment.glsl'] = 'uniform mat4 hx_projectionMatrix;\nuniform mat4 hx_cameraWorldMatrix;\nuniform float hx_cameraFrustumRange;\nuniform float hx_cameraNearPlaneDistance;\n\nuniform vec2 ditherScale;\nuniform float strengthPerSample;\nuniform float rcpFallOffDistance;\nuniform float sampleRadius;\nuniform vec3 samples[NUM_SAMPLES]; // w contains bias\n\nuniform sampler2D ditherTexture;\nuniform sampler2D hx_gbufferNormalDepth;\n\nvarying vec2 uv;\n\nvoid main()\n{\n    vec4 normalDepth = texture2D(hx_gbufferNormalDepth, uv);\n    vec3 centerNormal = hx_decodeNormal(normalDepth);\n    float centerDepth = hx_decodeLinearDepth(normalDepth);\n    float totalOcclusion = 0.0;\n    vec3 dither = texture2D(ditherTexture, uv * ditherScale).xyz;\n    vec3 randomPlaneNormal = normalize(dither - .5);\n    float w = centerDepth * hx_cameraFrustumRange + hx_cameraNearPlaneDistance;\n    vec3 sampleRadii;\n    sampleRadii.xy = sampleRadius * .5 / w * vec2(hx_projectionMatrix[0][0], hx_projectionMatrix[1][1]);\n    sampleRadii.z = sampleRadius;\n\n    for (int i = 0; i < NUM_SAMPLES; ++i) {\n        vec3 sampleOffset = reflect(samples[i], randomPlaneNormal);\n        vec3 normOffset = normalize(sampleOffset);\n        float cosFactor = dot(normOffset, centerNormal);\n        float sign = sign(cosFactor);\n        sampleOffset *= sign;\n        cosFactor *= sign;\n\n        vec3 scaledOffset = sampleOffset * sampleRadii;\n\n        vec2 samplePos = uv + scaledOffset.xy;\n        normalDepth = texture2D(hx_gbufferNormalDepth, samplePos);\n        float occluderDepth = hx_decodeLinearDepth(normalDepth);\n        float diffZ = (centerDepth - occluderDepth) * hx_cameraFrustumRange;\n\n        // distanceFactor: from 1 to 0, near to far\n        float distanceFactor = clamp(diffZ * rcpFallOffDistance, 0.0, 1.0);\n        distanceFactor = 1.0 - distanceFactor;\n\n        // sampleOcclusion: 1 if occluding, 0 otherwise\n        float sampleOcclusion = float(diffZ > scaledOffset.z);\n        totalOcclusion += sampleOcclusion * distanceFactor * cosFactor;\n    }\n    gl_FragColor = vec4(vec3(1.0 - totalOcclusion * strengthPerSample), 1.0);\n}';

var ArrayUtils = {
    shuffle: function(array)
    {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }
};

/**
 * Hexadecimal representations are always 0xAARRGGBB
 * @param rOrHex
 * @param g
 * @param b
 * @param a
 * @constructor
 */
function Color(rOrHex, g, b, a)
{
    this.set(rOrHex, g, b, a);
}

Color.prototype =
{
    set: function (rOrHex, g, b, a)
    {
        if (rOrHex === undefined) {
            this.a = 1.0;
            this.r = 1.0;
            this.g = 1.0;
            this.b = 1.0;
        }
        else if (g === undefined) {
            this.a = 1.0;
            this.r = ((rOrHex & 0xff0000) >>> 16) / 255.0;
            this.g = ((rOrHex & 0x00ff00) >>> 8) / 255.0;
            this.b = (rOrHex & 0x0000ff) / 255.0;
        }
        else {
            this.r = rOrHex;
            this.g = g;
            this.b = b;
            this.a = a === undefined ? 1.0 : a;
        }
    },

    hex: function ()
    {
        var r = (Math.min(this.r, 1.0) * 0xff);
        var g = (Math.min(this.g, 1.0) * 0xff);
        var b = (Math.min(this.b, 1.0) * 0xff);

        return (r << 16) | (g << 8) | b;
    },

    luminance: function ()
    {
        return this.r * .30 + this.g * 0.59 + this.b * .11;
    },

    gammaToLinear: function (target)
    {
        target = target || new Color();

        if (META.OPTIONS.usePreciseGammaCorrection) {
            target.r = Math.pow(this.r, 2.2);
            target.g = Math.pow(this.g, 2.2);
            target.b = Math.pow(this.b, 2.2);
        }
        else {
            target.r = this.r * this.r;
            target.g = this.g * this.g;
            target.b = this.b * this.b;
        }
        target.a = this.a;

        return target;
    },

    linearToGamma: function (target)
    {
        target = target || new Color();

        if (META.OPTIONS.usePreciseGammaCorrection) {
            target.r = Math.pow(this.r, .454545);
            target.g = Math.pow(this.g, .454545);
            target.b = Math.pow(this.b, .454545);
        }
        else {
            target.r = Math.sqrt(this.r);
            target.g = Math.sqrt(this.g);
            target.b = Math.sqrt(this.b);
        }
        target.a = this.a;

        return target;
    },

    copyFrom: function (color)
    {
        this.r = color.r;
        this.g = color.g;
        this.b = color.b;
        this.a = color.a;
    },

    toString: function ()
    {
        return "Color(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")";
    },

    clone: function ()
    {
        var color = new Color();
        color.r = this.r;
        color.g = this.g;
        color.b = this.b;
        color.a = this.a;
        return color;
    }
};

Color.BLACK = new Color(0, 0, 0, 1);
Color.ZERO = new Color(0, 0, 0, 0);
Color.RED = new Color(1, 0, 0, 1);
Color.GREEN = new Color(0, 1, 0, 1);
Color.BLUE = new Color(0, 0, 1, 1);
Color.YELLOW = new Color(1, 1, 0, 1);
Color.MAGENTA = new Color(1, 0, 1, 1);
Color.CYAN = new Color(0, 1, 1, 1);
Color.WHITE = new Color(1, 1, 1, 1);

/**
 * Creates a new Float4 object, which can be used as a vector (w = 0), a point (w = 1) or a homogeneous coordinate.
 * @class
 * @constructor
 */
function Float4(x, y, z, w)
{
    // x, y, z, w allowed to be accessed publicly for simplicity, changing this does not violate invariant. Ever.
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.w = w === undefined? 1 : w;
}


/**
 * Returns the angle between two vectors
 */
Float4.angle = function(a, b)
{
    return Math.acos(Float4.dot3(a, b) / (a.length * b.length));
};

Float4.dot = Float4.dot3 = function(a, b)
{
    return a.x * b.x + a.y * b.y + a.z * b.z;
};

Float4.dot4 = function(a, b)
{
    return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
};

Float4.lerp = function(a, b, factor, target)
{
    target = target || new Float4();
    var ax = a.x, ay = a.y, az = a.z, aw = a.w;

    target.x = ax + (b.x - ax) * factor;
    target.y = ay + (b.y - ay) * factor;
    target.z = az + (b.z - az) * factor;
    target.w = aw + (b.w - aw) * factor;
};

Float4.distance = function(a, b)
{
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

Float4.distanceSqr = function(a, b)
{
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return dx * dx + dy * dy + dz * dz;
};

Float4.negate = function(a, target)
{
    target = target || new Float4();
    target.x = -a.x;
    target.y = -a.y;
    target.z = -a.z;
    target.w = -a.w;
    return target;
};

/**
 * Returns the angle between two vectors, assuming they are normalized
 */
Float4.angleNormalized = function(a, b)
{
    return Math.acos(Float4.dot3(a, b));
};

Float4.add = function(a, b, target)
{
    target = target || new Float4();
    target.x = a.x + b.x;
    target.y = a.y + b.y;
    target.z = a.z + b.z;
    target.w = a.w + b.w;
    return target;
};

Float4.subtract = function(a, b, target)
{
    target = target || new Float4();
    target.x = a.x - b.x;
    target.y = a.y - b.y;
    target.z = a.z - b.z;
    target.w = a.w - b.w;
    return target;
};

Float4.scale = function(a, s, target)
{
    target = target || new Float4();
    target.x = a.x * s;
    target.y = a.y * s;
    target.z = a.z * s;
    return target;
};

Float4.scale4 = function(a, s, target)
{
    target = target || new Float4();
    target.x = a.x * s;
    target.y = a.y * s;
    target.z = a.z * s;
    target.w = a.w * s;
    return target;
};

Float4.cross = function(a, b, target)
{
    target = target || new Float4();
    // safe to use either a and b parameter
    var ax = a.x, ay = a.y, az = a.z;
    var bx = b.x, by = b.y, bz = b.z;

    target.x = ay*bz - az*by;
    target.y = az*bx - ax*bz;
    target.z = ax*by - ay*bx;
    return target;
};

Float4.prototype =
{
    set: function(x, y, z, w)
    {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w === undefined? this.w : w;
    },

    get lengthSqr()
    {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    },

    get length()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    },

    normalize: function()
    {
        var rcpLength = 1.0/this.length;
        this.x *= rcpLength;
        this.y *= rcpLength;
        this.z *= rcpLength;
    },

    normalizeAsPlane: function()
    {
        var rcpLength = 1.0/this.length;
        this.x *= rcpLength;
        this.y *= rcpLength;
        this.z *= rcpLength;
        this.w *= rcpLength;
    },

    clone: function()
    {
        return new Float4(this.x, this.y, this.z, this.w);
    },

    add: function(v)
    {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        this.w += v.w;
    },

    addScaled: function(v, s)
    {
        this.x += v.x * s;
        this.y += v.y * s;
        this.z += v.z * s;
        this.w += v.w * s;
    },

    subtract: function(v)
    {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        this.w -= v.w;
    },

    scale: function(s)
    {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        //this.w *= s;
    },

    scale4: function(s)
    {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        this.w *= s;
    },

    negate: function()
    {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        this.w = -this.w;
    },

    /**
     * Project to carthesian 3D space by dividing by w
     */
    homogeneousProject: function()
    {
        var rcpW = 1.0/this.w;
        this.x *= rcpW;
        this.y *= rcpW;
        this.z *= rcpW;
        this.w = 1.0;
    },

    abs: function()
    {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        this.z = Math.abs(this.z);
        this.w = Math.abs(this.w);
    },

    fromSphericalCoordinates: function(radius, azimuthalAngle, polarAngle)
    {
        this.x = radius*Math.sin(polarAngle)*Math.cos(azimuthalAngle);
        this.y = radius*Math.cos(polarAngle);
        this.z = radius*Math.sin(polarAngle)*Math.sin(azimuthalAngle);
        this.w = 0.0;
    },

    copyFrom: function(b)
    {
        this.x = b.x;
        this.y = b.y;
        this.z = b.z;
        this.w = b.w;
    },

    maximize: function(b)
    {
        if (b.x > this.x) this.x = b.x;
        if (b.y > this.y) this.y = b.y;
        if (b.z > this.z) this.z = b.z;
        if (b.w > this.w) this.w = b.w;
    },

    maximize3: function(b)
    {
        if (b.x > this.x) this.x = b.x;
        if (b.y > this.y) this.y = b.y;
        if (b.z > this.z) this.z = b.z;
    },

    minimize: function(b)
    {
        if (b.x < this.x) this.x = b.x;
        if (b.y < this.y) this.y = b.y;
        if (b.z < this.z) this.z = b.z;
        if (b.w < this.w) this.w = b.w;
    },

    minimize3: function(b)
    {
        if (b.x < this.x) this.x = b.x;
        if (b.y < this.y) this.y = b.y;
        if (b.z < this.z) this.z = b.z;
    },

    planeFromNormalAndPoint: function(normal, point)
    {
        var nx = normal.x, ny = normal.y, nz = normal.z;
        this.x = nx;
        this.y = ny;
        this.z = nz;
        this.w = -(point.x * nx + point.y * ny + point.z * nz);
    },

    toString: function()
    {
        return "Float4(" + this.x + ", " + this.y + ", " + this.z + ", " + this.w + ")";
    }
};

Float4.ORIGIN_POINT = new Float4(0, 0, 0, 1);
Float4.ZERO = new Float4(0, 0, 0, 0);
Float4.X_AXIS = new Float4(1, 0, 0, 0);
Float4.Y_AXIS = new Float4(0, 1, 0, 0);
Float4.Z_AXIS = new Float4(0, 0, 1, 0);

var RCP_LOG_OF_2 = 1.0 / Math.log(2);

var MathX = {
    DEG_TO_RAD: Math.PI / 180.0,
    RAD_TO_DEG: 180.0 / Math.PI,

    sign: function(v)
    {
        return  v === 0.0? 0.0 :
            v > 0.0? 1.0 : -1.0;
    },

    isPowerOfTwo: function(value)
    {
        return value? ((value & -value) === value) : false;
    },

    log2: function(value)
    {
        return Math.log(value) * RCP_LOG_OF_2;
    },

    clamp: function(value, min, max)
    {
        return  value < min?    min :
            value > max?    max :
                value;
    },

    saturate: function(value)
    {
        return MathX.clamp(value, 0.0, 1.0);
    },

    lerp: function(a, b, factor)
    {
        return a + (b - a) * factor;
    },

    linearStep: function(lower, upper, x)
    {
        return MathX.saturate((x - lower) / (upper - lower));
    }
};

function Quaternion()
{
    // x, y, z, w allowed to be accessed publicly for simplicity, changing this does not violate invariant. Ever.
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 1;
}

Quaternion.conjugate = function(q, target)
{
    target = target || new Quaternion();
    target.x = -q.x;
    target.y = -q.y;
    target.z = -q.z;
    target.w = q.w;
    return target;
};

Quaternion.invert = function (q, target)
{
    target = target || new Quaternion();
    var x = q.x, y = q.y, z = q.z, w = q.w;
    var rcpSqrNorm = 1.0 / (x*x + y*y + z*z + w*w);
    this.x = -x*rcpSqrNorm;
    this.y = -y*rcpSqrNorm;
    this.z = -z*rcpSqrNorm;
    this.w = w*rcpSqrNorm;
    return target;
};

Quaternion.lerp = function(a, b, factor, target)
{
    target = target || new Quaternion();
    var w1 = a.w, x1 = a.x, y1 = a.y, z1 = a.z;
    var w2 = b.w, x2 = b.x, y2 = b.y, z2 = b.z;

    // use shortest direction
    if (w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2 < 0) {
        w2 = -w2;
        x2 = -x2;
        y2 = -y2;
        z2 = -z2;
    }

    target.x = x1 + factor * (x2 - x1);
    target.y = y1 + factor * (y2 - y1);
    target.z = z1 + factor * (z2 - z1);
    target.w = w1 + factor * (w2 - w1);

    this.normalize();
};

Quaternion.slerp = function(a, b, factor, target)
{
    target = target || new Quaternion();
    var w1 = a.w, x1 = a.x, y1 = a.y, z1 = a.z;
    var w2 = b.w, x2 = b.x, y2 = b.y, z2 = b.z;
    var dot = w1*w2 + x1*x2 + y1*y2 + z1*z2;

    // shortest direction
    if (dot < 0.0) {
        dot = -dot;
        w2 = -w2;
        x2 = -x2;
        y2 = -y2;
        z2 = -z2;
    }

    if (dot < 0.95) {
        // interpolate angle linearly
        var angle = Math.acos(dot);
        var interpolatedAngle = factor*angle;

        target.x = x2 - x1*dot;
        target.y = y2 - y1*dot;
        target.z = z2 - z1*dot;
        target.w = w2 - w1*dot;
        target.normalize();

        var cos = Math.cos(interpolatedAngle);
        var sin = Math.sin(interpolatedAngle);
        target.x = x1 * cos + target.x * sin;
        target.y = y1 * cos + target.y * sin;
        target.z = z1 * cos + target.z * sin;
        target.w = w1 * cos + target.w * sin;
    }
    else {
        // nearly identical angle, interpolate linearly
        target.x = x1 + factor * (x2 - x1);
        target.y = y1 + factor * (y2 - y1);
        target.z = z1 + factor * (z2 - z1);
        target.w = w1 + factor * (w2 - w1);
        target.normalize();
    }

    return target;
};

Quaternion.prototype =
{
    fromAxisAngle: function (axis, radians)
    {
        var halfAngle = radians * .5;
        var factor = Math.sin(halfAngle) / axis.length;
        this.x = axis.x * factor;
        this.y = axis.y * factor;
        this.z = axis.z * factor;
        this.w = Math.cos(halfAngle);
    },

    // Tait-Bryan angles, not classic Euler, radians
    fromPitchYawRoll: function(pitch, yaw, roll)
    {
        var mtx = new Matrix4x4();
        // wasteful. improve.
        mtx.fromRotationPitchYawRoll(pitch, yaw, roll);
        this.fromMatrix(mtx);
    },

    // X*Y*Z order (meaning z first), radians
    fromEuler: function(x, y, z)
    {
        var cx = Math.cos(x * 0.5), cy = Math.cos(y * 0.5), cz = Math.cos(z * 0.5);
        var sx = Math.sin(x * 0.5), sy = Math.sin(y * 0.5), sz = Math.sin(z * 0.5);

        this.x = sx*cy*cz + cx*sy*sz;
        this.y = cx*sy*cz - sx*cy*sz;
        this.z = cx*cy*sz + sx*sy*cz;
        this.w = cx*cy*cz - sx*sy*sz;
    },

    toEuler: function(target)
    {
        target = target || new Float4();

        var x = this.x, y = this.y, z = this.z, w = this.w;
        var xx = x * x, yy = y * y, zz = z * z, ww = w * w;

        target.x = Math.atan2( -2*(y*z - w*x), ww - xx - yy + zz );
        target.y = Math.asin ( 2*(x*z + w*y) );
        target.z = Math.atan2( -2*(x*y - w*z), ww + xx - yy - zz );

        return target;
    },

    fromMatrix: function(m)
    {
        var m00 = m._m[0];
        var m11 = m._m[5];
        var m22 = m._m[10];
        var trace = m00 + m11 + m22;
        var s;

        if (trace > 0.0) {
            trace += 1.0;
            s = 1.0/Math.sqrt(trace)*.5;
            this.x = s*(m._m[6] - m._m[9]);
            this.y = s*(m._m[8] - m._m[2]);
            this.z = s*(m._m[1] - m._m[4]);
            this.w = s*trace;
        }
        else if (m00 > m11 && m00 > m22) {
            trace = m00 - m11 - m22 + 1.0;
            s = 1.0/Math.sqrt(trace)*.5;

            this.x = s*trace;
            this.y = s*(m._m[1] + m._m[4]);
            this.z = s*(m._m[8] + m._m[2]);
            this.w = s*(m._m[6] - m._m[9]);
        }
        else if (m11 > m22) {
            trace = m11 - m00 - m22 + 1.0;
            s = 1.0/Math.sqrt(trace)*.5;

            this.x = s*(m._m[1] + m._m[4]);
            this.y = s*trace;
            this.z = s*(m._m[6] + m._m[9]);
            this.w = s*(m._m[8] - m._m[2]);
        }
        else {
            trace = m22 - m00 - m11 + 1.0;
            s = 1.0/Math.sqrt(trace)*.5;

            this.x = s*(m._m[8] + m._m[2]);
            this.y = s*(m._m[6] + m._m[9]);
            this.z = s*trace;
            this.w = s*(m._m[1] - m._m[4]);
        }

        // this is to prevent non-normalized due to rounding errors
        this.normalize();
    },

    rotate: function(v, target)
    {
        target = target || new Float4();

        var vx = v.x, vy = v.y, vz = v.z;
        var x = this.x, y = this.y, z = this.z, w = this.w;

        // p*q'
        var w1 = - x * vx - y * vy - z * vz;
        var x1 = w * vx + y * vz - z * vy;
        var y1 = w * vy - x * vz + z * vx;
        var z1 = w * vz + x * vy - y * vx;

        target.x = -w1 * x + x1 * w - y1 * z + z1 * y;
        target.y = -w1 * y + x1 * z + y1 * w - z1 * x;
        target.z = -w1 * z - x1 * y + y1 * x + z1 * w;
        target.w = v.w;
        return target;
    },

    // results in the same net rotation, but with different orientation
    negate: function()
    {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        this.w = -this.w;
    },

    set: function(x, y, z, w)
    {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    },

    copyFrom: function(b)
    {
        this.x = b.x;
        this.y = b.y;
        this.z = b.z;
        this.w = b.w;
    },

    get normSquared()
    {
        return this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w;
    },

    get norm()
    {
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w);
    },

    normalize : function()
    {
        var rcpNorm = 1.0/Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w);
        this.x *= rcpNorm;
        this.y *= rcpNorm;
        this.z *= rcpNorm;
        this.w *= rcpNorm;
    },

    invert: function ()
    {
        var x = this.x, y = this.y, z = this.z, w = this.w;
        var rcpSqrNorm = 1.0 / (x*x + y*y + z*z + w*w);
        this.x = -x*rcpSqrNorm;
        this.y = -y*rcpSqrNorm;
        this.z = -z*rcpSqrNorm;
        this.w = w*rcpSqrNorm;
    },

    multiply: function(a, b)
    {
        var w1 = a.w, x1 = a.x, y1 = a.y, z1 = a.z;
        var w2 = b.w, x2 = b.x, y2 = b.y, z2 = b.z;

        this.x = w1*x2 + x1*w2 + y1*z2 - z1*y2;
        this.y = w1*y2 - x1*z2 + y1*w2 + z1*x2;
        this.z = w1*z2 + x1*y2 - y1*x2 + z1*w2;
        this.w = w1*w2 - x1*x2 - y1*y2 - z1*z2;
    },

    append: function(q)
    {
        this.multiply(q, this);
    },

    prepend: function(q)
    {
        this.multiply(this, q);
    },

    toString: function()
    {
        return "Quaternion(" + this.x + ", " + this.y + ", " + this.z + ", " + this.w + ")";
    }
};

function Signal()
{
    this._listeners = [];
    this._lookUp = {};
}

/**
 * Signals keep "this" of the caller, because having this refer to the signal itself would be silly
 */
Signal.prototype =
{
    bind: function(listener, thisRef)
    {
        this._lookUp[listener] = this._listeners.length;
        var callback = thisRef? listener.bind(thisRef) : listener;
        this._listeners.push(callback);
    },

    unbind: function(listener)
    {
        var index = this._lookUp[listener];
        this._listeners.splice(index, 1);
        delete this._lookUp[listener];
    },

    dispatch: function(payload)
    {
        var len = this._listeners.length;
        for (var i = 0; i < len; ++i)
            this._listeners[i](payload);
    },

    get hasListeners()
    {
        return this._listeners.length > 0;
    }
};

/**
 * PropertyListener allows listening to changes to other objects' properties. When a change occurs, the onChange signal will be dispatched.
 * It's a bit hackish, but it prevents having to dispatch signals in performance-critical classes such as Float4.
 * @constructor
 */
function PropertyListener()
{
    this._enabled = true;
    this.onChange = new Signal();
    this._targets = [];
}

PropertyListener.prototype =
{
    /**
     * If false, prevents the PropertyListener from dispatching change events.
     */
    get enabled()
    {
        return this._enabled;
    },

    set enabled(value)
    {
        this._enabled = value;
    },

    /**
     * Starts listening to changes for an object's property for changes.
     * @param targetObj The target object to monitor.
     * @param propertyName The name of the property for which we'll be listening.
     */
    add: function(targetObj, propertyName)
    {
        var index = this._targets.length;
        this._targets.push(
            {
                object: targetObj,
                propertyName: propertyName,
                value: targetObj[propertyName]
            }
        );

        var wrapper = this;
        var target = wrapper._targets[index];
        Object.defineProperty(targetObj, propertyName, {
            get: function() {
                return target.value;
            },
            set: function(val) {
                if (val !== target.value) {
                    target.value = val;
                    if (wrapper._enabled)
                        wrapper.onChange.dispatch();
                }
            }
        });
    },

    /**
     * Stops listening to a property for changes.
     * @param targetObj The object to stop monitoring.
     * @param propertyName The name of the property for which we'll be listening.
     */
    remove: function(targetObj, propertyName)
    {
        for (var i = 0; i < this._targets.length; ++i) {
            var target = this._targets[i];
            if (target.object === targetObj && target.propertyName === propertyName) {
                delete target.object[target.propertyName];
                target.object[target.propertyName] = target.value;
                this._targets.splice(i--, 1);
            }
        }
    }
};

/**
 * An object using position, rotation quaternion and scale to describe an object's transformation.
 *
 * @constructor
 */
function Transform()
{
    this._position = new Float4(0.0, 0.0, 0.0, 1.0);
    this._rotation = new Quaternion();
    this._scale = new Float4(1.0, 1.0, 1.0, 1.0);
    this._matrix = new Matrix4x4();

    this._changeListener = new PropertyListener();
    this._changeListener.add(this._position, "x");
    this._changeListener.add(this._position, "y");
    this._changeListener.add(this._position, "z");
    this._changeListener.add(this._rotation, "x");
    this._changeListener.add(this._rotation, "y");
    this._changeListener.add(this._rotation, "z");
    this._changeListener.add(this._rotation, "w");
    this._changeListener.add(this._scale, "x");
    this._changeListener.add(this._scale, "y");
    this._changeListener.add(this._scale, "z");
    this._changeListener.onChange.bind(this._invalidateMatrix, this);
}

Transform.prototype =
{
    get position() {
        return this._position;
    },

    set position(value) {
        // make sure position object never changes
        this._position.copyFrom(value);
    },

    get rotation() {
        return this._rotation;
    },

    set rotation(value) {
        // make sure position object never changes
        this._rotation.copyFrom(value);
    },

    get scale() {
        return this._scale;
    },

    set scale(value) {
        // make sure position object never changes
        this._scale.copyFrom(value);
    },

    lookAt: function(target)
    {
        this._matrix.lookAt(target, this._position, Float4.Y_AXIS);
        this._applyMatrix();
    },

    copyFrom: function(transform)
    {
        this._changeListener.enabled = false;
        this.position.copyFrom(transform.position);
        this.rotation.copyFrom(transform.rotation);
        this.scale.copyFrom(transform.scale);
        this._changeListener.enabled = true;
    },

    get matrix()
    {
        if (this._matrixInvalid)
            this._updateMatrix();

        return this._matrix;
    },

    set matrix(value)
    {
        this._matrix.copyFrom(value);
        this._applyMatrix();
    },

    _invalidateMatrix: function ()
    {
        this._matrixInvalid = true;
    },

    _updateMatrix: function()
    {
        this._matrix.compose(this);
        this._matrixInvalid = false;
    },

    _applyMatrix: function()
    {
        this._matrixInvalid = false;
        // matrix decompose will trigger property updates, so disable this
        this._changeListener.enabled = false;
        this._matrix.decompose(this);
        this._changeListener.enabled = true;
    }
};

/**
 * Creates a new Matrix4x4 object.
 * Column-major storage. Vector multiplication is in column format (ie v' = M x v)
 * @class
 * @constructor
 */
function Matrix4x4(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33)
{
    if (m00 !== undefined && isNaN(m00)) {
        this._m = new Float32Array(m00);
    }
    else {
        var m = this._m = new Float32Array(16);

        m[0] = m00 === undefined ? 1 : 0;
        m[1] = m10 || 0;
        m[2] = m20 || 0;
        m[3] = m30 || 0;
        m[4] = m01 || 0;
        m[5] = m11 === undefined ? 1 : 0;
        m[6] = m21 || 0;
        m[7] = m31 || 0;
        m[8] = m02 || 0;
        m[9] = m12 || 0;
        m[10] = m22 === undefined ? 1 : 0;
        m[11] = m32 || 0;
        m[12] = m03 || 0;
        m[13] = m13 || 0;
        m[14] = m23 || 0;
        m[15] = m33 === undefined ? 1 : 0;
    }
}

Matrix4x4.prototype =
{
    /**
     * Transforms a Float4 object (use for homogeneous general case of Float4, perspective or when "type" (w) of Float4 is unknown)
     */
    transform: function (v, target)
    {
        target = target || new Float4();
        var x = v.x, y = v.y, z = v.z, w = v.w;
        var m = this._m;

        target.x = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
        target.y = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
        target.z = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
        target.w = m[3] * x + m[7] * y + m[11] * z + m[15] * w;

        return target;
    },

    /**
     * Transforms a Float4 object, treating it as a point. Slightly faster than transform for points.
     */
    transformPoint: function (v, target)
    {
        target = target || new Float4();
        var x = v.x, y = v.y, z = v.z;
        var m = this._m;

        target.x = m[0] * x + m[4] * y + m[8] * z + m[12];
        target.y = m[1] * x + m[5] * y + m[9] * z + m[13];
        target.z = m[2] * x + m[6] * y + m[10] * z + m[14];
        target.w = 1.0;

        return target;
    },

    /**
     * Transforms a Float4 object, treating it as a vector (ie: disregarding translation). Slightly faster than transform for vectors.
     */
    transformVector: function (v, target)
    {
        target = target || new Float4();
        var x = v.x, y = v.y, z = v.z;

        var m = this._m;
        target.x = m[0] * x + m[4] * y + m[8] * z;
        target.y = m[1] * x + m[5] * y + m[9] * z;
        target.z = m[2] * x + m[6] * y + m[10] * z;
        target.w = 0.0;

        return target;
    },

    /**
     * Transforms a Float4 object, treating it as a vector (ie: disregarding translation) containing a size (so always abs)! Slightly faster than transform for vectors.
     */
    transformExtent: function (v, target)
    {
        target = target || new Float4();
        var x = v.x, y = v.y, z = v.z;

        var m = this._m;
        var m00 = m[0], m10 = m[1], m20 = m[2];
        var m01 = m[4], m11 = m[5], m21 = m[6];
        var m02 = m[8], m12 = m[9], m22 = m[10];

        if (m00 < 0) m00 = -m00; if (m10 < 0) m10 = -m10; if (m20 < 0) m20 = -m20;
        if (m01 < 0) m01 = -m01; if (m11 < 0) m11 = -m11; if (m21 < 0) m21 = -m21;
        if (m02 < 0) m02 = -m02; if (m12 < 0) m12 = -m12; if (m22 < 0) m22 = -m22;

        target.x = m00 * x + m01 * y + m02 * z;
        target.y = m10 * x + m11 * y + m12 * z;
        target.z = m20 * x + m21 * y + m22 * z;
        target.w = 0.0;

        return target;
    },

    copyFrom: function(a)
    {
        var m = this._m;
        var mm = a._m;
        m[0] = mm[0];
        m[1] = mm[1];
        m[2] = mm[2];
        m[3] = mm[3];
        m[4] = mm[4];
        m[5] = mm[5];
        m[6] = mm[6];
        m[7] = mm[7];
        m[8] = mm[8];
        m[9] = mm[9];
        m[10] = mm[10];
        m[11] = mm[11];
        m[12] = mm[12];
        m[13] = mm[13];
        m[14] = mm[14];
        m[15] = mm[15];
    },

    fromQuaternion: function (q)
    {
        var x = q.x, y = q.y, z = q.z, w = q.w;

        var m = this._m;
        m[0] = 1 - 2 * (y * y + z * z);
        m[1] = 2 * (x * y + w * z);
        m[2] = 2 * (x * z - w * y);
        m[3] = 0;
        m[4] = 2 * (x * y - w * z);
        m[5] = 1 - 2 * (x * x + z * z);
        m[6] = 2 * (y * z + w * x);
        m[7] = 0;
        m[8] = 2 * (x * z + w * y);
        m[9] = 2 * (y * z - w * x);
        m[10] = 1 - 2 * (x * x + y * y);
        m[11] = 0;
        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;
    },

    multiply: function (a, b)
    {
        var am = a._m, bm = b._m;
        var a_m00 = am[0], a_m10 = am[1], a_m20 = am[2], a_m30 = am[3];
        var a_m01 = am[4], a_m11 = am[5], a_m21 = am[6], a_m31 = am[7];
        var a_m02 = am[8], a_m12 = am[9], a_m22 = am[10], a_m32 = am[11];
        var a_m03 = am[12], a_m13 = am[13], a_m23 = am[14], a_m33 = am[15];
        var b_m00 = bm[0], b_m10 = bm[1], b_m20 = bm[2], b_m30 = bm[3];
        var b_m01 = bm[4], b_m11 = bm[5], b_m21 = bm[6], b_m31 = bm[7];
        var b_m02 = bm[8], b_m12 = bm[9], b_m22 = bm[10], b_m32 = bm[11];
        var b_m03 = bm[12], b_m13 = bm[13], b_m23 = bm[14], b_m33 = bm[15];

        var m = this._m;
        m[0] = a_m00 * b_m00 + a_m01 * b_m10 + a_m02 * b_m20 + a_m03 * b_m30;
        m[1] = a_m10 * b_m00 + a_m11 * b_m10 + a_m12 * b_m20 + a_m13 * b_m30;
        m[2] = a_m20 * b_m00 + a_m21 * b_m10 + a_m22 * b_m20 + a_m23 * b_m30;
        m[3] = a_m30 * b_m00 + a_m31 * b_m10 + a_m32 * b_m20 + a_m33 * b_m30;
        m[4] = a_m00 * b_m01 + a_m01 * b_m11 + a_m02 * b_m21 + a_m03 * b_m31;
        m[5] = a_m10 * b_m01 + a_m11 * b_m11 + a_m12 * b_m21 + a_m13 * b_m31;
        m[6] = a_m20 * b_m01 + a_m21 * b_m11 + a_m22 * b_m21 + a_m23 * b_m31;
        m[7] = a_m30 * b_m01 + a_m31 * b_m11 + a_m32 * b_m21 + a_m33 * b_m31;
        m[8] = a_m00 * b_m02 + a_m01 * b_m12 + a_m02 * b_m22 + a_m03 * b_m32;
        m[9] = a_m10 * b_m02 + a_m11 * b_m12 + a_m12 * b_m22 + a_m13 * b_m32;
        m[10] = a_m20 * b_m02 + a_m21 * b_m12 + a_m22 * b_m22 + a_m23 * b_m32;
        m[11] = a_m30 * b_m02 + a_m31 * b_m12 + a_m32 * b_m22 + a_m33 * b_m32;
        m[12] = a_m00 * b_m03 + a_m01 * b_m13 + a_m02 * b_m23 + a_m03 * b_m33;
        m[13] = a_m10 * b_m03 + a_m11 * b_m13 + a_m12 * b_m23 + a_m13 * b_m33;
        m[14] = a_m20 * b_m03 + a_m21 * b_m13 + a_m22 * b_m23 + a_m23 * b_m33;
        m[15] = a_m30 * b_m03 + a_m31 * b_m13 + a_m32 * b_m23 + a_m33 * b_m33;
    },

    multiplyAffine: function (a, b)
    {
        var am = a._m, bm = b._m;
        var a_m00 = am[0], a_m10 = am[1], a_m20 = am[2];
        var a_m01 = am[4], a_m11 = am[5], a_m21 = am[6];
        var a_m02 = am[8], a_m12 = am[9], a_m22 = am[10];
        var a_m03 = am[12], a_m13 = am[13], a_m23 = am[14];
        var b_m00 = bm[0], b_m10 = bm[1], b_m20 = bm[2];
        var b_m01 = bm[4], b_m11 = bm[5], b_m21 = bm[6];
        var b_m02 = bm[8], b_m12 = bm[9], b_m22 = bm[10];
        var b_m03 = bm[12], b_m13 = bm[13], b_m23 = bm[14];

        var m = this._m;
        m[0] = a_m00 * b_m00 + a_m01 * b_m10 + a_m02 * b_m20;
        m[1] = a_m10 * b_m00 + a_m11 * b_m10 + a_m12 * b_m20;
        m[2] = a_m20 * b_m00 + a_m21 * b_m10 + a_m22 * b_m20;

        m[4] = a_m00 * b_m01 + a_m01 * b_m11 + a_m02 * b_m21;
        m[5] = a_m10 * b_m01 + a_m11 * b_m11 + a_m12 * b_m21;
        m[6] = a_m20 * b_m01 + a_m21 * b_m11 + a_m22 * b_m21;

        m[8] = a_m00 * b_m02 + a_m01 * b_m12 + a_m02 * b_m22;
        m[9] = a_m10 * b_m02 + a_m11 * b_m12 + a_m12 * b_m22;
        m[10] = a_m20 * b_m02 + a_m21 * b_m12 + a_m22 * b_m22;

        m[12] = a_m00 * b_m03 + a_m01 * b_m13 + a_m02 * b_m23 + a_m03;
        m[13] = a_m10 * b_m03 + a_m11 * b_m13 + a_m12 * b_m23 + a_m13;
        m[14] = a_m20 * b_m03 + a_m21 * b_m13 + a_m22 * b_m23 + a_m23;

    },

    fromRotationAxisAngle: function (axis, radians)
    {
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);
        var rcpLen = 1 / axis.length;


        var x = axis.x * rcpLen, y = axis.y * rcpLen, z = axis.z * rcpLen;
        var oneMinCos = 1 - cos;

        var m = this._m;
        m[0] = oneMinCos * x * x + cos;
        m[1] = oneMinCos * x * y + sin * z;
        m[2] = oneMinCos * x * z - sin * y;
        m[3] = 0;
        m[4] = oneMinCos * x * y - sin * z;
        m[5] = oneMinCos * y * y + cos;
        m[6] = oneMinCos * y * z + sin * x;
        m[7] = 0;
        m[8] = oneMinCos * x * z + sin * y;
        m[9] = oneMinCos * y * z - sin * x;
        m[10] = oneMinCos * z * z + cos;
        m[11] = 0;
        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;
    },

    // this actually doesn't use a vector, because they're three unrelated quantities. A vector just doesn't make sense here, mathematically.
    fromEuler: function (x, y, z)
    {
        var cosX = Math.cos(x);
        var sinX = Math.sin(x);
        var cosY = Math.cos(y);
        var sinY = Math.sin(y);
        var cosZ = Math.cos(z);
        var sinZ = Math.sin(z);

        var m = this._m;
        m[0] = cosY * cosZ;
        m[1] = cosX * sinZ + sinX * sinY * cosZ;
        m[2] = sinX * sinZ - cosX * sinY * cosZ;
        m[3] = 0;
        m[4] = -cosY * sinZ;
        m[5] = cosX * cosZ - sinX * sinY * sinZ;
        m[6] = sinX * cosZ + cosX * sinY * sinZ;
        m[7] = 0;
        m[8] = sinY;
        m[9] = -sinX * cosY;
        m[10] = cosX * cosY;
        m[11] = 0;
        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;
    },

    // Tait-Bryan angles, not classic Euler
    fromRotationPitchYawRoll: function (pitch, yaw, roll)
    {
        var cosP = Math.cos(-pitch);
        var cosY = Math.cos(-yaw);
        var cosR = Math.cos(roll);
        var sinP = Math.sin(-pitch);
        var sinY = Math.sin(-yaw);
        var sinR = Math.sin(roll);

        var zAxisX = -sinY * cosP;
        var zAxisY = -sinP;
        var zAxisZ = cosY * cosP;

        var yAxisX = -cosY * sinR - sinY * sinP * cosR;
        var yAxisY = cosP * cosR;
        var yAxisZ = -sinY * sinR + sinP * cosR * cosY;

        var xAxisX = yAxisY * zAxisZ - yAxisZ * zAxisY;
        var xAxisY = yAxisZ * zAxisX - yAxisX * zAxisZ;
        var xAxisZ = yAxisX * zAxisY - yAxisY * zAxisX;

        var m = this._m;
        m[0] = xAxisX;
        m[1] = xAxisY;
        m[2] = xAxisZ;
        m[3] = 0;
        m[4] = yAxisX;
        m[5] = yAxisY;
        m[6] = yAxisZ;
        m[7] = 0;
        m[8] = zAxisX;
        m[9] = zAxisY;
        m[10] = zAxisZ;
        m[11] = 0;
        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;
    },

    fromTranslation: function (xOrV, y, z)
    {
        if (y === undefined) {
            xOrV = xOrV.x;
            y = xOrV.y;
            z = xOrV.z;
        }
        var m = this._m;
        m[0] = 1;
        m[1] = 0;
        m[2] = 0;
        m[3] = 0;
        m[4] = 0;
        m[5] = 1;
        m[6] = 0;
        m[7] = 0;
        m[8] = 0;
        m[9] = 0;
        m[10] = 1;
        m[11] = 0;
        m[12] = xOrV;
        m[13] = y;
        m[14] = z;
        m[15] = 1;
    },

    fromScale: function (x, y, z)
    {
        if (y === undefined)
            y = z = x;

        var m = this._m;
        m[0] = x;
        m[1] = 0;
        m[2] = 0;
        m[3] = 0;
        m[4] = 0;
        m[5] = y;
        m[6] = 0;
        m[7] = 0;
        m[8] = 0;
        m[9] = 0;
        m[10] = z;
        m[11] = 0;
        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;
    },

    fromPerspectiveProjection: function (vFOV, aspectRatio, nearDistance, farDistance)
    {
        var yMax = 1.0 / Math.tan(vFOV * .5);
        var xMax = yMax / aspectRatio;
        var rcpFrustumDepth = 1.0 / (nearDistance - farDistance);

        var m = this._m;
        m[0] = xMax;
        m[1] = 0;
        m[2] = 0;
        m[3] = 0;

        m[4] = 0;
        m[5] = yMax;
        m[6] = 0;
        m[7] = 0;

        m[8] = 0;
        m[9] = 0;
        m[10] = (farDistance + nearDistance) * rcpFrustumDepth;
        m[11] = -1;

        m[12] = 0;
        m[13] = 0;
        m[14] = 2 * nearDistance * farDistance * rcpFrustumDepth;
        m[15] = 0;
    },

    fromOrthographicOffCenterProjection: function (left, right, top, bottom, nearDistance, farDistance)
    {
        var rcpWidth = 1.0 / (right - left);
        var rcpHeight = 1.0 / (top - bottom);
        var rcpDepth = 1.0 / (nearDistance - farDistance);

        var m = this._m;
        m[0] = 2.0 * rcpWidth;
        m[1] = 0;
        m[2] = 0;
        m[3] = 0;

        m[4] = 0;
        m[5] = 2.0 * rcpHeight;
        m[6] = 0;
        m[7] = 0;

        m[8] = 0;
        m[9] = 0;
        m[10] = 2.0 * rcpDepth;
        m[11] = 0;

        m[12] = -(left + right) * rcpWidth;
        m[13] = -(top + bottom) * rcpHeight;
        m[14] = (farDistance + nearDistance) * rcpDepth;
        m[15] = 1;
    },

    fromOrthographicProjection: function (width, height, nearDistance, farDistance)
    {
        var rcpWidth = 1.0 / width;
        var rcpHeight = 1.0 / height;
        var rcpDepth = 1.0 / (nearDistance - farDistance);

        var m = this._m;
        m[0] = 2.0 * rcpWidth;
        m[1] = 0;
        m[2] = 0;
        m[3] = 0;

        m[4] = 0;
        m[5] = 2.0 * rcpHeight;
        m[6] = 0;
        m[7] = 0;

        m[8] = 0;
        m[9] = 0;
        m[10] = 2.0 * rcpDepth;
        m[11] = 0;

        m[12] = 0.0;
        m[13] = 0.0;
        m[14] = (farDistance + nearDistance) * rcpDepth;
        m[15] = 1;
    },

    clone: function ()
    {
        return new Matrix4x4(this._m);
    },

    transpose: function ()
    {
        var m = this._m;
        var m1 = m[1];
        var m2 = m[2];
        var m3 = m[3];
        var m6 = m[6];
        var m7 = m[7];
        var m11 = m[11];

        m[1] = m[4];
        m[2] = m[8];
        m[3] = m[12];

        m[4] = m1;
        m[6] = m[9];
        m[7] = m[13];

        m[8] = m2;
        m[9] = m6;
        m[11] = m[14];

        m[12] = m3;
        m[13] = m7;
        m[14] = m11;
    },

    /**
     * The determinant of a 3x3 minor matrix (matrix created by removing a given row and column)
     * @private
     */
    determinant3x3: function (row, col)
    {
        // columns are the indices * 4 (to form index for row 0)
        var c1 = col === 0 ? 4 : 0;
        var c2 = col < 2 ? 8 : 4;
        var c3 = col === 3 ? 8 : 12;
        var r1 = row === 0 ? 1 : 0;
        var r2 = row < 2 ? 2 : 1;
        var r3 = row === 3 ? 2 : 3;

        var m = this._m;
        var m21 = m[c1 | r2], m22 = m[r2 | c2], m23 = m[c3 | r2];
        var m31 = m[c1 | r3], m32 = m[c2 | r3], m33 = m[r3 | c3];

        return      m[c1 | r1] * (m22 * m33 - m23 * m32)
            - m[c2 | r1] * (m21 * m33 - m23 * m31)
            + m[c3 | r1] * (m21 * m32 - m22 * m31);
    },

    cofactor: function (row, col)
    {
        // should be able to xor sign bit instead
        var sign = 1 - (((row + col) & 1) << 1);
        return sign * this.determinant3x3(row, col);
    },

    getCofactorMatrix: function (row, col, target)
    {
        target = target || new Matrix4x4();

        var tm = target._m;
        for (var i = 0; i < 16; ++i)
            tm[i] = this.cofactor(i & 3, i >> 2);

        return target;
    },

    getAdjugate: function (row, col, target)
    {
        target = target || new Matrix4x4();

        var tm = target._m;
        for (var i = 0; i < 16; ++i)
            tm[i] = this.cofactor(i >> 2, i & 3);    // transposed!

        return target;
    },

    determinant: function ()
    {
        var m = this._m;
        return m[0] * this.determinant3x3(0, 0) - m[4] * this.determinant3x3(0, 1) + m[8] * this.determinant3x3(0, 2) - m[12] * this.determinant3x3(0, 3);
    },

    inverseOf: function (matrix)
    {
        // this can be much more efficient, but I'd like to keep it readable for now. The full inverse is not required often anyway.
        var rcpDet = 1.0 / matrix.determinant();

        // needs to be self-assignment-proof
        var m0 = rcpDet * matrix.cofactor(0, 0);
        var m1 = rcpDet * matrix.cofactor(0, 1);
        var m2 = rcpDet * matrix.cofactor(0, 2);
        var m3 = rcpDet * matrix.cofactor(0, 3);
        var m4 = rcpDet * matrix.cofactor(1, 0);
        var m5 = rcpDet * matrix.cofactor(1, 1);
        var m6 = rcpDet * matrix.cofactor(1, 2);
        var m7 = rcpDet * matrix.cofactor(1, 3);
        var m8 = rcpDet * matrix.cofactor(2, 0);
        var m9 = rcpDet * matrix.cofactor(2, 1);
        var m10 = rcpDet * matrix.cofactor(2, 2);
        var m11 = rcpDet * matrix.cofactor(2, 3);
        var m12 = rcpDet * matrix.cofactor(3, 0);
        var m13 = rcpDet * matrix.cofactor(3, 1);
        var m14 = rcpDet * matrix.cofactor(3, 2);
        var m15 = rcpDet * matrix.cofactor(3, 3);

        var m = this._m;
        m[0] = m0;
        m[1] = m1;
        m[2] = m2;
        m[3] = m3;
        m[4] = m4;
        m[5] = m5;
        m[6] = m6;
        m[7] = m7;
        m[8] = m8;
        m[9] = m9;
        m[10] = m10;
        m[11] = m11;
        m[12] = m12;
        m[13] = m13;
        m[14] = m14;
        m[15] = m15;
    },

    /**
     * If you know it's an affine matrix (such as general transforms rather than perspective projection matrices), use this.
     * @param m
     */
    inverseAffineOf: function (a)
    {
        var mm = a._m;
        var m0 = mm[0], m1 = mm[1], m2 = mm[2];
        var m4 = mm[4], m5 = mm[5], m6 = mm[6];
        var m8 = mm[8], m9 = mm[9], m10 = mm[10];
        var m12 = mm[12], m13 = mm[13], m14 = mm[14];
        var determinant = m0 * (m5 * m10 - m9 * m6) - m4 * (m1 * m10 - m9 * m2) + m8 * (m1 * m6 - m5 * m2);
        var rcpDet = 1.0 / determinant;

        var n0 = (m5 * m10 - m9 * m6) * rcpDet;
        var n1 = (m9 * m2 - m1 * m10) * rcpDet;
        var n2 = (m1 * m6 - m5 * m2) * rcpDet;
        var n4 = (m8 * m6 - m4 * m10) * rcpDet;
        var n5 = (m0 * m10 - m8 * m2) * rcpDet;
        var n6 = (m4 * m2 - m0 * m6) * rcpDet;
        var n8 = (m4 * m9 - m8 * m5) * rcpDet;
        var n9 = (m8 * m1 - m0 * m9) * rcpDet;
        var n10 = (m0 * m5 - m4 * m1) * rcpDet;

        var m = this._m;
        m[0] = n0;
        m[1] = n1;
        m[2] = n2;
        m[3] = 0;
        m[4] = n4;
        m[5] = n5;
        m[6] = n6;
        m[7] = 0;
        m[8] = n8;
        m[9] = n9;
        m[10] = n10;
        m[11] = 0;
        m[12] = -n0 * m12 - n4 * m13 - n8 * m14;
        m[13] = -n1 * m12 - n5 * m13 - n9 * m14;
        m[14] = -n2 * m12 - n6 * m13 - n10 * m14;
        m[15] = 1;
    },

    /**
     * Writes the inverse transpose into an array for upload (must support 9 elements)
     */
    writeNormalMatrix: function (array, index)
    {
        index = index || 0;
        var m = this._m;
        var m0 = m[0], m1 = m[1], m2 = m[2];
        var m4 = m[4], m5 = m[5], m6 = m[6];
        var m8 = m[8], m9 = m[9], m10 = m[10];

        var determinant = m0 * (m5 * m10 - m9 * m6) - m4 * (m1 * m10 - m9 * m2) + m8 * (m1 * m6 - m5 * m2);
        var rcpDet = 1.0 / determinant;

        array[index] = (m5 * m10 - m9 * m6) * rcpDet;
        array[index + 1] = (m8 * m6 - m4 * m10) * rcpDet;
        array[index + 2] = (m4 * m9 - m8 * m5) * rcpDet;
        array[index + 3] = (m9 * m2 - m1 * m10) * rcpDet;
        array[index + 4] = (m0 * m10 - m8 * m2) * rcpDet;
        array[index + 5] = (m8 * m1 - m0 * m9) * rcpDet;
        array[index + 6] = (m1 * m6 - m5 * m2) * rcpDet;
        array[index + 7] = (m4 * m2 - m0 * m6) * rcpDet;
        array[index + 8] = (m0 * m5 - m4 * m1) * rcpDet;
    },

    writeData: function(array, index)
    {
        index = index || 0;
        var m = this._m;
        for (var i = 0; i < 16; ++i)
            array[index + i] = m[i];
    },

    writeData4x3: function(array, index)
    {
        var m = this._m;
        index = index || 0;
        array[index] = m[0];
        array[index + 1] = m[4];
        array[index + 2] = m[8];
        array[index + 3] = m[12];
        array[index + 4] = m[1];
        array[index + 5] = m[5];
        array[index + 6] = m[9];
        array[index + 7] = m[13];
        array[index + 8] = m[2];
        array[index + 9] = m[6];
        array[index + 10] = m[10];
        array[index + 11] = m[14];
    },

    invert: function ()
    {
        this.inverseOf(this);
    },

    invertAffine: function ()
    {
        this.inverseAffineOf(this);
    },

    append: function (m)
    {
        this.multiply(m, this);
    },

    prepend: function (m)
    {
        this.multiply(this, m);
    },

    appendAffine: function (m)
    {
        this.multiplyAffine(m, this);
    },

    prependAffine: function (m)
    {
        this.multiplyAffine(this, m);
    },

    add: function (a)
    {
        var m = this._m;
        var mm = a._m;
        m[0] += mm[0];
        m[1] += mm[1];
        m[2] += mm[2];
        m[3] += mm[3];
        m[4] += mm[4];
        m[5] += mm[5];
        m[6] += mm[6];
        m[7] += mm[7];
        m[8] += mm[8];
        m[9] += mm[9];
        m[10] += mm[10];
        m[11] += mm[11];
        m[12] += mm[12];
        m[13] += mm[13];
        m[14] += mm[14];
        m[15] += mm[15];
    },

    addAffine: function (a)
    {
        var m = this._m;
        var mm = a._m;
        m[0] += mm[0];
        m[1] += mm[1];
        m[2] += mm[2];
        m[4] += mm[4];
        m[5] += mm[5];
        m[6] += mm[6];
        m[8] += mm[8];
        m[9] += mm[9];
        m[10] += mm[10];
    },

    subtract: function (a)
    {
        var m = this._m;
        var mm = a._m;
        m[0] -= mm[0];
        m[1] -= mm[1];
        m[2] -= mm[2];
        m[3] -= mm[3];
        m[4] -= mm[4];
        m[5] -= mm[5];
        m[6] -= mm[6];
        m[7] -= mm[7];
        m[8] -= mm[8];
        m[9] -= mm[9];
        m[10] -= mm[10];
        m[11] -= mm[11];
        m[12] -= mm[12];
        m[13] -= mm[13];
        m[14] -= mm[14];
        m[15] -= mm[15];
    },

    subtractAffine: function (a)
    {
        var m = this._m;
        var mm = a._m;
        m[0] -= mm[0];
        m[1] -= mm[1];
        m[2] -= mm[2];
        m[4] -= mm[4];
        m[5] -= mm[5];
        m[6] -= mm[6];
        m[8] -= mm[8];
        m[9] -= mm[9];
        m[10] -= mm[10];
    },

    appendScale: function (x, y, z)
    {
        if (y === undefined)
            y = z = x;

        var m = this._m;
        m[0] *= x;
        m[1] *= y;
        m[2] *= z;
        m[4] *= x;
        m[5] *= y;
        m[6] *= z;
        m[8] *= x;
        m[9] *= y;
        m[10] *= z;
        m[12] *= x;
        m[13] *= y;
        m[14] *= z;
    },

    prependScale: function (x, y, z)
    {
        if (y === undefined)
            y = z = x;

        var m = this._m;
        m[0] *= x;
        m[1] *= x;
        m[2] *= x;
        m[3] *= x;
        m[4] *= y;
        m[5] *= y;
        m[6] *= y;
        m[7] *= y;
        m[8] *= z;
        m[9] *= z;
        m[10] *= z;
        m[11] *= z;
    },

    appendTranslation: function (v)
    {
        var m = this._m;
        m[12] += v.x;
        m[13] += v.y;
        m[14] += v.z;
    },

    prependTranslation: function (v)
    {
        var m = this._m;
        var x = v.x, y = v.y, z = v.z;
        m[12] += m[0] * x + m[4] * y + m[8] * z;
        m[13] += m[1] * x + m[5] * y + m[9] * z;
        m[14] += m[2] * x + m[6] * y + m[10] * z;
        m[15] += m[3] * x + m[7] * y + m[11] * z;
    },

    appendQuaternion: function (q)
    {
        var m = this._m;
        var x = q.x, y = q.y, z = q.z, w = q.w;
        var a_m00 = 1 - 2 * (y * y + z * z), a_m10 = 2 * (x * y + w * z), a_m20 = 2 * (x * z - w * y);
        var a_m01 = 2 * (x * y - w * z), a_m11 = 1 - 2 * (x * x + z * z), a_m21 = 2 * (y * z + w * x);
        var a_m02 = 2 * (x * z + w * y), a_m12 = 2 * (y * z - w * x), a_m22 = 1 - 2 * (x * x + y * y);

        var b_m00 = m[0], b_m10 = m[1], b_m20 = m[2];
        var b_m01 = m[4], b_m11 = m[5], b_m21 = m[6];
        var b_m02 = m[8], b_m12 = m[9], b_m22 = m[10];
        var b_m03 = m[12], b_m13 = m[13], b_m23 = m[14];

        m[0] = a_m00 * b_m00 + a_m01 * b_m10 + a_m02 * b_m20;
        m[1] = a_m10 * b_m00 + a_m11 * b_m10 + a_m12 * b_m20;
        m[2] = a_m20 * b_m00 + a_m21 * b_m10 + a_m22 * b_m20;

        m[4] = a_m00 * b_m01 + a_m01 * b_m11 + a_m02 * b_m21;
        m[5] = a_m10 * b_m01 + a_m11 * b_m11 + a_m12 * b_m21;
        m[6] = a_m20 * b_m01 + a_m21 * b_m11 + a_m22 * b_m21;

        m[8] = a_m00 * b_m02 + a_m01 * b_m12 + a_m02 * b_m22;
        m[9] = a_m10 * b_m02 + a_m11 * b_m12 + a_m12 * b_m22;
        m[10] = a_m20 * b_m02 + a_m21 * b_m12 + a_m22 * b_m22;

        m[12] = a_m00 * b_m03 + a_m01 * b_m13 + a_m02 * b_m23;
        m[13] = a_m10 * b_m03 + a_m11 * b_m13 + a_m12 * b_m23;
        m[14] = a_m20 * b_m03 + a_m21 * b_m13 + a_m22 * b_m23;
    },

    prependQuaternion: function (q)
    {
        var m = this._m;
        var x = q.x, y = q.y, z = q.z, w = q.w;
        var a_m00 = m[0], a_m10 = m[1], a_m20 = m[2];
        var a_m01 = m[4], a_m11 = m[5], a_m21 = m[6];
        var a_m02 = m[8], a_m12 = m[9], a_m22 = m[10];

        var b_m00 = 1 - 2 * (y * y + z * z), b_m10 = 2 * (x * y + w * z), b_m20 = 2 * (x * z - w * y);
        var b_m01 = 2 * (x * y - w * z), b_m11 = 1 - 2 * (x * x + z * z), b_m21 = 2 * (y * z + w * x);
        var b_m02 = 2 * (x * z + w * y), b_m12 = 2 * (y * z - w * x), b_m22 = 1 - 2 * (x * x + y * y);

        m[0] = a_m00 * b_m00 + a_m01 * b_m10 + a_m02 * b_m20;
        m[1] = a_m10 * b_m00 + a_m11 * b_m10 + a_m12 * b_m20;
        m[2] = a_m20 * b_m00 + a_m21 * b_m10 + a_m22 * b_m20;

        m[4] = a_m00 * b_m01 + a_m01 * b_m11 + a_m02 * b_m21;
        m[5] = a_m10 * b_m01 + a_m11 * b_m11 + a_m12 * b_m21;
        m[6] = a_m20 * b_m01 + a_m21 * b_m11 + a_m22 * b_m21;

        m[8] = a_m00 * b_m02 + a_m01 * b_m12 + a_m02 * b_m22;
        m[9] = a_m10 * b_m02 + a_m11 * b_m12 + a_m12 * b_m22;
        m[10] = a_m20 * b_m02 + a_m21 * b_m12 + a_m22 * b_m22;
    },

    appendRotationAxisAngle: function (axis, radians)
    {
        var m = this._m;
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);
        var rcpLen = 1 / axis.length;

        var x = axis.x * rcpLen, y = axis.y * rcpLen, z = axis.z * rcpLen;
        var oneMinCos = 1 - cos;

        var a_m00 = oneMinCos * x * x + cos, a_m10 = oneMinCos * x * y + sin * z, a_m20 = oneMinCos * x * z - sin * y;
        var a_m01 = oneMinCos * x * y - sin * z, a_m11 = oneMinCos * y * y + cos, a_m21 = oneMinCos * y * z + sin * x;
        var a_m02 = oneMinCos * x * z + sin * y, a_m12 = oneMinCos * y * z - sin * x, a_m22 = oneMinCos * z * z + cos;

        var b_m00 = m[0], b_m10 = m[1], b_m20 = m[2];
        var b_m01 = m[4], b_m11 = m[5], b_m21 = m[6];
        var b_m02 = m[8], b_m12 = m[9], b_m22 = m[10];
        var b_m03 = m[12], b_m13 = m[13], b_m23 = m[14];

        m[0] = a_m00 * b_m00 + a_m01 * b_m10 + a_m02 * b_m20;
        m[1] = a_m10 * b_m00 + a_m11 * b_m10 + a_m12 * b_m20;
        m[2] = a_m20 * b_m00 + a_m21 * b_m10 + a_m22 * b_m20;

        m[4] = a_m00 * b_m01 + a_m01 * b_m11 + a_m02 * b_m21;
        m[5] = a_m10 * b_m01 + a_m11 * b_m11 + a_m12 * b_m21;
        m[6] = a_m20 * b_m01 + a_m21 * b_m11 + a_m22 * b_m21;

        m[8] = a_m00 * b_m02 + a_m01 * b_m12 + a_m02 * b_m22;
        m[9] = a_m10 * b_m02 + a_m11 * b_m12 + a_m12 * b_m22;
        m[10] = a_m20 * b_m02 + a_m21 * b_m12 + a_m22 * b_m22;

        m[12] = a_m00 * b_m03 + a_m01 * b_m13 + a_m02 * b_m23;
        m[13] = a_m10 * b_m03 + a_m11 * b_m13 + a_m12 * b_m23;
        m[14] = a_m20 * b_m03 + a_m21 * b_m13 + a_m22 * b_m23;
    },

    prependRotationAxisAngle: function (axis, radians)
    {
        var m = this._m;
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);
        var rcpLen = 1 / axis.length;

        var x = axis.x * rcpLen, y = axis.y * rcpLen, z = axis.z * rcpLen;
        var oneMinCos = 1 - cos;

        var a_m00 = m[0], a_m10 = m[1], a_m20 = m[2];
        var a_m01 = m[4], a_m11 = m[5], a_m21 = m[6];
        var a_m02 = m[8], a_m12 = m[9], a_m22 = m[10];

        var b_m00 = oneMinCos * x * x + cos, b_m10 = oneMinCos * x * y + sin * z, b_m20 = oneMinCos * x * z - sin * y;
        var b_m01 = oneMinCos * x * y - sin * z, b_m11 = oneMinCos * y * y + cos, b_m21 = oneMinCos * y * z + sin * x;
        var b_m02 = oneMinCos * x * z + sin * y, b_m12 = oneMinCos * y * z - sin * x, b_m22 = oneMinCos * z * z + cos;

        m[0] = a_m00 * b_m00 + a_m01 * b_m10 + a_m02 * b_m20;
        m[1] = a_m10 * b_m00 + a_m11 * b_m10 + a_m12 * b_m20;
        m[2] = a_m20 * b_m00 + a_m21 * b_m10 + a_m22 * b_m20;

        m[4] = a_m00 * b_m01 + a_m01 * b_m11 + a_m02 * b_m21;
        m[5] = a_m10 * b_m01 + a_m11 * b_m11 + a_m12 * b_m21;
        m[6] = a_m20 * b_m01 + a_m21 * b_m11 + a_m22 * b_m21;

        m[8] = a_m00 * b_m02 + a_m01 * b_m12 + a_m02 * b_m22;
        m[9] = a_m10 * b_m02 + a_m11 * b_m12 + a_m12 * b_m22;
        m[10] = a_m20 * b_m02 + a_m21 * b_m12 + a_m22 * b_m22;
    },

    getRow: function (index, target)
    {
        var m = this._m;
        target = target || new Float4();
        target.x = m[index];
        target.y = m[index | 4];
        target.z = m[index | 8];
        target.w = m[index | 12];
        return target;
    },

    setRow: function (index, v)
    {
        var m = this._m;
        m[index] = v.x;
        m[index | 4] = v.y;
        m[index | 8] = v.z;
        m[index | 12] = v.w;
    },

    getElement: function(row, col)
    {
        return this._m[row | (col << 2)];
    },

    setElement: function(row, col, value)
    {
        this._m[row | (col << 2)] = value;
    },

    getColumn: function (index, target)
    {
        var m = this._m;
        target = target || new Float4();
        index <<= 2;
        target.x = m[index];
        target.y = m[index | 1];
        target.z = m[index | 2];
        target.w = m[index | 3];
        return target;
    },

    setColumn: function (index, v)
    {
        var m = this._m;
        index <<= 2;
        m[index] = v.x;
        m[index | 1] = v.y;
        m[index | 2] = v.z;
        m[index | 3] = v.w;
    },

    /**
     * @param target
     * @param eye
     * @param up Must be unit length
     */
    lookAt: function (target, eye, up)
    {
        var zAxis = Float4.subtract(eye, target);
        zAxis.normalize();

        var xAxis = Float4.cross(up, zAxis);

        if (Math.abs(xAxis.lengthSqr) > .0001) {
            xAxis.normalize();
        }
        else {
            var altUp = new Float4(up.x, up.z, up.y, 0.0);
            Float4.cross(altUp, zAxis, xAxis);
            if (Math.abs(xAxis.lengthSqr) <= .0001) {
                altUp.set(up.z, up.y, up.z, 0.0);
                Float4.cross(altUp, zAxis, xAxis);
            }
            xAxis.normalize();
        }

        var yAxis = Float4.cross(zAxis, xAxis);

        var m = this._m;
        m[0] = xAxis.x;
        m[1] = xAxis.y;
        m[2] = xAxis.z;
        m[3] = 0.0;
        m[4] = yAxis.x;
        m[5] = yAxis.y;
        m[6] = yAxis.z;
        m[7] = 0.0;
        m[8] = zAxis.x;
        m[9] = zAxis.y;
        m[10] = zAxis.z;
        m[11] = 0.0;
        m[12] = eye.x;
        m[13] = eye.y;
        m[14] = eye.z;
        m[15] = 1.0;
    },

    /**
     * Generates a matrix from a transform object
     */
    compose: function(transform)
    {
        this.fromQuaternion(transform.rotation);
        var scale = transform.scale;
        this.prependScale(scale.x, scale.y, scale.z);
        this.appendTranslation(transform.position);
    },

    /**
     * Decomposes an affine transformation matrix into a Transform object, or a triplet position, quaternion, scale.
     * @param targetOrPos An optional target object to store the values. If this is a Float4, quat and scale need to be provided. If omitted, a new Transform object will be created and returned.
     * @param quat An optional quaternion to store rotation. Unused if targetOrPos is a Transform object.
     * @param quat An optional Float4 to store scale. Unused if targetOrPos is a Transform object.
     */
    decompose: function (targetOrPos, quat, scale)
    {
        targetOrPos = targetOrPos || new Transform();

        var pos;
        if (quat === undefined) {
            quat = targetOrPos.rotation;
            scale = targetOrPos.scale;
            pos = targetOrPos.position;
        }
        else pos = targetOrPos;

        var m = this._m;
        var m0 = m[0], m1 = m[1], m2 = m[2];
        var m4 = m[4], m5 = m[5], m6 = m[6];
        var m8 = m[8], m9 = m[9], m10 = m[10];

        // check for negative scale by calculating cross X x Y (positive scale should yield the same Z)
        var cx = m1*m6 - m2*m5;
        var cy = m2*m4 - m0*m6;
        var cz = m0*m5 - m1*m4;

        // dot cross product X x Y with Z < 0? Lefthanded flip.
        var flipSign = MathX.sign(cx * m8 + cy * m9 + cz * m10);

        // we assign the flipSign to all three instead of just 1, so that if a uniform negative scale was used, this will
        // be preserved
        scale.x = flipSign * Math.sqrt(m0 * m0 + m1 * m1 + m2 * m2);
        scale.y = flipSign * Math.sqrt(m4 * m4 + m5 * m5 + m6 * m6);
        scale.z = flipSign * Math.sqrt(m8 * m8 + m9 * m9 + m10 * m10);
        var clone = this.clone();

        var rcpX = 1.0 / scale.x, rcpY = 1.0 / scale.y, rcpZ = 1.0 / scale.z;

        var cm = clone._m;
        cm[0] *= rcpX;
        cm[1] *= rcpX;
        cm[2] *= rcpX;
        cm[4] *= rcpY;
        cm[5] *= rcpY;
        cm[6] *= rcpY;
        cm[8] *= rcpZ;
        cm[9] *= rcpZ;
        cm[10] *= rcpZ;

        quat.fromMatrix(clone);
        pos.copyFrom(this.getColumn(3));

        return targetOrPos;
    },

    swapColums: function(i, j)
    {
        var m = this._m;
        if (i === j) return;
        i <<= 2;
        j <<= 2;
        var x = m[i];
        var y = m[i | 1];
        var z = m[i | 2];
        var w = m[i | 3];
        m[i] = m[j];
        m[i | 1] = m[j | 1];
        m[i | 2] = m[j | 2];
        m[i | 3] = m[j | 3];
        m[j] = x;
        m[j | 1] = y;
        m[j | 2] = z;
        m[j | 3] = w;
    },

    toString: function()
    {
        var m = this._m;
        var str = "";
        for (var i = 0; i < 16; ++i) {
            var mod = i & 0x3;
            if (mod === 0)
                str += "[";

            str += m[i];

            if (mod === 3)
                str += "]\n";
            else
                str += "\t , \t";
        }
        return str;
    }
};

Matrix4x4.IDENTITY = new Matrix4x4();
Matrix4x4.ZERO = new Matrix4x4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

/**
 *
 * @constructor
 */
function SceneVisitor()
{

}

SceneVisitor.prototype =
{
    collect: function(camera, scene) {},
    qualifies: function(object) {},
    visitLight: function(light) {},
    visitAmbientLight: function(light) {},
    visitModelInstance: function (modelInstance, worldMatrix) {},
    visitScene: function (scene) {},
    visitEffects: function(effects, ownerNode) {}
};

/**
 * This goes through a scene to find a material with a given name
 * @param materialName
 * @constructor
 */
function MaterialQueryVisitor(materialName)
{
    SceneVisitor.call(this);
    this._materialName = materialName;
}

MaterialQueryVisitor.prototype = Object.create(SceneVisitor.prototype,
    {
        foundMaterial: {
            get: function()
            {
                return this._foundMaterial;
            }
        }
    });

MaterialQueryVisitor.prototype.qualifies = function(object)
{
    // if a material was found, ignore
    return !this._foundMaterial;
};

MaterialQueryVisitor.prototype.visitModelInstance = function (modelInstance, worldMatrix)
{
    var materials = modelInstance._materials;
    var len = materials.length;
    for (var i = 0; i < len; ++i) {
        var material = materials[i];
        if (material.name === this._materialName)
            this._foundMaterial = material;
    }
};

/**
 *
 * @param type
 * @constructor
 */
function BoundingVolume(type)
{
    this._type = type;

    this._expanse = BoundingVolume.EXPANSE_EMPTY;
    this._minimumX = 0.0;
    this._minimumY = 0.0;
    this._minimumZ = 0.0;
    this._maximumX = 0.0;
    this._maximumY = 0.0;
    this._maximumZ = 0.0;
    this._halfExtentX = 0.0;
    this._halfExtentY = 0.0;
    this._halfExtentZ = 0.0;
    this._center = new Float4();
}

BoundingVolume.EXPANSE_EMPTY = 0;
BoundingVolume.EXPANSE_INFINITE = 1;
BoundingVolume.EXPANSE_FINITE = 2;

BoundingVolume._testAABBToSphere = function(aabb, sphere)
{
    // b = sphere var max = aabb._maximum;
    var maxX = sphere._maximumX;
    var maxY = sphere._maximumY;
    var maxZ = sphere._maximumZ;
    var minX = aabb._minimumX;
    var minY = aabb._minimumY;
    var minZ = aabb._minimumZ;
    var radius = sphere._halfExtentX;
    var centerX = sphere._center.x;
    var centerY = sphere._center.y;
    var centerZ = sphere._center.z;
    var dot = 0, diff;

    if (minX > centerX) {
        diff = centerX - minX;
        dot += diff * diff;
    }
    else if (maxX < centerX) {
        diff = centerX - maxX;
        dot += diff * diff;
    }

    if (minY > centerY) {
        diff = centerY - minY;
        dot += diff * diff;
    }
    else if (maxY < centerY) {
        diff = centerY - maxY;
        dot += diff * diff;
    }

    if (minZ > centerZ) {
        diff = centerZ - minZ;
        dot += diff * diff;
    }
    else if (maxZ < centerZ) {
        diff = centerZ - maxZ;
        dot += diff * diff;
    }

    return dot < radius * radius;
};

BoundingVolume.prototype =
{
    get expanse() { return this._expanse; },
    get type() { return this._type; },

    growToIncludeMesh: function(meshData) { throw new Error("Abstract method!"); },
    growToIncludeBound: function(bounds) { throw new Error("Abstract method!"); },
    growToIncludeMinMax: function(min, max) { throw new Error("Abstract method!"); },

    clear: function(expanseState)
    {
        this._minimumX = this._minimumY = this._minimumZ = 0;
        this._maximumX = this._maximumY = this._maximumZ = 0;
        this._center.set(0, 0, 0);
        this._halfExtentX = this._halfExtentY = this._halfExtentZ = 0;
        this._expanse = expanseState === undefined? BoundingVolume.EXPANSE_EMPTY : expanseState;
    },

    // both center/radius and min/max approaches are used, depending on the type, but both are required
    get minimum() { return new Float4(this._minimumX, this._minimumY, this._minimumZ, 1.0); },
    get maximum() { return new Float4(this._maximumX, this._maximumY, this._maximumZ, 1.0); },

    get center() { return this._center; },
    // the half-extents of the box encompassing the bounds.
    get halfExtent() { return new Float4(this._halfExtentX, this._halfExtentY, this._halfExtentZ, 0.0); },
    // the radius of the sphere encompassing the bounds. This is implementation-dependent, because the radius is less precise for a box than for a sphere
    getRadius: function() { throw new Error("Abstract method!"); },

    transformFrom: function(sourceBound, matrix) { throw new Error("Abstract method!"); },

    /**
     * Tests whether the bounding box intersects. The convex solid is described as a list of planes pointing outward. Infinite solids are also allowed (Directional Light frusta without a near plane, for example)
     * @param cullPlanes An Array of planes to be tested. Planes are simply Float4 objects.
     * @param numPlanes The amount of planes to be tested against. This so we can test less planes than are in the cullPlanes array (Directional Light frusta, for example)
     * @returns {boolean} Whether or not the bounds intersect the solid.
     */
    intersectsConvexSolid: function(cullPlanes, numPlanes) { throw new Error("Abstract method!"); },

    intersectsBound: function(bound) { throw new Error("Abstract method!"); },
    classifyAgainstPlane: function(plane) { throw new Error("Abstract method!"); },

    createDebugModel: function() { throw new Error("Abstract method!"); },

    getDebugModel: function()
    {
        if (this._type._debugModel === undefined)
            this._type._debugModel = this.createDebugModel();

        return this._type._debugModel;
    },

    toString: function()
    {
        return "BoundingVolume: [ " +
            this._minimumX + ", " +
            this._minimumY + ", " +
            this._minimumZ + " ] - [ " +
            this._maximumX + ", " +
            this._maximumY + ", " +
            this._maximumZ + " ], expanse: " +
            this._expanse;
    }
};

var PlaneSide = {
    FRONT: 1,
    BACK: -1,
    INTERSECTING: 0
};

// Just contains some convenience methods and GL management stuff that shouldn't be called directly
// Will become an abstraction layer
// properties to keep track of render state
var _numActiveAttributes = 0;

var _renderTarget = null;
var _renderTargetInvalid = true;

var _viewport = {x: 0, y: 0, width: 0, height: 0};
var _viewportInvalid = true;

var _depthMask = true;
var _depthMaskInvalid = true;

var _cullMode = null;
var _cullModeInvalid = true;

var _depthTest = null;
var _depthTestInvalid = true;

var _blendState = null;
var _blendStateInvalid = false;

// this is so that effects can push states on the stack
// the renderer at the root just pushes one single state and invalidates that constantly
var _stencilState = null;
var _stencilStateInvalid = false;

var _glStats =
    {
        numDrawCalls: 0,
        numTriangles: 0,
        numClears: 0
    };

var _clearGLStats = function ()
{
    _glStats.numDrawCalls = 0;
    _glStats.numTriangles = 0;
    _glStats.numClears = 0;
};

var gl = null;

function _updateRenderState()
{
    if (_renderTargetInvalid) {
        var target = _renderTarget;

        if (target) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, target._fbo);

            if (target._numColorTextures > 1)
                capabilities.EXT_DRAW_BUFFERS.drawBuffersWEBGL(target._drawBuffers);
        }
        else
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        _renderTargetInvalid = false;
    }

    if (_viewportInvalid) {
        gl.viewport(_viewport.x, _viewport.y, _viewport.width, _viewport.height);
        _viewportInvalid = false;
    }

    if (_depthMaskInvalid) {
        gl.depthMask(_depthMask);
        _depthMaskInvalid = false;
    }

    if (_cullModeInvalid) {
        if (_cullMode === CullMode.NONE)
            gl.disable(gl.CULL_FACE);
        else {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(_cullMode);
        }
    }

    if (_depthTestInvalid) {
        if (_depthTest === Comparison.DISABLED)
            gl.disable(gl.DEPTH_TEST);
        else {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(_depthTest);
        }
    }

    if (_blendStateInvalid) {
        var blendState = _blendState;
        if (!blendState || blendState.enabled === false)
            gl.disable(gl.BLEND);
        else {
            gl.enable(gl.BLEND);
            gl.blendFunc(blendState.srcFactor, blendState.dstFactor);
            gl.blendEquation(blendState.operator);
            var color = blendState.color;
            if (color)
                gl.blendColor(color.r, color.g, color.b, color.a);
        }
        _blendStateInvalid = false;
    }

    if (_stencilStateInvalid) {
        var stencilState = _stencilState;
        if (!stencilState || stencilState.enabled === false) {
            gl.disable(gl.STENCIL_TEST);
            gl.stencilFunc(Comparison.ALWAYS, 0, 0xff);
            gl.stencilOp(StencilOp.KEEP, StencilOp.KEEP, StencilOp.KEEP);
        }
        else {
            gl.enable(gl.STENCIL_TEST);
            gl.stencilFunc(stencilState.comparison, stencilState.reference, stencilState.readMask);
            gl.stencilOp(stencilState.onStencilFail, stencilState.onDepthFail, stencilState.onPass);
            gl.stencilMask(stencilState.writeMask);
        }
        _stencilStateInvalid = false;
    }
}

var GL = {
    gl: null,

    _setGL: function (value)
    {
        GL.gl = gl = value;
    },

    /**
     * Default clearing function. Can be called if no special clearing functionality is needed (or in case another api is used that clears)
     * Otherwise, you can manually clear using GL context.
     */
    clear: function (clearMask)
    {
        if (clearMask === undefined)
            clearMask = ClearMask.COMPLETE;

        _updateRenderState();
        gl.clear(clearMask);
        ++_glStats.numClears;
    },

    drawElements: function (elementType, numIndices, offset)
    {
        ++_glStats.numDrawCalls;
        _glStats.numTriangles += numIndices / 3;
        _updateRenderState();
        gl.drawElements(elementType, numIndices, gl.UNSIGNED_SHORT, offset * 2);
    },


    /**
     *
     * @param rect Any object with a width and height property, so it can be a Rect or even an FBO. If x and y are present, it will use these too.
     */
    setViewport: function (rect)
    {
        _viewportInvalid = true;
        if (rect) {
            _viewport.x = rect.x || 0;
            _viewport.y = rect.y || 0;
            _viewport.width = rect.width || 0;
            _viewport.height = rect.height || 0;
        }
        else {
            _viewport.x = 0;
            _viewport.y = 0;
            _viewport.width = META.TARGET_CANVAS.width;
            _viewport.height = META.TARGET_CANVAS.height;
        }
    },

    getCurrentRenderTarget: function ()
    {
        return _renderTarget;
    },

    setRenderTarget: function (frameBuffer)
    {
        _renderTarget = frameBuffer;
        _renderTargetInvalid = true;
        GL.setViewport(frameBuffer);
    },

    enableAttributes: function (count)
    {
        var numActiveAttribs = _numActiveAttributes;
        var i;

        if (numActiveAttribs < count) {
            for (i = numActiveAttribs; i < count; ++i)
                gl.enableVertexAttribArray(i);
        }
        else if (numActiveAttribs > count) {
            // bug in WebGL/ANGLE? When rendering to a render target, disabling vertex attrib array 1 causes errors when using only up to the index below o_O
            // so for now + 1
            count += 1;
            for (i = count; i < numActiveAttribs; ++i) {
                gl.disableVertexAttribArray(i);
            }
        }

        _numActiveAttributes = count;
    },

    setClearColor: function (color)
    {
        color = isNaN(color) ? color : new Color(color);
        gl.clearColor(color.r, color.g, color.b, color.a);
    },

    setCullMode: function (value)
    {
        if (_cullMode === value) return;
        _cullMode = value;
        _cullModeInvalid = true;
    },

    setDepthMask: function (value)
    {
        if (_depthMask === value) return;
        _depthMask = value;
        _depthMaskInvalid = true;
    },

    setDepthTest: function (value)
    {
        if (_depthTest === value) return;
        _depthTest = value;
        _depthTestInvalid = true;
    },

    setBlendState: function (value)
    {
        if (_blendState === value) return;
        _blendState = value;
        _blendStateInvalid = true;
    },

    updateStencilReferenceValue: function (value)
    {
        var currentState = _stencilState;

        if (!currentState || currentState.reference === value) return;

        currentState.reference = value;

        if (!_stencilStateInvalid && currentState.enabled)
            gl.stencilFunc(currentState.comparison, value, currentState.readMask);
    },

    setStencilState: function (value)
    {
        _stencilState = value;
        _stencilStateInvalid = true;
    }
};

/**
 *
 * @constructor
 */
function IndexBuffer()
{
    this._buffer = GL.gl.createBuffer();
}

IndexBuffer.prototype = {
    /**
     * Uploads data for the buffer.
     * @param data The data to upload, must be a Int16Array object.
     * @param usageHint An optional usage hint for the buffer.
     */
    uploadData: function(data, usageHint)
    {
        if (usageHint === undefined)
            usageHint = BufferUsage.STATIC_DRAW;

        this.bind();
        GL.gl.bufferData(GL.gl.ELEMENT_ARRAY_BUFFER, data, usageHint);
    },

    dispose: function()
    {
        if (this._buffer) {
            GL.gl.deleteBuffer(this._buffer);
            this._buffer = 0;
        }
    },

    /**
     * @private
     */
    bind: function()
    {
        GL.gl.bindBuffer(GL.gl.ELEMENT_ARRAY_BUFFER, this._buffer);
    }
};

/**
 *
 * @constructor
 */
function VertexBuffer()
{
    this._buffer = GL.gl.createBuffer();
}

VertexBuffer.prototype = {

    /**
     * Uploads data for the buffer.
     * @param data The data to upload, must be a Float32Array object.
     * @param usageHint An optional usage hint for the buffer.
     */
    uploadData: function(data, usageHint)
    {
        if (usageHint === undefined)
            usageHint = GL.gl.STATIC_DRAW;

        this.bind();
        GL.gl.bufferData(GL.gl.ARRAY_BUFFER, data, usageHint);
    },

    dispose: function()
    {
        if (this._buffer) {
            GL.gl.deleteBuffer(this._buffer);
            this._buffer = 0;
        }
    },

    /**
     * @private
     */
    bind: function()
    {
        GL.gl.bindBuffer(GL.gl.ARRAY_BUFFER, this._buffer);
    }
};

/**
 *
 * @param meshData
 * @param model
 * @constructor
 */
var Mesh_ID_COUNTER = 0;

function Mesh(meshData, model)
{
    this._model = model;
    this._vertexBuffers = [];
    this._vertexStrides = [];
    this._vertexAttributes = null;
    this._morphAttributes = null;
    this._indexBuffer = new IndexBuffer();
    this._defaultMorphTarget = null;

    this._renderOrderHint = ++Mesh_ID_COUNTER;

    this.updateMeshData(meshData);
}

Mesh.ID_COUNTER = 0;

Mesh.prototype = {
    get hasMorphData()
    {
        return !!this._morphAttributes;
    },

    updateMeshData: function(meshData)
    {
        var numStreams = meshData.numStreams;
        var numVertexBuffers = this._vertexBuffers.length;

        if (numStreams > numVertexBuffers) {
            for (var i = numVertexBuffers; i < numStreams; ++i) {
                if (meshData.hasVertexData(i))
                    this._vertexBuffers[i] = new VertexBuffer();
            }
        }
        else if (numStreams < numVertexBuffers) {
            this._vertexBuffers.length = numStreams;
            this._vertexStrides.length = numStreams;
        }

        for (i = 0; i < numStreams; ++i) {
            if (meshData.hasVertexData(i))
                this._vertexBuffers[i].uploadData(meshData.getVertexData(i), meshData.vertexUsage);

            this._vertexStrides[i] = meshData.getVertexStride(i);
        }

        this._numIndices = meshData._indexData.length;
        this._numVertices = meshData.numVertices;

        this._indexBuffer.uploadData(meshData._indexData, meshData.indexUsage);
        this._vertexAttributes = meshData._vertexAttributes;
        this._morphAttributes = meshData._morphAttributes;

        if (this._morphAttributes) {
            this._defaultMorphTarget = new VertexBuffer();
            this._defaultMorphTarget.uploadData(meshData._defaultMorphTarget);
        }
    },

    dispose: function ()
    {
        for (var i = 0; i < this._vertexBuffers.length; ++i)
            this._vertexBuffers[i].dispose();
        this._indexBuffer.dispose();
    },

    get numVertices()
    {
        return this._numVertices;
    },

    get numIndices()
    {
        return this._numIndices;
    },

    get numVertexAttributes()
    {
        return this._vertexAttributes.length;
    },

    getVertexStride: function(streamIndex)
    {
        return this._vertexStrides[streamIndex];
    },

    getVertexAttribute: function (index)
    {
        return this._vertexAttributes[index];
    }
};

/**
 * A Model combines a list of Meshes
 * @param modelData
 * @constructor
 */
function Model(modelData)
{
    this._name = null;
    this._localBounds = new BoundingAABB();
    this._skeleton = null;
    this.onChange = new Signal();

    if (modelData) {
        this._meshes = null;
        this._setModelData(modelData);
    }
    else
        this._meshes = [];
}

Model.prototype =
{
    get name()
    {
        return this._name;
    },

    set name(value)
    {
        this._name = value;
    },

    get numMeshes()
    {
        return this._meshes.length;
    },

    getMesh: function (index)
    {
        return this._meshes[index];
    },

    dispose: function()
    {
        if (this._meshes)
            for (var i = 0; i < this._meshes.length; ++i)
                this._meshes[i].dispose();
    },

    get localBounds()
    {
        return this._localBounds;
    },


    get skeleton()
    {
        return this._skeleton;
    },

    set skeleton(value)
    {
        this._skeleton = value;
    },

    _setModelData: function (modelData)
    {
        this.dispose();

        this._localBounds.clear();
        this._meshes = [];

        for (var i = 0; i < modelData.numMeshes; ++i) {
            var meshData = modelData.getMeshData(i);
            this._localBounds.growToIncludeMesh(meshData);
            this._meshes.push(new Mesh(meshData, this));
        }

        this.skeleton = modelData.skeleton;

        this.onChange.dispatch();
    },

    toString: function()
    {
        return "[Model(name=" + this._name + ")]";
    }
};

/**
 *
 * @constructor
 */
function ModelData()
{
    this._meshDataList = [];
    this._joints = [];
    this.skeleton = null;
}

ModelData.prototype = {
    get numMeshes()
    {
        return this._meshDataList.length;
    },

    getMeshData: function (index)
    {
        return this._meshDataList[index];
    },

    addMeshData: function (meshData)
    {
        this._meshDataList.push(meshData);
    },

    addJoint: function(joint)
    {
        this._joints.push(joint);
    },

    get hasSkeleton()
    {
        return this._joints.length > 0;
    }
};

/**
 * MeshData contains the cpu-side definition data for a Mesh.
 * @constructor
 */
function MeshData()
{
    this._vertexStrides = [];
    this._vertexData = [];
    this._indexData = undefined;
    this.vertexUsage = BufferUsage.STATIC_DRAW;
    this.indexUsage = BufferUsage.STATIC_DRAW;
    this._vertexAttributes = [];
    this._defaultMorphTarget = null;
    this._numStreams = 0;
}

MeshData.DEFAULT_VERTEX_SIZE = 12;

// other possible indices:
// hx_instanceID (used by MeshBatch)
// hx_boneIndices (4)
// hx_boneWeights (4)
MeshData.createDefaultEmpty = function()
{
    var data = new MeshData();
    data.addVertexAttribute('hx_position', 3);
    data.addVertexAttribute('hx_normal', 3);
    data.addVertexAttribute('hx_tangent', 4);
    data.addVertexAttribute('hx_texCoord', 2);
    return data;
};

MeshData.prototype = {

    // this should only be the case for morph targets
    hasVertexData: function (streamIndex)
    {
        return !!this._vertexData[streamIndex];
    },

    getVertexData: function (streamIndex)
    {
        return this._vertexData[streamIndex];
    },

    /**
     * Sets data from Array
     */
    setVertexData: function (data, streamIndex)
    {
        this._vertexData[streamIndex || 0] = new Float32Array(data);
    },

    /**
     * Sets data from Array
     */
    setIndexData: function (data)
    {
        this._indexData = new Uint16Array(data);
    },

    /**
     * Adds a named vertex attribute. All properties are given manually to make it easier to support multiple streams in the future.
     * @param name The name of the attribute, matching the attribute name used in the vertex shaders.
     * @param numComponents The amount of components used by the attribute value.
     * @param streamIndex [Optional] The stream index indicating which vertex buffer is used, defaults to 0
     */
    addVertexAttribute: function (name, numComponents, streamIndex)
    {
        if (name === "hx_morphUV") this._hasMorphUVs = true;

        streamIndex = streamIndex || 0;
        this._numStreams = Math.max(this._numStreams, streamIndex + 1);
        this._vertexStrides[streamIndex] = this._vertexStrides[streamIndex] || 0;
        this._vertexAttributes.push({
            name: name,
            offset: this._vertexStrides[streamIndex],
            numComponents: numComponents,
            streamIndex: streamIndex
        });

        this._vertexStrides[streamIndex] += numComponents;
    },

    getVertexAttribute: function (name)
    {
        var len = this._vertexAttributes.length;
        for (var i = 0; i < len; ++i) {
            if (this._vertexAttributes[i].name === name)
                return this._vertexAttributes[i];
        }
    },

    /**
     * Returns the stride of each vertex for the given stream index. This matches the total amount of elements used by all vertex attributes combined.
     */
    getVertexStride: function (streamIndex)
    {
        return this._vertexStrides[streamIndex];
    },

    get numStreams()
    {
        return this._numStreams;
    },

    get numVertices()
    {
        return this._vertexData[0].length / this._vertexStrides[0];
    },

    extractAttributeData: function(name)
    {
        var attrib = this.getVertexAttribute(name);
        var stride = this.getVertexStride(attrib);
        var data = this.getVertexData(attrib.streamIndex);
        var numComps = attrib.numComponents;
        var vertData = [];
        var t = 0;
        for (var i = attrib.offset; i < data.length; i += stride) {
            for (var j = 0; j < numComps; ++j) {
                vertData[t++] = data[i + j];
            }
        }
        return vertData;
    },

    generateMorphData: function()
    {
        this._morphAttributes = [];
        var data = [];

        for (var i = 0; i < this.numVertices; ++i) {
            data.push(0, 0, 0);
        }

        this._defaultMorphTarget = new Float32Array(data);

        for (i = 0; i < capabilities.NUM_MORPH_TARGETS; ++i) {
            this.addVertexAttribute("hx_morphPosition" + i, 3, this.numStreams);
            this._morphAttributes[i] = this._vertexAttributes[this._vertexAttributes.length - 1];
        }
    }
};

/**
 * Returns the angle between two vectors
 */
Float2.angle = function(a, b)
{
    return Math.acos(Float2.dot(a, b) / (a.length * b.length));
};


/**
 * Creates a new Float2 object
 * @class
 * @constructor
 */
function Float2(x, y)
{
    // x, y, z, w allowed to be accessed publicly for simplicity, changing this does not violate invariant. Ever.
    this.x = x || 0;
    this.y = y || 0;
}

Float2.distance = function(a, b)
{
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
};

Float2.dot = function(a, b)
{
    return a.x * b.x + a.y * b.y;
};

/**
 * Returns the angle between two vectors, assuming they are normalized
 */
Float2.angleNormalized = function(a, b)
{
    return Math.acos(Float2.dot(a, b));
};

Float2.add = function(a, b, target)
{
    target = target || new Float2();
    target.x = a.x + b.x;
    target.y = a.y + b.y;
    return target;
};

Float2.subtract = function(a, b, target)
{
    target = target || new Float2();
    target.x = a.x - b.x;
    target.y = a.y - b.y;
    return target;
};

Float2.scale = function(a, s, target)
{
    target = target || new Float2();
    target.x = a.x * s;
    target.y = a.y * s;
    return target;
};

Float2.negate = function(a, b, target)
{
    target = target || new Float2();
    target.x = -target.x;
    target.y = -target.y;
    return target;
};

Float2.prototype =
{
    set: function(x, y)
    {
        this.x = x;
        this.y = y;
    },

    get lengthSqr()
    {
        return this.x * this.x + this.y * this.y;
    },

    get length()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    normalize: function()
    {
        var rcpLength = 1.0/this.length;
        this.x *= rcpLength;
        this.y *= rcpLength;
    },

    clone: function()
    {
        return new Float2(this.x, this.y);
    },

    add: function(v)
    {
        this.x += v.x;
        this.y += v.y;
    },

    subtract: function(v)
    {
        this.x -= v.x;
        this.y -= v.y;
    },

    scale: function(s)
    {
        this.x *= s;
        this.y *= s;
    },

    negate: function()
    {
        this.x = -this.x;
        this.y = -this.y;
    },

    abs: function()
    {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
    },

    lerp: function(a, b, factor)
    {
        var ax = a.x, ay = a.y;

        this.x = ax + (b.x - ax) * factor;
        this.y = ay + (b.y - ay) * factor;
    },

    fromPolarCoordinates: function(radius, angle)
    {
        this.x = radius*Math.cos(angle);
        this.y = radius*Math.sin(angle);
    },

    copyFrom: function(b)
    {
        this.x = b.x;
        this.y = b.y;
    },

    maximize: function(b)
    {
        if (b.x > this.x) this.x = b.x;
        if (b.y > this.y) this.y = b.y;
    },

    minimize: function(b)
    {
        if (b.x < this.x) this.x = b.x;
        if (b.y < this.y) this.y = b.y;
    }
};

Float2.ZERO = new Float2(0, 0);
Float2.X_AXIS = new Float2(1, 0);
Float2.Y_AXIS = new Float2(0, 1);

/**
 *
 * @constructor
 */
function NormalTangentGenerator()
{
    this._meshData = null;
    this._mode = 0;
    this._faceNormals = null;
    this._faceTangents = null;
    this._faceBitangents = null;
}

NormalTangentGenerator.MODE_NORMALS = 1;
NormalTangentGenerator.MODE_TANGENTS = 2;

NormalTangentGenerator.prototype =
{
    generate: function(meshData, mode, useFaceWeights)
    {
        if (useFaceWeights === undefined) useFaceWeights = true;
        this._mode = mode === undefined? NormalTangentGenerator.MODE_NORMALS | NormalTangentGenerator.MODE_TANGENTS : mode;

        this._meshData = meshData;

        this._positionAttrib = meshData.getVertexAttribute("hx_position");
        this._normalAttrib = meshData.getVertexAttribute("hx_normal");
        this._tangentAttrib = meshData.getVertexAttribute("hx_tangent");
        this._uvAttrib = meshData.getVertexAttribute("hx_texCoord");
        this._positionStride = meshData.getVertexStride(this._positionAttrib.streamIndex);
        this._normalStride = meshData.getVertexStride(this._normalAttrib.streamIndex);
        this._tangentStride = meshData.getVertexStride(this._tangentAttrib.streamIndex);
        this._uvStride = meshData.getVertexStride(this._uvAttrib.streamIndex);

        this._calculateFaceVectors(useFaceWeights);
        this._calculateVertexVectors();
    },

    _calculateFaceVectors: function(useFaceWeights)
    {
        var numIndices = this._meshData._indexData.length;

        if ((this._mode & NormalTangentGenerator.MODE_NORMALS) !== 0) this._faceNormals = new Array(numIndices);
        if ((this._mode & NormalTangentGenerator.MODE_TANGENTS) !== 0) {
            this._faceTangents = new Array(numIndices);
            this._faceBitangents = new Array(numIndices);
        }

        var temp = new Float4();
        var temp1 = new Float4();
        var temp2 = new Float4();
        var v0 = new Float4();
        var v1 = new Float4();
        var v2 = new Float4();
        var uv0 = new Float2();
        var uv1 = new Float2();
        var uv2 = new Float2();
        var st1 = new Float2();
        var st2 = new Float2();

        var posOffset = this._positionAttrib.offset;
        var uvOffset = this._uvAttrib.offset;
        var posData = this._meshData.getVertexData(this._positionAttrib.streamIndex);
        var uvData = this._meshData.getVertexData(this._uvAttrib.streamIndex);

        for (var i = 0; i < numIndices; i += 3) {
            this._getFloat3At(i, posOffset, this._positionStride, v0, posData);
            this._getFloat3At(i + 1, posOffset, this._positionStride, v1, posData);
            this._getFloat3At(i + 2, posOffset, this._positionStride, v2, posData);
            this._getFloat2At(i, uvOffset, this._uvStride, uv0, uvData);
            this._getFloat2At(i + 1, uvOffset, this._uvStride, uv1, uvData);
            this._getFloat2At(i + 2, uvOffset, this._uvStride, uv2, uvData);

            v1.subtract(v0);
            v2.subtract(v0);

            if (this._faceNormals) {
                Float4.cross(v1, v2, temp);

                if (!useFaceWeights) temp.normalize();

                this._faceNormals[i] = temp.x;
                this._faceNormals[i + 1] = temp.y;
                this._faceNormals[i + 2] = temp.z;
            }

            if (this._faceTangents) {
                //var div = ((uv1.x - uv0.x)*(uv2.y - uv0.y) - (uv1.y - uv0.y)*(uv2.x - uv0.x));
                Float2.subtract(uv1, uv0, st1);
                Float2.subtract(uv2, uv0, st2);

                Float4.scale(v1, st2.y, temp1);
                Float4.scale(v2, st1.y, temp2);
                Float4.subtract(temp1, temp2, temp);

                if (temp.lengthSqr > .001)
                    temp.normalize();

                this._faceTangents[i] = temp.x;
                this._faceTangents[i + 1] = temp.y;
                this._faceTangents[i + 2] = temp.z;

                Float4.scale(v1, st2.x, temp1);
                Float4.scale(v2, st1.x, temp1);
                Float4.subtract(temp2, temp1, temp);
                // no need to normalize bitangent, just need it for orientation

                this._faceBitangents[i] = temp.x;
                this._faceBitangents[i + 1] = temp.y;
                this._faceBitangents[i + 2] = temp.z;
            }
        }
    },

    _calculateVertexVectors: function()
    {
        this._zeroVectors();

        var bitangents = this._faceTangents ? [] : null;
        var indexData = this._meshData._indexData;
        var normalOffset = this._normalAttrib.offset;
        var tangentOffset = this._tangentAttrib.offset;
        var normalData = this._meshData.getVertexData(this._normalAttrib.streamIndex);
        var tangentData = this._meshData.getVertexData(this._tangentAttrib.streamIndex);
        var numIndices = indexData.length;

        for (var i = 0; i < numIndices; ++i) {
            var index = indexData[i];
            var normalIndex = normalOffset + index * this._normalStride;
            var tangentIndex = tangentOffset + index * this._tangentStride;
            var bitangentIndex = index * 3;
            var faceIndex = Math.floor(i / 3) * 3;

            if (this._faceNormals) {
                normalData[normalIndex] += this._faceNormals[faceIndex];
                normalData[normalIndex + 1] += this._faceNormals[faceIndex + 1];
                normalData[normalIndex + 2] += this._faceNormals[faceIndex + 2];
            }

            if (this._faceTangents) {
                tangentData[tangentIndex] += this._faceTangents[faceIndex];
                tangentData[tangentIndex + 1] += this._faceTangents[faceIndex + 1];
                tangentData[tangentIndex + 2] += this._faceTangents[faceIndex + 2];

                bitangents[bitangentIndex] += this._faceBitangents[faceIndex];
                bitangents[bitangentIndex + 1] += this._faceBitangents[faceIndex + 1];
                bitangents[bitangentIndex + 2] += this._faceBitangents[faceIndex + 2];
            }
        }

        this._normalize(bitangents);
    },

    _zeroVectors: function()
    {
        var normalData = this._meshData.getVertexData(this._normalAttrib.streamIndex);
        var tangentData = this._meshData.getVertexData(this._tangentAttrib.streamIndex);
        var normalStride = this._meshData.getVertexStride(this._normalAttrib.streamIndex);
        var tangentStride = this._meshData.getVertexStride(this._tangentAttrib.streamIndex);
        var numVertices = normalData.length / normalStride;
        var normalIndex = this._normalAttrib.offset;
        var tangentIndex = this._tangentAttrib.offset;

        for (var i = 0; i < numVertices; ++i) {
            if (this._mode & NormalTangentGenerator.MODE_NORMALS) {
                normalData[normalIndex] = 0.0;
                normalData[normalIndex + 1] = 0.0;
                normalData[normalIndex + 2] = 0.0;
            }
            if (this._mode & NormalTangentGenerator.MODE_TANGENTS) {
                tangentData[tangentIndex] = 0.0;
                tangentData[tangentIndex + 1] = 0.0;
                tangentData[tangentIndex + 2] = 0.0;
            }
            normalIndex += normalStride;
            tangentIndex += tangentStride;
        }
    },

    _normalize: function(bitangents)
    {
        var normalData = this._meshData.getVertexData(this._normalAttrib.streamIndex);
        var tangentData = this._meshData.getVertexData(this._tangentAttrib.streamIndex);
        var numVertices = normalData.length / this._normalStride;
        var normalIndex = this._normalAttrib.offset;
        var tangentIndex = this._tangentAttrib.offset;
        var bitangentIndex = 0;
        var normal = new Float4();
        var tangent = new Float4();
        var bitangent = new Float4();
        var cross = new Float4();

        for (var i = 0; i < numVertices; ++i) {
            normal.x = normalData[normalIndex];
            normal.y = normalData[normalIndex + 1];
            normal.z = normalData[normalIndex + 2];

            if (this._mode & NormalTangentGenerator.MODE_NORMALS) {
                normal.normalize();
                normalData[normalIndex] = normal.x;
                normalData[normalIndex + 1] = normal.y;
                normalData[normalIndex + 2] = normal.z;
            }
            if (this._mode & NormalTangentGenerator.MODE_TANGENTS) {
                tangent.x = tangentData[tangentIndex];
                tangent.y = tangentData[tangentIndex + 1];
                tangent.z = tangentData[tangentIndex + 2];

                // can happen in singularities
                if (tangent.lengthSqr < 0.0001)
                    tangent.set(1.0, 1.0, 1.0, 1.0);
                else
                    tangent.normalize();

                bitangent.x = bitangents[bitangentIndex];
                bitangent.y = bitangents[bitangentIndex + 1];
                bitangent.z = bitangents[bitangentIndex + 2];
                Float4.cross(tangent, normal, cross);

                tangentData[tangentIndex] = tangent.x;
                tangentData[tangentIndex + 1] = tangent.y;
                tangentData[tangentIndex + 2] = tangent.z;
                tangentData[tangentIndex + 3] = Float4.dot3(bitangent, cross) > 0.0? 1.0 : -1.0;
            }

            normalIndex += this._normalStride;
            tangentIndex += this._tangentStride;
        }
    },

    _getFloat3At: function(i, offset, stride, target, data)
    {
        var indices = this._meshData._indexData;
        var posIndex = offset + indices[i] * stride;
        target.x = data[posIndex];
        target.y = data[posIndex + 1];
        target.z = data[posIndex + 2];
    },

    _getFloat2At: function(i, offset, stride, target, data)
    {
        var indices = this._meshData._indexData;
        var posIndex = offset + indices[i] * stride;
        target.x = data[posIndex];
        target.y = data[posIndex + 1];
    }
};

function Primitive(definition)
{
    definition = definition || {};
    var data = this._createMeshData(definition);
    var modelData = new ModelData();
    modelData.addMeshData(data);
    Model.call(this, modelData);
}

Primitive._ATTRIBS = function()
{
    this.positions = [];
    this.uvs = null;
    this.normals = null;
    this.indices = [];
};

Primitive.prototype = Object.create(Model.prototype);

Primitive.prototype._generate = function(target, definition)
{
    throw new Error("Abstract method called!");
};

Primitive.prototype._createMeshData = function(definition)
{
    var attribs = new Primitive._ATTRIBS();
    var uvs = definition.uvs === undefined? true : definition.uvs;
    var normals = definition.normals === undefined? true : definition.normals;
    var tangents = definition.tangents === undefined? true : definition.tangents;

    var data = new MeshData();
    data.addVertexAttribute('hx_position', 3);

    if (normals) {
        data.addVertexAttribute('hx_normal', 3);
        attribs.normals = [];
    }

    if (tangents)
        data.addVertexAttribute('hx_tangent', 4);

    if (uvs) {
        data.addVertexAttribute('hx_texCoord', 2);
        attribs.uvs = [];
    }

    this._generate(attribs, definition);

    var scaleU = definition.scaleU || 1;
    var scaleV = definition.scaleV || 1;

    var len = attribs.positions.length / 3;
    var v = 0, v2 = 0, v3 = 0;
    var vertices = [];

    for (var i = 0; i < len; ++i) {
        vertices[v++] = attribs.positions[v3];
        vertices[v++] = attribs.positions[v3 + 1];
        vertices[v++] = attribs.positions[v3 + 2];

        if (normals) {
            vertices[v++] = attribs.normals[v3];
            vertices[v++] = attribs.normals[v3 + 1];
            vertices[v++] = attribs.normals[v3 + 2];
        }

        if (tangents)
            v += 4;

        if (uvs) {
            vertices[v++] = attribs.uvs[v2++] * scaleU;
            vertices[v++] = attribs.uvs[v2++] * scaleV;
        }

        v3 += 3;
    }

    data.setVertexData(vertices, 0);
    data.setIndexData(attribs.indices);

    var mode = 0;

    // if data isn't provided, generate it manually
    if (normals && attribs.normals.length === 0)
        mode |= NormalTangentGenerator.MODE_NORMALS;

    if (tangents)
        mode |= NormalTangentGenerator.MODE_TANGENTS;

    if (mode) {
        var generator = new NormalTangentGenerator();
        generator.generate(data, mode);
    }

    return data;
};

function BoxPrimitive(definition)
{
    Primitive.call(this, definition);
}

BoxPrimitive.prototype = Object.create(Primitive.prototype);

BoxPrimitive.prototype._generate = function(target, definition)
{
    var numSegmentsW = definition.numSegmentsW || 1;
    var numSegmentsH = definition.numSegmentsH || definition.numSegmentsW || 1;
    var numSegmentsD = definition.numSegmentsD || definition.numSegmentsW || 1;
    var width = definition.width || 1;
    var height = definition.height || width;
    var depth = definition.depth || width;
    var flipSign = definition.invert? -1 : 1;
    var doubleSided = definition.doubleSided === undefined? false : definition.doubleSided;

    var rcpNumSegmentsW = 1/numSegmentsW;
    var rcpNumSegmentsH = 1/numSegmentsH;
    var rcpNumSegmentsD = 1/numSegmentsD;
    var halfW = width * .5;
    var halfH = height * .5;
    var halfD = depth * .5;

    var positions = target.positions;
    var uvs = target.uvs;
    var normals = target.normals;
    var indices = target.indices;
    var x, y, z;
    var ratioU, ratioV;
    var wSegment, hSegment, dSegment;


    // front and back
    for (hSegment = 0; hSegment <= numSegmentsH; ++hSegment) {
        ratioV = hSegment * rcpNumSegmentsH;
        y = height * ratioV - halfH;
        if (flipSign < 0) ratioV = 1.0 - ratioV;

        for (wSegment = 0; wSegment <= numSegmentsW; ++wSegment) {
            ratioU = wSegment * rcpNumSegmentsW;
            x = width * ratioU - halfW;

            if (flipSign < 0) ratioU = 1.0 - ratioU;

            // front and back
            positions.push(x*flipSign, y*flipSign, halfD*flipSign);
            positions.push(-x*flipSign, y*flipSign, -halfD*flipSign);

            if (normals) {
                normals.push(0, 0, 1);
                normals.push(0, 0, -1);
            }

            if (uvs) {
                uvs.push(ratioU, ratioV);
                uvs.push(ratioU, ratioV);
            }
        }
    }

    for (hSegment = 0; hSegment <= numSegmentsH; ++hSegment) {
        ratioV = hSegment * rcpNumSegmentsH;
        y = height * ratioV - halfH;

        for (dSegment = 0; dSegment <= numSegmentsD; ++dSegment) {
            ratioU = dSegment * rcpNumSegmentsD;
            z = depth * ratioU - halfD;

            // left and right
            positions.push(-halfW, y, z*flipSign);
            positions.push(halfW, y, -z*flipSign);

            if (normals) {
                normals.push(-flipSign, 0, 0);
                normals.push(flipSign, 0, 0);
            }

            if (uvs) {
                uvs.push(ratioU, ratioV);
                uvs.push(ratioU, ratioV);
            }
        }
    }

    for (dSegment = 0; dSegment <= numSegmentsD; ++dSegment) {
        ratioV = dSegment * rcpNumSegmentsD;
        z = depth * ratioV - halfD;

        for (wSegment = 0; wSegment <= numSegmentsW; ++wSegment) {
            ratioU = wSegment * rcpNumSegmentsW;
            x = width * ratioU - halfW;

            // top and bottom
            positions.push(x, halfH, -z*flipSign);
            positions.push(x, -halfH, z*flipSign);

            if (normals) {
                normals.push(0, flipSign, 0);
                normals.push(0, -flipSign, 0);
            }

            if (uvs) {
                uvs.push(1.0 - ratioU, 1.0 - ratioV);
                uvs.push(1.0 - ratioU, 1.0 - ratioV);
            }
        }
    }

    var offset = 0;

    for (var face = 0; face < 3; ++face) {
        // order:
        // front, back, left, right, bottom, top
        var numSegmentsU = face === 1? numSegmentsD : numSegmentsW;
        var numSegmentsV = face === 2? numSegmentsD : numSegmentsH;

        for (var yi = 0; yi < numSegmentsV; ++yi) {
            for (var xi = 0; xi < numSegmentsU; ++xi) {
                var w = numSegmentsU + 1;
                var base = offset + xi + yi*w;
                var i0 = base << 1;
                var i1 = (base + w + 1) << 1;
                var i2 = (base + w) << 1;
                var i3 = (base + 1) << 1;

                indices.push(i0, i1, i2);
                indices.push(i0, i3, i1);

                indices.push(i0 | 1, i1 | 1, i2 | 1);
                indices.push(i0 | 1, i3 | 1, i1 | 1);
            }
        }
        offset += (numSegmentsU + 1) * (numSegmentsV + 1);
    }

    var indexIndex = 0;
    if (doubleSided) {
        var i = 0;

        while (i < indexIndex) {
            indices.push(indices[i], indices[i + 2], indices[i + 1]);
            indices.push(indices[i + 3], indices[i + 5], indices[i + 4]);
            indexIndex += 6;
        }
    }
};

/**
 *
 * @constructor
 */
function BoundingAABB()
{
    BoundingVolume.call(this, BoundingAABB);
}

BoundingAABB.prototype = Object.create(BoundingVolume.prototype);

BoundingAABB.prototype.growToIncludeMesh = function(meshData)
{
    if (this._expanse === BoundingVolume.EXPANSE_INFINITE) return;

    var attribute = meshData.getVertexAttribute("hx_position");
    var index = attribute.offset;
    var stride = meshData.getVertexStride(attribute.streamIndex);
    var vertices = meshData.getVertexData(attribute.streamIndex);
    var len = vertices.length;
    var minX, minY, minZ;
    var maxX, maxY, maxZ;

    if (this._expanse === BoundingVolume.EXPANSE_EMPTY) {
        maxX = minX = vertices[index];
        maxY = minY = vertices[index + 1];
        maxZ = minZ = vertices[index + 2];
        index += stride;
    }
    else {
        minX = this._minimumX; minY = this._minimumY; minZ = this._minimumZ;
        maxX = this._maximumX; maxY = this._maximumY; maxZ = this._maximumZ;
    }

    for (; index < len; index += stride) {
        var x = vertices[index];
        var y = vertices[index + 1];
        var z = vertices[index + 2];

        if (x > maxX) maxX = x;
        else if (x < minX) minX = x;
        if (y > maxY) maxY = y;
        else if (y < minY) minY = y;
        if (z > maxZ) maxZ = z;
        else if (z < minZ) minZ = z;
    }

    this._minimumX = minX; this._minimumY = minY; this._minimumZ = minZ;
    this._maximumX = maxX; this._maximumY = maxY; this._maximumZ = maxZ;
    this._expanse = BoundingVolume.EXPANSE_FINITE;

    this._updateCenterAndExtent();
};

BoundingAABB.prototype.growToIncludeBound = function(bounds)
{
    if (bounds._expanse === BoundingVolume.EXPANSE_EMPTY || this._expanse === BoundingVolume.EXPANSE_INFINITE) return;

    if (bounds._expanse === BoundingVolume.EXPANSE_INFINITE)
        this._expanse = BoundingVolume.EXPANSE_INFINITE;

    else if (this._expanse === BoundingVolume.EXPANSE_EMPTY) {
        this._minimumX = bounds._minimumX;
        this._minimumY = bounds._minimumY;
        this._minimumZ = bounds._minimumZ;
        this._maximumX = bounds._maximumX;
        this._maximumY = bounds._maximumY;
        this._maximumZ = bounds._maximumZ;
        this._expanse = BoundingVolume.EXPANSE_FINITE;
    }
    else {
        if (bounds._minimumX < this._minimumX)
            this._minimumX = bounds._minimumX;
        if (bounds._minimumY < this._minimumY)
            this._minimumY = bounds._minimumY;
        if (bounds._minimumZ < this._minimumZ)
            this._minimumZ = bounds._minimumZ;
        if (bounds._maximumX > this._maximumX)
            this._maximumX = bounds._maximumX;
        if (bounds._maximumY > this._maximumY)
            this._maximumY = bounds._maximumY;
        if (bounds._maximumZ > this._maximumZ)
            this._maximumZ = bounds._maximumZ;
    }

    this._updateCenterAndExtent();
};

BoundingAABB.prototype.growToIncludeMinMax = function(min, max)
{
    if (this._expanse === BoundingVolume.EXPANSE_INFINITE) return;

    if (this._expanse === BoundingVolume.EXPANSE_EMPTY) {
        this._minimumX = min.x;
        this._minimumY = min.y;
        this._minimumZ = min.z;
        this._maximumX = max.x;
        this._maximumY = max.y;
        this._maximumZ = max.z;
        this._expanse = BoundingVolume.EXPANSE_FINITE;
    }
    else {
        if (min.x < this._minimumX)
            this._minimumX = min.x;
        if (min.y < this._minimumY)
            this._minimumY = min.y;
        if (min.z < this._minimumZ)
            this._minimumZ = min.z;
        if (max.x > this._maximumX)
            this._maximumX = max.x;
        if (max.y > this._maximumY)
            this._maximumY = max.y;
        if (max.z > this._maximumZ)
            this._maximumZ = max.z;
    }

    this._updateCenterAndExtent();
};

BoundingAABB.prototype.transformFrom = function(sourceBound, matrix)
{
    if (sourceBound._expanse === BoundingVolume.EXPANSE_INFINITE || sourceBound._expanse === BoundingVolume.EXPANSE_EMPTY)
        this.clear(sourceBound._expanse);
    else {
        var arr = matrix._m;
        var m00 = arr[0], m10 = arr[1], m20 = arr[2];
        var m01 = arr[4], m11 = arr[5], m21 = arr[6];
        var m02 = arr[8], m12 = arr[9], m22 = arr[10];

        var x = sourceBound._center.x;
        var y = sourceBound._center.y;
        var z = sourceBound._center.z;

        this._center.x = m00 * x + m01 * y + m02 * z + arr[12];
        this._center.y = m10 * x + m11 * y + m12 * z + arr[13];
        this._center.z = m20 * x + m21 * y + m22 * z + arr[14];

        if (m00 < 0) m00 = -m00; if (m10 < 0) m10 = -m10; if (m20 < 0) m20 = -m20;
        if (m01 < 0) m01 = -m01; if (m11 < 0) m11 = -m11; if (m21 < 0) m21 = -m21;
        if (m02 < 0) m02 = -m02; if (m12 < 0) m12 = -m12; if (m22 < 0) m22 = -m22;
        x = sourceBound._halfExtentX;
        y = sourceBound._halfExtentY;
        z = sourceBound._halfExtentZ;

        this._halfExtentX = m00 * x + m01 * y + m02 * z;
        this._halfExtentY = m10 * x + m11 * y + m12 * z;
        this._halfExtentZ = m20 * x + m21 * y + m22 * z;


        this._minimumX = this._center.x - this._halfExtentX;
        this._minimumY = this._center.y - this._halfExtentY;
        this._minimumZ = this._center.z - this._halfExtentZ;
        this._maximumX = this._center.x + this._halfExtentX;
        this._maximumY = this._center.y + this._halfExtentY;
        this._maximumZ = this._center.z + this._halfExtentZ;
        this._expanse = sourceBound._expanse;
    }
};


BoundingAABB.prototype.intersectsConvexSolid = function(cullPlanes, numPlanes)
{
    if (this._expanse === BoundingVolume.EXPANSE_INFINITE)
        return true;
    else if (this._expanse === BoundingVolume.EXPANSE_EMPTY)
        return false;

    var minX = this._minimumX, minY = this._minimumY, minZ = this._minimumZ;
    var maxX = this._maximumX, maxY = this._maximumY, maxZ = this._maximumZ;

    for (var i = 0; i < numPlanes; ++i) {
        // find the point that will always have the smallest signed distance
        var plane = cullPlanes[i];
        var planeX = plane.x, planeY = plane.y, planeZ = plane.z, planeW = plane.w;
        var closestX = planeX > 0? minX : maxX;
        var closestY = planeY > 0? minY : maxY;
        var closestZ = planeZ > 0? minZ : maxZ;

        // classify the closest point
        var signedDist = planeX * closestX + planeY * closestY + planeZ * closestZ + planeW;
        if (signedDist > 0.0)
            return false;
    }

    return true;
};

BoundingAABB.prototype.intersectsBound = function(bound)
{
    if (this._expanse === BoundingVolume.EXPANSE_EMPTY || bound._expanse === BoundingVolume.EXPANSE_EMPTY)
        return false;

    if (this._expanse === BoundingVolume.EXPANSE_INFINITE || bound._expanse === BoundingVolume.EXPANSE_INFINITE)
        return true;

    // both AABB
    if (bound._type === this._type) {
        return 	this._maximumX > bound._minimumX &&
            this._minimumX < bound._maximumX &&
            this._maximumY > bound._minimumY &&
            this._minimumY < bound._maximumY &&
            this._maximumZ > bound._minimumZ &&
            this._minimumZ < bound._maximumZ;
    }
    else {
        return BoundingVolume._testAABBToSphere(this, bound);
    }
};

BoundingAABB.prototype.classifyAgainstPlane = function(plane)
{
    var planeX = plane.x, planeY = plane.y, planeZ = plane.z, planeW = plane.w;

    var centerDist = planeX * this._center.x + planeY * this._center.y + planeZ * this._center.z + planeW;

    if (planeX < 0) planeX = -planeX;
    if (planeY < 0) planeY = -planeY;
    if (planeZ < 0) planeZ = -planeZ;

    var intersectionDist = planeX * this._halfExtentX + planeY * this._halfExtentY + planeZ * this._halfExtentZ;
    // intersectionDist is the distance to the far point
    // -intersectionDist is the distance to the closest point

    if (centerDist > intersectionDist)
        return PlaneSide.FRONT;
    if (centerDist < -intersectionDist)
        return PlaneSide.BACK;
    else
        return PlaneSide.INTERSECTING;
};

BoundingAABB.prototype.setExplicit = function(min, max)
{
    this._minimumX = min.x;
    this._minimumY = min.y;
    this._minimumZ = min.z;
    this._maximumX = max.x;
    this._maximumY = max.y;
    this._maximumZ = max.z;
    this._expanse = BoundingVolume.EXPANSE_FINITE;
    this._updateCenterAndExtent();
};

BoundingAABB.prototype._updateCenterAndExtent = function()
{
    var minX = this._minimumX; var minY = this._minimumY; var minZ = this._minimumZ;
    var maxX = this._maximumX; var maxY = this._maximumY; var maxZ = this._maximumZ;
    this._center.x = (minX + maxX) * .5;
    this._center.y = (minY + maxY) * .5;
    this._center.z = (minZ + maxZ) * .5;
    this._halfExtentX = (maxX - minX) * .5;
    this._halfExtentY = (maxY - minY) * .5;
    this._halfExtentZ = (maxZ - minZ) * .5;
};

// part of the
BoundingAABB.prototype.getRadius = function()
{
    return Math.sqrt(this._halfExtentX * this._halfExtentX + this._halfExtentY * this._halfExtentY + this._halfExtentZ * this._halfExtentZ);
};

BoundingAABB.prototype.createDebugModel = function()
{
    return new BoxPrimitive();
};

// basic version is non-hierarchical, for use with lights etc
/**
 *
 * @constructor
 */
function SceneNode()
{
    Transform.call(this);
    this._name = null;
    this._worldMatrix = new Matrix4x4();
    this._worldBoundsInvalid = true;
    this._matrixInvalid = true;
    this._worldMatrixInvalid = true;
    this._parent = null;
    this._scene = null;
    this._worldBounds = this._createBoundingVolume();
    this._debugBounds = null;
    this._visible = true;
    this._children = [];

    // used to determine sorting index for the render loop
    // models can use this to store distance to camera for more efficient rendering, lights use this to sort based on
    // intersection with near plane, etc
    this._renderOrderHint = 0.0;
}

SceneNode.prototype = Object.create(Transform.prototype, {
    name: {
        get: function()
        {
            return this._name;
        },
        set: function(value)
        {
            this._name = value;
        }
    },

    numChildren: {
        get: function() { return this._children.length; }
    },

    visible: {
        get: function()
        {
            return this._visible;
        },
        set: function(value)
        {
            this._visible = value;
        }
    },

    worldBounds: {
        get: function()
        {
            if (this._worldBoundsInvalid) {
                this._updateWorldBounds();
                this._worldBoundsInvalid = false;
            }

            return this._worldBounds;
        }
    },

    worldMatrix: {
        get: function()
        {
            if (this._worldMatrixInvalid)
                this._updateWorldMatrix();

            return this._worldMatrix;
        }
    }
});

SceneNode.prototype.attach = function(child)
{
    if (child instanceof Array) {
        var len = child.length;
        for (var i = 0; i < len; ++i) {
            this.attach(child[i]);
        }
        return;
    }

    if (child._parent)
        throw new Error("Child is already parented!");

    child._parent = this;
    child._setScene(this._scene);

    this._children.push(child);
    this._invalidateWorldBounds();
};

SceneNode.prototype.detach = function(child)
{
    var index = this._children.indexOf(child);

    if (index < 0)
        throw new Error("Trying to remove a scene object that is not a child");

    child._parent = null;

    this._children.splice(index, 1);
    this._invalidateWorldBounds();
};

SceneNode.prototype.getChild = function(index) { return this._children[index]; };

SceneNode.prototype._applyMatrix = function()
{
    Transform.prototype._applyMatrix.call(this);
    this._invalidateWorldMatrix();
};

SceneNode.prototype.findMaterialByName = function(name)
{
    var visitor = new MaterialQueryVisitor(name);
    this.acceptVisitor(visitor);
    return visitor.foundMaterial;
};

SceneNode.prototype.findNodeByName = function(name)
{
    if (this._name === name) return this;

    var len = this._children.length;
    for (var i = 0; i < len; ++i) {
        var node = this._children[i].findNodeByName(name);
        if (node) return node;
    }
};

SceneNode.prototype._setScene = function(scene)
{
    this._scene = scene;

    var len = this._children.length;

    for (var i = 0; i < len; ++i)
        this._children[i]._setScene(scene);
};

SceneNode.prototype.acceptVisitor = function(visitor)
{
    if (this._debugBounds)
        this._debugBounds.acceptVisitor(visitor);

    var len = this._children.length;
    for (var i = 0; i < len; ++i) {
        var child = this._children[i];

        if (visitor.qualifies(child))
            child.acceptVisitor(visitor);
    }
};

SceneNode.prototype._invalidateMatrix = function ()
{
    Transform.prototype._invalidateMatrix.call(this);
    this._invalidateWorldMatrix();
};

SceneNode.prototype._invalidateWorldMatrix = function ()
{
    this._worldMatrixInvalid = true;
    this._invalidateWorldBounds();

    var len = this._children.length;
    for (var i = 0; i < len; ++i)
        this._children[i]._invalidateWorldMatrix();
};

SceneNode.prototype._invalidateWorldBounds = function ()
{
    if (this._worldBoundsInvalid) return;

    this._worldBoundsInvalid = true;

    if (this._parent)
        this._parent._invalidateWorldBounds();
};

SceneNode.prototype._updateWorldBounds = function ()
{
    var len = this._children.length;

    this._worldBounds.clear();

    for (var i = 0; i < len; ++i) {
        this._worldBounds.growToIncludeBound(this._children[i].worldBounds);
    }

    if (this._debugBounds)
        this._updateDebugBounds();
};

SceneNode.prototype._updateDebugBounds = function()
{
    var matrix = this._debugBounds.matrix;
    var bounds = this._worldBounds;

    matrix.fromScale(bounds._halfExtentX * 2.0, bounds._halfExtentY * 2.0, bounds._halfExtentZ * 2.0);
    matrix.appendTranslation(bounds._center);
    this._debugBounds.matrix = matrix;
};

SceneNode.prototype._updateMatrix = function()
{
    Transform.prototype._updateMatrix.call(this);
    this._invalidateWorldBounds();
};

SceneNode.prototype._updateWorldMatrix = function()
{
    if (this._parent)
        this._worldMatrix.multiply(this._parent.worldMatrix, this.matrix);
    else
        this._worldMatrix.copyFrom(this.matrix);

    this._worldMatrixInvalid = false;
};

// override for better matches
SceneNode.prototype._createBoundingVolume = function()
{
    return new BoundingAABB();
};

SceneNode.prototype.toString = function()
{
    return "[SceneNode(name=" + this._name + ")]";
};

SceneNode.prototype.applyFunction = function(func)
{
    // Heehee, this line amuses me:
    func(this);

    var len = this._children.length;
    for (var i = 0; i < len; ++i)
        this._children[i].applyFunction(func);
};

function Entity()
{
    SceneNode.call(this);

    // components
    this._components = null;
    this._requiresUpdates = false;
    this._onRequireUpdatesChange = new Signal();

    // are managed by effect components, but need to be collectable unlike others
    this._effects = null;
}

/*Entity.create = function(components)
{
    var entity = new Entity();

    if (components) {
        var len = components.length;
        for (var i = 0; i < len; ++i)
            entity.addComponent(components[i]);
    }

    return entity;
};*/

Entity.prototype = Object.create(SceneNode.prototype);

Entity.prototype.addComponents = function(components)
{
    for (var i = 0; i < components.length; ++i)
        this.addComponent(components[i]);
};

Entity.prototype.removeComponents = function(components)
{
    for (var i = 0; i < components.length; ++i) {
        this.removeComponent(components[i]);
    }
};

Entity.prototype.hasComponentType = function(type)
{
    if (!this._components) return false;
    for (var i = 0; i < this._components.length; ++i) {
        if (this._components[i] instanceof type) return true;
    }
};

Entity.prototype.getComponentsByType = function(type)
{
    var collection = [];
    if (!this._components) return collection;
    for (var i = 0; i < this._components.length; ++i) {
        var comp = this._components[i];
        if (comp instanceof type) collection.push(comp);
    }
    return collection;
};

Entity.prototype.addComponent = function(component)
{
    if (component._entity)
        throw new Error("Component already added to an entity!");

    this._components = this._components || [];

    this._components.push(component);

    this._updateRequiresUpdates(this._requiresUpdates || (!!component.onUpdate));

    component._entity = this;
    component.onAdded();
};

Entity.prototype._updateRequiresUpdates = function(value)
{
    if (value !== this._requiresUpdates) {
        this._requiresUpdates = value;
        this._onRequireUpdatesChange.dispatch(this);
    }
};

Entity.prototype.removeComponent = function(component)
{
    component.onRemoved();

    var requiresUpdates = false;
    var len = this._components.length;
    var j = 0;
    var newComps = [];

    // not splicing since we need to regenerate _requiresUpdates anyway by looping
    for (var i = 0; i < len; ++i) {
        var c = this._components[i];
        if (c !== component) {
            newComps[j++] = c;
            requiresUpdates = requiresUpdates || !!component.onUpdate;
        }
    }

    this._components = j === 0? null : newComps;
    component._entity = null;
    this._updateRequiresUpdates(requiresUpdates);
};

Entity.prototype.acceptVisitor = function(visitor)
{
    SceneNode.prototype.acceptVisitor.call(this, visitor);

    if (this._effects)
        visitor.visitEffects(this._effects, this);
};

Entity.prototype.update = function(dt)
{
    var components = this._components;
    if (components) {
        var len = components.length;
        for (var i = 0; i < len; ++i) {
            var component = components[i];
            if (component.onUpdate) {
                component.onUpdate(dt);
            }
        }
    }
};

Entity.prototype._registerEffect = function(effect)
{
    this._effects = this._effects || [];
    this._effects.push(effect);
};

Entity.prototype._unregisterEffect = function(effect)
{
    var index = this._effects.indexOf(effect);
    this._effects.splice(index, 1);
    if (this._effects.length === 0)
        this._effects = null;
};

Entity.prototype._setScene = function(scene)
{
    if (this._scene)
        this._scene.entityEngine.unregisterEntity(this);

    if (scene)
        scene.entityEngine.registerEntity(this);

    SceneNode.prototype._setScene.call(this, scene);
};

/**
 * Subclasses must implement:
 * prototype.activate
 * prototype.prepareBatch
 * @constructor
 */
function Light()
{
    Entity.call(this);
    //this._type = this.getTypeID();
    this._intensity = 3.1415;
    this._color = new Color(1.0, 1.0, 1.0);
    this._scaledIrradiance = new Color();
    this._castShadows = false;
    this._updateScaledIrradiance();
}

Light.prototype = Object.create(Entity.prototype);

Light.prototype.acceptVisitor = function (visitor)
{
    Entity.prototype.acceptVisitor.call(this, visitor);
    visitor.visitLight(this);
};

Object.defineProperties(Light.prototype, {
    intensity: {
        get: function ()
        {
            return this._intensity;
        },

        set: function (value)
        {
            this._intensity = value;
            this._updateScaledIrradiance();
        }
    },

    color: {
        get: function ()
        {
            return this._color;
        },

        /**
         * Value can be hex or
         * @param value
         */
        set: function (value)
        {
            this._color = isNaN(value) ? value : new Color(value);
            this._updateScaledIrradiance();
        }
    }
});

Light.prototype.luminance = function ()
{
    return this._color.luminance() * this._intensity;
};

Light.prototype._updateScaledIrradiance = function ()
{
    // this includes 1/PI radiance->irradiance factor
    var scale = this._intensity / Math.PI;

    if (META.OPTIONS.useGammaCorrection)
        this._color.gammaToLinear(this._scaledIrradiance);
    else
        this._scaledIrradiance.copyFrom(this._color);

    this._scaledIrradiance.r *= scale;
    this._scaledIrradiance.g *= scale;
    this._scaledIrradiance.b *= scale;
    this._invalidateWorldBounds();
};

Light.prototype.renderDeferredLighting = function(renderer)
{
    // To implement by concrete subclasses
};

var RectMesh = {
    create: function()
    {
        var data = new MeshData();
        data.addVertexAttribute("hx_position", 2);
        data.addVertexAttribute("hx_texCoord", 2);
        data.setVertexData([-1, 1, 0, 1,
            1, 1, 1, 1,
            1, -1, 1, 0,
            -1, -1, 0, 0], 0);
        data.setIndexData([0, 1, 2, 0, 2, 3]);
        return new Mesh(data);
    },

    _initDefault: function()
    {
        RectMesh.DEFAULT = RectMesh.create();
    }
};

var TextureUtils =
{
    /**
     * Resizes a texture (empty) if its size doesn't match. Returns true if the size has changed.
     * @param width The target width
     * @param height The target height
     * @param texture The texture to be resized if necessary
     * @param fbo (optional) Any fbos to be reinitialized if necessary
     * @returns {boolean} Returns true if the texture has been resized, false otherwise.
     */
    assureSize: function(width, height, texture, fbo, format, dataType)
    {
        if (width === texture.width && height === texture.height)
            return false;

        texture.initEmpty(width, height, format, dataType);
        if (fbo) fbo.init();
        return true;
    },

    /**
     * Copies a texture into a Framebuffer.
     * @param sourceTexture The source texture to be copied.
     * @param destFBO The target FBO to copy into.
     */
    copy: function(sourceTexture, destFBO)
    {
        GL.setRenderTarget(destFBO);
        GL.clear();
        DEFAULTS.COPY_SHADER.execute(RectMesh.DEFAULT, sourceTexture);
        GL.setRenderTarget(null);
    },

    // ref: http://stackoverflow.com/questions/32633585/how-do-you-convert-to-half-floats-in-javascript
    encodeHalfFloat: function(val) {

        var floatView = new Float32Array(1);
        var int32View = new Int32Array(floatView.buffer);

        /* This method is faster than the OpenEXR implementation (very often
         * used, eg. in Ogre), with the additional benefit of rounding, inspired
         * by James Tursa?s half-precision code. */
        return function toHalf(val) {

            floatView[0] = val;
            var x = int32View[0];

            var bits = (x >> 16) & 0x8000; /* Get the sign */
            var m = (x >> 12) & 0x07ff; /* Keep one extra bit for rounding */
            var e = (x >> 23) & 0xff; /* Using int is faster here */

            /* If zero, or denormal, or exponent underflows too much for a denormal
             * half, return signed zero. */
            if (e < 103) {
                return bits;
            }

            /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
            if (e > 142) {
                bits |= 0x7c00;
                /* If exponent was 0xff and one mantissa bit was set, it means NaN,
                 * not Inf, so make sure we set one mantissa bit too. */
                bits |= ((e === 255) ? 0 : 1) && (x & 0x007fffff);
                return bits;
            }

            /* If exponent underflows but not too much, return a denormal */
            if (e < 113) {
                m |= 0x0800;
                /* Extra rounding may overflow and set mantissa to 0 and exponent
                 * to 1, which is OK. */
                bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
                return bits;
            }

            bits |= ((e - 112) << 10) | (m >> 1);
            /* Extra rounding. An overflow will set mantissa to 0 and increment
             * the exponent, which is OK. */
            bits += m & 1;
            return bits;
        };
    }(),

    encodeToFloat16Array: function(float32Array)
    {
        var encFun = TextureUtils.encodeHalfFloat;
        var arr = [];
        for (var i = 0; i < float32Array.length; ++i) {
            arr[i] = encFun(float32Array[i]);
        }
        return new Uint16Array(arr);
    }
};

/**
 *
 * @constructor
 */
function Texture2D()
{
    this._name = null;
    this._default = Texture2D.DEFAULT;
    this._texture = GL.gl.createTexture();
    this._width = 0;
    this._height = 0;
    this._format = null;
    this._dataType = null;

    this.bind();

    // set defaults
    this.maxAnisotropy = capabilities.DEFAULT_TEXTURE_MAX_ANISOTROPY;
    this.filter = TextureFilter.DEFAULT;
    this.wrapMode = TextureWrapMode.DEFAULT;

    this._isReady = false;

    GL.gl.bindTexture(GL.gl.TEXTURE_2D, null);
}

Texture2D._initDefault = function()
{
    var data = new Uint8Array([0xff, 0x00, 0xff, 0xff]);
    Texture2D.DEFAULT = new Texture2D();
    Texture2D.DEFAULT.uploadData(data, 1, 1, true);
    Texture2D.DEFAULT.filter = TextureFilter.NEAREST_NOMIP;
};

Texture2D.prototype =
{
    get name()
    {
        return this._name;
    },

    set name(value)
    {
        this._name = value;
    },

    dispose: function()
    {
        GL.gl.deleteTexture(this._texture);
        this._isReady = false;
    },

    generateMipmap: function()
    {
        var gl = GL.gl;

        this.bind();

        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    },

    get filter()
    {
        return this._filter;
    },

    set filter(filter)
    {
        var gl = GL.gl;
        this._filter = filter;
        this.bind();
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter.min);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter.mag);
        gl.bindTexture(gl.TEXTURE_2D, null);

        if (filter === TextureFilter.NEAREST_NOMIP || filter === TextureFilter.NEAREST) {
            this.maxAnisotropy = 1;
        }
    },

    get wrapMode()
    {
        return this._wrapMode;
    },

    set wrapMode(mode)
    {
        var gl = GL.gl;
        this._wrapMode = mode;
        this.bind();
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mode.s);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mode.t);
        gl.bindTexture(gl.TEXTURE_2D, null);
    },

    get maxAnisotropy()
    {
        return this._maxAnisotropy;
    },

    set maxAnisotropy(value)
    {
        var gl = GL.gl;

        if (value > capabilities.DEFAULT_TEXTURE_MAX_ANISOTROPY)
            value = capabilities.DEFAULT_TEXTURE_MAX_ANISOTROPY;

        this._maxAnisotropy = value;

        this.bind();
        if (capabilities.EXT_TEXTURE_FILTER_ANISOTROPIC)
            GL.gl.texParameteri(gl.TEXTURE_2D, capabilities.EXT_TEXTURE_FILTER_ANISOTROPIC.TEXTURE_MAX_ANISOTROPY_EXT, value);
        gl.bindTexture(gl.TEXTURE_2D, null);
    },

    get width() { return this._width; },
    get height() { return this._height; },
    get format() { return this._format; },
    get dataType() { return this._dataType; },

    initEmpty: function(width, height, format, dataType)
    {
        var gl = GL.gl;
        this._format = format = format || TextureFormat.RGBA;
        this._dataType = dataType = dataType || DataType.UNSIGNED_BYTE;

        this.bind();
        this._width = width;
        this._height = height;

        gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, dataType, null);

        this._isReady = true;

        gl.bindTexture(gl.TEXTURE_2D, null);
    },

    uploadData: function(data, width, height, generateMips, format, dataType)
    {
        var gl = GL.gl;

        if (capabilities.EXT_HALF_FLOAT_TEXTURES && dataType === capabilities.EXT_HALF_FLOAT_TEXTURES.HALF_FLOAT_OES)
            data = TextureUtils.encodeToFloat16Array(data);

        this._width = width;
        this._height = height;

        this._format = format = format || TextureFormat.RGBA;
        this._dataType = dataType = dataType || DataType.UNSIGNED_BYTE;
        generateMips = generateMips === undefined? false: generateMips;

        this.bind();

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

        gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, dataType, data);

        if (generateMips)
            gl.generateMipmap(gl.TEXTURE_2D);

        this._isReady = true;

        gl.bindTexture(gl.TEXTURE_2D, null);
    },

    uploadImage: function(image, width, height, generateMips, format, dataType)
    {
        var gl = GL.gl;

        this._width = width;
        this._height = height;

        this._format = format = format || TextureFormat.RGBA;
        this._dataType = dataType = dataType || DataType.UNSIGNED_BYTE;
        generateMips = generateMips === undefined? true: generateMips;

        this.bind();

        if (image)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

        gl.texImage2D(gl.TEXTURE_2D, 0, format, format, dataType, image);

        if (generateMips)
            gl.generateMipmap(gl.TEXTURE_2D);

        this._isReady = true;

        gl.bindTexture(gl.TEXTURE_2D, null);
    },

    isReady: function() { return this._isReady; },

    // binds a texture to a given texture unit
    bind: function(unitIndex)
    {
        var gl = GL.gl;

        if (unitIndex !== undefined) {
            gl.activeTexture(gl.TEXTURE0 + unitIndex);
        }

        gl.bindTexture(gl.TEXTURE_2D, this._texture);
    },

    toString: function()
    {
        return "[Texture2D(name=" + this._name + ")]";
    }
};

/**
 * @constructor
 */
function FrameBuffer(colorTextures, depthBuffer, cubeFace)
{
    if (colorTextures && colorTextures[0] === undefined) colorTextures = [ colorTextures ];

    this._cubeFace = cubeFace;
    this._colorTextures = colorTextures;
    this._numColorTextures = this._colorTextures? this._colorTextures.length : 0;
    this._depthBuffer = depthBuffer;

    if (this._colorTextures && this._numColorTextures > 1) {

        this._drawBuffers = new Array(this._numColorTextures);
        for (var i = 0; i < this._numColorTextures; ++i) {
            this._drawBuffers[i] = capabilities.EXT_DRAW_BUFFERS.COLOR_ATTACHMENT0_WEBGL + i;
        }
    }
    else {
        this._drawBuffers = null;
    }

    this._fbo = GL.gl.createFramebuffer();
}

FrameBuffer.prototype = {
    get width() { return this._width; },
    get height() { return this._height; },

    init: function()
    {
        var gl = GL.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);

        if (this._colorTextures) {
            if (this._cubeFace === undefined) {
                this._width = this._colorTextures[0]._width;
                this._height = this._colorTextures[0]._height;
            }
            else {
                this._height = this._width = this._colorTextures[0].size;
            }
        }
        else  {
            this._width = this._depthBuffer._width;
            this._height = this._depthBuffer._height;
        }

        for (var i = 0; i < this._numColorTextures; ++i) {
            var texture = this._colorTextures[i];
            var target = this._cubeFace === undefined? gl.TEXTURE_2D : this._cubeFace;

            if (capabilities.EXT_DRAW_BUFFERS)
                gl.framebufferTexture2D(gl.FRAMEBUFFER, capabilities.EXT_DRAW_BUFFERS.COLOR_ATTACHMENT0_WEBGL + i, target, texture._texture, 0);
            else
            // try using default (will only work for 1 color texture tho)
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, target, texture._texture, 0);
        }


        if (this._depthBuffer) {
            var attachment = this._depthBuffer.format === gl.DEPTH_STENCIL? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT;

            if (this._depthBuffer instanceof Texture2D) {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, this._depthBuffer._texture, 0);
            }
            else {
                gl.bindRenderbuffer(gl.RENDERBUFFER, this._depthBuffer._renderBuffer);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, this._depthBuffer._renderBuffer);
            }
        }

        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        switch (status) {
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                console.warn("Failed to initialize FBO: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                console.warn("Failed to initialize FBO: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                console.warn("Failed to initialize FBO: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
                break;
            case gl.FRAMEBUFFER_UNSUPPORTED:
                console.warn("Failed to initialize FBO: FRAMEBUFFER_UNSUPPORTED");
                break;
            default:
                // nothing
        }
    },

    dispose: function()
    {
        GL.gl.deleteFramebuffer(this._fbo);
    }
};

// 0) RGB: ALBEDO, (TODO, A: material ID, can be used by post-processing effects such as SSS to selectively apply if a match)
// 1) XY: NORMAL, ZW: DEPTH
// 2) X: METALLICNESS, Y: NORMAL REFLECTION, Z: ROUGHNESS, W: TBD
function GBuffer(depthBuffer)
{
    this.textures = [];
    this.fbos = [];

    for (var i = 0; i < 3; ++i) {
        var tex = new Texture2D();
        tex.filter = TextureFilter.BILINEAR_NOMIP;
        tex.wrapMode = TextureWrapMode.CLAMP;

        this.textures[i] = tex;
        this.fbos[i] = new FrameBuffer(tex, depthBuffer);
    }

    if (capabilities.GBUFFER_MRT)
        this.mrt = new FrameBuffer(this.textures, depthBuffer);
}

GBuffer.ALBEDO = 0;
GBuffer.NORMAL_DEPTH = 1;
GBuffer.SPECULAR = 2;

GBuffer.prototype = {
    resize: function(w, h)
    {
        for (var i = 0; i < 3; ++i) {
            this.textures[i].initEmpty(w, h);
            this.fbos[i].init();
        }

        if (this.mrt) this.mrt.init();
    }
};

/**
 *
 * @type {{}}
 */
var TextureSetter = {
    getSettersPerPass: function (materialPass)
    {
        if (TextureSetter._passTable === undefined)
            TextureSetter._init();

        return TextureSetter._findSetters(materialPass, TextureSetter._passTable);
    },

    getSettersPerInstance: function (materialPass)
    {
        if (TextureSetter._instanceTable === undefined)
            TextureSetter._init();

        return TextureSetter._findSetters(materialPass, TextureSetter._instanceTable);
    },

    _findSetters: function (materialPass, table)
    {
        var setters = [];
        for (var slotName in table) {
            if (!table.hasOwnProperty(slotName)) continue;
            var slot = materialPass.getTextureSlot(slotName);
            if (!slot) continue;
            var setter = new table[slotName]();
            setters.push(setter);
            setter.slot = slot;
        }

        return setters;
    },

    _init: function()
    {
        TextureSetter._passTable = {};
        TextureSetter._instanceTable = {};

        TextureSetter._passTable.hx_gbufferAlbedo = GBufferAlbedoSetter;
        TextureSetter._passTable.hx_gbufferNormalDepth = GBufferNormalDepthSetter;
        TextureSetter._passTable.hx_gbufferSpecular = GBufferSpecularSetter;
        TextureSetter._passTable.hx_backbuffer = BackbufferSetter;
        TextureSetter._passTable.hx_frontbuffer = FrontbufferSetter;
        TextureSetter._passTable.hx_lightAccumulation = LightAccumulationSetter;
        TextureSetter._passTable.hx_ssao = SSAOSetter;

        TextureSetter._instanceTable.hx_skinningTexture = SkinningTextureSetter;
    }
};


// Texture setters can be either per pass or per instance. The execute method gets passed eithter the renderer or the
// render item, respectively.

function GBufferAlbedoSetter()
{
}

GBufferAlbedoSetter.prototype.execute = function (renderer)
{
    if (renderer._gbuffer)
        this.slot.texture = renderer._gbuffer.textures[GBuffer.ALBEDO];
};


function GBufferNormalDepthSetter()
{
}

GBufferNormalDepthSetter.prototype.execute = function (renderer)
{
    if (renderer._gbuffer)
        this.slot.texture = renderer._gbuffer.textures[GBuffer.NORMAL_DEPTH];
};


function GBufferSpecularSetter()
{
}

GBufferSpecularSetter.prototype.execute = function (renderer)
{
    if (renderer._gbuffer)
        this.slot.texture = renderer._gbuffer.textures[GBuffer.SPECULAR];
};


function FrontbufferSetter()
{
}

FrontbufferSetter.prototype.execute = function (renderer)
{
    if (renderer._hdrFront)
        this.slot.texture = renderer._hdrFront.texture;
};

function BackbufferSetter()
{
}

BackbufferSetter.prototype.execute = function (renderer)
{
    if (renderer._hdrBack)
        this.slot.texture = renderer._hdrBack.texture;
};

function LightAccumulationSetter()
{
}

LightAccumulationSetter.prototype.execute = function (renderer)
{
    if (renderer._hdrBack)
        this.slot.texture = renderer._hdrBack.texture;
};


function SSAOSetter()
{
}

SSAOSetter.prototype.execute = function (renderer)
{
    this.slot.texture = renderer._ssaoTexture;
};

function SkinningTextureSetter()
{
}

SkinningTextureSetter.prototype.execute = function (renderItem)
{
    this.slot.texture = renderItem.skeletonMatrices;
};

/**
 *
 * @constructor
 */
function TextureSlot() {
    this.location = -1;
    this.texture = null;
    this.name = null;   // for debugging
    this.index = -1;
}

/**
 *
 * @param shader
 * @constructor
 */
function MaterialPass(shader)
{
    this._shader = shader;
    this._textureSlots = [];
    this._uniforms = {};
    this._elementType = ElementType.TRIANGLES;
    this._cullMode = CullMode.BACK;
    this._depthTest = Comparison.LESS_EQUAL;
    this._writeDepth = true;
    this._blendState = null;

    this._storeUniforms();
    this._textureSettersPass = TextureSetter.getSettersPerPass(this);
    this._textureSettersInstance = TextureSetter.getSettersPerInstance(this);

    // if material supports animations, this would need to be handled properly
    this._useSkinning = false;
    this.setTexture("hx_dither2D", DEFAULTS.DEFAULT_2D_DITHER_TEXTURE);
}

// these will be set upon initialization
// if a shader supports multiple lights per pass, they will take up 3 type slots (fe: 3 point lights: POINT_LIGHT_PASS, POINT_LIGHT_PASS + 1, POINT_LIGHT_PASS + 2)
MaterialPass.BASE_PASS = 0;  // used for unlit or for predefined lights

// dynamic lighting passes
MaterialPass.DIR_LIGHT_PASS = 1;
MaterialPass.DIR_LIGHT_SHADOW_PASS = 2;
MaterialPass.POINT_LIGHT_PASS = 3;
MaterialPass.LIGHT_PROBE_PASS = 4;

// shadow map generation
MaterialPass.DIR_LIGHT_SHADOW_MAP_PASS = 5;

// used if MRT is supported:
MaterialPass.GBUFFER_PASS = 6;

// used if MRT is not supported
MaterialPass.GBUFFER_ALBEDO_PASS = 6;
MaterialPass.GBUFFER_NORMAL_DEPTH_PASS = 7;
MaterialPass.GBUFFER_SPECULAR_PASS = 8;

MaterialPass.NUM_PASS_TYPES = 9;

MaterialPass.prototype =
{
    constructor: MaterialPass,

    getShader: function ()
    {
        return this._shader;
    },

    get elementType()
    {
        return this._elementType;
    },

    set elementType(value)
    {
        this._elementType = value;
    },

    get depthTest()
    {
        return this._depthTest;
    },

    set depthTest(value)
    {
        this._depthTest = value;
    },

    set writeDepth(value)
    {
        this._writeDepth = value;
    },

    get cullMode()
    {
        return this._cullMode;
    },

    // use null for disabled
    set cullMode(value)
    {
        this._cullMode = value;
    },

    get blendState()
    {
        return this._blendState;
    },

    set blendState(value)
    {
        this._blendState = value;
    },

    /**
     * Called per render item.
     * TODO: Could separate UniformSetters per pass / instance as well
     */
    updateInstanceRenderState: function(camera, renderItem)
    {
        var len = this._textureSettersInstance.length;

        for (var i = 0; i < len; ++i) {
            this._textureSettersInstance[i].execute(renderItem);
        }

        this._shader.updateInstanceRenderState(camera, renderItem);
    },

    /**
     * Only called upon activation, not per render item.
     */
    updatePassRenderState: function (camera, renderer)
    {
        var len = this._textureSettersPass.length;
        var i;
        for (i = 0; i < len; ++i) {
            this._textureSettersPass[i].execute(renderer);
        }

        len = this._textureSlots.length;

        for (i = 0; i < len; ++i) {
            var slot = this._textureSlots[i];
            var texture = slot.texture;

            if (!texture) {
                Texture2D.DEFAULT.bind(i);
                continue;
            }

            if (texture.isReady())
                texture.bind(i);
            else
                texture._default.bind(i);
        }

        GL.setCullMode(this._cullMode);
        GL.setDepthTest(this._depthTest);
        GL.setDepthMask(this._writeDepth);
        GL.setBlendState(this._blendState);

        this._shader.updatePassRenderState(camera, renderer);
    },

    _storeUniforms: function()
    {
        var gl = GL.gl;
        var len = gl.getProgramParameter(this._shader._program, gl.ACTIVE_UNIFORMS);

        for (var i = 0; i < len; ++i) {
            var uniform = gl.getActiveUniform(this._shader._program, i);
            var name = uniform.name;
            var location = gl.getUniformLocation(this._shader._program, name);
            this._uniforms[name] = {type: uniform.type, location: location, size: uniform.size};
        }
    },

    getTextureSlot: function(slotName)
    {
        if (!this._uniforms.hasOwnProperty(slotName)) return null;

        var gl = GL.gl;
        gl.useProgram(this._shader._program);

        var uniform = this._uniforms[slotName];

        if (!uniform) return;

        var location = uniform.location;

        var slot = null;

        // reuse if location is already used
        var len = this._textureSlots.length;
        for (var i = 0; i < len; ++i) {
            if (this._textureSlots[i].location === location) {
                slot = this._textureSlots[i];
                break;
            }
        }

        if (!slot) {
            var indices = new Int32Array(uniform.size);
            for (var s = 0; s < uniform.size; ++s) {
                slot = new TextureSlot();
                slot.index = i;
                slot.name = slotName;
                this._textureSlots.push(slot);
                slot.location = location;
                indices[s] = i + s;
            }

            if (uniform.size === 1) {
                gl.uniform1i(location, i);
            }
            else {
                gl.uniform1iv(location, indices);
            }
        }

        return slot;
    },

    setTexture: function(slotName, texture)
    {
        var slot = this.getTextureSlot(slotName);
        if (slot)
            slot.texture = texture;
    },

    setTextureArray: function(slotName, textures)
    {
        var firstSlot = this.getTextureSlot(slotName + "[0]");
        var location = firstSlot.location;
        if (firstSlot) {
            var len = textures.length;
            for (var i = 0; i < len; ++i) {
                var slot = this._textureSlots[firstSlot.index + i];
                // make sure we're not overshooting the array and writing to another element (larger arrays are allowed analogous to uniform arrays)
                if (!slot || slot.location !== location) return;
                slot.texture = textures[i];
            }
        }
    },

    getUniformLocation: function(name)
    {
        if (this._uniforms.hasOwnProperty(name))
            return this._uniforms[name].location;
    },

    getAttributeLocation: function(name)
    {
        return this._shader.getAttributeLocation(name);
    },

    // slow :(
    setUniformStructArray: function(name, value)
    {
        var len = value.length;
        for (var i = 0; i < len; ++i) {
            var elm = value[i];
            for (var key in elm) {
                if (elm.hasOwnProperty("key"))
                    this.setUniform(name + "[" + i + "]." + key, value);
            }
        }
    },

    setUniformArray: function(name, value)
    {
        name += "[0]";

        if (!this._uniforms.hasOwnProperty(name))
            return;

        var uniform = this._uniforms[name];
        var gl = GL.gl;
        gl.useProgram(this._shader._program);

        switch(uniform.type) {
            case gl.FLOAT:
                gl.uniform1fv(uniform.location, value);
                break;
            case gl.FLOAT_VEC2:
                gl.uniform2fv(uniform.location, value);
                break;
            case gl.FLOAT_VEC3:
                gl.uniform3fv(uniform.location, value);
                break;
            case gl.FLOAT_VEC4:
                gl.uniform4fv(uniform.location, value);
                break;
            case gl.FLOAT_MAT4:
                gl.uniformMatrix4fv(uniform.location, false, value);
                break;
            case gl.INT:
                gl.uniform1iv(uniform.location, value);
                break;
            case gl.INT_VEC2:
                gl.uniform2iv(uniform.location, value);
                break;
            case gl.INT_VEC3:
                gl.uniform3iv(uniform.location, value);
                break;
            case gl.INT_VEC4:
                gl.uniform1iv(uniform.location, value);
                break;
            case gl.BOOL:
                gl.uniform1bv(uniform.location, value);
                break;
            case gl.BOOL_VEC2:
                gl.uniform2bv(uniform.location, value);
                break;
            case gl.BOOL_VEC3:
                gl.uniform3bv(uniform.location, value);
                break;
            case gl.BOOL_VEC4:
                gl.uniform4bv(uniform.location, value);
                break;
            default:
                throw new Error("Unsupported uniform format for setting (" + uniform.type + ") for uniform '" + name + "'. May be a todo.");

        }
    },

    setUniform: function(name, value)
    {
        if (!this._uniforms.hasOwnProperty(name))
            return;

        var uniform = this._uniforms[name];

        var gl = GL.gl;
        gl.useProgram(this._shader._program);

        switch(uniform.type) {
            case gl.FLOAT:
                gl.uniform1f(uniform.location, value);
                break;
            case gl.FLOAT_VEC2:
                gl.uniform2f(uniform.location, value.x || value[0] || 0, value.y || value[1] || 0);
                break;
            case gl.FLOAT_VEC3:
                gl.uniform3f(uniform.location, value.x || value.r || value[0] || 0, value.y || value.g || value[1] || 0, value.z || value.b || value[2] || 0 );
                break;
            case gl.FLOAT_VEC4:
                gl.uniform4f(uniform.location, value.x || value.r || value[0] || 0, value.y || value.g || value[1] || 0, value.z || value.b || value[2] || 0, value.w || value.a || value[3] || 0);
                break;
            case gl.INT:
                gl.uniform1i(uniform.location, value);
                break;
            case gl.INT_VEC2:
                gl.uniform2i(uniform.location, value.x || value[0], value.y || value[1]);
                break;
            case gl.INT_VEC3:
                gl.uniform3i(uniform.location, value.x || value[0], value.y || value[1], value.z || value[2]);
                break;
            case gl.INT_VEC4:
                gl.uniform4i(uniform.location, value.x || value[0], value.y || value[1], value.z || value[2], value.w || value[3]);
                break;
            case gl.BOOL:
                gl.uniform1i(uniform.location, value);
                break;
            case gl.BOOL_VEC2:
                gl.uniform2i(uniform.location, value.x || value[0], value.y || value[1]);
                break;
            case gl.BOOL_VEC3:
                gl.uniform3i(uniform.location, value.x || value[0], value.y || value[1], value.z || value[2]);
                break;
            case gl.BOOL_VEC4:
                gl.uniform4i(uniform.location, value.x || value[0], value.y || value[1], value.z || value[2], value.w || value[3]);
                break;
            case gl.FLOAT_MAT4:
                gl.uniformMatrix4fv(uniform.location, false, value._m);
                break;
            default:
                throw new Error("Unsupported uniform format for setting. May be a todo.");

        }
    }
};

/**
 *
 * @constructor
 */
function RenderItem()
{
    this.worldMatrix = null;
    this.meshInstance = null;
    this.skeleton = null;
    this.skeletonMatrices = null;
    this.material = null;
    this.camera = null;
    this.renderOrderHint = 0;
    this.worldBounds = null;

    // to store this in a linked list for pooling
    this.next = null;
}

function RenderItemPool()
{
    var head = null;
    var pool = null;

    this.getItem = function()
    {
        var item;

        if (head) {
            item = head;
            head = head.next;
        }
        else {
            item = new RenderItem();
            item.next = pool;
            pool = item;
        }

        return item;
    };

    this.reset = function()
    {
        head = pool;
    };
}

/**
 *
 * @constructor
 */
function CascadeShadowCasterCollector()
{
    SceneVisitor.call(this);
    this._renderCameras = null;
    this._bounds = new BoundingAABB();
    this._cullPlanes = null;
    // this._splitPlanes = null;
    this._numCullPlanes = 0;
    this._renderLists = [];
    this._renderItemPool = new RenderItemPool();
}

CascadeShadowCasterCollector.prototype = Object.create(SceneVisitor.prototype);

CascadeShadowCasterCollector.prototype.getRenderList = function(index) { return this._renderLists[index]; };

CascadeShadowCasterCollector.prototype.collect = function(camera, scene)
{
    this._collectorCamera = camera;
    this._bounds.clear();
    this._renderItemPool.reset();

    var numCascades = META.OPTIONS.numShadowCascades;
    for (var i = 0; i < numCascades; ++i) {
        this._renderLists[i] = [];
    }

    scene.acceptVisitor(this);
};

CascadeShadowCasterCollector.prototype.getBounds = function()
{
    return this._bounds;
};

CascadeShadowCasterCollector.prototype.setRenderCameras = function(cameras)
{
    this._renderCameras = cameras;
};

CascadeShadowCasterCollector.prototype.setCullPlanes = function(cullPlanes, numPlanes)
{
    this._cullPlanes = cullPlanes;
    this._numCullPlanes = numPlanes;
};

// CascadeShadowCasterCollector.prototype.setSplitPlanes = function(splitPlanes)
// {
//     this._splitPlanes = splitPlanes;
// };

CascadeShadowCasterCollector.prototype.visitModelInstance = function (modelInstance, worldMatrix, worldBounds)
{
    if (modelInstance._castShadows === false) return;

    this._bounds.growToIncludeBound(worldBounds);

    var passIndex = MaterialPass.DIR_LIGHT_SHADOW_MAP_PASS;

    var numCascades = META.OPTIONS.numShadowCascades;
    var numMeshes = modelInstance.numMeshInstances;
    var skeleton = modelInstance.skeleton;
    var skeletonMatrices = modelInstance.skeletonMatrices;

    for (var cascade = 0; cascade < numCascades; ++cascade) {
        var renderList = this._renderLists[cascade];
        var renderCamera = this._renderCameras[cascade];

        var contained = worldBounds.intersectsConvexSolid(renderCamera.frustum.planes, 4);

        if (contained) {
            for (var meshIndex = 0; meshIndex < numMeshes; ++meshIndex) {
                var meshInstance = modelInstance.getMeshInstance(meshIndex);
                var material = meshInstance.material;

                if (material.hasPass(passIndex)) {
                    var renderItem = this._renderItemPool.getItem();
                    renderItem.pass = material.getPass(passIndex);
                    renderItem.meshInstance = meshInstance;
                    renderItem.worldMatrix = worldMatrix;
                    renderItem.camera = renderCamera;
                    renderItem.material = material;
                    renderItem.skeleton = skeleton;
                    renderItem.skeletonMatrices = skeletonMatrices;

                    renderList.push(renderItem);
                }
            }
        }
    }
};

CascadeShadowCasterCollector.prototype.qualifies = function(object)
{
    return object.visible && object.worldBounds.intersectsConvexSolid(this._cullPlanes, this._numCullPlanes);
};

/**
 *
 * @constructor
 */
function Frustum()
{
    this._planes = new Array(6);
    this._corners = new Array(8);

    for (var i = 0; i < 6; ++i)
        this._planes[i] = new Float4();

    for (i = 0; i < 8; ++i)
        this._corners[i] = new Float4();
}

Frustum.PLANE_LEFT = 0;
Frustum.PLANE_RIGHT = 1;
Frustum.PLANE_BOTTOM = 2;
Frustum.PLANE_TOP = 3;
Frustum.PLANE_NEAR = 4;
Frustum.PLANE_FAR = 5;

Frustum.CLIP_SPACE_CORNERS = [
    new Float4(-1.0, -1.0, -1.0, 1.0),
    new Float4(1.0, -1.0, -1.0, 1.0),
    new Float4(1.0, 1.0, -1.0, 1.0),
    new Float4(-1.0, 1.0, -1.0, 1.0),
    new Float4(-1.0, -1.0, 1.0, 1.0),
    new Float4(1.0, -1.0, 1.0, 1.0),
    new Float4(1.0, 1.0, 1.0, 1.0),
    new Float4(-1.0, 1.0, 1.0, 1.0)
];

Frustum.prototype =
    {
        /**
         * An Array of planes describing frustum. The planes are in world space and point outwards.
         */
        get planes() { return this._planes; },

        /**
         * An array containing the 8 vertices of the frustum, in world space.
         */
        get corners() { return this._corners; },

        update: function(projection, inverseProjection)
        {
            this._updatePlanes(projection);
            this._updateCorners(inverseProjection);
        },

        _updatePlanes: function(projection)
        {
            var m = projection._m;

            var left = this._planes[Frustum.PLANE_LEFT];
            var right = this._planes[Frustum.PLANE_RIGHT];
            var top = this._planes[Frustum.PLANE_TOP];
            var bottom = this._planes[Frustum.PLANE_BOTTOM];
            var near = this._planes[Frustum.PLANE_NEAR];
            var far = this._planes[Frustum.PLANE_FAR];

            var r1x = m[0], r1y = m[4], r1z = m[8], r1w = m[12];
            var r2x = m[1], r2y = m[5], r2z = m[9], r2w = m[13];
            var r3x = m[2], r3y = m[6], r3z = m[10], r3w = m[14];
            var r4x = m[3], r4y = m[7], r4z = m[11], r4w = m[15];

            left.x = -(r4x + r1x);
            left.y = -(r4y + r1y);
            left.z = -(r4z + r1z);
            left.w = -(r4w + r1w);
            left.normalizeAsPlane();

            right.x = r1x - r4x;
            right.y = r1y - r4y;
            right.z = r1z - r4z;
            right.w = r1w - r4w;
            right.normalizeAsPlane();

            bottom.x = -(r4x + r2x);
            bottom.y = -(r4y + r2y);
            bottom.z = -(r4z + r2z);
            bottom.w = -(r4w + r2w);
            bottom.normalizeAsPlane();

            top.x = r2x - r4x;
            top.y = r2y - r4y;
            top.z = r2z - r4z;
            top.w = r2w - r4w;
            top.normalizeAsPlane();

            near.x = -(r4x + r3x);
            near.y = -(r4y + r3y);
            near.z = -(r4z + r3z);
            near.w = -(r4w + r3w);
            near.normalizeAsPlane();

            far.x = r3x - r4x;
            far.y = r3y - r4y;
            far.z = r3z - r4z;
            far.w = r3w - r4w;
            far.normalizeAsPlane();
        },

        _updateCorners: function(inverseProjection)
        {
            for (var i = 0; i < 8; ++i) {
                var corner = this._corners[i];
                inverseProjection.transform(Frustum.CLIP_SPACE_CORNERS[i], corner);
                corner.scale(1.0 / corner.w);
            }
        }
    };

/**
 *
 * @constructor
 */
function Camera()
{
    Entity.call(this);

    this._renderTargetWidth = 0;
    this._renderTargetHeight = 0;
    this._viewProjectionMatrixInvalid = true;
    this._viewProjectionMatrix = new Matrix4x4();
    this._inverseProjectionMatrix = new Matrix4x4();
    this._inverseViewProjectionMatrix = new Matrix4x4();
    this._projectionMatrix = new Matrix4x4();
    this._viewMatrix = new Matrix4x4();
    this._projectionMatrixDirty = true;
    this._nearDistance = .1;
    this._farDistance = 1000;
    this._frustum = new Frustum();

    this.position.set(0.0, 0.0, 1.0);
}

Camera.prototype = Object.create(Entity.prototype, {
    nearDistance: {
        get: function() {
            return this._nearDistance;
        },

        set: function(value) {
            this._nearDistance = value;
            this._invalidateProjectionMatrix();
        }
    },
    farDistance: {
        get: function() {
            return this._farDistance;
        },

        set: function(value) {
            this._farDistance = value;
            this._invalidateProjectionMatrix();
        }
    },

    viewProjectionMatrix: {
        get: function() {
            if (this._viewProjectionMatrixInvalid)
                this._updateViewProjectionMatrix();

            return this._viewProjectionMatrix;
        }
    },

    viewMatrix: {
        get: function()
        {
            if (this._viewProjectionMatrixInvalid)
                this._updateViewProjectionMatrix();

            return this._viewMatrix;
        }
    },

    projectionMatrix: {
        get: function()
        {
            if (this._projectionMatrixDirty)
                this._updateProjectionMatrix();

            return this._projectionMatrix;
        }
    },

    inverseViewProjectionMatrix: {
        get: function()
        {
            if (this._viewProjectionMatrixInvalid)
                this._updateViewProjectionMatrix();

            return this._inverseViewProjectionMatrix;
        }
    },

    inverseProjectionMatrix: {
        get: function()
        {
            if (this._projectionMatrixDirty)
                this._updateProjectionMatrix();

            return this._inverseProjectionMatrix;
        }
    },

    frustum: {
        get: function()
        {
            if (this._viewProjectionMatrixInvalid)
                this._updateViewProjectionMatrix();

            return this._frustum;
        }
    }
});

// Camera.prototype.acceptVisitor = function(visitor)
// {
//     Entity.prototype.acceptVisitor.call(this, visitor);
// };

Camera.prototype._setRenderTargetResolution = function(width, height)
{
    this._renderTargetWidth = width;
    this._renderTargetHeight = height;
};

Camera.prototype._invalidateViewProjectionMatrix = function()
{
    this._viewProjectionMatrixInvalid = true;
};

Camera.prototype._invalidateWorldMatrix = function()
{
    Entity.prototype._invalidateWorldMatrix.call(this);
    this._invalidateViewProjectionMatrix();
};

Camera.prototype._updateViewProjectionMatrix = function()
{
    this._viewMatrix.inverseAffineOf(this.worldMatrix);
    this._viewProjectionMatrix.multiply(this.projectionMatrix, this._viewMatrix);
    this._inverseProjectionMatrix.inverseOf(this._projectionMatrix);
    this._inverseViewProjectionMatrix.inverseOf(this._viewProjectionMatrix);
    this._frustum.update(this._viewProjectionMatrix, this._inverseViewProjectionMatrix);
    this._viewProjectionMatrixInvalid = false;
};

Camera.prototype._invalidateProjectionMatrix = function()
{
    this._projectionMatrixDirty = true;
    this._invalidateViewProjectionMatrix();
};

Camera.prototype._updateProjectionMatrix = function()
{
    throw new Error("Abstract method!");
};

Camera.prototype._updateWorldBounds = function()
{
    this._worldBounds.clear(BoundingVolume.EXPANSE_INFINITE);
};

Camera.prototype.toString = function()
{
    return "[Camera(name=" + this._name + ")]";
};

/**
 * @constructor
 */
function OrthographicOffCenterCamera()
{
    Camera.call(this);
    this._left = -1;
    this._right = 1;
    this._top = 1;
    this._bottom = -1;
}

OrthographicOffCenterCamera.prototype = Object.create(Camera.prototype);

OrthographicOffCenterCamera.prototype.setBounds = function(left, right, top, bottom)
{
    this._left = left;
    this._right = right;
    this._top = top;
    this._bottom = bottom;
    this._invalidateProjectionMatrix();
};

OrthographicOffCenterCamera.prototype._updateProjectionMatrix = function()
{
    this._projectionMatrix.fromOrthographicOffCenterProjection(this._left, this._right, this._top, this._bottom, this._nearDistance, this._farDistance);
    this._projectionMatrixDirty = false;
};

/**
 * @constructor
 */
function WriteOnlyDepthBuffer()
{
    this._renderBuffer = GL.gl.createRenderbuffer();
    this._format = null;
}

WriteOnlyDepthBuffer.prototype = {
    get width() { return this._width; },
    get height() { return this._height; },
    get format() { return this._format; },

    init: function(width, height, stencil)
    {
        var gl = GL.gl;
        stencil = stencil === undefined? true : stencil;
        this._width = width;
        this._height = height;
        this._format = stencil? gl.DEPTH_STENCIL : gl.DEPTH_COMPONENT16;

        gl.bindRenderbuffer(gl.RENDERBUFFER, this._renderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, this._format, width, height);
    },

    dispose: function()
    {
        GL.gl.deleteRenderBuffer(this._renderBuffer);
    }
};

function Rect(x, y, width, height)
{
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;
}

var RenderUtils =
{
    /**
     * @param renderer The actual renderer doing the rendering.
     * @param passType
     * @param renderItems
     * @param data (optional) depending on the type of pass being rendered, data could contain extra stuff to be injected
     * For example. Dynamic dir lights will use this
     * @returns The index for the first unrendered renderItem in the list
     * @private
     */
    renderPass: function (renderer, passType, renderItems, data)
    {
        var len = renderItems.length;
        var activePass = null;
        var lastMesh = null;

        for(var i = 0; i < len; ++i) {
            var renderItem = renderItems[i];
            var material = renderItem.material;
            var pass = material.getPass(passType);
            if (!pass) continue;
            var meshInstance = renderItem.meshInstance;

            if (pass !== activePass) {
                pass.updatePassRenderState(renderItem.camera, renderer, data);
                activePass = pass;
                lastMesh = null;    // need to reset mesh data too
            }

            // make sure renderstate is propagated
            pass.updateInstanceRenderState(renderItem.camera, renderItem, data);

            if (lastMesh !== meshInstance._mesh) {
                meshInstance.updateRenderState(passType);
                lastMesh = meshInstance._mesh;
            }

            GL.drawElements(pass._elementType, meshInstance._mesh.numIndices, 0);
        }

        GL.setBlendState(null);
        return len;
    }
};

/**
 *
 * @constructor
 */
function CascadeShadowMapRenderer(light, shadowMapSize)
{
    this._light = light;
    this._shadowMapSize = shadowMapSize || 1024;
    this._shadowMapInvalid = true;
    this._fboFront = null;
    this._fboBack = null;
    this._depthBuffer = null;   // only used if depth textures aren't supported

    this._shadowMap = this._createShadowBuffer();
    this._shadowBackBuffer = DirectionalLight.SHADOW_FILTER.blurShader? this._createShadowBuffer() : null;

    this._shadowMatrices = [ new Matrix4x4(), new Matrix4x4(), new Matrix4x4(), new Matrix4x4() ];
    this._transformToUV = [ new Matrix4x4(), new Matrix4x4(), new Matrix4x4(), new Matrix4x4() ];
    this._inverseLightMatrix = new Matrix4x4();
    this._splitRatios = null;
    this._splitDistances = null;
    this._shadowMapCameras = null;
    this._collectorCamera = new OrthographicOffCenterCamera();
    this._minZ = 0;
    this._numCullPlanes = 0;
    this._cullPlanes = [];
    this._localBounds = new BoundingAABB();
    this._casterCollector = new CascadeShadowCasterCollector();

    this._initSplitProperties();
    this._initCameras();

    this._viewports = [];
}

CascadeShadowMapRenderer.prototype =
{
    get shadowMapSize()
    {
        return this._shadowMapSize;
    },

    set shadowMapSize(value)
    {
        if (this._shadowMapSize === value) return;
        this._shadowMapSize = value;
        this._invalidateShadowMap();
    },

    render: function(viewCamera, scene)
    {
        if (this._shadowMapInvalid)
            this._initShadowMap();

        this._inverseLightMatrix.inverseAffineOf(this._light.worldMatrix);
        this._updateCollectorCamera(viewCamera);
        this._updateSplits(viewCamera);
        this._updateCullPlanes(viewCamera);
        this._collectShadowCasters(scene);
        this._updateCascadeCameras(viewCamera, this._casterCollector.getBounds());

        GL.setRenderTarget(this._fboFront);
        var gl = GL.gl;

        var passType = MaterialPass.DIR_LIGHT_SHADOW_MAP_PASS;
        GL.setClearColor(Color.WHITE);
        GL.clear();

        var numCascades = META.OPTIONS.numShadowCascades;

        for (var cascadeIndex = 0; cascadeIndex < numCascades; ++cascadeIndex) {
            var viewport = this._viewports[cascadeIndex];
            gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
            RenderUtils.renderPass(this, passType, this._casterCollector.getRenderList(cascadeIndex));
        }

        if (DirectionalLight.SHADOW_FILTER.blurShader)
            this._blur();

        GL.setRenderTarget();

        GL.setClearColor(Color.BLACK);
    },

    _updateCollectorCamera: function(viewCamera)
    {
        var corners = viewCamera.frustum._corners;
        var min = new Float4();
        var max = new Float4();
        var tmp = new Float4();

        this._inverseLightMatrix.transformPoint(corners[0], min);
        max.copyFrom(min);

        for (var i = 1; i < 8; ++i) {
            this._inverseLightMatrix.transformPoint(corners[i], tmp);
            min.minimize(tmp);
            max.maximize(tmp);
        }

        this._minZ = min.z;

        this._collectorCamera.matrix.copyFrom(this._light.worldMatrix);
        this._collectorCamera._invalidateWorldMatrix();
        this._collectorCamera.setBounds(min.x, max.x + 1, max.y + 1, min.y);
        this._collectorCamera._setRenderTargetResolution(this._shadowMap._width, this._shadowMap._height);
    },

    _updateSplits: function(viewCamera)
    {
        return function(viewCamera) {
            var nearDist = viewCamera.nearDistance;
            var frustumRange = viewCamera.farDistance - nearDist;
            var numCascades = META.OPTIONS.numShadowCascades;

            for (var i = 0; i < numCascades; ++i) {
                var z = nearDist + this._splitRatios[i] * frustumRange;
                this._splitDistances[i] = -z;
            }
        }
    }(),

    _updateCascadeCameras: function(viewCamera, bounds)
    {
        this._localBounds.transformFrom(bounds, this._inverseLightMatrix);

        var minBound = this._localBounds.minimum;
        var maxBound = this._localBounds.maximum;

        var scaleSnap = 1.0;	// always scale snap to a meter

        var localNear = new Float4();
        var localFar = new Float4();
        var min = new Float4();
        var max = new Float4();

        var corners = viewCamera.frustum.corners;

        // camera distances are suboptimal? need to constrain to local near too?

        var nearRatio = 0;
        var numCascades = META.OPTIONS.numShadowCascades;
        for (var cascade = 0; cascade < numCascades; ++cascade) {
            var farRatio = this._splitRatios[cascade];
            var camera = this._shadowMapCameras[cascade];

            camera.matrix = this._light.worldMatrix;

            // figure out frustum bound
            for (var i = 0; i < 4; ++i) {
                var nearCorner = corners[i];
                var farCorner = corners[i + 4];

                var nx = nearCorner.x;
                var ny = nearCorner.y;
                var nz = nearCorner.z;
                var dx = farCorner.x - nx;
                var dy = farCorner.y - ny;
                var dz = farCorner.z - nz;
                localNear.x = nx + dx*nearRatio;
                localNear.y = ny + dy*nearRatio;
                localNear.z = nz + dz*nearRatio;
                localFar.x = nx + dx*farRatio;
                localFar.y = ny + dy*farRatio;
                localFar.z = nz + dz*farRatio;

                this._inverseLightMatrix.transformPoint(localNear, localNear);
                this._inverseLightMatrix.transformPoint(localFar, localFar);

                if (i === 0) {
                    min.copyFrom(localNear);
                    max.copyFrom(localNear);
                }
                else {
                    min.minimize(localNear);
                    max.maximize(localNear);
                }

                min.minimize(localFar);
                max.maximize(localFar);
            }

            nearRatio = farRatio;

            // do not render beyond range of view camera or scene depth
            min.z = Math.max(this._minZ, min.z);

            var left = Math.max(min.x, minBound.x);
            var right = Math.min(max.x, maxBound.x);
            var bottom = Math.max(min.y, minBound.y);
            var top = Math.min(max.y, maxBound.y);

            var width = right - left;
            var height = top - bottom;

            width = Math.ceil(width / scaleSnap) * scaleSnap;
            height = Math.ceil(height / scaleSnap) * scaleSnap;
            width = Math.max(width, scaleSnap);
            height = Math.max(height, scaleSnap);

            // snap to pixels
            var offsetSnapX = this._shadowMap._width / width * .5;
            var offsetSnapY = this._shadowMap._height / height * .5;

            left = Math.floor(left * offsetSnapX) / offsetSnapX;
            bottom = Math.floor(bottom * offsetSnapY) / offsetSnapY;
            right = left + width;
            top = bottom + height;

            var softness = DirectionalLight.SHADOW_FILTER.softness ? DirectionalLight.SHADOW_FILTER.softness : .1;

            camera.setBounds(left - softness, right + softness, top + softness, bottom - softness);

            // cannot clip nearDistance to frustum, because casters in front may cast into this frustum
            camera.nearDistance = -maxBound.z;
            camera.farDistance = -min.z;

            camera._setRenderTargetResolution(this._shadowMap._width, this._shadowMap._height);

            this._shadowMatrices[cascade].multiply(this._transformToUV[cascade], camera.viewProjectionMatrix);
        }
    },

    _updateCullPlanes: function(viewCamera)
    {
        var frustum = this._collectorCamera.frustum;
        var planes = frustum._planes;

        for (var i = 0; i < 4; ++i)
            this._cullPlanes[i] = planes[i];

        this._numCullPlanes = 4;

        frustum = viewCamera.frustum;
        planes = frustum._planes;

        var dir = this._light.direction;

        for (var j = 0; j < 6; ++j) {
            var plane = planes[j];

            // view frustum planes facing away from the light direction mark a boundary beyond which no shadows need to be known
            if (Float4.dot3(plane, dir) > 0.001)
                this._cullPlanes[this._numCullPlanes++] = plane;
        }
    },

    _collectShadowCasters: function(scene)
    {
        // this._casterCollector.setSplitPlanes(this._splitPlanes);
        this._casterCollector.setCullPlanes(this._cullPlanes, this._numCullPlanes);
        this._casterCollector.setRenderCameras(this._shadowMapCameras);
        this._casterCollector.collect(this._collectorCamera, scene);
    },

    get splitDistances()
    {
        return this._splitDistances;
    },

    /**
     * The ratios that define every cascade's split distance. Reset when numCascades change. 1 is at the far plane, 0 is at the near plane.
     * @param r1
     * @param r2
     * @param r3
     * @param r4
     */
    setSplitRatios: function(r1, r2, r3, r4)
    {
        this._splitRatios[0] = r1;
        this._splitRatios[1] = r2;
        this._splitRatios[2] = r3;
        this._splitRatios[3] = r4;
    },

    getShadowMatrix: function(cascade)
    {
        return this._shadowMatrices[cascade];
    },

    _invalidateShadowMap: function()
    {
        this._shadowMapInvalid = true;
    },

    _initShadowMap: function()
    {
        var numCascades = META.OPTIONS.numShadowCascades;
        var numMapsW = numCascades > 1? 2 : 1;
        var numMapsH = Math.ceil(numCascades / 2);

        var texWidth = this._shadowMapSize * numMapsW;
        var texHeight = this._shadowMapSize * numMapsH;

        this._shadowMap.initEmpty(texWidth, texHeight, DirectionalLight.SHADOW_FILTER.getShadowMapFormat(), DirectionalLight.SHADOW_FILTER.getShadowMapDataType());
        if (!this._depthBuffer) this._depthBuffer = new WriteOnlyDepthBuffer();
        if (!this._fboFront) this._fboFront = new FrameBuffer(this._shadowMap, this._depthBuffer);

        this._depthBuffer.init(texWidth, texHeight, false);
        this._fboFront.init();
        this._shadowMapInvalid = false;

        if (this._shadowBackBuffer) {
            this._shadowBackBuffer.initEmpty(texWidth, texHeight, DirectionalLight.SHADOW_FILTER.getShadowMapFormat(), DirectionalLight.SHADOW_FILTER.getShadowMapDataType());
            if (!this._fboBack) this._fboBack = new FrameBuffer(this._shadowBackBuffer, this._depthBuffer);
            this._fboBack.init();
        }

        this._viewports = [];
        this._viewports.push(new Rect(0, 0, this._shadowMapSize, this._shadowMapSize));
        this._viewports.push(new Rect(this._shadowMapSize, 0, this._shadowMapSize, this._shadowMapSize));
        this._viewports.push(new Rect(0, this._shadowMapSize, this._shadowMapSize, this._shadowMapSize));
        this._viewports.push(new Rect(this._shadowMapSize, this._shadowMapSize, this._shadowMapSize, this._shadowMapSize));

        this._initViewportMatrices(1.0 / numMapsW, 1.0 / numMapsH);
    },

    _initSplitProperties: function()
    {
        var ratio = 1.0;
        this._splitRatios = [];
        this._splitDistances = [];
        this._splitPlanes = [];

        for (var i = META.OPTIONS.numShadowCascades - 1; i >= 0; --i)
        {
            this._splitRatios[i] = ratio;
            this._splitPlanes[i] = new Float4();
            this._splitDistances[i] = 0;
            ratio *= .5;
        }
    },

    _initCameras: function()
    {
        this._shadowMapCameras = [];
        for (var i = 0; i < META.OPTIONS.numShadowCascades; ++i)
        {
            this._shadowMapCameras[i] = new OrthographicOffCenterCamera();
        }
    },

    _initViewportMatrices: function(scaleW, scaleH)
    {
        var halfVec = new Float4(.5,.5,.5);
        for (var i = 0; i < 4; ++i) {
            // transform [-1, 1] to [0 - 1] (also for Z)
            this._transformToUV[i].fromScale(.5);
            this._transformToUV[i].appendTranslation(halfVec);

            // transform to tiled size
            this._transformToUV[i].appendScale(scaleW, scaleH, 1.0);
        }

        this._transformToUV[1].appendTranslation(new Float4(0.5, 0.0, 0.0));
        this._transformToUV[2].appendTranslation(new Float4(0.0, 0.5, 0.0));
        this._transformToUV[3].appendTranslation(new Float4(0.5, 0.5, 0.0));
    },

    _createShadowBuffer: function()
    {
        var tex = new Texture2D();
        //tex.filter = TextureFilter.NEAREST_NOMIP;
        // while filtering doesn't actually work on encoded values, it looks much better this way since at least it can filter
        // the MSB, which is useful for ESM etc
        tex.filter = TextureFilter.BILINEAR_NOMIP;
        tex.wrapMode = TextureWrapMode.CLAMP;
        return tex;
    },

    _blur: function()
    {
        var shader = DirectionalLight.SHADOW_FILTER.blurShader;

        for (var i = 0; i < DirectionalLight.SHADOW_FILTER.numBlurPasses; ++i) {
            GL.setRenderTarget(this._fboBack);
            GL.clear();
            shader.execute(RectMesh.DEFAULT, this._shadowMap, 1.0 / this._shadowMapSize, 0.0);

            GL.setRenderTarget(this._fboFront);
            GL.clear();
            shader.execute(RectMesh.DEFAULT, this._shadowBackBuffer, 0.0, 1.0 / this._shadowMapSize);
        }
    }
};

var GLSLIncludes = {

    GENERAL:
        "precision highp float;\n\n" +
        ShaderLibrary.get("snippets_general.glsl") + "\n\n"
};

/**
 *
 * @param mode
 * @param initialDistance
 * @param decayFactor
 * @param maxTests
 * @constructor
 */
function PoissonDisk(mode, initialDistance, decayFactor, maxTests)
{
    this._mode = mode === undefined? PoissonDisk.CIRCULAR : mode;
    this._initialDistance = initialDistance || 1.0;
    this._decayFactor = decayFactor || .99;
    this._maxTests = maxTests || 20000;
    this._currentDistance = 0;
    this._points = null;
    this.reset();
}

PoissonDisk.SQUARE = 0;
PoissonDisk.CIRCULAR = 1;

PoissonDisk._initDefault = function()
{
    PoissonDisk.DEFAULT = new PoissonDisk();
    PoissonDisk.DEFAULT.generatePoints(64);
    PoissonDisk.DEFAULT_FLOAT32 = new Float32Array(64 * 2);

    var diskPoints = PoissonDisk.DEFAULT.getPoints();

    for (var i = 0; i < 64; ++i) {
        var p = diskPoints[i];
        PoissonDisk.DEFAULT_FLOAT32[i * 2] = p.x;
        PoissonDisk.DEFAULT_FLOAT32[i * 2 + 1] = p.y;
    }
};

PoissonDisk.prototype =
{
    getPoints: function()
    {
        return this._points;
    },

    reset : function()
    {
        this._currentDistance = this._initialDistance;
        this._points = [];
    },

    generatePoints: function(numPoints)
    {
        for (var i = 0; i < numPoints; ++i)
            this.generatePoint();
    },

    generatePoint: function()
    {
        for (;;) {
            var testCount = 0;
            var sqrDistance = this._currentDistance*this._currentDistance;

            while (testCount++ < this._maxTests) {
                var candidate = this._getCandidate();
                if (this._isValid(candidate, sqrDistance)) {
                    this._points.push(candidate);
                    return candidate;
                }
            }
            this._currentDistance *= this._decayFactor;
        }
    },

    _getCandidate: function()
    {
        for (;;) {
            var x = Math.random() * 2.0 - 1.0;
            var y = Math.random() * 2.0 - 1.0;
            if (this._mode === PoissonDisk.SQUARE || (x * x + y * y <= 1))
                return new Float2(x, y);
        }
    },

    _isValid: function(candidate, sqrDistance)
    {
        var len = this._points.length;
        for (var i = 0; i < len; ++i) {
            var p = this._points[i];
            var dx = candidate.x - p.x;
            var dy = candidate.y - p.y;
            if (dx*dx + dy*dy < sqrDistance)
                return false;
        }

            return true;
    }
};

/**
 * per pass setters have a method execute(camera, renderer), per instance have execute(camera, renderItem)
 * @type {{}}
 */
var UniformSetter = {

    getSettersPerInstance: function (shader)
    {
        if (UniformSetter._instanceTable === undefined)
            UniformSetter._init();

        return UniformSetter._findSetters(shader, UniformSetter._instanceTable);
    },

    getSettersPerPass: function (shader)
    {
        if (UniformSetter._passTable === undefined)
            UniformSetter._init();

        return UniformSetter._findSetters(shader, UniformSetter._passTable);
    },

    _findSetters: function (shader, table)
    {
        var setters = [];
        for (var uniformName in table) {
            var location = GL.gl.getUniformLocation(shader._program, uniformName);
            if (!location) continue;
            var setter = new table[uniformName]();
            setters.push(setter);
            setter.location = location;
        }

        return setters;
    },

    _init: function ()
    {
        UniformSetter._instanceTable = {};
        UniformSetter._passTable = {};

        UniformSetter._instanceTable.hx_worldMatrix = WorldMatrixSetter;
        UniformSetter._instanceTable.hx_worldViewMatrix = WorldViewMatrixSetter;
        UniformSetter._instanceTable.hx_wvpMatrix = WorldViewProjectionSetter;
        UniformSetter._instanceTable.hx_inverseWVPMatrix = InverseWVPSetter;
        UniformSetter._instanceTable.hx_normalWorldMatrix = NormalWorldMatrixSetter;
        UniformSetter._instanceTable.hx_normalWorldViewMatrix = NormalWorldViewMatrixSetter;
        UniformSetter._instanceTable["hx_skinningMatrices[0]"] = SkinningMatricesSetter;
        UniformSetter._instanceTable["hx_morphWeights[0]"] = MorphWeightsSetter;

        UniformSetter._passTable.hx_viewMatrix = ViewMatrixSetter;
        UniformSetter._passTable.hx_projectionMatrix = ProjectionSetter;
        UniformSetter._passTable.hx_inverseProjectionMatrix = InverseProjectionSetter;
        UniformSetter._passTable.hx_viewProjectionMatrix = ViewProjectionSetter;
        UniformSetter._passTable.hx_inverseViewProjectionMatrix = InverseViewProjectionSetter;
        UniformSetter._passTable.hx_cameraWorldPosition = CameraWorldPosSetter;
        UniformSetter._passTable.hx_cameraWorldMatrix = CameraWorldMatrixSetter;
        UniformSetter._passTable.hx_cameraFrustumRange = CameraFrustumRangeSetter;
        UniformSetter._passTable.hx_rcpCameraFrustumRange = RCPCameraFrustumRangeSetter;
        UniformSetter._passTable.hx_cameraNearPlaneDistance = CameraNearPlaneDistanceSetter;
        UniformSetter._passTable.hx_cameraFarPlaneDistance = CameraFarPlaneDistanceSetter;
        UniformSetter._passTable.hx_renderTargetResolution = RenderTargetResolutionSetter;
        UniformSetter._passTable.hx_rcpRenderTargetResolution = RCPRenderTargetResolutionSetter;
        UniformSetter._passTable.hx_dither2DTextureScale = Dither2DTextureScaleSetter;
        UniformSetter._passTable.hx_ambientColor = AmbientColorSetter;
        UniformSetter._passTable["hx_poissonDisk[0]"] = PoissonDiskSetter;
    }
};


function WorldMatrixSetter()
{
}

WorldMatrixSetter.prototype.execute = function (camera, renderItem)
{
    GL.gl.uniformMatrix4fv(this.location, false, renderItem.worldMatrix._m);
};


function ViewProjectionSetter()
{
}

ViewProjectionSetter.prototype.execute = function(camera)
{
    GL.gl.uniformMatrix4fv(this.location, false, camera.viewProjectionMatrix._m);
};

function InverseViewProjectionSetter()
{
}

InverseViewProjectionSetter.prototype.execute = function(camera)
{
    GL.gl.uniformMatrix4fv(this.location, false, camera.inverseViewProjectionMatrix._m);
};

function InverseWVPSetter()
{
}

InverseWVPSetter.prototype.execute = function(camera)
{
    GL.gl.uniformMatrix4fv(this.location, false, camera.inverseViewProjectionMatrix._m);
};

function ProjectionSetter()
{
}

ProjectionSetter.prototype.execute = function(camera)
{
    GL.gl.uniformMatrix4fv(this.location, false, camera.projectionMatrix._m);
};

function InverseProjectionSetter()
{
}

InverseProjectionSetter.prototype.execute = function(camera)
{
    GL.gl.uniformMatrix4fv(this.location, false, camera.inverseProjectionMatrix._m);
};

function WorldViewProjectionSetter()
{
}

WorldViewProjectionSetter.prototype.execute = function()
{
    var matrix = new Matrix4x4();
    var m = matrix._m;
    return function(camera, renderItem)
    {
        matrix.multiply(camera.viewProjectionMatrix, renderItem.worldMatrix);
        GL.gl.uniformMatrix4fv(this.location, false, m);
    };
}();

function WorldViewMatrixSetter()
{
    this._matrix = new Matrix4x4();
}

WorldViewMatrixSetter.prototype.execute = function(){
    var matrix = new Matrix4x4();
    var m = matrix._m;
    return function (camera, renderItem)
    {
        matrix.multiply(camera.viewMatrix, renderItem.worldMatrix);
        GL.gl.uniformMatrix4fv(this.location, false, m);
    }
}();


function NormalWorldMatrixSetter()
{
}

NormalWorldMatrixSetter.prototype.execute = function() {
    var data = new Float32Array(9);
    return function (camera, renderItem)
    {
        renderItem.worldMatrix.writeNormalMatrix(data);
        GL.gl.uniformMatrix3fv(this.location, false, data);    // transpose of inverse
    }
}();


function NormalWorldViewMatrixSetter()
{
}

NormalWorldViewMatrixSetter.prototype.execute = function() {
    var data = new Float32Array(9);
    //var matrix = new Matrix4x4();

    return function (camera, renderItem)
    {
        // the following code is the same as the following two lines, but inlined and reducing the need for all field to be multiplied
        //matrix.multiply(camera.viewMatrix, renderItem.worldMatrix);
        //matrix.writeNormalMatrix(data);

        var am = camera.viewMatrix._m;
        var bm = renderItem.worldMatrix._m;

        var a_m00 = am[0], a_m10 = am[1], a_m20 = am[2];
        var a_m01 = am[4], a_m11 = am[5], a_m21 = am[6];
        var a_m02 = am[8], a_m12 = am[9], a_m22 = am[10];
        var a_m03 = am[12], a_m13 = am[13], a_m23 = am[14];
        var b_m00 = bm[0], b_m10 = bm[1], b_m20 = bm[2], b_m30 = bm[3];
        var b_m01 = bm[4], b_m11 = bm[5], b_m21 = bm[6], b_m31 = bm[7];
        var b_m02 = bm[8], b_m12 = bm[9], b_m22 = bm[10], b_m32 = bm[11];

        var m0 = a_m00 * b_m00 + a_m01 * b_m10 + a_m02 * b_m20 + a_m03 * b_m30;
        var m1 = a_m10 * b_m00 + a_m11 * b_m10 + a_m12 * b_m20 + a_m13 * b_m30;
        var m2 = a_m20 * b_m00 + a_m21 * b_m10 + a_m22 * b_m20 + a_m23 * b_m30;
        var m4 = a_m00 * b_m01 + a_m01 * b_m11 + a_m02 * b_m21 + a_m03 * b_m31;
        var m5 = a_m10 * b_m01 + a_m11 * b_m11 + a_m12 * b_m21 + a_m13 * b_m31;
        var m6 = a_m20 * b_m01 + a_m21 * b_m11 + a_m22 * b_m21 + a_m23 * b_m31;
        var m8 = a_m00 * b_m02 + a_m01 * b_m12 + a_m02 * b_m22 + a_m03 * b_m32;
        var m9 = a_m10 * b_m02 + a_m11 * b_m12 + a_m12 * b_m22 + a_m13 * b_m32;
        var m10 = a_m20 * b_m02 + a_m21 * b_m12 + a_m22 * b_m22 + a_m23 * b_m32;

        var determinant = m0 * (m5 * m10 - m9 * m6) - m4 * (m1 * m10 - m9 * m2) + m8 * (m1 * m6 - m5 * m2);
        var rcpDet = 1.0 / determinant;

        data[0] = (m5 * m10 - m9 * m6) * rcpDet;
        data[1] = (m8 * m6 - m4 * m10) * rcpDet;
        data[2] = (m4 * m9 - m8 * m5) * rcpDet;
        data[3] = (m9 * m2 - m1 * m10) * rcpDet;
        data[4] = (m0 * m10 - m8 * m2) * rcpDet;
        data[5] = (m8 * m1 - m0 * m9) * rcpDet;
        data[6] = (m1 * m6 - m5 * m2) * rcpDet;
        data[7] = (m4 * m2 - m0 * m6) * rcpDet;
        data[8] = (m0 * m5 - m4 * m1) * rcpDet;

        GL.gl.uniformMatrix3fv(this.location, false, data);    // transpose of inverse
    }
}();

function CameraWorldPosSetter()
{
}

CameraWorldPosSetter.prototype.execute = function (camera)
{
    var arr = camera.worldMatrix._m;
    GL.gl.uniform3f(this.location, arr[12], arr[13], arr[14]);
};

function CameraWorldMatrixSetter()
{
}

CameraWorldMatrixSetter.prototype.execute = function (camera)
{
    var matrix = camera.worldMatrix;
    GL.gl.uniformMatrix4fv(this.location, false, matrix._m);
};

function CameraFrustumRangeSetter()
{
}

CameraFrustumRangeSetter.prototype.execute = function (camera)
{
    GL.gl.uniform1f(this.location, camera._farDistance - camera._nearDistance);
};

function RCPCameraFrustumRangeSetter()
{
}

RCPCameraFrustumRangeSetter.prototype.execute = function (camera)
{
    GL.gl.uniform1f(this.location, 1.0 / (camera._farDistance - camera._nearDistance));
};

function CameraNearPlaneDistanceSetter()
{
}

CameraNearPlaneDistanceSetter.prototype.execute = function (camera)
{
    GL.gl.uniform1f(this.location, camera._nearDistance);
};

function CameraFarPlaneDistanceSetter()
{
}

CameraFarPlaneDistanceSetter.prototype.execute = function (camera)
{
    GL.gl.uniform1f(this.location, camera._farDistance);
};

function ViewMatrixSetter()
{
}

ViewMatrixSetter.prototype.execute = function (camera)
{
    GL.gl.uniformMatrix4fv(this.location, false, camera.viewMatrix._m);
};

function RenderTargetResolutionSetter()
{
}

RenderTargetResolutionSetter.prototype.execute = function (camera)
{
    GL.gl.uniform2f(this.location, camera._renderTargetWidth, camera._renderTargetHeight);
};

function AmbientColorSetter()
{
}

AmbientColorSetter.prototype.execute = function (camera, renderer)
{
    var color = renderer._ambientColor;
    GL.gl.uniform3f(this.location, color.r, color.g, color.b);
};

function RCPRenderTargetResolutionSetter()
{
}

RCPRenderTargetResolutionSetter.prototype.execute = function (camera)
{
    GL.gl.uniform2f(this.location, 1.0/camera._renderTargetWidth, 1.0/camera._renderTargetHeight);
};

function Dither2DTextureScaleSetter()
{
}

Dither2DTextureScaleSetter.prototype.execute = function ()
{
    GL.gl.uniform2f(this.location, 1.0 / DEFAULTS.DEFAULT_2D_DITHER_TEXTURE.width, 1.0 / DEFAULTS.DEFAULT_2D_DITHER_TEXTURE.height);
};

function PoissonDiskSetter()
{
}

PoissonDiskSetter.prototype.execute = function ()
{
    GL.gl.uniform2fv(this.location, PoissonDisk.DEFAULT_FLOAT32);
};

function SkinningMatricesSetter()
{
    this._data = new Float32Array(OPTIONS.maxBones * 12);
}

SkinningMatricesSetter.prototype.execute = function (camera, renderItem)
{
    var skeleton = renderItem.skeleton;

    if (skeleton) {
        // TODO: Could we store the 4x3 format in renderItem.skeletonMatrices?
        // no need to store actual matrices in this data
        var matrices = renderItem.skeletonMatrices;
        var numJoints = skeleton.numJoints;
        var j = 0;

        for (var i = 0; i < numJoints; ++i) {
            matrices[i].writeData4x3(this._data, j);
            j += 12;
        }
        GL.gl.uniform4fv(this.location, this._data);
    }
};

function MorphWeightsSetter()
{
}

MorphWeightsSetter.prototype.execute = function (camera, renderItem)
{
    GL.gl.uniform1fv(this.location, renderItem.meshInstance._morphWeights);
};

var Debug = {
    printShaderCode: function(code)
    {
        var arr = code.split("\n");
        var str = "";
        for (var i = 0; i < arr.length; ++i) {
            str += (i + 1) + ":\t" + arr[i] + "\n";
        }
        console.log(str);
    },

    printSkeletonHierarchy: function(skeleton)
    {
        var str = "Skeleton: \n";
        for (var i = 0; i < skeleton.numJoints; ++i) {
            var joint = skeleton.getJoint(i);
            var name = joint.name;
            while (joint.parentIndex !== -1) {
                joint = skeleton.getJoint(joint.parentIndex);
                str += "\t";
            }
            str += "\t" + name + "\n";
        }
        console.log(str);
    },

    assert: function(bool, message)
    {
        if (!bool) throw new Error(message);
    }
};

/**
 *
 * @param vertexShaderCode
 * @param fragmentShaderCode
 * @constructor
 */
function Shader(vertexShaderCode, fragmentShaderCode)
{
    this._ready = false;
    this._vertexShader = null;
    this._fragmentShader = null;
    this._program = null;
    this._uniformSetters = null;

    if (vertexShaderCode && fragmentShaderCode)
        this.init(vertexShaderCode, fragmentShaderCode);
}

Shader.ID_COUNTER = 0;

Shader.prototype = {
    constructor: Shader,

    isReady: function() { return this._ready; },

    init: function(vertexShaderCode, fragmentShaderCode)
    {
        var gl = GL.gl;
        vertexShaderCode = GLSLIncludes.GENERAL + vertexShaderCode;
        fragmentShaderCode = GLSLIncludes.GENERAL + fragmentShaderCode;

        vertexShaderCode = this._processShaderCode(vertexShaderCode);
        fragmentShaderCode = this._processShaderCode(fragmentShaderCode);

        this._vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (!this._initShader(this._vertexShader, vertexShaderCode)) {
            this.dispose();
            if (META.OPTIONS.throwOnShaderError) {
                throw new Error("Failed generating vertex shader: \n" + vertexShaderCode);
            }
            else {
                console.warn("Failed generating vertex shader");
            }

            return;
        }

        this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!this._initShader(this._fragmentShader, fragmentShaderCode)) {
            this.dispose();
            if (META.OPTIONS.throwOnShaderError)
                throw new Error("Failed generating fragment shader: \n" + fragmentShaderCode);
            console.warn("Failed generating fragment shader:");
            return;
        }

        this._program = gl.createProgram();

        gl.attachShader(this._program, this._vertexShader);
        gl.attachShader(this._program, this._fragmentShader);
        gl.linkProgram(this._program);

        if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) {
            var log = gl.getProgramInfoLog(this._program);
            this.dispose();

            console.log("**********");
            Debug.printShaderCode(vertexShaderCode);
            console.log("**********");
            Debug.printShaderCode(fragmentShaderCode);

            if (META.OPTIONS.throwOnShaderError)
                throw new Error("Error in program linking:" + log);

            console.warn("Error in program linking:" + log);

            return;
        }

        this._ready = true;

        this._uniformSettersInstance = UniformSetter.getSettersPerInstance(this);
        this._uniformSettersPass = UniformSetter.getSettersPerPass(this);
    },

    updatePassRenderState: function(camera, renderer)
    {
        GL.gl.useProgram(this._program);

        var len = this._uniformSettersPass.length;
        for (var i = 0; i < len; ++i)
            this._uniformSettersPass[i].execute(camera, renderer);
    },

    updateInstanceRenderState: function(camera, renderItem)
    {
        var len = this._uniformSettersInstance.length;
        for (var i = 0; i < len; ++i)
            this._uniformSettersInstance[i].execute(camera, renderItem);
    },

    _initShader: function(shader, code)
    {
        var gl = GL.gl;
        gl.shaderSource(shader, code);
        gl.compileShader(shader);

        // Check the compile status, return an error if failed
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.warn(gl.getShaderInfoLog(shader));
            Debug.printShaderCode(code);
            return false;
        }

        return true;
    },

    dispose: function()
    {
        var gl = GL.gl;
        gl.deleteShader(this._vertexShader);
        gl.deleteShader(this._fragmentShader);
        gl.deleteProgram(this._program);

        this._ready = false;
    },

    getProgram: function() { return this._program; },

    getUniformLocation: function(name)
    {
        return GL.gl.getUniformLocation(this._program, name);
    },

    getAttributeLocation: function(name)
    {
        return GL.gl.getAttribLocation(this._program, name);
    },

    _processShaderCode: function(code)
    {
        code = this._processExtensions(code, /^\s*#derivatives\s*$/gm, "GL_OES_standard_derivatives");
        code = this._processExtensions(code, /^\s*#texturelod\s*$/gm, "GL_EXT_shader_texture_lod");
        code = this._processExtensions(code, /^\s*#drawbuffers\s*$/gm, "GL_EXT_draw_buffers");
        code = this._guard(code, /^uniform\s+\w+\s+hx_\w+\s*;/gm);
        code = this._guard(code, /^attribute\s+\w+\s+hx_\w+\s*;/gm);
        return code;
    },

    _processExtensions: function(code, regEx, extension)
    {
        var index = code.search(regEx);
        if (index < 0) return code;
        code = "#extension " + extension + " : enable\n" + code.replace(regEx, "");
        return code;
    },

    // this makes sure reserved uniforms are only used once, makes it easier to combine several snippets
    _guard: function(code, regEx)
    {
        var result = code.match(regEx) || [];
        var covered = {};

        for (var i = 0; i < result.length; ++i) {
            var occ = result[i];
            if (covered[occ]) continue;
            var start$$1 = occ.indexOf("hx_");
            var end = occ.indexOf(";");
            var name = occ.substring(start$$1, end);
            name = name.trim();
            covered[occ] = true;
            var defName = name.toUpperCase();
            var repl =  "#ifndef " + defName + "\n" +
                        "#define " + defName + "\n" +
                        occ + "\n" +
                        "#endif\n";
            var replReg = new RegExp(occ, "g");
            code = code.replace(replReg, repl);
        }

        return code;
    }
};

function DeferredDirectionalShader(shadows)
{
    Shader.call(this);
    var defines = {};
    if (shadows) {
        defines.HX_SHADOW_MAP = 1;
    }

    var vertex = ShaderLibrary.get("deferred_dir_light_vertex.glsl", defines);
    var fragment =
        ShaderLibrary.get("snippets_geometry.glsl", defines) + "\n" +
        META.OPTIONS.defaultLightingModel + "\n\n\n" +
        DirectionalLight.SHADOW_FILTER.getGLSL() + "\n" +
        ShaderLibrary.get("directional_light.glsl") + "\n" +
        ShaderLibrary.get("deferred_dir_light_fragment.glsl");

    this.init(vertex, fragment);

    var gl = GL.gl;
    var p = this._program;
    gl.useProgram(p);

    this._colorLocation = gl.getUniformLocation(p, "hx_directionalLight.color");
    this._dirLocation = gl.getUniformLocation(p, "hx_directionalLight.direction");

    this._positionAttributeLocation = gl.getAttribLocation(p, "hx_position");
    this._texCoordAttributeLocation = gl.getAttribLocation(p, "hx_texCoord");

    var albedoSlot = gl.getUniformLocation(p, "hx_gbufferAlbedo");
    var normalDepthSlot = gl.getUniformLocation(p, "hx_gbufferNormalDepth");
    var specularSlot = gl.getUniformLocation(p, "hx_gbufferSpecular");

    gl.uniform1i(albedoSlot, 0);
    gl.uniform1i(normalDepthSlot, 1);
    gl.uniform1i(specularSlot, 2);

    if (shadows) {
        this._shadowMatricesLocation = gl.getUniformLocation(p, "hx_directionalLight.shadowMapMatrices[0]");
        this._shadowSplitsLocation = gl.getUniformLocation(p, "hx_directionalLight.splitDistances");
        this._depthBiasLocation = gl.getUniformLocation(p, "hx_directionalLight.depthBias");
        this._maxShadowDistanceLocation = gl.getUniformLocation(p, "hx_directionalLight.maxShadowDistance");
        var shadowMapSlot = gl.getUniformLocation(p, "hx_shadowMap");
        var ditherSlot = gl.getUniformLocation(p, "hx_dither2D");
        gl.uniform1i(shadowMapSlot, 3);
        gl.uniform1i(ditherSlot, 4);
    }
}

DeferredDirectionalShader.prototype = Object.create(Shader.prototype);

DeferredDirectionalShader.prototype.execute = function(renderer, light)
{
    var dir = new Float4();
    var matrix = new Matrix4x4();
    var matrixData = new Float32Array(64);

    return function(renderer, light) {
        var gl = GL.gl;

        gl.useProgram(this._program);

        var texs = renderer._gbuffer.textures;
        texs[0].bind(0);
        texs[1].bind(1);
        texs[2].bind(2);

        var camera = renderer._camera;
        var col = light._scaledIrradiance;

        camera.viewMatrix.transformVector(light.direction, dir);
        gl.uniform3f(this._colorLocation, col.r, col.g, col.b);
        gl.uniform3f(this._dirLocation, dir.x, dir.y, dir.z);

        if (light._castShadows) {
            var shadowRenderer = light._shadowMapRenderer;
            shadowRenderer._shadowMap.bind(3);

            var shadowRenderer = light._shadowMapRenderer;
            var numCascades = META.OPTIONS.numShadowCascades;
            var splits = shadowRenderer._splitDistances;
            var k = 0;

            for (var j = 0; j < numCascades; ++j) {
                matrix.multiply(shadowRenderer.getShadowMatrix(j), camera.worldMatrix);
                var m = matrix._m;
                for (var l = 0; l < 16; ++l) {
                    matrixData[k++] = m[l];
                }
            }

            gl.uniformMatrix4fv(this._shadowMatricesLocation, false, matrixData);
            gl.uniform4f(this._shadowSplitsLocation, splits[0], splits[1], splits[2], splits[3]);
            gl.uniform1f(this._depthBiasLocation, light.depthBias);
            gl.uniform1f(this._maxShadowDistanceLocation, splits[numCascades - 1]);

            DEFAULTS.DEFAULT_2D_DITHER_TEXTURE.bind(4);
        }

        GL.setCullMode(CullMode.NONE);

        this.updatePassRenderState(camera, renderer);

        var rect = RectMesh.DEFAULT;
        rect._vertexBuffers[0].bind();
        rect._indexBuffer.bind();

        gl.vertexAttribPointer(this._positionAttributeLocation, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(this._texCoordAttributeLocation, 2, gl.FLOAT, false, 16, 8);

        GL.enableAttributes(2);

        GL.drawElements(ElementType.TRIANGLES, 6, 0);
    }
}();

/**
 *
 * @constructor
 */
function DirectionalLight()
{
    Light.call(this);

    if (!DirectionalLight._deferredShader && META.OPTIONS.defaultLightingModel)
        DirectionalLight._initDeferredShaders();

    this.depthBias = .0;
    this._shadowMapSize = 1024;
    this._shadowMapRenderer = null;
    this.direction = new Float4(-1.0, -1.0, -1.0, 0.0);
}

// set on init
DirectionalLight.SHADOW_FILTER = null;

DirectionalLight._initDeferredShaders = function()
{
    DirectionalLight._deferredShader = new DeferredDirectionalShader(false);
    DirectionalLight._deferredShadowShader = new DeferredDirectionalShader(true);
};

DirectionalLight.prototype = Object.create(Light.prototype,
    {
        castShadows: {
            get: function()
            {
                return this._castShadows;
            },

            set: function(value)
            {
                if (this._castShadows === value) return;

                this._castShadows = value;

                if (value) {
                    this._shadowMapRenderer = new CascadeShadowMapRenderer(this, this._shadowMapSize);
                }
                else {
                    this._shadowMapRenderer.dispose();
                    this._shadowMapRenderer = null;
                }
            }
        },

        shadowMapSize: {
            get: function()
            {
                return this._shadowMapSize;
            },

            set: function(value)
            {
                this._shadowMapSize = value;
                if (this._shadowMapRenderer) this._shadowMapRenderer.shadowMapSize = value;
            }
        },

        direction: {
            get: function()
            {
                var dir = this.worldMatrix.getColumn(2);
                dir.x = -dir.x;
                dir.y = -dir.y;
                dir.z = -dir.z;
                return dir;
            },

            set: function(value)
            {
                var matrix = new Matrix4x4();
                var position = this.worldMatrix.getColumn(3);
                var target = Float4.add(value, position);
                matrix.lookAt(target, position, Float4.Y_AXIS);
                this.matrix = matrix;
            }
        }
    });

/**
 * The ratios that define every cascade's split distance. Reset when numCascades change. 1 is at the far plane, 0 is at the near plane. Passing more than numCascades has no effect.
 * @param r1
 * @param r2
 * @param r3
 * @param r4
 */
DirectionalLight.prototype.setCascadeRatios = function(r1, r2, r3, r4)
{
    this._shadowMapRenderer.setSplitRatios(r1, r2, r3, r4);
};

DirectionalLight.prototype._updateWorldBounds = function()
{
    this._worldBounds.clear(BoundingVolume.EXPANSE_INFINITE);
};

DirectionalLight.prototype.renderDeferredLighting = function(renderer)
{
    var shader = this._castShadows? DirectionalLight._deferredShadowShader : DirectionalLight._deferredShader;
    shader.execute(renderer, this);
};

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if(!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    if(!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());


/**
 * Encapsulates behaviour to handle frames and time differences.
 * @constructor
 */

function FrameTicker()
{
    this._isRunning = false;
    this._callback = undefined;
    this._dt = 0;
    this._currentTime = 0;
    this.onTick = new Signal();
}

FrameTicker.prototype = {

    /**
     * Starts automatically calling a callback function every animation frame.
     * @param callback Function to call when a frame needs to be processed.
     */
    start: function(callback) {
        if (this._isRunning) return;
        this._callback = callback;
        this._currentTime = this._getTime();
        this._isRunning = true;
        this._tick();
        this._tick._this = this;
    },

    /**
     * Stops calling the function.
     */
    stop: function() {
        this._isRunning = false;
    },

    /**
     * @returns {number} The time passed in between two frames
     */
    get dt() { return this._dt; },
    get time() { return this._currentTime; },

    /**
     * @private
     */
    _tick: function() {
        if (!this._isRunning) return;

        self.requestAnimationFrame(this._tick.bind(this));

        var currentTime = this._getTime();
        this._dt = currentTime - this._currentTime;
        // IsNan (on Safari?)
        if (this._dt !== this._dt) this._dt = 0;
        this._currentTime = currentTime;

        if(this._callback)
            this._callback(this._dt);

        this.onTick.dispatch(this._dt);
    },

    /**
     * @private
     */
    _getTime: function() {
        if (self.performance === undefined || self.performance.now === undefined)
            return Date.now();
        else
            return self.performance.now();
    }
};

function ShadowFilter()
{
    this._blurShader = null;
    this._numBlurPasses = 1;
    this.onShaderInvalid = new Signal();
}

ShadowFilter.prototype =
{
    getShadowMapFormat: function()
    {
        return TextureFormat.RGBA;
    },

    getShadowMapDataType: function()
    {
        return DataType.UNSIGNED_BYTE;
    },

    getGLSL: function()
    {
        throw new Error("Abstract method called");
    },

    getCullMode: function()
    {
        return CullMode.BACK;
    },

    get blurShader()
    {
        if (!this._blurShader)
            this._blurShader = this._createBlurShader();

        return this._blurShader;
    },

    // only for those methods that use a blurShader
    get numBlurPasses()
    {
        return this._numBlurPasses;
    },

    set numBlurPasses(value)
    {
        this._numBlurPasses = value;
    },

    init: function()
    {

    },

    _createBlurShader: function()
    {

    },

    _invalidateBlurShader: function()
    {
        if (this._blurShader) {
            this._blurShader.dispose();
            this._blurShader = null;
        }
    }
};

function HardDirectionalShadowFilter()
{
    ShadowFilter.call(this);
}

HardDirectionalShadowFilter.prototype = Object.create(ShadowFilter.prototype);

HardDirectionalShadowFilter.prototype.getGLSL = function()
{
    return ShaderLibrary.get("dir_shadow_hard.glsl");
};

HardDirectionalShadowFilter.prototype.getCullMode = function()
{
    return CullMode.FRONT;
};

/**
 * You can add your own, as long as the glsl code contains a function
 * void hx_brdf(in HX_GeometryData geometry, in vec3 lightDir, in vec3 viewDir, in vec3 viewPos, in vec3 lightColor, vec3 normalSpecularReflectance, out vec3 diffuseColor, out vec3 specularColor)
 */
var LightingModel =
{
    Unlit: null,
    BlinnPhong: ShaderLibrary.get("lighting_blinn_phong.glsl"),
    GGX: ShaderLibrary.get("lighting_ggx.glsl")
};

/**
 * Base function for basic copies
 * @param fragmentShader The fragment shader to use while copying.
 * @constructor
 */
/**
 *
 * @param fragmentShader
 * @constructor
 */
function CustomCopyShader(fragmentShader)
{
    Shader.call(this);
    this.init(ShaderLibrary.get("copy_vertex.glsl"), fragmentShader);

    var gl = GL.gl;
    var textureLocation = gl.getUniformLocation(this._program, "sampler");

    this._positionAttributeLocation = gl.getAttribLocation(this._program, "hx_position");
    this._texCoordAttributeLocation = gl.getAttribLocation(this._program, "hx_texCoord");

    gl.useProgram(this._program);
    gl.uniform1i(textureLocation, 0);
}

CustomCopyShader.prototype = Object.create(Shader.prototype);

CustomCopyShader.prototype.execute = function(rect, texture)
{
    var gl = GL.gl;
    GL.setDepthTest(Comparison.DISABLED);
    GL.setCullMode(CullMode.NONE);

    rect._vertexBuffers[0].bind();
    rect._indexBuffer.bind();

    this.updatePassRenderState();

    texture.bind(0);

    gl.vertexAttribPointer(this._positionAttributeLocation, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(this._texCoordAttributeLocation, 2, gl.FLOAT, false, 16, 8);

    GL.enableAttributes(2);

    GL.drawElements(ElementType.TRIANGLES, 6, 0);
};



/**
 * Copies one texture's channels (in configurable ways) to another's.
 * @param channel Can be either x, y, z, w or any 4-component swizzle. default is xyzw, meaning a simple copy
 * @constructor
 */
function CopyChannelsShader(channel, copyAlpha)
{
    channel = channel || "xyzw";
    copyAlpha = copyAlpha === undefined? true : copyAlpha;

    var define = "#define extractChannels(src) ((src)." + channel + ")\n";

    if (copyAlpha) define += "#define COPY_ALPHA\n";

    CustomCopyShader.call(this, define + ShaderLibrary.get("copy_fragment.glsl"));
}

CopyChannelsShader.prototype = Object.create(CustomCopyShader.prototype);



/**
 * Copies the texture from linear space to gamma space.
 */
function ApplyGammaShader()
{
    CustomCopyShader.call(this, ShaderLibrary.get("copy_to_gamma_fragment.glsl"));
}

ApplyGammaShader.prototype = Object.create(CustomCopyShader.prototype);

/**
 *
 * @constructor
 */
function TextureCube()
{
    this._name = null;
    this._default = TextureCube.DEFAULT;
    this._texture = GL.gl.createTexture();
    this._size = 0;
    this._format = null;
    this._dataType = null;

    this.bind();
    this.filter = TextureFilter.DEFAULT;
    this.maxAnisotropy = capabilities.DEFAULT_TEXTURE_MAX_ANISOTROPY;

    this._isReady = false;
}

TextureCube._initDefault = function()
{
    var gl = GL.gl;
    var data = new Uint8Array([0xff, 0x00, 0xff, 0xff]);
    TextureCube.DEFAULT = new TextureCube();
    TextureCube.DEFAULT.uploadData([data, data, data, data, data, data], 1, true);
    TextureCube.DEFAULT.filter = TextureFilter.NEAREST_NOMIP;
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
};

TextureCube.prototype =
{
    get name()
    {
        return this._name;
    },

    set name(value)
    {
        this._name = value;
    },

    dispose: function()
    {
        GL.gl.deleteTexture(this._texture);
        this._isReady = false;
    },

    generateMipmap: function()
    {
        this.bind();
        var gl = GL.gl;
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    },

    get filter()
    {
        return this._filter;
    },

    set filter(filter)
    {
        this._filter = filter;
        this.bind();
        var gl = GL.gl;
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, filter.min);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, filter.mag);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    },

    get maxAnisotropy()
    {
        return this._maxAnisotropy;
    },

    set maxAnisotropy(value)
    {
        if (value > capabilities.DEFAULT_TEXTURE_MAX_ANISOTROPY)
            value = capabilities.DEFAULT_TEXTURE_MAX_ANISOTROPY;

        this._maxAnisotropy = value;

        this.bind();

        var gl = GL.gl;
        if (capabilities.EXT_TEXTURE_FILTER_ANISOTROPIC)
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, capabilities.EXT_TEXTURE_FILTER_ANISOTROPIC.TEXTURE_MAX_ANISOTROPY_EXT, value);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    },

    get size() { return this._size; },
    get format() { return this._format; },
    get dataType() { return this._dataType; },

    initEmpty: function(size, format, dataType)
    {
        this._format = format = format || TextureFormat.RGBA;
        this._dataType = dataType = dataType || DataType.UNSIGNED_BYTE;

        this._size = size;

        this.bind();

        var gl = GL.gl;
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, format, size, size, 0, format, dataType, null);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, format, size, size, 0, format, dataType, null);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, format, size, size, 0, format, dataType, null);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, format, size, size, 0, format, dataType, null);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, format, size, size, 0, format, dataType, null);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, format, size, size, 0, format, dataType, null);

        this._isReady = true;

        gl.bindTexture(gl.TEXTURE_2D, null);
    },

    uploadData: function(data, size, generateMips, format, dataType)
    {
        this._size = size;

        this._format = format = format || TextureFormat.RGBA;
        this._dataType = dataType = dataType || DataType.UNSIGNED_BYTE;
        generateMips = generateMips === undefined? true: generateMips;

        this.bind();

        var gl = GL.gl;
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, format, size, size, 0, format, dataType, data[0]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, format, size, size, 0, format, dataType, data[1]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, format, size, size, 0, format, dataType, data[2]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, format, size, size, 0, format, dataType, data[3]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, format, size, size, 0, format, dataType, data[4]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, format, size, size, 0, format, dataType, data[5]);

        if (generateMips)
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        this._isReady = true;

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    },

    uploadImages: function(images, generateMips, format, dataType)
    {
        generateMips = generateMips === undefined? true: generateMips;

        this._format = format;
        this._dataType = dataType;

        this.uploadImagesToMipLevel(images, 0, format, dataType);

        var gl = GL.gl;
        if (generateMips) {
            this.bind();
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        }

        this._isReady = true;

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    },

    uploadImagesToMipLevel: function(images, mipLevel, format, dataType)
    {
        var gl = GL.gl;
        this._format = format = format || TextureFormat.RGBA;
        this._dataType = dataType = dataType || DataType.UNSIGNED_BYTE;

        if (mipLevel === 0)
            this._size = images[0].naturalWidth;

        this.bind();

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, mipLevel, format, format, dataType, images[0]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, mipLevel, format, format, dataType, images[1]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, mipLevel, format, format, dataType, images[2]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, mipLevel, format, format, dataType, images[3]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, mipLevel, format, format, dataType, images[4]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, mipLevel, format, format, dataType, images[5]);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    },

    isReady: function() { return this._isReady; },

    // binds a texture to a given texture unit
    bind: function(unitIndex)
    {
        var gl = GL.gl;

        if (unitIndex !== undefined)
            gl.activeTexture(gl.TEXTURE0 + unitIndex);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._texture);
    },

    toString: function()
    {
        return "[TextureCube(name=" + this._name + ")]";
    }
};

function BlendState(srcFactor, dstFactor, operator, color)
{
    this.enabled = true;
    this.srcFactor = srcFactor || BlendFactor.ONE;
    this.dstFactor = dstFactor || BlendFactor.ZERO;
    this.operator = operator || BlendOperation.ADD;
    this.color = color || null;
}

BlendState.prototype = {
    clone: function() {
        return new BlendState(this.srcFactor, this.dstFactor, this.operator, this.color);
    }
};

BlendState._initDefaults = function()
{
    BlendState.ADD = new BlendState(BlendFactor.SOURCE_ALPHA, BlendFactor.ONE);
    BlendState.ADD_NO_ALPHA = new BlendState(BlendFactor.ONE, BlendFactor.ONE);
    BlendState.MULTIPLY = new BlendState(BlendFactor.DESTINATION_COLOR, BlendFactor.ZERO);
    BlendState.ALPHA = new BlendState(BlendFactor.SOURCE_ALPHA, BlendFactor.ONE_MINUS_SOURCE_ALPHA);
    BlendState.INV_ALPHA = new BlendState(BlendFactor.ONE_MINUS_SOURCE_ALPHA, BlendFactor.SOURCE_ALPHA);
};

/**
 *
 * @param mode
 * @param initialDistance
 * @param decayFactor
 * @param maxTests
 * @constructor
 */
function PoissonSphere(mode, initialDistance, decayFactor, maxTests)
{
    this._mode = mode === undefined? PoissonSphere.CIRCULAR : mode;
    this._initialDistance = initialDistance || 1.0;
    this._decayFactor = decayFactor || .99;
    this._maxTests = maxTests || 20000;
    this._currentDistance = 0;
    this._points = null;
    this.reset();
}

PoissonSphere.BOX = 0;
PoissonSphere.CIRCULAR = 1;

PoissonSphere._initDefault = function()
{
    PoissonSphere.DEFAULT = new PoissonSphere();
    PoissonSphere.DEFAULT.generatePoints(64);
    PoissonSphere.DEFAULT_FLOAT32 = new Float32Array(64 * 3);

    var spherePoints = PoissonSphere.DEFAULT.getPoints();

    for (var i = 0; i < 64; ++i) {
        var p = spherePoints[i];
        PoissonSphere.DEFAULT_FLOAT32[i * 3] = p.x;
        PoissonSphere.DEFAULT_FLOAT32[i * 3 + 1] = p.y;
        PoissonSphere.DEFAULT_FLOAT32[i * 3 + 2] = p.z;
    }
};

PoissonSphere.prototype =
{
    getPoints: function()
    {
        return this._points;
    },

    reset : function()
    {
        this._currentDistance = this._initialDistance;
        this._points = [];
    },

    generatePoints: function(numPoints)
    {
        for (var i = 0; i < numPoints; ++i)
            this.generatePoint();
    },

    generatePoint: function()
    {
        for (;;) {
            var testCount = 0;
            var sqrDistance = this._currentDistance*this._currentDistance;

            while (testCount++ < this._maxTests) {
                var candidate = this._getCandidate();
                if (this._isValid(candidate, sqrDistance)) {
                    this._points.push(candidate);
                    return candidate;
                }
            }
            this._currentDistance *= this._decayFactor;
        }
    },

    _getCandidate: function()
    {
        for (;;) {
            var x = Math.random() * 2.0 - 1.0;
            var y = Math.random() * 2.0 - 1.0;
            var z = Math.random() * 2.0 - 1.0;
            if (this._mode === PoissonSphere.BOX || (x * x + y * y + z * z <= 1))
                return new Float4(x, y, z, 0.0);
        }
    },

    _isValid: function(candidate, sqrDistance)
    {
        var len = this._points.length;
        for (var i = 0; i < len; ++i) {
            var p = this._points[i];
            var dx = candidate.x - p.x;
            var dy = candidate.y - p.y;
            var dz = candidate.z - p.z;
            if (dx*dx + dy*dy + dz*dz < sqrDistance)
                return false;
        }

        return true;
    }
};

var META =
    {
        VERSION: "0.1",
        INITIALIZED: false,
        OPTIONS: null,
        TARGET_CANVAS: null
    };

var onPreFrame = new Signal();
var onFrame = new Signal();
var frameTicker = new FrameTicker();

var DEFAULTS =
    {
        COPY_SHADER: null,
        DEFAULT_2D_DITHER_TEXTURE: null,
        DEFAULT_SKINNING_TEXTURE: null
    };

var capabilities =
    {
        // extensions:
        EXT_DRAW_BUFFERS: null,
        EXT_FLOAT_TEXTURES: null,
        EXT_HALF_FLOAT_TEXTURES: null,
        EXT_FLOAT_TEXTURES_LINEAR: null,
        EXT_HALF_FLOAT_TEXTURES_LINEAR: null,
        EXT_DEPTH_TEXTURE: null,
        EXT_STANDARD_DERIVATIVES: null,
        EXT_SHADER_TEXTURE_LOD: null,
        EXT_TEXTURE_FILTER_ANISOTROPIC: null,

        DEFAULT_TEXTURE_MAX_ANISOTROPY: 0,
        NUM_MORPH_TARGETS: 0,
        GBUFFER_MRT: false
    };

// internal options
var _HX_ = {
    GAMMA_CORRECT_LIGHTS: false,
    HDR_FORMAT: 0
};

var TextureFilter = {};
var TextureWrapMode = {};
var CullMode = {};
var StencilOp = {};
var Comparison = {};
var ElementType = {};
var BlendFactor = {};
var BlendOperation = {};
var ClearMask = {};
var TextureFormat = {};
var DataType = {};
var BufferUsage = {};

/**
 * Provides a set of options to configure Helix
 * @constructor
 */
function InitOptions()
{
    this.maxBones = 64;

    this.useSkinningTexture = true;

    // rendering pipeline options
    this.hdr = false;   // only if available
    this.useGammaCorrection = true;
    this.usePreciseGammaCorrection = false;  // Uses pow 2.2 instead of 2 for gamma correction, only valid if useGammaCorrection is true
    this.defaultLightingModel = LightingModel.Unlit;

    this.numShadowCascades = 1;
    // this.maxPointLightsPerPass = 3;
    // this.maxDirLightsPerPass = 1;

    // debug-related
    // this.debug = false;   // requires webgl-debug.js:
    this.ignoreAllExtensions = false;           // ignores all non-default extensions
    this.ignoreDrawBuffersExtension = false;     // forces multiple passes for the GBuffer
    this.ignoreDepthTexturesExtension = false;     // forces storing depth info explicitly
    this.ignoreTextureLODExtension = false;     // forces storing depth info explicitly
    this.ignoreHalfFloatTextureExtension = false;     // forces storing depth info explicitly
    this.throwOnShaderError = false;

    // will be assigned to HX.DirectionalLight.SHADOW_FILTER
    this.directionalShadowFilter = new HardDirectionalShadowFilter();
}

/**
 * Initializes Helix and creates a WebGL context from a given canvas
 * @param canvas The canvas to create the gl context from.
 */
function init(canvas, options)
{
    if (META.INITIALIZED) throw new Error("Can only initialize Helix once!");


    META.TARGET_CANVAS = canvas;

    var webglFlags = {
        antialias: false,   // we're rendering to texture by default, so native AA has no effect
        alpha: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false
    };

    var gl = canvas.getContext('webgl', webglFlags) || canvas.getContext('experimental-webgl', webglFlags);
    if (!gl) throw new Error("WebGL not supported");
    GL._setGL(gl);

    META.OPTIONS = options || new InitOptions();

    META.INITIALIZED = true;

    var glExtensions = gl.getSupportedExtensions();

    function _getExtension(name)
    {
        return glExtensions.indexOf(name) >= 0 ? gl.getExtension(name) : null;
    }

    // shortcuts
    _initGLProperties();

    _initLights();

    var options = META.OPTIONS;
    var defines = "";
    if (options.useGammaCorrection !== false)
        defines += META.OPTIONS.usePreciseGammaCorrection ? "#define HX_GAMMA_CORRECTION_PRECISE\n" : "#define HX_GAMMA_CORRECTION_FAST\n";

    defines += "#define HX_NUM_SHADOW_CASCADES " + META.OPTIONS.numShadowCascades + "\n";
    defines += "#define HX_MAX_BONES " + META.OPTIONS.maxBones + "\n";

    options.ignoreDrawBuffersExtension = options.ignoreDrawBuffersExtension || options.ignoreAllExtensions;
    options.ignoreDepthTexturesExtension = options.ignoreDepthTexturesExtension || options.ignoreAllExtensions;
    options.ignoreTextureLODExtension = options.ignoreTextureLODExtension || options.ignoreAllExtensions;
    options.ignoreHalfFloatTextureExtension = options.ignoreHalfFloatTextureExtension || options.ignoreAllExtensions;

    if (!options.ignoreDrawBuffersExtension)
        capabilities.EXT_DRAW_BUFFERS = _getExtension('WEBGL_draw_buffers');

    if (capabilities.EXT_DRAW_BUFFERS && capabilities.EXT_DRAW_BUFFERS.MAX_DRAW_BUFFERS_WEBGL >= 3) {
        capabilities.GBUFFER_MRT = true;
        // remove the last (individual) gbuffer pass
        MaterialPass.NUM_PASS_TYPES = 8;
    }

    capabilities.EXT_FLOAT_TEXTURES = _getExtension('OES_texture_float');
    if (!capabilities.EXT_FLOAT_TEXTURES) {
        console.warn('OES_texture_float extension not supported!');
        options.useSkinningTexture = false;
    }

    if (!options.ignoreHalfFloatTextureExtension)
        capabilities.EXT_HALF_FLOAT_TEXTURES = _getExtension('OES_texture_half_float');

    if (!capabilities.EXT_HALF_FLOAT_TEXTURES) console.warn('OES_texture_half_float extension not supported!');

    capabilities.EXT_FLOAT_TEXTURES_LINEAR = _getExtension('OES_texture_float_linear');
    if (!capabilities.EXT_FLOAT_TEXTURES_LINEAR) console.warn('OES_texture_float_linear extension not supported!');

    capabilities.EXT_HALF_FLOAT_TEXTURES_LINEAR = _getExtension('OES_texture_half_float_linear');
    if (!capabilities.EXT_HALF_FLOAT_TEXTURES_LINEAR) console.warn('OES_texture_half_float_linear extension not supported!');

    // these SHOULD be implemented, but are not by Chrome
    //EXT_COLOR_BUFFER_FLOAT = _getExtension('WEBGL_color_buffer_float');
    //if (!EXT_COLOR_BUFFER_FLOAT) console.warn('WEBGL_color_buffer_float extension not supported!');

    //EXT_COLOR_BUFFER_HALF_FLOAT = _getExtension('EXT_color_buffer_half_float');
    //if (!EXT_COLOR_BUFFER_HALF_FLOAT) console.warn('EXT_color_buffer_half_float extension not supported!');

    if (!options.ignoreDepthTexturesExtension)
        capabilities.EXT_DEPTH_TEXTURE = _getExtension('WEBGL_depth_texture');

    if (!capabilities.EXT_DEPTH_TEXTURE) {
        console.warn('WEBGL_depth_texture extension not supported!');
        defines += "#define HX_NO_DEPTH_TEXTURES\n";
    }

    capabilities.EXT_STANDARD_DERIVATIVES = _getExtension('OES_standard_derivatives');
    if (!capabilities.EXT_STANDARD_DERIVATIVES) console.warn('OES_standard_derivatives extension not supported!');

    if (!options.ignoreTextureLODExtension)
        capabilities.EXT_SHADER_TEXTURE_LOD = _getExtension('EXT_shader_texture_lod');

    if (capabilities.EXT_SHADER_TEXTURE_LOD)
        defines += "#define HX_TEXTURE_LOD\n";
    else
        console.warn('EXT_shader_texture_lod extension not supported!');

    capabilities.EXT_TEXTURE_FILTER_ANISOTROPIC = _getExtension('EXT_texture_filter_anisotropic');
    if (!capabilities.EXT_TEXTURE_FILTER_ANISOTROPIC) console.warn('EXT_texture_filter_anisotropic extension not supported!');

    //EXT_SRGB = _getExtension('EXT_sRGB');
    //if (!EXT_SRGB) console.warn('EXT_sRGB extension not supported!');

    capabilities.DEFAULT_TEXTURE_MAX_ANISOTROPY = capabilities.EXT_TEXTURE_FILTER_ANISOTROPIC ? gl.getParameter(capabilities.EXT_TEXTURE_FILTER_ANISOTROPIC.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;

    if (!capabilities.EXT_HALF_FLOAT_TEXTURES_LINEAR || !capabilities.EXT_HALF_FLOAT_TEXTURES)
        options.hdr = false;

    _HX_.HDR_FORMAT = options.hdr ? capabilities.EXT_HALF_FLOAT_TEXTURES.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;

    // this causes lighting accumulation to happen in gamma space (only accumulation of lights within the same pass is linear)
    // This yields an incorrect gamma correction to be applied, but looks much better due to encoding limitation (otherwise there would be banding)
    if (options.useGammaCorrection && !options.hdr) {
        _HX_.GAMMA_CORRECT_LIGHTS = true;
        defines += "#define HX_GAMMA_CORRECT_LIGHTS\n";
    }

    if (options.useSkinningTexture) {
        defines += "#define HX_USE_SKINNING_TEXTURE\n";

        _initDefaultSkinningTexture();
    }

    // this cannot be defined by the user
    capabilities.NUM_MORPH_TARGETS = 8;

    GLSLIncludes.GENERAL = defines + GLSLIncludes.GENERAL;

    // default copy shader
    DEFAULTS.COPY_SHADER = new CopyChannelsShader();

    Texture2D._initDefault();
    TextureCube._initDefault();
    BlendState._initDefaults();
    RectMesh._initDefault();
    PoissonDisk._initDefault();
    PoissonSphere._initDefault();

    _init2DDitherTexture(32, 32);

    GL.setClearColor(Color.BLACK);

    start();
}

function start()
{
    frameTicker.start(function (dt)
    {
        onPreFrame.dispatch(dt);
        _clearGLStats();
        onFrame.dispatch(dt);
    });
}

function stop()
{
    frameTicker.stop();
}

function _initLights()
{
    DirectionalLight.SHADOW_FILTER = META.OPTIONS.directionalShadowFilter;
}

function _initDefaultSkinningTexture()
{
    var gl = GL.gl;
    DEFAULTS.DEFAULT_SKINNING_TEXTURE = new Texture2D();

    var data = [];
    for (var i = 0; i < META.OPTIONS.maxBones; ++i)
        data.push(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0);

    DEFAULTS.DEFAULT_SKINNING_TEXTURE.uploadData(new Float32Array(data), META.OPTIONS.maxBones, 3, false, gl.RGBA, gl.FLOAT);
    DEFAULTS.DEFAULT_SKINNING_TEXTURE.filter = TextureFilter.NEAREST_NOMIP;
    DEFAULTS.DEFAULT_SKINNING_TEXTURE.wrapMode = TextureWrapMode.CLAMP;
}

function _init2DDitherTexture(width, height)
{
    var gl = GL.gl;
    var len = width * height;
    var minValue = 1.0 / len;
    var data = [];
    var k = 0;
    var values = [];
    var i;

    for (i = 0; i < len; ++i) {
        values.push(i / len);
    }

    ArrayUtils.shuffle(values);

    for (i = 0; i < len; ++i) {
        var angle = values[i] * Math.PI * 2.0;
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        // store rotation matrix
        // RGBA:
        data[k++] = cos;
        data[k++] = sin;
        data[k++] = minValue + values[i];
        data[k++] = 1.0;
    }

    DEFAULTS.DEFAULT_2D_DITHER_TEXTURE = new Texture2D();
    DEFAULTS.DEFAULT_2D_DITHER_TEXTURE.uploadData(new Float32Array(data), width, height, false, gl.RGBA, gl.FLOAT);
    DEFAULTS.DEFAULT_2D_DITHER_TEXTURE.filter = TextureFilter.NEAREST_NOMIP;
    DEFAULTS.DEFAULT_2D_DITHER_TEXTURE.wrapMode = TextureWrapMode.REPEAT;
}


function _initGLProperties()
{
    var gl = GL.gl;
    TextureFilter.NEAREST = {min: gl.NEAREST_MIPMAP_NEAREST, mag: gl.NEAREST};
    TextureFilter.BILINEAR = {min: gl.LINEAR_MIPMAP_NEAREST, mag: gl.LINEAR};
    TextureFilter.TRILINEAR = {min: gl.LINEAR_MIPMAP_LINEAR, mag: gl.LINEAR};

    if (capabilities.EXT_TEXTURE_FILTER_ANISOTROPIC)
        TextureFilter.TRILINEAR_ANISOTROPIC = {min: gl.LINEAR_MIPMAP_LINEAR, mag: gl.LINEAR};


    TextureFilter.NEAREST_NOMIP = {min: gl.NEAREST, mag: gl.NEAREST};
    TextureFilter.BILINEAR_NOMIP = {min: gl.LINEAR, mag: gl.LINEAR};

    TextureWrapMode.REPEAT = {s: gl.REPEAT, t: gl.REPEAT};
    TextureWrapMode.CLAMP = {s: gl.CLAMP_TO_EDGE, t: gl.CLAMP_TO_EDGE};

    // default settings:
    TextureWrapMode.DEFAULT = TextureWrapMode.REPEAT;
    TextureFilter.DEFAULT = TextureFilter.TRILINEAR;

    CullMode.NONE = null;
    CullMode.BACK = gl.BACK;
    CullMode.FRONT = gl.FRONT;
    CullMode.ALL = gl.FRONT_AND_BACK;

    StencilOp.KEEP = gl.KEEP;
    StencilOp.ZERO = gl.ZERO;
    StencilOp.REPLACE = gl.REPLACE;
    StencilOp.INCREMENT = gl.INCR;
    StencilOp.INCREMENT_WRAP = gl.INCR_WRAP;
    StencilOp.DECREMENT = gl.DECR;
    StencilOp.DECREMENT_WRAP = gl.DECR_WRAP;
    StencilOp.INVERT = gl.INVERT;

    Comparison.DISABLED = null;
    Comparison.ALWAYS = gl.ALWAYS;
    Comparison.NEVER = gl.NEVER;
    Comparison.LESS = gl.LESS;
    Comparison.EQUAL = gl.EQUAL;
    Comparison.LESS_EQUAL = gl.LEQUAL;
    Comparison.GREATER = gl.GREATER;
    Comparison.NOT_EQUAL = gl.NOTEQUAL;
    Comparison.GREATER_EQUAL = gl.GEQUAL;

    ElementType.POINTS = gl.POINTS;
    ElementType.LINES = gl.LINES;
    ElementType.LINE_STRIP = gl.LINE_STRIP;
    ElementType.LINE_LOOP = gl.LINE_LOOP;
    ElementType.TRIANGLES = gl.TRIANGLES;
    ElementType.TRIANGLE_STRIP = gl.TRIANGLE_STRIP;
    ElementType.TRIANGLE_FAN = gl.TRIANGLE_FAN;

    BlendFactor.ZERO = gl.ZERO;
    BlendFactor.ONE = gl.ONE;
    BlendFactor.SOURCE_COLOR = gl.SRC_COLOR;
    BlendFactor.ONE_MINUS_SOURCE_COLOR = gl.ONE_MINUS_SRC_COLOR;
    BlendFactor.DESTINATION_COLOR = gl.DST_COLOR;
    BlendFactor.ONE_MINUS_DESTINATION_COLOR = gl.ONE_MINUS_DST_COLOR;
    BlendFactor.SOURCE_ALPHA = gl.SRC_ALPHA;
    BlendFactor.ONE_MINUS_SOURCE_ALPHA = gl.ONE_MINUS_SRC_ALPHA;
    BlendFactor.DESTINATION_ALPHA = gl.DST_ALPHA;
    BlendFactor.ONE_MINUS_DESTINATION_ALPHA = gl.ONE_MINUS_DST_ALPHA;
    BlendFactor.SOURCE_ALPHA_SATURATE = gl.SRC_ALPHA_SATURATE;
    BlendFactor.CONSTANT_ALPHA = gl.CONSTANT_ALPHA;
    BlendFactor.ONE_MINUS_CONSTANT_ALPHA = gl.ONE_MINUS_CONSTANT_ALPHA;

    BlendOperation.ADD = gl.FUNC_ADD;
    BlendOperation.SUBTRACT = gl.FUNC_SUBTRACT;
    BlendOperation.REVERSE_SUBTRACT = gl.FUNC_REVERSE_SUBTRACT;

    ClearMask.COLOR = gl.COLOR_BUFFER_BIT;
    ClearMask.STENCIL = gl.STENCIL_BUFFER_BIT;
    ClearMask.BUFFER = gl.DEPTH_BUFFER_BIT;
    ClearMask.COMPLETE = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT;

    TextureFormat.RGBA = gl.RGBA;
    TextureFormat.RGB = gl.RGB;

    DataType.UNSIGNED_BYTE = gl.UNSIGNED_BYTE;
    DataType.UNSIGNED_SHORT = gl.UNSIGNED_SHORT;
    DataType.UNSIGNED_INT = gl.UNSIGNED_INT;
    DataType.FLOAT = gl.FLOAT;

    BufferUsage.STATIC_DRAW = gl.STATIC_DRAW;
}

var Gaussian =
{
    estimateGaussianRadius: function (variance, epsilon)
    {
        return Math.sqrt(-2.0 * variance * Math.log(epsilon));
    }
};

function CenteredGaussianCurve(variance)
{
    this._amplitude = 1.0 / Math.sqrt(2.0 * variance * Math.PI);
    this._expScale = -1.0 / (2.0 * variance);
}

CenteredGaussianCurve.prototype =
{
    getValueAt: function(x)
    {
        return this._amplitude * Math.pow(Math.E, x*x*this._expScale);
    }
};

CenteredGaussianCurve.fromRadius = function(radius, epsilon)
{
    epsilon = epsilon || .01;
    var standardDeviation = radius / Math.sqrt(-2.0 * Math.log(epsilon));
    return new CenteredGaussianCurve(standardDeviation*standardDeviation);
};

function SpherePrimitive(definition)
{
    Primitive.call(this, definition);
}

SpherePrimitive.prototype = Object.create(Primitive.prototype);

SpherePrimitive.prototype._generate = function(target, definition)
{
    definition = definition || {};
    var numSegmentsW = definition.numSegmentsW || 16;
    var numSegmentsH = definition.numSegmentsH || 10;
    var radius = definition.radius || .5;

    var flipSign = definition.invert? -1 : 1;

    var doubleSided = definition.doubleSided === undefined? false : definition.doubleSided;

    var positions = target.positions;
    var uvs = target.uvs;
    var normals = target.normals;

    var rcpNumSegmentsW = 1/numSegmentsW;
    var rcpNumSegmentsH = 1/numSegmentsH;

    for (var polarSegment = 0; polarSegment <= numSegmentsH; ++polarSegment) {
        var ratioV = polarSegment * rcpNumSegmentsH;
        var theta = ratioV * Math.PI;

        var y = -Math.cos(theta);
        var segmentUnitRadius = Math.sin(theta);

        if (flipSign < 0) ratioV = 1.0 - ratioV;

        for (var azimuthSegment = 0; azimuthSegment <= numSegmentsW; ++azimuthSegment) {
            var ratioU = azimuthSegment * rcpNumSegmentsW;
            var phi = ratioU * Math.PI * 2.0;

            if (flipSign) ratioU = 1.0 - ratioU;

            var normalX = Math.cos(phi) * segmentUnitRadius * flipSign;
            var normalY = y * flipSign;
            var normalZ = Math.sin(phi) * segmentUnitRadius * flipSign;

            // position
            positions.push(normalX*radius, normalY*radius, normalZ*radius);

            if (normals)
                normals.push(normalX * flipSign, normalY * flipSign, normalZ * flipSign);

            if (uvs)
                uvs.push(ratioU, ratioV);
        }
    }

    var indices = target.indices;

    for (polarSegment = 0; polarSegment < numSegmentsH; ++polarSegment) {
        for (azimuthSegment = 0; azimuthSegment < numSegmentsW; ++azimuthSegment) {
            var w = numSegmentsW + 1;
            var base = azimuthSegment + polarSegment*w;

            indices.push(base, base + w, base + w + 1);
            indices.push(base, base + w + 1, base + 1);

            if (doubleSided) {
                indices.push(base, base + w + 1, base + w);
                indices.push(base, base + 1, base + w + 1);
            }
        }
    }
};

/**
 *
 * @constructor
 */
function BoundingSphere()
{
    BoundingVolume.call(this, BoundingSphere);
}

BoundingSphere.prototype = Object.create(BoundingVolume.prototype);

BoundingSphere.prototype.setExplicit = function(center, radius)
{
    this._center.copyFrom(center);
    this._halfExtentX = this._halfExtentY = this._halfExtentZ = radius;
    this._expanse = BoundingVolume.EXPANSE_FINITE;
    this._updateMinAndMax();
};

BoundingSphere.prototype.growToIncludeMesh = function(meshData)
{
    if (this._expanse === BoundingVolume.EXPANSE_INFINITE) return;

    var attribute = meshData.getVertexAttribute("hx_position");
    var index = attribute.offset;
    var stride = meshData.getVertexStride(attribute.streamIndex);
    var vertices = attribute.getVertexData(attribute.streamIndex);
    var len = vertices.length;
    var minX, minY, minZ;
    var maxX, maxY, maxZ;

    if (this._expanse === BoundingVolume.EXPANSE_EMPTY) {
        maxX = minX = vertices[index];
        maxY = minY = vertices[index + 1];
        maxZ = minZ = vertices[index + 2];
        index += stride;
    }
    else {
        minX = this._minimumX; minY = this._minimumY; minZ = this._minimumZ;
        maxX = this._maximumX; maxY = this._maximumY; maxZ = this._maximumZ;
    }

    for (; index < len; index += stride) {
        var x = vertices[index];
        var y = vertices[index + 1];
        var z = vertices[index + 2];

        if (x > maxX) maxX = x;
        else if (x < minX) minX = x;
        if (y > maxY) maxY = y;
        else if (y < minY) minY = y;
        if (z > maxZ) maxZ = z;
        else if (z < minZ) minZ = z;
    }
    var centerX = (maxX + minX) * .5;
    var centerY = (maxY + minY) * .5;
    var centerZ = (maxZ + minZ) * .5;
    var maxSqrRadius = 0.0;

    index = attribute.offset;
    for (; index < len; index += stride) {
        var dx = centerX - vertices[index];
        var dy = centerY - vertices[index + 1];
        var dz = centerZ - vertices[index + 2];
        var sqrRadius = dx*dx + dy*dy + dz*dz;
        if (sqrRadius > maxSqrRadius) maxSqrRadius = sqrRadius;
    }

    this._center.x = centerX;
    this._center.y = centerY;
    this._center.z = centerZ;

    var radius = Math.sqrt(maxSqrRadius);
    this._halfExtentX = radius;
    this._halfExtentY = radius;
    this._halfExtentZ = radius;

    this._expanse = BoundingVolume.EXPANSE_FINITE;

    this._updateMinAndMax();
};

BoundingSphere.prototype.growToIncludeBound = function(bounds)
{
    if (bounds._expanse === BoundingVolume.EXPANSE_EMPTY || this._expanse === BoundingVolume.EXPANSE_INFINITE) return;

    if (bounds._expanse === BoundingVolume.EXPANSE_INFINITE)
        this._expanse = BoundingVolume.EXPANSE_INFINITE;

    else if (this._expanse === BoundingVolume.EXPANSE_EMPTY) {
        this._center.x = bounds._center.x;
        this._center.y = bounds._center.y;
        this._center.z = bounds._center.z;
        if (bounds._type === this._type) {
            this._halfExtentX = bounds._halfExtentX;
            this._halfExtentY = bounds._halfExtentY;
            this._halfExtentZ = bounds._halfExtentZ;
        }
        else {
            this._halfExtentX = this._halfExtentY = this._halfExtentZ = bounds.getRadius();
        }
        this._expanse = BoundingVolume.EXPANSE_FINITE;
    }

    else {
        var minX = this._minimumX; var minY = this._minimumY; var minZ = this._minimumZ;
        var maxX = this._maximumX; var maxY = this._maximumY; var maxZ = this._maximumZ;

        if (bounds._maximumX > maxX)
            maxX = bounds._maximumX;
        if (bounds._maximumY > maxY)
            maxY = bounds._maximumY;
        if (bounds._maximumZ > maxZ)
            maxZ = bounds._maximumZ;
        if (bounds._minimumX < minX)
            minX = bounds._minimumX;
        if (bounds._minimumY < minY)
            minY = bounds._minimumY;
        if (bounds._minimumZ < minZ)
            minZ = bounds._minimumZ;

        this._center.x = (minX + maxX) * .5;
        this._center.y = (minY + maxY) * .5;
        this._center.z = (minZ + maxZ) * .5;

        var dx = maxX - this._center.x;
        var dy = maxY - this._center.y;
        var dz = maxZ - this._center.z;
        var radius = Math.sqrt(dx*dx + dy*dy + dz*dz);
        this._halfExtentX = this._halfExtentY = this._halfExtentZ = radius;
    }

    this._updateMinAndMax();
};

BoundingSphere.prototype.growToIncludeMinMax = function(min, max)
{
    // temp solution, not run-time perf critical
    var aabb = new BoundingAABB();
    aabb.growToIncludeMinMax(min, max);
    this.growToIncludeBound(aabb);
};

BoundingSphere.prototype.getRadius = function()
{
    return this._halfExtentX;
};

BoundingSphere.prototype.transformFrom = function(sourceBound, matrix)
{
    if (sourceBound._expanse === BoundingVolume.EXPANSE_INFINITE || sourceBound._expanse === BoundingVolume.EXPANSE_EMPTY)
        this.clear(sourceBound._expanse);
    else {
        var arr = matrix._m;
        var m00 = arr[0], m10 = arr[1], m20 = arr[2];
        var m01 = arr[4], m11 = arr[5], m21 = arr[6];
        var m02 = arr[8], m12 = arr[9], m22 = arr[10];

        var x = sourceBound._center.x;
        var y = sourceBound._center.y;
        var z = sourceBound._center.z;

        this._center.x = m00 * x + m01 * y + m02 * z + arr[12];
        this._center.y = m10 * x + m11 * y + m12 * z + arr[13];
        this._center.z = m20 * x + m21 * y + m22 * z + arr[14];


        if (m00 < 0) m00 = -m00; if (m10 < 0) m10 = -m10; if (m20 < 0) m20 = -m20;
        if (m01 < 0) m01 = -m01; if (m11 < 0) m11 = -m11; if (m21 < 0) m21 = -m21;
        if (m02 < 0) m02 = -m02; if (m12 < 0) m12 = -m12; if (m22 < 0) m22 = -m22;
        x = sourceBound._halfExtentX;
        y = sourceBound._halfExtentY;
        z = sourceBound._halfExtentZ;

        var hx = m00 * x + m01 * y + m02 * z;
        var hy = m10 * x + m11 * y + m12 * z;
        var hz = m20 * x + m21 * y + m22 * z;

        var radius = Math.sqrt(hx * hx + hy * hy + hz * hz);
        this._halfExtentX = this._halfExtentY = this._halfExtentZ = radius;

        this._minimumX = this._center.x - this._halfExtentX;
        this._minimumY = this._center.y - this._halfExtentY;
        this._minimumZ = this._center.z - this._halfExtentZ;
        this._maximumX = this._center.x + this._halfExtentX;
        this._maximumY = this._center.y + this._halfExtentY;
        this._maximumZ = this._center.z + this._halfExtentZ;

        this._expanse = BoundingVolume.EXPANSE_FINITE;
    }
};

BoundingSphere.prototype.intersectsConvexSolid = function(cullPlanes, numPlanes)
{
    if (this._expanse === BoundingVolume.EXPANSE_INFINITE)
        return true;
    else if (this._expanse === BoundingVolume.EXPANSE_EMPTY)
        return false;

    var centerX = this._center.x, centerY = this._center.y, centerZ = this._center.z;
    var radius = this._halfExtentX;

    for (var i = 0; i < numPlanes; ++i) {
        var plane = cullPlanes[i];
        var signedDist = plane.x * centerX + plane.y * centerY + plane.z * centerZ + plane.w;

        if (signedDist > radius)
            return false;
    }

    return true;
};

BoundingSphere.prototype.intersectsBound = function(bound)
{
    if (this._expanse === BoundingVolume.EXPANSE_EMPTY || bound._expanse === BoundingVolume.EXPANSE_EMPTY)
        return false;

    if (this._expanse === BoundingVolume.EXPANSE_INFINITE || bound._expanse === BoundingVolume.EXPANSE_INFINITE)
        return true;

    // both Spheres
    if (bound._type === this._type) {
        var dx = this._center.x - bound._center.x;
        var dy = this._center.y - bound._center.y;
        var dz = this._center.z - bound._center.z;
        var touchDistance = this._halfExtentX + bound._halfExtentX;
        return dx*dx + dy*dy + dz*dz < touchDistance*touchDistance;
    }
    else
        return BoundingVolume._testAABBToSphere(bound, this);
};

BoundingSphere.prototype.classifyAgainstPlane = function(plane)
{
    var dist = plane.x * this._center.x + plane.y * this._center.y + plane.z * this._center.z + plane.w;
    var radius = this._halfExtentX;
    if (dist > radius) return PlaneSide.FRONT;
    else if (dist < -radius) return PlaneSide.BACK;
    else return PlaneSide.INTERSECTING;
};

BoundingSphere.prototype._updateMinAndMax = function()
{
    var centerX = this._center.x, centerY = this._center.y, centerZ = this._center.z;
    var radius = this._halfExtentX;
    this._minimumX = centerX - radius;
    this._minimumY = centerY - radius;
    this._minimumZ = centerZ - radius;
    this._maximumX = centerX + radius;
    this._maximumY = centerY + radius;
    this._maximumZ = centerZ + radius;
};

BoundingSphere.prototype.createDebugModel = function()
{
    return new SpherePrimitive({doubleSided:true});
};

/**
 * Keeps track and updates entities
 * @constructor
 */
function EntityEngine()
{
    this._updateableEntities = [];
    onPreFrame.bind(this._update, this);
}

EntityEngine.prototype =
{
    registerEntity: function(entity)
    {
        entity._onRequireUpdatesChange.bind(this._onEntityUpdateChange, this);
        if (entity._requiresUpdates)
            this._addUpdatableEntity(entity);
    },

    unregisterEntity: function(entity)
    {
        entity._onRequireUpdatesChange.unbind(this);
        if (entity._requiresUpdates)
            this._removeUpdatableEntity(entity);
    },

    _onEntityUpdateChange: function(entity)
    {
        if (entity._requiresUpdates)
            this._addUpdatableEntity(entity);
        else
            this._removeUpdatableEntity(entity);
    },

    _addUpdatableEntity: function(entity)
    {
        this._updateableEntities.push(entity);
    },

    _removeUpdatableEntity: function(entity)
    {
        var index = this._updateableEntities.indexOf(entity);
        this._updateableEntities.splice(index, 1);
    },

    _update: function(dt)
    {
        var entities = this._updateableEntities;
        var len = entities.length;
        for (var i = 0; i < len; ++i)
            entities[i].update(dt);
    }
};

/**
 * Creates a new Scene object
 * @param rootNode (optional) A rootnode to be used, allowing different partition types to be used as the root.
 * @constructor
 */
function Scene(rootNode)
{
    // the default partition is a BVH node
    //  -> or this may need to become an infinite bound node?
    this._rootNode = rootNode || new SceneNode();
    this._rootNode._setScene(this);
    this._skybox = null;
    this._entityEngine = new EntityEngine();
}

Scene.prototype = {
    get skybox() { return this._skybox; },
    set skybox(value) { this._skybox = value; },

    // TODO: support regex for partial matches
    findNodeByName: function(name)
    {
        return this._rootNode.findNodeByName(name);
    },

    // TODO: support regex for partial matches
    findMaterialByName: function(name)
    {
        return this._rootNode.findMaterialByName(name);
    },

    attach: function(child)
    {
        this._rootNode.attach(child);
    },

    detach: function(child)
    {
        this._rootNode.detach(child);
    },

    get numChildren()
    {
        return this._rootNode.numChildren;
    },

    getChild: function(index)
    {
        return this._rootNode.getChild(index);
    },

    contains: function(child)
    {
        this._rootNode.contains(child);
    },

    acceptVisitor: function(visitor)
    {
        visitor.visitScene(this);
        // assume root node will always qualify
        this._rootNode.acceptVisitor(visitor);
    },

    get entityEngine()
    {
        return this._entityEngine;
    },

    get worldBounds()
    {
        return this._rootNode.worldBounds;
    }
};

function UnlitPass(geometryVertex, geometryFragment)
{
    MaterialPass.call(this, this._generateShader(geometryVertex, geometryFragment));
}

UnlitPass.prototype = Object.create(MaterialPass.prototype);

UnlitPass.prototype._generateShader = function(geometryVertex, geometryFragment)
{
    var fragmentShader = ShaderLibrary.get("snippets_geometry.glsl") + "\n" + geometryFragment + "\n" + ShaderLibrary.get("material_unlit_fragment.glsl");
    var vertexShader = geometryVertex + "\n" + ShaderLibrary.get("material_unlit_vertex.glsl");
    return new Shader(vertexShader, fragmentShader);
};

function ForwardLitBasePass(geometryVertex, geometryFragment)
{
    MaterialPass.call(this, this._generateShader(geometryVertex, geometryFragment));
}

ForwardLitBasePass.prototype = Object.create(MaterialPass.prototype);

ForwardLitBasePass.prototype._generateShader = function(geometryVertex, geometryFragment)
{
    var fragmentShader = ShaderLibrary.get("snippets_geometry.glsl") + "\n" + geometryFragment + "\n" + ShaderLibrary.get("material_fwd_base_fragment.glsl");
    var vertexShader = geometryVertex + "\n" + ShaderLibrary.get("material_fwd_base_vertex.glsl");
    return new Shader(vertexShader, fragmentShader);
};

function DirectionalShadowPass(geometryVertex, geometryFragment)
{
    MaterialPass.call(this, this._generateShader(geometryVertex, geometryFragment));
}

DirectionalShadowPass.prototype = Object.create(MaterialPass.prototype);

DirectionalShadowPass.prototype._generateShader = function(geometryVertex, geometryFragment)
{
    var fragmentShader = ShaderLibrary.get("snippets_geometry.glsl") + "\n" + DirectionalLight.SHADOW_FILTER.getGLSL() + "\n" + geometryFragment + "\n" + ShaderLibrary.get("material_dir_shadow_fragment.glsl");
    var vertexShader = geometryVertex + "\n" + ShaderLibrary.get("material_unlit_vertex.glsl");
    return new Shader(vertexShader, fragmentShader);
};

function ForwardLitDirPass(geometryVertex, geometryFragment, lightingModel, shadows)
{
    MaterialPass.call(this, this._generateShader(geometryVertex, geometryFragment, lightingModel, shadows));

    this._colorLocation = this.getUniformLocation("hx_directionalLight.color");
    this._dirLocation = this.getUniformLocation("hx_directionalLight.direction");

    if (shadows) {
        this._shadowMatricesLocation = this.getUniformLocation("hx_directionalLight.shadowMapMatrices[0]");
        this._shadowSplitsLocation = this.getUniformLocation("hx_directionalLight.splitDistances");
        this._depthBiasLocation = this.getUniformLocation("hx_directionalLight.depthBias");
        this._maxShadowDistanceLocation = this.getUniformLocation("hx_directionalLight.maxShadowDistance");
        this._shadowMapSlot = this.getTextureSlot("hx_shadowMap");
    }
}

ForwardLitDirPass.prototype = Object.create(MaterialPass.prototype);

// the light is passed in as data
ForwardLitDirPass.prototype.updatePassRenderState = function(camera, renderer, light)
{
    var dir = new Float4();
    var matrix = new Matrix4x4();
    var matrixData = new Float32Array(64);

    return function(camera, renderer, light) {
        var gl = GL.gl;
        var col = light._scaledIrradiance;

        gl.useProgram(this._shader._program);

        camera.viewMatrix.transformVector(light.direction, dir);
        gl.uniform3f(this._colorLocation, col.r, col.g, col.b);
        gl.uniform3f(this._dirLocation, dir.x, dir.y, dir.z);


        if (light.castShadows) {
            var shadowRenderer = light._shadowMapRenderer;
            var numCascades = META.OPTIONS.numShadowCascades;
            var splits = shadowRenderer._splitDistances;
            var k = 0;

            this._shadowMapSlot.texture = shadowRenderer._shadowMap;

            for (var j = 0; j < numCascades; ++j) {
                matrix.multiply(shadowRenderer.getShadowMatrix(j), camera.worldMatrix);
                var m = matrix._m;
                for (var l = 0; l < 16; ++l) {
                    matrixData[k++] = m[l];
                }
            }

            gl.uniformMatrix4fv(this._shadowMatricesLocation, false, matrixData);
            gl.uniform4f(this._shadowSplitsLocation, splits[0], splits[1], splits[2], splits[3]);
            gl.uniform1f(this._depthBiasLocation, light.depthBias);
            gl.uniform1f(this._maxShadowDistanceLocation, splits[numCascades - 1]);
        }

        MaterialPass.prototype.updatePassRenderState.call(this, camera, renderer);
    }
}();

ForwardLitDirPass.prototype._generateShader = function(geometryVertex, geometryFragment, lightingModel, shadows)
{
    var defines = {};

    if (shadows) {
        defines.HX_SHADOW_MAP = 1;
    }

    var vertexShader = geometryVertex + "\n" + ShaderLibrary.get("material_fwd_dir_vertex.glsl", defines);

    var fragmentShader =
        ShaderLibrary.get("snippets_geometry.glsl", defines) + "\n" +
        lightingModel + "\n\n\n" +
        DirectionalLight.SHADOW_FILTER.getGLSL() + "\n" +
        ShaderLibrary.get("directional_light.glsl") + "\n" +
        geometryFragment + "\n" +
        ShaderLibrary.get("material_fwd_dir_fragment.glsl");
    return new Shader(vertexShader, fragmentShader);
};

function ForwardLitPointPass(geometryVertex, geometryFragment, lightingModel)
{
    MaterialPass.call(this, this._generateShader(geometryVertex, geometryFragment, lightingModel));

    this._colorLocation = this.getUniformLocation("hx_pointLight.color");
    this._posLocation = this.getUniformLocation("hx_pointLight.position");
    this._radiusLocation = this.getUniformLocation("hx_pointLight.radius");
}

ForwardLitPointPass.prototype = Object.create(MaterialPass.prototype);

// the light is passed in as data
ForwardLitPointPass.prototype.updatePassRenderState = function(camera, renderer, light)
{
    var pos = new Float4();

    return function(camera, renderer, light) {
        var gl = GL.gl;
        var col = light._scaledIrradiance;

        gl.useProgram(this._shader._program);

        light.worldMatrix.getColumn(3, pos);
        camera.viewMatrix.transformPoint(pos, pos);
        gl.uniform3f(this._colorLocation, col.r, col.g, col.b);
        gl.uniform3f(this._posLocation, pos.x, pos.y, pos.z);
        gl.uniform1f(this._radiusLocation, light.radius);

        MaterialPass.prototype.updatePassRenderState.call(this, camera, renderer);
    }
}();

ForwardLitPointPass.prototype._generateShader = function(geometryVertex, geometryFragment, lightingModel)
{
    var defines = {};

    var vertexShader = geometryVertex + "\n" + ShaderLibrary.get("material_fwd_point_vertex.glsl", defines);

    var fragmentShader =
        ShaderLibrary.get("snippets_geometry.glsl", defines) + "\n" +
        lightingModel + "\n\n\n" +
        ShaderLibrary.get("point_light.glsl") + "\n" +
        geometryFragment + "\n" +
        ShaderLibrary.get("material_fwd_point_fragment.glsl");
    return new Shader(vertexShader, fragmentShader);
};

function ForwardLitProbePass(geometryVertex, geometryFragment, lightingModel, ssao)
{
    MaterialPass.call(this, this._generateShader(geometryVertex, geometryFragment, lightingModel, ssao));
    this._diffuseSlot = this.getTextureSlot("hx_diffuseProbeMap");
    this._specularSlot = this.getTextureSlot("hx_specularProbeMap");
    this._ssaoSlot = this.getTextureSlot("hx_ssao");
    this._numMipsLocation = this.getUniformLocation("hx_specularProbeNumMips");
    if (!ForwardLitProbePass.dummyTexture) {
        var data = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
        data = [ data, data, data, data, data, data ];
        ForwardLitProbePass.dummyTexture = new TextureCube();
        ForwardLitProbePass.dummyTexture.uploadData(data, 1, true);
    }
}

ForwardLitProbePass.prototype = Object.create(MaterialPass.prototype);

// the light is passed in as data
ForwardLitProbePass.prototype.updatePassRenderState = function(camera, renderer, probe)
{
    var gl = GL.gl;
    gl.useProgram(this._shader._program);

    // TODO: allow setting locality of probes
    this._diffuseSlot.texture = probe.diffuseTexture || ForwardLitProbePass.dummyTexture;
    var specularTex = probe.specularTexture || ForwardLitProbePass.dummyTexture;

    this._specularSlot.texture = specularTex;
    gl.uniform1f(this._numMipsLocation, Math.floor(MathX.log2(specularTex.size)));
    MaterialPass.prototype.updatePassRenderState.call(this, camera, renderer);
};

ForwardLitProbePass.prototype._generateShader = function(geometryVertex, geometryFragment, lightingModel, ssao)
{
    var defines = {
        HX_APPLY_SSAO: ssao? 1 : 0
    };

    var extensions = "";
    if (capabilities.EXT_SHADER_TEXTURE_LOD) {
        extensions += "#texturelod\n";
    }

    var vertexShader = geometryVertex + "\n" + ShaderLibrary.get("material_fwd_probe_vertex.glsl", defines);

    var fragmentShader =
        extensions +
        ShaderLibrary.get("snippets_geometry.glsl", defines) + "\n" +
        lightingModel + "\n\n\n" +
        ShaderLibrary.get("light_probe.glsl") + "\n" +
        geometryFragment + "\n" +
        ShaderLibrary.get("material_fwd_probe_fragment.glsl");
    return new Shader(vertexShader, fragmentShader);
};

ForwardLitProbePass.prototype._setSSAOTexture = function(texture)
{
    this._ssaoSlot.texture = texture;
};

function GBufferAlbedoPass(geometryVertex, geometryFragment)
{
    MaterialPass.call(this, this._generateShader(geometryVertex, geometryFragment));
}

GBufferAlbedoPass.prototype = Object.create(MaterialPass.prototype);

GBufferAlbedoPass.prototype._generateShader = function(geometryVertex, geometryFragment)
{
    var fragmentShader = ShaderLibrary.get("snippets_geometry.glsl") + "\n" + geometryFragment + "\n" + ShaderLibrary.get("material_gbuffer_albedo_fragment.glsl");
    var vertexShader = geometryVertex + "\n" + ShaderLibrary.get("material_gbuffer_albedo_vertex.glsl");
    return new Shader(vertexShader, fragmentShader);
};

function GBufferNormalDepthPass(geometryVertex, geometryFragment)
{
    MaterialPass.call(this, this._generateShader(geometryVertex, geometryFragment));
}

GBufferNormalDepthPass.prototype = Object.create(MaterialPass.prototype);

GBufferNormalDepthPass.prototype._generateShader = function(geometryVertex, geometryFragment)
{
    var fragmentShader = ShaderLibrary.get("snippets_geometry.glsl") + "\n" + geometryFragment + "\n" + ShaderLibrary.get("material_gbuffer_normal_depth_fragment.glsl");
    var vertexShader = geometryVertex + "\n" + ShaderLibrary.get("material_gbuffer_normal_depth_vertex.glsl");
    return new Shader(vertexShader, fragmentShader);
};

function GBufferSpecularPass(geometryVertex, geometryFragment)
{
    MaterialPass.call(this, this._generateShader(geometryVertex, geometryFragment));
}

GBufferSpecularPass.prototype = Object.create(MaterialPass.prototype);

GBufferSpecularPass.prototype._generateShader = function(geometryVertex, geometryFragment)
{
    var fragmentShader = ShaderLibrary.get("snippets_geometry.glsl") + "\n" + geometryFragment + "\n" + ShaderLibrary.get("material_gbuffer_specular_fragment.glsl");
    var vertexShader = geometryVertex + "\n" + ShaderLibrary.get("material_gbuffer_specular_vertex.glsl");
    return new Shader(vertexShader, fragmentShader);
};

function GBufferFullPass(geometryVertex, geometryFragment)
{
    MaterialPass.call(this, this._generateShader(geometryVertex, geometryFragment));
}

GBufferFullPass.prototype = Object.create(MaterialPass.prototype);

GBufferFullPass.prototype._generateShader = function(geometryVertex, geometryFragment)
{
    var fragmentShader = ShaderLibrary.get("snippets_geometry.glsl") + "\n" + geometryFragment + "\n" + ShaderLibrary.get("material_gbuffer_full_fragment.glsl");
    var vertexShader = geometryVertex + "\n" + ShaderLibrary.get("material_gbuffer_full_vertex.glsl");
    return new Shader(vertexShader, fragmentShader);
};

function ApplyGBufferPass(geometryVertex, geometryFragment)
{
    MaterialPass.call(this, this._generateShader(geometryVertex, geometryFragment));
}

ApplyGBufferPass.prototype = Object.create(MaterialPass.prototype);

ApplyGBufferPass.prototype._generateShader = function(geometryVertex, geometryFragment)
{
    var vertexShader = geometryVertex + "\n" + ShaderLibrary.get("material_apply_gbuffer_vertex.glsl");
    var fragmentShader = ShaderLibrary.get("snippets_geometry.glsl") + "\n" + geometryFragment + "\n" + ShaderLibrary.get("material_apply_gbuffer_fragment.glsl");
    return new Shader(vertexShader, fragmentShader);
};

/**
 *
 * @constructor
 */
var MATERIAL_ID_COUNTER = 0;

function Material(geometryVertexShader, geometryFragmentShader, lightingModel)
{
    this._elementType = ElementType.TRIANGLES;
    this._cullMode = CullMode.BACK;
    this._writeDepth = true;
    this._passes = new Array(Material.NUM_PASS_TYPES);
    this._renderOrderHint = ++MATERIAL_ID_COUNTER;
    // forced render order by user:
    this._renderOrder = 0;
    this.onChange = new Signal();
    this._textures = {};
    this._uniforms = {};
    this._useMorphing = false;
    this._useSkinning = false;

    this._name = null;
    this._ssao = false;
    this._geometryVertexShader = geometryVertexShader;
    this._geometryFragmentShader = geometryFragmentShader;
    this._lightingModel = lightingModel || META.OPTIONS.defaultLightingModel;

    this._initialized = false;
    this._blendState = null;
    this._additiveBlendState = BlendState.ADD;    // additive blend state is used for dynamic lighting
    this._needsNormalDepth = false;
    this._needsBackbuffer = false;
}

Material.ID_COUNTER = 0;

Material.prototype =
{
    init: function()
    {
        if (this._initialized || !this._geometryVertexShader || !this._geometryFragmentShader)
            return;

        this._needsNormalDepth = false;
        this._needsBackbuffer = false;

        if (!this._lightingModel)
            this.setPass(MaterialPass.BASE_PASS, new UnlitPass(this._geometryVertexShader, this._geometryFragmentShader));
        else if (this._lightingModel !== META.OPTIONS.defaultLightingModel || this._blendState) {
            this.setPass(MaterialPass.BASE_PASS, new ForwardLitBasePass(this._geometryVertexShader, this._geometryFragmentShader));

            this.setPass(MaterialPass.DIR_LIGHT_PASS, new ForwardLitDirPass(this._geometryVertexShader, this._geometryFragmentShader, this._lightingModel, false));
            this.setPass(MaterialPass.DIR_LIGHT_SHADOW_PASS, new ForwardLitDirPass(this._geometryVertexShader, this._geometryFragmentShader, this._lightingModel, true));
            this.setPass(MaterialPass.POINT_LIGHT_PASS, new ForwardLitPointPass(this._geometryVertexShader, this._geometryFragmentShader, this._lightingModel));
            this.setPass(MaterialPass.LIGHT_PROBE_PASS, new ForwardLitProbePass(this._geometryVertexShader, this._geometryFragmentShader, this._lightingModel, this._ssao));
        }
        else {
            // deferred lighting forward pass
            this.setPass(MaterialPass.BASE_PASS, new ApplyGBufferPass(this._geometryVertexShader, this._geometryFragmentShader));
        }

        this.setPass(MaterialPass.DIR_LIGHT_SHADOW_MAP_PASS, new DirectionalShadowPass(this._geometryVertexShader, this._geometryFragmentShader));

        if (capabilities.GBUFFER_MRT) {
            this.setPass(MaterialPass.GBUFFER_PASS, new GBufferFullPass(this._geometryVertexShader, this._geometryFragmentShader));
        }
        else {
            this.setPass(MaterialPass.GBUFFER_ALBEDO_PASS, new GBufferAlbedoPass(this._geometryVertexShader, this._geometryFragmentShader));
            this.setPass(MaterialPass.GBUFFER_SPECULAR_PASS, new GBufferSpecularPass(this._geometryVertexShader, this._geometryFragmentShader));
        }

        // always may need this pass for AO
        this.setPass(MaterialPass.GBUFFER_NORMAL_DEPTH_PASS, new GBufferNormalDepthPass(this._geometryVertexShader, this._geometryFragmentShader));

        this._initialized = true;
        // TODO: init dynamic light passes
    },

    get initialized() { return this._initialized; },

    get ssao() { return this._ssao; },
    set ssao(value)
    {
        if (this._ssao === value) return;
        this._ssao = value;
        this._invalidate();
    },

    get blendState()
    {
        return this._blendState;
    },

    set blendState(value)
    {
        this._blendState = value;
        if (value) {
            this._additiveBlendState = value.clone();
            this._additiveBlendState.dstFactor = BlendFactor.ONE;
        }
        else {
            this._additiveBlendState = BlendState.ADD;
        }

        // blend state can require different render path, so shaders need to adapt
        this._invalidate();
    },

    get name()
    {
        return this._name;
    },

    set name(value)
    {
        this._name = value;
    },

    get lightingModel()
    {
        return this._lightingModel;
    },

    set lightingModel(value)
    {
        this._lightingModel = value;
        this._invalidate();
    },

    get renderOrder()
    {
        return this._renderOrder;
    },

    set renderOrder(value)
    {
        this._renderOrder = value;
    },

    get elementType()
    {
        return this._elementType;
    },

    set elementType(value)
    {
        this._elementType = value;
        for (var i = 0; i < MaterialPass.NUM_PASS_TYPES; ++i) {
            if (this._passes[i])
                this._passes[i].elementType = value;
        }
    },

    get writeDepth()
    {
        return this._writeDepth;
    },

    set writeDepth(value)
    {
        this._writeDepth = value;

        if (!value && this._passes[MaterialPass.GBUFFER_NORMAL_DEPTH_PASS]) {
            this._passes[MaterialPass.GBUFFER_NORMAL_DEPTH_PASS] = null;
        }
        else if (value && !this._passes[MaterialPass.GBUFFER_NORMAL_DEPTH_PASS])
            this._invalidate();

        for (var i = 0; i < MaterialPass.NUM_PASS_TYPES; ++i) {
            if (this._passes[i])
                this._passes[i].writeDepth = value;
        }
    },

    get cullMode()
    {
        return this._cullMode;
    },

    set cullMode(value)
    {
        this._cullMode = value;
        for (var i = 0; i < MaterialPass.NUM_PASS_TYPES; ++i) {
            if (i !== MaterialPass.DIR_LIGHT_SHADOW_MAP_PASS && this._passes[i])
                this._passes[i].cullMode = value;
        }
    },

    getPass: function (type)
    {
        if (!this._initialized) this.init();
        return this._passes[type];
    },

    setPass: function (type, pass)
    {
        this._passes[type] = pass;

        if (pass) {
            if(type === MaterialPass.DIR_LIGHT_SHADOW_MAP_PASS)
                pass.cullMode = DirectionalLight.SHADOW_FILTER.getCullMode();
            else
                pass.cullMode = this._cullMode;

            pass.elementType = this._elementType;
            pass.writeDepth = this._writeDepth;

            if (type === MaterialPass.DIR_LIGHT_PASS ||
                type === MaterialPass.DIR_LIGHT_SHADOW_PASS ||
                type === MaterialPass.POINT_LIGHT_PASS ||
                type === MaterialPass.LIGHT_PROBE_PASS)
                pass.blendState = this._additiveBlendState;

            if (type === MaterialPass.BASE_PASS)
                pass.blendState = this._blendState;

            if (pass.getTextureSlot("hx_gbufferNormalDepth"))
                this._needsNormalDepth = true;

            if (pass.getTextureSlot("hx_backbuffer"))
                this._needsBackbuffer = true;

            for (var slotName in this._textures) {
                if (this._textures.hasOwnProperty(slotName)) {
                    var texture = this._textures[slotName];
                    if (texture instanceof Array)
                        pass.setTextureArray(slotName, texture);
                    else
                        pass.setTexture(slotName, texture);
                }
            }

            for (var uniformName in this._uniforms) {
                if (this._uniforms.hasOwnProperty(uniformName)) {
                    if (uniformName.charAt(uniformName.length - 1) === ']')
                        pass.setUniformArray(uniformName.substr(0, uniformName.length - 3), this._uniforms[uniformName]);
                    else
                        pass.setUniform(uniformName, this._uniforms[uniformName]);
                }
            }
        }

        this.onChange.dispatch();
    },

    hasPass: function (type)
    {
        if (!this._initialized) this.init();
        return !!this._passes[type];
    },

    setTexture: function(slotName, texture)
    {
        if (texture)
            this._textures[slotName] = texture;
        else
            delete this._textures[slotName];

        for (var i = 0; i < MaterialPass.NUM_PASS_TYPES; ++i)
            if (this.hasPass(i)) this._passes[i].setTexture(slotName, texture);
    },

    setTextureArray: function(slotName, textures)
    {
        if (textures)
            this._textures[slotName] = textures;
        else
            delete this._textures[slotName];

        for (var i = 0; i < MaterialPass.NUM_PASS_TYPES; ++i)
            if (this.hasPass(i)) this._passes[i].setTextureArray(slotName, textures);
    },

    /**
     *
     * @param name
     * @param value
     * @param overwrite (Optional) If the value was already set, ignore the new value.
     */
    setUniform: function(name, value, overwrite)
    {
        if (overwrite === undefined) overwrite = true;

        if (!overwrite && this._uniforms.hasOwnProperty(name))
            return;

        this._uniforms[name] = value;

        for (var i = 0; i < MaterialPass.NUM_PASS_TYPES; ++i) {
            if (this._passes[i])
                this._passes[i].setUniform(name, value);
        }
    },

    /**
     *
     * @param name
     * @param value
     * @param overwrite (Optional) If the value was already set, ignore the new value.
     */
    setUniformArray: function(name, value, overwrite)
    {
        if (overwrite === undefined) overwrite = true;

        if (!overwrite && this._uniforms.hasOwnProperty(name + '[0]'))
            return;

        this._uniforms[name + '[0]'] = value;

        for (var i = 0; i < MaterialPass.NUM_PASS_TYPES; ++i) {
            if (this._passes[i])
                this._passes[i].setUniformArray(name, value);
        }
    },

    _setUseSkinning: function(value)
    {
        this._useSkinning = value;
    },

    _setUseMorphing: function(value)
    {
        this._useMorphing = value;
    },

    _invalidate: function()
    {
        this._initialized = false;
        this._passes = new Array(Material.NUM_PASS_TYPES);
        this.onChange.dispatch();
    },

    _setSSAOTexture: function(texture)
    {
        var pass = this.getPass(MaterialPass.BASE_PASS);
        if (pass) pass._setSSAOTexture(texture);
        pass = this.getPass(MaterialPass.BASE_PASS);
        if (pass) pass._setSSAOTexture(texture);
    },

    toString: function()
    {
        return "[Material(name=" + this._name + ")]";
    }
};

/**
 * Creates a default skybox rendering material.
 */
function SkyboxMaterial(texture)
{
    Material.call(this);

    var vertexShader = ShaderLibrary.get("default_skybox_vertex.glsl");
    var fragmentShader = ShaderLibrary.get("default_skybox_fragment.glsl");

    this.writeDepth = false;
    this.cullMode = CullMode.NONE;

    var pass = new UnlitPass(vertexShader, fragmentShader);

    // if no draw buffers, normals and specular don't need to be updated
    this.setPass(MaterialPass.BASE_PASS, pass);
    this._initialized = true;
    this._renderOrder = Number.POSITIVE_INFINITY;

    this.setTexture("hx_skybox", texture);
}

SkyboxMaterial.prototype = Object.create(Material.prototype);

/**
 * VertexLayout links the mesh's vertex attributes to a shader's attributes
 * @param mesh
 * @param pass
 * @constructor
 */
function VertexLayout(mesh, pass)
{
    var shader = pass.getShader();
    this.attributes = [];
    this.morphAttributes = [];

    this._numAttributes = -1;

    for (var i = 0; i < mesh.numVertexAttributes; ++i) {
        var attribute = mesh.getVertexAttribute(i);
        var index = shader.getAttributeLocation(attribute.name);
        if (!(index >= 0)) continue;

        var stride = mesh.getVertexStride(attribute.streamIndex);
        var attrib = {
            index: index,
            offset: attribute.offset * 4,
            numComponents: attribute.numComponents,
            stride: stride * 4,
            streamIndex: attribute.streamIndex
        };

        // morph attributes are handled differently because their associated vertex buffers change dynamically
        if (attribute.name.indexOf("hx_morph") === 0)
            this.morphAttributes.push(attrib);
        else
            this.attributes.push(attrib);

        this._numAttributes = Math.max(this._numAttributes, index + 1);


    }
}

/**
 * MeshInstance represents a mesh/material combination as it appears on a scene
 * @param mesh
 * @param material
 * @constructor
 */
function MeshInstance(mesh, material)
{
    this._mesh = mesh;
    this._meshMaterialLinkInvalid = false;
    this._vertexLayouts = null;
    this._visible = true;

    if (mesh.hasMorphData) {
        this._morphTargets = [];
        var w = [];
        for (var i = 0; i < capabilities.NUM_MORPH_TARGETS; ++i) {
            w[i] = 0;
        }
        this._morphWeights = new Float32Array(w);
    }

    this.material = material;
}

MeshInstance.prototype = {
    get visible()
    {
        return this._visible;
    },

    set visible(value)
    {
        this._visible = value;
    },

    setMorphTarget: function(targetIndex, vertexBuffer, weight)
    {
        this._morphTargets[targetIndex] = vertexBuffer;
        this._morphWeights[targetIndex] = vertexBuffer? weight : 0.0;
    },

    get material()
    {
        return this._material;
    },

    set material(value)
    {
        if (this._material)
            this._material.onChange.unbind(this._onMaterialChange);

        this._material = value;

        if (this._material) {
            this._material.onChange.bind(this._onMaterialChange, this);

            this.material._setUseSkinning(this._material._useSkinning || !!this._mesh._model.skeleton);
            this.material._setUseMorphing(this._material._useMorphing || this._mesh.hasMorphData);
        }

        this._meshMaterialLinkInvalid = true;
    },

    /**
     * Sets state for this mesh/material combination.
     * @param passType
     */
    updateRenderState: function(passType)
    {
        if (this._meshMaterialLinkInvalid)
            this._linkMeshWithMaterial();


        var vertexBuffers = this._mesh._vertexBuffers;
        this._mesh._indexBuffer.bind();

        var layout = this._vertexLayouts[passType];
        var morphAttributes = layout.morphAttributes;
        var len = morphAttributes.length;
        var attribute;
        var gl = GL.gl;

        for (var i = 0; i < len; ++i) {
            attribute = morphAttributes[i];
            var buffer = this._morphTargets[i] || this._mesh._defaultMorphTarget;
            buffer.bind();
            gl.vertexAttribPointer(attribute.index, attribute.numComponents, gl.FLOAT, false, attribute.stride, attribute.offset);
        }

        var attributes = layout.attributes;
        len = attributes.length;

        for (i = 0; i < len; ++i) {
            attribute = attributes[i];
            vertexBuffers[attribute.streamIndex].bind();
            gl.vertexAttribPointer(attribute.index, attribute.numComponents, gl.FLOAT, false, attribute.stride, attribute.offset);
        }

        GL.enableAttributes(layout._numAttributes);
    },

    _initVertexLayouts: function()
    {
        this._vertexLayouts = new Array(MaterialPass.NUM_PASS_TYPES);
        for (var type = 0; type < MaterialPass.NUM_PASS_TYPES; ++type) {
            var pass = this._material.getPass(type);
            if (pass)
                this._vertexLayouts[type] = new VertexLayout(this._mesh, pass);
        }
    },

    _linkMeshWithMaterial: function()
    {
        this._initVertexLayouts();

        this._meshMaterialLinkInvalid = false;
    },

    _onMaterialChange: function()
    {
        this._meshMaterialLinkInvalid = true;
    }
};

/**
 * BasicMaterial is the default physically plausible rendering material.
 * @constructor
 */
function BasicMaterial(options)
{
    Material.call(this);

    options = options || {};

    this._color = options.color || new Color(1, 1, 1, 1);
    this._colorMap = options.colorMap || null;
    this._doubleSided = !!options.doubleSided;
    this._normalMap = options.normalMap || null;
    this._specularMap = options.specularMap || null;
    this._maskMap = options.maskMap || null;
    this._specularMapMode = options.specularMapMode || BasicMaterial.SPECULAR_MAP_ROUGHNESS_ONLY;
    this._metallicness = options.metallicness === undefined? 0.0 : options.metallicness;
    this._alpha = options.alpha === undefined? 1.0 : options.alpha;
    this._roughness = options.roughness === undefined ? 0.5 : options.roughness;
    this._roughnessRange = options.roughnessRange === undefined? .5 : options.roughnessRange;
    this._normalSpecularReflectance = options.normalSpecularReflectance === undefined? 0.027 : options.normalSpecularReflectance;
    this._alphaThreshold = options.alphaThreshold === undefined? 1.0 : options.alphaThreshold;
    this._useVertexColors = !!options.useVertexColors;

    // trigger assignments
    this.color = this._color;
    this.alpha = this._alpha;
    this.metallicness = this._metallicness;
    this.roughness = this._roughness;
    this.normalSpecularReflectance = this._normalSpecularReflectance;

    if (options.lightingModel !== undefined)
        this.lightingModel = options.lightingModel;
}

BasicMaterial.roughnessFromShininess = function(specularPower)
{
    return Math.sqrt(2.0/(specularPower + 2.0));
};

/**
 * used for specularMapMode to specify the specular map only uses roughness data
 */
BasicMaterial.SPECULAR_MAP_ROUGHNESS_ONLY = 1;
/**
 * used for specularMapMode to specify the specular map has rgb channels containing roughness, normal reflectance and metallicness, respectively
 */
BasicMaterial.SPECULAR_MAP_ALL = 2;
/**
 * used for specularMapMode to specify there is no explicit specular map, but roughness data is present in the alpha channel of the normal map.
 */
BasicMaterial.SPECULAR_MAP_SHARE_NORMAL_MAP = 3;


BasicMaterial.prototype = Object.create(Material.prototype,
    {
        doubleSided: {
            get: function()
            {
                return this._doubleSided;
            },

            set: function(value)
            {
                this._doubleSided = value;

                for (var i = 0; i < MaterialPass.NUM_PASS_TYPES; ++i) {
                    if (this._passes[i])
                        this._passes[i].cullMode = value ? CullMode.NONE : CullMode.BACK;
                }
            }
        },

        alpha: {
            get: function ()
            {
                return this._alpha;
            },
            set: function (value)
            {
                this._alpha = MathX.saturate(value);
                this.setUniform("alpha", this._alpha);
            }
        },

        // this can ONLY be used if the MeshData was created with a hx_vertexColor attribute!
        useVertexColors: {
            get: function ()
            {
                return this._useVertexColors;
            },
            set: function (value)
            {
                if (this._useVertexColors !== value)
                    this._invalidate();

                this._useVertexColors = value;
            }
        },

        color: {
            get: function ()
            {
                return this._color;
            },
            set: function (value)
            {
                this._color = isNaN(value) ? value : new Color(value);
                this.setUniform("color", this._color);
            }
        },

        colorMap: {
            get: function ()
            {
                return this._colorMap;
            },

            set: function (value)
            {
                if (!!this._colorMap !== !!value) {
                    this._invalidate();
                }

                this._colorMap = value;

                this.setTexture("colorMap", value);
            }
        },

        normalMap: {
            get: function ()
            {
                return this._normalMap;
            },
            set: function (value)
            {
                if (!!this._normalMap !== !!value)
                    this._invalidate();

                this.setTexture("normalMap", value);

                this._normalMap = value;
            }
        },

        /**
         * The roughness in the specular map is encoded as shininess; ie: lower values result in higher roughness to reflect the apparent brighness of the reflection. This is visually more intuitive.
         */
        specularMap: {
            get: function ()
            {
                return this._specularMap;
            },
            set: function (value)
            {
                if (!!this._specularMap !== !!value)
                    this._invalidate();

                this.setTexture("specularMap", value);

                this._specularMap = value;
            }
        },

        maskMap: {
            get: function ()
            {
                return this._maskMap;
            },
            set: function (value)
            {
                if (!!this._maskMap !== !!value)
                    this._invalidate();

                this.setTexture("maskMap", value);

                this._maskMap = value;
            }
        },

        specularMapMode: {
            get: function ()
            {
                return this._specularMapMode;
            },
            set: function (value)
            {
                if (this._specularMapMode !== value)
                    this._invalidate();

                this._specularMapMode = value;
            }
        },

        metallicness: {
            get: function ()
            {
                return this._metallicness;
            },
            set: function (value)
            {
                this._metallicness = MathX.saturate(value);
                this.setUniform("metallicness", this._metallicness);
            }
        },

        normalSpecularReflectance: {
            get: function ()
            {
                return this._normalSpecularReflectance;
            },
            set: function (value)
            {
                this._normalSpecularReflectance = MathX.saturate(value);
                this.setUniform("normalSpecularReflectance", this._normalSpecularReflectance);
            }
        },

        roughness:
            {
                get: function ()
                {
                    return this._roughness;
                },

                set: function(value)
                {
                    this._roughness = value;
                    this.setUniform("roughness", this._roughness);
                }
            },

        /**
         * When using a roughness texture, roughness represents the middle roughness, range the deviation from there.
         * So textured roughness ranges from [roughness - roughnessRange, roughness + roughnessRange]
         */
        roughnessRange:
            {
                get: function ()
                {
                    return this._roughnessRange;
                },

                set: function(value)
                {
                    this._roughnessRange = value;
                    this.setUniform("roughnessRange", this._roughnessRange * 2.0);
                }
            },

        alphaThreshold:
            {
                get: function() { return this._alphaThreshold; },
                set: function(value) {
                    value = MathX.saturate(value);
                    if ((this._alphaThreshold === 1.0) !== (value === 1.0))
                        this._invalidate();

                    this._alphaThreshold = value;
                    this.setUniform("alphaThreshold", value);
                }
            }
    }
);

BasicMaterial.prototype.init = function()
{
    var defines = this._generateDefines();

    this._geometryVertexShader = ShaderLibrary.get("default_geometry_vertex.glsl", defines);
    this._geometryFragmentShader = ShaderLibrary.get("default_geometry_fragment.glsl", defines);

    Material.prototype.init.call(this);
};

BasicMaterial.prototype._generateDefines = function()
{
    var defines = {};
    if (this._colorMap) defines.COLOR_MAP = 1;
    if (this._useVertexColors) defines.VERTEX_COLORS = 1;
    if (this._normalMap) defines.NORMAL_MAP = 1;
    if (this._maskMap) defines.MASK_MAP = 1;
    if (this._alphaThreshold < 1.0) defines.ALPHA_THRESHOLD = 1;
    if (this._useSkinning) defines.HX_USE_SKINNING = 1;
    if (this._useMorphing) {
        defines.HX_USE_MORPHING = 1;
        defines.HX_NUM_MORPH_TARGETS = capabilities.NUM_MORPH_TARGETS;
    }

    switch (this._specularMapMode) {
        case BasicMaterial.SPECULAR_MAP_ROUGHNESS_ONLY:
            if (this._specularMap) defines.ROUGHNESS_MAP = 1;
            break;
        case BasicMaterial.SPECULAR_MAP_ALL:
            if (this._specularMap) defines.SPECULAR_MAP = 1;
            break;
        default:
            defines.NORMAL_ROUGHNESS_MAP = 1;
    }
    return defines;
};

BasicMaterial.prototype._setUseSkinning = function(value)
{
    if (this._useSkinning !== value)
        this._invalidate();

    this._useSkinning = value;
};

/**
 * ModelInstance is a combination of a Model and a set of Materials (up to 1 per Mesh).
 * @param model
 * @param materials Either a single material or an array of materials for each mesh in model.
 * @constructor
 */
function ModelInstance(model, materials)
{
    Entity.call(this);

    this._meshBounds = new BoundingAABB();
    this._model = null;
    this._meshInstances = [];
    this._castShadows = true;
    this._skeletonPose = null;
    this._morphPose = null;

    this.init(model, materials);
}

ModelInstance.prototype = Object.create(Entity.prototype, {
    model:
        {
            get: function() { return this._model; }
        },

    castShadows: {
        get: function()
        {
            return this._castShadows;
        },

        set: function(value)
        {
            this._castShadows = value;
        }
    },

    numMeshInstances: {
        get: function ()
        {
            return this._meshInstances.length;
        }
    },

    skeleton: {
        get: function() {
            return this._model.skeleton;
        }
    },

    skeletonMatrices: {
        get: function() {
            return this._skeletonPose;
        },
        set: function(value) {
            this._skeletonPose = value;
        }
    },

    morphPose: {
        get: function() {
            return this._morphPose;
        },

        set: function(value) {
            if (this._morphPose)
                this._morphPose.onChange.unbind(this._onMorphChanged);

            this._morphPose = value;

            if (this._morphPose) {
                this._morphPose.onChange.bind(this._onMorphChanged, this);
                this._onMorphChanged();
            }
            else
                this._clearMorph();
        }
    }
});

/**
 * Used if we choose to deferredly initialize the model
 * @param model
 * @param materials
 */
ModelInstance.prototype.init = function(model, materials)
{
    if (this._model || this._materials)
        throw new Error("ModelInstance already initialized");

    this._model = model;

    if (materials)
        this._materials = materials instanceof Array? materials : [ materials ];

    if (model) {
        if (model.skeleton) {
            this._generateDefaultSkeletonPose();
        }
        model.onChange.bind(this._onModelChange, this);
        this._onModelChange();
    }

    this._invalidateWorldBounds();
};

ModelInstance.prototype.getMeshInstance = function(index)
{
    return this._meshInstances[index];
};

ModelInstance.prototype._generateDefaultSkeletonPose = function()
{
    if (META.OPTIONS.useSkinningTexture) {
        this._skeletonPose = DEFAULTS.DEFAULT_SKINNING_TEXTURE;
        return;
    }

    this._skeletonPose = [];
    for (var i = 0; i < this._model.skeleton.numJoints; ++i) {
        this._skeletonPose[i] = new Matrix4x4();
    }
};


ModelInstance.prototype._addMeshInstance = function(mesh, material)
{
    this._meshInstances.push(new MeshInstance(mesh, material));
};

ModelInstance.prototype._onModelChange = function()
{
    var maxIndex = this._materials.length - 1;
    for (var i = 0; i < this._model.numMeshes; ++i) {
        this._addMeshInstance(this._model.getMesh(i), this._materials[Math.min(i, maxIndex)]);
    }

    this._invalidateWorldBounds();
};

ModelInstance.prototype._clearMorph = function()
{
    var numTargets = capabilities.NUM_MORPH_TARGETS;
    var numMeshes = this._meshInstances.length;

    for (var t = 0; t < numTargets; ++t) {
        for (var i = 0; i < numMeshes; ++i) {
            this._meshInstances[i].setMorphTarget(t, null, 0);
        }
    }
};

ModelInstance.prototype._onMorphChanged = function()
{
    var numTargets = capabilities.NUM_MORPH_TARGETS;
    var numMeshes = this._meshInstances.length;

    for (var t = 0; t < numTargets; ++t) {
        var target = this._morphPose.getMorphTarget(t);
        if (target) {
            var weight = this._morphPose.getWeight(target.name);
            for (var i = 0; i < numMeshes; ++i) {
                var meshInstance = this._meshInstances[i];
                meshInstance.setMorphTarget(t, target.getVertexBuffer(i), weight);
            }
        }
        else {
            for (i = 0; i < numMeshes; ++i) {
                this._meshInstances[i].setMorphTarget(t, null, 0.0);
            }
        }
    }
};

// override for better matches
ModelInstance.prototype._updateWorldBounds = function()
{
    Entity.prototype._updateWorldBounds.call(this);
    this._meshBounds.transformFrom(this._model.localBounds, this.worldMatrix);
    this._worldBounds.growToIncludeBound(this._meshBounds);
};

ModelInstance.prototype.acceptVisitor = function(visitor)
{
    visitor.visitModelInstance(this, this.worldMatrix, this.worldBounds);
    Entity.prototype.acceptVisitor.call(this, visitor);
};

ModelInstance.prototype.toString = function()
{
    return "[ModelInstance(name=" + this._name + ")]";
};

/**
 * Skybox provides a backdrop "at infinity" for the scene.
 * @param materialOrTexture Either a texture or a material used to render the skybox. If a texture is passed,
 * HX.SkyboxMaterial is used as material.
 * @constructor
 */
function Skybox(materialOrTexture)
{
    if (!(materialOrTexture instanceof Material))
        materialOrTexture = new SkyboxMaterial(materialOrTexture);

    //var model = new HX.PlanePrimitive({alignment: HX.PlanePrimitive.ALIGN_XY, width: 2, height: 2});
    var model = new BoxPrimitive({width: 1, invert: true});
    model.localBounds.clear(BoundingVolume.EXPANSE_INFINITE);
    this._modelInstance = new ModelInstance(model, materialOrTexture);
}

Skybox.prototype = {};

/**
 *
 * @constructor
 */
function RenderCollector()
{
    SceneVisitor.call(this);

    this._renderItemPool = new RenderItemPool();

    this._opaques = [];
    this._transparents = []; // add in individual pass types
    this._camera = null;
    this._cameraZAxis = new Float4();
    this._frustum = null;
    this._lights = null;
    this._ambientColor = new Color();
    this._shadowCasters = null;
    this._effects = null;
    this._needsNormalDepth = false;
    this._needsGBuffer = false;
    this._needsBackbuffer = false;
}

RenderCollector.prototype = Object.create(SceneVisitor.prototype);

RenderCollector.prototype.getOpaqueRenderList = function() { return this._opaques; };
RenderCollector.prototype.getTransparentRenderList = function() { return this._transparents; };
RenderCollector.prototype.getLights = function() { return this._lights; };
RenderCollector.prototype.getShadowCasters = function() { return this._shadowCasters; };
RenderCollector.prototype.getEffects = function() { return this._effects; };

Object.defineProperties(RenderCollector.prototype, {
    ambientColor: {
        get: function() { return this._ambientColor; }
    },

    needsNormalDepth: {
        get: function() { return this._needsNormalDepth; }
    },

    needsGBuffer: {
        get: function() { return this._needsGBuffer; }
    },

    needsBackbuffer: {
        get: function() { return this._needsBackbuffer; }
    }
});

RenderCollector.prototype.collect = function(camera, scene)
{
    this._camera = camera;
    camera.worldMatrix.getColumn(2, this._cameraZAxis);
    this._frustum = camera.frustum;
    this._reset();

    scene.acceptVisitor(this);

    this._opaques.sort(this._sortOpaques);
    this._transparents.sort(this._sortTransparents);

    this._lights.sort(this._sortLights);

    var effects = this._camera._effects;
    // add camera effects at the end
    if (effects) {
        var len = effects.length;

        for (var i = 0; i < len; ++i) {
            var effect = effects[i];
            this._needsNormalDepth = this._needsNormalDepth || effect._needsNormalDepth;
            this._effects.push(effect);
        }
    }
};

RenderCollector.prototype.qualifies = function(object)
{
    return object.visible && object.worldBounds.intersectsConvexSolid(this._frustum._planes, 6);
};

RenderCollector.prototype.visitScene = function (scene)
{
    var skybox = scene._skybox;
    if (skybox)
        this.visitModelInstance(skybox._modelInstance, scene._rootNode.worldMatrix, scene._rootNode.worldBounds);
};

RenderCollector.prototype.visitEffects = function(effects)
{
    // camera does not pass effects
    //if (ownerNode === this._camera) return;
    var len = effects.length;

    for (var i = 0; i < len; ++i) {
        this._effects.push(effects[i]);
    }
};

RenderCollector.prototype.visitModelInstance = function (modelInstance, worldMatrix, worldBounds)
{
    var numMeshes = modelInstance.numMeshInstances;
    var cameraZAxis = this._cameraZAxis;
    var cameraZ_X = cameraZAxis.x, cameraZ_Y = cameraZAxis.y, cameraZ_Z = cameraZAxis.z;
    var skeleton = modelInstance.skeleton;
    var skeletonMatrices = modelInstance.skeletonMatrices;
    var renderPool = this._renderItemPool;
    var camera = this._camera;
    var defaultLightingModel = META.OPTIONS.defaultLightingModel;
    var opaques = this._opaques;
    var transparents = this._transparents;

    for (var meshIndex = 0; meshIndex < numMeshes; ++meshIndex) {
        var meshInstance = modelInstance.getMeshInstance(meshIndex);
        if (!meshInstance.visible) continue;

        var material = meshInstance.material;

        // if (!material._initialized) continue;

        var lightingModel = material._lightingModel;

        // only required for the default lighting model (if not unlit)
        this._needsGBuffer = this._needsGBuffer || (lightingModel && lightingModel === defaultLightingModel);
        this._needsNormalDepth = this._needsNormalDepth || material._needsNormalDepth;
        this._needsBackbuffer = this._needsBackbuffer || material._needsBackbuffer;

        var renderItem = renderPool.getItem();

        renderItem.material = material;
        renderItem.meshInstance = meshInstance;
        renderItem.skeleton = skeleton;
        renderItem.skeletonMatrices = skeletonMatrices;
        // distance along Z axis:
        var center = worldBounds._center;
        renderItem.renderOrderHint = center.x * cameraZ_X + center.y * cameraZ_Y + center.z * cameraZ_Z;
        renderItem.worldMatrix = worldMatrix;
        renderItem.camera = camera;
        renderItem.worldBounds = worldBounds;


        var list = material.blendState || material._needsBackbuffer? transparents : opaques;
        list.push(renderItem);
    }
};

RenderCollector.prototype.visitAmbientLight = function(light)
{
    var color = light._scaledIrradiance;
    this._ambientColor.r += color.r;
    this._ambientColor.g += color.g;
    this._ambientColor.b += color.b;
};

RenderCollector.prototype.visitLight = function(light)
{
    this._lights.push(light);
    if (light._castShadows) this._shadowCasters.push(light._shadowMapRenderer);
};

RenderCollector.prototype._reset = function()
{
    this._renderItemPool.reset();

    this._opaques = [];
    this._transparents = [];
    this._lights = [];
    this._shadowCasters = [];
    this._effects = [];
    this._needsNormalDepth = false;
    this._ambientColor.set(0, 0, 0, 1);
};

RenderCollector.prototype._sortTransparents = function(a, b)
{
    var diff = a.material._renderOrder - b.material._renderOrder;
    if (diff !== 0) return diff;
    return b.renderOrderHint - a.renderOrderHint;
};

RenderCollector.prototype._sortOpaques = function(a, b)
{
    var diff;

    diff = a.material._renderOrder - b.material._renderOrder;
    if (diff !== 0) return diff;

    diff = a.material._renderOrderHint - b.material._renderOrderHint;
    if (diff !== 0) return diff;

    return a.renderOrderHint - b.renderOrderHint;
};

RenderCollector.prototype._sortLights = function(a, b)
{
    return  a._type === b._type?
            a._castShadows? 1 : -1 :
            a._type - b._type;
};

// TODO: there no way to figure out correct mip level for texture
// TODO: Should we provide a snap size in the vertex data?
function Terrain(terrainSize, minElevation, maxElevation, numLevels, material, detail)
{
    SceneNode.call(this);

    this._terrainSize = terrainSize || 512;
    this._minElevation = minElevation;
    this._maxElevation = maxElevation;
    this._numLevels = numLevels || 4;
    detail = detail || 32;
    var gridSize = Math.ceil(detail * .5) * 2.0; // round off to 2

    // cannot bitshift because we need floating point result
    this._snapSize = (this._terrainSize / detail) / Math.pow(2, this._numLevels);

    this._material = material;
    material.setUniform("hx_elevationOffset", minElevation);
    material.setUniform("hx_elevationScale", maxElevation - minElevation);

    this._initModels(gridSize);
    this._initTree();
}

// TODO: Allow setting material
Terrain.prototype = Object.create(SceneNode.prototype, {
    terrainSize: {
        get: function() {
            return this._terrainSize;
        }
    }
});

/**
 *
 * @param size
 * @param numSegments
 * @param subDiv Subdivide an edge
 * @returns {HX.Model}
 * @private
 */
Terrain.prototype._createModel = function(size, numSegments, subDiv, lastLevel)
{
    var rcpNumSegments = 1.0 / numSegments;
    var meshData = new MeshData();
    var cellSize = size * rcpNumSegments;
    var halfCellSize = cellSize * .5;

    meshData.addVertexAttribute("hx_position", 3);
    meshData.addVertexAttribute("hx_normal", 3);
    meshData.addVertexAttribute("hx_cellSize", 1);

    var vertices = [];
    var indices = [];

    var numZ = subDiv? numSegments - 1: numSegments;

    var w = numSegments + 1;

    for (var zi = 0; zi <= numZ; ++zi) {
        var z = (zi*rcpNumSegments - .5) * size;

        for (var xi = 0; xi <= numSegments; ++xi) {
            var x = (xi*rcpNumSegments - .5) * size;

            // the one corner that attaches to higher resolution neighbours needs to snap like them
            var s = !lastLevel && xi === numSegments && zi === numSegments? halfCellSize : cellSize;
            vertices.push(x, 0, z, 0, 1, 0, s);

            if (xi !== numSegments && zi !== numZ) {
                var base = xi + zi * w;

                indices.push(base, base + w, base + w + 1);
                indices.push(base, base + w + 1, base + 1);
            }
        }
    }

    var highIndexX = vertices.length / 7;

    if (subDiv) {
        z = (numSegments * rcpNumSegments - .5) * size;
        for (xi = 0; xi <= numSegments; ++xi) {
            x = (xi*rcpNumSegments - .5) * size;
            vertices.push(x, 0, z, 0, 1, 0);
            vertices.push(halfCellSize);

            if (xi !== numSegments) {
                base = xi + numZ * w;
                vertices.push(x + halfCellSize, 0, z, 0, 1, 0, halfCellSize);
                indices.push(base, highIndexX + xi * 2, highIndexX + xi * 2 + 1);
                indices.push(base, highIndexX + xi * 2 + 1, base + 1);
                indices.push(highIndexX + xi * 2 + 1, highIndexX + xi * 2 + 2, base + 1);
            }
        }
    }

    meshData.setVertexData(vertices, 0);
    meshData.setIndexData(indices);

    var modelData = new ModelData();
    modelData.addMeshData(meshData);
    var model = new Model(modelData);
    model.localBounds.growToIncludeMinMax(new Float4(0, this._minElevation, 0), new Float4(0, this._maxElevation, 0));
    return model;
};

Terrain.prototype._initModels = function(gridSize)
{
    this._models = [];
    var modelSize = this._terrainSize * .25;

    for (var level = 0; level < this._numLevels; ++level) {
        if (level === this._numLevels - 1) {
            // do not subdivide max detail
            var model = this._createModel(modelSize, gridSize, false, true);
            this._models[level] = {
                edge: model,
                corner: model
            };
        }
        else {
            this._models[level] = {
                edge: this._createModel(modelSize, gridSize, true, false),
                corner: this._createModel(modelSize, gridSize, false, false)
            };
        }

        modelSize *= .5;

    }
};

Terrain.prototype._initTree = function()
{
    var level = 0;
    var size = this._terrainSize * .25;
    for (var yi = 0; yi < 4; ++yi) {
        var y = this._terrainSize * (yi / 4 - .5) + size * .5;
        for (var xi = 0; xi < 4; ++xi) {
            var x = this._terrainSize * (xi / 4 - .5) + size * .5;
            var subX = 0, subY = 0;

            if (xi === 1)
                subX = 1;
            else if (xi === 2)
                subX = -1;

            if (yi === 1)
                subY = 1;
            else if (yi === 2)
                subY = -1;

            if (subX && subY) {
                this._subDivide(x, y, subX, subY, level + 1, size * .5);
            }
            else {
                var rotation = 0;
                var mode = "edge";
                var add = true;
                // if both are 0, we have a corner
                if (xi % 3 === yi % 3) {
                    mode = "corner";
                    if (xi === 0 && yi === 0) rotation = 0;
                    if (xi === 0 && yi === 3) rotation = 1;
                    if (xi === 3 && yi === 3) rotation = 2;
                    if (xi === 3 && yi === 0) rotation = -1;
                }
                else {
                    if (yi === 3) rotation = 2;
                    if (xi === 3) rotation = -1;
                    if (xi === 0) rotation = 1;
                }
                if (add)
                    this._addModel(x, y, level, rotation, mode);
            }
        }
    }
};

Terrain.prototype._addModel = function(x, y, level, rotation, mode)
{
    var modelInstance = new ModelInstance(this._models[level][mode], this._material);
    modelInstance.position.set(x, 0, y);
    modelInstance.rotation.fromAxisAngle(Float4.Y_AXIS, rotation * Math.PI * .5);
    this.attach(modelInstance);
};

Terrain.prototype._subDivide = function(x, y, subX, subY, level, size)
{
    size *= .5;

    for (var yi = -1; yi <= 1; yi += 2) {
        for (var xi = -1; xi <= 1; xi += 2) {
            if((xi !== subX || yi !== subY) || level === this._numLevels - 1) {
                var rotation = 0;
                var mode = "corner";
                // messy, I know
                if (x < 0 && y < 0) {
                    if (xi < 0 && yi > 0) {
                        mode = "edge";
                        rotation = 1;
                    }
                    else if (xi > 0 && yi < 0) {
                        mode = "edge";
                        rotation = 0;
                    }
                    else
                        rotation = 0;
                }
                else if (x > 0 && y > 0) {
                    if (xi > 0 && yi < 0) {
                        mode = "edge";
                        rotation = -1;
                    }
                    else if (xi < 0 && yi > 0) {
                        mode = "edge";
                        rotation = 2;
                    }
                    else
                        rotation = 2;
                }
                else if (x < 0 && y > 0) {
                    if (xi > 0 && yi > 0) {
                        mode = "edge";
                        rotation = 2;
                    }
                    else if (xi < 0 && yi < 0) {
                        mode = "edge";
                        rotation = 1;
                    }
                    else
                        rotation = 1;
                }
                else if (x > 0 && y < 0) {
                    if (xi < 0 && yi < 0) {
                        mode = "edge";
                        rotation = 0;
                    }
                    else if (xi > 0 && yi > 0) {
                        mode = "edge";
                        rotation = -1;
                    }
                    else
                        rotation = -1;
                }

                this._addModel(x + size * xi, y + size * yi, level, rotation, mode);
            }
        }
    }

    if (level < this._numLevels - 1)
        this._subDivide(x + size * subX, y + size * subY, subX, subY, level + 1, size);
};

Terrain.prototype.acceptVisitor = function(visitor)
{
    // typechecking isn't nice, but it does what we want
    if (visitor instanceof RenderCollector) {
        var pos = visitor._camera.position;
        this.position.x = Math.floor(pos.x / this._snapSize) * this._snapSize;
        this.position.z = Math.floor(pos.z / this._snapSize) * this._snapSize;
    }

    SceneNode.prototype.acceptVisitor.call(this, visitor);
};

Terrain.prototype._updateWorldBounds = function ()
{
    this._worldBounds.clear(BoundingVolume.EXPANSE_INFINITE);
};

function Component()
{
    // this allows notifying entities about bound changes (useful for sized components)
    this._entity = null;
}

Component.prototype =
{
    // to be overridden:
    onAdded: function() {},
    onRemoved: function() {},

    // by default, onUpdate is not implemented at all
    //onUpdate: function(dt) {},
    onUpdate: null,

    get entity()
    {
        return this._entity;
    }
};

// usually subclassed
function CompositeComponent()
{
    Component.call(this);
    this._subs = [];
}

CompositeComponent.prototype = Object.create(Component.prototype);

CompositeComponent.prototype.addComponent = function(comp)
{
    if (comp._entity)
        throw new Error("Component already added to an entity!");

    this._subs.push(comp);
};

CompositeComponent.prototype.removeComponent = function(comp)
{
    var index = this._subs.indexOf(comp);
    if (index >= 0)
        this._subs.splice(index, 1);
};

CompositeComponent.prototype.onAdded = function()
{
    for (var i = 0; i < this._subs.length; ++i) {
        var comp = this._subs[i];
        comp._entity = this._entity;
        comp.onAdded();
    }
};

CompositeComponent.prototype.onRemoved = function()
{
    for (var i = 0; i < this._subs.length; ++i) {
        var comp = this._subs[i];
        comp.onRemoved();
        comp._entity = null;
    }
};

// by default, onUpdate is not implemented at all
//onUpdate: function(dt) {},
CompositeComponent.prototype.onUpdate = function(dt)
{
    var len = this._subs.length;
    for (var i = 0; i < len; ++i) {
        var comp = this._subs[i];
        comp.onUpdate(dt);
    }
};

function KeyFrame(time, value)
{
    this.time = time || 0.0;
    this.value = value;
}

/**
 *
 * @constructor
 */
function AnimationClip()
{
    this._name = null;
    this._keyFrames = [];
    this._duration = 0;
    this._looping = true;
}

AnimationClip.prototype =
{
    get looping()
    {
        return this._looping;
    },

    set looping(value)
    {
        this._looping = value;
    },

    get name()
    {
        return this._name;
    },

    set name(value)
    {
        this._name = value;
    },

    get numKeyFrames()
    {
        return this._keyFrames.length;
    },

    get duration()
    {
        return this._duration;
    },

    /**
     * Adds a keyframe. Last keyframe is usually the same pose as the first and serves as an "end marker"
     * @param frame A KeyFrame containing a SkeletonPose
     */
    addKeyFrame: function(frame)
    {
        this._keyFrames.push(frame);
        if (frame.time > this._duration) this._duration = frame.time;
    },

    /**
     * Only call this if for some reason the keyframes were added out of order.
     */
    sortKeyFrames: function()
    {
        this._keyFrames.sort(function(a, b) {
            return a.time - b.time;
        });
    },

    getKeyFrame: function(index)
    {
        return this._keyFrames[index];
    },

    toString: function()
    {
        return "[AnimationClip(name=" + this.name + ")";
    }
};

/**
 * AnimationPlayhead is a 'helper' class that just updates a playhead. Returns the keyframes and the ratio between them
 * @param clip
 * @constructor
 */
function AnimationPlayhead(clip)
{
    this._clip = clip;
    this._time = 0;
    this._timeScale = 1.0;
    this._isPlaying = true;
    this._currentFrameIndex = 0;
    this._timeChanged = true;

    this._looping = clip.looping;

    // the number of times the playhead has wrapped during the last update. Useful when moving skeleton root bone, fe.
    this.wraps = 0;

    // the playhead is currently between these two frames:
    this.frame1 = 0;
    this.frame2 = 0;

    // the ratio of the position of the playhead, used for lerping frame1 and frame2
    this.ratio = 0;
}

AnimationPlayhead.prototype =
    {
        get timeScale() { return this._timeScale; },
        set timeScale(value) { this._timeScale = value; },

        get looping() { return this._looping; },
        set looping(value) { this._looping = value;},

        get time() { return this._time; },
        set time(value)
        {
            if (!this._looping)
                value = MathX.clamp(value, 0, this._clip.duration);

            if (this._time === value) return;
            this._time = value;
            this._timeChanged = true;
        },

        play: function()
        {
            this._isPlaying = true;
        },

        stop: function()
        {
            this._isPlaying = false;
        },

        update: function(dt)
        {
            var playheadUpdated = (this._isPlaying && dt !== 0.0);
            if (!playheadUpdated && !this._timeChanged)
                return false;

            this._timeChanged = false;

            if (this._isPlaying) {
                dt *= this._timeScale;
                this._time += dt;
            }

            var clip = this._clip;
            // the last keyframe is just an "end marker" to interpolate with, it has no duration
            var numKeyFrames = clip.numKeyFrames;
            var numBaseFrames = numKeyFrames - 1;
            var duration = clip.duration;
            var wraps = 0;

            if (!this._looping) {
                if (this._time > duration) {
                    this._time = duration;
                    this._isPlaying = false;
                }
                else if (this._time < 0) {
                    this._time = 0;
                    this._isPlaying = false;
                }
            }

            var frameA, frameB;

            if (dt >= 0) {
                // could replace the while loop with an if loop and calculate wrap with division, but it's usually not more
                // than 1 anyway
                while (this._looping && this._time >= duration) {
                    // reset playhead to make sure progressive update logic works
                    this._currentFrameIndex = 0;
                    this._time -= duration;
                    ++wraps;
                }

                do {
                    // advance play head
                    if (++this._currentFrameIndex === numKeyFrames) this._currentFrameIndex = 0;
                    frameB = clip.getKeyFrame(this._currentFrameIndex);
                } while (frameB.time < this._time);

                --this._currentFrameIndex;
                frameA = clip.getKeyFrame(this._currentFrameIndex);
            }
            else if (dt < 0) {
                while (this._looping && this._time < 0) {
                    // reset playhead to make sure progressive update logic works
                    this._currentFrameIndex = numBaseFrames;
                    this._time += duration;
                    ++wraps;
                }

                ++this._currentFrameIndex;
                do {
                    if (--this._currentFrameIndex < 0) this._currentFrameIndex = numKeyFrames;
                    frameA = clip.getKeyFrame(this._currentFrameIndex);
                } while (frameA.time > this._time);
            }

            this.wraps = wraps;
            this.frame1 = frameA;
            this.frame2 = frameB;
            this.ratio = (this._time - frameA.time) / (frameB.time - frameA.time);

            return true;
        }
    };

/**
 * MorphPose defines a certain configuration for blending several morph targets.
 * (even if they have different targets, they could be considered to have weight 0 if absent from eachother)
 * @constructor
 */
function MorphPose()
{
    this._targets = [];
    this._weights = {};
    this._stateInvalid = true;
    this.onChange = new Signal();
}

MorphPose.prototype =
{
    /**
     * Gets the morph targets as sorted by weight in update()
     * @param index
     * @returns {*}
     */
    getMorphTarget: function(index)
    {
        return this._targets[index];
    },

    get numMorphTargets()
    {
        return this._targets.length;
    },

    addMorphTarget: function(morphTarget)
    {
        this._targets.push(morphTarget);
        this._weights[morphTarget.name] = 0.0;
        this._stateInvalid = true;
    },

    getWeight: function(id)
    {
        return this._weights[id];
    },

    setWeight: function(id, value)
    {
        if (this._weights[id] !== value)
            this._stateInvalid = true;

        this._weights[id] = value;
    },

    update: function()
    {
        if (!this._stateInvalid) return;

        var w = this._weights;
        // sort by weights
        this._targets.sort(function(a, b) {
            return w[b.name] - w[a.name];
        });

        this._stateInvalid = false;

        this.onChange.dispatch();
    }
};

/**
 *
 * @constructor
 */
function MorphAnimation(targets)
{
    Component.call(this);

    // some day, morph pose could also become a tree using and generating poses?
    this._morphPose = new MorphPose();
    for (var i = 0; i < targets.length; ++i) {
        this._morphPose.addMorphTarget(targets[i]);
    }
}

MorphAnimation.prototype = Object.create(Component.prototype,
    {
        numMorphTargets: {
            get: function() { return this._morphPose.numMorphTargets; }
        }
    }
);

MorphAnimation.prototype.getMorphTarget = function(index)
{
    return this._morphPose.getMorphTarget(index);
};

MorphAnimation.prototype.setWeight = function(id, value)
{
    this._morphPose.setWeight(id, value);
};

MorphAnimation.prototype.onAdded = function()
{
    this.entity.morphPose = this._morphPose;
};

MorphAnimation.prototype.onRemoved = function()
{
    this.entity.morphPose = null;
};

MorphAnimation.prototype.onUpdate = function(dt)
{
    this._morphPose.update(dt);
};

function MorphData()
{
    this.positions = [];
}

function MorphTarget()
{
    // So basically, every morph pose is a list of vertex buffers, one for each Mesh in the Model
    // the Mesh objects will have their hx_morphPositionN overwritten depending on their weights
    this.name = null;
    this._vertexBuffers = [];
    this._numVertices = [];
}

MorphTarget.prototype =
{
    get numVertices()
    {
        return this._numVertices;
    },

    getNumVertices: function(meshIndex)
    {
        return this._numVertices[meshIndex];
    },

    getVertexBuffer: function(meshIndex)
    {
        return this._vertexBuffers[meshIndex];
    },

    /**
     * @param positions An Array of 3 floats per vertex
     */
    initFromMorphData: function(data, meshIndex)
    {
        var positions = data.positions;
        this._numVertices[meshIndex] = positions.length / 3;

        this._vertexBuffers[meshIndex] = new VertexBuffer();
        this._vertexBuffers[meshIndex].uploadData(new Float32Array(positions));
    }
};

/**
 *
 * @constructor
 */
function Skeleton()
{
    this._joints = [];
    this._name = "";
}

Skeleton.prototype =
{
    get numJoints()
    {
        return this._joints.length;
    },

    addJoint: function(joint)
    {
        this._joints.push(joint);
    },

    getJoint: function(index)
    {
        return this._joints[index];
    },

    get name()
    {
        return this._name;
    },

    set name(value)
    {
        this._name = value;
    },

    toString: function()
    {
        return "[Skeleton(name=" + this.name + ")";
    }
};

/**
 *
 * @constructor
 */

function SkeletonJointPose()
{
    this.rotation = new Quaternion();
    this.position = new Float4();
    this.scale = new Float4(1, 1, 1);
}

SkeletonJointPose.prototype =
    {
        copyFrom: function(a)
        {
            this.rotation.copyFrom(a.rotation);
            this.position.copyFrom(a.position);
            this.scale.copyFrom(a.scale);
        },

        toString: function()
        {
            return "[SkeletonJointPose]";
        }
    };

/**
 *
 * @constructor
 */
function SkeletonPose()
{
    this.jointPoses = [];
}

SkeletonPose.prototype =
    {
        interpolate: function(a, b, factor)
        {
            a = a.jointPoses;
            b = b.jointPoses;
            var len = a.length;

            if (this.jointPoses.length !== len)
                this._initJointPoses(len);

            var target = this.jointPoses;
            for (var i = 0; i < len; ++i) {
                var t = target[i];
                Quaternion.slerp(a[i].rotation, b[i].rotation, factor, t.rotation);
                Float4.lerp(a[i].position, b[i].position, factor, t.position);
                Float4.lerp(a[i].scale, b[i].scale, factor, t.scale);
            }
        },

        copyBindPose: function(skeleton)
        {
            var m = new Matrix4x4();
            for (var i = 0; i < skeleton.numJoints; ++i) {
                var j = skeleton.getJoint(i);
                var p = this.jointPoses[i] = new SkeletonJointPose();
                // global bind pose matrix
                m.inverseAffineOf(j.inverseBindPose);

                // local bind pose matrix
                if (j.parentIndex >= 0)
                    m.append(skeleton.getJoint(j.parentIndex).inverseBindPose);

                m.decompose(p);
            }
        },

        copyFrom: function(a)
        {
            a = a.jointPoses;
            var target = this.jointPoses;
            var len = a.length;

            if (this.jointPoses.length !== len)
                this._initJointPoses(len);

            for (var i = 0; i < len; ++i)
                target[i].copyFrom(a[i]);
        },

        _initJointPoses: function(numJointPoses)
        {
            this._numJoints = numJointPoses;
            this.jointPoses.length = numJointPoses;
            for (var i = 0; i < numJointPoses; ++i)
                this.jointPoses[i] = new SkeletonJointPose();
        }
    };

/**
 *
 * @constructor
 */
function SkeletonBlendNode()
{
    this._rootJointDeltaPosition = new Float4();
    this._valueID = null;
    this._pose = new SkeletonPose();
}

SkeletonBlendNode.prototype =
{
    // child nodes should ALWAYS be requested to update first
    update: function(dt, transferRootJoint)
    {
    },

    setValue: function(id, value)
    {
        if (this._valueID === id) {
            this._applyValue(value);
        }
    },   // a node can have a value associated with it, either time, interpolation value, directional value, ...

    get rootJointDeltaPosition() { return this._rootJointDeltaPosition; },
    get numJoints() { return -1; },

    // the id used to set values
    get valueID() { return this._valueID; },
    set valueID(value) { this._valueID = value; },

    _applyValue: function(value) {}
};

/**
 * A node to contain a single clip
 * @param clip
 * @constructor
 */
function SkeletonClipNode(clip)
{
    SkeletonBlendNode.call(this);
    this._playhead = new AnimationPlayhead(clip);
    this._rootPosition = new Float4();

    this._numJoints = clip.getKeyFrame(0).value.jointPoses.length;

    var lastFramePos = clip.getKeyFrame(clip.numKeyFrames - 1).value.jointPoses[0].position;
    var firstFramePos = clip.getKeyFrame(0).value.jointPoses[0].position;
    this._clipRootDelta = Float4.subtract(lastFramePos, firstFramePos);
}

SkeletonClipNode.prototype = Object.create(SkeletonBlendNode.prototype,
    {
        numJoints: {
            get: function() { return this._numJoints; }
        },
        timeScale: {
            get: function() { return this._playhead.timeScale; },
            set: function(value) { this._playhead.timeScale = value; }
        },
        time: {
            get: function() { return this._playhead; },
            set: function(value)
            {
                this._playhead.time = value;
                this._timeChanged = true;
            }
        }
    });

SkeletonClipNode.prototype.play = function()
{
    this._animationClipPlayer.play();
};

SkeletonClipNode.prototype.stop = function()
{
    this._animationClipPlayer.stop();
};

SkeletonClipNode.prototype.update = function(dt, transferRootJoint)
{
    if (!this._playhead.update(dt))
        return false;

    var playhead = this._playhead;

    this._pose.interpolate(playhead.frame1.value, playhead.frame2.value, playhead.ratio);

    if (transferRootJoint)
        this._transferRootJointTransform(playhead.wraps, dt);

    return true;
};

SkeletonClipNode.prototype._transferRootJointTransform = function(numWraps, dt)
{
    var rootBonePos = this._pose.jointPoses[0].position;
    var rootPos = this._rootPosition;
    var rootDelta = this._rootJointDeltaPosition;

    Float4.subtract(rootBonePos, rootPos, rootDelta);

    if (dt > 0 && numWraps > 0) {
        // apply the entire displacement for the amount of times it wrapped
        rootDelta.addScaled(this._clipRootDelta, numWraps);
    }
    else if (dt < 0 && numWraps > 0) {
        // apply the entire displacement for the amount of times it wrapped, in the other direction
        rootDelta.addScaled(this._clipRootDelta, -numWraps);
    }

    this._rootPosition.copyFrom(rootBonePos);
    rootBonePos.set(0.0, 0.0, 0.0);
};

SkeletonClipNode.prototype._applyValue = function(value)
{
    this.time = value * this._clip.duration;
};

/**
 *
 * @constructor
 */
function SkeletonBlendTree(rootNode, skeleton)
{
    this._skeleton = skeleton;
    this._rootNode = rootNode;
    this._transferRootJoint = false;
    this._matrices = null;
    this._globalPose = new SkeletonPose();
    this._applyInverseBindPose = true;

    // TODO: Should we hide this stuff in SkeletonPose along with matrices (only used for the global pose), so we can assign a SkeletonPose object to skinned objects
    if (META.OPTIONS.useSkinningTexture) {
        this._texture = new Texture2D();
        this._texture.filter = TextureFilter.NEAREST_NOMIP;
        this._texture.wrapMode = TextureWrapMode.CLAMP;
    }

    if (skeleton) this.skeleton = skeleton;
}

SkeletonBlendTree.prototype =
{
    get transferRootJoint() { return this._transferRootJoint; },
    set transferRootJoint(value) { this._transferRootJoint = value; },

    get applyInverseBindPose() { return this._applyInverseBindPose; },
    set applyInverseBindPose(value) { this._applyInverseBindPose = value; },

    get skeleton() { return this._skeleton; },
    set skeleton(value)
    {
        this._skeleton = value;
        this._matrices = [];
        for (var i = 0; i < value.numJoints; ++i) {
            this._matrices[i] = new Matrix4x4();
            this._globalPose.jointPoses[i] = new SkeletonJointPose();
        }

    },

    get rootJointDeltaPosition() { return this._rootNode.rootJointDeltaPosition; },

    get rootNode() { return this._rootNode; },
    set rootNode(value) { this._rootNode = value; },

    get matrices() { return this._matrices; },

    // only available if HX.OPTIONS.useSkinningTexture is true
    get texture() { return this._texture; },

    setValue: function(id, value)
    {
        this._rootNode.setValue(id, value);
    },

    update: function(dt)
    {
        if (this._rootNode.update(dt, this._transferRootJoint)) {
            this._updateGlobalPose();
            this._updateMatrices();

            if (META.OPTIONS.useSkinningTexture)
                this._updateTexture();

            return true;
        }
        return false;
    },

    _updateGlobalPose: function()
    {
        var skeleton = this._skeleton;
        var numJoints = skeleton.numJoints;
        var rootPose = this._rootNode._pose.jointPoses;
        var globalPose = this._globalPose.jointPoses;

        /*var p = new HX.Matrix4x4();
        var c = new HX.Matrix4x4();
        var pp = new HX.Transform();
        var cc = new HX.Transform();
        var sc = new HX.Float4();*/

        for (var i = 0; i < numJoints; ++i) {
            var localJointPose = rootPose[i];
            var globalJointPose = globalPose[i];
            var joint = skeleton.getJoint(i);

            if (joint.parentIndex < 0)
                globalJointPose.copyFrom(localJointPose);
            else {
                var parentPose = globalPose[joint.parentIndex];

                /*pp.position.copyFrom(parentPose.position);
                pp.rotation.copyFrom(parentPose.rotation);
                pp.scale.copyFrom(parentPose.scale);

                cc.position.copyFrom(localJointPose.position);
                cc.rotation.copyFrom(localJointPose.rotation);
                cc.scale.copyFrom(localJointPose.scale);

                p.compose(pp);
                c.compose(cc);
                c.append(p);

                c.decompose(globalJointPose.position, globalJointPose.rotation, globalJointPose.scale);*/

                var gTr = globalJointPose.position;
                var ptr = parentPose.position;
                var pQuad = parentPose.rotation;
                pQuad.rotate(localJointPose.position, gTr);
                gTr.x += ptr.x;
                gTr.y += ptr.y;
                gTr.z += ptr.z;
                globalJointPose.rotation.multiply(pQuad, localJointPose.rotation);
                globalJointPose.scale.x = parentPose.scale.x * localJointPose.scale.x;
                globalJointPose.scale.y = parentPose.scale.y * localJointPose.scale.y;
                globalJointPose.scale.z = parentPose.scale.z * localJointPose.scale.z;
            }
        }
    },

    _updateMatrices: function()
    {
        var len = this._skeleton.numJoints;
        var matrices = this._matrices;
        var poses = this._globalPose.jointPoses;
        var skeleton = this._skeleton;
        for (var i = 0; i < len; ++i) {
            var pose = poses[i];
            var mtx = matrices[i];
            if (this._applyInverseBindPose)
                mtx.copyFrom(skeleton.getJoint(i).inverseBindPose);
            else
                mtx.copyFrom(Matrix4x4.IDENTITY);

            var sc = pose.scale;
            mtx.appendScale(sc.x, sc.y, sc.z);
            mtx.appendQuaternion(pose.rotation);
            mtx.appendTranslation(pose.position);
        }
    },

    _updateTexture: function()
    {
        var len = this._skeleton.numJoints;
        var data = [];

        for (var r = 0; r < 3; ++r) {
            for (var i = 0; i < len; ++i) {
                var m = this._matrices[i]._m;

                data.push(m[r], m[r + 4], m[r + 8], m[r + 12]);
            }

            for (i = len; i < META.OPTIONS.maxBones; ++i) {
                data.push(0, 0, 0, 0);
            }
        }

        this._texture.uploadData(new Float32Array(data), META.OPTIONS.maxBones, 3, false, TextureFormat.RGBA, DataType.FLOAT);
    }
};

/**
 *
 * @constructor
 */
function SkeletonAnimation(rootNode)
{
    Component.call(this);
    if (rootNode instanceof AnimationClip)
        rootNode = new SkeletonClipNode(rootNode);
    this._blendTree = new SkeletonBlendTree(rootNode);
}

SkeletonAnimation.prototype = Object.create(Component.prototype,
    {
        transferRootJoint: {
            get: function()
            {
                return this._blendTree.transferRootJoint;
            },

            set: function(value)
            {
                this._blendTree.transferRootJoint = value;
            }
        },
        applyInverseBindPose: {
            get: function()
            {
                return this._blendTree.applyInverseBindPose;
            },

            set: function(value)
            {
                this._blendTree.applyInverseBindPose = value;
            }
        },
        animationNode: {
            get: function ()
            {
                return this._blendTree.rootNode;
            },
            set function(value)
            {
                this._blendTree.rootNode = value;
                if (this._entity) this._blendTree.skeleton = this._entity.skeleton;
            }
        }
    }
);

SkeletonAnimation.prototype.setValue = function(id, value)
{
    // if any of the nodes in the animation blend tree has a value id assigned, it can be controlled here from the root.
    this._blendTree.setValue(id, value);
};

SkeletonAnimation.prototype.onAdded = function()
{
    this._blendTree.skeleton = this._entity.skeleton;
};

SkeletonAnimation.prototype.onUpdate = function(dt)
{
    if (this._blendTree.update(dt)) {
        var matrix = this._entity.matrix;
        var d = this._blendTree.rootJointDeltaPosition;
        matrix.prependTranslation(d);
        this._entity.matrix = matrix;
    }
    this._entity.skeletonMatrices = META.OPTIONS.useSkinningTexture? this._blendTree.texture : this._blendTree.matrices;
};

/**
 * Blends between two states based on a lerp value.
 * @constructor
 */
function SkeletonBinaryLerpNode()
{
    SkeletonBlendNode.call(this);
    this._value = 0;
    this._child1 = null;
    this._child2 = null;
    this._minValue = 0;
    this._maxValue = 1;
    this._numJoints = 0;
    this._t = 0;
    this._valueChanged = false;
}

SkeletonBinaryLerpNode.prototype = Object.create(SkeletonBlendNode.prototype, {
    numJoints: {
        get: function() {return this._numJoints; }
    },

    minValue: {
        get: function ()
        {
            return this._minValue;
        },

        set: function (value)
        {
            this._minValue = value;
        }
    },

    maxValue: {
        get: function()
        {
            return this._maxValue;
        },

        set: function(value)
        {
            this._maxValue = value;
        }
    },

    value: {
        get: function ()
        {
            return this._value;
        },

        set: function (v)
        {
            v = MathX.clamp(v, this._minValue, this._maxValue);
            if (this._value !== v)
                this._valueChanged = true;
            this._value = v;
            this._t = (this._value - this._minValue) / (this._maxValue - this._minValue);
        }
    },

    child1: {
        get: function()
        {
            return this._child1;
        },

        set: function(value)
        {
            this._child1 = value;
            if (this._child2 && value.numJoints !== this._child2.numJoints) throw new Error("Incompatible child nodes (numJoints mismatch)!");
            this._numJoints = value.numJoints;
        }
    },

    child2: {
        get: function ()
        {
            return this._child2;
        },

        set: function (value)
        {
            this._child2 = value;
            if (this._child1 && value.numJoints !== this._child1.numJoints) throw new Error("Incompatible child nodes (numJoints mismatch)!");
        }
    }
});

SkeletonBinaryLerpNode.prototype.update = function(dt, transferRootJoint)
{
    var updated = this._child1.update(dt, transferRootJoint);
    updated = this._child2.update(dt, transferRootJoint) || updated;
    updated = updated || this._valueChanged;

    var t = this._t;
    if (updated) {
        if (t > .999)
            this._pose.copyFrom(this._child1._pose);
        else if (t < .001)
            this._pose.copyFrom(this._child2._pose);
        else
            this._pose.interpolate(this._child1._pose, this._child2._pose, this._t);

        this._valueChanged = false;
    }

    return updated;
};

SkeletonBinaryLerpNode.prototype._applyValue = function(value)
{
    this.value = value;
};

SkeletonBinaryLerpNode.prototype.setValue = function(id, value)
{
    SkeletonBlendNode.prototype.setValue.call(this, id, value);
    this._child1.setValue(id, value);
    this._child2.setValue(id, value);
};

/**
 *
 * @param skeleton The original skeleton, needed to copy the bind pose.
 * @constructor
 */
function SkeletonFreePoseNode(skeleton)
{
    SkeletonBlendNode.call(this);
    this._skeleton = skeleton;
    this._poseInvalid = true;
    this._pose.copyBindPose(skeleton);

    this._poseLookUp = {};

    for (var i = 0; i < skeleton.numJoints; ++i) {
        var j = skeleton.getJoint(i);
        this._poseLookUp[j.name] = this._pose.jointPoses[i];
    }
}

SkeletonFreePoseNode.prototype = Object.create(SkeletonBlendNode.prototype, {
    numJoints: {
        get function() { return this._skeleton.numJoints; }
    }
});

SkeletonFreePoseNode.prototype.update = function(dt)
{
    var updated = this._poseInvalid;
    this._poseInvalid = false;
    return updated
};

SkeletonFreePoseNode.prototype.setJointRotation = function(indexOrName, quaternion)
{
    var p = this._getJointPose(indexOrName);
    p.rotation.copyFrom(quaternion);
    this._poseInvalid = true;
};

SkeletonFreePoseNode.prototype.setJointTranslation = function(indexOrName, value)
{
    var p = this._getJointPose(indexOrName);
    p.position.copyFrom(value);
    this._poseInvalid = true;
};

SkeletonFreePoseNode.prototype.setJointScale = function(indexOrName, value)
{
    var p = this._getJointPose(indexOrName);
    p.scale.copyFrom(value);
    this._poseInvalid = true;
};

SkeletonFreePoseNode.prototype._getJointPose = function(indexOrName)
{
    if (indexOrName instanceof String)
        return this._poseLookUp[indexOrName];
    else
        return this._pose.jointPoses[indexOrName];
};

/**
 *
 * @constructor
 */
function SkeletonJoint()
{
    this.name = null;
    this.parentIndex = -1;
    this.inverseBindPose = new Matrix4x4();
}

SkeletonJoint.prototype =
{
    toString: function()
    {
        return "[SkeletonJoint]";
    }
};

/**
 * This is generally the node you probably want to be using for simple crossfading between animations.
 * @constructor
 */
function SkeletonXFadeNode()
{
    SkeletonBlendNode.call(this);
    this._children = [];
    this._numJoints = 0;

    // TODO: Add the possibility to sync times, useful for syncing walk -> run!
    // in this case, the clips should have their timesteps recalculated
}

SkeletonXFadeNode.prototype = Object.create(SkeletonBlendNode.prototype, {
    numJoints: {
        get: function() {return this._numJoints; }
    }
});

SkeletonXFadeNode.prototype.update = function(dt, transferRootJoint)
{
    var len = this._children.length;

    // still fading if len > 1
    var updated = len > 1 && dt > 0;

    // update weights and remove any node that's become unused
    // do not interpolate the nodes into the pose yet, because if no updates occur, this is unnecessary
    for (var i = 0; i < len; ++i) {
        var child = this._children[i];

        updated = child.node.update(dt, transferRootJoint) || updated;

        var w = child.weight + dt * child.fadeSpeed;

        if (w > .999) {
            child.weight = 1.0;
            // we can safely remove any of the following child nodes, because their values will be lerped away
            this._children.splice(i + 1);
            break;
        }

        child.weight = w;
    }


    if (!updated) return false;

    var last = this._children.length - 1;

    // work backwards, so we can just override each old state progressively
    var childNode = this._children[last].node;
    var delta = this._rootJointDeltaPosition;
    var pose = this._pose;
    pose.copyFrom(childNode._pose);

    if (transferRootJoint)
        delta.copyFrom(childNode._rootJointDeltaPosition);
    
    for (i = last - 1; i >= 0; --i) {
        child = this._children[i];
        childNode = child.node;

        if (transferRootJoint)
            MathX.lerp(delta, childNode._rootJointDeltaPosition, child.weight, delta);

        pose.interpolate(pose, childNode._pose, child.weight);
    }

    return true;
};

/**
 * @param node A SkeletonBlendTreeNode or a clip.
 * @param time In milliseconds
 */
SkeletonXFadeNode.prototype.fadeTo = function(node, time)
{
    if (node instanceof AnimationClip) node = new SkeletonClipNode(node);

    this._numJoints = node.numJoints;
    // put the new one in front, it makes the update loop more efficient
    this._children.unshift({
        node: node,
        weight: 0.0,
        fadeSpeed: 1 / time
    });
};

/**
 * @constructor
 */
function PerspectiveCamera()
{
    Camera.call(this);

    this._vFOV = 1.047198;  // radians!
    this._aspectRatio = 0;
}


PerspectiveCamera.prototype = Object.create(Camera.prototype);

Object.defineProperties(PerspectiveCamera.prototype, {
    verticalFOV: {
        get: function()
        {
            return this._vFOV;
        },
        set: function(value)
        {
            this._vFOV = value;
            this._invalidateProjectionMatrix();
        }
    }
});

PerspectiveCamera.prototype._setAspectRatio = function(value)
{
    if (this._aspectRatio === value) return;

    this._aspectRatio = value;
    this._invalidateProjectionMatrix();
};

PerspectiveCamera.prototype._setRenderTargetResolution = function(width, height)
{
    Camera.prototype._setRenderTargetResolution.call(this, width, height);
    this._setAspectRatio(width / height);
};

PerspectiveCamera.prototype._updateProjectionMatrix = function()
{
    this._projectionMatrix.fromPerspectiveProjection(this._vFOV, this._aspectRatio, this._nearDistance, this._farDistance);
    this._projectionMatrixDirty = false;
};

/**
 *
 * @constructor
 */
function FloatController()
{
    Component.call(this);
    this._speed = 1.0;
    this._speedMultiplier = 2.0;
    this._torquePitch = 0.0;
    this._torqueYaw = 0.0;
    this._localVelocity = new Float4(0, 0, 0, 0);
    this._localAcceleration = new Float4(0, 0, 0, 0);
    this._pitch = 0.0;
    this._yaw = 0.0;
    this._mouseX = 0;
    this._mouseY = 0;

    this._torque = 1.0;    // m/s^2
    this._friction = 5.0;    // 1/s

    this._maxAcceleration = this._speed;    // m/s^2
    this._maxVelocity = this._speed;    // m/s

    this._onKeyDown = null;
    this._onKeyUp = null;
}

FloatController.prototype = Object.create(Component.prototype, {
    speed: {
        get: function()
        {
            return this._speed;
        },

        set: function(value)
        {
            this._speed = value;
            this._maxAcceleration = value;
            this._maxVelocity = value;
        }
    },

    shiftMultiplier: {
        get: function()
        {
            return this._speedMultiplier;
        },

        set: function(value)
        {
            this._speedMultiplier = value;
        }
    },

    pitch: {
        get: function()
        {
            return this._pitch;
        },

        set: function(value)
        {
            this._pitch = value;
        }
    },

    yaw: {
        get: function()
        {
            return this._yaw;
        },

        set: function(value)
        {
            this._yaw = value;
        }
    },

    roll: {
        get: function()
        {
            return this._roll;
        },

        set: function(value)
        {
            this._roll = value;
        }
    },

    torque: {
        get: function()
        {
            return this._torque;
        },

        set: function(value)
        {
            this._torque = value;
        }
    },

    friction: {
        get: function()
        {
            return this._friction;
        },

        set: function(value)
        {
            this._friction = value;
        }
    }
});

FloatController.prototype.onAdded = function(dt)
{
    var self = this;
    this._onKeyDown = function(event) {
        var keyCode = ("which" in event) ? event.which : event.keyCode;

        switch (keyCode) {
            case 16:
                self._maxVelocity = self._speed * self._speedMultiplier;
                self._maxAcceleration = self._speed * self._speedMultiplier;
                break;
            case 87:
                self._setForwardForce(-1.0);
                break;
            case 83:
                self._setForwardForce(1.0);
                break;
            case 65:
                self._setStrideForce(-1.0);
                break;
            case 68:
                self._setStrideForce(1.0);
                break;
            default:
                // nothing
        }
    };

    this._onKeyUp = function(event) {
        var keyCode = ("which" in event) ? event.which : event.keyCode;

        switch (keyCode) {
            case 16:
                self._maxVelocity = self._speed;
                self._maxAcceleration = self._speed;
                break;
            case 87:
            case 83:
                self._setForwardForce(0.0);
                break;
            case 65:
            case 68:
                self._setStrideForce(0.0);
                break;
            default:
            // nothing
        }
    };

    this._onMouseMove = function(event)
    {
        event = event || window.event;

        self._addPitch(-(self._mouseY-event.clientY) / 100);
        self._addYaw((self._mouseX-event.clientX) / 100);

        self._mouseX = event.clientX;
        self._mouseY = event.clientY;
    };

    this._onMouseDown = function(event)
    {
        self._mouseX = event.clientX;
        self._mouseY = event.clientY;
        META.TARGET_CANVAS.addEventListener("mousemove", self._onMouseMove);
    };

    this._onMouseUp = function(event)
    {
        META.TARGET_CANVAS.removeEventListener("mousemove", self._onMouseMove);
    };

    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);
    META.TARGET_CANVAS.addEventListener("mousedown", this._onMouseDown);
    META.TARGET_CANVAS.addEventListener("mouseup", this._onMouseUp);
};

FloatController.prototype.onRemoved = function(dt)
{
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
    META.TARGET_CANVAS.removeEventListener("mousemove", this._onMouseMove);
    META.TARGET_CANVAS.removeEventListener("mousedown", this._onMouseDown);
    META.TARGET_CANVAS.removeEventListener("mouseup", this._onMouseUp);
};

FloatController.prototype.onUpdate = function(dt)
{
    var seconds = dt * .001;

    var frictionForce = Float4.scale(this._localVelocity, this._friction*seconds);
    this._localVelocity.subtract(frictionForce);

    var acceleration = Float4.scale(this._localAcceleration, this._maxAcceleration*seconds);
    this._localVelocity.add(acceleration);

    var absVelocity = this._localVelocity.length;
    if (absVelocity > this._maxVelocity)
        this._localVelocity.scale(this._maxVelocity/absVelocity);

    this._pitch += this._torquePitch;
    this._yaw += this._torqueYaw;

    if (this._pitch < -Math.PI*.5) this._pitch = -Math.PI*.5;
    else if (this._pitch > Math.PI*.5) this._pitch = Math.PI*.5;

    var matrix = this.entity.matrix;
    // the original position
    var position = matrix.getColumn(3);
    var distance = Float4.scale(this._localVelocity, seconds);

    matrix.fromRotationPitchYawRoll(this._pitch, this._yaw, 0.0);
    matrix.prependTranslation(distance);
    matrix.appendTranslation(position);

    this.entity.matrix = matrix;
};

// ratio is "how far the controller is pushed", from -1 to 1
FloatController.prototype._setForwardForce = function(ratio)
{
    this._localAcceleration.z = ratio * this._maxAcceleration;
};

FloatController.prototype._setStrideForce = function(ratio)
{
    this._localAcceleration.x = ratio * this._maxAcceleration;
};

FloatController.prototype._setTorquePitch = function(ratio)
{
    this._torquePitch = ratio * this._torque;
};

FloatController.prototype._setTorqueYaw = function(ratio)
{
    this._torqueYaw = ratio * this._torque;
};

FloatController.prototype._addPitch = function(value)
{
    this._pitch += value;
};

FloatController.prototype._addYaw = function(value)
{
    this._yaw += value;
};

/**
 *
 * @param target
 * @constructor
 */
function OrbitController(lookAtTarget)
{
    Component.call(this);
    this._coords = new Float4(Math.PI *.5, Math.PI * .4, 1.0, 0.0);   // azimuth, polar, radius
    this._localAcceleration = new Float4(0.0, 0.0, 0.0, 0.0);
    this._localVelocity = new Float4(0.0, 0.0, 0.0, 0.0);

    this.touchZoomSpeed = .01;
    this.zoomSpeed = 1.0;
    this.maxRadius = 4.0;
    this.minRadius = 0.1;
    this.dampen = .9;
    this.lookAtTarget = lookAtTarget || new Float4(0.0, 0.0, 0.0, 1.0);
    this._oldMouseX = 0;
    this._oldMouseY = 0;

    this._isDown = false;
}

OrbitController.prototype = Object.create(Component.prototype,
    {
        radius: {
            get: function() { return this._coords.z; },
            set: function(value) { this._coords.z = value; }
        },

        azimuth: {
            get: function() { return this._coords.x; },
            set: function(value) { this._coords.x = value; }
        },

        polar: {
            get: function() { return this._coords.y; },
            set: function(value) { this._coords.y = value; }
        }
    });

OrbitController.prototype.onAdded = function()
{
    var self = this;

    this._onMouseWheel = function(event)
    {
        var delta = event.detail? -120 * event.detail : event.wheelDelta;
        self.setZoomImpulse(-delta * self.zoomSpeed * .0001);
    };

    this._onMouseDown = function (event)
    {
        self._oldMouseX = undefined;
        self._oldMouseY = undefined;

        self._isDown = true;
    };

    this._onMouseMove = function(event)
    {
        if (!self._isDown) return;
        self._updateMove(event.screenX, event.screenY);
    };

    this._onTouchDown = function (event)
    {
        self._oldMouseX = undefined;
        self._oldMouseY = undefined;

        if (event.touches.length === 2) {
            var touch1 = event.touches[0];
            var touch2 = event.touches[1];
            var dx = touch1.screenX - touch2.screenX;
            var dy = touch1.screenY - touch2.screenY;
            self._startPitchDistance = Math.sqrt(dx*dx + dy*dy);
            self._startZoom = self.radius;
        }

        self._isDown = true;
    };

    this._onTouchMove = function (event)
    {
        event.preventDefault();

        if (!self._isDown) return;

        var numTouches = event.touches.length;

        if (numTouches === 1) {
            var touch = event.touches[0];
            self._updateMove(touch.screenX, touch.screenY);
        }
        else if (numTouches === 2) {
            var touch1 = event.touches[0];
            var touch2 = event.touches[1];
            var dx = touch1.screenX - touch2.screenX;
            var dy = touch1.screenY - touch2.screenY;
            var dist = Math.sqrt(dx*dx + dy*dy);
            var diff = self._startPitchDistance - dist;
            self.radius = self._startZoom + diff * this.touchZoomSpeed;
        }
    };

    this._onUp = function(event) { self._isDown = false; };

    var mousewheelevt = (/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";
    META.TARGET_CANVAS.addEventListener(mousewheelevt, this._onMouseWheel);
    META.TARGET_CANVAS.addEventListener("mousemove", this._onMouseMove);
    META.TARGET_CANVAS.addEventListener("touchmove", this._onTouchMove);
    META.TARGET_CANVAS.addEventListener("mousedown", this._onMouseDown);
    META.TARGET_CANVAS.addEventListener("touchstart", this._onTouchDown);
    META.TARGET_CANVAS.addEventListener("mouseup", this._onUp);
    META.TARGET_CANVAS.addEventListener("touchend", this._onUp);
};

OrbitController.prototype.onRemoved = function()
{
    var mousewheelevt = (/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";
    META.TARGET_CANVAS.removeEventListener(mousewheelevt, this._onMouseWheel);
    META.TARGET_CANVAS.removeEventListener("mousemove", this._onMouseMove);
    META.TARGET_CANVAS.removeEventListener("touchmove", this._onTouchMove);
    META.TARGET_CANVAS.removeEventListener("mousedown", this._onMouseDown);
    META.TARGET_CANVAS.removeEventListener("touchstart", this._onTouchDown);
    META.TARGET_CANVAS.removeEventListener("mouseup", this._onUp);
    META.TARGET_CANVAS.removeEventListener("touchend", this._onUp);
};

OrbitController.prototype.onUpdate = function(dt)
{
    this._localVelocity.x *= this.dampen;
    this._localVelocity.y *= this.dampen;
    this._localVelocity.z *= this.dampen;
    this._localVelocity.x += this._localAcceleration.x;
    this._localVelocity.y += this._localAcceleration.y;
    this._localVelocity.z += this._localAcceleration.z;
    this._localAcceleration.x = 0.0;
    this._localAcceleration.y = 0.0;
    this._localAcceleration.z = 0.0;

    this._coords.add(this._localVelocity);
    this._coords.y = MathX.clamp(this._coords.y, 0.1, Math.PI - .1);
    this._coords.z = MathX.clamp(this._coords.z, this.minRadius, this.maxRadius);

    var matrix = this.entity.matrix;
    var pos = new Float4();
    pos.fromSphericalCoordinates(this._coords.z, this._coords.x, this._coords.y);
    pos.add(this.lookAtTarget);
    matrix.lookAt(this.lookAtTarget, pos, Float4.Y_AXIS);
    this.entity.matrix = matrix;
};

    // ratio is "how far the controller is pushed", from -1 to 1
OrbitController.prototype.setAzimuthImpulse  = function(value)
{
    this._localAcceleration.x = value;
};

OrbitController.prototype.setPolarImpulse = function(value)
{
    this._localAcceleration.y = value;
};

OrbitController.prototype.setZoomImpulse = function(value)
{
    this._localAcceleration.z = value;
};

OrbitController.prototype._updateMove = function(x, y)
{
    if (this._oldMouseX !== undefined) {
        var dx = x - this._oldMouseX;
        var dy = y - this._oldMouseY;
        this.setAzimuthImpulse(dx * .0015);
        this.setPolarImpulse(-dy * .0015);
    }
    this._oldMouseX = x;
    this._oldMouseY = y;
};

function DataStream(dataView)
{
    this._dataView = dataView;
    this._offset = 0;
    this._endian = DataStream.LITTLE_ENDIAN;
}

DataStream.LITTLE_ENDIAN = true;
DataStream.BIG_ENDIAN = false;

DataStream.prototype =
{
    get offset() { return this._offset; },
    set offset(value) { this._offset = value; },

    get endian() { return this._endian; },
    set endian(value) { this._endian = value; },

    get byteLength () { return this._dataView.byteLength; },
    get bytesAvailable() { return this._dataView.byteLength - this._offset; },

    getChar: function()
    {
        return String.fromCharCode(this.getUint8());
    },

    getUint8: function()
    {
        return this._dataView.getUint8(this._offset++);
    },

    getUint16: function()
    {
        var data = this._dataView.getUint16(this._offset, this._endian);
        this._offset += 2;
        return data;
    },

    getUint32: function()
    {
        var data = this._dataView.getUint32(this._offset, this._endian);
        this._offset += 4;
        return data;
    },

    getInt8: function()
    {
        return this._dataView.getInt8(this._offset++);
    },

    getInt16: function()
    {
        var data = this._dataView.getInt16(this._offset, this._endian);
        this._offset += 2;
        return data;
    },

    getInt32: function()
    {
        var data = this._dataView.getInt32(this._offset, this._endian);
        this._offset += 4;
        return data;
    },

    // dangerous, but might be an okay approximation
    getInt64AsFloat64: function()
    {
        var L, B;
        if (this._endian === DataStream.LITTLE_ENDIAN) {
            L = this._dataView.getUint32(this._offset, this._endian);
            B = this._dataView.getInt32(this._offset + 4, this._endian);
        }
        else {
            B = this._dataView.getInt32(this._offset, this._endian);
            L = this._dataView.getUint32(this._offset + 4, this._endian);
        }
        this._offset += 8;
        return L + B * 4294967296.0;
    },

    getFloat32: function()
    {
        var data = this._dataView.getFloat32(this._offset, this._endian);
        this._offset += 4;
        return data;
    },

    getFloat64: function()
    {
        var data = this._dataView.getFloat64(this._offset, this._endian);
        this._offset += 8;
        return data;
    },

    getArray: function(len)
    {
        return this._readArray(len, Array, this.getUint8);
    },

    getUint8Array: function(len)
    {
        return this._readArray(len, Uint8Array, this.getUint8);
    },

    getUint16Array: function(len)
    {
        return this._readArray(len, Uint16Array, this.getUint16);
    },

    getUint32Array: function(len)
    {
        return this._readArray(len, Uint32Array, this.getUint32);
    },

    getInt8Array: function(len)
    {
        return this._readArray(len, Int8Array, this.getInt8);
    },

    getInt16Array: function(len)
    {
        return this._readArray(len, Int16Array, this.getInt16);
    },

    getInt32Array: function(len)
    {
        return this._readArray(len, Int32Array, this.getInt32);
    },

    getInt64AsFloat64Array: function(len)
    {
        return this._readArray(len, Float64Array, this.getInt64AsFloat64);
    },

    getFloat32Array: function(len)
    {
        return this._readArray(len, Float32Array, this.getFloat32);
    },

    getFloat64Array: function(len)
    {
        return this._readArray(len, Float64Array, this.getFloat64);
    },

    getString: function(len)
    {
        if (!len) return this._get0String();

        var str = "";

        for (var i = 0; i < len; ++i)
            str += this.getChar();

        return str;
    },

    _get0String: function()
    {
        var str = "";

        do {
            var ch = this.getUint8();
            if (ch) str += String.fromCharCode(ch);
        } while (ch !== 0);

        return str;
    },

    _readArray: function(len, arrayType, func)
    {
        var arr = new arrayType(len);

        for (var i = 0; i < len; ++i)
            arr[i] = func.call(this);

        return arr;
    }
};

/**
 * @constructor
 */
function EffectPass(vertexShader, fragmentShader)
{
    vertexShader = vertexShader || ShaderLibrary.get("default_post_vertex.glsl");
    var shader = new Shader(vertexShader, fragmentShader);

    MaterialPass.call(this, shader);

    this._vertexLayout = null;
    this._cullMode = CullMode.NONE;
    this._depthTest = Comparison.DISABLED;
    this._writeDepth = false;
    this.setMesh(RectMesh.DEFAULT);

    this.setTexture("hx_dither2D", DEFAULTS.DEFAULT_2D_DITHER_TEXTURE);
}

EffectPass.prototype = Object.create(MaterialPass.prototype);

EffectPass.prototype.setMesh = function(mesh)
{
    if (this._mesh === mesh) return;
    this._mesh = mesh;
    this._vertexLayout = new VertexLayout(this._mesh, this);
};

EffectPass.prototype.updateRenderState = function(renderer)
{
    var cam = renderer._camera;
    this.updateInstanceRenderState(cam);
    this.updatePassRenderState(cam, renderer);

    // TODO: Could we implement this by GL.setMesh(mesh, layout), also in renderer?
    this._mesh._vertexBuffers[0].bind();
    this._mesh._indexBuffer.bind();

    var layout = this._vertexLayout;
    var attributes = layout.attributes;
    var len = attributes.length;

    for (var i = 0; i < len; ++i) {
        var attribute = attributes[i];
        GL.gl.vertexAttribPointer(attribute.index, attribute.numComponents, GL.gl.FLOAT, false, attribute.stride, attribute.offset);
    }

    GL.enableAttributes(layout._numAttributes);
};

/**
 * @constructor
 */
function GaussianBlurPass(radius)
{
    radius = Math.floor(radius);

    this._initWeights(radius);

    var defines = {
        RADIUS: radius,
        NUM_WEIGHTS: radius + 1
    };

    var vertex = ShaderLibrary.get("gaussian_blur_vertex.glsl", defines);
    var fragment = ShaderLibrary.get("gaussian_blur_fragment.glsl", defines);

    EffectPass.call(this, vertex, fragment);

    this.setUniformArray("gaussianWeights", new Float32Array(this._weights));
}

GaussianBlurPass.prototype = Object.create(EffectPass.prototype);

GaussianBlurPass.prototype._initWeights = function(radius)
{
    this._weights = [];

    var gaussian = CenteredGaussianCurve.fromRadius(radius, .01);

    var total = 0;
    for (var j = 0; j <= radius; ++j) {
        this._weights[j] = gaussian.getValueAt(j);
        total += j > 0? this._weights[j] * 2.0 : 1.0;
    }

    total = 1.0 / total;

    for (j = 0; j <= radius; ++j) {
        this._weights[j] *= total;
    }
};

/**
 *
 * @constructor
 */

function Effect()
{
    Component.call(this);
    this._isSupported = true;
    this._mesh = null;
    this._outputsGamma = false;
    this._needsNormalDepth = false;
}

Effect.prototype = Object.create(Component.prototype,
    {
        needsNormalDepth: {
            get: function() { return this._needsNormalDepth; },
            set: function(value) { this._needsNormalDepth = value; }
        },

        hdrTarget: {
            get: function() { return this._renderer._hdrFront.fbo; }
        },

        hdrSource: {
            get: function() { return this._renderer._hdrBack.texture; }
        }
    }
);

Effect.prototype.isSupported = function()
{
    return this._isSupported;
};

Effect.prototype.render = function(renderer, dt)
{
    this._renderer = renderer;
    this.draw(dt);
};

Effect.prototype.draw = function(dt)
{
    throw new Error("Abstract method error!");
};

Effect.prototype._drawPass = function(pass)
{
    pass.updateRenderState(this._renderer);
    GL.drawElements(GL.gl.TRIANGLES, 6, 0);
};

Effect.prototype.onAdded = function()
{
    this._entity._registerEffect(this);
};

Effect.prototype.onRemoved = function()
{
    this._entity._unregisterEffect(this);
};

/**
 * Used when we need to current render target as a source.
 */
Effect.prototype._swapHDRFrontAndBack = function()
{
    this._renderer._swapHDRFrontAndBack();
};

/**
 *
 * @constructor
 */
function Bloom(radius, strength, downScale, anisotropy)
{
    Effect.call(this);

    this._downScale = downScale || 4;

    this._targetWidth = -1;
    this._targetHeight = -1;

    radius = radius || 256;
    radius /= this._downScale;
    this._thresholdPass = new EffectPass(null, ShaderLibrary.get("bloom_threshold_fragment.glsl"));
    this._compositePass = new EffectPass(ShaderLibrary.get("bloom_composite_vertex.glsl"), ShaderLibrary.get("bloom_composite_fragment.glsl"));
    this._blurPass = new GaussianBlurPass(radius);
    this._blurSourceSlot = this._blurPass.getTextureSlot("sourceTexture");
    this._thresholdWidth = -1;
    this._thresholdHeight = -1;

    this._thresholdMaps = [];
    this._smallFBOs = [];

    for (var i = 0; i < 2; ++i) {
        this._thresholdMaps[i] = new Texture2D();
        this._thresholdMaps[i].filter = TextureFilter.BILINEAR_NOMIP;
        this._thresholdMaps[i].wrapMode = TextureWrapMode.CLAMP;
        this._smallFBOs[i] = new FrameBuffer([this._thresholdMaps[i]]);
    }

    this._anisotropy = anisotropy || 1;

    this._strength = strength === undefined ? 1.0 : strength;

    if (capabilities.EXT_HALF_FLOAT_TEXTURES_LINEAR && capabilities.EXT_HALF_FLOAT_TEXTURES)
        this.thresholdLuminance = META.OPTIONS.hdr;
    else
        this.thresholdLuminance = .9;

    this._compositePass.setTexture("bloomTexture", this._thresholdMaps[0]);

    this.strength = this._strength;
}

Bloom.prototype = Object.create(Effect.prototype,
    {
        strength: {
            get: function ()
            {
                return this._strength;
            },

            set: function (value)
            {
                this._strength = value;
                this._compositePass.setUniform("strength", this._strength);
            }
        },

        thresholdLuminance: {
            get: function ()
            {
                return this._thresholdLuminance;
            },

            set: function (value)
            {
                this._thresholdLuminance = value;
                this._thresholdPass.setUniform("threshold", value);
            }
        }
    }
);

Bloom.prototype._initTextures = function ()
{
    for (var i = 0; i < 2; ++i) {
        this._thresholdWidth = Math.ceil(this._targetWidth / this._downScale);
        this._thresholdHeight = Math.ceil(this._targetHeight / this._downScale);
        this._thresholdMaps[i].initEmpty(this._thresholdWidth, this._thresholdHeight, TextureFormat.RGB, _HX_.HDR_FORMAT);
        this._smallFBOs[i].init();
    }
};

Bloom.prototype.draw = function (dt)
{
    if (this._renderer._width !== this._targetWidth || this._renderer._height !== this._targetHeight) {
        this._targetWidth = this._renderer._width;
        this._targetHeight = this._renderer._height;
        this._initTextures();
    }

    GL.setRenderTarget(this._smallFBOs[0]);
    GL.clear();
    this._drawPass(this._thresholdPass);

    GL.setRenderTarget(this._smallFBOs[1]);
    GL.clear();
    this._blurSourceSlot.texture = this._thresholdMaps[0];
    this._blurPass.setUniform("stepSize", {x: 1.0 / this._thresholdWidth, y: 0.0});
    this._drawPass(this._blurPass);

    GL.setRenderTarget(this._smallFBOs[0]);
    GL.clear();
    this._blurSourceSlot.texture = this._thresholdMaps[1];
    this._blurPass.setUniform("stepSize", {x: 0.0, y: this._anisotropy / this._thresholdHeight});
    this._drawPass(this._blurPass);

    GL.setRenderTarget(this.hdrTarget);
    GL.clear();
    this._drawPass(this._compositePass);
};

Bloom.prototype.dispose = function ()
{
    for (var i = 0; i < 2; ++i) {
        this._smallFBOs[i].dispose();
        this._thresholdMaps[i].dispose();
    }

    this._smallFBOs = null;
    this._thresholdMaps = null;
};

/**
 *
 * @constructor
 */
function Blur(numSamples, radius)
{
    if (!radius) radius = numSamples;
    Effect.call(this);

    this._blurPass = new GaussianBlurPass(radius);
    this._blurSourceSlot = this._blurPass.getTextureSlot("sourceTexture");
    this._radius = radius;
    this._numSamples = numSamples;
}

Blur.prototype = Object.create(Effect.prototype,
    {
        radius: {
            get: function() {
                return this._radius;
            },

            set: function(value) {
                this._radius = value;
            }
        }
    });

Blur.prototype.draw = function(dt)
{
    var ratio = this._radius / this._numSamples;
    // we're manually setting source textures instead of using hx_backbuffer because the GaussianBlurPass needs to
    // handle different textures too (see bloom)
    GL.setRenderTarget(this.hdrTarget);
    GL.clear();
    this._blurSourceSlot.texture = this.hdrSource;
    this._blurPass.setUniform("stepSize", {x: ratio / this.hdrSource.width, y: 0.0});
    this._drawPass(this._blurPass);

    this._swapHDRFrontAndBack();

    GL.setRenderTarget(this.hdrTarget);
    GL.clear();
    this._blurSourceSlot.texture = this.hdrSource;
    this._blurPass.setUniform("stepSize", {x: 0.0, y: ratio / this.hdrSource.height});
    this._drawPass(this._blurPass);
};

Blur.prototype.dispose = function()
{
    for (var i = 0; i < 2; ++i) {
        this._smallFBOs[i].dispose();
        this._thresholdMaps[i].dispose();
    }

    this._smallFBOs = null;
    this._thresholdMaps = null;
};

/**
 *
 * @constructor
 */
function CopyTexturePass()
{
    EffectPass.call(this, null, ShaderLibrary.get("copy_fragment.glsl"));
}

CopyTexturePass.prototype = Object.create(EffectPass.prototype);

CopyTexturePass.prototype.setSourceTexture = function(value)
{
    this.setTexture("sampler", value);
};

function ToneMapEffect(adaptive)
{
    this._adaptive = adaptive === undefined? false : adaptive;

    if (this._adaptive && (!capabilities.EXT_SHADER_TEXTURE_LOD || !capabilities.EXT_HALF_FLOAT_TEXTURES)) {
        console.log("Warning: adaptive tone mapping not supported, using non-adaptive");
        this._adaptive = false;
        return;
    }

    Effect.call(this);

    this._toneMapPass = this._createToneMapPass();

    if (this._adaptive) {
        this._extractLuminancePass = new EffectPass(null, ShaderLibrary.get("tonemap_reference_fragment.glsl"));
        this._extractLuminancePass.blendState = new BlendState(BlendFactor.CONSTANT_ALPHA, BlendFactor.ONE_MINUS_CONSTANT_ALPHA, BlendOperation.ADD, new Color(1.0, 1.0, 1.0, 1.0));

        this._luminanceMap = new Texture2D();
        this._luminanceMap.initEmpty(256, 256, TextureFormat.RGBA, capabilities.EXT_HALF_FLOAT_TEXTURES.HALF_FLOAT_OES);
        this._luminanceFBO = new FrameBuffer(this._luminanceMap);
        this._luminanceFBO.init();

        this._adaptationRate = 500.0;

        this._toneMapPass.setTexture("hx_luminanceMap", this._luminanceMap);
        this._toneMapPass.setUniform("hx_luminanceMipLevel", MathX.log2(this._luminanceMap._width));
    }

    this.key = .25;
    this.exposure = 0.0;
}

ToneMapEffect.prototype = Object.create(Effect.prototype);

ToneMapEffect.prototype._createToneMapPass = function()
{
    throw new Error("Abstract method called!");
};


ToneMapEffect.prototype.dispose = function()
{
    Effect.prototype.dispose.call(this);
    this._luminanceFBO.dispose();
    this._luminanceMap.dispose();
};

ToneMapEffect.prototype.draw = function(dt)
{
    if (this._adaptive) {
        if (!this._isSupported) return;

        var amount = this._adaptationRate > 0 ? dt / this._adaptationRate : 1.0;
        if (amount > 1) amount = 1;

        this._extractLuminancePass.blendState.color.a = amount;

        GL.setRenderTarget(this._luminanceFBO);
        // can't clear at this point
        this._drawPass(this._extractLuminancePass);
        this._luminanceMap.generateMipmap();
    }

    GL.setRenderTarget(this.hdrTarget);
    GL.clear();
    this._drawPass(this._toneMapPass);
};


Object.defineProperties(ToneMapEffect.prototype, {
    exposure: {
        get: function()
        {
            return this._exposure;
        },
        set: function(value)
        {
            this._exposure = value;
            if (this._isSupported)
                this._toneMapPass.setUniform("hx_exposure", Math.pow(2.0, value));
        }
    },

    /**
     * The intended average luminosity in the scene
     */
    key: {
        get: function()
        {
            return this._key;
        },
        set: function(value)
        {
            this._key = value;
            if (this._isSupported)
                this._toneMapPass.setUniform("hx_key", value);
        }
    },

    /**
     * The amount of time in milliseconds for the "lens" to adapt to the frame's exposure.
     */
    adaptationRate: {
        get: function()
        {
            return this._adaptationRate;
        },

        set: function(value)
        {
            this._adaptationRate = value;
        }
    }
});

/**
 *
 * @constructor
 */
function FilmicToneMapping(adaptive)
{
    ToneMapEffect.call(this, adaptive);
    this._outputsGamma = true;

}

FilmicToneMapping.prototype = Object.create(ToneMapEffect.prototype);

FilmicToneMapping.prototype._createToneMapPass = function()
{
    var defines = {};
    var extensions = "";

    if (this._adaptive) {
        defines.HX_ADAPTIVE = 1;
        extensions = "#texturelod\n";
    }

    return new EffectPass(
        null,
        extensions + ShaderLibrary.get("snippets_tonemap.glsl", defines) + "\n" + ShaderLibrary.get("tonemap_filmic_fragment.glsl")
    );
};

/**
 * @constructor
 */
function Fog(density, tint, heightFallOff, startDistance)
{
    Effect.call(this);

    this._fogPass = new EffectPass(ShaderLibrary.get("fog_vertex.glsl"), ShaderLibrary.get("fog_fragment.glsl"));
    this.needsNormalDepth = true;
    this.density = density === undefined? .001 : density;
    this.tint = tint === undefined? new Color(1, 1, 1, 1) : tint;
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
                this._tint = value;
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


Fog.prototype.draw = function(dt)
{
    GL.setRenderTarget(this.hdrTarget);
    GL.clear();
    this._drawPass(this._fogPass);
};

/**
 *
 * @constructor
 */
function FXAA()
{
    Effect.call(this);

    this._pass = new EffectPass(null, ShaderLibrary.get("fxaa_fragment.glsl"));
    this._pass.setUniform("edgeThreshold", 1/8);
    this._pass.setUniform("edgeThresholdMin", 1/16);
    this._pass.setUniform("edgeSharpness", 4.0);
}

FXAA.prototype = Object.create(Effect.prototype);

FXAA.prototype.draw = function(dt)
{
    GL.setRenderTarget(this.hdrTarget);
    GL.clear();
    this._drawPass(this._pass);
};

/**
 * @param numSamples
 * @constructor
 */
function HBAO(numRays, numSamplesPerRay)
{
    numRays = numRays || 4;
    numSamplesPerRay = numSamplesPerRay || 4;
    if (numRays > 32) numRays = 32;
    if (numSamplesPerRay > 32) numSamplesPerRay = 32;

    this._numRays = numRays;
    this._strength = 1.0;
    this._bias = .01;
    this._fallOffDistance = 1.0;
    this._radius = .5;
    this._scale = .5;
    this._sampleDirTexture = null;
    this._ditherTexture = null;

    Effect.call(this);
    this._aoPass = new EffectPass(
        ShaderLibrary.get("hbao_vertex.glsl"),
        ShaderLibrary.get("hbao_fragment.glsl", {
            NUM_RAYS: numRays,
            NUM_SAMPLES_PER_RAY: numSamplesPerRay
        })
    );

    this._blurPass = new EffectPass(ShaderLibrary.get("ao_blur_vertex.glsl"), ShaderLibrary.get("ao_blur_fragment.glsl"));

    this._initSampleDirTexture();
    this._initDitherTexture();
    this._aoPass.setUniform("strengthPerRay", this._strength / this._numRays);
    this._aoPass.setUniform("rcpFallOffDistance", 1.0 / this._fallOffDistance);
    this._aoPass.setUniform("halfSampleRadius", this._radius *.5);
    this._aoPass.setUniform("bias", this._bias);
    this._aoPass.setTexture("ditherTexture", this._ditherTexture);
    this._aoPass.setTexture("sampleDirTexture", this._sampleDirTexture);
    this._sourceTextureSlot = this._blurPass.getTextureSlot("source");

    this._aoTexture = new Texture2D();
    this._aoTexture.filter = TextureFilter.BILINEAR_NOMIP;
    this._aoTexture.wrapMode = TextureWrapMode.CLAMP;
    this._backTexture = new Texture2D();
    this._backTexture.filter = TextureFilter.BILINEAR_NOMIP;
    this._backTexture.wrapMode = TextureWrapMode.CLAMP;
    this._fbo1 = new FrameBuffer(this._backTexture);
    this._fbo2 = new FrameBuffer(this._aoTexture);
}

HBAO.prototype = Object.create(Effect.prototype);

// every AO type should implement this
HBAO.prototype.getAOTexture = function()
{
    return this._aoTexture;
};

Object.defineProperties(HBAO.prototype, {
    sampleRadius: {
        get: function ()
        {
            return this._radius;
        },

        set: function (value)
        {
            this._radius = value;
            this._aoPass.setUniform("halfSampleRadius", this._radius * .5);
        }
    },

    fallOffDistance: {
        get: function ()
        {
            return this._fallOffDistance;
        },
        set: function (value)
        {
            this._fallOffDistance = value;
            this._aoPass.setUniform("rcpFallOffDistance", 1.0 / this._fallOffDistance);
        }
    },

    strength: {
        get: function()
        {
            return this._strength;
        },
        set: function (value)
        {
            this._strength = value;
            this._aoPass.setUniform("strengthPerRay", this._strength / this._numRays);
        }
    },

    bias: {
        get: function()
        {
            return this._bias;
        },
        set: function (value)
        {
            this._bias = value;
            this._aoPass.setUniform("bias", this._bias);
        }
    },

    scale: {
        get: function() { return this._scale; },
        set: function(value) { this._scale = value; }
    }
});

HBAO.prototype.draw = function(dt)
{
    var w = this._renderer._width * this._scale;
    var h = this._renderer._height * this._scale;

    if (TextureUtils.assureSize(w, h, this._aoTexture, this._fbo2)) {
        TextureUtils.assureSize(w, h, this._backTexture, this._fbo1);
        this._aoPass.setUniform("ditherScale", {x: w * .25, y: h * .25});
    }

    GL.setClearColor(Color.WHITE);

    GL.setRenderTarget(this._fbo1);
    GL.clear();
    this._drawPass(this._aoPass);

    GL.setRenderTarget(this._fbo2);
    GL.clear();
    this._blurPass.setUniform("pixelSize", {x: 1.0 / w, y: 1.0 / h});
    this._sourceTextureSlot.texture = this._backTexture;
    this._drawPass(this._blurPass);

    GL.setClearColor(Color.BLACK);
};

HBAO.prototype._initSampleDirTexture = function()
{
    this._sampleDirTexture = new Texture2D();
    var data = [];
    var j = 0;

    for (var i = 0; i < 256; ++i)
    {
        var angle = i / 256 * 2.0 * Math.PI;
        var r = Math.cos(angle)*.5 + .5;
        var g = Math.sin(angle)*.5 + .5;
        data[j] = Math.round(r * 0xff);
        data[j+1] = Math.round(g * 0xff);
        data[j+2] = 0x00;
        data[j+3] = 0xff;
        j += 4;
    }

    this._sampleDirTexture.uploadData(new Uint8Array(data), 256, 1, false);
    this._sampleDirTexture.filter = TextureFilter.NEAREST_NOMIP;
    this._sampleDirTexture.wrapMode = TextureWrapMode.REPEAT;
};

HBAO.prototype._initDitherTexture = function()
{
    this._ditherTexture = new Texture2D();
    var data = [];

    var i;
    var j = 0;
    var offsets1 = [];
    var offsets2 = [];

    for (i = 0; i < 16; ++i) {
        offsets1.push(i / 16.0);
        offsets2.push(i / 15.0);
    }

    ArrayUtils.shuffle(offsets1);
    ArrayUtils.shuffle(offsets2);

    i = 0;

    for (var y = 0; y < 4; ++y) {
        for (var x = 0; x < 4; ++x) {
            var r = offsets1[i];
            var g = offsets2[i];

            ++i;

            data[j] = Math.round(r * 0xff);
            data[j + 1] = Math.round(g * 0xff);
            data[j + 2] = 0x00;
            data[j + 3] = 0xff;

            j += 4;
        }
    }

    this._ditherTexture.uploadData(new Uint8Array(data), 4, 4, false);
    this._ditherTexture.filter = TextureFilter.NEAREST_NOMIP;
    this._ditherTexture.wrapMode = TextureWrapMode.REPEAT;
};

/**
 *
 * @param numSamples
 */
function SSAO(numSamples)
{
    numSamples = numSamples || 8;
    if (numSamples > 64) numSamples = 64;

    this._numSamples = numSamples;
    this._strength = 1.0;
    this._fallOffDistance = 1.0;
    this._radius = .5;
    this._scale = .5;
    this._ditherTexture = null;

    Effect.call(this);

    this._ssaoPass = new EffectPass(null,
        ShaderLibrary.get("ssao_fragment.glsl",
            {
                NUM_SAMPLES: numSamples
            }
        ));
    this._blurPass = new EffectPass(ShaderLibrary.get("ao_blur_vertex.glsl"), ShaderLibrary.get("ao_blur_fragment.glsl"));

    this._initSamples();
    this._initDitherTexture();
    this._ssaoPass.setUniform("strengthPerSample", 2.0 * this._strength / this._numSamples);
    this._ssaoPass.setUniform("rcpFallOffDistance", 1.0 / this._fallOffDistance);
    this._ssaoPass.setUniform("sampleRadius", this._radius);
    this._ssaoPass.setTexture("ditherTexture", this._ditherTexture);
    this._sourceTextureSlot = this._blurPass.getTextureSlot("source");

    this._ssaoTexture = new Texture2D();
    this._ssaoTexture.filter = TextureFilter.BILINEAR_NOMIP;
    this._ssaoTexture.wrapMode = TextureWrapMode.CLAMP;
    this._backTexture = new Texture2D();
    this._backTexture.filter = TextureFilter.BILINEAR_NOMIP;
    this._backTexture.wrapMode = TextureWrapMode.CLAMP;
    this._fbo1 = new FrameBuffer(this._backTexture);
    this._fbo2 = new FrameBuffer(this._ssaoTexture);
}

SSAO.prototype = Object.create(Effect.prototype);

// every SSAO type should implement this
SSAO.prototype.getAOTexture = function()
{
    return this._ssaoTexture;
};

Object.defineProperties(SSAO.prototype, {
    sampleRadius: {
        get: function ()
        {
            return this._radius;
        },
        set: function (value)
        {
            this._radius = value;
            this._ssaoPass.setUniform("sampleRadius", this._radius);
        }
    },

    fallOffDistance: {
        get: function ()
        {
            return this._fallOffDistance;
        },
        set: function (value)
        {
            this._fallOffDistance = value;
            this._ssaoPass.setUniform("rcpFallOffDistance", 1.0 / this._fallOffDistance);
        }
    },

    strength: {
        get: function()
        {
            return this._strength;
        },
        set: function (value)
        {
            this._strength = value;
            this._ssaoPass.setUniform("strengthPerSample", 2.0 * this._strength / this._numSamples);
        }
    },

    scale: {
        get: function() { return this._scale; },
        set: function(value) { this._scale = value; }
    }
});


SSAO.prototype._initSamples = function()
{
    var samples = [];
    var j = 0;
    var poissonPoints = PoissonSphere.DEFAULT.getPoints();

    for (var i = 0; i < this._numSamples; ++i) {
        var point = poissonPoints[i];

        // power of two, to create a bit more for closer occlusion
        samples[j++] = Math.pow(point.x, 2);
        samples[j++] = Math.pow(point.y, 2);
        samples[j++] = Math.pow(point.z, 2);
    }

    this._ssaoPass.setUniformArray("samples", new Float32Array(samples));
};

SSAO.prototype.draw = function(dt)
{
    var w = this._renderer._width * this._scale;
    var h = this._renderer._height * this._scale;

    if (TextureUtils.assureSize(w, h, this._ssaoTexture, this._fbo2)) {
        TextureUtils.assureSize(w, h, this._backTexture, this._fbo1);
        this._ssaoPass.setUniform("ditherScale", {x: w *.25, y: h *.25});
    }

    GL.setClearColor(Color.WHITE);

    GL.setRenderTarget(this._fbo1);
    GL.clear();
    this._drawPass(this._ssaoPass);

    GL.setRenderTarget(this._fbo2);
    GL.clear();
    this._blurPass.setUniform("pixelSize", {x: 1.0 / w, y: 1.0 / h});
    this._sourceTextureSlot.texture = this._backTexture;
    this._drawPass(this._blurPass);

    GL.setClearColor(Color.BLACK);
};

SSAO.prototype._initDitherTexture = function()
{
    var data = [ 126, 255, 126, 255, 135, 253, 105, 255, 116, 51, 26, 255, 137, 57, 233, 255, 139, 254, 121, 255, 56, 61, 210, 255, 227, 185, 73, 255, 191, 179, 30, 255, 107, 245, 173, 255, 205, 89, 34, 255, 191, 238, 138, 255, 56, 233, 125, 255, 198, 228, 161, 255, 85, 13, 164, 255, 140, 248, 168, 255, 147, 237, 65, 255 ];

    // in case you're wondering, below is how the list above is generated:
    // We're just using fixed data to prevent poor random results
    /*var n = new HX.Float4();
    for (var i = 0; i < 16; ++i) {
        var azimuthal = Math.random() * Math.PI * 2.0;
        var polar = Math.random() * Math.PI;
        n.fromSphericalCoordinates(1.0, azimuthal, polar);
        data[i * 4] = Math.round((n.x * .5 + .5) * 0xff);
        data[i * 4 + 1] = Math.round((n.y * .5 + .5) * 0xff);
        data[i * 4 + 2] = Math.round((n.z * .5 + .5) * 0xff);
        data[i * 4 + 3] = 0xff;
    }
    console.log(data.join(", "));*/

    this._ditherTexture = new Texture2D();
    this._ditherTexture.uploadData(new Uint8Array(data), 4, 4, false);
    this._ditherTexture.filter = TextureFilter.NEAREST_NOMIP;
    this._ditherTexture.wrapMode = TextureWrapMode.REPEAT;
};

/**
 *
 * @constructor
 */
function ReinhardToneMapping(adaptive)
{
    ToneMapEffect.call(this, adaptive);
}

ReinhardToneMapping.prototype = Object.create(ToneMapEffect.prototype);

ReinhardToneMapping.prototype._createToneMapPass = function()
{
    var defines = {};
    var extensions = "";

    if (this._adaptive) {
        defines.HX_ADAPTIVE = 1;
        extensions += "#texturelod\n";
    }

    return new EffectPass(
        null,
        extensions + ShaderLibrary.get("snippets_tonemap.glsl", defines) + "\n" + ShaderLibrary.get("tonemap_reinhard_fragment.glsl")
    );
};

var FileUtils =
{
    extractPathAndFilename: function(filename)
    {
        var index = filename.lastIndexOf("/");
        var obj = {};

        if (index >= 0) {
            obj.path = filename.substr(0, index + 1);
            obj.filename = filename.substr(index + 1);
        }
        else {
            obj.path = "./";
            obj.filename = filename;
        }

        return obj;
    }
};

function URLLoader(headers)
{
    this._params = undefined;
    this._data = null;
    this._timeout = 0;
    this._method = 'GET';
    this._type = URLLoader.DATA_TEXT;
    this._headers = headers || {};
}

URLLoader.ERROR_TIME_OUT = 408;
URLLoader.METHOD_GET = 'get';
URLLoader.METHOD_POST = 'post';

URLLoader.DATA_TEXT = 0;
URLLoader.DATA_BINARY = 1;

URLLoader.prototype =
{
    get type()
    {
        return this._type;
    },

    set type(value)
    {
        this._type = value;
    },

    get method()
    {
        return this._method;
    },

    set method(value)
    {
        this._method = value;
    },

    get timeoutDuration()
    {
        return this._timeout;
    },

    set timeoutDuration(milliseconds)
    {
        this._timeout = milliseconds;
    },

    get parameters()
    {
        return this._params;
    },

    set parameters(params)
    {
        this._params = params;
    },

    get data()
    {
        return this._data;
    },

    setRequestHeader: function(name, value)
    {
        this._headers[name] = value;
    },

    load: function (url)
    {
        var request = new XMLHttpRequest();
        request.open(this._method, url, true);

        for (var key in this._headers) {
            if (this._headers.hasOwnProperty(key))
                request.setRequestHeader(key, this._headers[key]);
        }

        if (this._timeout)
            request.timeout = this._timeout;

        if (this._type === URLLoader.DATA_BINARY)
            request.responseType = "arraybuffer";
        else
            request.overrideMimeType("application/json");

        var self = this;

        request.ontimeout = function ()
        {
            self.onError(URLLoader.ERROR_TIME_OUT);
        };

        request.onreadystatechange = function ()
        {
            var DONE = this.DONE || 4;
            if (this.readyState === DONE) {
                if (this.status === 200) {
                    this._data = self._type === URLLoader.DATA_TEXT? request.responseText : new DataView(request.response);
                    if (self.onComplete) self.onComplete(this._data);
                }
                else if (self.onError)
                    self.onError(this.status);
            }
        };

        request.send(this._params);
    },

    // made to assign
    onComplete: function (data)
    {
    },

    onError: function (errorStatus)
    {
    }
};

function Importer(containerType, dataType)
{
    this._dataType = dataType === undefined? URLLoader.DATA_TEXT : dataType;
    this._containerType = containerType;
    this.onComplete = null;
    this.onFail = null;
    this.fileMap = null;
    // be able to pass importer specific settings. crossOrigin is used for images, fe.
    this.options = {};
    this.path = "";
    this.filename = "";
}

Importer.prototype =
    {
        get dataType() { return this._dataType; },
        createContainer: function() { return new this._containerType(); },

        parse: function(data, target) {},

        _notifyComplete: function(asset)
        {
            if (!this.onComplete) return;

            if (this.onComplete instanceof Signal)
                this.onComplete.dispatch(asset);
            else
                this.onComplete(asset);
        },

        _notifyFailure: function(message)
        {
            if (this.onFail instanceof Signal) {
                if (!this.onFail.hasListeners) {
                    console.error(message);
                }
                this.onFail.dispatch(message);
            }
            else
                this.onFail(message);
        },

        // expresses a url in the file relative to the original file being loaded
        _correctURL: function(url)
        {
            return this.path + (this.fileMap.hasOwnProperty(url)? this.fileMap[url] : url).replace("\\", "/");
        }
    };

Importer.TYPE_TEXT = URLLoader.DATA_TEXT;
Importer.TYPE_BINARY = URLLoader.DATA_BINARY;
Importer.TYPE_IMAGE = 2;

/**
 * AssetLoader allows loading of any sort of asset. It can be used to load several assets, but onComplete and onFail will be called for each.
 * @param ImporterType The type of importer to use for the asset. For example: JPG, HCM (material), OBJ, ... Must be am Importer subtype.
 * @constructor
 */
function AssetLoader(ImporterType)
{
    // this can either be listened to, or overwritten by a function
    this.onComplete = new Signal();
    this.onFail = new Signal();
    this.fileMap = {};
    this.options = {};
    this._headers = {};
    this._importerType = ImporterType;
    // used for images
    this.crossOrigin = undefined;
}

AssetLoader.prototype =
{
    setRequestHeader: function(name, value)
    {
        this._headers[name] = value;
    },

    load: function (filename, target)
    {
        function fail(code) {
            console.warn("Failed loading " + filename + ". Error code: " + code);
            if (this.onFail) {
                if (this.onFail instanceof Signal)
                    this.onFail.dispatch(code);
                else
                    this.onFail(code);
            }
        }

        var importer = new this._importerType();
        target = target || importer.createContainer();
        importer.onComplete = this.onComplete;
        importer.onFail = this.onFail;
        importer.fileMap = this.fileMap;
        importer.options = this.options;
        var file = FileUtils.extractPathAndFilename(filename);
        importer.path = file.path;
        importer.filename = file.filename;

        if (importer.dataType === Importer.TYPE_IMAGE) {
            var image = new Image();
            image.crossOrigin = this.options.crossOrigin;
            image.onload = function() {
                importer.parse(image, target);
            };

            image.onError = function() {
                console.warn("Failed loading texture '" + filename + "'");
                fail.call(this);
            };
            image.src = filename;
        }
        else {
            var self = this;
            var urlLoader = new URLLoader(this._headers);
            urlLoader.type = importer.dataType;

            urlLoader.onComplete = function (data)
            {
                importer.parse(data, target);
            };

            urlLoader.onError = function (code)
            {
                fail.call(self, code);
            };

            urlLoader.load(filename);
        }

        return target;
    }
};

/**
 *
 * @constructor
 */
function HCM()
{
    Importer.call(this, TextureCube);
}

HCM.prototype = Object.create(Importer.prototype);

HCM.prototype.parse = function(file, target)
{
    var data = JSON.parse(file);

    var urls = [
        data.files.posX,
        data.files.negX,
        data.files.posY,
        data.files.negY,
        data.files.posZ,
        data.files.negZ
    ];

    if (data.loadMips)
        this._loadMipChain(urls, target);
    else
        this._loadFaces(urls, target);
};

HCM.prototype._loadFaces = function(urls, target)
{
    var generateMipmaps = this.options.generateMipmaps === undefined? true : this.options.generateMipmaps;
    var images = [];
    var self = this;

    var onError = function() {
        self._notifyFailure("Failed loading texture '" + urls[0] + "'");
    };

    var onLoad = function()
    {
        images[this.nextID].src = self.path + urls[this.nextID];
    };

    var onLoadLast = function() {
        target.uploadImages(images, generateMipmaps);
        self._notifyComplete(target);
    };

    for (var i = 0; i < 6; ++i) {
        var image = new Image();
        image.crossOrigin = this.options.crossOrigin;
        image.nextID = i + 1;
        if (i < 5) {
            image.onload = onLoad;
        }
        // last image to load
        else {
            image.onload = onLoadLast;
        }

        image.onError = onError;

        images[i] = image;
    }

    images[0].src = self.path + urls[0];
};

HCM.prototype._loadMipChain = function(urls, target)
{
    var images = [];

    var numMips;

    var self = this;
    var firstImage = new Image();
    var realURLs = [];

    for (var i = 0; i < 6; ++i) {
        realURLs[i] = urls[i].replace("%m", "0");
    }

    firstImage.onload = function()
    {
        if (firstImage.naturalWidth !== firstImage.naturalHeight || !MathX.isPowerOfTwo(firstImage.naturalWidth)) {
            self._notifyFailure("Failed loading mipchain: incorrect dimensions");
        }
        else {
            numMips = MathX.log2(firstImage.naturalWidth) + 1;
            loadTheRest();
            images[0] = firstImage;
        }
    };

    firstImage.onerror = function()
    {
        self._notifyFailure("Failed loading texture");
    };

    firstImage.src = self.path + realURLs[0];

    function loadTheRest()
    {
        var len = numMips * 6;
        for (var i = 1; i < numMips; ++i) {
            for (var j = 0; j < 6; ++j) {
                realURLs.push(urls[j].replace("%m", i.toString()));
            }
        }

        var onError = function ()
        {
            self._notifyFailure("Failed loading texture");
        };

        var onLoad = function ()
        {
            images[this.nextID].src = self.path + realURLs[this.nextID];
        };

        var onLoadLast = function ()
        {
            for (var m = 0; m < numMips; ++m)
                target.uploadImagesToMipLevel(images.slice(m * 6, m * 6 + 6), m);

            target._isReady = true;
            self._notifyComplete(target);
        };

        for (i = 1; i < len; ++i) {
            var image = new Image();
            image.crossOrigin = self.options.crossOrigin;
            image.nextID = i + 1;
            if (i < len - 1) {
                image.onload = onLoad;
            }
            // last image to load
            else {
                image.onload = onLoadLast;
            }

            image.onError = onError;

            images[i] = image;
        }

        images[1].src = self.path + realURLs[1];
    }
};

function JPG()
{
    Importer.call(this, Texture2D, Importer.TYPE_IMAGE);
}

JPG.prototype = Object.create(Importer.prototype);

JPG.prototype.parse = function(data, target)
{
    var generateMipmaps = this.options.generateMipmaps === undefined? true : this.options.generateMipmaps;
    target.uploadImage(data, data.naturalWidth, data.naturalHeight, generateMipmaps);
    this._notifyComplete(target);
};

var PNG = JPG;

/**
 * Creates a new AssetLibrary object.
 * @param {string} basePath The base path or url to load the assets from. All filenames will have this value prepended.
 * @constructor
 *
 * @classdesc
 * AssetLibrary provides a way to load a collection of assets. These can be textures, models, plain text, json, ...
 * Assets need to be queued with a given ID and loading starts when requested. When loading completes, the ID can be used
 * to retrieve the loaded asset.
 *
 * @example
 * var assetLibrary = new AssetLibrary("assets/");
 * assetLibrary.queueAsset("some-model", "models/some-model.obj", HX.AssetLibrary.Type.ASSET, HX.OBJ);
 * assetLibrary.queueAsset("some-texture", "textures/some_texture.png", HX.AssetLibrary.Type.ASSET, HX.PNG);
 * assetLibrary.onComplete.bind(onAssetsLoaded);
 * assetLibrary.onProgress.bind(onAssetsProgress);
 * assetLibrary.load();
 */

function AssetLibrary(basePath, crossOrigin)
{
    this._numLoaded = 0;
    this._queue = [];
    this._assets = {};
    if (basePath && basePath.charAt(basePath.length - 1) !== "/") basePath += "/";
    this._basePath = basePath || "";
    this._onComplete = new Signal(/* void */);
    this._onProgress = new Signal(/* number */);
    this._crossOrigin = crossOrigin;
}

/**
 * The type of asset to load. For example: <code>AssetLibrary.Type.JSON</code> for a JSON object.
 * @enum
 */
AssetLibrary.Type = {
    /**
     * A JSON data object.
     */
    JSON: 0,

    /**
     * An asset.
     */
    ASSET: 1,

    /**
     * A plain text file.
     */
    PLAIN_TEXT: 2
};

AssetLibrary.prototype =
{
    /**
     * The {@linkcode Signal} dispatched when all assets have completed loading. Its payload object is a reference to
     * the assetLibrary itself.
     * @see {@linkcode Signal}.
     */
    get onComplete()
    {
        return this._onComplete;
    },

    /**
     * The {@linkcode Signal} dispatched when all assets have completed loading. Its payload is the ratio of loaded
     * objects for 0 to 1.
     * @see {@linkcode Signal}
     */
    get onProgress()
    {
        return this._onProgress;
    },

    /**
     * The base path relative to which all the filenames are defined. This value is set in the constructor.
     */
    get basePath()
    {
        return this._basePath;
    },

    get crossOrigin()
    {
        return this._crossOrigin;
    },

    /**
     * Adds an asset to the loading queue.
     * @param {string} id The ID that will be used to retrieve the asset when loaded.
     * @param {string} filename The filename relative to the base path provided in the constructor.
     * @param {AssetLibrary.Type} type The type of asset to be loaded.
     * @param {parser} The parser used to parse the loaded data.
     * @param {target} An optional target to contain the data. Allows lazy loading.
     * @see {@linkcode AssetLibrary.Type}
     */
    queueAsset: function(id, filename, type, parser, target)
    {
        this._queue.push({
            id: id,
            filename: this._basePath + filename,
            type: type,
            parser: parser,
            target: target
        });
    },

    /**
     * Start loading all the assets. Every time a single asset finished loading, <code>onProgress</code> is dispatched.
     * When all assets have finished loading, <code>onComplete</code> is dispatched.
     */
    load: function()
    {
        if (this._queue.length === 0) {
            this.onComplete.dispatch();
            return;
        }

        var asset = this._queue[this._numLoaded];

        switch (asset.type) {
            case AssetLibrary.Type.JSON:
                this._json(asset.filename, asset.id);
                break;
            case AssetLibrary.Type.PLAIN_TEXT:
                this._plainText(asset.filename, asset.id);
                break;
            case AssetLibrary.Type.ASSET:
                this._asset(asset.filename, asset.id, asset.parser, asset.target);
                break;
            default:
                throw new Error("Unknown asset type " + asset.type + "!");
        }
    },

    /**
     * Retrieves a loaded asset from the asset library. This method should only be called once <code>onComplete</code>
     * has been dispatched.
     * @param {string} id The ID assigned to the loaded asset when calling <code>queueAsset</code>
     * @returns {*} The loaded asset.
     */
    get: function(id) { return this._assets[id]; },

    _json: function(file, id)
    {
        var self = this;
        var loader = new XMLHttpRequest();
        loader.overrideMimeType("application/json");
        loader.open('GET', file, true);
        loader.onreadystatechange = function()
        {
            if (loader.readyState === 4 && loader.status === 200) {
                self._assets[id] = JSON.parse(loader.responseText);
                self._onAssetLoaded();
            }
        };
        loader.send(null);
    },

    _plainText: function(file, id)
    {
        var self = this;
        var loader = new XMLHttpRequest();
        loader.overrideMimeType("application/json");
        loader.open('GET', file, true);
        loader.onreadystatechange = function()
        {
            if (loader.readyState === 4 && loader.status === 200) {
                self._assets[id] = loader.responseText;
                self._onAssetLoaded();
            }
        };

        loader.send(null);
    },

    _asset: function(file, id, parser, target)
    {
        var loader = new AssetLoader(parser);
        loader.options = loader.options || {};
        loader.options.crossOrigin = this._crossOrigin;
        loader.onComplete.bind(function()
        {
            this._onAssetLoaded();
        }, this);

        this._assets[id] = loader.load(file, target);
    },

    _onAssetLoaded: function()
    {
        this._onProgress.dispatch(this._numLoaded / this._queue.length);

        if (++this._numLoaded === this._queue.length)
            this._onComplete.dispatch(this);
        else
            this.load();
    }
};

/**
 * The HMT file format is for file-based materials (JSON)
 * @constructor
 */
function HMT()
{
    Importer.call(this, Material);
    HMT._initPropertyMap();
}

HMT.prototype = Object.create(Importer.prototype);

HMT.prototype.parse = function(data, target)
{
    data = JSON.parse(data);
    this._loadShaders(data, target);
};

HMT.prototype._gatherShaderFiles = function(data)
{
    var files = [];
    var geometry = data.geometry;

    var vertex = geometry.vertexShader;
    var fragment = geometry.fragmentShader;
    var lighting = data.lightingModel;
    if (files.indexOf(vertex) < 0) files.push(this._correctURL(vertex));
    if (files.indexOf(fragment) < 0) files.push(this._correctURL(fragment));
    if (lighting && files.indexOf(lighting) < 0) files.push(this._correctURL(lighting));

    return files;
};

HMT.prototype._loadShaders = function(data, material)
{
    // urls will already be correctURL'ed
    var shaderFiles = this._gatherShaderFiles(data);
    this._shaderLibrary = new AssetLibrary();

    for (var i = 0; i < shaderFiles.length; ++i) {
        this._shaderLibrary.queueAsset(shaderFiles[i], shaderFiles[i], AssetLibrary.Type.PLAIN_TEXT);
    }

    this._shaderLibrary.onComplete.bind(function()
    {
        this._processMaterial(data, material);
        this._loadTextures(data, material);
    }, this);

    // this._shaderLibrary.onFail.bind(function(code)
    // {
    //     this._notifyFailure("Error loading shaders: " + code);
    // }, this);
    this._shaderLibrary.load();
};


HMT.prototype._processMaterial = function(data, material)
{
    var defines = "";
    if (this.options.defines) {
        for (var key in this.options.defines) {
            if (this.options.defines.hasOwnProperty(key)) {
                defines += "#define " + key + " " + this.options.defines[key] + "\n";
            }
        }
    }

    var geometryVertex = defines + this._shaderLibrary.get(this._correctURL(data.geometry.vertexShader));
    var geometryFragment = defines + this._shaderLibrary.get(this._correctURL(data.geometry.fragmentShader));

    material._geometryVertexShader = geometryVertex;
    material._geometryFragmentShader = geometryFragment;
    material.init();

    if (data.lightingModel)
        material.lightingModel = this._shaderLibrary.get(this._correctURL(data.lightingModel));

    this._applyUniforms(data, material);

    if (data.hasOwnProperty("elementType"))
        material.elementType = HMT._PROPERTY_MAP[data.elementType];

    if (data.hasOwnProperty("cullMode"))
        material.cullMode = HMT._PROPERTY_MAP[data.cullMode];

    if (data.hasOwnProperty("writeDepth"))
        material.writeDepth = data.writeDepth;

    if (data.hasOwnProperty("blend")) {
        var blendState = new BlendState();
        var blend = data.blend;

        if (blend.hasOwnProperty("source"))
            blendState.srcFactor = HMT._PROPERTY_MAP[blend.source];

        if (blend.hasOwnProperty("destination"))
            blendState.dstFactor = HMT._PROPERTY_MAP[blend.destination];

        if (blend.hasOwnProperty("operator"))
            blendState.operator = HMT._PROPERTY_MAP[blend.operator];

        material.blendState = blendState;
    }
};

HMT.prototype._applyUniforms = function(data, material)
{
    if (!data.uniforms) return;

    for (var key in data.uniforms) {
        if (!data.uniforms.hasOwnProperty(key)) continue;

        var value = data.uniforms[key];
        if (isNaN(value))
            material.setUniform(key, {
                x: value[0],
                y: value[1],
                z: value[2],
                w: value[3]
            }, false);
        else
            material.setUniform(key, value, false);
    }
};

HMT.prototype._loadTextures = function(data, material)
{
    var files = [];

    for (var key in data.textures) {
        if (data.textures.hasOwnProperty(key)) {
            files.push(this._correctURL(data.textures[key]));
            material.setTexture(key, Texture2D.DEFAULT);
        }
    }

    this._textureLibrary = new AssetLibrary();

    for (var i = 0; i < files.length; ++i) {
        this._textureLibrary.queueAsset(files[i], files[i], AssetLibrary.Type.ASSET, JPG);
    }

    this._textureLibrary.onComplete.bind(function()
    {
        for (var key in data.textures) {
            if (data.textures.hasOwnProperty(key)) {
                material.setTexture(key, this._textureLibrary.get(this._correctURL(data.textures[key])));
            }
        }
        this._notifyComplete(material);
    }, this);
    // bulkLoader.onFail = function(message)
    // {
    //     self._notifyFailure(message);
    // };

    this._textureLibrary.load();
};


HMT._PROPERTY_MAP = null;

HMT._initPropertyMap = function() {
    HMT._PROPERTY_MAP = HMT._PROPERTY_MAP || {
        back: CullMode.BACK,
        front: CullMode.FRONT,
        both: CullMode.ALL,
        none: null,
        lines: ElementType.LINES,
        points: ElementType.POINTS,
        triangles: ElementType.TRIANGLES,
        one: BlendFactor.ONE,
        zero: BlendFactor.ZERO,
        sourceColor: BlendFactor.SOURCE_COLOR,
        oneMinusSourceColor: BlendFactor.ONE_MINUS_SOURCE_COLOR,
        sourceAlpha: BlendFactor.SOURCE_ALPHA,
        oneMinusSourceAlpha: BlendFactor.ONE_MINUS_SOURCE_ALPHA,
        destinationAlpha: BlendFactor.DST_ALPHA,
        oneMinusDestinationAlpha: BlendFactor.ONE_MINUS_DESTINATION_ALPHA,
        destinationColor: BlendFactor.DESTINATION_COLOR,
        sourceAlphaSaturate: BlendFactor.SOURCE_ALPHA_SATURATE,
        add: BlendOperation.ADD,
        subtract: BlendOperation.SUBTRACT,
        reverseSubtract: BlendOperation.REVERSE_SUBTRACT,

        // depth tests
        always: Comparison.ALWAYS,
        disabled: Comparison.DISABLED,
        equal: Comparison.EQUAL,
        greater: Comparison.GREATER,
        greaterEqual: Comparison.GREATER_EQUAL,
        less: Comparison.LESS,
        lessEqual: Comparison.LESS_EQUAL,
        never: Comparison.NEVER,
        notEqual: Comparison.NOT_EQUAL
    };
};

var EquirectangularTexture =
{
    toCube: function(source, size, generateMipmaps, target)
    {
        generateMipmaps = generateMipmaps || true;
        size = size || source.height;

        if (!EquirectangularTexture._EQUI_TO_CUBE_SHADER)
            EquirectangularTexture._EQUI_TO_CUBE_SHADER = new Shader(ShaderLibrary.get("2d_to_cube_vertex.glsl"), ShaderLibrary.get("equirectangular_to_cube_fragment.glsl"));

        this._createRenderCubeGeometry();

        var gl = GL.gl;
        target = target || new TextureCube();
        target.initEmpty(size, source.format, source.dataType);
        var faces = [ gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z ];

        EquirectangularTexture._EQUI_TO_CUBE_SHADER.updatePassRenderState();

        var textureLocation = EquirectangularTexture._EQUI_TO_CUBE_SHADER.getUniformLocation("source");
        var posLocation = EquirectangularTexture._EQUI_TO_CUBE_SHADER.getAttributeLocation("hx_position");
        var cornerLocation = EquirectangularTexture._EQUI_TO_CUBE_SHADER.getAttributeLocation("corner");

        gl.uniform1i(textureLocation, 0);
        source.bind(0);

        EquirectangularTexture._TO_CUBE_VERTICES.bind();
        EquirectangularTexture._TO_CUBE_INDICES.bind();
        gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 20, 0);
        gl.vertexAttribPointer(cornerLocation, 3, gl.FLOAT, false, 20, 8);

        GL.enableAttributes(2);
        var old = GL.getCurrentRenderTarget();

        for (var i = 0; i < 6; ++i) {
            var fbo = new FrameBuffer(target, null, faces[i]);
            fbo.init();

            GL.setRenderTarget(fbo);
            GL.drawElements(gl.TRIANGLES, 6, i * 6);

            fbo.dispose();
        }

        GL.setRenderTarget(old);

        if (generateMipmaps)
            target.generateMipmap();

        // TODO: for some reason, if EXT_shader_texture_lod is not supported, mipmapping of rendered-to cubemaps does not work
        if (!capabilities.EXT_SHADER_TEXTURE_LOD)
            target.filter = TextureFilter.BILINEAR_NOMIP;

        return target;
    },

    _createRenderCubeGeometry: function()
    {
        if (EquirectangularTexture._TO_CUBE_VERTICES) return;
        var vertices = [
            // pos X
            1.0, 1.0, 1.0, -1.0, -1.0,
            -1.0, 1.0, 1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0, 1.0, 1.0,
            1.0, -1.0, 1.0, 1.0, -1.0,

            // neg X
            1.0, 1.0, -1.0, -1.0, 1.0,
            -1.0, 1.0, -1.0, -1.0, -1.0,
            -1.0, -1.0, -1.0, 1.0, -1.0,
            1.0, -1.0, -1.0, 1.0, 1.0,

            // pos Y
            -1.0, -1.0, -1.0, 1.0, -1.0,
            1.0, -1.0, 1.0, 1.0, -1.0,
            1.0, 1.0, 1.0, 1.0, 1.0,
            -1.0, 1.0, -1.0, 1.0, 1.0,

            // neg Y
            -1.0, -1.0, -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0, -1.0, 1.0,
            1.0, 1.0, 1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0, -1.0, -1.0,

            // pos Z
            1.0, 1.0, 1.0, -1.0, 1.0,
            -1.0, 1.0, -1.0, -1.0, 1.0,
            -1.0, -1.0, -1.0, 1.0, 1.0,
            1.0, -1.0, 1.0, 1.0, 1.0,

            // neg Z
            1.0, 1.0, -1.0, -1.0, -1.0,
            -1.0, 1.0, 1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0, 1.0, -1.0,
            1.0, -1.0, -1.0, 1.0, -1.0
        ];
        var indices = [
            0, 1, 2, 0, 2, 3,
            4, 5, 6, 4, 6, 7,
            8, 9, 10, 8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23
        ];
        EquirectangularTexture._TO_CUBE_VERTICES = new VertexBuffer();
        EquirectangularTexture._TO_CUBE_INDICES = new IndexBuffer();
        EquirectangularTexture._TO_CUBE_VERTICES.uploadData(new Float32Array(vertices));
        EquirectangularTexture._TO_CUBE_INDICES.uploadData(new Uint16Array(indices));
    }
};

/**
 * Loads a jpg or png equirectangular as a cubemap
 * @constructor
 */
function JPG_EQUIRECTANGULAR()
{
    Importer.call(this, TextureCube, Importer.TYPE_IMAGE);
}

JPG_EQUIRECTANGULAR.prototype = Object.create(Importer.prototype);

JPG_EQUIRECTANGULAR.prototype.parse = function(data, target)
{
    var texture2D = new Texture2D();
    texture2D.wrapMode = TextureWrapMode.REPEAT;
    texture2D.uploadImage(data, data.naturalWidth, data.naturalHeight, true);

    var generateMipmaps = this.options.generateMipmaps === undefined? true : this.options.generateMipmaps;
    EquirectangularTexture.toCube(texture2D, this.options.size, generateMipmaps, target);
    texture2D.dispose();
    this._notifyComplete(target);
};

var PNG_EQUIRECTANGULAR = JPG_EQUIRECTANGULAR;

var HeightMap =
{
    from8BitTexture: function(texture, generateMipmaps, target)
    {
        var gl = GL.gl;
        generateMipmaps = generateMipmaps || true;
        var tex1 = target || new Texture2D();
        tex1.initEmpty(texture.width, texture.height);
        var fbo1 = new FrameBuffer(tex1);
        fbo1.init();

        var tex2 = new Texture2D();
        tex2.initEmpty(texture.width, texture.height);
        var fbo2 = new FrameBuffer(tex2);
        fbo2.init();

        var toRGBA8 = new CustomCopyShader(ShaderLibrary.get("greyscale_to_rgba8.glsl"));
        var oldRT = GL.getCurrentRenderTarget();

        GL.setRenderTarget(fbo1);
        GL.clear();
        toRGBA8.execute(RectMesh.DEFAULT, texture);

        if (generateMipmaps)
            target.generateMipmap();

        var smooth = new CustomCopyShader(ShaderLibrary.get("smooth_heightmap_fragment.glsl"));
        var textureLocation = gl.getUniformLocation(smooth._program, "reference");
        var offsetLocation = gl.getUniformLocation(smooth._program, "stepSize");
        gl.uniform1i(textureLocation, 1);

        texture.bind(1);

        GL.setRenderTarget(fbo2);
        GL.clear();
        gl.uniform2f(offsetLocation, 1.0 / texture.width, 0.0);
        smooth.execute(RectMesh.DEFAULT, tex1);
        tex2.generateMipmap();

        GL.setRenderTarget(fbo1);
        GL.clear();
        gl.uniform2f(offsetLocation, 0.0, 1.0 / texture.height);
        smooth.execute(RectMesh.DEFAULT, tex2);

        fbo2.dispose();

        if (generateMipmaps)
            target.generateMipmap();

        GL.setRenderTarget(oldRT);
        fbo1.dispose();

        return tex1;
    }
};

/**
 * Loads a jpg or png equirectangular as a cubemap
 * @constructor
 */
function JPG_HEIGHTMAP()
{
    Importer.call(this, Texture2D, Importer.TYPE_IMAGE);
}

JPG_HEIGHTMAP.prototype = Object.create(Importer.prototype);

JPG_HEIGHTMAP.prototype.parse = function(data, target)
{
    var texture2D = new Texture2D();
    texture2D.wrapMode = TextureWrapMode.REPEAT;
    texture2D.uploadImage(data, data.naturalWidth, data.naturalHeight, true);

    var generateMipmaps = this.options.generateMipmaps === undefined? true : this.options.generateMipmaps;
    HeightMap.from8BitTexture(texture2D, generateMipmaps, target);
    texture2D.dispose();
    this._notifyComplete(target);
};

var PNG_HEIGHTMAP = JPG_HEIGHTMAP;

/**
 *
 * @constructor
 */
function AmbientLight()
{
    // AMBIENT LIGHT IS NOT ACTUALLY A REAL LIGHT OBJECT
    Entity.call(this);
    this._scaledIrradiance = new Color();
    this._intensity = .2;
    this.color = new Color(1, 1, 1);
    this._scaledIrradiance = new Color();
    this._updateScaledIrradiance();
}

AmbientLight.prototype = Object.create(Entity.prototype);

Object.defineProperties(AmbientLight.prototype, {
    color: {
        get: function() { return this._color; },
        set: function(value)
        {
            this._color = isNaN(value) ? value : new Color(value);
            this._updateScaledIrradiance();
        }
    },

    intensity: {
        get: function() { return this._intensity; },
        set: function(value)
        {
            this._intensity = value;
            this._updateScaledIrradiance();
        },
    }
});

AmbientLight.prototype.acceptVisitor = function (visitor)
{
    Entity.prototype.acceptVisitor.call(this, visitor);
    visitor.visitAmbientLight(this);
};

AmbientLight.prototype._updateWorldBounds = function()
{
    this._worldBounds.clear(BoundingVolume.EXPANSE_INFINITE);
};

AmbientLight.prototype._updateScaledIrradiance = function()
{
    // do not scale by 1/PI. It feels weird to control.
    if (META.OPTIONS.useGammaCorrection)
        this._color.gammaToLinear(this._scaledIrradiance);
    else
        this._scaledIrradiance.copyFrom(this._color);

    this._scaledIrradiance.r *= this._intensity;
    this._scaledIrradiance.g *= this._intensity;
    this._scaledIrradiance.b *= this._intensity;
};

function ESMBlurShader(blurRadius)
{
    Shader.call(this);
    var gl = GL.gl;

    var defines = {
        RADIUS: blurRadius,
        RCP_NUM_SAMPLES: "float(" + (1.0 / (1.0 + 2.0 * blurRadius)) + ")"
    };

    var vertex = ShaderLibrary.get("copy_vertex.glsl", defines);
    var fragment = ShaderLibrary.get("esm_blur_fragment.glsl", defines);

    this.init(vertex, fragment);

    this._textureLocation = gl.getUniformLocation(this._program, "source");
    this._directionLocation = gl.getUniformLocation(this._program, "direction");
    this._positionAttributeLocation = gl.getAttribLocation(this._program, "hx_position");
    this._texCoordAttributeLocation = gl.getAttribLocation(this._program, "hx_texCoord");

    gl.useProgram(this._program);
    gl.uniform1i(this._textureLocation, 0);
}

ESMBlurShader.prototype = Object.create(Shader.prototype);

ESMBlurShader.prototype.execute = function(rect, texture, dirX, dirY)
{
    var gl = GL.gl;

    GL.setDepthTest(Comparison.DISABLED);
    GL.setCullMode(CullMode.NONE);

    rect._vertexBuffers[0].bind();
    rect._indexBuffer.bind();

    this.updatePassRenderState();

    texture.bind(0);

    gl.vertexAttribPointer(this._positionAttributeLocation, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(this._texCoordAttributeLocation, 2, gl.FLOAT, false, 16, 8);

    GL.enableAttributes(2);

    gl.uniform2f(this._directionLocation, dirX, dirY);

    GL.drawElements(ElementType.TRIANGLES, 6, 0);
};

// highly experimental
function ExponentialDirectionalShadowFilter()
{
    ShadowFilter.call(this);
    this._expScaleFactor = 80;
    this._blurRadius = 1;
    this._darkeningFactor = .35;
}


ExponentialDirectionalShadowFilter.prototype = Object.create(ShadowFilter.prototype,
    {
        blurRadius: {
            get: function()
            {
                return this._blurRadius;
            },

            set: function(value)
            {
                this._blurRadius = value;
                this._invalidateBlurShader();
            }
        },

        darkeningFactor: {
            get: function()
            {
                return this._darkeningFactor;
            },

            set: function(value)
            {
                this._darkeningFactor = value;
                this.onShaderInvalid.dispatch();
            }
        },

        // not recommended to change
        expScaleFactor: {
            get: function()
            {
                return this._expScaleFactor;
            },

            set: function(value)
            {
                this._expScaleFactor = value;
                this.onShaderInvalid.dispatch();
            }
        }
    });

ExponentialDirectionalShadowFilter.prototype.getShadowMapFormat = function()
{
    return TextureFormat.RGB;
};

ExponentialDirectionalShadowFilter.prototype.getShadowMapDataType = function()
{
    return DataType.FLOAT;
};

ExponentialDirectionalShadowFilter.prototype.getGLSL = function()
{
    var defines = this._getDefines();
    return ShaderLibrary.get("dir_shadow_esm.glsl", defines);
};

ExponentialDirectionalShadowFilter.prototype._getDefines = function()
{
    return {
        HX_ESM_CONSTANT: "float(" + this._expScaleFactor + ")",
        HX_ESM_DARKENING: "float(" + this._darkeningFactor + ")"
    };
};

ExponentialDirectionalShadowFilter.prototype._createBlurShader = function()
{
    return new ESMBlurShader(this._blurRadius);
};

function DeferredLightProbeShader(probe)
{
    Shader.call(this);
    var defines = {};

    var extensions = "";
    if (capabilities.EXT_SHADER_TEXTURE_LOD) {
        extensions += "#texturelod\n";
    }

    this._probe = probe;

    if (probe.diffuseTexture)
        defines.HX_DIFFUSE_PROBE = 1;

    if (probe.specularTexture)
        defines.HX_SPECULAR_PROBE = 1;

    var vertex = ShaderLibrary.get("deferred_probe_vertex.glsl", defines);
    var fragment =
        extensions +
        ShaderLibrary.get("snippets_geometry.glsl", defines) + "\n" +
        META.OPTIONS.defaultLightingModel + "\n\n\n" +
        ShaderLibrary.get("light_probe.glsl") + "\n" +
        ShaderLibrary.get("deferred_probe_fragment.glsl");

    this.init(vertex, fragment);

    var gl = GL.gl;
    var p = this._program;
    gl.useProgram(p);

    this._colorLocation = gl.getUniformLocation(p, "hx_directionalLight.color");
    this._dirLocation = gl.getUniformLocation(p, "hx_directionalLight.direction");

    this._positionAttributeLocation = gl.getAttribLocation(p, "hx_position");
    this._texCoordAttributeLocation = gl.getAttribLocation(p, "hx_texCoord");

    var albedoSlot = gl.getUniformLocation(p, "hx_gbufferAlbedo");
    var normalDepthSlot = gl.getUniformLocation(p, "hx_gbufferNormalDepth");
    var specularSlot = gl.getUniformLocation(p, "hx_gbufferSpecular");
    var specProbeSlot = gl.getUniformLocation(p, "hx_specularProbeMap");
    var diffuseProbeSlot = gl.getUniformLocation(p, "hx_diffuseProbeMap");
    var ssaoSlot = gl.getUniformLocation(p, "hx_ssao");

    this._numMipsLocation = this.getUniformLocation("hx_specularProbeNumMips");

    gl.uniform1i(albedoSlot, 0);
    gl.uniform1i(normalDepthSlot, 1);
    gl.uniform1i(specularSlot, 2);
    gl.uniform1i(ssaoSlot, 3);
    gl.uniform1i(specProbeSlot, 4);
    gl.uniform1i(diffuseProbeSlot, 5);
}

DeferredLightProbeShader.prototype = Object.create(Shader.prototype);

DeferredLightProbeShader.prototype.execute = function(renderer)
{
    var gl = GL.gl;

    gl.useProgram(this._program);

    var texs = renderer._gbuffer.textures;
    texs[0].bind(0);
    texs[1].bind(1);
    texs[2].bind(2);

    var specularProbe = this._probe.specularTexture;
    var diffuseProbe = this._probe.diffuseTexture;

    if ((specularProbe && specularProbe.size === 0) ||
        (diffuseProbe && diffuseProbe.size === 0)) return;

    renderer._ssaoTexture.bind(3);

    if (specularProbe) {
        specularProbe.bind(4);
        gl.uniform1f(this._numMipsLocation, Math.floor(MathX.log2(specularProbe.size)));
    }

    if (diffuseProbe)
        diffuseProbe.bind(5);

    GL.setCullMode(CullMode.NONE);

    this.updatePassRenderState(renderer._camera, renderer);

    var rect = RectMesh.DEFAULT;
    rect._vertexBuffers[0].bind();
    rect._indexBuffer.bind();

    gl.vertexAttribPointer(this._positionAttributeLocation, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(this._texCoordAttributeLocation, 2, gl.FLOAT, false, 16, 8);

    GL.enableAttributes(2);

    GL.drawElements(ElementType.TRIANGLES, 6, 0);
};

/**
 * Can be used directly, or have SkyBox manage this for you (generally the best approach). Acts as an infinite environment map.
 */
function LightProbe(diffuseTexture, specularTexture)
{
    Entity.call(this);
    this._specularTexture = specularTexture;
    this._diffuseTexture = diffuseTexture;
    this._size = undefined;

    if (META.OPTIONS.defaultLightingModel)
        this._deferredShader = new DeferredLightProbeShader(this);
}

// conversion range for spec power to mip
LightProbe.powerRange0 = .00098;
LightProbe.powerRange1 = .9921;

LightProbe.prototype = Object.create(Entity.prototype,
    {
        specularTexture: {
            get: function() { return this._specularTexture; }
        },
        diffuseTexture: {
            get: function() { return this._diffuseTexture; }
        }
    });

LightProbe.prototype._updateWorldBounds = function()
{
    this._worldBounds.clear(BoundingVolume.EXPANSE_INFINITE);
};

LightProbe.prototype.acceptVisitor = function (visitor)
{
    Entity.prototype.acceptVisitor.call(this, visitor);
    visitor.visitLight(this);
};

LightProbe.prototype.renderDeferredLighting = function(renderer)
{
    // To implement by concrete subclasses
};

LightProbe.prototype.renderDeferredLighting = function(renderer)
{
    this._deferredShader.execute(renderer);
};

function PCFDirectionalShadowFilter()
{
    ShadowFilter.call(this);
    this._softness = .01;
    this._numShadowSamples = 6;
    this._dither = false;
}

PCFDirectionalShadowFilter.prototype = Object.create(ShadowFilter.prototype,
    {
        softness: {
            get: function()
            {
                return this._softness;
            },

            set: function(value)
            {
                if (this._softness !== value) {
                    this._softness = value;
                    this.onShaderInvalid.dispatch();
                }
            }
        },

        numShadowSamples: {
            get: function()
            {
                return this._numShadowSamples;
            },

            set: function(value)
            {
                if (this._numShadowSamples !== value) {
                    this._numShadowSamples = value;
                    this.onShaderInvalid.dispatch();
                }
            }
        },

        dither: {
            get: function()
            {
                return this._dither;
            },

            set: function(value)
            {
                if (this._dither !== value) {
                    this._dither = value;
                    this.onShaderInvalid.dispatch();
                }
            }
        }
    }
);

PCFDirectionalShadowFilter.prototype.getCullMode = function()
{
    return CullMode.FRONT;
};

PCFDirectionalShadowFilter.prototype.getGLSL = function()
{
    var defines = {
        HX_PCF_NUM_SHADOW_SAMPLES: this._numShadowSamples,
        HX_PCF_RCP_NUM_SHADOW_SAMPLES: "float(" + ( 1.0 / this._numShadowSamples ) + ")",
        HX_PCF_SOFTNESS: this._softness
    };

    if (this._dither)
        defines.HX_PCF_DITHER_SHADOWS = 1;

    return ShaderLibrary.get("dir_shadow_pcf.glsl", defines);
};

function DeferredPointShader(useSphere)
{
    Shader.call(this);
    this._useSphere = useSphere;

    var defines = {};

    if (useSphere) {
        var primitive = new SpherePrimitive({
            // overshoot a bit
            radius: 1.1
        });
        this._mesh = primitive.getMesh(0);
        defines.HX_SPHERE_MESH = 1;
    }

    var vertex =
        ShaderLibrary.get("snippets_geometry.glsl") + "\n" +
        META.OPTIONS.defaultLightingModel + "\n\n\n" +
        ShaderLibrary.get("point_light.glsl") + "\n" +
        ShaderLibrary.get("deferred_point_light_vertex.glsl", defines);
    var fragment =
        ShaderLibrary.get("snippets_geometry.glsl") + "\n" +
        META.OPTIONS.defaultLightingModel + "\n\n\n" +
        ShaderLibrary.get("point_light.glsl") + "\n" +
        ShaderLibrary.get("deferred_point_light_fragment.glsl", defines);

    this.init(vertex, fragment);

    var gl = GL.gl;
    var p = this._program;
    gl.useProgram(p);

    this._colorLocation = gl.getUniformLocation(p, "hx_pointLight.color");
    this._posLocation = gl.getUniformLocation(p, "hx_pointLight.position");
    this._radiusLocation = gl.getUniformLocation(p, "hx_pointLight.radius");

    this._positionAttributeLocation = gl.getAttribLocation(p, "hx_position");
    this._texCoordAttributeLocation = gl.getAttribLocation(p, "hx_texCoord");

    var albedoSlot = gl.getUniformLocation(p, "hx_gbufferAlbedo");
    var normalDepthSlot = gl.getUniformLocation(p, "hx_gbufferNormalDepth");
    var specularSlot = gl.getUniformLocation(p, "hx_gbufferSpecular");

    gl.uniform1i(albedoSlot, 0);
    gl.uniform1i(normalDepthSlot, 1);
    gl.uniform1i(specularSlot, 2);
}

DeferredPointShader.prototype = Object.create(Shader.prototype);

DeferredPointShader.prototype.execute = function(renderer, light)
{
    var pos = new Float4();

    return function(renderer, light) {
        var gl = GL.gl;

        gl.useProgram(this._program);

        var texs = renderer._gbuffer.textures;
        texs[0].bind(0);
        texs[1].bind(1);
        texs[2].bind(2);

        var camera = renderer._camera;
        var col = light._scaledIrradiance;

        light.worldMatrix.getColumn(3, pos);
        camera.viewMatrix.transformPoint(pos, pos);
        gl.uniform3f(this._colorLocation, col.r, col.g, col.b);
        gl.uniform3f(this._posLocation, pos.x, pos.y, pos.z);
        gl.uniform1f(this._radiusLocation, light._radius);

        this.updatePassRenderState(camera, renderer);

        if (this._useSphere) {
            GL.setCullMode(CullMode.FRONT);
            var mesh = this._mesh;
            mesh._vertexBuffers[0].bind();
            mesh._indexBuffer.bind();

            gl.vertexAttribPointer(this._positionAttributeLocation, 3, gl.FLOAT, false, 48, 0);
            GL.enableAttributes(1);
            GL.drawElements(ElementType.TRIANGLES, mesh.numIndices, 0);
        }
        else {
            GL.setCullMode(CullMode.NONE);
            var rect = RectMesh.DEFAULT;
            rect._vertexBuffers[0].bind();
            rect._indexBuffer.bind();

            gl.vertexAttribPointer(this._positionAttributeLocation, 2, gl.FLOAT, false, 16, 0);
            gl.vertexAttribPointer(this._texCoordAttributeLocation, 2, gl.FLOAT, false, 16, 8);

            GL.enableAttributes(2);

            GL.drawElements(ElementType.TRIANGLES, 6, 0);
        }
    }
}();

/**
 *
 * @constructor
 */
function PointLight()
{
    Light.call(this);

    if (!PointLight._deferredShaderSphere && META.OPTIONS.defaultLightingModel) {
        PointLight._deferredShaderSphere = new DeferredPointShader(true);
        PointLight._deferredShaderRect = new DeferredPointShader(false);
    }

    this._radius = 100.0;
    this.intensity = 3.1415;
}

PointLight.LIGHTS_PER_BATCH = 20;
PointLight.SPHERE_SEGMENTS_W = 16;
PointLight.SPHERE_SEGMENTS_H = 10;
PointLight.NUM_SPHERE_INDICES = -1;  // will be set on creation instead of passing value that might get invalidated

PointLight.prototype = Object.create(Light.prototype,
    {
        // radius is not physically correct, but invaluable for performance
        radius: {
            get: function() {
                return this._radius;
            },

            set: function(value) {
                this._radius = value;
                this._updateWorldBounds();
            }
        }
    });

PointLight.prototype._createBoundingVolume = function()
{
    return new BoundingSphere();
};

PointLight.prototype._updateWorldBounds = function()
{
    this._worldBounds.setExplicit(this.worldMatrix.getColumn(3), this._radius);
};

PointLight.prototype.renderDeferredLighting = function(renderer)
{
    var camPos = new Float4();
    var thisPos = new Float4();
    return function(renderer) {

        // distance camera vs light to estimate projected size
        renderer._camera.worldMatrix.getColumn(3, camPos);
        this.worldMatrix.getColumn(3, thisPos);
        var distSqr = Float4.distanceSqr(camPos, thisPos);
        var rad = this._radius * 1.1;

        if (distSqr > rad * rad)
            PointLight._deferredShaderSphere.execute(renderer, this);
        else
            PointLight._deferredShaderRect.execute(renderer, this);
    }
}();

/**
 * Base function for basic copies
 * @param fragmentShader The fragment shader to use while copying.
 * @constructor
 */
function VSMBlurShader(blurRadius)
{
    var gl = GL.gl;
    Shader.call(this);

    var defines = {
        RADIUS: blurRadius,
        RCP_NUM_SAMPLES: "float(" + (1.0 / (1.0 + 2.0 * blurRadius)) + ")"
    };

    var vertex = ShaderLibrary.get("copy_vertex.glsl", defines);
    var fragment = ShaderLibrary.get("vsm_blur_fragment.glsl", defines);

    this.init(vertex, fragment);

    this._textureLocation = gl.getUniformLocation(this._program, "source");
    this._directionLocation = gl.getUniformLocation(this._program, "direction");
    this._positionAttributeLocation = gl.getAttribLocation(this._program, "hx_position");
    this._texCoordAttributeLocation = gl.getAttribLocation(this._program, "hx_texCoord");

    gl.useProgram(this._program);
    gl.uniform1i(this._textureLocation, 0);
}

VSMBlurShader.prototype = Object.create(Shader.prototype);

VSMBlurShader.prototype.execute = function (rect, texture, dirX, dirY)
{
    var gl = GL.gl;
    GL.setDepthTest(Comparison.DISABLED);
    GL.setCullMode(CullMode.NONE);

    rect._vertexBuffers[0].bind();
    rect._indexBuffer.bind();

    this.updatePassRenderState();

    texture.bind(0);

    gl.vertexAttribPointer(this._positionAttributeLocation, 2, DataType.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(this._texCoordAttributeLocation, 2, DataType.FLOAT, false, 16, 8);

    GL.enableAttributes(2);

    gl.uniform2f(this._directionLocation, dirX, dirY);

    GL.drawElements(gl.TRIANGLES, 6, 0);
};

function VarianceDirectionalShadowFilter()
{
    ShadowFilter.call(this);
    this._blurRadius = 2;
    this._lightBleedReduction = .35;
}

VarianceDirectionalShadowFilter.prototype = Object.create(ShadowFilter.prototype,
    {
        blurRadius: {
            get: function()
            {
                return this._blurRadius;
            },

            set: function(value)
            {
                this._blurRadius = value;
                this._invalidateBlurShader();
            }
        },

        lightBleedReduction: {
            get: function()
            {
                return this._lightBleedReduction;
            },

            set: function(value)
            {
                this._lightBleedReduction = value;
                this.onShaderInvalid.dispatch();
            }
        }
    });

VarianceDirectionalShadowFilter.prototype.getGLSL = function()
{
    var defines = this._getDefines();
    return ShaderLibrary.get("dir_shadow_vsm.glsl", defines);
};

VarianceDirectionalShadowFilter.prototype._createBlurShader = function()
{
    return new VSMBlurShader(this._blurRadius);
};

VarianceDirectionalShadowFilter.prototype._getDefines = function()
{
    var range = 1.0 - this._lightBleedReduction;
    return {
        HX_VSM_MIN_VARIANCE: -0.0001,
        HX_VSM_LIGHT_BLEED_REDUCTION: "float(" + this._lightBleedReduction + ")",
        HX_VSM_LIGHT_BLEED_REDUCTION_RANGE: "float(" + range + ")"
    };
};

/**
 * Creates a number copies of the same mesh with hx_instanceID being the instance number of the copy.
 */
var MeshBatch =
    {
        create: function (sourceMeshData, numInstances)
        {
            var len, i, j;
            var target = new MeshData();
            var sourceIndices = sourceMeshData._indexData;

            target.vertexUsage = sourceMeshData.vertexUsage;
            target.indexUsage = sourceMeshData.indexUsage;

            var attribs = sourceMeshData._vertexAttributes;
            var instanceStream = sourceMeshData.numStreams;

            for (i = 0; i < attribs.length; ++i) {
                var attribute = attribs[i];
                target.addVertexAttribute(attribute.name, attribute.numComponents, attribute.streamIndex);
            }

            target.addVertexAttribute("hx_instanceID", 1, instanceStream);

            var targetIndices = [];
            var index = 0;
            var numVertices = sourceMeshData.numVertices;

            len = sourceIndices.length;

            for (i = 0; i < numInstances; ++i) {
                for (j = 0; j < len; ++j) {
                    targetIndices[index++] = sourceIndices[j] + numVertices * i;
                }
            }

            target.setIndexData(targetIndices);

            for (i = 0; i < sourceMeshData.numStreams; ++i) {
                var targetVertices = [];
                var sourceVertices = sourceMeshData.getVertexData(i);

                len = sourceVertices.length;
                index = 0;

                // duplicate vertex data for each instance
                for (j = 0; j < numInstances; ++j) {
                    for (var k = 0; k < len; ++k) {
                        targetVertices[index++] = sourceVertices[k];
                    }
                }

                target.setVertexData(targetVertices, i);
            }

            var instanceData = [];
            index = 0;
            for (j = 0; j < numInstances; ++j) {
                for (i = 0; i < numVertices; ++i) {
                    instanceData[index++] = j;
                }
            }

            // something actually IS wrong with the instance data
            // drawing an explicit subselection of indices with constant instance index is correct
            // filling the entire array with 0 doesn't help, so it looks like the data is not set correctly
            target.setVertexData(instanceData, instanceStream);

            return target;
        }
    };

function ConePrimitive(definition)
{
    Primitive.call(this, definition);
}

ConePrimitive.prototype = Object.create(Primitive.prototype);

ConePrimitive.prototype._generate = function(target, definition)
{
    definition = definition || {};
    var numSegmentsH = definition.numSegmentsH || 1;
    var numSegmentsW = definition.numSegmentsW || 1;
    var radius = definition.radius || 1;
    var height = definition.height || 1;
    var doubleSided = definition.doubleSided === undefined? false : definition.doubleSided;

    var positions = target.positions;
    var uvs = target.uvs;
    var normals = target.normals;
    var indices = target.indices;
    var hi, ci;
    var cx, cy;
    var angle;

    var rcpNumSegmentsW = 1/numSegmentsW;
    var rcpNumSegmentsH = 1/numSegmentsH;

    // sides
    for (hi = 0; hi <= numSegmentsH; ++hi) {
        var rad = (1.0 - hi * rcpNumSegmentsH) * radius;
        var h = (hi*rcpNumSegmentsH - .5)*height;
        for (ci = 0; ci <= numSegmentsW; ++ci) {
            angle = ci * rcpNumSegmentsW * Math.PI * 2;
            var nx = Math.sin(angle);
            var ny = Math.cos(angle);
            cx = nx * rad;
            cy = ny * rad;

            positions.push(cx, h, -cy);
            if (normals) normals.push(nx, 0, -ny);

            if (uvs) uvs.push(1.0 - ci*rcpNumSegmentsW, hi*rcpNumSegmentsH);
        }
    }

    var w = numSegmentsW + 1;
    var base;
    for (ci = 0; ci < numSegmentsW; ++ci) {
        for (hi = 0; hi < numSegmentsH - 1; ++hi) {
            base = ci + hi*w;
            indices.push(base, base + w, base + w + 1);
            indices.push(base, base + w + 1, base + 1);

            if (doubleSided) {
                indices.push(base, base + w + 1, base + w);
                indices.push(base, base + 1, base + w + 1);
            }
        }

        // tip only needs 1 tri
        base = ci + (numSegmentsH - 1)*w;
        indices.push(base, base + w + 1, base + 1);
    }

    // top & bottom
    var indexOffset = positions.length / 3;
    var halfH = height * .5;
    for (ci = 0; ci < numSegmentsW; ++ci) {
        angle = ci * rcpNumSegmentsW * Math.PI * 2;
        var u = Math.sin(angle);
        var v = Math.cos(angle);
        cx = u * radius;
        cy = v * radius;

        u = -u * .5 + .5;
        v = v * .5 + .5;

        positions.push(cx, -halfH, -cy);
        if (normals) normals.push(0, -1, 0);
        if (uvs) uvs.push(u, v);
    }

    for (ci = 1; ci < numSegmentsW - 1; ++ci)
        indices.push(indexOffset, indexOffset + ci, indexOffset + ci + 1);
};

function CylinderPrimitive(definition)
{
    Primitive.call(this, definition);
}

CylinderPrimitive.prototype = Object.create(Primitive.prototype);

/**
 * The alignment dictates which access should be parallel to the sides of the cylinder
 * @type {number}
 */
CylinderPrimitive.ALIGN_X = 1;
CylinderPrimitive.ALIGN_Y = 2;
CylinderPrimitive.ALIGN_Z = 3;

CylinderPrimitive.prototype._generate = function(target, definition)
{
    definition = definition || {};
    var alignment = definition.alignment || CylinderPrimitive.ALIGN_Y;
    var numSegmentsH = definition.numSegmentsH || 1;
    var numSegmentsW = definition.numSegmentsW || 1;
    var radius = definition.radius || 1;
    var height = definition.height || 1;
    var doubleSided = definition.doubleSided === undefined? false : definition.doubleSided;

    var positions = target.positions;
    var uvs = target.uvs;
    var normals = target.normals;
    var indices = target.indices;

    var rcpNumSegmentsW = 1/numSegmentsW;
    var rcpNumSegmentsH = 1/numSegmentsH;
    var hi, ci;
    var cx, cy;
    var angle;

    // sides
    for (hi = 0; hi <= numSegmentsH; ++hi) {
        var h = (hi*rcpNumSegmentsH - .5)*height;
        for (ci = 0; ci <= numSegmentsW; ++ci) {
            angle = ci * rcpNumSegmentsW * Math.PI * 2;
            var nx = Math.sin(angle);
            var ny = Math.cos(angle);
            cx = nx * radius;
            cy = ny * radius;

            switch (alignment) {
                case CylinderPrimitive.ALIGN_X:
                    positions.push(-h, cx, -cy);
                    if (normals) normals.push(0, nx, -ny);
                    break;
                case CylinderPrimitive.ALIGN_Y:
                    positions.push(cx, h, -cy);
                    if (normals) normals.push(nx, 0, -ny);
                    break;
                case CylinderPrimitive.ALIGN_Z:
                    positions.push(cx, cy, h);
                    if (normals) normals.push(nx, ny, 0);
                    break;
                default:
                // nothing
            }

            if (uvs) uvs.push(1.0 - ci*rcpNumSegmentsW, hi*rcpNumSegmentsH);
        }
    }

    for (hi = 0; hi < numSegmentsH; ++hi) {
        for (ci = 0; ci < numSegmentsW; ++ci) {
            var w = numSegmentsW + 1;
            var base = ci + hi*w;

            indices.push(base, base + w, base + w + 1);
            indices.push(base, base + w + 1, base + 1);

            if (doubleSided) {
                indices.push(base, base + w + 1, base + w);
                indices.push(base, base + 1, base + w + 1);
            }
        }
    }


    // top & bottom
    var indexOffset = positions.length / 3;
    var halfH = height * .5;
    for (ci = 0; ci < numSegmentsW; ++ci) {
        angle = ci * rcpNumSegmentsW * Math.PI * 2;
        var u = Math.sin(angle);
        var v = Math.cos(angle);
        cx = u * radius;
        cy = v * radius;

        u = -u * .5 + .5;
        v = v * .5 + .5;

        switch (alignment) {
            case CylinderPrimitive.ALIGN_X:
                positions.push(halfH, cx, -cy);
                positions.push(-halfH, cx, -cy);

                if (normals) {
                    normals.push(1, 0, 0);
                    normals.push(-1, 0, 0);
                }

                if (uvs) {
                    uvs.push(v, 1.0 - u);
                    uvs.push(1.0 - v,  1.0 - u);
                }
                break;

            case CylinderPrimitive.ALIGN_Y:
                positions.push(cx, -halfH, -cy);
                positions.push(cx, halfH, -cy);

                if (normals) {
                    normals.push(0, -1, 0);
                    normals.push(0, 1, 0);
                }

                if (uvs) {
                    uvs.push(u, v);
                    uvs.push(u, 1.0 - v);
                }
                break;

            case CylinderPrimitive.ALIGN_Z:
                positions.push(cx, cy, -halfH);
                positions.push(cx, cy, halfH);

                if (normals) {
                    normals.push(0, 0, -1);
                    normals.push(0, 0, 1);
                }

                if (uvs) {
                    uvs.push(u, v);
                    uvs.push(1.0 - u, v);
                }
                break;
            default:
                // nothing
        }
    }

    for (ci = 1; ci < numSegmentsW - 1; ++ci) {
        var offset = ci << 1;
        indices.push(indexOffset, indexOffset + offset, indexOffset + offset + 2);
        indices.push(indexOffset + 1, indexOffset + offset + 3, indexOffset + offset + 1);
    }
};

/**
 * Provide a definition with the property names to automatically build a primitive. Properties provided in the definition
 * are the same as the setter names (without get/set).
 * @param definition
 * @constructor
 */
function PlanePrimitive(definition)
{
    Primitive.call(this, definition);
}

PlanePrimitive.prototype = Object.create(Primitive.prototype);

PlanePrimitive.ALIGN_XZ = 1;
PlanePrimitive.ALIGN_XY = 2;
PlanePrimitive.ALIGN_YZ = 3;

PlanePrimitive.prototype._generate = function(target, definition)
{
    definition = definition || {};
    var alignment = definition.alignment || PlanePrimitive.ALIGN_XZ;
    var numSegmentsW = definition.numSegmentsW || 1;
    var numSegmentsH = definition.numSegmentsH || 1;
    var width = definition.width || 1;
    var height = definition.height || 1;
    var doubleSided = definition.doubleSided === undefined? false : definition.doubleSided;

    var positions = target.positions;
    var uvs = target.uvs;
    var normals = target.normals;
    var indices = target.indices;

    var rcpNumSegmentsW = 1/numSegmentsW;
    var rcpNumSegmentsH = 1/numSegmentsH;
    var posX = 0, posY = 0, posZ = 0;
    var normalX = 0, normalY = 0, normalZ = 0;
    var uvU = 0, uvV = 0;

    if (alignment === PlanePrimitive.ALIGN_XY)
        normalZ = -1;
    else if (alignment === PlanePrimitive.ALIGN_XZ)
        normalY = 1;
    else
        normalX = 1;

    for (var yi = 0; yi <= numSegmentsH; ++yi) {
        var y = (yi*rcpNumSegmentsH - .5)*height;

        for (var xi = 0; xi <= numSegmentsW; ++xi) {
            var x = (xi*rcpNumSegmentsW - .5)*width;

            if (alignment === PlanePrimitive.ALIGN_XY) {
                posX = x;
                posY = y;
                uvU = 1.0 - xi*rcpNumSegmentsW;
                uvV = yi*rcpNumSegmentsH;
            }
            else if (alignment === PlanePrimitive.ALIGN_XZ) {
                posX = x;
                posZ = y;
                uvU = 1.0 - xi*rcpNumSegmentsW;
                uvV = yi*rcpNumSegmentsH;
            }
            else {
                posY = y;
                posZ = x;
                uvU = 1.0 - xi*rcpNumSegmentsW;
                uvV = yi*rcpNumSegmentsH;
            }

            positions.push(posX, posY, posZ);

            if (normals)
                normals.push(normalX, normalY, normalZ);

            if (uvs)
                uvs.push(uvU, uvV);

            // add vertex with same position, but with inverted normal & tangent
            if (doubleSided) {
                positions.push(posX, posY, posZ);

                if (normals)
                    normals.push(-normalX, -normalY, -normalZ);

                if (uvs)
                    uvs.push(1.0 - uvU, uvV);
            }

            if (xi !== numSegmentsW && yi !== numSegmentsH) {
                var w = numSegmentsW + 1;
                var base = xi + yi*w;
                var mult = doubleSided ? 1 : 0;

                indices.push(base << mult, (base + w) << mult, (base + w + 1) << mult);
                indices.push(base << mult, (base + w + 1) << mult, (base + 1) << mult);

                if(doubleSided) {
                    indices.push(((base + w + 1) << mult) + 1, ((base + w) << mult) + 1, (base << mult) + 1);
                    indices.push(((base + 1) << mult) + 1, ((base + w + 1) << mult) + 1, (base << mult) + 1);
                }
            }
        }
    }
};

function TorusPrimitive(definition)
{
    Primitive.call(this, definition);
}

TorusPrimitive.prototype = Object.create(Primitive.prototype);

TorusPrimitive.ALIGN_XZ = 1;
TorusPrimitive.ALIGN_XY = 2;
TorusPrimitive.ALIGN_YZ = 3;

TorusPrimitive.prototype._generate = function(target, definition)
{
    definition = definition || {};
    var numSegmentsW = definition.numSegmentsW || 15;
    var numSegmentsH = definition.numSegmentsH || 20;
    var radius = definition.radius || .5;
    var tubeRadius = definition.tubeRadius || .1;
    var alignment = definition.alignment || TorusPrimitive.ALIGN_XZ;

    var doubleSided = definition.doubleSided === undefined? false : definition.doubleSided;

    var positions = target.positions;
    var uvs = target.uvs;
    var normals = target.normals;

    var rcpNumSegmentsW = 1/numSegmentsW;
    var rcpNumSegmentsH = 1/numSegmentsH;

    for (var poloidalSegment = 0; poloidalSegment <= numSegmentsH; ++poloidalSegment) {
        var ratioV = poloidalSegment * rcpNumSegmentsH;
        var theta = ratioV * Math.PI * 2.0;
        var px = Math.cos(theta);
        var py = Math.sin(theta);

        for (var toroidalSegment = 0; toroidalSegment <= numSegmentsW; ++toroidalSegment) {
            var ratioU = toroidalSegment * rcpNumSegmentsW;
            var phi = ratioU * Math.PI * 2.0;
            var tx = Math.cos(phi);
            var tz = Math.sin(phi);
            var rad = radius + px  * tubeRadius;

            switch(alignment) {
                case TorusPrimitive.ALIGN_XZ:
                    positions.push(tx * rad, py  * tubeRadius, tz * rad);

                    if (normals)
                        normals.push(tx * px, py, tz * px);

                    break;
                case TorusPrimitive.ALIGN_XY:
                    positions.push(-tx * rad, tz * rad, py  * tubeRadius);

                    if (normals)
                        normals.push(-tx * px, tz * px, py);
                    break;
                case TorusPrimitive.ALIGN_YZ:
                    positions.push(py  * tubeRadius, -tx * rad, tz * rad);

                    if (normals)
                        normals.push(py, -tx * px, tz * px);
                    break;

                default:
                    // nothing

            }

            if (uvs)
                uvs.push(ratioU, 1.0 - ratioV);
        }
    }

    var indices = target.indices;

    for (var polarSegment = 0; polarSegment < numSegmentsH; ++polarSegment) {
        for (var azimuthSegment = 0; azimuthSegment < numSegmentsW; ++azimuthSegment) {
            var w = numSegmentsW + 1;
            var base = azimuthSegment + polarSegment*w;

            indices.push(base, base + w, base + w + 1);
            indices.push(base, base + w + 1, base + 1);

            if (doubleSided) {
                indices.push(base, base + w + 1, base + w);
                indices.push(base, base + 1, base + w + 1);
            }
        }
    }
};

function DeferredAmbientShader()
{
    Shader.call(this);
    var defines = {};

    var vertex = ShaderLibrary.get("copy_vertex.glsl", defines);
    var fragment =
        ShaderLibrary.get("snippets_geometry.glsl", defines) + "\n" +
        ShaderLibrary.get("deferred_ambient_light_fragment.glsl");

    this.init(vertex, fragment);

    var gl = GL.gl;
    var p = this._program;
    gl.useProgram(p);

    this._positionAttributeLocation = gl.getAttribLocation(p, "hx_position");
    this._texCoordAttributeLocation = gl.getAttribLocation(p, "hx_texCoord");

    var albedoSlot = gl.getUniformLocation(p, "hx_gbufferAlbedo");
    var normalDepthSlot = gl.getUniformLocation(p, "hx_gbufferNormalDepth");
    var specularSlot = gl.getUniformLocation(p, "hx_gbufferSpecular");
    var ssaoSlot = gl.getUniformLocation(p, "hx_ssao");

    gl.uniform1i(albedoSlot, 0);
    gl.uniform1i(normalDepthSlot, 1);
    gl.uniform1i(specularSlot, 2);
    gl.uniform1i(ssaoSlot, 3);
}

DeferredAmbientShader.prototype = Object.create(Shader.prototype);

DeferredAmbientShader.prototype.execute = function(renderer)
{
    var gl = GL.gl;

    gl.useProgram(this._program);

    var texs = renderer._gbuffer.textures;
    texs[0].bind(0);
    texs[1].bind(1);
    texs[2].bind(2);
    renderer._ssaoTexture.bind(3);

    this.updatePassRenderState(renderer._camera, renderer);

    GL.setCullMode(CullMode.NONE);

    var rect = RectMesh.DEFAULT;
    rect._vertexBuffers[0].bind();
    rect._indexBuffer.bind();

    gl.vertexAttribPointer(this._positionAttributeLocation, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(this._texCoordAttributeLocation, 2, gl.FLOAT, false, 16, 8);

    GL.enableAttributes(2);

    GL.drawElements(ElementType.TRIANGLES, 6, 0);
};

function Renderer()
{
    this._width = 0;
    this._height = 0;

    this._gammaApplied = false;

    this._copyTextureShader = new CopyChannelsShader("xyzw", true);
    this._applyGamma = new ApplyGammaShader();

    // devices with high resolution (retina etc)
    this._scale = 1.0; // > 1.0? .5 : 1.0;

    this._camera = null;
    this._scene = null;
    this._depthBuffer = this._createDepthBuffer();
    this._hdrBack = new Renderer.HDRBuffers(this._depthBuffer);
    this._hdrFront = new Renderer.HDRBuffers(this._depthBuffer);
    this._renderCollector = new RenderCollector();
    this._gbuffer = new GBuffer(this._depthBuffer);
    this._ssaoTexture = this._createDummySSAOTexture();
    this._aoEffect = null;
    this._backgroundColor = Color.BLACK.clone();
    //this._previousViewProjection = new Matrix4x4();
    this._debugMode = Renderer.DebugRenderMode.NONE;
    this._renderAmbientShader = new DeferredAmbientShader();
}

Renderer.DebugRenderMode = {
    NONE: 0,
    SSAO: 1,
    GBUFFER_ALBEDO: 2,
    // TODO: Put back normal, depth, roughness, metallicness, normalSpecular back in
    GBUFFER_NORMAL_DEPTH: 3,
    GBUFFER_SPECULAR: 4,
    LIGHT_ACCUMULATION: 5
};

Renderer.HDRBuffers = function(depthBuffer)
{
    this.texture = new Texture2D();
    this.texture.filter = TextureFilter.BILINEAR_NOMIP;
    this.texture.wrapMode = TextureWrapMode.CLAMP;
    this.fbo = new FrameBuffer(this.texture);
    this.fboDepth = new FrameBuffer(this.texture, depthBuffer);
};

Renderer.HDRBuffers.prototype =
{
    dispose: function()
    {
        this.texture.dispose();
        this.fbo.dispose();
        this.fboDepth.dispose();
    },

    resize: function(width, height)
    {
        this.texture.initEmpty(width, height, TextureFormat.RGBA, _HX_.HDR_FORMAT);
        this.fbo.init();
        this.fboDepth.init();
    }
};

Renderer.prototype =
{
    get debugMode()
    {
        return this._debugMode;
    },

    set debugMode(value)
    {
        this._debugMode = value;
    },

    get backgroundColor()
    {
        return this._backgroundColor;
    },

    set backgroundColor(value)
    {
        this._backgroundColor = new Color(value);
    },

    get scale()
    {
        return this._scale;
    },

    set scale(value)
    {
        this._scale = value;
    },

    get camera()
    {
        return this._camera;
    },

    get ambientOcclusion()
    {
        return this._aoEffect;
    },

    set ambientOcclusion(value)
    {
        this._aoEffect = value;
        if (!this._aoEffect) this._ssaoTexture = this._createDummySSAOTexture();
    },

    /*get localReflections()
    {
        return this._ssrEffect;
    },

    set localReflections(value)
    {
        this._ssrEffect = value;
        this._ssrTexture = this._ssrEffect? this._ssrEffect.getSSRTexture() : null;
    },*/

    /**
     * It's not recommended changing render targets if they have different sizes (so splitscreen should be fine). Otherwise, use different renderer instances.
     * @param camera
     * @param scene
     * @param dt
     * @param renderTarget (optional)
     */
    render: function (camera, scene, dt, renderTarget)
    {
        this._gammaApplied = _HX_.GAMMA_CORRECT_LIGHTS;
        this._camera = camera;
        this._scene = scene;


        this._updateSize(renderTarget);

        camera._setRenderTargetResolution(this._width, this._height);
        this._renderCollector.collect(camera, scene);

        this._ambientColor = this._renderCollector._ambientColor;

        this._renderShadowCasters();

        var opaqueList = this._renderCollector.getOpaqueRenderList();
        var transparentList = this._renderCollector.getTransparentRenderList();

        GL.setClearColor(Color.BLACK);

        GL.setDepthMask(true);
        this._renderGBuffer(opaqueList);
        this._renderAO();
        this._renderDeferredLighting(opaqueList);

        if (this._debugMode !== Renderer.DebugRenderMode.LIGHT_ACCUMULATION) {
            GL.setRenderTarget(this._hdrFront.fboDepth);
            GL.setClearColor(this._backgroundColor);
            GL.clear();

            this._renderForwardLit(opaqueList);

            // THIS IS EXTREMELY INEFFICIENT ON SOME (TILED HIERARCHY) PLATFORMS
            if (this._renderCollector.needsBackbuffer)
                this._copyToBackBuffer();

            this._renderForwardLit(transparentList);

            this._swapHDRFrontAndBack();
            this._renderEffects(dt);
            //this._previousViewProjection.copyFrom(this._camera.viewProjectionMatrix);
        }

        this._renderToScreen(renderTarget);

        GL.setBlendState();
        GL.setDepthMask(true);
    },

    _renderForwardLit: function(list)
    {
        var lights = this._renderCollector.getLights();
        var numLights = lights.length;

        this._renderPass(MaterialPass.BASE_PASS, list);


        for (var i = 0; i < numLights; ++i) {
            var light = lights[i];

            // I don't like type checking, but lighting support is such a core thing...
            // maybe we can work in a more plug-in like light system
            if (light instanceof LightProbe) {
                this._renderPass(MaterialPass.LIGHT_PROBE_PASS, list, light);
            }
            else if (light instanceof DirectionalLight) {
                // if non-global, do intersection tests
                var passType = light.castShadows? MaterialPass.DIR_LIGHT_SHADOW_PASS : MaterialPass.DIR_LIGHT_PASS;

                // PASS IN LIGHT AS DATA, so the material can update it
                this._renderPass(passType, list, light);
            }
            else if (light instanceof PointLight) {
                // cannot just use renderPass, need to do intersection tests
                this._renderLightPassIfIntersects(light, MaterialPass.POINT_LIGHT_PASS, list);
            }
        }
    },

    _renderLightPassIfIntersects: function(light, passType, renderList)
    {
        var lightBound = light.worldBounds;
        var len = renderList.length;
        for (var r = 0; r < len; ++r) {
            var renderItem = renderList[r];
            var material = renderItem.material;
            var pass = material.getPass(passType);
            if (!pass) continue;

            if (lightBound.intersectsBound(renderItem.worldBounds)) {
                var meshInstance = renderItem.meshInstance;
                pass.updatePassRenderState(renderItem.camera, this, light);
                pass.updateInstanceRenderState(renderItem.camera, renderItem, light);
                meshInstance.updateRenderState(passType);
                GL.drawElements(pass._elementType, meshInstance._mesh.numIndices, 0);
            }
        }
    },

    _renderGBuffer: function(list)
    {
        if (this._renderCollector.needsGBuffer) {
            if (capabilities.GBUFFER_MRT) {
                GL.setRenderTarget(this._gbuffer.mrt);
                // this is just so the linear depth value will be correct
                GL.setClearColor(Color.BLUE);
                GL.clear();
                this._renderPass(MaterialPass.GBUFFER_PASS, list);
            }
            else {
                this._renderGBufferPlane(list, GBuffer.ALBEDO, MaterialPass.GBUFFER_ALBEDO_PASS, Color.BLACK);
                this._renderGBufferPlane(list, GBuffer.NORMAL_DEPTH, MaterialPass.GBUFFER_NORMAL_DEPTH_PASS, Color.BLUE);
                this._renderGBufferPlane(list, GBuffer.SPECULAR, MaterialPass.GBUFFER_SPECULAR_PASS, Color.BLACK);
            }
        }
        else if (this._renderCollector.needsNormalDepth || this._aoEffect) {
            // otherwise, we might just need normalDepth
            this._renderGBufferPlane(list, GBuffer.NORMAL_DEPTH, MaterialPass.GBUFFER_NORMAL_DEPTH_PASS, Color.BLUE);
        }

        GL.setClearColor(Color.BLACK);
    },

    _renderGBufferPlane: function(list, plane, passType, clearColor)
    {
        GL.setRenderTarget(this._gbuffer.fbos[plane]);
        // furthest depth and alpha must be 1, the rest 0
        GL.setClearColor(clearColor);
        GL.clear();
        this._renderPass(passType, list);
    },

    _renderDeferredLighting: function()
    {
        if (!this._renderCollector._needsGBuffer) return;
        var lights = this._renderCollector.getLights();
        var numLights = lights.length;

        // for some reason, this doesn't get cleared?
        GL.setRenderTarget(this._hdrFront.fbo);
        GL.clear();
        GL.setBlendState(BlendState.ADD);
        GL.setDepthTest(Comparison.DISABLED);

        var ambient =  this._ambientColor;
        if (ambient.r !== 0 || ambient.g !== 0 || ambient.b !== 0) {
            this._renderAmbientShader.execute(this, ambient);
        }

        for (var i = 0; i < numLights; ++i) {
            lights[i].renderDeferredLighting(this);
        }

        this._swapHDRFrontAndBack();
        GL.setBlendState();
    },

    _renderAO: function()
    {
        if (this._aoEffect) {
            this._ssaoTexture = this._aoEffect.getAOTexture();
            this._aoEffect.render(this, 0);
        }
    },

    _renderShadowCasters: function ()
    {
        var casters = this._renderCollector._shadowCasters;
        var len = casters.length;

        for (var i = 0; i < len; ++i)
            casters[i].render(this._camera, this._scene);
    },

    _renderEffect: function (effect, dt)
    {
        this._gammaApplied = this._gammaApplied || effect._outputsGamma;
        effect.render(this, dt);
    },

    _renderPass: function (passType, renderItems, data)
    {
        RenderUtils.renderPass(this, passType, renderItems, data);
    },

    _renderToScreen: function (renderTarget)
    {
        GL.setRenderTarget(renderTarget);
        GL.clear();

        if (this._debugMode) {
            var tex;
            switch (this._debugMode) {
                case Renderer.DebugRenderMode.GBUFFER_ALBEDO:
                    tex = this._gbuffer.textures[0];
                    break;
                case Renderer.DebugRenderMode.GBUFFER_NORMAL_DEPTH:
                    tex = this._gbuffer.textures[1];
                    break;
                case Renderer.DebugRenderMode.GBUFFER_SPECULAR:
                    tex = this._gbuffer.textures[2];
                    break;
                case Renderer.DebugRenderMode.SSAO:
                    tex = this._ssaoTexture;
                    break;
                case Renderer.DebugRenderMode.LIGHT_ACCUMULATION:
                    tex = this._hdrBack.texture;
                    break;
                default:
                    // nothing
            }
            this._copyTextureShader.execute(RectMesh.DEFAULT, tex);
            return;
        }

        // TODO: render directly to screen if last post process effect?
        if (this._gammaApplied)
            this._copyTextureShader.execute(RectMesh.DEFAULT, this._hdrBack.texture);
        else
            this._applyGamma.execute(RectMesh.DEFAULT, this._hdrBack.texture);
    },

    _renderEffects: function (dt)
    {
        var effects = this._renderCollector._effects;
        if (!effects) return;

        var len = effects.length;

        for (var i = 0; i < len; ++i) {
            var effect = effects[i];
            if (effect.isSupported()) {
                this._renderEffect(effect, dt);
                this._swapHDRFrontAndBack();
            }
        }
    },

    _updateSize: function (renderTarget)
    {
        var width, height;
        if (renderTarget) {
            width = renderTarget.width;
            height = renderTarget.height;
        }
        else {
            width = Math.floor(META.TARGET_CANVAS.width * this._scale);
            height = Math.floor(META.TARGET_CANVAS.height * this._scale);
        }
        if (this._width !== width || this._height !== height) {
            this._width = width;
            this._height = height;
            this._depthBuffer.init(this._width, this._height, true);
            this._hdrBack.resize(this._width, this._height);
            this._hdrFront.resize(this._width, this._height);
            this._gbuffer.resize(this._width, this._height);
        }
    },

    // allows effects to ping pong on the renderer's own buffers
    _swapHDRFrontAndBack: function()
    {
        var tmp = this._hdrBack;
        this._hdrBack = this._hdrFront;
        this._hdrFront = tmp;
    },

    _createDepthBuffer: function()
    {
        /*if (HX.EXT_DEPTH_TEXTURE) {
            this._depthBuffer = new HX.Texture2D();
            this._depthBuffer.filter = HX.TextureFilter.BILINEAR_NOMIP;
            this._depthBuffer.wrapMode = HX.TextureWrapMode.CLAMP;
        }
        else {*/
            return new WriteOnlyDepthBuffer();
    },

    _createDummySSAOTexture: function()
    {
        var data = new Uint8Array([0xff, 0xff, 0xff, 0xff]);
        var tex = new Texture2D();
        tex.filter = TextureFilter.NEAREST_NOMIP;
        tex.uploadData(data, 1, 1, true);
        return tex;
    },

    _copyToBackBuffer: function()
    {
        GL.setRenderTarget(this._hdrBack.fbo);
        GL.clear();
        this._copyTextureShader.execute(RectMesh.DEFAULT, this._hdrFront.texture);
        GL.setRenderTarget(this._hdrFront.fboDepth);
        // DO NOT CLEAR. This can be very slow on tiled gpu architectures such as PowerVR
    }
};

/**
 * MultiRenderer is a renderer for multiple viewports
 * @constructor
 */
function View(scene, camera, xRatio, yRatio, widthRatio, heightRatio)
{
    this.scene = scene;
    this.camera = camera;
    this.viewport = new Rect();
    this._renderer = null;
    this._texture = null;
    this._fbo = null;
    this.xRatio = xRatio || 0;
    this.yRatio = yRatio || 0;
    this.widthRatio = widthRatio || 1;
    this.heightRatio = heightRatio || 1;
}

function MultiRenderer()
{
    this._views = [];
}

MultiRenderer.prototype =
{
    addView: function (view)
    {
        view._renderer = new Renderer();
        view._texture = new Texture2D();
        view._texture.filter = TextureFilter.BILINEAR_NOMIP;
        view._texture.wrapMode = TextureWrapMode.CLAMP;
        view._fbo = new FrameBuffer(view._texture);
        this._views.push(view);
    },

    removeView: function (view)
    {
        view._fbo.dispose();
        view._texture.dispose();
        view._renderer.dispose();
        var index = this._views.indexOf(view);
        this._views.splice(index, 1);
    },

    render: function (dt, renderTarget)
    {
        var screenWidth = META.TARGET_CANVAS.clientWidth;
        var screenHeight = META.TARGET_CANVAS.clientHeight;
        var numViews = this._views.length;
        for (var i = 0; i < numViews; ++i) {
            var view = this._views[i];
            var w = Math.floor(screenWidth * view.widthRatio);
            var h = Math.floor(screenHeight * view.heightRatio);

            if (view._texture.width !== w || view._texture.height !== h) {
                view._texture.initEmpty(w, h);
                view._fbo.init();
            }

            view._renderer.render(view.camera, view.scene, dt, view._fbo);
        }

        GL.setRenderTarget(renderTarget);
        GL.clear();

        var viewport = new Rect();

        for (i = 0; i < numViews; ++i) {
            view = this._views[i];
            viewport.x = Math.floor(view.xRatio * screenWidth);
            viewport.y = Math.floor((1.0 - view.yRatio - view.heightRatio) * screenHeight);
            viewport.width = view._texture.width;
            viewport.height = view._texture.height;
            GL.setViewport(viewport);
            DEFAULTS.COPY_SHADER.execute(RectMesh.DEFAULT, view._texture);
        }
    }
};

function StencilState(reference, comparison, onStencilFail, onDepthFail, onPass, readMask, writeMask)
{
    this.enabled = true;
    this.reference = reference || 0;
    this.comparison = comparison || Comparison.ALWAYS;
    this.onStencilFail = onStencilFail || StencilOp.KEEP;
    this.onDepthFail = onDepthFail || StencilOp.KEEP;
    this.onPass = onPass || StencilOp.KEEP;
    this.readMask = readMask === undefined || readMask === null? 0xffffffff : readMask;
    this.writeMask = writeMask === undefined || writeMask === null? 0xffffffff: writeMask;
}

var ImageData =
{
    getFromImage: function(image)
    {
        var canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        var context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        return canvas.getImageData(0, 0, canvas.width, canvas.height);
    }
};

/**
 *
 * @param numFrames The amount of frames to average
 * @constructor
 */
function FPSCounter(numFrames)
{
    this._numFrames = numFrames || 1;
    this._frames = [ ];
    this._maxFPS = undefined;
    this._minFPS = undefined;
    this._currentFPS = 0;
    this._averageFPS = 0;
    this._runningSum = 0;

    for (var i = 0; i < this._numFrames; ++i)
        this._frames[i] = 0;

    this._index = 0;
}

FPSCounter.prototype =
{
    /**
     * Updates the counter with a new frame time
     * @param dt The time in milliseconds for the last frame
     */
    update: function(dt)
    {
        this._currentFPS = 1000 / dt;

        this._runningSum -= this._frames[this._index];
        this._runningSum += this._currentFPS;
        this._averageFPS = this._runningSum / this._numFrames;
        this._frames[this._index++] = this._currentFPS;

        if (this._index === this._numFrames) this._index = 0;

        if (this._maxFPS === undefined || this._currentFPS > this._maxFPS)
            this._maxFPS = this._currentFPS;

        if (this._minFPS === undefined || this._currentFPS < this._minFPS)
            this._minFPS = this._currentFPS;


    },

    get lastFrameFPS()
    {
        return Math.round(this._currentFPS);
    },

    get averageFPS()
    {
        return Math.round(this._averageFPS);
    },

    get maxFPS()
    {
        return Math.round(this._maxFPS);
    },

    get minFPS()
    {
        return Math.round(this._minFPS);
    },

    reset: function()
    {
        this._maxFPS = undefined;
        this._minFPS = undefined;
    }
};

/**
 * @constructor
 */
function StatsDisplay(container)
{
    this._fpsCounter = new FPSCounter(30);

    this._div = document.createElement("div");
    this._div.style.position = "absolute";
    this._div.style.left = "5px";
    this._div.style.top = "5px";
    this._div.style.width = "100px";
    //this._div.style.height = "100px";
    this._div.style.background = "rgba(0, 0, 0, .5)";
    this._div.style.padding = "10px 15px 10px 15px";
    this._div.style.color = "#ffffff";
    this._div.style.fontFamily = '"Lucida Console", Monaco, monospace';
    this._div.style.fontSize = "small";

    container = container || document.getElementsByTagName("body")[0];
    container.appendChild(this._div);

    onPreFrame.bind(this._update, this);
}

StatsDisplay.prototype =
{
    remove: function()
    {
        this._div.parentNode.removeChild(this._div);
    },

    _update: function(dt)
    {
        this._fpsCounter.update(dt);
        this._div.innerHTML =
            "FPS: " + this._fpsCounter.averageFPS + "<br/>" +
            "Draws: " + _glStats.numDrawCalls + "<br/>" +
            "Tris: " + _glStats.numTriangles + "<br/>" +
            "Clears: " + _glStats.numClears + "<br/><br/>" +

            "<div style='font-size:x-small; width:100%; text-align:right;'>"+
            "Helix " + META.VERSION + "<br/>" +
            "</div>";
    }
};

// this is generated by gulp

exports.ShaderLibrary = ShaderLibrary;
exports.init = init;
exports.start = start;
exports.stop = stop;
exports.META = META;
exports.capabilities = capabilities;
exports.onPreFrame = onPreFrame;
exports.onFrame = onFrame;
exports.TextureFilter = TextureFilter;
exports.CullMode = CullMode;
exports.StencilOp = StencilOp;
exports.Comparison = Comparison;
exports.ElementType = ElementType;
exports.BlendFactor = BlendFactor;
exports.BlendOperation = BlendOperation;
exports.ClearMask = ClearMask;
exports.InitOptions = InitOptions;
exports.TextureFormat = TextureFormat;
exports.DataType = DataType;
exports.Float2 = Float2;
exports.Float4 = Float4;
exports.Gaussian = Gaussian;
exports.CenteredGaussianCurve = CenteredGaussianCurve;
exports.MathX = MathX;
exports.Matrix4x4 = Matrix4x4;
exports.PlaneSide = PlaneSide;
exports.PoissonDisk = PoissonDisk;
exports.PoissonSphere = PoissonSphere;
exports.Quaternion = Quaternion;
exports.Transform = Transform;
exports.BoundingAABB = BoundingAABB;
exports.BoundingSphere = BoundingSphere;
exports.SceneNode = SceneNode;
exports.Scene = Scene;
exports.SceneVisitor = SceneVisitor;
exports.Skybox = Skybox;
exports.Terrain = Terrain;
exports.Entity = Entity;
exports.Component = Component;
exports.CompositeComponent = CompositeComponent;
exports.KeyFrame = KeyFrame;
exports.AnimationClip = AnimationClip;
exports.AnimationPlayhead = AnimationPlayhead;
exports.MorphAnimation = MorphAnimation;
exports.MorphData = MorphData;
exports.MorphPose = MorphPose;
exports.MorphTarget = MorphTarget;
exports.Skeleton = Skeleton;
exports.SkeletonAnimation = SkeletonAnimation;
exports.SkeletonBinaryLerpNode = SkeletonBinaryLerpNode;
exports.SkeletonBlendNode = SkeletonBlendNode;
exports.SkeletonBlendTree = SkeletonBlendTree;
exports.SkeletonClipNode = SkeletonClipNode;
exports.SkeletonFreePoseNode = SkeletonFreePoseNode;
exports.SkeletonJoint = SkeletonJoint;
exports.SkeletonJointPose = SkeletonJointPose;
exports.SkeletonPose = SkeletonPose;
exports.SkeletonXFadeNode = SkeletonXFadeNode;
exports.Camera = Camera;
exports.Frustum = Frustum;
exports.PerspectiveCamera = PerspectiveCamera;
exports.OrthographicOffCenterCamera = OrthographicOffCenterCamera;
exports.FloatController = FloatController;
exports.OrbitController = OrbitController;
exports.Color = Color;
exports.DataStream = DataStream;
exports.GL = GL;
exports.Signal = Signal;
exports.Bloom = Bloom;
exports.Blur = Blur;
exports.CopyTexturePass = CopyTexturePass;
exports.Effect = Effect;
exports.EffectPass = EffectPass;
exports.FilmicToneMapping = FilmicToneMapping;
exports.Fog = Fog;
exports.FXAA = FXAA;
exports.GaussianBlurPass = GaussianBlurPass;
exports.HBAO = HBAO;
exports.SSAO = SSAO;
exports.ReinhardToneMapping = ReinhardToneMapping;
exports.AssetLibrary = AssetLibrary;
exports.AssetLoader = AssetLoader;
exports.URLLoader = URLLoader;
exports.HCM = HCM;
exports.HMT = HMT;
exports.Importer = Importer;
exports.JPG_EQUIRECTANGULAR = JPG_EQUIRECTANGULAR;
exports.PNG_EQUIRECTANGULAR = PNG_EQUIRECTANGULAR;
exports.JPG_HEIGHTMAP = JPG_HEIGHTMAP;
exports.PNG_HEIGHTMAP = PNG_HEIGHTMAP;
exports.JPG = JPG;
exports.PNG = PNG;
exports.AmbientLight = AmbientLight;
exports.DirectionalLight = DirectionalLight;
exports.ExponentialDirectionalShadowFilter = ExponentialDirectionalShadowFilter;
exports.HardDirectionalShadowFilter = HardDirectionalShadowFilter;
exports.Light = Light;
exports.LightProbe = LightProbe;
exports.PCFDirectionalShadowFilter = PCFDirectionalShadowFilter;
exports.PointLight = PointLight;
exports.ShadowFilter = ShadowFilter;
exports.VarianceDirectionalShadowFilter = VarianceDirectionalShadowFilter;
exports.MaterialPass = MaterialPass;
exports.Material = Material;
exports.BasicMaterial = BasicMaterial;
exports.SkyboxMaterial = SkyboxMaterial;
exports.ModelInstance = ModelInstance;
exports.Model = Model;
exports.Mesh = Mesh;
exports.MeshBatch = MeshBatch;
exports.MeshData = MeshData;
exports.MeshInstance = MeshInstance;
exports.ModelData = ModelData;
exports.SpherePrimitive = SpherePrimitive;
exports.BoxPrimitive = BoxPrimitive;
exports.Primitive = Primitive;
exports.ConePrimitive = ConePrimitive;
exports.CylinderPrimitive = CylinderPrimitive;
exports.PlanePrimitive = PlanePrimitive;
exports.TorusPrimitive = TorusPrimitive;
exports.BlendState = BlendState;
exports.Renderer = Renderer;
exports.LightingModel = LightingModel;
exports.View = View;
exports.MultiRenderer = MultiRenderer;
exports.StencilState = StencilState;
exports.Texture2D = Texture2D;
exports.TextureCube = TextureCube;
exports.TextureUtils = TextureUtils;
exports.WriteOnlyDepthBuffer = WriteOnlyDepthBuffer;
exports.EquirectangularTexture = EquirectangularTexture;
exports.HeightMap = HeightMap;
exports.ImageData = ImageData;
exports.NormalTangentGenerator = NormalTangentGenerator;
exports.StatsDisplay = StatsDisplay;

Object.defineProperty(exports, '__esModule', { value: true });

})));
