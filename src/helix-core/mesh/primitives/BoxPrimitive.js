import {Primitive} from "./Primitive";

/**
 * @classdesc
 * BoxPrimitive provides a primitive box {@linkcode Model}.
 *
 * @constructor
 * @param definition An object containing the following (optional) parameters:
 * <ul>
 *     <li>numSegmentsW: The amount of segments along the X-axis</li>
 *     <li>numSegmentsH: The amount of segments along the Y-axis</li>
 *     <li>numSegmentsD: The amount of segments along the Z-axis</li>
 *     <li>width: The width of the box</li>
 *     <li>height: The height of the box</li>
 *     <li>depth: The depth of the box</li>
 *     <li>invert: Whether or not the faces should point inwards</li>
 *     <li>doubleSided: Whether or not the faces should point both ways</li>
 * </ul>
 *
 * @extends Primitive
 *
 * @author derschmale <http://www.derschmale.com>
 */
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
            positions.push(x*flipSign, halfD*flipSign, y*flipSign);
            positions.push(-x*flipSign, -halfD*flipSign, y*flipSign);

            if (normals) {
                normals.push(0, 1, 0);
                normals.push(0, -1, 0);
            }

            if (uvs) {
                uvs.push(ratioU, 1.0 - ratioV);
                uvs.push(ratioU, 1.0 - ratioV);
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
            positions.push(-halfW, z*flipSign, y);
            positions.push(halfW, -z*flipSign, y);

            if (normals) {
                normals.push(-flipSign, 0, 0);
                normals.push(flipSign, 0, 0);
            }

            if (uvs) {
                uvs.push(ratioU, 1.0 - ratioV);
                uvs.push(ratioU, 1.0 - ratioV);
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
            positions.push(x, -z*flipSign, halfH);
            positions.push(x, z*flipSign, -halfH);

            if (normals) {
                normals.push(0, 0, flipSign);
                normals.push(0, 0, -flipSign);
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

                indices.push(i0, i2, i1);
                indices.push(i0, i1, i3);

                indices.push(i0 | 1, i2 | 1, i1 | 1);
                indices.push(i0 | 1, i1 | 1, i3 | 1);
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

export { BoxPrimitive };