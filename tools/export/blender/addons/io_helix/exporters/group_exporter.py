from ..constants import ObjectType, PropertyType
from . import object_exporter
from .. import data, object_map

def write(group, file, scene):
    group_id = data.start_object(file, ObjectType.SCENE_NODE)
    data.write_vector_prop(file, PropertyType.POSITION, group.dupli_offset)
    data.end_object(file)

    for child in group.objects:
        object_id = object_exporter.write(child, file, scene)

        if object_id is None:
            continue

        child_id = object_map.get_mapped_indices(child)[0]

        # meta 1 = proxied link
        object_map.link(group_id, child_id, 1)

    return group_id